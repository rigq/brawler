import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ANIM_NAMES, resolveAnim } from '../src/render/bodyAnimation.ts';

test('a missing animation borrows a similar one', () => {
  const has = (name: string) => name === 'light-up' || name === 'fall';
  assert.equal(resolveAnim('heavy-up', has), 'light-up');
  assert.equal(resolveAnim('air-down', has), 'fall');
});

test('with no animations at all, every name ends in the still pose (no endless loop)', () => {
  for (const name of ANIM_NAMES) assert.equal(resolveAnim(name, () => false), null);
});
