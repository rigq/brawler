import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GROUND, PLATFORMS } from '../src/constants.ts';
import { createProjectile, stepProjectiles, type Projectile } from '../src/combat/projectiles.ts';
import { EMPTY_INPUT } from '../src/input.ts';
import { teleportPlayer } from '../src/sim/player.ts';
import { createWorld, stepWorld, type World } from '../src/sim/world.ts';

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

/** Donate on the ground holding the special `holdTicks` ticks, then letting go: the shell he fires. */
function donateShell(holdTicks: number): { shell: Projectile; firedAfter: number } {
  const world = createWorld(['donate', 'robert']);
  const donate = world.players[0]!;
  teleportPlayer(donate, { x: GROUND.x + 100, y: GROUND.y - donate.height, facing: 1 });
  teleportPlayer(world.players[1]!, { x: GROUND.x + GROUND.width - 60, y: GROUND.y - 80, facing: -1 });
  for (let i = 0; i < 5; i++) stepWorld(world, [EMPTY_INPUT, EMPTY_INPUT]);
  const special = { ...EMPTY_INPUT, special: true };
  for (let tick = 1; tick < 200; tick++) {
    stepWorld(world, [tick <= holdTicks ? special : EMPTY_INPUT, EMPTY_INPUT]);
    const shell = world.projectiles.find((p) => p.kind === 'shell');
    if (shell) return { shell, firedAfter: tick };
  }
  throw new Error('no shell fired');
}

test('Donate\'s shell charges: held longer it comes out bigger, harder and a bit slower; a tap fires as before', () => {
  const tap = donateShell(1);
  const full = donateShell(120);
  assert.equal(tap.shell.power, 1);
  assert.ok(tap.firedAfter <= 22, `a tap fires about as fast as before (${tap.firedAfter} ticks)`);
  assert.equal(full.shell.width, tap.shell.width * 2, 'twice as big at full charge');
  assert.equal(full.shell.power, 1.5);
  assert.ok(Math.abs(full.shell.vx) < Math.abs(tap.shell.vx), 'heavier, slower');
  assert.ok(full.firedAfter < 120, 'fires on its own at full charge');
});
