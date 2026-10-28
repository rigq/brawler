import {
  AIR_ACCEL,
  AIR_DRAG,
  AIR_JUMPS,
  ATTACK_MOVE_SPEED_MULT,
  DOUBLE_JUMP_SPEED,
  DROP_THROUGH_TICKS,
  FAST_FALL_SPEED,
  FIXED_DT,
  GRAVITY,
  GROUND_ACCEL,
  GROUND_FRICTION,
  HITSTUN_DRAG,
  JUMP_CUT,
  JUMP_SPEED,
  MAX_FALL_SPEED,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  RUN_SPEED,
} from '../constants.ts';
import { attackPressed, createAttackState, isAttacking, updateAttack, type AttackState } from '../combat/attacks.ts';
import type { PlayerInput } from '../input.ts';
import { moveAndCollide, type Body, type StageGeometry } from './collision.ts';
import { applyDodgeMovement, createDodgeState, endDodge, updateDodge, type DodgeState } from './dodge.ts';
import { createStockState, type StockState } from './stocks.ts';

export interface Player extends Body, DodgeState, AttackState, StockState {
  /** 1 = facing right, -1 = facing left. Side attacks go this way. */
  facing: 1 | -1;
  /** Ticks left of the "just got hit" flash. */
  hitFlashTicks: number;
  /** Accumulated damage in %. Higher = flies further when hit. */
  damage: number;
  /** Ticks left without control after being hit. */
  hitstunTicks: number;
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
  /** Up heavy in the air still gives its upward boost (once per time in the air). */
  recoveryAvailable: boolean;
}

export function createPlayer(spawn: { x: number; y: number; facing: 1 | -1 }): Player {
  return {
    facing: spawn.facing,
    hitFlashTicks: 0,
    damage: 0,
    hitstunTicks: 0,
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
    recoveryAvailable: true,
    ...createDodgeState(),
    ...createAttackState(),
    ...createStockState(),
  };
}

/** Advances one player by one fixed step. Hits are resolved afterwards, for all players at once. */
export function stepPlayer(player: Player, input: PlayerInput, stage: StageGeometry): void {
  player.prevX = player.x;
  player.prevY = player.y;
  if (player.hitFlashTicks > 0) player.hitFlashTicks -= 1;
  if (player.dropTicks > 0) player.dropTicks -= 1;
  if (player.invulnTicks > 0) player.invulnTicks -= 1;

  // Attacking out of a dash keeps its speed ("dash attack").
  if (player.dodgeKind === 'dash' && attackPressed(player, input)) endDodge(player);
  updateAttack(player, input);
  updateDodge(player, input);
  // Jumping out of a dash keeps its speed ("dash jump").
  if (player.dodgeKind === 'dash' && input.jump && !player.jumpHeld) endDodge(player);

  const stunned = player.hitstunTicks > 0;
  if (stunned) {
    applyHitstunDrag(player);
  } else if (isAttacking(player)) {
    applyAttackDrift(player, input);
  } else if (player.dodgeKind === 'none') {
    applyRun(player, input);
    applyJump(player, input);
    applyDropThrough(player, input);
    applyFacing(player, input);
  }
  applyDodgeMovement(player);
  if (player.dodgeKind !== 'air') applyGravity(player);
  if (player.dodgeKind === 'none' && !stunned) applyFastFall(player, input);

  moveAndCollide(player, stage, player.dropTicks > 0);
  if (player.grounded) land(player);

  player.jumpHeld = input.jump;
  if (stunned) player.hitstunTicks -= 1;
}

export function teleportPlayer(player: Player, spawn: { x: number; y: number; facing: 1 | -1 }): void {
  player.x = player.prevX = spawn.x;
  player.y = player.prevY = spawn.y;
  player.vx = 0;
  player.vy = 0;
  player.facing = spawn.facing;
  player.hitFlashTicks = 0;
  player.damage = 0;
  player.hitstunTicks = 0;
  Object.assign(player, createDodgeState(), createAttackState());
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

/** No control while in hitstun: the launch speed just fades and gravity pulls. */
function applyHitstunDrag(player: Player): void {
  player.vx = approach(player.vx, 0, HITSTUN_DRAG * FIXED_DT);
}

/**
 * While attacking you can still move (slower on the ground, normal air
 * control in the air), but you commit: no jumping, dodging or turning around.
 */
function applyAttackDrift(player: Player, input: PlayerInput): void {
  if (player.grounded) {
    // Keep running while attacking, a bit slower. A dash-attack bleeds its extra speed off.
    const dir = Number(input.right) - Number(input.left);
    const accel = dir !== 0 ? GROUND_ACCEL : GROUND_FRICTION;
    player.vx = approach(player.vx, dir * RUN_SPEED * ATTACK_MOVE_SPEED_MULT, accel * FIXED_DT);
  } else {
    applyRun(player, input);
  }
}

function applyFacing(player: Player, input: PlayerInput): void {
  const dir = Number(input.right) - Number(input.left);
  if (dir !== 0) player.facing = dir === 1 ? 1 : -1;
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
  player.recoveryAvailable = true;
}

/** Moves `value` towards `target` by at most `maxDelta`, without overshooting. */
function approach(value: number, target: number, maxDelta: number): number {
  if (value < target) return Math.min(value + maxDelta, target);
  return Math.max(value - maxDelta, target);
}
