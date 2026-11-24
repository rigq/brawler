// Getting back to the stage: what the CPU does by default off the stage, and
// how it expects the rival to come back (to guard the edge).

import { attackData, flagReachable } from '../combat/attacks.ts';
import { EMPTY_INPUT, type PlayerInput } from '../input.ts';
import type { Rect } from '../math/rect.ts';
import type { StageGeometry } from '../sim/collision.ts';
import type { Player } from '../sim/player.ts';
import { tetherTarget } from '../sim/tether.ts';

/** Below the top of the stage by more than this (px, feet), it is time to use the jumps. */
const LOW_MARGIN = -40;
/** Closer than this to the ledge (px, horizontally), the up special goes straight up. */
const STRAIGHT_UP_RANGE = 60;

/** The stage block under or nearest to the player (by horizontal distance). */
export function nearestSolid(player: Player, stage: StageGeometry): Rect | undefined {
  const cx = player.x + player.width / 2;
  let best: Rect | undefined;
  let bestGap = Infinity;
  for (const solid of stage.solids) {
    const gap = cx < solid.x ? solid.x - cx : cx > solid.x + solid.width ? cx - solid.x - solid.width : 0;
    if (gap < bestGap) {
      bestGap = gap;
      best = solid;
    }
  }
  return best;
}

/** In the air and not above the stage (beside it, or below its top): has to come back. */
export function isOffstage(player: Player, stage: StageGeometry): boolean {
  if (player.grounded || player.ledgeSide !== 0) return false;
  const solid = nearestSolid(player, stage);
  if (!solid) return true;
  const cx = player.x + player.width / 2;
  const beside = cx < solid.x || cx > solid.x + solid.width;
  return beside || player.y + player.height > solid.y;
}

/**
 * A sensible way back: towards the nearest ledge (out from under the stage
 * first); a teleport or a tether that can reach goes at once; otherwise, once
 * low, every air jump, then the up heavy's lift, then the up special.
 */
export function recoveryInput(player: Player, stage: StageGeometry): PlayerInput {
  const solid = nearestSolid(player, stage);
  if (!solid) return EMPTY_INPUT;
  const dir = ledgeDirection(player, solid);
  const input: PlayerInput = { ...EMPTY_INPUT, left: dir < 0, right: dir > 0 };
  if (player.attackId !== 'none' || player.hitstunTicks > 0) return input;
  const up = attackData(player, 'specialUp');
  const quick = (up.teleportToFlag && flagReachable(player)) || (up.tether !== undefined && tetherTarget(player, stage, up.tether.range) !== null);
  if (quick && player.recoveryAvailable) return { ...input, up: true, special: true };
  const low = player.vy > 0 && player.y + player.height > solid.y + LOW_MARGIN;
  if (!low) return input;
  if (player.airJumpsLeft > 0) return { ...input, jump: !player.jumpHeld };
  const straight = Math.abs(ledgeX(player, solid) - (player.x + player.width / 2)) < STRAIGHT_UP_RANGE;
  const tilt = straight ? { left: false, right: false } : {};
  if (player.airBoostAvailable) return { ...input, ...tilt, up: true, heavy: !player.heavyHeld };
  if (player.recoveryAvailable && !up.teleportToFlag) return { ...input, ...tilt, up: true, special: !player.specialHeld };
  return input;
}

/** The x of the ledge it is heading for. */
function ledgeX(player: Player, solid: Rect): number {
  const cx = player.x + player.width / 2;
  return cx < solid.x + solid.width / 2 ? solid.x : solid.x + solid.width;
}

/** -1 or 1: towards the ledge, or out from under the stage if below its top. */
function ledgeDirection(player: Player, solid: Rect): number {
  const cx = player.x + player.width / 2;
  const below = player.y + player.height > solid.y;
  const leftHalf = cx < solid.x + solid.width / 2;
  if (cx < solid.x) return 1;
  if (cx > solid.x + solid.width) return -1;
  // Above the stage: towards the middle. Under it: out by the nearer side.
  if (!below) return leftHalf ? 1 : -1;
  return leftHalf ? -1 : 1;
}
