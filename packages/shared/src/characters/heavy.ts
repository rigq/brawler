import type { CharacterDefinition } from './types.ts';

/** Slow and heavy: survives to high damage and hits hard, but is easy to combo. */
export const heavy: CharacterDefinition = {
  name: 'Pesado',
  stats: { speed: 1, weight: 5, damage: 4, reach: 2 },
  attacks: {
    heavySide: { startup: 12, kbBase: 560 },
    airDown: { startup: 10, kbBase: 400 },
  },
};
