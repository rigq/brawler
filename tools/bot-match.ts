// Puts the training CPU to the test: CPU against CPU (or against a rival that
// mashes buttons) for a few matches, and prints KOs, falls on its own (KOs with
// nobody hitting it: a bad recovery) and how long it takes to think.
//
// A KO counts as "falling on its own" if the player had stood on the stage (or a
// ledge) again after the last hit taken: it was safe, and still died.
//
//   node tools/bot-match.ts                 (expert vs normal, every character)
//   node tools/bot-match.ts samu robert     (just that pair)
//   LEVELS=expert,masher node tools/bot-match.ts   (against a casual button-masher)

import { CHARACTER_IDS, isCharacterId, type CharacterId } from '../packages/shared/src/characters/index.ts';
import { botInput, createBot, type BotLevel } from '../packages/shared/src/ai/bot.ts';
import { EMPTY_INPUT, type PlayerInput } from '../packages/shared/src/input.ts';
import { isOffstage, recoveryInput } from '../packages/shared/src/ai/recovery.ts';
import { createWorld, stepWorld, type World } from '../packages/shared/src/sim/world.ts';

const MATCH_TICKS = 60 * 180;

/**
 * A rival like a casual player: walks in, and when close presses a random
 * attack (or shields, or jumps); off the stage it tries to come back.
 */
function masherInput(world: World, slot: number, state: { seed: number; hold: number; buttons: PlayerInput }): PlayerInput {
  const self = world.players[slot]!;
  const rival = world.players[1 - slot]!;
  if (isOffstage(self, world)) return recoveryInput(self, world);
  if (state.hold > 0) {
    state.hold -= 1;
    return state.buttons;
  }
  state.seed = (state.seed * 1103515245 + 12345) % 2147483648;
  const roll = state.seed / 2147483648;
  const dir = rival.x > self.x ? 1 : -1;
  const close = Math.abs(rival.x - self.x) < 110 && Math.abs(rival.y - self.y) < 90;
  const towards = { ...EMPTY_INPUT, left: dir < 0, right: dir > 0 };
  const options: PlayerInput[] = close
    ? [
        { ...towards, light: true }, { ...EMPTY_INPUT, light: true }, { ...EMPTY_INPUT, light: true, up: true },
        { ...towards, heavy: true }, { ...EMPTY_INPUT, heavy: true, up: true }, { ...EMPTY_INPUT, dodge: true },
        { ...towards, jump: true }, { ...EMPTY_INPUT, grab: true }, { ...towards, special: true },
      ]
    : [towards, towards, towards, { ...towards, jump: true }, { ...towards, special: true }];
  state.buttons = options[Math.floor(roll * options.length)]!;
  // Like a person: a press lasts a few ticks, then a short pause before the next decision.
  state.hold = 6 + Math.floor(roll * 10);
  return state.buttons;
}

interface Result { kos: [number, number]; selfDestructs: [number, number]; damage: [number, number]; msPerTick: number }

type Player = BotLevel | 'masher';

function play(characters: [CharacterId, CharacterId], levels: [Player, Player], seed: number): Result {
  const world = createWorld(characters);
  const bots = levels.map((level, i) => createBot(level === 'masher' ? 'expert' : level, seed * 7 + i));
  const mash = { seed: seed * 31 + 5, hold: 0, buttons: EMPTY_INPUT };
  /** Stood on the stage or a ledge since the last hit taken. */
  const safe = [true, true];
  const result: Result = { kos: [0, 0], selfDestructs: [0, 0], damage: [0, 0], msPerTick: 0 };
  let last: PlayerInput[] = [EMPTY_INPUT, EMPTY_INPUT];
  let thinking = 0;
  for (let tick = 0; tick < MATCH_TICKS; tick++) {
    const before = world.players.map((p) => ({ damage: p.damage, stocks: p.stocks }));
    const start = performance.now();
    const inputs = bots.map((bot, i) => (levels[i] === 'masher' ? masherInput(world, i, mash) : botInput(bot, world, i, last[1 - i])));
    thinking += performance.now() - start;
    stepWorld(world, inputs);
    last = inputs;
    world.players.forEach((p, i) => {
      if (p.grounded || p.ledgeSide !== 0) safe[i] = true;
      if (p.damage > before[i]!.damage) {
        safe[i] = false;
        result.damage[1 - i] += p.damage - before[i]!.damage;
      }
      if (p.stocks < before[i]!.stocks) {
        result.kos[1 - i] += 1;
        if (safe[i]) result.selfDestructs[i] += 1;
        safe[i] = true;
      }
    });
    if (world.players.some((p) => p.stocks === 0)) break;
  }
  result.msPerTick = thinking / Math.max(1, world.tick) / 2;
  return result;
}

const pair = process.argv.slice(2).filter(isCharacterId) as CharacterId[];
const pairs: [CharacterId, CharacterId][] = pair.length === 2 ? [[pair[0]!, pair[1]!]] : CHARACTER_IDS.map((id, i) => [id, CHARACTER_IDS[(i + 1) % CHARACTER_IDS.length]!]);
const levels = (process.env.LEVELS?.split(',') ?? ['expert', 'normal']) as [Player, Player];
console.log(`${levels[0]} (P1) vs ${levels[1]} (P2)`);
for (const [a, b] of pairs) {
  const r = play([a, b], levels, 1);
  console.log(`${a.padEnd(8)} vs ${b.padEnd(8)} KOs ${r.kos.join('-')}  falls on their own ${r.selfDestructs.join('-')}  damage dealt ${r.damage.map(Math.round).join('-')}  ${r.msPerTick.toFixed(2)} ms/tick per CPU`);
}
