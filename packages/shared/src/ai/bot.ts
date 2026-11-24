// The training CPU. Each time it has to decide, it lists what it could do
// (scripts.ts), plays every option forward in a copy of the world
// (rollout.ts) and does the one that scores best: it hits when the hit will
// land, shields what it sees coming, punishes, combos and comes back to the stage.
// Pure and deterministic (its randomness is seeded), like the rest of `shared`,
// but only the client runs it: it is just another source of inputs.

import { BOT_ATTACK_RANGE, BOT_HORIZON_TICKS, BOT_LEVELS, BOT_RECOVERY_HORIZON_TICKS, BOT_SHORTLIST } from '../constants.ts';
import { EMPTY_INPUT, type PlayerInput } from '../input.ts';
import type { Player } from '../sim/player.ts';
import { isActive } from '../sim/stocks.ts';
import type { World } from '../sim/world.ts';
import { isOffstage } from './recovery.ts';
import { hideUnseen, isFree, cloneWorld, scoreBothGuesses, scoreIfMoving } from './rollout.ts';
import { airScripts, groundScripts, ledgeScripts, recoveryScripts, shieldScripts, throwScripts, type Script, type Situation } from './scripts.ts';

export type BotLevel = keyof typeof BOT_LEVELS;

export interface Bot {
  level: BotLevel;
  /** The option being played and how far into it. */
  plan: Script | null;
  planTick: number;
  /** Seed of its small random choices (mulberry32 state). */
  seed: number;
  /** Already showed off after this KO (it taunts once per rival KO). */
  tauntedAtStocks: number;
}

export function createBot(level: BotLevel = 'expert', seed = 1): Bot {
  return { level, plan: null, planTick: 0, seed, tauntedAtStocks: -1 };
}

/** A number in [0, 1) from the bot's seed (mulberry32). */
function random(bot: Bot): number {
  bot.seed = (bot.seed + 0x6d2b79f5) | 0;
  let t = bot.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * The buttons for player `slot` this tick. `rivalInput`: what the rival pressed
 * last (only its movement is used, to guess where it is going).
 */
export function botInput(bot: Bot, world: World, slot: number, rivalInput: PlayerInput = EMPTY_INPUT): PlayerInput {
  const self = world.players[slot];
  const rivalSlot = slot === 0 ? 1 : 0;
  const rival = world.players[rivalSlot];
  if (!self || !rival || !isActive(self) || self.hitstunTicks > 0 || self.grabbedTicks > 0) {
    bot.plan = null;
    return EMPTY_INPUT;
  }
  if (bot.plan) {
    const t = bot.planTick;
    const over = t >= bot.plan.minTicks && isFree(self);
    const rethink = bot.plan.interruptible && t > 0 && t % BOT_LEVELS[bot.level].replanTicks === 0;
    if (!over && !rethink) {
      bot.planTick += 1;
      return bot.plan.at(t, self);
    }
  }
  const taunt = tauntAfterKo(bot, self, rival);
  if (taunt) return taunt;
  bot.plan = choose(bot, world, slot, rivalSlot, movementOf(rivalInput));
  bot.planTick = 1;
  return bot.plan.at(0, self);
}

/** The rival out of the way after a KO: show off once (it is a training partner with personality). */
function tauntAfterKo(bot: Bot, self: Player, rival: Player): PlayerInput | null {
  if (isActive(rival) || !self.grounded || !isFree(self) || bot.tauntedAtStocks === rival.stocks) return null;
  bot.tauntedAtStocks = rival.stocks;
  bot.plan = null;
  return { ...EMPTY_INPUT, taunt: true };
}

function movementOf(input: PlayerInput): PlayerInput {
  return { ...EMPTY_INPUT, left: input.left, right: input.right, down: input.down, dodge: input.dodge };
}

/** Lists the options for the situation, tries them all and keeps the best (with a pinch of noise). */
function choose(bot: Bot, world: World, slot: number, rivalSlot: number, rivalMove: PlayerInput): Script {
  const level = BOT_LEVELS[bot.level];
  const seen = cloneWorld(world);
  hideUnseen(seen, slot, level.reactionTicks);
  const self = seen.players[slot]!;
  const options = optionsFor(self, seen.players[rivalSlot]!, seen, slot);
  const offstage = isOffstage(self, seen) || self.ledgeSide !== 0;
  const horizon = offstage ? BOT_RECOVERY_HORIZON_TICKS : BOT_HORIZON_TICKS;
  // First every option against a rival who keeps moving (cheap), then the most
  // promising ones also against a rival who shields: half the work, same pick.
  const ranked = options
    .map((option) => ({ option, moving: scoreIfMoving(seen, slot, rivalSlot, option, rivalMove, horizon) }))
    .sort((a, b) => b.moving - a.moving)
    .slice(0, BOT_SHORTLIST);
  let best = ranked[0]!.option;
  let bestScore = -Infinity;
  for (const { option, moving } of ranked) {
    const score = scoreBothGuesses(seen, slot, rivalSlot, option, rivalMove, horizon, moving) + (random(bot) * 2 - 1) * level.noise;
    if (score > bestScore) {
      bestScore = score;
      best = option;
    }
  }
  return best;
}

function optionsFor(self: Player, rival: Player, world: World, slot: number): Script[] {
  if (self.holdTicks > 0) return throwScripts();
  if (self.ledgeSide !== 0) return ledgeScripts(self);
  if (isOffstage(self, world)) return recoveryScripts(self, world);
  const situation = situationOf(self, rival, world, slot);
  if (self.shielding) return shieldScripts(situation);
  if (!isFree(self)) return [{ name: 'busy', minTicks: 1, interruptible: true, at: () => EMPTY_INPUT }];
  return self.grounded ? groundScripts(situation) : airScripts(situation);
}

function situationOf(self: Player, rival: Player, world: World, slot: number): Situation {
  const sx = self.x + self.width / 2;
  const rx = rival.x + rival.width / 2;
  const solid = world.solids[0];
  const middle = solid ? solid.x + solid.width / 2 : sx;
  const dx = Math.abs(rx - sx);
  const dy = Math.abs(rival.y + rival.height / 2 - (self.y + self.height / 2));
  const shotComing = world.projectiles.some((p) => p.owner !== slot && Math.abs(p.x - sx) < BOT_ATTACK_RANGE.x);
  return {
    self,
    toward: rx >= sx ? 1 : -1,
    out: rx >= middle ? 1 : -1,
    close: isActive(rival) && dx < BOT_ATTACK_RANGE.x && dy < BOT_ATTACK_RANGE.y,
    threatened: (isActive(rival) && rival.attackId !== 'none' && dx < BOT_ATTACK_RANGE.x) || shotComing,
  };
}
