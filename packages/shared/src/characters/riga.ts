import type { CharacterDefinition } from './types.ts';

/** No hitbox: these specials hit through a projectile, a counter or nothing at all. */
const NO_BOX = { x: 0, y: 0, width: 0, height: 0 };

/**
 * Riga: the tallest fighter (1.95 m), a tech guy who solves everything with AI.
 * Long arms and legs: he reaches far but hits lightly up close.
 */
export const riga: CharacterDefinition = {
  name: 'Riga',
  stats: { speed: 3, weight: 3, damage: 2, reach: 4 },
  // Taller than everyone (Robert 74); thin in profile.
  size: { width: 36, height: 80 },
  attacks: {
    /**
     * "Ruleta de IAs": hold the special and an AI icon cycles over his head every
     * 1/3 s (Claude → ChatGPT → Gemini → Alucinación → …); letting go starts that attack.
     * Charging is not luck: with practice you pick the one you want, and the rival
     * sees it coming. Full charge (2 s) starts whichever is showing.
     */
    specialNeutral: {
      startup: 1, active: 1, recovery: 1, box: NO_BOX, damage: 0, kbBase: 0, kbScale: 0, kbX: 1, kbY: 0,
      // The roulette itself fires nothing; each option does. Cooldown 1: just so it cannot restart while an option's is running.
      projectile: undefined, cooldownTicks: 1,
      chargeTicks: 120, chargeInAir: true,
      roulette: { stepTicks: 20, options: ['specialPick1', 'specialPick2', 'specialPick3', 'specialPick4'] },
    },
    /**
     * Claude, "Lo siento, no puedo ayudarte con eso": a counter. For 20 ticks a
     * hit on him is refused and the attacker is launched instead; a projectile
     * just vanishes. Missing it leaves him open for a while.
     */
    specialPick1: {
      startup: 4, active: 20, recovery: 26, box: NO_BOX,
      damage: 8, kbBase: 420, kbScale: 9, kbX: 1, kbY: -0.6, counter: true,
    },
    /**
     * ChatGPT, "Respuesta larguísima": a burst of 5 text bubbles, fast and weak,
     * that keep pushing the rival back. Its hits use this attack's numbers.
     */
    specialPick2: {
      startup: 10, active: 25, recovery: 18, box: NO_BOX, cooldownTicks: 60,
      damage: 2, kbBase: 170, kbScale: 2, kbX: 1, kbY: -0.2,
      projectile: {
        kind: 'bubble', speed: 520, width: 18, height: 14, offsetX: 0, offsetY: 14, lifetimeTicks: 40,
        shots: 5, shotIntervalTicks: 6, shotOffsetsY: [0, -10, 6, -6, 10], hitAttack: 'specialPick2',
      },
    },
    /**
     * Gemini, "Géminis": twin stars, one forwards and one backwards, that turn
     * round after half a second and come back to him (each can hit going and coming).
     */
    specialPick3: {
      startup: 12, active: 1, recovery: 26, box: NO_BOX, cooldownTicks: 90,
      damage: 6, kbBase: 300, kbScale: 6, kbX: 1, kbY: -0.5,
      projectile: {
        kind: 'star', speed: 420, width: 16, height: 16, offsetX: -8, offsetY: 18, lifetimeTicks: 90,
        returnAfterTicks: 30, bothSides: true, hits: 2, hitIntervalTicks: 20, hitAttack: 'specialPick3',
      },
    },
    /**
     * "Alucinación": a see-through clone of him runs ahead along the stage and
     * blows up when it touches the rival (or after a second).
     */
    specialPick4: {
      startup: 10, active: 1, recovery: 24, box: NO_BOX, cooldownTicks: 90,
      damage: 7, kbBase: 380, kbScale: 7, kbX: 1, kbY: -0.6,
      projectile: {
        // offsetY is scaled by his height (×80/60): 3 → 4 px, feet exactly on his feet. Any lower and it starts inside the floor and bursts.
        kind: 'clone', speed: 300, gravity: 1248, width: 30, height: 76, offsetX: 4, offsetY: 3,
        lifetimeTicks: 60, walker: true, hitAttack: 'specialPick4',
      },
    },
    /**
     * "Prompt de emergencia": frozen still in the air for 0.3 s, typing (easy to
     * hit if you are close: that is the price), then a giant cursor
     * hooks the nearest ledge within 580 px (picked the moment you press it) and pulls him to it, hanging. With no
     * ledge in reach it only lifts him a little: miss it and you fall.
     */
    specialUp: {
      startup: 18, active: 40, recovery: 20, box: NO_BOX, damage: 0, kbBase: 0, kbScale: 0, kbX: 1, kbY: 0,
      launchSpeed: undefined, hover: true, hoverFreeze: true,
      tether: { range: 580, speed: 1100, missLift: 480 },
    },
  },
};
