// The basic rules of the game, checked with the real constants (no hard-coded
// positions), so retuning a number does not break the tests for no reason.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BLAST_ZONE, DROP_HOLD_TICKS, GROUND, HEAVY_MAX_CHARGE_TICKS, PLATFORMS, RESPAWN_DELAY_TICKS, SPAWNS, STOCKS } from '../src/constants.ts';
import { EMPTY_INPUT } from '../src/input.ts';
import type { CharacterId } from '../src/characters/index.ts';
import { applyKnockback } from '../src/combat/knockback.ts';
import { createPlayer, teleportPlayer, type Player } from '../src/sim/player.ts';
import { matchResult } from '../src/sim/stocks.ts';
import { createWorld, stepWorld } from '../src/sim/world.ts';
import { idle, play } from './helpers.ts';

/** Two seconds: enough to fall from any spawn and settle. */
const SETTLE_TICKS = 120;

function feet(player: Player): number {
  return player.y + player.height;
}

test('a player dropped above the ground falls and stands on it', () => {
  const world = createWorld();
  const player = world.players[0]!;
  teleportPlayer(player, { x: GROUND.x + GROUND.width / 2, y: GROUND.y - 300, facing: 1 });
  idle(world, SETTLE_TICKS);
  assert.ok(player.grounded);
  assert.equal(feet(player), GROUND.y);
});

test('jumping goes up and comes back down to the same floor', () => {
  const world = createWorld();
  const player = world.players[0]!;
  teleportPlayer(player, { x: GROUND.x + GROUND.width / 2, y: GROUND.y - player.height, facing: 1 });
  idle(world, SETTLE_TICKS);
  const floor = feet(player);
  play(world, [[{ ...EMPTY_INPUT, jump: true }]], 1);
  let highest = feet(player);
  for (let i = 0; i < SETTLE_TICKS; i++) {
    stepWorld(world, []);
    highest = Math.min(highest, feet(player));
  }
  assert.ok(highest < floor, 'never left the ground');
  assert.equal(feet(player), floor);
  assert.ok(player.grounded);
});

/** Launch speed of a fresh `target` hit by a side heavy at `damage` %. */
function launchSpeed(damage: number, targetCharacter: CharacterId = 'donate'): number {
  const attacker = createPlayer(SPAWNS[0], 'donate');
  const target = createPlayer(SPAWNS[1], targetCharacter);
  target.damage = damage;
  applyKnockback(attacker, target, { id: 'heavySide', charge: 0 });
  return Math.hypot(target.vx, target.vy);
}

test('the more damage you have, the further you fly', () => {
  assert.ok(launchSpeed(100) > launchSpeed(50));
  assert.ok(launchSpeed(50) > launchSpeed(0));
});

test('heavier characters fly less than lighter ones', () => {
  // Robert is the heaviest of the four, Chachin the lightest.
  assert.ok(launchSpeed(80, 'robert') < launchSpeed(80, 'chachin'));
});

test('getting hit sends you away from the attacker', () => {
  const attacker = createPlayer(SPAWNS[0], 'donate');
  const target = createPlayer(SPAWNS[1], 'robert');
  applyKnockback(attacker, target, { id: 'heavySide', charge: 0 });
  const targetIsRight = target.x > attacker.x;
  assert.equal(target.vx > 0, targetIsRight);
});

test('leaving the blast zone costs a life and you come back after the respawn wait', () => {
  const world = createWorld();
  const player = world.players[0]!;
  teleportPlayer(player, { x: BLAST_ZONE.left - player.width - 1, y: GROUND.y - 200, facing: 1 });
  stepWorld(world, []);
  assert.equal(player.stocks, STOCKS - 1);
  assert.ok(player.respawnTicks > 0);
  idle(world, RESPAWN_DELAY_TICKS);
  assert.equal(player.respawnTicks, 0);
  assert.ok(player.invulnTicks > 0, 'reappears invulnerable');
});

test('the match ends when only one player has lives left', () => {
  const players = [createPlayer(SPAWNS[0]), createPlayer(SPAWNS[1])];
  assert.deepEqual(matchResult(players), { over: false });
  players[1]!.stocks = 0;
  assert.deepEqual(matchResult(players), { over: true, winner: 0 });
  players[0]!.stocks = 0;
  assert.deepEqual(matchResult(players), { over: true, winner: null });
});

test('join options only accept real characters', async () => {
  const { parseCharacter } = await import('../src/net/protocol.ts');
  assert.equal(parseCharacter({ character: 'samu' }), 'samu');
  assert.equal(parseCharacter({ character: 'nobody' }), null);
  assert.equal(parseCharacter({ character: 42 }), null);
  assert.equal(parseCharacter(undefined), null);
});

/** P1 standing on the first platform, settled. */
function onPlatform(): ReturnType<typeof createWorld> {
  const world = createWorld(['samu', 'robert']);
  const player = world.players[0]!;
  const platform = PLATFORMS[0];
  teleportPlayer(player, { x: platform.x + platform.width / 2 - player.width / 2, y: platform.y - player.height, facing: 1 });
  idle(world, SETTLE_TICKS);
  return world;
}

test('on a platform, down then attack does the down attack instead of dropping', () => {
  const world = onPlatform();
  const player = world.players[0]!;
  play(world, [[{ ...EMPTY_INPUT, down: true }, { ...EMPTY_INPUT, down: true }, { ...EMPTY_INPUT, down: true, light: true }]], 3);
  assert.equal(player.attackId, 'lightDown');
  assert.ok(player.grounded, 'still standing on the platform');
});

test('holding down on a platform for a moment drops through it', () => {
  const world = onPlatform();
  const player = world.players[0]!;
  const startY = player.y;
  play(world, [Array.from({ length: DROP_HOLD_TICKS + 10 }, () => ({ ...EMPTY_INPUT, down: true }))], DROP_HOLD_TICKS + 10);
  assert.ok(player.y > startY, 'fell through');
});

test('the up special goes the way you hold, so you can get back from the side', () => {
  const world = createWorld(['robert', 'samu']);
  const player = world.players[0]!;
  teleportPlayer(player, { x: GROUND.x + 300, y: GROUND.y - 300, facing: 1 });
  play(world, [[{ ...EMPTY_INPUT, up: true, special: true, left: true }]], 1);
  assert.ok(player.vx < 0, 'launched to the left');
  assert.ok(player.vy < 0, 'and up');
});

test('the grab button grabs a rival standing next to you, even behind their shield', () => {
  const world = createWorld(['samu', 'robert']);
  const [p1, p2] = world.players as [Player, Player];
  teleportPlayer(p1, { x: GROUND.x + 400, y: GROUND.y - p1.height, facing: 1 });
  teleportPlayer(p2, { x: p1.x + p1.width + 10, y: GROUND.y - p2.height, facing: -1 });
  const shield = { ...EMPTY_INPUT, dodge: true };
  for (let i = 0; i < 20; i++) stepWorld(world, [EMPTY_INPUT, shield]);
  for (let i = 0; i < 20; i++) stepWorld(world, [{ ...EMPTY_INPUT, grab: i === 0 }, shield]);
  assert.ok(p1.holdTicks > 0 || p1.attackId === 'throwForward' || p1.attackId === 'throwBack' || p2.grabbedTicks > 0, 'P2 was grabbed');
});

test('a small grabber holds and throws a tall rival with both standing on the floor (no jump to the corner)', () => {
  const world = createWorld(['chachin', 'robert']);
  const [p1, p2] = world.players as [Player, Player];
  teleportPlayer(p1, { x: GROUND.x + 400, y: GROUND.y - p1.height, facing: 1 });
  teleportPlayer(p2, { x: p1.x + p1.width + 10, y: GROUND.y - p2.height, facing: -1 });
  idle(world, 10);
  const startX = p2.x;
  for (let i = 0; i < 12; i++) stepWorld(world, [{ ...EMPTY_INPUT, grab: i === 0 }, EMPTY_INPUT]);
  assert.ok(p2.grabbedTicks > 0, 'Robert is held');
  assert.equal(feet(p2), feet(p1), 'feet on the holder\'s feet, not inside the floor');
  assert.ok(Math.abs(p2.x - startX) < 40, 'pulled in, not teleported');
  for (let i = 0; i < 8; i++) stepWorld(world, [{ ...EMPTY_INPUT, up: true }, EMPTY_INPUT]);
  assert.equal(p2.grabbedTicks, 0, 'thrown');
  assert.ok(p2.vy < 0, 'up throw sends him up');
  assert.ok(Math.abs(p2.x - p1.x) < 80, 'from where he was held');
});

test('a fully charged heavy is held until you let go', () => {
  const world = createWorld(['samu', 'robert']);
  const p1 = world.players[0]!;
  idle(world, SETTLE_TICKS);
  const heavy = { ...EMPTY_INPUT, heavy: true };
  for (let i = 0; i < HEAVY_MAX_CHARGE_TICKS + 60; i++) stepWorld(world, [heavy, EMPTY_INPUT]);
  assert.equal(p1.attackId, 'heavySide');
  assert.ok(p1.attackCharging, 'still charging a second after full charge');
  stepWorld(world, [EMPTY_INPUT, EMPTY_INPUT]);
  assert.equal(p1.attackCharging, false, 'released when the button is let go');
});

test('a flurry hits the same rival several times (Chachin\'s up tilt)', () => {
  const world = createWorld(['chachin', 'robert']);
  const [p1, p2] = world.players as [Player, Player];
  teleportPlayer(p1, { x: GROUND.x + 400, y: GROUND.y - p1.height, facing: 1 });
  teleportPlayer(p2, { x: p1.x + 4, y: GROUND.y - p2.height, facing: -1 });
  idle(world, 10);
  stepWorld(world, [{ ...EMPTY_INPUT, light: true, up: true }, EMPTY_INPUT]);
  const hitsTaken = new Set<number>();
  for (let i = 0; i < 40; i++) {
    stepWorld(world, [EMPTY_INPUT, EMPTY_INPUT]);
    hitsTaken.add(p2.damage);
  }
  assert.ok(hitsTaken.size >= 3, `hit at least twice (damage went ${[...hitsTaken].join(' → ')})`);
});

test('armour: a jab does not stop Robert\'s charging heavy, it only hurts', () => {
  const world = createWorld(['robert', 'chachin']);
  const [p1, p2] = world.players as [Player, Player];
  teleportPlayer(p1, { x: GROUND.x + 400, y: GROUND.y - p1.height, facing: 1 });
  teleportPlayer(p2, { x: p1.x + p1.width + 2, y: GROUND.y - p2.height, facing: -1 });
  idle(world, 10);
  const heavy = { ...EMPTY_INPUT, heavy: true };
  for (let i = 0; i < 10; i++) stepWorld(world, [heavy, EMPTY_INPUT]);
  stepWorld(world, [heavy, { ...EMPTY_INPUT, light: true }]);
  for (let i = 0; i < 12; i++) stepWorld(world, [heavy, EMPTY_INPUT]);
  assert.ok(p1.damage > 0, 'the jab hurt him');
  assert.equal(p1.attackId, 'heavySide', 'still charging');
  assert.equal(p1.hitstunTicks, 0, 'not stunned');
});

/** Samu standing at the middle of the ground (his flag there), then put in the air `dx` px to the side. */
function samuInTheAir(dx: number): { world: ReturnType<typeof createWorld>; samu: Player } {
  const world = createWorld(['samu', 'robert']);
  const samu = world.players[0]!;
  teleportPlayer(samu, { x: GROUND.x + GROUND.width / 2, y: GROUND.y - samu.height, facing: 1 });
  idle(world, 5);
  teleportPlayer(samu, { x: samu.x + dx, y: GROUND.y - 300, facing: 1 });
  return { world, samu };
}

test('Samu teleports to a flag in range, but not to one too far away or expired', () => {
  const special = { ...EMPTY_INPUT, up: true, special: true };
  const near = samuInTheAir(200);
  stepWorld(near.world, [special, EMPTY_INPUT]);
  idle(near.world, 40);
  assert.ok(Math.abs(near.samu.x + near.samu.width / 2 - near.samu.flagX) < 1, 'appeared on the flag');

  const far = samuInTheAir(1000);
  stepWorld(far.world, [special, EMPTY_INPUT]);
  assert.equal(far.samu.attackId, 'none', 'too far: nothing happens');

  const late = samuInTheAir(200);
  late.samu.flagAgeTicks = 10_000;
  stepWorld(late.world, [special, EMPTY_INPUT]);
  assert.equal(late.samu.attackId, 'none', 'expired: nothing happens');
});

test('from the ground, an up tilt reaches a rival standing on a side platform (and you fit under it)', () => {
  const world = createWorld(['samu', 'robert']);
  const [p1, p2] = world.players as [Player, Player];
  const platform = PLATFORMS[0];
  const middle = platform.x + platform.width / 2;
  teleportPlayer(p1, { x: middle - p1.width / 2, y: GROUND.y - p1.height, facing: 1 });
  teleportPlayer(p2, { x: middle - p2.width / 2, y: platform.y - p2.height, facing: -1 });
  idle(world, 10);
  assert.ok(p1.grounded && p1.y >= platform.y + platform.height, 'Samu stands on the ground under the platform');
  assert.ok(p2.grounded && feet(p2) === platform.y, 'Robert stands on the platform');
  stepWorld(world, [{ ...EMPTY_INPUT, light: true, up: true }, EMPTY_INPUT]);
  idle(world, 20);
  assert.ok(p2.damage > 0, 'hit from below');
});

test('up heavy in the air lifts you once per time in the air', () => {
  const world = createWorld(['samu', 'robert']);
  const player = world.players[0]!;
  teleportPlayer(player, { x: GROUND.x + 300, y: GROUND.y - 400, facing: 1 });
  play(world, [[{ ...EMPTY_INPUT, up: true, heavy: true }]], 1);
  assert.ok(player.vy < 0, 'first one lifts');
  idle(world, 40);
  const vyBefore = player.vy;
  play(world, [[{ ...EMPTY_INPUT, up: true, heavy: true }]], 1);
  assert.ok(player.vy >= vyBefore, 'second one in the same jump does not');
});

test("Donate's parachute can be dropped with jump", () => {
  const world = createWorld(['donate', 'robert']);
  const player = world.players[0]!;
  teleportPlayer(player, { x: GROUND.x + 300, y: GROUND.y - 300, facing: 1 });
  play(world, [[{ ...EMPTY_INPUT, up: true, special: true }]], 1);
  for (let i = 0; i < 120 && !player.parachuting; i++) stepWorld(world, []);
  assert.ok(player.parachuting, 'gliding');
  play(world, [[{ ...EMPTY_INPUT, jump: true }]], 1);
  assert.equal(player.parachuting, false);
});
