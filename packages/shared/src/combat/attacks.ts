// Attack state machine and where the hitbox is.
// Light: startup → active → recovery. Heavy: charge (while held) → startup → active → recovery.

import {
  HEAVY_RELEASE_STARTUP_TICKS,
  AIR_HEAVY_UP_BOOST,
  RECOVERY_TILT, HEAVY_MAX_CHARGE_TICKS, HEAVY_MAX_HOLD_TICKS, WHIFF_STUMBLE_SPEED, type AttackData, type AttackId } from '../constants.ts';
import { characterOf } from '../characters/index.ts';
import type { PlayerInput } from '../input.ts';
import type { Rect } from '../math/rect.ts';
import type { Player } from '../sim/player.ts';

export type AttackPhase = 'none' | 'charge' | 'startup' | 'active' | 'recovery';

export interface AttackState {
  /** Which attack is running, or 'none'. */
  attackId: AttackId | 'none';
  /** Heavy (or a special with chargeTicks): still holding the button, before startup begins. */
  attackCharging: boolean;
  /** Heavy only: ticks spent charging; past HEAVY_MAX_CHARGE_TICKS it is held at full charge. Scales damage and knockback. */
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
  /** Gliding down after a parachute special: no attacks, air jumps or dodges until landing (except its drops). */
  parachuting: boolean;
  /** Drops left in this glide (AttackData.parachuteDrops). */
  dropsLeft: number;
  /** Power stacks gathered (AttackData.grantsStack), spent by an attack with stackBonus. */
  powerStacks: number;
  /** Shots this attack has fired so far (bursts fire several, see ProjectileSpec.shots). */
  attackShots: number;
  /** Tether recovery: the ledge being pulled to (side -1/1 and the point hooked), side 0 = none. */
  tetherSide: number;
  tetherX: number;
  tetherY: number;
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
    dropsLeft: 0,
    powerStacks: 0,
    attackShots: 0,
    tetherSide: 0,
    tetherX: 0,
    tetherY: 0,
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
  if (player.parachuting && specialPressed && player.lagTicks === 0) {
    dropFromParachute(player, input);
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
  if (player.dodgeKind !== 'none' || player.hitstunTicks > 0) return;
  if (grabPressed && player.grounded) startAttack(player, input, 'grab');
  else if (lightPressed) startAttack(player, input, chooseLight(player, input));
  else if (heavyPressed) startAttack(player, input, chooseHeavy(input));
  else if (specialPressed) startSpecial(player, input);
}

/** Under the parachute, the special drops something (a bomb), a few times per glide. */
function dropFromParachute(player: Player, input: PlayerInput): void {
  const drops = attackData(player, 'specialUp').parachuteDrops;
  if (!drops || player.dropsLeft <= 0) return;
  player.dropsLeft -= 1;
  startAttack(player, input, drops.attack);
}

/** Up = up special (only while the recovery is unused); otherwise neutral, if its cooldown and the ground allow. */
function startSpecial(player: Player, input: PlayerInput): void {
  const id: AttackId = input.up ? 'specialUp' : 'specialNeutral';
  const data = attackData(player, id);
  if (data.groundOnly && !player.grounded) return;
  if (data.cooldownTicks && player.specialCooldown > 0) return;
  if (data.teleportToFlag && !flagReachable(player)) return;
  const recovery = data.launchSpeed !== undefined || data.teleportToFlag === true || data.tether !== undefined;
  if (recovery && !player.recoveryAvailable) return;
  startAttack(player, input, id);
  // A projectile special starts its cooldown when it fires (see fireIfReady); the rest, now.
  if (!data.projectile && data.cooldownTicks) player.specialCooldown = data.cooldownTicks;
  if (data.teleportToFlag || data.tether) player.recoveryAvailable = false;
}

export function attackPhase(player: Player): AttackPhase {
  if (player.attackId === 'none') return 'none';
  if (player.attackCharging) return 'charge';
  const data = attackData(player, player.attackId);
  if (player.attackTick < data.startup) return 'startup';
  if (player.attackTick < data.startup + data.active) return 'active';
  return 'recovery';
}

/** Charge from 0 (tapped) to 1 (fully charged), for heavies and chargeable specials. */
export function attackCharge(player: Player): number {
  if (player.attackId === 'none') return 0;
  const data = attackData(player, player.attackId);
  return Math.min(1, player.attackChargeTicks / (data.chargeTicks ?? HEAVY_MAX_CHARGE_TICKS));
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

/** Light: shield button held → grab; in the air → aerial; up/down → tilts; no direction → jab; else side tilt. */
function chooseLight(player: Player, input: PlayerInput): AttackId {
  if (player.grounded && input.dodge) return 'grab';
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
  // Heavies (and chargeable specials) charge only on the ground, unless chargeInAir; in the air they fire at once.
  player.attackCharging = (data.heavy || data.chargeTicks !== undefined) && (player.grounded || data.chargeInAir === true);
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
  player.attackShots = 0;
  player.tetherSide = 0;
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
    advanceCharge(player, input);
    return;
  }
  player.attackTick += 1;
  const data = attackData(player, player.attackId);
  // A flurry: every rehitTicks of the active phase, everyone can be hit again.
  if (data.rehitTicks && player.attackTick > data.startup && (player.attackTick - data.startup) % data.rehitTicks === 0) {
    player.attackHitMask = 0;
  }
  if (data.teleportToFlag && player.attackTick === data.startup) teleportToFlag(player);
  if (data.chainTo && player.attackQueued && player.attackTick >= (data.chainFrom ?? 0)) {
    beginAttack(player, data.chainTo);
    return;
  }
  if (player.attackTick < data.startup + data.active + data.recovery) return;
  player.attackId = 'none';
  if (data.parachute && !player.grounded) {
    player.parachuting = true;
    player.dropsLeft = data.parachuteDrops?.count ?? 0;
  }
  // Only on the ground: in the air the stumble would throw him off the stage.
  if (data.whiffLagTicks && player.attackHitMask === 0 && player.grounded) {
    player.lagTicks = data.whiffLagTicks;
    player.vx = -player.facing * WHIFF_STUMBLE_SPEED;
  }
}

/** False once the flag has expired (too long in the air): it is gone. */
export function hasFlag(player: Player): boolean {
  const lifetime = attackData(player, 'specialUp').flagLifetimeTicks;
  return lifetime === undefined || player.flagAgeTicks <= lifetime;
}

/** The flag is there and close enough to teleport to it now (flagRange). */
export function flagReachable(player: Player): boolean {
  const range = attackData(player, 'specialUp').flagRange;
  if (!hasFlag(player)) return false;
  if (range === undefined) return true;
  const dx = player.x + player.width / 2 - player.flagX;
  const dy = player.y + player.height - player.flagY;
  // Squared, so no square root: exact and deterministic.
  return dx * dx + dy * dy <= range * range;
}

/**
 * Charging while the button is held. Heavies: releasing starts the swing this
 * very tick, and full charge can be held a while (flashing). Chargeable
 * specials fire on their own at full charge, and the time charged counts as wind-up.
 */
function advanceCharge(player: Player, input: PlayerInput): void {
  if (player.attackId === 'none') return;
  const data = attackData(player, player.attackId);
  const held = data.heavy ? input.heavy : input.special;
  const limit = data.heavy ? HEAVY_MAX_CHARGE_TICKS + HEAVY_MAX_HOLD_TICKS : (data.chargeTicks ?? 0);
  if (held && player.attackChargeTicks < limit) {
    player.attackChargeTicks += 1;
    return;
  }
  const pick = rouletteChoice(player);
  player.attackCharging = false;
  if (data.roulette) {
    // The option showing when the button was let go becomes the attack, from its own startup.
    beginAttack(player, pick ?? player.attackId);
    return;
  }
  const quickest = Math.max(0, data.startup - HEAVY_RELEASE_STARTUP_TICKS);
  // The charging pose was the wind-up: only the last ticks of the startup remain.
  player.attackTick = data.heavy ? quickest : Math.min(player.attackChargeTicks, quickest);
}

/** While a roulette special charges: the option showing now (what letting go would start), else null. */
export function rouletteChoice(player: Player): AttackId | null {
  if (player.attackId === 'none' || !player.attackCharging) return null;
  const roulette = attackData(player, player.attackId).roulette;
  if (!roulette || roulette.options.length === 0) return null;
  const index = Math.floor(player.attackChargeTicks / roulette.stepTicks) % roulette.options.length;
  return roulette.options[index] ?? null;
}

/** True while this player's counter is waiting for a hit (AttackData.counter, active phase). */
export function counterHolds(player: Player): boolean {
  return player.attackId !== 'none' && attackPhase(player) === 'active' && attackData(player, player.attackId).counter === true;
}

/** Appears standing on the flag (the feet of the last spot the player stood on). */
function teleportToFlag(player: Player): void {
  player.x = player.flagX - player.width / 2;
  player.y = player.flagY - player.height;
  player.vx = 0;
  player.vy = 0;
  player.fastFalling = false;
}

/** True if this player's attack has armour that takes a hit of `damage` % without flinching (see AttackData.armor). */
export function armorHolds(player: Player, damage: number): boolean {
  if (player.attackId === 'none') return false;
  const armor = attackData(player, player.attackId).armor ?? 0;
  const phase = attackPhase(player);
  return damage <= armor && (phase === 'charge' || phase === 'startup' || phase === 'active');
}

/** The sweet spot box in world space if the player stood at (x, y), or null if this attack has none. */
export function sweetspotBoxAt(player: Player, x: number, y: number): Rect | null {
  if (player.attackId === 'none') return null;
  const box = attackData(player, player.attackId).sweetspot?.box;
  if (!box) return null;
  const offsetX = player.facing === 1 ? box.x : player.width - box.x - box.width;
  return { x: x + offsetX, y: y + box.y, width: box.width, height: box.height };
}
