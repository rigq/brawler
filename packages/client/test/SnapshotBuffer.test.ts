import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SPAWNS, createPlayer, createProjectile, type Projectile } from '@brawler/shared';
import { SnapshotBuffer } from '../src/net/SnapshotBuffer.ts';

const players = SPAWNS.map((spawn) => createPlayer(spawn));

function shell(id: number, x: number): Projectile {
  return { ...createProjectile(), id, x, y: 100, prevX: x, prevY: 100 };
}

test('projectiles are drawn halfway between two server states', () => {
  const buffer = new SnapshotBuffer();
  buffer.push(10, players, [shell(1, 100)]);
  buffer.push(12, players, [shell(1, 140)]);
  const [drawn] = buffer.sampleProjectiles(11);
  assert.equal(drawn?.x, 120);
  assert.equal(drawn?.prevX, 120, 'no second interpolation by the renderer');
});

test('a projectile fired after the drawn moment is not shown yet', () => {
  const buffer = new SnapshotBuffer();
  buffer.push(10, players, []);
  buffer.push(12, players, [shell(2, 300)]);
  assert.equal(buffer.sampleProjectiles(11).length, 0);
  assert.equal(buffer.sampleProjectiles(12).length, 1);
});
