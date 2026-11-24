// Trying an option without doing it: copy the world, play the option for a
// while (the rival doing what it is expected to do), and score how it went.

import { attackPhase } from '../combat/attacks.ts';
import { BOT_RIVAL_GUESSES, BOT_SCORE } from '../constants.ts';
import { EMPTY_INPUT, type PlayerInput } from '../input.ts';
import type { Player } from '../sim/player.ts';
import { isActive } from '../sim/stocks.ts';
import { stepWorld, type World } from '../sim/world.ts';
import { isOffstage, nearestSolid, recoveryInput } from './recovery.ts';
import type { Script } from './scripts.ts';

/** At most this many extra ticks following a launch. */
const LAUNCH_FOLLOW_TICKS = 150;
/** Only launches with at least this much stun left are followed. */
const LAUNCH_FOLLOW_MIN_STUN = 20;

/** A copy deep enough to play forward: players and projectiles are flat objects. */
export function cloneWorld(world: World): World {
  return {
    ...world,
    players: world.players.map((p) => ({ ...p })),
    projectiles: world.projectiles.map((p) => ({ ...p })),
  };
}

/**
 * What the CPU has not had time to see is not there yet: the rival's attack
 * (or charge) younger than `reactionTicks`, and shots fired that recently.
 */
export function hideUnseen(world: World, slot: number, reactionTicks: number): void {
  world.players.forEach((p, i) => {
    if (i === slot || p.attackId === 'none') return;
    const age = p.attackCharging ? p.attackChargeTicks : p.attackTick;
    if (age < reactionTicks) {
      p.attackId = 'none';
      p.attackCharging = false;
    }
  });
  world.projectiles = world.projectiles.filter((shot) => shot.owner === slot || shot.lifetime - shot.ticksLeft >= reactionTicks);
}

/** The rival: comes back if off the stage, otherwise keeps moving the way it was (and maybe shields). */
function rivalInput(rival: Player, world: World, lastMove: PlayerInput, shields: boolean): PlayerInput {
  if (isOffstage(rival, world)) return recoveryInput(rival, world);
  return shields ? { ...lastMove, dodge: true } : lastMove;
}

/** The option's score if the rival keeps moving as it was. */
export function scoreIfMoving(world: World, slot: number, rivalSlot: number, script: Script, rivalMove: PlayerInput, horizon: number): number {
  return scoreAgainst(world, slot, rivalSlot, script, rivalMove, horizon, false);
}

/** Adds the other guess, the rival shielding, to a score from scoreIfMoving (weighted by BOT_RIVAL_GUESSES). */
export function scoreBothGuesses(world: World, slot: number, rivalSlot: number, script: Script, rivalMove: PlayerInput, horizon: number, moving: number): number {
  const shields = scoreAgainst(world, slot, rivalSlot, script, rivalMove, horizon, true);
  return moving * BOT_RIVAL_GUESSES.moves + shields * BOT_RIVAL_GUESSES.shields;
}

/** The CPU after its script: comes back if off the stage, otherwise stays put. */
function afterScript(self: Player, world: World): PlayerInput {
  return isOffstage(self, world) ? recoveryInput(self, world) : EMPTY_INPUT;
}

/** Free to act: not attacking, dodging, shielding, stunned or stuck. */
export function isFree(p: Player): boolean {
  return p.attackId === 'none' && p.dodgeKind === 'none' && p.lagTicks === 0 && p.hitstunTicks === 0
    && p.hitstopTicks === 0 && p.holdTicks === 0 && p.grabbedTicks === 0 && !p.shielding;
}

/** Stuck in its own attack or lag (whiffed or not), where a free rival could punish it. */
function exposed(self: Player, rival: Player): boolean {
  const stuck = (self.attackId !== 'none' && attackPhase(self) === 'recovery') || self.lagTicks > 0;
  if (!stuck || !isFree(rival) || !isActive(rival)) return false;
  return Math.abs(self.x + self.width / 2 - (rival.x + rival.width / 2)) < BOT_SCORE.exposedRange;
}

/** Plays `script` for `slot` in a copy of `world` for `horizon` ticks and scores it. */
function scoreAgainst(world: World, slot: number, rivalSlot: number, script: Script, rivalMove: PlayerInput, horizon: number, rivalShields: boolean): number {
  const sim = cloneWorld(world);
  const self = sim.players[slot]!;
  const rival = sim.players[rivalSlot]!;
  const start = { dealt: rival.damage, taken: self.damage, rivalStocks: rival.stocks, selfStocks: self.stocks, shield: rival.shieldHealth };
  let scriptOver = false;
  let exposedTicks = 0;
  let busyTicks = 0;
  let launch = 0;
  let launchDamage = 0;
  const inputs: PlayerInput[] = [];
  for (let t = 0; t < horizon; t++) {
    if (!scriptOver && t >= script.minTicks && isFree(self)) scriptOver = true;
    inputs[slot] = scriptOver ? afterScript(self, sim) : script.at(t, self);
    inputs[rivalSlot] = rivalInput(rival, sim, rivalMove, rivalShields);
    stepWorld(sim, inputs);
    if (exposed(self, rival)) exposedTicks += 1;
    if (self.attackId !== 'none') busyTicks += 1;
    if (rival.hitstunTicks > 0) {
      const speed = Math.hypot(rival.vx, rival.vy);
      if (speed > launch) {
        launch = speed;
        launchDamage = rival.damage;
      }
    }
    if (self.stocks < start.selfStocks || rival.stocks < start.rivalStocks) break;
  }
  // A weak hit (short stun) cannot kill: following it would only cost time.
  if (rival.stocks === start.rivalStocks && rival.hitstunTicks >= LAUNCH_FOLLOW_MIN_STUN) followLaunch(sim, slot, rivalSlot);
  const rivalKo = rival.stocks < start.rivalStocks;
  const selfKo = self.stocks < start.selfStocks;
  let score = 0;
  score += (rivalKo ? 0 : rival.damage - start.dealt) * BOT_SCORE.dealt;
  score -= (selfKo ? 0 : self.damage - start.taken) * BOT_SCORE.taken;
  if (rivalKo) score += BOT_SCORE.rivalKo;
  if (selfKo) score -= BOT_SCORE.selfKo;
  score += launch * (launchDamage / 100) * BOT_SCORE.launch;
  score -= exposedTicks * BOT_SCORE.exposed + busyTicks * BOT_SCORE.commit;
  score += Math.max(0, start.shield - rival.shieldHealth) * BOT_SCORE.shieldPressure;
  if (!selfKo) score -= positionCost(self, rival, sim);
  if (!rivalKo) score += rivalOutValue(rival, sim);
  return score;
}

/**
 * A rival still flying from a hit when the look-ahead ends: follow the flight
 * (helpless until the stun ends) to see whether it reaches the blast zone.
 * A KO takes longer than the look-ahead, and seeing it is what makes the CPU finish stocks.
 */
function followLaunch(sim: World, slot: number, rivalSlot: number): void {
  const self = sim.players[slot]!;
  const rival = sim.players[rivalSlot]!;
  const stocks = rival.stocks;
  const inputs: PlayerInput[] = [];
  for (let t = 0; t < LAUNCH_FOLLOW_TICKS && (rival.hitstunTicks > 0 || rival.hitstopTicks > 0); t++) {
    inputs[slot] = afterScript(self, sim);
    inputs[rivalSlot] = EMPTY_INPUT;
    stepWorld(sim, inputs);
    if (rival.stocks < stocks) return;
  }
}

/** The rival off the stage, far from the ledge and hurt: close to a KO. */
function rivalOutValue(rival: Player, world: World): number {
  if (!isActive(rival) || !isOffstage(rival, world)) return 0;
  const solid = nearestSolid(rival, world);
  if (!solid) return 0;
  const cx = rival.x + rival.width / 2;
  const gapX = cx < solid.x ? solid.x - cx : cx > solid.x + solid.width ? cx - solid.x - solid.width : 0;
  const gapY = Math.max(0, rival.y - solid.y);
  return (gapX + gapY) * BOT_SCORE.rivalOut * (1 + rival.damage / 100);
}

/** Small preferences that break ties when nothing hits: near the middle, at its favourite distance, on the stage. */
function positionCost(self: Player, rival: Player, world: World): number {
  const solid = nearestSolid(self, world);
  const cx = self.x + self.width / 2;
  let cost = 0;
  if (solid) cost += Math.abs(cx - (solid.x + solid.width / 2)) * BOT_SCORE.center;
  if (isActive(rival)) {
    // Height counts too: standing on a platform right above the rival is not "close".
    const dx = cx - (rival.x + rival.width / 2);
    const dy = self.y + self.height - (rival.y + rival.height);
    const off = Math.abs(Math.hypot(dx, dy) - BOT_SCORE.idealRange);
    cost += off * BOT_SCORE.spacing * (1 + rival.damage / 100);
  }
  if (isOffstage(self, world)) cost += BOT_SCORE.offstage;
  return cost;
}
