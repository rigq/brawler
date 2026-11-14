import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GROUND, PLATFORMS } from '../src/constants.ts';
import { createProjectile, stepProjectiles, type Projectile } from '../src/combat/projectiles.ts';
import { createWorld, type World } from '../src/sim/world.ts';

/** Far from both players, so nobody gets hit and only the stage matters. */
function shot(world: World, fields: Partial<Projectile>): Projectile {
  const projectile = { ...createProjectile(), id: 1, owner: 0, width: 16, height: 16, ticksLeft: 600, lifetime: 600, hitsLeft: 1, ...fields };
  world.projectiles.push(projectile);
  world.players.forEach((player) => (player.stocks = 0));
  return projectile;
}

function flyFor(world: World, ticks: number): void {
  for (let i = 0; i < ticks; i++) stepProjectiles(world);
}

test('a shot flying sideways into the side of the island bursts on it', () => {
  const world = createWorld();
  shot(world, { x: GROUND.x - 120, y: GROUND.y + GROUND.height / 2 - 8, vx: 600 });
  flyFor(world, 30);
  assert.equal(world.projectiles.length, 0);
});

test('a shot flying under the island from below bursts on it', () => {
  const world = createWorld();
  shot(world, { x: GROUND.x + 100, y: GROUND.y + GROUND.height + 60, vy: -600 });
  flyFor(world, 30);
  assert.equal(world.projectiles.length, 0);
});

test('a shot passes straight through a one-way platform', () => {
  const world = createWorld();
  const platform = PLATFORMS[0];
  const projectile = shot(world, { x: platform.x - 80, y: platform.y - 4, vx: 600 });
  flyFor(world, 40);
  assert.equal(world.projectiles.length, 1);
  assert.ok(projectile.x > platform.x + platform.width, 'did not get past the platform');
});

test('a shot flying above the island crosses the whole stage', () => {
  const world = createWorld();
  shot(world, { x: GROUND.x, y: GROUND.y - 40, vx: 600 });
  flyFor(world, Math.ceil((GROUND.width / 600) * 60));
  assert.equal(world.projectiles.length, 1);
});

test('a bouncing shot lands on top of the island instead of bursting', () => {
  const world = createWorld();
  const projectile = shot(world, { x: GROUND.x + 300, y: GROUND.y - 100, vy: 300, gravity: 900, bouncesLeft: 1 });
  flyFor(world, 40);
  assert.equal(world.projectiles.length, 1);
  assert.equal(projectile.bouncesLeft, 0);
});
