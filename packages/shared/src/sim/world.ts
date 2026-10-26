// The whole game state for one match. Grows with each task.

import { FALL_RESET_Y, GROUND, PLATFORMS, SPAWN_P1 } from '../constants.ts';
import { EMPTY_INPUT, type PlayerInput } from '../input.ts';
import type { Rect } from '../math/rect.ts';
import type { StageGeometry } from './collision.ts';
import { createPlayer, stepPlayer, teleportPlayer, type Player } from './player.ts';

export interface World extends StageGeometry {
  /** Number of fixed steps simulated since the match started. */
  tick: number;
  players: Player[];
  solids: Rect[];
  platforms: Rect[];
}

export function createWorld(): World {
  return {
    tick: 0,
    players: [createPlayer(SPAWN_P1)],
    solids: [{ ...GROUND }],
    platforms: PLATFORMS.map((platform) => ({ ...platform })),
  };
}

/**
 * Advances the world by exactly one fixed step (FIXED_DT seconds).
 * `inputs[i]` belongs to `world.players[i]`; missing inputs count as nothing pressed.
 */
export function stepWorld(world: World, inputs: readonly PlayerInput[]): void {
  world.players.forEach((player, i) => {
    stepPlayer(player, inputs[i] ?? EMPTY_INPUT, world);
    if (player.y > FALL_RESET_Y) teleportPlayer(player, SPAWN_P1);
  });
  world.tick += 1;
}
