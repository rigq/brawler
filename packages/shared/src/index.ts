// Entry point for game logic shared by client and server.
// Must stay pure: no DOM, no Phaser, no Node APIs.

export const GAME_TITLE = 'Brawler';

export * from './constants.ts';
export * from './input.ts';
export * from './math/rect.ts';
export * from './loop/FixedStepAccumulator.ts';
export * from './sim/collision.ts';
export * from './sim/dodge.ts';
export * from './sim/player.ts';
export * from './sim/world.ts';
