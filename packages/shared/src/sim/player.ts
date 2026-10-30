import {
  AIR_ACCEL,
  AIR_DODGE_LANDING_LAG,
  AIR_DRAG,
  AIR_JUMPS,
  ATTACK_MOVE_SPEED_MULT,
  COYOTE_TICKS,
  DASH_ATTACK_FRICTION,
  DOUBLE_JUMP_SPEED,
  DROP_THROUGH_TICKS,
  FAST_FALL_SPEED,
  FIXED_DT,
  GRAVITY,
  GROUND_ACCEL,
  GROUND_FRICTION,
  HITSTUN_DRAG,
  JUMP_BUFFER_TICKS,
  JUMP_CUT,
  JUMP_SPEED,
  MAX_FALL_SPEED,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  RUN_SPEED,
} from '../constants.ts';
import { DEFAULT_CHARACTER, characterOf, type CharacterId } from '../characters/index.ts';
import { createGrabState, chooseThrow, type GrabState } from '../combat/grabs.ts';
import { attackData, createAttackState, isAttacking, updateAttack, type AttackState } from '../combat/attacks.ts';
import type { PlayerInput } from '../input.ts';
import { moveAndCollide, type Body, type StageGeometry } from './collision.ts';
import { applyDodgeMovement, createDodgeState, endDodge, updateDodge, type DodgeState } from './dodge.ts';
import { createLedgeState, tryGrabLedge, updateLedge, type LedgeState } from './ledge.ts';
import { createShieldState, updateShield, type ShieldState } from './shield.ts';
import { createStockState, type StockState } from './stocks.ts';

export interface Player extends Body, DodgeState, AttackState, GrabState, LedgeState, ShieldState, StockState {
  /** Who this is: stats and attacks come from this character. */
  characterId: CharacterId;
  /** 1 = facing right, -1 = facing left. Side attacks go this way. */
  facing: 1 | -1;
  /** Ticks left of the "just got hit" flash. */
  hitFlashTicks: number;
  /** Accumulated damage in %. Higher = flies further when hit. */
  damage: number;
  /** Ticks left without control after being hit. */
  hitstunTicks: number;
  /** Hits taken in the current combo; back to 0 on the first tick free of hitstun. Each one shortens the next stun. */
  comboHits: number;
  /** Ticks left frozen in place after landing or taking a hit (hitstop). */
  hitstopTicks: number;
  /** Ticks left unable to act: after landing during an aerial or air dodge, or lowering the shield. */
  lagTicks: number;
  /** Position at the start of the last step; the renderer interpolates from here. */
  prevX: number;
  prevY: number;
  /** Jump button state in the previous step, to detect a fresh press. */
  jumpHeld: boolean;
  /** Ticks left in which the ground jump still works after leaving the ground. */
  coyoteTicks: number;
  /** This jump cannot be shortened by releasing the button (jumps from a ledge). */
  fullJump: boolean;
  /** Ticks left in which a recent jump press still counts on the ground. */
  jumpBufferTicks: number;
  /** Steps left during which one-way platforms are ignored (dropping through). */
  dropTicks: number;
  /** Air jumps still available before landing again. */
  airJumpsLeft: number;
  /** Locked at FAST_FALL_SPEED until landing or jumping again. */
  fastFalling: boolean;
  /** Up heavy in the air still gives its upward boost (once per time in the air). */
  recoveryAvailable: boolean;
}

export function createPlayer(
  spawn: { x: number; y: number; facing: 1 | -1 },
  characterId: CharacterId = DEFAULT_CHARACTER,
): Player {
  return {
    characterId,
    facing: spawn.facing,
    hitFlashTicks: 0,
    damage: 0,
    hitstunTicks: 0,
    comboHits: 0,
    hitstopTicks: 0,
    lagTicks: 0,
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
    coyoteTicks: 0,
    fullJump: false,
    jumpBufferTicks: 0,
    dropTicks: 0,
    airJumpsLeft: AIR_JUMPS,
    fastFalling: false,
    recoveryAvailable: true,
    ...createDodgeState(),
    ...createAttackState(),
    ...createGrabState(),
    ...createLedgeState(),
    ...createShieldState(),
    ...createStockState(),
  };
}

/** Advances one player by one fixed step. Hits are resolved afterwards, for all players at once. */
export function stepPlayer(player: Player, input: PlayerInput, stage: StageGeometry): void {
  player.prevX = player.x;
  player.prevY = player.y;
  // Hitstop: everything waits (timers, attack phases, velocity). A button still
  // held when the freeze ends counts as a fresh press, so inputs feel buffered.
  if (player.hitstopTicks > 0) {
    player.hitstopTicks -= 1;
    return;
  }
  // Held players are moved by the holder (resolveGrabs); holders just pick a throw.
  if (player.grabbedTicks > 0) return;
  if (player.holdTicks > 0) {
    chooseThrow(player, input);
    return;
  }
  if (player.hitFlashTicks > 0) player.hitFlashTicks -= 1;
  if (player.dropTicks > 0) player.dropTicks -= 1;
  if (player.invulnTicks > 0) player.invulnTicks -= 1;
  if (player.ledgeRegrabTicks > 0) player.ledgeRegrabTicks -= 1;
  if (player.ledgeSide !== 0) {
    updateLedge(player, input, stage);
    // Hanging ignores gravity; letting go or jumping falls through to the next step.
    return;
  }
  player.jumpBufferTicks = input.jump && !player.jumpHeld ? JUMP_BUFFER_TICKS : Math.max(player.jumpBufferTicks - 1, 0);

  // Attacking out of a dash ends it and keeps its speed (see startAttack).
  updateAttack(player, input);
  updateDodge(player, input);
  updateShield(player, input);
  // Jumping out of a dash keeps its speed ("dash jump").
  if (player.dodgeKind === 'dash' && input.jump && !player.jumpHeld) endDodge(player);

  const stunned = player.hitstunTicks > 0;
  // Reset only on a free tick: a hit landing on the last stunned tick still extends the combo.
  if (!stunned) player.comboHits = 0;
  if (stunned) {
    applyHitstunDrag(player);
  } else if (player.lagTicks > 0) {
    player.lagTicks -= 1;
    player.vx = approach(player.vx, 0, GROUND_FRICTION * FIXED_DT);
  } else if (player.shielding) {
    // Rooted in place; the only way out without lag is jumping.
    player.vx = approach(player.vx, 0, GROUND_FRICTION * FIXED_DT);
    if (player.shieldStunTicks === 0) applyJump(player, input);
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

  // After the jump check, so the window lasts exactly COYOTE_TICKS ticks in the air.
  if (player.coyoteTicks > 0) player.coyoteTicks -= 1;
  moveAndCollide(player, stage, player.dropTicks > 0);
  if (player.grounded) land(player);
  else tryGrabLedge(player, input, stage);

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
  player.comboHits = 0;
  player.hitstopTicks = 0;
  player.lagTicks = 0;
  player.coyoteTicks = 0;
  player.jumpBufferTicks = 0;
  Object.assign(player, createDodgeState(), createAttackState(), createGrabState(), createLedgeState(), createShieldState());
  refillOnLanding(player);
}

function land(player: Player): void {
  if (player.dodgeKind === 'air') {
    endDodge(player);
    player.lagTicks = AIR_DODGE_LANDING_LAG;
  }
  player.coyoteTicks = COYOTE_TICKS;
  refillOnLanding(player);
  if (player.attackId === 'none') return;
  const lag = attackData(player, player.attackId).landingLag;
  if (lag === undefined) return;
  player.attackId = 'none';
  player.lagTicks = lag;
}

function applyRun(player: Player, input: PlayerInput): void {
  const dir = Number(input.right) - Number(input.left);
  const target = dir * RUN_SPEED * characterOf(player).speedMult;
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
  if (player.grounded && player.attackId === 'grab') {
    player.vx = approach(player.vx, 0, GROUND_FRICTION * FIXED_DT);
  } else if (player.grounded && player.attackId === 'dash') {
    // The dash attack slides on with the dash's speed, slowing down.
    player.vx = approach(player.vx, 0, DASH_ATTACK_FRICTION * FIXED_DT);
  } else if (player.grounded) {
    // Keep running while attacking, a bit slower. A dash-attack bleeds its extra speed off.
    const dir = Number(input.right) - Number(input.left);
    const accel = dir !== 0 ? GROUND_ACCEL : GROUND_FRICTION;
    const speed = RUN_SPEED * characterOf(player).speedMult * ATTACK_MOVE_SPEED_MULT;
    player.vx = approach(player.vx, dir * speed, accel * FIXED_DT);
  } else {
    applyRun(player, input);
  }
}

/** You only turn around on the ground: in the air the facing stays, so back aerials exist. */
function applyFacing(player: Player, input: PlayerInput): void {
  if (!player.grounded) return;
  const dir = Number(input.right) - Number(input.left);
  if (dir !== 0) player.facing = dir === 1 ? 1 : -1;
}

function applyJump(player: Player, input: PlayerInput): void {
  const pressed = input.jump && !player.jumpHeld;
  const released = !input.jump && player.jumpHeld;

  // Air jumps only ever come from a fresh press: a buffered press waits for the ground.
  if (player.jumpBufferTicks > 0 && (player.grounded || player.coyoteTicks > 0)) {
    jump(player, JUMP_SPEED);
    // Buffered and already released: it comes out as a short hop.
    if (!input.jump) player.vy *= JUMP_CUT;
  } else if (pressed && player.airJumpsLeft > 0) {
    player.airJumpsLeft -= 1;
    jump(player, DOUBLE_JUMP_SPEED);
  } else if (released && player.vy < 0 && !player.fullJump) {
    player.vy *= JUMP_CUT;
  }
}

export function jump(player: Player, speed: number): void {
  player.vy = -speed;
  player.grounded = false;
  player.shielding = false;
  player.shieldStunTicks = 0;
  player.fullJump = false;
  player.fastFalling = false;
  player.coyoteTicks = 0;
  player.jumpBufferTicks = 0;
}

/** Holding down while standing on a platform lets you fall through it. */
function applyDropThrough(player: Player, input: PlayerInput): void {
  if (input.down && player.grounded && player.onPlatform) {
    player.dropTicks = DROP_THROUGH_TICKS;
    player.coyoteTicks = 0;
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
  player.ledgeInvulnAvailable = true;
}

/** Moves `value` towards `target` by at most `maxDelta`, without overshooting. */
function approach(value: number, target: number, maxDelta: number): number {
  if (value < target) return Math.min(value + maxDelta, target);
  return Math.max(value - maxDelta, target);
}
