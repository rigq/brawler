// The whole game state for one match. Grows with each task.

import { resolveGrabs } from '../combat/grabs.ts';
import { resolveHits } from '../combat/hits.ts';
import type { CharacterId } from '../characters/index.ts';
import { GROUND, PLATFORMS, SPAWNS } from '../constants.ts';
import { EMPTY_INPUT, type PlayerInput } from '../input.ts';
import type { Rect } from '../math/rect.ts';
import type { StageGeometry } from './collision.ts';
import { createPlayer, stepPlayer, type Player } from './player.ts';
import { advanceRespawn, isActive, isOutsideBlastZone, knockOut } from './stocks.ts';

export interface World extends StageGeometry {
  /** Number of fixed steps simulated since the match started. */
  tick: number;
  /** One per entry in SPAWNS; players[i] uses SPAWNS[i]. They pass through each other. */
  players: Player[];
  solids: Rect[];
  platforms: Rect[];
}

/** `characters[i]` is player i's character; missing ones get the default. */
export function createWorld(characters: readonly CharacterId[] = []): World {
  return {
    tick: 0,
    players: SPAWNS.map((spawn, i) => createPlayer(spawn, characters[i])),
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
    const spawn = SPAWNS[i];
    if (isActive(player)) stepPlayer(player, inputs[i] ?? EMPTY_INPUT, world);
    else if (spawn) advanceRespawn(player, spawn);
  });
  // After everyone has moved, so hits use this step's final positions.
  resolveHits(world.players);
  resolveGrabs(world.players);
  for (const player of world.players) {
    if (isActive(player) && isOutsideBlastZone(player)) knockOut(player);
  }
  world.tick += 1;
}
