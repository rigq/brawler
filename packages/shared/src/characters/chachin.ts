import type { CharacterDefinition } from './types.ts';

/**
 * Chachin: the smallest and fastest, and he screams like mad. Light, so he
 * flies out early; his small body is harder to hit.
 */
export const chachin: CharacterDefinition = {
  name: 'Chachin',
  stats: { speed: 5, weight: 1, damage: 3, reach: 3 },
  size: { width: 30, height: 54 },
  attacks: {
    /**
     * "Grito": a shockwave all around him. Close up (the sweet spot) it hurts
     * more and stuns longer; further away it still stuns a little. Barely launches,
     * so he can keep hitting. Boxes are centred on his 30×46 body.
     */
    specialNeutral: {
      // No projectile: the scream is the hitbox itself (the generic special fires one).
      projectile: undefined,
      // 18 nov (playtest: too strong): smaller, less stun (it led into free combos), slower to come out and to repeat.
      startup: 14, active: 4, recovery: 26, cooldownTicks: 150,
      box: { x: -40, y: -30, width: 120, height: 110 },
      damage: 3, kbBase: 150, kbScale: 3, kbX: 1, kbY: -0.4, stunTicks: 12,
      sweetspot: { box: { x: -20, y: -12, width: 70, height: 76 }, damage: 7, kbBase: 200, kbScale: 4, stunTicks: 24 },
    },
    // His own normals (phase 3): fast and many small hits; he wins by combos, not by one big hit.
    jab1: { startup: 2, recovery: 9 },
    jab2: { startup: 2, recovery: 9 },
    /** "Molinillo": spins in the air hitting 4 times (every 4 ticks), 2 % each. */
    airNeutral: { startup: 3, active: 16, rehitTicks: 4, damage: 2, kbBase: 160, kbScale: 2, kbX: 0.4, kbY: -0.4, landingLag: 4 },
    /** "Ventilador": flailing above his head, 3 hits that keep the rival up there. */
    lightUp: { active: 12, rehitTicks: 4, damage: 2, kbBase: 200, kbScale: 2, kbX: 0, kbY: -1 },
    /** "Grito-cohete": screams at the ground and shoots up; the blast hits whoever is below. */
    specialUp: {
      startup: 0, active: 6, recovery: 18, box: { x: -10, y: 30, width: 50, height: 70 },
      damage: 5, kbBase: 300, kbScale: 10, kbX: 0.3, kbY: 0.8, launchSpeed: 1120,
    },
  },
};
