import type { CharacterDefinition } from './types.ts';

/** Keeps opponents away with long attacks. Its projectile will be a special (P2). */
export const zoner: CharacterDefinition = {
  name: 'Alcance',
  stats: { speed: 3, weight: 2, damage: 3, reach: 4 },
  attacks: {
    lightSide: { recovery: 13 },
    heavySide: { recovery: 26 },
  },
};
