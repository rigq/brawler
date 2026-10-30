// Hit detection between players, run once per step after everyone has moved.

import { HITSTOP_BASE_TICKS, HITSTOP_MAX_TICKS, HITSTOP_TICKS_PER_DAMAGE, type AttackId } from '../constants.ts';
import { overlaps } from '../math/rect.ts';
import { isInvulnerable } from '../sim/dodge.ts';
import type { Player } from '../sim/player.ts';
import { blockHit } from '../sim/shield.ts';
import { isActive } from '../sim/stocks.ts';
import { activeHitbox, attackCharge, hurtbox } from './attacks.ts';
import { startGrab } from './grabs.ts';
import { applyKnockback, attackDamage, awayFrom } from './knockback.ts';

/** The attack as it was when the hit was found (before any hit is applied). */
export interface AttackSnapshot {
  id: AttackId;
  /** Heavy charge, 0–1. */
  charge: number;
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
    const attack = { id: attacker.attackId, charge: attackCharge(attacker) };
    players.forEach((target, t) => {
      if (t === a || !isActive(target) || target.grabbedTicks > 0) return;
      if (attacker.attackHitMask & (1 << t)) return;
      if (isInvulnerable(target)) return;
      if (overlaps(box, hurtbox(target))) hits.push({ attacker: a, target: t, attack });
    });
  });
  return hits;
}

function applyHit(players: Player[], hit: Hit): void {
  const attacker = players[hit.attacker];
  const target = players[hit.target];
  if (!attacker || !target) return;
  attacker.attackHitMask |= 1 << hit.target;
  const dealt = attackDamage(attacker, hit.attack);
  if (target.shielding) blockHit(target, awayFrom(attacker, target), dealt);
  else applyKnockback(attacker, target, hit.attack);
  freezeBoth(attacker, target, dealt);
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
