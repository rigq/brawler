// The whole game state for one match. Grows with each task (players in F1.1).

export interface World {
  /** Number of fixed steps simulated since the match started. */
  tick: number;
}

export function createWorld(): World {
  return { tick: 0 };
}

/** Advances the world by exactly one fixed step (FIXED_DT seconds). */
export function stepWorld(world: World): void {
  world.tick += 1;
}
