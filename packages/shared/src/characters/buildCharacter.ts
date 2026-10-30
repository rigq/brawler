import {
  ATTACKS,
  PLAYER_WIDTH,
  STAT_AVERAGE,
  STAT_DAMAGE_STEP,
  STAT_REACH_STEP,
  STAT_SPEED_STEP,
  STAT_WEIGHT_STEP,
  WEIGHT_AVERAGE,
  type AttackData,
  type AttackId,
} from '../constants.ts';
import type { Character, CharacterDefinition } from './types.ts';

/** Turns a character file into the numbers the simulation uses. */
export function buildCharacter(definition: CharacterDefinition): Character {
  const { stats } = definition;
  const damageMult = 1 + (stats.damage - STAT_AVERAGE) * STAT_DAMAGE_STEP;
  const reachMult = 1 + (stats.reach - STAT_AVERAGE) * STAT_REACH_STEP;
  const ids = Object.keys(ATTACKS) as AttackId[];
  const attacks = Object.fromEntries(
    ids.map((id) => [id, scaleAttack({ ...ATTACKS[id], ...definition.attacks?.[id] }, damageMult, reachMult)]),
  ) as Record<AttackId, AttackData>;

  return {
    name: definition.name,
    speedMult: 1 + (stats.speed - STAT_AVERAGE) * STAT_SPEED_STEP,
    weight: WEIGHT_AVERAGE + (stats.weight - STAT_AVERAGE) * STAT_WEIGHT_STEP,
    attacks,
  };
}

/** Reach stretches the hitbox from the body's centre, so it works in front of and behind you. */
function scaleAttack(attack: AttackData, damageMult: number, reachMult: number): AttackData {
  const centerX = PLAYER_WIDTH / 2;
  const { box } = attack;
  return {
    ...attack,
    damage: attack.damage * damageMult,
    box: { ...box, x: centerX + (box.x - centerX) * reachMult, width: box.width * reachMult },
  };
}
