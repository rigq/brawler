// Hit detection between players, run once per step after everyone has moved.

import { HITSTOP_BASE_TICKS, HITSTOP_MAX_TICKS, HITSTOP_TICKS_PER_DAMAGE, type AttackId } from '../constants.ts';
import { overlaps } from '../math/rect.ts';
import { isInvulnerable } from '../sim/dodge.ts';
import type { Player } from '../sim/player.ts';
import { blockHit } from '../sim/shield.ts';
import { isActive } from '../sim/stocks.ts';
import { activeHitbox, armorHolds, attackCharge, attackData, counterHolds, hurtbox, sweetspotBoxAt } from './attacks.ts';
import { startGrab } from './grabs.ts';
import { applyKnockback, attackDamage, awayFrom, takeArmoredHit } from './knockback.ts';

/** The attack as it was when the hit was found (before any hit is applied). */
export interface AttackSnapshot {
  id: AttackId;
  /** Heavy charge, 0–1. */
  charge: number;
  /** Landed with the sweet spot (if the attack has one). */
  sweet?: boolean;
  /** Damage and launch multiplier of a charged projectile (default 1). */
  power?: number;
  /** The attacker's power stacks when it hit (AttackData.stackBonus). */
  stacks?: number;
}

export interface Hit {
  attacker: number;
  target: number;
  attack: AttackSnapshot;
}

/**
 * Finds every hit this step, then applies them. Two phases so the result does
 * not depend on player order: if both players hit each other on the same tick,
 * both hits count ("trade"), even though each hit cancels the other's attack.
 */
export function resolveHits(players: Player[]): Hit[] {
  const hits = findHits(players);
  for (const hit of hits) {
    if (hit.attack.id !== 'grab') applyHit(players, hit);
    // Attacks beat grabs: a grabber hit on this same tick (even by another grab) grabs nobody.
    else if (!hits.some((other) => other.target === hit.attacker)) applyGrab(players, hit);
  }
  return hits;
}

function findHits(players: Player[]): Hit[] {
  const hits: Hit[] = [];
  players.forEach((attacker, a) => {
    const box = activeHitbox(attacker);
    if (!box || attacker.attackId === 'none' || !isActive(attacker)) return;
    const id = attacker.attackId;
    const sweetBox = sweetspotBoxAt(attacker, attacker.x, attacker.y);
    players.forEach((target, t) => {
      if (t === a || !isActive(target) || target.grabbedTicks > 0) return;
      if (attacker.attackHitMask & (1 << t)) return;
      if (isInvulnerable(target)) return;
      if (!overlaps(box, hurtbox(target))) return;
      const sweet = sweetBox !== null && overlaps(sweetBox, hurtbox(target));
      hits.push({ attacker: a, target: t, attack: { id, charge: attackCharge(attacker), sweet, stacks: attacker.powerStacks } });
    });
  });
  return hits;
}

function applyHit(players: Player[], hit: Hit): void {
  const attacker = players[hit.attacker];
  const target = players[hit.target];
  if (!attacker || !target) return;
  attacker.attackHitMask |= 1 << hit.target;
  if (counterHolds(target)) {
    counterHit(target, attacker);
    return;
  }
  const dealt = attackDamage(attacker, hit.attack);
  if (target.shielding) blockHit(target, awayFrom(attacker, target), dealt);
  else if (armorHolds(target, dealt)) takeArmoredHit(target, dealt);
  else applyKnockback(attacker, target, hit.attack);
  // Power stacks are spent by the hit that uses them (blocked or not).
  if (attackData(attacker, hit.attack.id).stackBonus) attacker.powerStacks = 0;
  freezeBoth(attacker, target, dealt);
}

/** A counter refuses the hit: no damage to the defender, and the attacker takes the counter's own hit. */
function counterHit(defender: Player, attacker: Player): void {
  if (defender.attackId === 'none') return;
  const data = attackData(defender, defender.attackId);
  const dealt = applyKnockback(defender, attacker, { id: defender.attackId, charge: 0 });
  freezeBoth(defender, attacker, dealt);
  // Spent: straight to its recovery, so it cannot counter twice.
  defender.attackTick = data.startup + data.active;
}

function applyGrab(players: Player[], hit: Hit): void {
  const attacker = players[hit.attacker];
  const target = players[hit.target];
  if (attacker && target) startGrab(attacker, target, hit.target);
}

/** Hitstop for a hit that dealt `damage`. */
export function freezeBoth(attacker: Player, target: Player, damage: number): void {
  const freeze = hitstopTicks(damage);
  // Max, not overwrite: in a trade each player keeps the longer of the two freezes.
  attacker.hitstopTicks = Math.max(attacker.hitstopTicks, freeze);
  target.hitstopTicks = Math.max(target.hitstopTicks, freeze);
}

/** Freeze length for a hit that dealt `damage` %. */
export function hitstopTicks(damage: number): number {
  return Math.min(HITSTOP_BASE_TICKS + Math.floor(damage * HITSTOP_TICKS_PER_DAMAGE), HITSTOP_MAX_TICKS);
}
