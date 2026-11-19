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
     * "A la bandera": hovers still for a moment, then teleports to his flag,
     * planted where he last stood. 19 nov (playtest: "it always saves him"):
     * the flag expires after 2.5 s in the air, the hover is long enough to be hit
     * out of (28 ticks), and he arrives unable to act for a while (22 ticks), so
     * someone waiting at the flag can punish him.
     */
    specialUp: {
      startup: 28, active: 1, recovery: 22, box: { x: 0, y: 0, width: 0, height: 0 },
      damage: 0, kbBase: 0, kbScale: 0, kbX: 1, kbY: 0, hover: true, teleportToFlag: true, cooldownTicks: 150,
      flagLifetimeTicks: 150, flagRange: 800,
    },
    // His own normals (phase 3): volleyball. Sets up the rival in the air and spikes them down.
    /** "Colocación": pops the rival straight up, always to about the same height: start of a juggle. */
    lightUp: { damage: 4, kbBase: 420, kbScale: 4, kbX: 0, kbY: -1 },
    /** "Toque": keeps them up there. */
    airUp: { damage: 5, kbBase: 300, kbScale: 6, kbX: 0.1, kbY: -1 },
    /** "Remate": a spike forward and down. Off the stage it buries them. */
    airForward: { startup: 8, damage: 10, kbBase: 260, kbScale: 9, kbX: 1, kbY: 0.7 },
    /** "Bloqueo": both hands slam down. The strongest spike of the game; long landing. */
    airDown: { startup: 9, damage: 11, kbBase: 400, kbScale: 8, kbX: 0, kbY: 1, landingLag: 12 },
    /** The backpack: a missed heavy attack leaves him stumbling backwards. */
    heavySide: { whiffLagTicks: 14 },
    heavyUp: { whiffLagTicks: 14 },
    heavyDown: { whiffLagTicks: 14 },
  },
};
