// What happens to a player who gets hit: damage, launch and hitstun.

import {
  AIR_JUMPS,
  HEAVY_CHARGE_BONUS,
  HIT_FLASH_TICKS,
  HITSTUN_BASE_TICKS,
  HITSTUN_TICKS_PER_SPEED,
  KNOCKBACK_MAX_SPEED,
} from '../constants.ts';
import { endDodge } from '../sim/dodge.ts';
import type { Player } from '../sim/player.ts';
import { attackData } from './attacks.ts';
import type { AttackSnapshot } from './hits.ts';

/**
 * Applies the attacker's current attack to the target. The more damage the
 * target has accumulated, the faster it flies: that is how players get knocked out.
 * Returns the damage dealt, in %.
 */
export function applyKnockback(attacker: Player, target: Player, attack: AttackSnapshot): number {
  const data = attackData(attack.id);
  const chargeMult = data.heavy ? 1 + HEAVY_CHARGE_BONUS * attack.charge : 1;
  const dealt = data.damage * chargeMult;

  target.damage += dealt;
  const speed = Math.min((data.kbBase + data.kbScale * target.damage) * chargeMult, KNOCKBACK_MAX_SPEED);
  // Math.sqrt is exact in every JS engine, so this stays deterministic.
  const length = Math.sqrt(data.kbX * data.kbX + data.kbY * data.kbY);

  target.vx = awayFrom(attacker, target) * (data.kbX / length) * speed;
  target.vy = (data.kbY / length) * speed;
  target.hitstunTicks = HITSTUN_BASE_TICKS + Math.floor(speed * HITSTUN_TICKS_PER_SPEED);
  target.hitFlashTicks = HIT_FLASH_TICKS;
  interrupt(target);
  return dealt;
}

/** +1 if the target should fly right, -1 if left: away from the attacker. */
function awayFrom(attacker: Player, target: Player): 1 | -1 {
  const attackerCenter = attacker.x + attacker.width / 2;
  const targetCenter = target.x + target.width / 2;
  if (targetCenter === attackerCenter) return attacker.facing;
  return targetCenter > attackerCenter ? 1 : -1;
}

/**
 * Getting hit cancels whatever the target was doing. It also gives back the
 * air jumps, air dodge and recovery, so a launched player always has a chance to get back.
 */
function interrupt(target: Player): void {
  target.attackId = 'none';
  target.attackCharging = false;
  target.landingLagTicks = 0;
  endDodge(target);
  target.fastFalling = false;
  target.grounded = false;
  target.onPlatform = false;
  target.airJumpsLeft = AIR_JUMPS;
  target.airDodgeAvailable = true;
  target.recoveryAvailable = true;
}
