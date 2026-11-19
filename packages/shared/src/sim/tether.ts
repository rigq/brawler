// Tether recovery (AttackData.tether): hooks the nearest ledge in reach and
// pulls the player to it, ending hanging from it. With nothing in reach it
// only gives a small lift, so missing it is punishable.

import { FIXED_DT } from '../constants.ts';
import { attackData, attackPhase } from '../combat/attacks.ts';
import type { StageGeometry } from './collision.ts';
import { grabLedge } from './ledge.ts';
import type { Player } from './player.ts';

/** How far inside the island's edge the player may still be and hook that edge (px). */
const HOOK_INSIDE = 20;

/**
 * Runs after gravity and before moving. The ledge is picked the moment the
 * special is pressed (what you see in reach is what you get, even if the launch
 * carries you on while typing); the pull starts with the active phase.
 */
export function updateTether(player: Player, stage: StageGeometry): void {
  if (player.attackId === 'none') return;
  const data = attackData(player, player.attackId);
  if (!data.tether) return;
  if (player.attackTick === 0 && !player.attackCharging) hook(player, stage, data.tether.range);
  if (attackPhase(player) !== 'active') return;
  if (player.tetherSide !== 0) pull(player, stage, data.tether.speed);
  else if (player.attackTick === data.startup) player.vy = -data.tether.missLift;
}

function hook(player: Player, stage: StageGeometry, range: number): void {
  const target = tetherTarget(player, stage, range);
  player.tetherSide = target?.side ?? 0;
  player.tetherX = target?.x ?? 0;
  player.tetherY = target?.y ?? 0;
}

/** The ledge corner a tether of `range` px would hook now (the nearest one beside the player), or null. */
export function tetherTarget(player: Player, stage: StageGeometry, range: number): { side: -1 | 1; x: number; y: number } | null {
  const handX = player.x + player.width / 2;
  const handY = player.y;
  let best: { side: -1 | 1; x: number; y: number } | null = null;
  let bestDistance = range * range;
  for (const solid of stage.solids) {
    for (const side of [-1, 1] as const) {
      const cornerX = side === -1 ? solid.x : solid.x + solid.width;
      // Only an edge you are beside (or just past), not one across the island.
      const outside = side === -1 ? handX <= solid.x + HOOK_INSIDE : handX >= solid.x + solid.width - HOOK_INSIDE;
      const dx = cornerX - handX;
      const dy = solid.y - handY;
      // Squared distances: no square root needed to compare.
      const distance = dx * dx + dy * dy;
      if (outside && distance <= bestDistance) {
        bestDistance = distance;
        best = { side, x: cornerX, y: solid.y };
      }
    }
  }
  return best;
}

/** Towards the hanging spot at `speed`; once there, it is a ledge grab. */
function pull(player: Player, stage: StageGeometry, speed: number): void {
  const index = stage.solids.findIndex(
    (solid) => solid.y === player.tetherY && (solid.x === player.tetherX || solid.x + solid.width === player.tetherX),
  );
  const solid = stage.solids[index];
  if (!solid) return;
  const side = player.tetherSide;
  const goalX = side === -1 ? solid.x - player.width : solid.x + solid.width;
  const goalY = solid.y;
  const dx = goalX - player.x;
  const dy = goalY - player.y;
  // Math.sqrt is exact in every JS engine: deterministic.
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance <= speed * FIXED_DT) {
    player.tetherSide = 0;
    grabLedge(player, solid, index, side);
    return;
  }
  player.vx = (dx / distance) * speed;
  player.vy = (dy / distance) * speed;
}
