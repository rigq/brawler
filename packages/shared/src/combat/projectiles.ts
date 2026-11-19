// Projectiles: things a special fires that keep flying on their own (Donate's shell).
// They live in the World, not in a player, so several can exist and the server syncs them as a list.

import { BLAST_ZONE, FIXED_DT, PROJECTILE_BOUNCE, type AttackData, type AttackId, type ProjectileSpec } from '../constants.ts';
import { overlaps, type Rect } from '../math/rect.ts';
import { isInvulnerable } from '../sim/dodge.ts';
import type { StageGeometry } from '../sim/collision.ts';
import type { Player } from '../sim/player.ts';
import { blockHit } from '../sim/shield.ts';
import { isActive } from '../sim/stocks.ts';
import { attackCharge, attackData, attackPhase, counterHolds } from './attacks.ts';
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
  vy: number;
  gravity: number;
  /** Bounces left on tops of the stage; -1 = never bounces. Either way it bursts against solid ground. */
  bouncesLeft: number;
  width: number;
  height: number;
  /** Ticks left before it disappears on its own, out of `lifetime`. */
  ticksLeft: number;
  lifetime: number;
  /** Hits it can still land; at 0 it vanishes. */
  hitsLeft: number;
  /** Ticks before it can hit again, and the wait it sets after each hit. */
  hitCooldown: number;
  hitInterval: number;
  /** Damage and launch multiplier (a charged shot hits harder); 1 = as written. */
  power: number;
  /** The owner's attack whose damage and knockback its hits use. */
  hitWith: string;
  /** Boomerang: ticks left before it turns round (-1 = it never does). */
  returnIn: number;
  /** Boomerang on its way back: it vanishes on reaching its owner. */
  returning: boolean;
  /** Runs along the top of the stage instead of bursting on it. */
  walker: boolean;
  /** Its first hit already gave the owner a power stack (AttackData.grantsStack). */
  stackGiven: boolean;
}

/** The world fields projectiles need. */
export interface ProjectileWorld extends StageGeometry {
  players: Player[];
  projectiles: Projectile[];
  nextProjectileId: number;
}

export function createProjectile(): Projectile {
  return {
    id: 0, owner: 0, kind: '', x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, gravity: 0, bouncesLeft: -1, width: 0, height: 0,
    ticksLeft: 0, lifetime: 0, hitsLeft: 0, hitCooldown: 0, hitInterval: 0, power: 1,
    hitWith: 'specialProjectile', returnIn: -1, returning: false, walker: false, stackGiven: false,
  };
}

/**
 * Runs once per step after hits: fires new projectiles, moves them, and lets
 * them hit. A projectile that has used up its hits, runs out of time, hits
 * solid ground or leaves the stage is removed.
 */
export function stepProjectiles(world: ProjectileWorld): void {
  world.players.forEach((player, slot) => fireIfReady(world, player, slot));
  for (const projectile of world.projectiles) {
    projectile.prevX = projectile.x;
    projectile.prevY = projectile.y;
    projectile.x += projectile.vx * FIXED_DT;
    projectile.vy += projectile.gravity * FIXED_DT;
    projectile.y += projectile.vy * FIXED_DT;
    if (projectile.bouncesLeft >= 0 || projectile.walker) bounce(projectile, world);
    // Platforms are thin and one-way: shots fly through them. The island is solid: they burst on it.
    if (world.solids.some((solid) => overlaps(projectile as Rect, solid))) projectile.ticksLeft = 0;
    projectile.ticksLeft -= 1;
    if (projectile.hitCooldown > 0) projectile.hitCooldown -= 1;
    const owner = world.players[projectile.owner];
    if (owner) boomerang(projectile, owner);
    const target = owner && projectile.hitCooldown === 0 && findTarget(world.players, projectile);
    if (owner && target && counterHolds(target)) {
      // Refused by a counter: it just vanishes.
      projectile.ticksLeft = 0;
    } else if (owner && target) {
      hit(owner, target, projectile);
      projectile.hitsLeft -= 1;
      projectile.hitCooldown = projectile.hitInterval;
      if (projectile.hitsLeft <= 0) projectile.ticksLeft = 0;
    }
  }
  world.projectiles = world.projectiles.filter((p) => p.ticksLeft > 0 && insideStage(p));
}

/**
 * Fires on the attack's first active tick. The special cooldown, set here,
 * is what stops it firing twice (the attack can sit on that tick during hitstop).
 */
function fireIfReady(world: ProjectileWorld, player: Player, slot: number): void {
  if (player.attackId === 'none' || !isActive(player)) return;
  const data = attackData(player, player.attackId);
  const spec = data.projectile;
  if (!spec || attackPhase(player) !== 'active') return;
  const shots = spec.shots ?? 1;
  const due = player.attackTick - data.startup >= player.attackShots * (spec.shotIntervalTicks ?? 1);
  const waiting = !data.freeOfCooldown && player.attackShots === 0 && player.specialCooldown > 0;
  // The first shot waits for the cooldown; counting shots stops a second one while frozen in hitstop.
  if (player.attackShots >= shots || !due || waiting) return;
  const offsets = spec.shotOffsetsY ?? [0];
  const scale = { ...charged(data.chargedProjectile, attackCharge(player)), offsetY: offsets[player.attackShots % offsets.length] ?? 0 };
  world.projectiles.push(spawn(world, player, slot, spec, scale, player.facing));
  if (spec.bothSides) world.projectiles.push(spawn(world, player, slot, spec, scale, player.facing === 1 ? -1 : 1));
  player.attackShots += 1;
  if (player.attackShots >= shots && !data.freeOfCooldown) player.specialCooldown = Math.max(player.specialCooldown, data.cooldownTicks ?? 0);
}

/** A boomerang turns round once, then vanishes when it reaches its owner. */
function boomerang(p: Projectile, owner: Player): void {
  if (p.returnIn > 0) p.returnIn -= 1;
  if (p.returnIn === 0 && !p.returning) {
    p.returning = true;
    p.vx = -p.vx;
    p.vy = -p.vy;
  }
  if (p.returning && overlaps(p as Rect, owner)) p.ticksLeft = 0;
}

/** How a charge (0..1) changes the shot: everything 1 when the special does not charge. */
function charged(full: AttackData['chargedProjectile'], charge: number) {
  const towards = (value: number | undefined) => 1 + ((value ?? 1) - 1) * charge;
  return { size: towards(full?.size), power: towards(full?.power), speed: towards(full?.speed), gravity: towards(full?.gravity) };
}

function spawn(
  world: ProjectileWorld,
  player: Player,
  slot: number,
  spec: ProjectileSpec,
  scale: { size: number; power: number; speed: number; gravity: number; offsetY: number },
  direction: 1 | -1,
): Projectile {
  const width = spec.width * scale.size;
  const height = spec.height * scale.size;
  // offsetX is measured from the edge of the body it leaves from, outwards. A bigger shot keeps the same centre height.
  const front = direction === 1 ? player.x + player.width + spec.offsetX : player.x - spec.offsetX - width;
  const y = player.y + spec.offsetY + scale.offsetY - (height - spec.height) / 2;
  world.nextProjectileId += 1;
  return {
    id: world.nextProjectileId,
    owner: slot,
    kind: spec.kind,
    x: front,
    y,
    prevX: front,
    prevY: y,
    vx: direction * spec.speed * scale.speed,
    vy: (spec.speedY ?? 0) * scale.speed,
    gravity: (spec.gravity ?? 0) * scale.gravity,
    bouncesLeft: spec.bounces ?? -1,
    width,
    height,
    ticksLeft: spec.lifetimeTicks,
    lifetime: spec.lifetimeTicks,
    hitsLeft: spec.hits ?? 1,
    hitCooldown: 0,
    hitInterval: spec.hitIntervalTicks ?? 0,
    power: scale.power,
    hitWith: spec.hitAttack ?? 'specialProjectile',
    returnIn: spec.returnAfterTicks ?? -1,
    returning: false,
    walker: spec.walker === true,
    stackGiven: false,
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
  const attack = { id: projectile.hitWith as AttackId, charge: 0, power: projectile.power };
  const dealt = attackDamage(owner, attack);
  if (target.shielding) blockHit(target, projectile.vx > 0 ? 1 : -1, dealt);
  else applyKnockback(owner, target, attack);
  const stack = attackData(owner, attack.id).grantsStack;
  if (stack && !projectile.stackGiven) {
    projectile.stackGiven = true;
    owner.powerStacks = Math.min(stack.max, owner.powerStacks + 1);
  }
  target.hitstopTicks = Math.max(target.hitstopTicks, hitstopTicks(dealt));
}

/**
 * Falling onto the top of the ground or a platform: bounce up (losing speed),
 * or vanish when it has no bounces left.
 */
function bounce(p: Projectile, stage: StageGeometry): void {
  if (p.vy <= 0) return;
  for (const top of [...stage.solids, ...stage.platforms]) {
    const crossed = p.prevY + p.height <= top.y && p.y + p.height > top.y;
    const above = p.x + p.width > top.x && p.x < top.x + top.width;
    if (!crossed || !above) continue;
    p.y = top.y - p.height;
    if (p.walker) {
      p.vy = 0;
      return;
    }
    if (p.bouncesLeft === 0) {
      p.ticksLeft = 0;
      return;
    }
    p.bouncesLeft -= 1;
    p.vy = -p.vy * PROJECTILE_BOUNCE;
    return;
  }
}

function insideStage(p: Projectile): boolean {
  return p.x + p.width > BLAST_ZONE.left && p.x < BLAST_ZONE.right && p.y + p.height > BLAST_ZONE.top && p.y < BLAST_ZONE.bottom;
}
