import type { CharacterDefinition } from './types.ts';

/** Fast and light: hits a lot up close, dies early. */
export const rushdown: CharacterDefinition = {
  name: 'Rápido',
  stats: { speed: 5, weight: 1, damage: 3, reach: 3 },
  attacks: {
    lightSide: { startup: 4, recovery: 8 },
    airForward: { startup: 5 },
  },
};
