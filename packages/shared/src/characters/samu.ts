import type { CharacterDefinition } from './types.ts';

/**
 * Samu: volleyball player with a backpack full of weights. Balanced but slow
 * and heavy; if one of his heavy attacks misses, the backpack pulls him back.
 */
export const samu: CharacterDefinition = {
  name: 'Samu',
  stats: { speed: 2, weight: 4, damage: 3, reach: 3 },
  attacks: {
    /** "Remate": spikes a ball that flies down diagonally and bounces once. Works in the air too. */
    specialNeutral: {
      startup: 12, active: 1, recovery: 22, cooldownTicks: 70,
      projectile: {
        kind: 'ball', speed: 520, speedY: 380, gravity: 900, bounces: 1,
        width: 16, height: 16, offsetX: 0, offsetY: -6, lifetimeTicks: 90,
      },
    },
    /** The ball. */
    specialProjectile: { damage: 9, kbBase: 330, kbScale: 9, kbX: 1, kbY: -0.6 },
    /**
     * "A la bandera": hovers still for a moment (you can see it coming), then
     * teleports to his flag, planted where he last stood. Always gets him back.
     */
    specialUp: {
      startup: 18, active: 1, recovery: 14, box: { x: 0, y: 0, width: 0, height: 0 },
      damage: 0, kbBase: 0, kbScale: 0, kbX: 1, kbY: 0, hover: true, teleportToFlag: true, cooldownTicks: 150,
    },
    /** The backpack: a missed heavy attack leaves him stumbling backwards. */
    heavySide: { whiffLagTicks: 14 },
    heavyUp: { whiffLagTicks: 14 },
    heavyDown: { whiffLagTicks: 14 },
  },
};
