// The basic rules of the game, checked with the real constants (no hard-coded
// positions), so retuning a number does not break the tests for no reason.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BLAST_ZONE, GROUND, RESPAWN_DELAY_TICKS, SPAWNS, STOCKS } from '../src/constants.ts';
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
