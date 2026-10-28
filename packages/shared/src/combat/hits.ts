// Hit detection between players, run once per step after everyone has moved.

import { overlaps } from '../math/rect.ts';
import { isInvulnerable } from '../sim/dodge.ts';
import type { Player } from '../sim/player.ts';
import { isActive } from '../sim/stocks.ts';
import { activeHitbox, attackCharge, hurtbox, type AttackDirection, type AttackStrength } from './attacks.ts';
import { applyKnockback } from './knockback.ts';

/** The attack as it was when the hit was found (before any hit is applied). */
export interface AttackSnapshot {
  strength: AttackStrength;
  dir: AttackDirection;
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
  for (const hit of hits) applyHit(players, hit);
  return hits;
}

function findHits(players: Player[]): Hit[] {
  const hits: Hit[] = [];
  players.forEach((attacker, a) => {
    const box = activeHitbox(attacker);
    if (!box || attacker.attackDir === 'none' || !isActive(attacker)) return;
    const attack = { strength: attacker.attackStrength, dir: attacker.attackDir, charge: attackCharge(attacker) };
    players.forEach((target, t) => {
      if (t === a || !isActive(target)) return;
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
  applyKnockback(attacker, target, hit.attack);
}
