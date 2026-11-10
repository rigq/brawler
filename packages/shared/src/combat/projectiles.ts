// Projectiles: things a special fires that keep flying on their own (Donate's shell).
// They live in the World, not in a player, so several can exist and the server syncs them as a list.

import { BLAST_ZONE, FIXED_DT, type ProjectileSpec } from '../constants.ts';
import { overlaps, type Rect } from '../math/rect.ts';
import { isInvulnerable } from '../sim/dodge.ts';
import type { Player } from '../sim/player.ts';
import { blockHit } from '../sim/shield.ts';
import { isActive } from '../sim/stocks.ts';
import { attackData, attackPhase } from './attacks.ts';
import { hitstopTicks } from './hits.ts';
import { applyKnockback, attackDamage } from './knockback.ts';

export interface Projectile {
  /** Unique per world, so the renderer can follow each one between frames. */
  id: number;
  /** Slot of the player who fired it: it never hits them, and it uses their character's data. */
  owner: number;
  /** What it looks like (ProjectileSpec.kind). The simulation never reads it. */
  kind: string;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  width: number;
  height: number;
  /** Ticks left before it disappears on its own. */
  ticksLeft: number;
}

/** The world fields projectiles need. */
export interface ProjectileWorld {
  players: Player[];
  projectiles: Projectile[];
  nextProjectileId: number;
}

export function createProjectile(): Projectile {
  return { id: 0, owner: 0, kind: '', x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, width: 0, height: 0, ticksLeft: 0 };
}

/**
 * Runs once per step after hits: fires new projectiles, moves them, and lets
 * them hit. A projectile that hits, runs out of time or leaves the stage is removed.
 */
export function stepProjectiles(world: ProjectileWorld): void {
  world.players.forEach((player, slot) => fireIfReady(world, player, slot));
  for (const projectile of world.projectiles) {
    projectile.prevX = projectile.x;
    projectile.prevY = projectile.y;
    projectile.x += projectile.vx * FIXED_DT;
    projectile.ticksLeft -= 1;
    const owner = world.players[projectile.owner];
    const target = owner && findTarget(world.players, projectile);
    if (owner && target) {
      hit(owner, target, projectile);
      projectile.ticksLeft = 0;
    }
  }
  world.projectiles = world.projectiles.filter((p) => p.ticksLeft > 0 && insideStage(p));
}

/**
 * Fires on the attack's first active tick. The special cooldown, set here,
 * is what stops it firing twice (the attack can sit on that tick during hitstop).
 */
function fireIfReady(world: ProjectileWorld, player: Player, slot: number): void {
  if (player.attackId === 'none' || !isActive(player) || player.specialCooldown > 0) return;
  const data = attackData(player, player.attackId);
  if (!data.projectile || attackPhase(player) !== 'active') return;
  player.specialCooldown = data.cooldownTicks ?? 0;
  world.projectiles.push(spawn(world, player, slot, data.projectile));
}

function spawn(world: ProjectileWorld, player: Player, slot: number, spec: ProjectileSpec): Projectile {
  // offsetX is measured from the front edge of the body, outwards.
  const front = player.facing === 1 ? player.x + player.width + spec.offsetX : player.x - spec.offsetX - spec.width;
  const y = player.y + spec.offsetY;
  world.nextProjectileId += 1;
  return {
    id: world.nextProjectileId,
    owner: slot,
    kind: spec.kind,
    x: front,
    y,
    prevX: front,
    prevY: y,
    vx: player.facing * spec.speed,
    width: spec.width,
    height: spec.height,
    ticksLeft: spec.lifetimeTicks,
  };
}

function findTarget(players: Player[], projectile: Projectile): Player | undefined {
  return players.find(
    (target, slot) =>
      slot !== projectile.owner &&
      isActive(target) &&
      target.grabbedTicks === 0 &&
      !isInvulnerable(target) &&
      overlaps(projectile as Rect, target),
  );
}

/** Like a normal hit, but only the target freezes: the shooter is far away and keeps acting. */
function hit(owner: Player, target: Player, projectile: Projectile): void {
  const attack = { id: 'specialProjectile' as const, charge: 0 };
  const dealt = attackDamage(owner, attack);
  if (target.shielding) blockHit(target, projectile.vx > 0 ? 1 : -1, dealt);
  else applyKnockback(owner, target, attack);
  target.hitstopTicks = Math.max(target.hitstopTicks, hitstopTicks(dealt));
}

function insideStage(p: Projectile): boolean {
  return p.x + p.width > BLAST_ZONE.left && p.x < BLAST_ZONE.right && p.y + p.height > BLAST_ZONE.top && p.y < BLAST_ZONE.bottom;
}
