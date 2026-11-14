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
