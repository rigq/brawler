// Riga's specials: the AI roulette (counter, text burst, twin boomerang stars) and the tether recovery.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GROUND } from '../src/constants.ts';
import { EMPTY_INPUT, type PlayerInput } from '../src/input.ts';
import { teleportPlayer, type Player } from '../src/sim/player.ts';
import { createWorld, stepWorld, type World } from '../src/sim/world.ts';

const special: PlayerInput = { ...EMPTY_INPUT, special: true };

/** Riga on the ground facing a rival `gap` px in front of him. */
function setup(gap = 200, rival: 'robert' | 'chachin' = 'robert'): { world: World; riga: Player; rival: Player } {
  const world = createWorld(['riga', rival]);
  const [riga, other] = world.players as [Player, Player];
  teleportPlayer(riga, { x: GROUND.x + 200, y: GROUND.y - riga.height, facing: 1 });
  teleportPlayer(other, { x: riga.x + riga.width + gap, y: GROUND.y - other.height, facing: -1 });
  for (let i = 0; i < 5; i++) stepWorld(world, [EMPTY_INPUT, EMPTY_INPUT]);
  return { world, riga, rival: other };
}

/** Holds the special `ticks` ticks, then lets go for one tick. */
function holdSpecial(world: World, ticks: number, rivalInput: PlayerInput = EMPTY_INPUT): void {
  for (let i = 0; i < ticks; i++) stepWorld(world, [special, rivalInput]);
  stepWorld(world, [EMPTY_INPUT, rivalInput]);
}

test('the roulette picks by how long the special was held: Claude, ChatGPT, Gemini, then round again', () => {
  for (const [ticks, pick] of [[5, 'specialPick1'], [25, 'specialPick2'], [45, 'specialPick3'], [65, 'specialPick1']] as const) {
    const { world, riga } = setup();
    holdSpecial(world, ticks);
    assert.equal(riga.attackId, pick, `held ${ticks} ticks`);
  }
});

test('Claude\'s counter refuses a hit and launches the attacker instead', () => {
  const { world, riga, rival } = setup(2, 'chachin');
  holdSpecial(world, 3);
  for (let i = 0; i < 6; i++) stepWorld(world, [EMPTY_INPUT, EMPTY_INPUT]);
  stepWorld(world, [EMPTY_INPUT, { ...EMPTY_INPUT, light: true }]);
  for (let i = 0; i < 20; i++) stepWorld(world, [EMPTY_INPUT, EMPTY_INPUT]);
  assert.equal(riga.damage, 0, 'Riga took nothing');
  assert.ok(rival.damage > 0, 'the attacker took the counter');
});

test('ChatGPT fires a burst of 5 text bubbles', () => {
  const { world } = setup(600);
  holdSpecial(world, 25);
  const ids = new Set<number>();
  for (let i = 0; i < 45; i++) {
    stepWorld(world, [EMPTY_INPUT, EMPTY_INPUT]);
    for (const p of world.projectiles) if (p.kind === 'bubble') ids.add(p.id);
  }
  assert.equal(ids.size, 5);
});

test('Gemini fires twin stars both ways that come back', () => {
  const { world } = setup(600);
  holdSpecial(world, 45);
  for (let i = 0; i < 14; i++) stepWorld(world, [EMPTY_INPUT, EMPTY_INPUT]);
  const stars = world.projectiles.filter((p) => p.kind === 'star');
  assert.equal(stars.length, 2);
  assert.ok(stars[0]!.vx * stars[1]!.vx < 0, 'one each way');
  const before = stars.map((s) => Math.sign(s.vx));
  for (let i = 0; i < 35; i++) stepWorld(world, [EMPTY_INPUT, EMPTY_INPUT]);
  const after = world.projectiles.filter((p) => p.kind === 'star').map((s) => Math.sign(s.vx));
  assert.ok(after.length > 0 && after.every((v, i) => v === -before[i]!), 'turned round');
});

test('the emergency prompt hooks a ledge in reach and hangs him from it; out of reach it only lifts him', () => {
  const near = setup();
  const riga = near.riga;
  teleportPlayer(riga, { x: GROUND.x + GROUND.width + 120, y: GROUND.y + 100, facing: -1 });
  riga.grounded = false;
  stepWorld(near.world, [{ ...EMPTY_INPUT, up: true, special: true }, EMPTY_INPUT]);
  for (let i = 0; i < 30 && riga.ledgeSide === 0; i++) stepWorld(near.world, [EMPTY_INPUT, EMPTY_INPUT]);
  assert.equal(riga.ledgeSide, 1, 'hanging from the right edge');

  const far = setup();
  teleportPlayer(far.riga, { x: GROUND.x + GROUND.width + 600, y: GROUND.y + 100, facing: -1 });
  far.riga.grounded = false;
  stepWorld(far.world, [{ ...EMPTY_INPUT, up: true, special: true }, EMPTY_INPUT]);
  for (let i = 0; i < 12; i++) stepWorld(far.world, [EMPTY_INPUT, EMPTY_INPUT]);
  assert.equal(far.riga.ledgeSide, 0, 'nothing to hook');
});

test('while typing the emergency prompt he is frozen dead still in the air', () => {
  const { world, riga } = setup();
  teleportPlayer(riga, { x: GROUND.x + GROUND.width + 120, y: GROUND.y + 100, facing: -1 });
  riga.grounded = false;
  riga.vx = 500;
  riga.vy = 300;
  stepWorld(world, [{ ...EMPTY_INPUT, up: true, special: true }, EMPTY_INPUT]);
  const at = { x: riga.x, y: riga.y };
  for (let i = 0; i < 12; i++) stepWorld(world, [EMPTY_INPUT, EMPTY_INPUT]);
  assert.equal(riga.attackId, 'specialUp');
  assert.deepEqual({ x: riga.x, y: riga.y }, at, 'did not move while typing');
});
