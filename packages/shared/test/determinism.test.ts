// Online only works if the server and every client compute exactly the same
// thing from the same inputs. These tests fail if anything random, clock-based
// or order-dependent sneaks into the simulation.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHARACTER_IDS } from '../src/characters/index.ts';
import { LOCAL_ONLY_FIELDS, copyPlayer, copyProjectile } from '../src/net/protocol.ts';
import { createProjectile } from '../src/combat/projectiles.ts';
import { createWorld, type World } from '../src/sim/world.ts';
import { mashing, play, snapshot } from './helpers.ts';

/** ~50 s of play: long enough for hits, KOs, respawns, grabs and specials. */
const TICKS = 3000;

test('same inputs give exactly the same match, for every pair of characters', () => {
  for (const p1 of CHARACTER_IDS) {
    for (const p2 of CHARACTER_IDS) {
      const scripts = [mashing(1, TICKS), mashing(2, TICKS)];
      const a = createWorld([p1, p2]);
      const b = createWorld([p1, p2]);
      play(a, scripts, TICKS);
      play(b, scripts, TICKS);
      assert.equal(snapshot(a), snapshot(b), `${p1} vs ${p2}`);
    }
  }
});

test('the mashing really plays: players move, take damage and use projectiles', () => {
  const world = createWorld(['donate', 'chachin']);
  const start = snapshot(world);
  let hurt = false;
  let fired = false;
  const scripts = [mashing(3, TICKS), mashing(4, TICKS)];
  for (let tick = 0; tick < TICKS; tick++) {
    play(world, scripts.map((s) => s.slice(tick, tick + 1)), 1);
    hurt ||= world.players.some((p) => p.damage > 0 || p.stocks < 3);
    fired ||= world.projectiles.length > 0;
  }
  assert.notEqual(snapshot(world), start);
  assert.ok(hurt, 'nobody was ever hit: the determinism test would prove little');
  assert.ok(fired, 'no projectile was ever fired');
});

/** A new world rebuilt only from what travels over the network (what the client does). */
function rebuiltFromNetwork(source: World): World {
  const copy = createWorld(source.players.map((p) => p.characterId));
  copy.tick = source.tick;
  copy.nextProjectileId = source.nextProjectileId;
  source.players.forEach((player, i) => copyPlayer(copy.players[i]!, player));
  copy.projectiles = source.projectiles.map((projectile) => {
    const p = createProjectile();
    copyProjectile(p, projectile);
    return p;
  });
  return copy;
}

/** The world without the drawing-only fields (prevX/prevY), which each client sets for itself. */
function simulated(world: World): string {
  return JSON.stringify(world, (key, value) => ((LOCAL_ONLY_FIELDS as readonly string[]).includes(key) ? undefined : value));
}

test('the synced fields hold the whole state: a rebuilt world continues identically', () => {
  // If some state lived outside the synced fields, the client's prediction would
  // replay from an incomplete copy and drift away from the server.
  const scripts = [mashing(5, TICKS), mashing(6, TICKS)];
  for (const pause of [300, 1100, 2200]) {
    const original = createWorld(['samu', 'robert']);
    play(original, scripts, pause);
    const rebuilt = rebuiltFromNetwork(original);
    const rest = scripts.map((s) => s.slice(pause));
    play(original, rest, TICKS - pause);
    play(rebuilt, rest, TICKS - pause);
    assert.equal(simulated(rebuilt), simulated(original), `rebuilt at tick ${pause}`);
  }
});
