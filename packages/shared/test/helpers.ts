// Small tools shared by the tests. Not part of the game.

import { EMPTY_INPUT, type PlayerInput } from '../src/input.ts';
import { stepWorld, type World } from '../src/sim/world.ts';

const ACTIONS = Object.keys(EMPTY_INPUT) as (keyof PlayerInput)[];

/**
 * Tiny seeded random generator (mulberry32): same seed, same numbers, every run.
 * The game itself never needs one; the tests use it to invent button mashing.
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A long list of plausible inputs: each button is held for a random number of
 * ticks, like a player mashing. Same seed → same list.
 */
export function mashing(seed: number, ticks: number, holdMaxTicks = 20): PlayerInput[] {
  const random = seededRandom(seed);
  const current: PlayerInput = { ...EMPTY_INPUT };
  const holdLeft = new Map<keyof PlayerInput, number>();
  const list: PlayerInput[] = [];
  for (let tick = 0; tick < ticks; tick++) {
    for (const action of ACTIONS) {
      const left = (holdLeft.get(action) ?? 0) - 1;
      if (left > 0) {
        holdLeft.set(action, left);
        continue;
      }
      current[action] = random() < 0.3;
      holdLeft.set(action, 1 + Math.floor(random() * holdMaxTicks));
    }
    list.push({ ...current });
  }
  return list;
}

/** Steps `world` once per entry, player i reading scripts[i][tick]. */
export function play(world: World, scripts: readonly PlayerInput[][], ticks: number): void {
  for (let tick = 0; tick < ticks; tick++) {
    stepWorld(world, scripts.map((script) => script[tick] ?? EMPTY_INPUT));
  }
}

/** Runs `ticks` steps with nobody pressing anything. */
export function idle(world: World, ticks: number): void {
  play(world, [], ticks);
}

/** The whole world as text, to compare two worlds field by field. */
export function snapshot(world: World): string {
  return JSON.stringify(world);
}
