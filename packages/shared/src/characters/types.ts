import type { AttackData, AttackId } from '../constants.ts';

/** Ratings from 1 to 5; 3 is average. A fair character adds up to about 12. */
export interface CharacterStats {
  speed: number;
  /** Heavier characters fly less far. */
  weight: number;
  damage: number;
  reach: number;
}

/** What a character file writes: stats, plus any attack that differs from the base table. */
export interface CharacterDefinition {
  name: string;
  stats: CharacterStats;
  attacks?: Partial<Record<AttackId, Partial<AttackData>>>;
}

/** What the simulation reads: stats turned into real numbers and every attack resolved. */
export interface Character {
  name: string;
  /** Multiplies run and dash speed. */
  speedMult: number;
  /** 100 = average; knockback is multiplied by 100 / weight. */
  weight: number;
  attacks: Record<AttackId, AttackData>;
}
