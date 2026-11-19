// What happens to a player who gets hit: damage, launch and hitstun.

import {
  AIR_JUMPS,
  HEAVY_CHARGE_BONUS,
  HEAVY_CHARGE_LAUNCH_BONUS,
  HIT_FLASH_TICKS,
  HITSTUN_BASE_TICKS,
  HITSTUN_COMBO_DECAY_TICKS,
  HITSTUN_MIN_TICKS,
  HITSTUN_TICKS_PER_SPEED,
  KNOCKBACK_GROWTH_MULT,
  KNOCKBACK_MAX_SPEED,
  KNOCKBACK_SPEED_SCALE,
  WEIGHT_AVERAGE,
  type AttackData,
} from '../constants.ts';
import { endDodge } from '../sim/dodge.ts';
import type { Player } from '../sim/player.ts';
import { characterOf } from '../characters/index.ts';
import { attackData } from './attacks.ts';
import type { AttackSnapshot } from './hits.ts';

/**
 * Applies the attacker's current attack to the target. The more damage the
 * target has accumulated, the faster it flies: that is how players get knocked out.
 * Returns the damage dealt, in %.
 */
export function applyKnockback(attacker: Player, target: Player, attack: AttackSnapshot): number {
  const data = landedData(attacker, attack);
  const chargeMult = chargeMultiplier(data, attack);
  const dealt = data.damage * chargeMult;

  target.damage += dealt;
  const growth = (data.kbScale * KNOCKBACK_GROWTH_MULT * target.damage * dealt) / 10;
  const launch = (data.kbBase * chargeMult + growth) * launchChargeMultiplier(data, attack);
  const speed = Math.min((launch * WEIGHT_AVERAGE) / characterOf(target).weight, KNOCKBACK_MAX_SPEED);
  // Math.sqrt is exact in every JS engine, so this stays deterministic.
  const length = Math.sqrt(data.kbX * data.kbX + data.kbY * data.kbY);

  const flight = speed * KNOCKBACK_SPEED_SCALE;
  target.vx = awayFrom(attacker, target) * (data.kbX / length) * flight;
  target.vy = (data.kbY / length) * flight;
  target.hitstunTicks = hitstunFor(speed, target.comboHits, data.stunTicks ?? 0);
  target.comboHits += 1;
  target.hitFlashTicks = HIT_FLASH_TICKS;
  interrupt(target);
  return dealt;
}

/** A hit absorbed by armour (AttackData.armor): it hurts and flashes, but no launch, no stun, the attack goes on. */
export function takeArmoredHit(target: Player, dealt: number): void {
  target.damage += dealt;
  target.hitFlashTicks = HIT_FLASH_TICKS;
}

/** The attack's damage in %, charge included. */
export function attackDamage(attacker: Player, attack: AttackSnapshot): number {
  const data = landedData(attacker, attack);
  return data.damage * chargeMultiplier(data, attack);
}

/** Extra launch of a charged heavy, all of it at full charge (HEAVY_CHARGE_LAUNCH_BONUS). */
function launchChargeMultiplier(data: AttackData, attack: AttackSnapshot): number {
  return data.heavy ? 1 + HEAVY_CHARGE_LAUNCH_BONUS * attack.charge : 1;
}

function chargeMultiplier(data: AttackData, attack: AttackSnapshot): number {
  return data.heavy ? 1 + HEAVY_CHARGE_BONUS * attack.charge : 1;
}

/** The more hits already taken in this combo, the shorter the stun: combos always end. */
function hitstunFor(speed: number, comboHits: number, minimumStun: number): number {
  const stun = Math.max(HITSTUN_BASE_TICKS + Math.floor(speed * HITSTUN_TICKS_PER_SPEED), minimumStun);
  return Math.max(stun - comboHits * HITSTUN_COMBO_DECAY_TICKS, HITSTUN_MIN_TICKS);
}

/** The attack's data as it landed: the sweet spot replaces damage, knockback and stun. */
function landedData(attacker: Player, attack: AttackSnapshot): AttackData {
  const data = attackData(attacker, attack.id);
  return attack.sweet && data.sweetspot ? { ...data, ...data.sweetspot, box: data.box } : data;
}

/** +1 if the target should fly right, -1 if left: away from the attacker. */
export function awayFrom(attacker: Player, target: Player): 1 | -1 {
  const attackerCenter = attacker.x + attacker.width / 2;
  const targetCenter = target.x + target.width / 2;
  if (targetCenter === attackerCenter) return attacker.facing;
  return targetCenter > attackerCenter ? 1 : -1;
}

/**
 * Getting hit cancels whatever the target was doing. It also gives back the
 * air jumps, air dodge and recovery, so a launched player always has a chance to get back.
 */
export function interrupt(target: Player): void {
  target.attackId = 'none';
  target.attackCharging = false;
  target.parachuting = false;
  target.lagTicks = 0;
  target.ledgeSide = 0;
  target.shielding = false;
  target.shieldStunTicks = 0;
  target.coyoteTicks = 0;
  endDodge(target);
  target.fastFalling = false;
  target.grounded = false;
  target.onPlatform = false;
  target.airJumpsLeft = AIR_JUMPS;
  target.airDodgeAvailable = true;
  target.recoveryAvailable = true;
  target.airBoostAvailable = true;
}
