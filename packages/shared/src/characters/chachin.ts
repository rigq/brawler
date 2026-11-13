import type { CharacterDefinition } from './types.ts';

/**
 * Chachin: the smallest and fastest, and he screams like mad. Light, so he
 * flies out early; his small body is harder to hit.
 */
export const chachin: CharacterDefinition = {
  name: 'Chachin',
  stats: { speed: 5, weight: 1, damage: 3, reach: 3 },
  size: { width: 30, height: 46 },
  attacks: {
    /**
     * "Grito": a shockwave all around him. Close up (the sweet spot) it hurts
     * more and stuns longer; further away it still stuns a little. Barely launches,
     * so he can keep hitting. Boxes are centred on his 30×46 body.
     */
    specialNeutral: {
      // No projectile: the scream is the hitbox itself (the generic special fires one).
      projectile: undefined,
      startup: 10, active: 4, recovery: 24, cooldownTicks: 90,
      box: { x: -59, y: -47, width: 148, height: 140 },
      damage: 4, kbBase: 150, kbScale: 3, kbX: 1, kbY: -0.4, stunTicks: 22,
      sweetspot: { box: { x: -25, y: -20, width: 80, height: 86 }, damage: 9, kbBase: 200, kbScale: 4, stunTicks: 42 },
    },
    /** "Grito-cohete": screams at the ground and shoots up; the blast hits whoever is below. */
    specialUp: {
      startup: 0, active: 6, recovery: 18, box: { x: -10, y: 30, width: 50, height: 70 },
      damage: 5, kbBase: 300, kbScale: 10, kbX: 0.3, kbY: 0.8, launchSpeed: 1250,
    },
  },
};
