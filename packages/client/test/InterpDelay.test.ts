import assert from 'node:assert/strict';
import { test } from 'node:test';
import { INTERP_DELAY_MS } from '@brawler/shared';
import { InterpDelay } from '../src/net/InterpDelay.ts';

/** Feeds `count` states arriving every `gap` ms, plus `jitter(i)` ms. */
function feed(delay: InterpDelay, count: number, gap: number, jitter: (i: number) => number = () => 0): void {
  for (let i = 0; i < count; i++) delay.onState(i * gap + jitter(i));
}

test('on a steady connection (a LAN) the delay settles near the minimum', () => {
  const delay = new InterpDelay();
  feed(delay, 600, 1000 / 60, (i) => (i % 2) * 2);
  assert.ok(delay.ms < 45, `delay ${delay.ms.toFixed(1)} ms`);
  assert.ok(delay.ms >= INTERP_DELAY_MS.min);
});

test('on a bumpy connection the delay grows, but never past the maximum', () => {
  const delay = new InterpDelay();
  feed(delay, 600, 1000 / 60, (i) => (i % 3 === 0 ? 40 : 0));
  assert.ok(delay.ms > 60, `delay ${delay.ms.toFixed(1)} ms`);
  assert.ok(delay.ms <= INTERP_DELAY_MS.max);
});
