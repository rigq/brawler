// Dash (ground + direction), spot dodge (ground, no direction) and air dodge.
// While one is active it owns the player's movement for a few ticks.

import {
  AIR_DODGE_END_SPEED_MULT,
  AIR_DODGE_SPEED,
  AIR_DODGE_TICKS,
  DASH_COOLDOWN_TICKS,
  DASH_SPEED,
  DASH_TICKS,
  DODGE_COOLDOWN_TICKS,
  SPOT_DODGE_TICKS,
} from '../constants.ts';
import type { PlayerInput } from '../input.ts';
import type { Player } from './player.ts';

export type DodgeKind = 'none' | 'dash' | 'spot' | 'air';

export interface DodgeState {
  dodgeKind: DodgeKind;
  /** Ticks left in the current dash/dodge (0 when none is active). */
  dodgeTicks: number;
  /** Direction of the current dash/dodge; diagonals are normalised. */
  dodgeDirX: number;
  dodgeDirY: number;
  /** Ticks until a new dash/dodge can start. */
  dodgeCooldown: number;
  /** One air dodge per time in the air; refilled on landing. */
  airDodgeAvailable: boolean;
  /** Dodge button state in the previous step, to detect a fresh press. */
  dodgeHeld: boolean;
}

export function createDodgeState(): DodgeState {
  return {
    dodgeKind: 'none',
    dodgeTicks: 0,
    dodgeDirX: 0,
    dodgeDirY: 0,
    dodgeCooldown: 0,
    airDodgeAvailable: true,
    dodgeHeld: false,
  };
}

/** Spot and air dodges make the player untouchable (used by combat in F2). */
export function isInvulnerable(player: Player): boolean {
  return player.dodgeKind === 'spot' || player.dodgeKind === 'air';
}

/** Runs once at the start of every step: counts down, ends or starts a dodge. */
export function updateDodge(player: Player, input: PlayerInput): void {
  const pressed = input.dodge && !player.dodgeHeld;
  player.dodgeHeld = input.dodge;

  if (player.dodgeKind !== 'none') {
    player.dodgeTicks -= 1;
    if (player.dodgeTicks <= 0) endDodge(player);
    return;
  }
  if (player.dodgeCooldown > 0) player.dodgeCooldown -= 1;
  if (pressed && player.dodgeCooldown === 0) startDodge(player, input);
}

/** Sets the velocity for this step while a dash/dodge is active. */
export function applyDodgeMovement(player: Player): void {
  switch (player.dodgeKind) {
    case 'dash':
      player.vx = player.dodgeDirX * DASH_SPEED;
      break;
    case 'spot':
      player.vx = 0;
      break;
    case 'air':
      player.vx = player.dodgeDirX * AIR_DODGE_SPEED;
      player.vy = player.dodgeDirY * AIR_DODGE_SPEED;
      break;
    case 'none':
      break;
  }
}

export function endDodge(player: Player): void {
  if (player.dodgeKind === 'none') return;
  if (player.dodgeKind === 'air') {
    player.vx *= AIR_DODGE_END_SPEED_MULT;
    player.vy *= AIR_DODGE_END_SPEED_MULT;
  }
  player.dodgeCooldown = player.dodgeKind === 'dash' ? DASH_COOLDOWN_TICKS : DODGE_COOLDOWN_TICKS;
  player.dodgeKind = 'none';
  player.dodgeTicks = 0;
}

function startDodge(player: Player, input: PlayerInput): void {
  const dirX = Number(input.right) - Number(input.left);
  const dirY = Number(input.down) - Number(input.up);

  if (player.grounded) {
    if (dirX !== 0) begin(player, 'dash', DASH_TICKS, dirX, 0);
    else begin(player, 'spot', SPOT_DODGE_TICKS, 0, 0);
    return;
  }
  if (!player.airDodgeAvailable) return;

  // Diagonals at the same speed as straight lines. A constant instead of
  // Math.hypot: its last digits can differ between JS engines (not deterministic).
  const scale = dirX !== 0 && dirY !== 0 ? Math.SQRT1_2 : 1;
  begin(player, 'air', AIR_DODGE_TICKS, dirX * scale, dirY * scale);
  player.airDodgeAvailable = false;
  player.fastFalling = false;
}

function begin(player: Player, kind: DodgeKind, ticks: number, dirX: number, dirY: number): void {
  player.dodgeKind = kind;
  player.dodgeTicks = ticks;
  player.dodgeDirX = dirX;
  player.dodgeDirY = dirY;
}
