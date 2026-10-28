// Attack state machine and where the hitbox is.
// Light: startup → active → recovery. Heavy: charge (while held) → startup → active → recovery.

import { HEAVY_ATTACKS, HEAVY_MAX_CHARGE_TICKS, LIGHT_ATTACKS, RECOVERY_SPEED } from '../constants.ts';
import type { PlayerInput } from '../input.ts';
import type { Rect } from '../math/rect.ts';
import type { Player } from '../sim/player.ts';

export type AttackDirection = keyof typeof LIGHT_ATTACKS;
export type AttackStrength = 'light' | 'heavy';
export type AttackPhase = 'none' | 'charge' | 'startup' | 'active' | 'recovery';

export interface AttackState {
  /** Which attack is running, or 'none'. */
  attackDir: AttackDirection | 'none';
  attackStrength: AttackStrength;
  /** Heavy only: still holding the button, before startup begins. */
  attackCharging: boolean;
  /** Heavy only: ticks spent charging (0..HEAVY_MAX_CHARGE_TICKS). F2.3 scales damage with it. */
  attackChargeTicks: number;
  /** Ticks since startup began (0 on its first tick). Stays 0 while charging. */
  attackTick: number;
  /** Bit i set = this attack already hit player i (each attack hits a target once). */
  attackHitMask: number;
  /** Button states in the previous step, to detect fresh presses. */
  lightHeld: boolean;
  heavyHeld: boolean;
}

export function createAttackState(): AttackState {
  return {
    attackDir: 'none',
    attackStrength: 'light',
    attackCharging: false,
    attackChargeTicks: 0,
    attackTick: 0,
    attackHitMask: 0,
    lightHeld: false,
    heavyHeld: false,
  };
}

export function isAttacking(player: Player): boolean {
  return player.attackDir !== 'none';
}

/** A fresh press of light or heavy this step (call before updateAttack, which updates the held flags). */
export function attackPressed(player: Player, input: PlayerInput): boolean {
  return (input.light && !player.lightHeld) || (input.heavy && !player.heavyHeld);
}

/** Runs once at the start of every step: charges, advances, ends or starts an attack. */
export function updateAttack(player: Player, input: PlayerInput): void {
  const lightPressed = input.light && !player.lightHeld;
  const heavyPressed = input.heavy && !player.heavyHeld;
  player.lightHeld = input.light;
  player.heavyHeld = input.heavy;

  if (player.attackDir !== 'none') {
    advanceAttack(player, input);
    return;
  }
  if (player.dodgeKind !== 'none' || player.hitstunTicks > 0) return;
  if (lightPressed) startAttack(player, input, 'light');
  else if (heavyPressed) startAttack(player, input, 'heavy');
}

export function attackPhase(player: Player): AttackPhase {
  if (player.attackDir === 'none') return 'none';
  if (player.attackCharging) return 'charge';
  const data = attackData(player.attackStrength, player.attackDir);
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
  if (player.attackDir === 'none') return null;
  const box = attackData(player.attackStrength, player.attackDir).box;
  const offsetX = player.facing === 1 ? box.x : player.width - box.x - box.width;
  return { x: x + offsetX, y: y + box.y, width: box.width, height: box.height };
}

/** The hitbox that can hit right now (active phase only), or null. */
export function activeHitbox(player: Player): Rect | null {
  return attackPhase(player) === 'active' ? attackBoxAt(player, player.x, player.y) : null;
}

/** Where the player can be hit. For now, the whole body box. */
export function hurtbox(player: Player): Rect {
  return { x: player.x, y: player.y, width: player.width, height: player.height };
}

export function attackData(strength: AttackStrength, dir: AttackDirection) {
  return strength === 'heavy' ? HEAVY_ATTACKS[dir] : LIGHT_ATTACKS[dir];
}

function startAttack(player: Player, input: PlayerInput, strength: AttackStrength): void {
  const dirX = Number(input.right) - Number(input.left);
  if (dirX !== 0) player.facing = dirX === 1 ? 1 : -1;

  player.attackDir = input.up ? 'up' : input.down ? 'down' : 'side';
  player.attackStrength = strength;
  // Heavies charge only on the ground; in the air they fire at once.
  player.attackCharging = strength === 'heavy' && player.grounded;
  if (strength === 'heavy' && player.attackDir === 'up' && !player.grounded) launchRecovery(player);
  player.attackChargeTicks = 0;
  player.attackTick = 0;
  player.attackHitMask = 0;
  // Respawn invulnerability is for getting back in, not for attacking safely.
  player.invulnTicks = 0;
}

/** The "recovery": up heavy in the air pushes you up, once per time in the air, to get back to the stage. */
function launchRecovery(player: Player): void {
  if (!player.recoveryAvailable) return;
  player.recoveryAvailable = false;
  player.vy = -RECOVERY_SPEED;
  player.fastFalling = false;
}

function advanceAttack(player: Player, input: PlayerInput): void {
  if (player.attackDir === 'none') return;
  if (player.attackCharging) {
    // Releasing the button (or reaching full charge) starts the swing this very tick.
    if (input.heavy && player.attackChargeTicks < HEAVY_MAX_CHARGE_TICKS) {
      player.attackChargeTicks += 1;
    } else {
      player.attackCharging = false;
    }
    return;
  }
  player.attackTick += 1;
  const data = attackData(player.attackStrength, player.attackDir);
  if (player.attackTick >= data.startup + data.active + data.recovery) player.attackDir = 'none';
}
