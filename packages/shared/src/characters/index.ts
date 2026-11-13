// The roster. To add a character: write its file and add it to DEFINITIONS.

import { buildCharacter } from './buildCharacter.ts';
import { chachin } from './chachin.ts';
import { donate } from './donate.ts';
import { robert } from './robert.ts';
import { samu } from './samu.ts';
import type { Character } from './types.ts';

export type { Character, CharacterDefinition, CharacterStats } from './types.ts';

const DEFINITIONS = { donate, robert, samu, chachin };

export type CharacterId = keyof typeof DEFINITIONS;
export const DEFAULT_CHARACTER: CharacterId = 'donate';
/** Who plays in each slot when nobody chooses (until character select, I2). */
export const DEFAULT_LINEUP: readonly CharacterId[] = ['donate', 'robert'];
export const CHARACTER_IDS = Object.keys(DEFINITIONS) as CharacterId[];

const CHARACTERS = Object.fromEntries(
  CHARACTER_IDS.map((id) => [id, buildCharacter(DEFINITIONS[id])]),
) as Record<CharacterId, Character>;

/** The character of a player. An id received from outside that does not exist counts as the default. */
export function characterOf(player: { characterId: string }): Character {
  return isCharacterId(player.characterId) ? CHARACTERS[player.characterId] : CHARACTERS[DEFAULT_CHARACTER];
}

export function isCharacterId(id: string | null): id is CharacterId {
  return id !== null && id in CHARACTERS;
}
