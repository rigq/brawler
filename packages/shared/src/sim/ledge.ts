// Hanging from the edge of the stage. Falling next to a ledge grabs it; from
// there you choose how to get back, and the opponent tries to guess which way.

import {
  AIR_JUMPS,
  JUMP_SPEED,
  LEDGE_CLIMB_LAG_TICKS,
  LEDGE_GRAB_ABOVE,
  LEDGE_GRAB_BELOW,
  LEDGE_GRAB_REACH,
  LEDGE_HANG_TICKS,
  LEDGE_INVULN_TICKS,
  LEDGE_JUMP_PUSH_SPEED,
  LEDGE_REGRAB_TICKS,
} from '../constants.ts';
import { startLedgeAttack } from '../combat/attacks.ts';
import type { PlayerInput } from '../input.ts';
import type { Rect } from '../math/rect.ts';
import type { StageGeometry } from './collision.ts';
import { startRoll } from './dodge.ts';
import { jump, type Player } from './player.ts';

export interface LedgeState {
  /** -1 hanging from a left edge, 1 from a right edge, 0 not hanging. */
  ledgeSide: number;
  /** Index in stage.solids of the ledge being held. */
  ledgeSolid: number;
  /** Ticks left before the grip gives out. */
  ledgeTicks: number;
  /** Ticks left before you can grab a ledge again after letting go. */
  ledgeRegrabTicks: number;
  /** The invulnerability works once until you touch the ground again. */
  ledgeInvulnAvailable: boolean;
}

export function createLedgeState(): LedgeState {
  return { ledgeSide: 0, ledgeSolid: 0, ledgeTicks: 0, ledgeRegrabTicks: 0, ledgeInvulnAvailable: true };
}

/** Runs after moving, while airborne: grabs a ledge if the player is falling right next to one. */
export function tryGrabLedge(player: Player, input: PlayerInput, stage: StageGeometry): void {
  if (player.vy < 0 || player.hitstunTicks > 0 || player.dodgeKind !== 'none') return;
  if (player.ledgeRegrabTicks > 0 || input.down) return;
  stage.solids.forEach((solid, i) => {
    const side = nearbySide(player, solid);
    const dir = Number(input.right) - Number(input.left);
    // Holding away from the stage means you want to fall, not hang.
    if (side !== 0 && dir !== side && player.ledgeSide === 0) grabLedge(player, solid, i, side);
  });
}

/** Runs instead of the normal step while hanging. Every option is a fresh press. */
export function updateLedge(player: Player, input: PlayerInput, stage: StageGeometry): void {
  const solid = stage.solids[player.ledgeSolid];
  const toStage = -player.ledgeSide;
  const dir = Number(input.right) - Number(input.left);
  const fresh = {
    jump: input.jump && !player.jumpHeld,
    attack: (input.light && !player.lightHeld) || (input.heavy && !player.heavyHeld),
    dodge: input.dodge && !player.dodgeHeld,
    dir: dir !== 0 && dir !== player.dirHeld,
  };
  player.jumpHeld = input.jump;
  player.lightHeld = input.light;
  player.heavyHeld = input.heavy;
  player.dodgeHeld = input.dodge;
  player.dirHeld = dir;
  player.ledgeTicks -= 1;

  if (!solid || player.ledgeTicks <= 0 || input.down || (fresh.dir && dir !== toStage)) {
    letGo(player);
  } else if (fresh.jump) {
    player.ledgeSide = 0;
    jump(player, JUMP_SPEED);
    // A quick tap must still clear the ledge, or you would just hang on again.
    player.fullJump = true;
    player.vx = toStage * LEDGE_JUMP_PUSH_SPEED;
  } else if (fresh.attack) {
    climb(player, solid);
    startLedgeAttack(player);
  } else if (fresh.dodge) {
    climb(player, solid);
    startRoll(player, toStage);
  } else if (fresh.dir) {
    climb(player, solid);
    player.lagTicks = LEDGE_CLIMB_LAG_TICKS;
  }
}

/** -1 or 1 if the player's body is right beside that edge of `solid`, else 0. */
function nearbySide(player: Player, solid: Rect): number {
  const top = player.y;
  if (top < solid.y - LEDGE_GRAB_ABOVE || top > solid.y + LEDGE_GRAB_BELOW) return 0;
  if (Math.abs(player.x + player.width - solid.x) <= LEDGE_GRAB_REACH) return -1;
  if (Math.abs(player.x - (solid.x + solid.width)) <= LEDGE_GRAB_REACH) return 1;
  return 0;
}

function grabLedge(player: Player, solid: Rect, index: number, side: number): void {
  player.ledgeSide = side;
  player.ledgeSolid = index;
  player.ledgeTicks = LEDGE_HANG_TICKS;
  player.x = side === -1 ? solid.x - player.width : solid.x + solid.width;
  player.y = solid.y;
  player.vx = 0;
  player.vy = 0;
  player.fastFalling = false;
  player.attackId = 'none';
  player.attackCharging = false;
  player.facing = side === -1 ? 1 : -1;
  player.airJumpsLeft = AIR_JUMPS;
  player.airDodgeAvailable = true;
  player.recoveryAvailable = true;
  if (player.ledgeInvulnAvailable) {
    player.ledgeInvulnAvailable = false;
    player.invulnTicks = Math.max(player.invulnTicks, LEDGE_INVULN_TICKS);
  }
}

function letGo(player: Player): void {
  player.ledgeSide = 0;
  player.ledgeRegrabTicks = LEDGE_REGRAB_TICKS;
}

/** Stands on top of the stage, at the edge that was being held. */
function climb(player: Player, solid: Rect): void {
  player.x = player.ledgeSide === -1 ? solid.x : solid.x + solid.width - player.width;
  player.y = solid.y - player.height;
  player.prevX = player.x;
  player.prevY = player.y;
  player.grounded = true;
  player.ledgeSide = 0;
}
