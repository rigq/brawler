// The roster. To add a character: write its file and add it to DEFINITIONS.

import { balanced } from './balanced.ts';
import { buildCharacter } from './buildCharacter.ts';
import { heavy } from './heavy.ts';
import { rushdown } from './rushdown.ts';
import type { Character } from './types.ts';
import { zoner } from './zoner.ts';

export type { Character, CharacterDefinition, CharacterStats } from './types.ts';

const DEFINITIONS = { balanced, rushdown, heavy, zoner };

export type CharacterId = keyof typeof DEFINITIONS;
export const DEFAULT_CHARACTER: CharacterId = 'balanced';
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
