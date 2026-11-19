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
    /**
     * "Cañonazo": the tank rolls in behind him (startup) and fires a slow, heavy shell. Ground only.
     * 20 nov: hold the button to charge it for up to 1 s: at full charge the shell
     * is 1.6 times as big (was 2: Donate got the bombs below), hits 50 % harder
     * and flies a bit slower (it is heavier).
     */
    specialNeutral: {
      startup: 20, active: 1, recovery: 36, groundOnly: true, cooldownTicks: 120,
      chargeTicks: 60, chargedProjectile: { size: 1.6, power: 1.5, speed: 0.8 },
      projectile: { kind: 'shell', speed: 496, width: 44, height: 13, offsetX: 20, offsetY: 10, lifetimeTicks: 150 },
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
      damage: 6, kbBase: 320, kbScale: 13, kbX: 0.4, kbY: -0.3, launchSpeed: 1080, parachute: true,
      parachuteDrops: { attack: 'specialPick1', count: 3 },
    },
    /**
     * "Bombardeo": under the parachute the special drops a small bomb straight down
     * (3 per glide, one every ~0.5 s). Weak on purpose: it annoys, it does not kill.
     */
    specialPick1: {
      startup: 3, active: 1, recovery: 24, box: { x: 0, y: 0, width: 0, height: 0 }, freeOfCooldown: true,
      damage: 5, kbBase: 260, kbScale: 4, kbX: 0.3, kbY: -1,
      projectile: {
        kind: 'bomb', speed: 0, speedY: 120, gravity: 1000, width: 12, height: 12, offsetX: -26, offsetY: 70,
        lifetimeTicks: 120, hitAttack: 'specialPick1',
      },
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
  },
};
