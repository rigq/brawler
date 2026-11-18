// Attack state machine and where the hitbox is.
// Light: startup → active → recovery. Heavy: charge (while held) → startup → active → recovery.

import {
  HEAVY_RELEASE_STARTUP_TICKS,
  AIR_HEAVY_UP_BOOST,
  RECOVERY_TILT, HEAVY_MAX_CHARGE_TICKS, WHIFF_STUMBLE_SPEED, type AttackData, type AttackId } from '../constants.ts';
import { characterOf } from '../characters/index.ts';
import type { PlayerInput } from '../input.ts';
import type { Rect } from '../math/rect.ts';
import { endDodge } from '../sim/dodge.ts';
import type { Player } from '../sim/player.ts';

export type AttackPhase = 'none' | 'charge' | 'startup' | 'active' | 'recovery';

export interface AttackState {
  /** Which attack is running, or 'none'. */
  attackId: AttackId | 'none';
  /** Heavy only: still holding the button, before startup begins. */
  attackCharging: boolean;
  /** Heavy only: ticks spent charging (0..HEAVY_MAX_CHARGE_TICKS). Scales damage and knockback. */
  attackChargeTicks: number;
  /** Ticks since startup began (0 on its first tick). Stays 0 while charging. */
  attackTick: number;
  /** Bit i set = this attack already hit player i (each attack hits a target once). */
  attackHitMask: number;
  /** Light was pressed again during this attack: chain into the next one if it has a `chainTo`. */
  attackQueued: boolean;
  /** Button states in the previous step, to detect fresh presses. */
  lightHeld: boolean;
  /** Grab button state in the previous step (fresh presses only). */
  grabHeld: boolean;
  heavyHeld: boolean;
  specialHeld: boolean;
  /** Ticks until a projectile special can be used again. */
  specialCooldown: number;
  /** Gliding down after a parachute special: no attacks, air jumps or dodges until landing. */
  parachuting: boolean;
}

export function createAttackState(): AttackState {
  return {
    attackId: 'none',
    attackCharging: false,
    attackChargeTicks: 0,
    attackTick: 0,
    attackHitMask: 0,
    attackQueued: false,
    lightHeld: false,
    grabHeld: false,
    heavyHeld: false,
    specialHeld: false,
    specialCooldown: 0,
    parachuting: false,
  };
}

export function isAttacking(player: Player): boolean {
  return player.attackId !== 'none';
}

/** Runs once at the start of every step: charges, advances, chains, ends or starts an attack. */
export function updateAttack(player: Player, input: PlayerInput): void {
  const lightPressed = input.light && !player.lightHeld;
  const heavyPressed = input.heavy && !player.heavyHeld;
  const specialPressed = input.special && !player.specialHeld;
  const grabPressed = input.grab && !player.grabHeld;
  player.lightHeld = input.light;
  player.grabHeld = input.grab;
  player.heavyHeld = input.heavy;
  player.specialHeld = input.special;
  if (player.specialCooldown > 0) player.specialCooldown -= 1;

  if (player.attackId !== 'none') {
    if (lightPressed) player.attackQueued = true;
    advanceAttack(player, input);
    return;
  }
  if (player.lagTicks > 0 || player.parachuting) return;
  if (player.shielding) {
    // The one attack you can do from the shield.
    if ((lightPressed || grabPressed) && player.shieldStunTicks === 0) {
      player.shielding = false;
      startAttack(player, input, 'grab');
    }
    return;
  }
  // Attacks can start from a dash (it hands over its speed), not from other dodges.
  const dodgeAllows = player.dodgeKind === 'none' || player.dodgeKind === 'dash';
  if (!dodgeAllows || player.hitstunTicks > 0) return;
  if (grabPressed && player.grounded) startAttack(player, input, 'grab');
  else if (lightPressed) startAttack(player, input, chooseLight(player, input));
  else if (heavyPressed) startAttack(player, input, chooseHeavy(input));
  else if (specialPressed) startSpecial(player, input);
}

/** Up = up special (only while the recovery is unused); otherwise neutral, if its cooldown and the ground allow. */
function startSpecial(player: Player, input: PlayerInput): void {
  const id: AttackId = input.up ? 'specialUp' : 'specialNeutral';
  const data = attackData(player, id);
  if (data.groundOnly && !player.grounded) return;
  if (data.cooldownTicks && player.specialCooldown > 0) return;
  const recovery = data.launchSpeed !== undefined || data.teleportToFlag === true;
  if (recovery && !player.recoveryAvailable) return;
  startAttack(player, input, id);
  // A projectile special starts its cooldown when it fires (see fireIfReady); the rest, now.
  if (!data.projectile && data.cooldownTicks) player.specialCooldown = data.cooldownTicks;
  if (data.teleportToFlag) player.recoveryAvailable = false;
}

export function attackPhase(player: Player): AttackPhase {
  if (player.attackId === 'none') return 'none';
  if (player.attackCharging) return 'charge';
  const data = attackData(player, player.attackId);
  if (player.attackTick < data.startup) return 'startup';
  if (player.attackTick < data.startup + data.active) return 'active';
  return 'recovery';
}

/** Heavy charge from 0 (tapped) to 1 (fully charged). */
export function attackCharge(player: Player): number {
  return player.attackChargeTicks / HEAVY_MAX_CHARGE_TICKS;
}

/**
 * The attack's hitbox in world space if the player stood at (x, y), or null
 * if no attack is running. The renderer passes interpolated coordinates.
 */
export function attackBoxAt(player: Player, x: number, y: number): Rect | null {
  if (player.attackId === 'none') return null;
  const box = attackData(player, player.attackId).box;
  const offsetX = player.facing === 1 ? box.x : player.width - box.x - box.width;
  return { x: x + offsetX, y: y + box.y, width: box.width, height: box.height };
}

/** The hitbox that can hit right now (active phase only), or null. Empty boxes (specials that only fire) never hit. */
export function activeHitbox(player: Player): Rect | null {
  const box = attackPhase(player) === 'active' ? attackBoxAt(player, player.x, player.y) : null;
  return box && box.width > 0 && box.height > 0 ? box : null;
}

/** Where the player can be hit. For now, the whole body box. */
export function hurtbox(player: Player): Rect {
  return { x: player.x, y: player.y, width: player.width, height: player.height };
}

/** This attack as this player's character does it. */
export function attackData(player: { characterId: string }, id: AttackId): AttackData {
  return characterOf(player).attacks[id];
}

/** Light: shield button held → grab; during a dash → dash attack; in the air → aerial; up/down → tilts; no direction → jab; else side tilt. */
function chooseLight(player: Player, input: PlayerInput): AttackId {
  if (player.grounded && input.dodge) return 'grab';
  if (player.dodgeKind === 'dash') return 'dash';
  if (!player.grounded) return chooseAerial(player, input);
  if (input.up) return 'lightUp';
  if (input.down) return 'lightDown';
  if (player.grounded && input.left === input.right) return 'jab1';
  return 'lightSide';
}

/** Up and down win over sideways; sideways is relative to where the player faces. */
function chooseAerial(player: Player, input: PlayerInput): AttackId {
  if (input.up) return 'airUp';
  if (input.down) return 'airDown';
  const dirX = Number(input.right) - Number(input.left);
  if (dirX === 0) return 'airNeutral';
  return dirX === player.facing ? 'airForward' : 'airBack';
}

function chooseHeavy(input: PlayerInput): AttackId {
  return input.up ? 'heavyUp' : input.down ? 'heavyDown' : 'heavySide';
}

function startAttack(player: Player, input: PlayerInput, id: AttackId): void {
  const data = attackData(player, id);
  const dirX = Number(input.right) - Number(input.left);
  // Aerials keep the facing: holding backwards means back aerial, not turning around.
  if (dirX !== 0 && data.landingLag === undefined) player.facing = dirX === 1 ? 1 : -1;
  // Attacking out of a dash keeps its speed: dash attack, or a sliding heavy.
  endDodge(player);

  // Heavies charge only on the ground; in the air they fire at once.
  player.attackCharging = data.heavy && player.grounded;
  if (data.launchSpeed !== undefined) launchRecovery(player, data.launchSpeed, dirX);
  if (id === 'heavyUp' && !player.grounded) airHeavyUpBoost(player, dirX);
  beginAttack(player, id);
  // Respawn invulnerability is for getting back in, not for attacking safely.
  player.invulnTicks = 0;
}

/** The attack from a ledge: climbs up swinging forward. */
export function startLedgeAttack(player: Player): void {
  beginAttack(player, 'lightSide');
  player.invulnTicks = 0;
}

/** Resets the per-attack state for a new attack (fresh start or chained). */
function beginAttack(player: Player, id: AttackId): void {
  player.attackId = id;
  player.attackChargeTicks = 0;
  player.attackTick = 0;
  player.attackHitMask = 0;
  player.attackQueued = false;
}

/** The "recovery": pushes you up, once per time in the air, to get back to the stage. */
/** Up heavy in the air: a smaller lift than the up special, once per time in the air (see AIR_HEAVY_UP_BOOST). */
function airHeavyUpBoost(player: Player, dirX: number): void {
  if (!player.airBoostAvailable) return;
  player.airBoostAvailable = false;
  player.vx = dirX !== 0 ? dirX * AIR_HEAVY_UP_BOOST * RECOVERY_TILT.x : player.vx;
  player.vy = -AIR_HEAVY_UP_BOOST * (dirX !== 0 ? RECOVERY_TILT.y : 1);
  player.fastFalling = false;
}

/** Straight up, or tilted towards `dirX` (-1, 0, 1) if a direction is held: that is how you get back from the side. */
function launchRecovery(player: Player, speed: number, dirX: number): void {
  if (!player.recoveryAvailable) return;
  player.recoveryAvailable = false;
  if (dirX !== 0) {
    player.vx = dirX * speed * RECOVERY_TILT.x;
    player.vy = -speed * RECOVERY_TILT.y;
  } else {
    player.vy = -speed;
  }
  player.grounded = false;
  player.fastFalling = false;
}

function advanceAttack(player: Player, input: PlayerInput): void {
  if (player.attackId === 'none') return;
  if (player.attackCharging) {
    // Releasing the button (or reaching full charge) starts the swing this very tick.
    if (input.heavy && player.attackChargeTicks < HEAVY_MAX_CHARGE_TICKS) {
      player.attackChargeTicks += 1;
    } else {
      player.attackCharging = false;
      // The charging pose was the wind-up: only the last ticks of the startup remain.
      const { startup } = attackData(player, player.attackId);
      player.attackTick = Math.max(0, startup - HEAVY_RELEASE_STARTUP_TICKS);
    }
    return;
  }
  player.attackTick += 1;
  const data = attackData(player, player.attackId);
  if (data.teleportToFlag && player.attackTick === data.startup) teleportToFlag(player);
  if (data.chainTo && player.attackQueued && player.attackTick >= (data.chainFrom ?? 0)) {
    beginAttack(player, data.chainTo);
    return;
  }
  if (player.attackTick < data.startup + data.active + data.recovery) return;
  player.attackId = 'none';
  if (data.parachute && !player.grounded) player.parachuting = true;
  // Only on the ground: in the air the stumble would throw him off the stage.
  if (data.whiffLagTicks && player.attackHitMask === 0 && player.grounded) {
    player.lagTicks = data.whiffLagTicks;
    player.vx = -player.facing * WHIFF_STUMBLE_SPEED;
  }
}

/** Appears standing on the flag (the feet of the last spot the player stood on). */
function teleportToFlag(player: Player): void {
  player.x = player.flagX - player.width / 2;
  player.y = player.flagY - player.height;
  player.vx = 0;
  player.vy = 0;
  player.fastFalling = false;
}

/** The sweet spot box in world space if the player stood at (x, y), or null if this attack has none. */
export function sweetspotBoxAt(player: Player, x: number, y: number): Rect | null {
  if (player.attackId === 'none') return null;
  const box = attackData(player, player.attackId).sweetspot?.box;
  if (!box) return null;
  const offsetX = player.facing === 1 ? box.x : player.width - box.x - box.width;
  return { x: x + offsetX, y: y + box.y, width: box.width, height: box.height };
}
