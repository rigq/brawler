// Specials added on 20 nov: Samu's charged spike, Donate's parachute bombs,
// Robert's smoke stacks, Riga's hallucination clone and taunts.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GROUND, TAUNT_TICKS } from '../src/constants.ts';
import type { CharacterId } from '../src/characters/index.ts';
import { EMPTY_INPUT, type PlayerInput } from '../src/input.ts';
import { teleportPlayer, type Player } from '../src/sim/player.ts';
import { createWorld, stepWorld, type World } from '../src/sim/world.ts';

const special: PlayerInput = { ...EMPTY_INPUT, special: true };

function duel(me: CharacterId, rival: CharacterId = 'robert', gap = 500): { world: World; p1: Player; p2: Player } {
  const world = createWorld([me, rival]);
  const [p1, p2] = world.players as [Player, Player];
  teleportPlayer(p1, { x: GROUND.x + 60, y: GROUND.y - p1.height, facing: 1 });
  teleportPlayer(p2, { x: p1.x + p1.width + gap, y: GROUND.y - p2.height, facing: -1 });
  for (let i = 0; i < 5; i++) stepWorld(world, [EMPTY_INPUT, EMPTY_INPUT]);
  return { world, p1, p2 };
}

function steps(world: World, n: number, p1: PlayerInput = EMPTY_INPUT, p2: PlayerInput = EMPTY_INPUT): void {
  for (let i = 0; i < n; i++) stepWorld(world, [p1, p2]);
}

/** Holds the special `hold` ticks and returns the first projectile of `kind`. */
function firstShot(me: CharacterId, kind: string, hold: number) {
  const { world } = duel(me, 'robert', 900);
  for (let tick = 1; tick < 200; tick++) {
    stepWorld(world, [tick <= hold ? special : EMPTY_INPUT, EMPTY_INPUT]);
    const shot = world.projectiles.find((p) => p.kind === kind);
    if (shot) return { ...shot };
  }
  throw new Error(`no ${kind}`);
}

test('Samu\'s spike charges: held, the ball is faster and drops less', () => {
  const tap = firstShot('samu', 'ball', 1);
  const full = firstShot('samu', 'ball', 80);
  assert.ok(Math.abs(full.vx) > Math.abs(tap.vx) * 1.5, 'faster');
  assert.ok(full.gravity < tap.gravity, 'straighter');
  assert.ok(full.power > tap.power, 'harder');
});

test('Donate drops up to 3 bombs from the parachute', () => {
  const { world, p1 } = duel('donate');
  stepWorld(world, [{ ...special, up: true }, EMPTY_INPUT]);
  for (let i = 0; i < 80 && !p1.parachuting; i++) stepWorld(world, [EMPTY_INPUT, EMPTY_INPUT]);
  assert.ok(p1.parachuting, 'gliding');
  const bombs = new Set<number>();
  for (let i = 0; i < 200 && !p1.grounded; i++) {
    stepWorld(world, [{ ...EMPTY_INPUT, special: i % 2 === 0 }, EMPTY_INPUT]);
    for (const p of world.projectiles) if (p.kind === 'bomb') bombs.add(p.id);
  }
  assert.equal(bombs.size, 3);
});

test('Robert\'s smoke gives a stack when it lands, and the next heavy spends it for a stronger hit', () => {
  const plain = duel('robert', 'samu', 2);
  steps(plain.world, 1, { ...EMPTY_INPUT, heavy: true });
  steps(plain.world, 30);
  const normal = plain.p2.damage;

  const stacked = duel('robert', 'samu', 2);
  stacked.p1.powerStacks = 3;
  steps(stacked.world, 1, { ...EMPTY_INPUT, heavy: true });
  steps(stacked.world, 30);
  assert.ok(normal > 0 && stacked.p2.damage > normal * 1.3, `${stacked.p2.damage} vs ${normal}`);
  assert.equal(stacked.p1.powerStacks, 0, 'spent');

  const smoke = duel('robert', 'samu', 30);
  steps(smoke.world, 1, special);
  steps(smoke.world, 120);
  assert.equal(smoke.p1.powerStacks, 1, 'one stack per Calada, however many times the smoke hits');
});

test('Riga\'s hallucination: a clone runs along the ground', () => {
  const { world, p1 } = duel('riga', 'robert', 600);
  steps(world, 65, special);
  steps(world, 1);
  assert.equal(p1.attackId, 'specialPick4');
  steps(world, 25);
  const clone = world.projectiles.find((p) => p.kind === 'clone');
  assert.ok(clone, 'running');
  assert.equal(clone.y + clone.height, GROUND.y, 'on the ground');
  assert.ok(clone.vx > 0);
});

test('a taunt leaves you unable to act for a while; a hit ends it', () => {
  const { world, p1 } = duel('donate', 'robert', 2);
  steps(world, 1, { ...EMPTY_INPUT, taunt: true });
  assert.equal(p1.tauntTicks > 0, true);
  steps(world, 5, { ...EMPTY_INPUT, light: true });
  assert.equal(p1.attackId, 'none', 'cannot attack while taunting');
  steps(world, 1, EMPTY_INPUT, { ...EMPTY_INPUT, light: true });
  steps(world, 10);
  assert.equal(p1.tauntTicks, 0, 'interrupted');
  assert.ok(TAUNT_TICKS > 30);
});
