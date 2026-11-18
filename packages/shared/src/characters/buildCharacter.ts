import {
  ATTACKS,
  ATTACK_REFERENCE_BODY,
  PLAYER_HEIGHT,
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
  const width = definition.size?.width ?? PLAYER_WIDTH;
  const height = definition.size?.height ?? PLAYER_HEIGHT;
  const fit: BodyFit = {
    damageMult: 1 + (stats.damage - STAT_AVERAGE) * STAT_DAMAGE_STEP,
    reachMult: 1 + (stats.reach - STAT_AVERAGE) * STAT_REACH_STEP,
    centerX: width / 2,
    scaleY: height / ATTACK_REFERENCE_BODY.height,
  };
  const ids = Object.keys(ATTACKS) as AttackId[];
  const attacks = Object.fromEntries(
    ids.map((id) => [id, fitAttack({ ...ATTACKS[id], ...definition.attacks?.[id] }, fit)]),
  ) as Record<AttackId, AttackData>;

  return {
    name: definition.name,
    speedMult: 1 + (stats.speed - STAT_AVERAGE) * STAT_SPEED_STEP,
    weight: WEIGHT_AVERAGE + (stats.weight - STAT_AVERAGE) * STAT_WEIGHT_STEP,
    width,
    height,
    attacks,
  };
}

interface BodyFit {
  damageMult: number;
  reachMult: number;
  /** Centre of this character's body, from its left edge. */
  centerX: number;
  /** This body's height / the reference body's height. */
  scaleY: number;
}

/**
 * An attack as written (for the reference body) onto this character's body:
 * - vertically in proportion, so it hits the same part of a taller or shorter body;
 * - horizontally from the body's centre, stretched by the reach stat (in front and behind).
 */
function fitAttack(attack: AttackData, fit: BodyFit): AttackData {
  const box = (b: AttackData['box']): AttackData['box'] => ({
    x: fit.centerX + (b.x - ATTACK_REFERENCE_BODY.width / 2) * fit.reachMult,
    width: b.width * fit.reachMult,
    y: b.y * fit.scaleY,
    height: b.height * fit.scaleY,
  });
  const { sweetspot, projectile } = attack;
  return {
    ...attack,
    damage: attack.damage * fit.damageMult,
    box: box(attack.box),
    sweetspot: sweetspot && { ...sweetspot, box: box(sweetspot.box), damage: sweetspot.damage * fit.damageMult },
    // Where a shot comes out (mouth, hand…) follows the body's height too.
    projectile: projectile && { ...projectile, offsetY: projectile.offsetY * fit.scaleY },
  };
}
