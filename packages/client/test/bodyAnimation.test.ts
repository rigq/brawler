import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SPAWNS, attackData, createPlayer } from '@brawler/shared';
import { ANIM_NAMES, frameFor, resolveAnim } from '../src/render/bodyAnimation.ts';

test('a missing animation borrows a similar one', () => {
  const has = (name: string) => name === 'light-up' || name === 'fall';
  assert.equal(resolveAnim('heavy-up', has), 'light-up');
  assert.equal(resolveAnim('air-down', has), 'fall');
});

test('with no animations at all, every name ends in the still pose (no endless loop)', () => {
  for (const name of ANIM_NAMES) assert.equal(resolveAnim(name, () => false), null);
});

test('the strike pose stays on screen for a while after the hit, not just its 2 active ticks', () => {
  const player = createPlayer(SPAWNS[0], 'robert');
  player.attackId = 'jab1';
  const { startup, active, recovery } = attackData(player, 'jab1');
  const frames = 3;
  const hitFrame = 1;
  player.attackTick = startup + active + Math.floor(recovery * 0.25);
  assert.equal(frameFor(player, 'jab', frames, 0, 0), hitFrame);
  player.attackTick = startup + active + recovery - 1;
  assert.equal(frameFor(player, 'jab', frames, 0, 0), frames - 1, 'ends on the follow-through');
});

test('an idle with a rest holds its first frame after stopping, then plays once through', () => {
  const player = createPlayer(SPAWNS[0], 'robert');
  const restMs = 1000;
  const idleFor = (ms: number) => frameFor(player, 'idle', 7, ms, 0, { restMs });
  assert.equal(idleFor(0), 0);
  assert.equal(idleFor(999), 0);
  assert.notEqual(idleFor(1500), 0, 'the drag starts right after the rest');
});

test('an idle can play faster than the default pace', () => {
  const player = createPlayer(SPAWNS[0], 'chachin');
  const timing = { restMs: 0, frameMs: 110 };
  assert.equal(frameFor(player, 'idle', 8, 115, 0, timing), 1);
  assert.equal(frameFor(player, 'idle', 8, 115, 0), 0, 'default pace is slower');
});
