import type { CharacterDefinition } from './types.ts';

/** The reference for balancing: every other character is compared with this one. */
export const balanced: CharacterDefinition = {
  name: 'Equilibrado',
  stats: { speed: 3, weight: 3, damage: 3, reach: 3 },
};
