import type { CharacterDefinition } from './types.ts';

/**
 * Robert: the neighbourhood gangster. Heavy: survives to very high damage and
 * hits hard, but he is the slowest and his recovery barely lifts him.
 */
export const robert: CharacterDefinition = {
  name: 'Robert',
  stats: { speed: 1, weight: 5, damage: 4, reach: 2 },
  size: { width: 40, height: 74 },
  attacks: {
    /**
     * "Calada": a puff of smoke that drifts forward and hits up to 4 times while
     * it lasts. Weak hits that keep the rival inside it; it also wears shields down.
     */
    specialNeutral: {
      startup: 8, active: 1, recovery: 24, cooldownTicks: 100,
      projectile: {
        kind: 'smoke', speed: 70, width: 40, height: 50, offsetX: -6, offsetY: 4,
        lifetimeTicks: 80, hits: 4, hitIntervalTicks: 14,
      },
    },
    /** Each hit of the smoke. */
    specialProjectile: { damage: 3, kbBase: 120, kbScale: 4, kbX: 1, kbY: -0.3 },
    /**
     * "Aúpa del rapero": his rapper friend pops up under him and throws him up.
     * Short (he is heavy); the push hits whoever is right below. It is active from
     * the first tick: a moment later he is already too high for it to reach anyone.
     */
    specialUp: {
      startup: 0, active: 7, recovery: 19, box: { x: -12, y: 40, width: 64, height: 70 },
      damage: 6, kbBase: 340, kbScale: 12, kbX: 0.5, kbY: -0.6, launchSpeed: 1120,
    },
  },
};
