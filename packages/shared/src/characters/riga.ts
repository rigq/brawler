import type { CharacterDefinition } from './types.ts';

/**
 * Riga: the tallest fighter (1.95 m), a tech guy who solves everything with AI.
 * Long arms and legs: he reaches far but hits lightly up close.
 * Specials (to come): a roulette of three AIs on the neutral special and an
 * emergency prompt that hooks him to the ledge as his recovery. Until then he
 * uses the generic specials.
 */
export const riga: CharacterDefinition = {
  name: 'Riga',
  stats: { speed: 3, weight: 3, damage: 2, reach: 4 },
  // Taller than everyone (Robert 74); thin in profile.
  size: { width: 36, height: 80 },
};
