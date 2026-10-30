// The shield: hold dodge on the ground to block every hit, at a price.
// It wears out while held and when blocking; if it breaks, you are left stunned.

import {
  HIT_FLASH_TICKS,
  SHIELD_BREAK_REFILL,
  SHIELD_BREAK_STUN_TICKS,
  SHIELD_DAMAGE_MULT,
  SHIELD_DRAIN_PER_TICK,
  SHIELD_DROP_LAG_TICKS,
  SHIELD_MAX,
  SHIELD_PUSH_SPEED,
  SHIELD_REGEN_PER_TICK,
  SHIELD_STUN_BASE_TICKS,
  SHIELD_STUN_PER_DAMAGE,
} from '../constants.ts';
import type { PlayerInput } from '../input.ts';
import { startRoll, startSpotDodge } from './dodge.ts';
import type { Player } from './player.ts';

export interface ShieldState {
  shielding: boolean;
  /** 0..SHIELD_MAX. Shrinks the shield; at 0 it breaks. */
  shieldHealth: number;
  /** Ticks left stuck in the shield after blocking a hit. */
  shieldStunTicks: number;
}

export function createShieldState(): ShieldState {
  return { shielding: false, shieldHealth: SHIELD_MAX, shieldStunTicks: 0 };
}

/** Runs once every step, after dodges: raises, holds, wears out or lowers the shield. */
export function updateShield(player: Player, input: PlayerInput): void {
  if (!player.shielding) {
    player.shieldHealth = Math.min(player.shieldHealth + SHIELD_REGEN_PER_TICK, SHIELD_MAX);
    if (input.dodge && canRaise(player)) raiseShield(player, input);
    return;
  }
  if (!player.grounded) {
    lowerShield(player);
    return;
  }
  player.shieldHealth -= SHIELD_DRAIN_PER_TICK;
  if (player.shieldHealth <= 0) {
    breakShield(player);
    return;
  }
  if (player.shieldStunTicks > 0) {
    player.shieldStunTicks -= 1;
    return;
  }
  if (!input.dodge) {
    lowerShield(player);
    player.lagTicks = SHIELD_DROP_LAG_TICKS;
    return;
  }
  dodgeOutOfShield(player, input);
}

/** Takes a blocked hit: no damage or launch, but it wears the shield and holds you in place. */
export function blockHit(target: Player, awayDir: 1 | -1, damage: number): void {
  target.shieldHealth -= damage * SHIELD_DAMAGE_MULT;
  if (target.shieldHealth <= 0) {
    breakShield(target);
    return;
  }
  target.vx = awayDir * SHIELD_PUSH_SPEED;
  target.shieldStunTicks = SHIELD_STUN_BASE_TICKS + Math.floor(damage * SHIELD_STUN_PER_DAMAGE);
}

function canRaise(player: Player): boolean {
  const idle = player.dodgeKind === 'none' && player.attackId === 'none';
  return idle && player.grounded && player.hitstunTicks === 0 && player.lagTicks === 0;
}

function raiseShield(player: Player, input: PlayerInput): void {
  player.shielding = true;
  dodgeOutOfShield(player, input);
}

/** Left/right rolls, down dodges on the spot. Both share the dodge cooldown. */
function dodgeOutOfShield(player: Player, input: PlayerInput): void {
  if (player.dodgeCooldown > 0) return;
  const dirX = Number(input.right) - Number(input.left);
  if (dirX !== 0) {
    player.shielding = false;
    startRoll(player, dirX);
  } else if (input.down) {
    player.shielding = false;
    startSpotDodge(player);
  }
}

function lowerShield(player: Player): void {
  player.shielding = false;
  player.shieldStunTicks = 0;
}

/** Hitstun does the stunning; the long white flash tells everyone what happened. */
function breakShield(player: Player): void {
  lowerShield(player);
  player.shieldHealth = SHIELD_BREAK_REFILL;
  player.hitstunTicks = SHIELD_BREAK_STUN_TICKS;
  player.hitFlashTicks = Math.max(player.hitFlashTicks, HIT_FLASH_TICKS, SHIELD_BREAK_STUN_TICKS);
}
