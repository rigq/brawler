// The training CPU (src/ai): same seed, same game; it comes back to the stage;
// it punishes; it finishes off a dummy; it shields what it sees coming.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { botInput, createBot } from '../src/ai/bot.ts';
import { CHARACTER_IDS, type CharacterId } from '../src/characters/index.ts';
import { GROUND } from '../src/constants.ts';
import { EMPTY_INPUT, type PlayerInput } from '../src/input.ts';
import { teleportPlayer, type Player } from '../src/sim/player.ts';
import { createWorld, stepWorld, type World } from '../src/sim/world.ts';

/** Bot in slot 0 against `rival` in slot 1, both standing `gap` px apart in the middle. */
function setup(bot: CharacterId, rival: CharacterId = 'robert', gap = 60): { world: World; me: Player; other: Player } {
  const world = createWorld([bot, rival]);
  const [me, other] = world.players as [Player, Player];
  const middle = GROUND.x + GROUND.width / 2;
  teleportPlayer(me, { x: middle - me.width - gap / 2, y: GROUND.y - me.height, facing: 1 });
  teleportPlayer(other, { x: middle + gap / 2, y: GROUND.y - other.height, facing: -1 });
  for (let i = 0; i < 5; i++) stepWorld(world, [EMPTY_INPUT, EMPTY_INPUT]);
  me.invulnTicks = 0;
  other.invulnTicks = 0;
  return { world, me, other };
}

/** Runs the bot (slot 0) for `ticks` with the rival pressing `rival(tick)`. Returns the bot's inputs. */
function run(world: World, ticks: number, rival: (t: number) => PlayerInput = () => EMPTY_INPUT, seed = 1): PlayerInput[] {
  const bot = createBot('expert', seed);
  const log: PlayerInput[] = [];
  for (let t = 0; t < ticks; t++) {
    const theirs = rival(t);
    const mine = botInput(bot, world, 0, theirs);
    log.push(mine);
    stepWorld(world, [mine, theirs]);
  }
  return log;
}

test('the CPU is deterministic: same seed and world, same buttons', () => {
  const a = setup('samu');
  const b = setup('samu');
  assert.deepEqual(run(a.world, 300), run(b.world, 300));
});

test('every character comes back from off the stage (launched out, with its jumps)', () => {
  for (const id of CHARACTER_IDS) {
    for (const side of [-1, 1]) {
      const { world, me } = setup(id);
      const edge = side === 1 ? GROUND.x + GROUND.width : GROUND.x;
      teleportPlayer(me, { x: edge + side * 200 - me.width / 2, y: GROUND.y - 60, facing: -side as 1 | -1 });
      me.invulnTicks = 0;
      me.vx = side * 300;
      const stocks = me.stocks;
      let back = false;
      const bot = createBot('expert', 3);
      for (let t = 0; t < 400 && !back; t++) {
        stepWorld(world, [botInput(bot, world, 0), EMPTY_INPUT]);
        back = me.grounded || me.ledgeSide !== 0;
      }
      assert.ok(back && me.stocks === stocks, `${id} did not make it back from the ${side === 1 ? 'right' : 'left'}`);
    }
  }
});

test('it finishes off a dummy that stands still (training against the CPU)', () => {
  for (const id of CHARACTER_IDS) {
    const { world, other } = setup(id, 'robert', 200);
    other.damage = 120;
    const stocks = other.stocks;
    run(world, 60 * 20);
    assert.ok(other.stocks < stocks, `${id} did not KO a still dummy at 120 % in 20 s`);
  }
});

test('it punishes a rival stuck at the end of a missed heavy', () => {
  const { world, other } = setup('chachin', 'robert', 50);
  // The rival whiffs a fully charged heavy facing away, then is stuck for a while.
  other.facing = 1;
  const damage = other.damage;
  run(world, 50, (t) => ({ ...EMPTY_INPUT, heavy: t < 3 }));
  assert.ok(other.damage > damage, 'no punish');
});

test('it shields (or gets away from) a slow heavy it sees coming', () => {
  const { world, me, other } = setup('samu', 'robert', 30);
  const taken = me.damage;
  // A charged heavy: plenty of time to react.
  run(world, 70, (t) => ({ ...EMPTY_INPUT, heavy: t < 40 }));
  assert.equal(me.damage, taken, `hit by a heavy charged for ${other.attackChargeTicks} ticks`);
});
