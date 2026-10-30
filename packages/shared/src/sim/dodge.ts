// Dash (double tap on the ground), roll and spot dodge (out of the shield) and air dodge.
// While one is active it owns the player's movement for a few ticks.

import {
  AIR_DODGE_END_SPEED_MULT,
  AIR_DODGE_SPEED,
  AIR_DODGE_TICKS,
  DASH_COOLDOWN_TICKS,
  DASH_SPEED,
  DASH_TAP_WINDOW_TICKS,
  DASH_TICKS,
  DODGE_COOLDOWN_TICKS,
  ROLL_END_VULN_TICKS,
  ROLL_SPEED,
  ROLL_TICKS,
  SPOT_DODGE_TICKS,
} from '../constants.ts';
import { characterOf } from '../characters/index.ts';
import type { PlayerInput } from '../input.ts';
import type { Player } from './player.ts';

export type DodgeKind = 'none' | 'dash' | 'roll' | 'spot' | 'air';

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
  /** Left/right held in the previous step (-1, 0, 1), to detect a fresh tap. */
  dirHeld: number;
  /** Direction of the last tap, and ticks left to tap it again for a dash. */
  tapDir: number;
  tapTicks: number;
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
    dirHeld: 0,
    tapDir: 0,
    tapTicks: 0,
  };
}

/** Spot and air dodges, most of a roll and the moments after respawning make the player untouchable. */
export function isInvulnerable(player: Player): boolean {
  if (player.dodgeKind === 'roll') return player.dodgeTicks > ROLL_END_VULN_TICKS;
  return player.dodgeKind === 'spot' || player.dodgeKind === 'air' || player.invulnTicks > 0;
}

/** Runs once at the start of every step: counts down, ends or starts a dodge. */
export function updateDodge(player: Player, input: PlayerInput): void {
  const pressed = input.dodge && !player.dodgeHeld;
  player.dodgeHeld = input.dodge;
  const doubleTap = readDoubleTap(player, input);

  if (player.dodgeKind !== 'none') {
    player.dodgeTicks -= 1;
    // A roll stops at the edge of the ground instead of carrying you off it.
    if (player.dodgeTicks <= 0 || (player.dodgeKind === 'roll' && !player.grounded)) endDodge(player);
    return;
  }
  if (player.dodgeCooldown > 0) player.dodgeCooldown -= 1;
  const free = player.attackId === 'none' && player.hitstunTicks === 0 && player.lagTicks === 0;
  if (!free || player.shielding || player.dodgeCooldown > 0) return;
  if (doubleTap && player.grounded) startDash(player, input);
  else if (pressed && !player.grounded) startAirDodge(player, input);
}

/** Starts a roll in direction `dirX`. The facing stays: you roll past or away without turning. */
export function startRoll(player: Player, dirX: number): void {
  begin(player, 'roll', ROLL_TICKS, dirX, 0);
}

export function startSpotDodge(player: Player): void {
  begin(player, 'spot', SPOT_DODGE_TICKS, 0, 0);
}

/** Sets the velocity for this step while a dash/dodge is active. */
export function applyDodgeMovement(player: Player): void {
  switch (player.dodgeKind) {
    case 'dash':
      player.vx = player.dodgeDirX * DASH_SPEED * characterOf(player).speedMult;
      break;
    case 'roll':
      player.vx = player.dodgeDirX * ROLL_SPEED;
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
  if (player.dodgeKind === 'roll') player.vx = 0;
  player.dodgeCooldown = player.dodgeKind === 'dash' ? DASH_COOLDOWN_TICKS : DODGE_COOLDOWN_TICKS;
  player.dodgeKind = 'none';
  player.dodgeTicks = 0;
}

/** True on the second tap of the same direction within DASH_TAP_WINDOW_TICKS. */
function readDoubleTap(player: Player, input: PlayerInput): boolean {
  const dir = Number(input.right) - Number(input.left);
  const fresh = dir !== 0 && dir !== player.dirHeld;
  player.dirHeld = dir;
  if (player.tapTicks > 0) player.tapTicks -= 1;
  if (!fresh) return false;
  const doubled = dir === player.tapDir && player.tapTicks > 0;
  player.tapDir = dir;
  player.tapTicks = doubled ? 0 : DASH_TAP_WINDOW_TICKS;
  return doubled;
}

function startDash(player: Player, input: PlayerInput): void {
  const dirX = Number(input.right) - Number(input.left);
  begin(player, 'dash', DASH_TICKS, dirX, 0);
  player.facing = dirX === 1 ? 1 : -1;
}

function startAirDodge(player: Player, input: PlayerInput): void {
  if (!player.airDodgeAvailable) return;
  const dirX = Number(input.right) - Number(input.left);
  const dirY = Number(input.down) - Number(input.up);

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
