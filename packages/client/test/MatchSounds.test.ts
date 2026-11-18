import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createWorld, type World } from '@brawler/shared';
import { MatchSounds } from '../src/audio/MatchSounds.ts';
import type { SfxName } from '../src/audio/sfx.ts';

/** A MatchSounds that writes down what it would play, and the world it watches. */
function setup(): { world: World; heard: SfxName[]; sounds: MatchSounds } {
  const heard: SfxName[] = [];
  const sounds = new MatchSounds((name) => heard.push(name));
  const world = createWorld(['donate', 'chachin']);
  for (const player of world.players) player.grounded = true;
  sounds.update(world, false);
  return { world, heard, sounds };
}

test('a hit sounds; damage set by hand (training keys) does not', () => {
  const { world, heard, sounds } = setup();
  const target = world.players[1]!;
  target.damage = 10;
  sounds.update(world, false);
  assert.deepEqual(heard, []);
  target.damage = 22;
  target.hitFlashTicks = 5;
  sounds.update(world, false);
  assert.deepEqual(heard, ['hit']);
});

test('losing a stock is a KO, and the end of the match plays once', () => {
  const { world, heard, sounds } = setup();
  world.players[0]!.stocks -= 1;
  sounds.update(world, true);
  sounds.update(world, true);
  assert.deepEqual(heard, ['ko', 'victory']);
});

test('attacks swing; Chachin screams with his neutral special', () => {
  const { world, heard, sounds } = setup();
  world.players[0]!.attackId = 'jab1';
  world.players[1]!.attackId = 'specialNeutral';
  sounds.update(world, false);
  assert.deepEqual(heard, ['swing', 'scream']);
});

test('a new projectile is heard by its kind, and a shell bursts when it is gone', () => {
  const { world, heard, sounds } = setup();
  world.projectiles.push({ id: 1, kind: 'shell' } as World['projectiles'][number]);
  sounds.update(world, false);
  world.projectiles.length = 0;
  sounds.update(world, false);
  assert.deepEqual(heard, ['cannon', 'blast']);
});
