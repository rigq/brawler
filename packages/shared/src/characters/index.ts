// The roster. To add a character: write its file and add it to DEFINITIONS.

import { ART_HITBOXES } from './artHitboxes.ts';
import { buildCharacter } from './buildCharacter.ts';
import { chachin } from './chachin.ts';
import { riga } from './riga.ts';
import { donate } from './donate.ts';
import { robert } from './robert.ts';
import { samu } from './samu.ts';
import type { Character, CharacterStats } from './types.ts';

export type { Character, CharacterDefinition, CharacterStats } from './types.ts';

const DEFINITIONS = { donate, robert, samu, chachin, riga };

export type CharacterId = keyof typeof DEFINITIONS;
export const DEFAULT_CHARACTER: CharacterId = 'donate';
/** Who plays in each slot when nobody chooses (until character select, I2). */
export const DEFAULT_LINEUP: readonly CharacterId[] = ['donate', 'robert'];
export const CHARACTER_IDS = Object.keys(DEFINITIONS) as CharacterId[];

const CHARACTERS = Object.fromEntries(
  CHARACTER_IDS.map((id) => [id, buildCharacter(DEFINITIONS[id], ART_HITBOXES[id])]),
) as Record<CharacterId, Character>;

/** The character of a player. An id received from outside that does not exist counts as the default. */
export function characterOf(player: { characterId: string }): Character {
  return isCharacterId(player.characterId) ? CHARACTERS[player.characterId] : CHARACTERS[DEFAULT_CHARACTER];
}

/** The character with the hitboxes as written in its file, before the art replaces them (for tools/hitboxes.ts). */
export function writtenCharacter(id: CharacterId): Character {
  return buildCharacter(DEFINITIONS[id]);
}

/** A character's 1–5 ratings, as written in its file (for menus). */
export function characterStats(id: CharacterId): CharacterStats {
  return DEFINITIONS[id].stats;
}

export function isCharacterId(id: string | null): id is CharacterId {
  return id !== null && id in CHARACTERS;
}
