import {
  AIR_ACCEL,
  AIR_DRAG,
  AIR_JUMPS,
  DOUBLE_JUMP_SPEED,
  DROP_THROUGH_TICKS,
  FAST_FALL_SPEED,
  FIXED_DT,
  GRAVITY,
  GROUND_ACCEL,
  GROUND_FRICTION,
  JUMP_CUT,
  JUMP_SPEED,
  MAX_FALL_SPEED,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  RUN_SPEED,
} from '../constants.ts';
import type { PlayerInput } from '../input.ts';
import { moveAndCollide, type Body, type StageGeometry } from './collision.ts';
import { applyDodgeMovement, createDodgeState, endDodge, updateDodge, type DodgeState } from './dodge.ts';

export interface Player extends Body, DodgeState {
  /** Position at the start of the last step; the renderer interpolates from here. */
  prevX: number;
  prevY: number;
  /** Jump button state in the previous step, to detect a fresh press. */
  jumpHeld: boolean;
  /** Steps left during which one-way platforms are ignored (dropping through). */
  dropTicks: number;
  /** Air jumps still available before landing again. */
  airJumpsLeft: number;
  /** Locked at FAST_FALL_SPEED until landing or jumping again. */
  fastFalling: boolean;
}

export function createPlayer(spawn: { x: number; y: number }): Player {
  return {
    x: spawn.x,
    y: spawn.y,
    prevX: spawn.x,
    prevY: spawn.y,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    grounded: false,
    onPlatform: false,
    jumpHeld: false,
    dropTicks: 0,
    airJumpsLeft: AIR_JUMPS,
    fastFalling: false,
    ...createDodgeState(),
  };
}

/** Advances one player by one fixed step. */
export function stepPlayer(player: Player, input: PlayerInput, stage: StageGeometry): void {
  player.prevX = player.x;
  player.prevY = player.y;

  updateDodge(player, input);
  // Jumping out of a dash keeps its speed ("dash jump").
  if (player.dodgeKind === 'dash' && input.jump && !player.jumpHeld) endDodge(player);

  if (player.dodgeKind === 'none') {
    applyRun(player, input);
    applyJump(player, input);
    applyDropThrough(player, input);
  }
  applyDodgeMovement(player);
  if (player.dodgeKind !== 'air') applyGravity(player);
  if (player.dodgeKind === 'none') applyFastFall(player, input);

  moveAndCollide(player, stage, player.dropTicks > 0);
  if (player.grounded) land(player);

  player.jumpHeld = input.jump;
}

export function teleportPlayer(player: Player, spawn: { x: number; y: number }): void {
  player.x = player.prevX = spawn.x;
  player.y = player.prevY = spawn.y;
  player.vx = 0;
  player.vy = 0;
  Object.assign(player, createDodgeState());
  refillOnLanding(player);
}

function land(player: Player): void {
  if (player.dodgeKind === 'air') endDodge(player);
  refillOnLanding(player);
}

function applyRun(player: Player, input: PlayerInput): void {
  const dir = Number(input.right) - Number(input.left);
  const target = dir * RUN_SPEED;
  let accel: number;
  if (player.grounded) {
    accel = dir !== 0 ? GROUND_ACCEL : GROUND_FRICTION;
  } else {
    accel = dir !== 0 ? AIR_ACCEL : AIR_DRAG;
  }
  player.vx = approach(player.vx, target, accel * FIXED_DT);
}

function applyJump(player: Player, input: PlayerInput): void {
  const pressed = input.jump && !player.jumpHeld;
  const released = !input.jump && player.jumpHeld;

  if (pressed && player.grounded) {
    jump(player, JUMP_SPEED);
  } else if (pressed && player.airJumpsLeft > 0) {
    player.airJumpsLeft -= 1;
    jump(player, DOUBLE_JUMP_SPEED);
  } else if (released && player.vy < 0) {
    player.vy *= JUMP_CUT;
  }
}

function jump(player: Player, speed: number): void {
  player.vy = -speed;
  player.grounded = false;
  player.fastFalling = false;
}

/** Holding down while standing on a platform lets you fall through it. */
function applyDropThrough(player: Player, input: PlayerInput): void {
  if (player.dropTicks > 0) player.dropTicks -= 1;
  if (input.down && player.grounded && player.onPlatform) {
    player.dropTicks = DROP_THROUGH_TICKS;
    player.grounded = false;
    player.onPlatform = false;
  }
}

function applyGravity(player: Player): void {
  player.vy = Math.min(player.vy + GRAVITY * FIXED_DT, MAX_FALL_SPEED);
}

/** Holding down in the air, once past the top of the jump, drops you fast. */
function applyFastFall(player: Player, input: PlayerInput): void {
  if (!player.grounded && input.down && player.vy >= 0) player.fastFalling = true;
  if (player.fastFalling) player.vy = FAST_FALL_SPEED;
}

function refillOnLanding(player: Player): void {
  player.airJumpsLeft = AIR_JUMPS;
  player.fastFalling = false;
  player.airDodgeAvailable = true;
}

/** Moves `value` towards `target` by at most `maxDelta`, without overshooting. */
function approach(value: number, target: number, maxDelta: number): number {
  if (value < target) return Math.min(value + maxDelta, target);
  return Math.max(value - maxDelta, target);
}
