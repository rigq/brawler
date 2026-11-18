import type { CharacterDefinition } from './types.ts';

/**
 * Donate: heir of the (fictional) National Guard of Segovia. Zoner: his dad's
 * tank fires from afar. Weak point: absent-minded, so his specials leave him
 * standing there for a long time.
 */
export const donate: CharacterDefinition = {
  name: 'Donate',
  stats: { speed: 3, weight: 2, damage: 3, reach: 4 },
  attacks: {
    /** "Cañonazo": the tank rolls in behind him (startup) and fires a slow, heavy shell. Ground only. */
    specialNeutral: {
      startup: 20, active: 1, recovery: 36, groundOnly: true, cooldownTicks: 120,
      projectile: { kind: 'shell', speed: 620, width: 44, height: 13, offsetX: 20, offsetY: 10, lifetimeTicks: 150 },
    },
    /** The shell itself. */
    specialProjectile: { damage: 12, kbBase: 400, kbScale: 7, kbX: 1, kbY: -0.45 },
    /**
     * "Salto de mortero": the cannon blasts him upwards (the blast hits whoever
     * is just below, from the first tick, before he is out of reach), then he
     * comes down slowly under a parachute, unable to attack.
     */
    specialUp: {
      startup: 0, active: 6, recovery: 16, box: { x: -10, y: 40, width: 60, height: 70 },
      damage: 6, kbBase: 320, kbScale: 13, kbX: 0.4, kbY: -0.3, launchSpeed: 1350, parachute: true,
    },
    // His own normals (phase 3): a disciplined soldier who controls the space in front of him.
    /** "¡Firmes!": a flat push that sends you far away, to the edge. */
    lightSide: { kbBase: 380, kbScale: 9, kbY: -0.25 },
    /** "Bayoneta": stays out long (6 ticks): easy to land when someone jumps in. */
    airForward: { active: 6, damage: 8 },
    /** Spin kick that lingers. */
    airNeutral: { active: 10 },
    /** "Coz": the back kick is his kill move in the air. */
    airBack: { kbBase: 420, kbScale: 9.5 },
    /** "Carga de infantería": a long slide. */
    dash: { active: 8 },
  },
};
