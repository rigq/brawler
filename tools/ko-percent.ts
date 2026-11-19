// Balance helper: at what damage % does each character get knocked out by a
// heavy attack (uncharged and fully charged) from the edge of the stage? It counts only if the
// blast zone is crossed while still in hitstun: once hitstun ends the player
// could act (jump, recover), so that launch was survivable.
//
//   node tools/ko-percent.ts            (Samu hits)
//   node tools/ko-percent.ts robert     (another character hits: their own heavies)
//
// Use it before and after changing gravity, speeds, knockback or the blast
// zone, so the change is measured instead of guessed.

import { CHARACTER_IDS, isCharacterId, type CharacterId } from '../packages/shared/src/characters/index.ts';
import { attackData, flagReachable } from '../packages/shared/src/combat/attacks.ts';
import { applyKnockback } from '../packages/shared/src/combat/knockback.ts';
import { GROUND, type AttackId } from '../packages/shared/src/constants.ts';
import { EMPTY_INPUT, type PlayerInput } from '../packages/shared/src/input.ts';
import { teleportPlayer, type Player } from '../packages/shared/src/sim/player.ts';
import { tetherTarget } from '../packages/shared/src/sim/tether.ts';
import { createWorld, stepWorld, type World } from '../packages/shared/src/sim/world.ts';

/** Who hits: Samu (an average character, so only the target changes) unless another is named. */
const ATTACKER: CharacterId = isCharacterId(process.argv[2] ?? null) ? (process.argv[2] as CharacterId) : 'samu';
const MOVES: AttackId[] = ['heavySide', 'heavyUp'];
const MAX_DAMAGE = 400;
const STAGE_CENTER_X = GROUND.x + GROUND.width / 2;
const FLIGHT_TICKS = 600;

/**
 * A simple but sensible way back, from the moment hitstun ends: hold towards
 * the middle of the stage; a teleporting up special goes first (it needs no
 * height); otherwise, once falling below the stage's height, use every air
 * jump, then the up heavy's lift, then the up special, like a player would.
 */
function recoveryInput(
  victim: { x: number; vy: number; y: number; width: number; height: number; airJumpsLeft: number; jumpHeld: boolean; attackId: string },
  state: { boostDone: boolean; specialDone: boolean; teleports: boolean; tetherRange: number; stage: World },
): PlayerInput {
  // Towards the middle of the island (over it, that means not walking off the other side).
  const towardsLeft = victim.x + victim.width / 2 > STAGE_CENTER_X;
  const input: PlayerInput = { ...EMPTY_INPUT, left: towardsLeft, right: !towardsLeft };
  // A teleport (or a tether with a ledge in reach) needs no height: a good player uses it at once.
  const quick = (state.teleports && flagReachable(victim as Player)) || (state.tetherRange > 0 && tetherTarget(victim as Player, state.stage, state.tetherRange) !== null);
  if (quick && !state.specialDone && victim.attackId === 'none') {
    input.up = true;
    input.special = true;
    state.specialDone = true;
    return input;
  }
  const fallingBelowStage = victim.vy > 0 && victim.y + victim.height > GROUND.y - 40;
  if (!fallingBelowStage) return input;
  // Every air jump first (a fresh press each time), then the up heavy's lift, then the up special.
  if (victim.airJumpsLeft > 0) input.jump = !victim.jumpHeld;
  else if (!state.boostDone) {
    input.up = true;
    input.heavy = true;
    state.boostDone = true;
  } else if (!state.specialDone && victim.attackId === 'none') {
    input.up = true;
    input.special = true;
    state.specialDone = true;
  }
  return input;
}

/**
 * True if `target` at `damage` % dies when hit by `move` at the right edge.
 * `recover`: false = dies only if the launch alone crosses the blast zone
 * (still in hitstun); true = after hitstun it tries to come back (recoveryInput).
 */
function dies(target: CharacterId, move: AttackId, damage: number, recover = false, charge = 0): boolean {
  const world = createWorld([ATTACKER, target]);
  const [attacker, victim] = world.players as [NonNullable<(typeof world.players)[0]>, NonNullable<(typeof world.players)[1]>];
  const edge = GROUND.x + GROUND.width;
  teleportPlayer(victim, { x: edge - victim.width - 4, y: GROUND.y - victim.height, facing: -1 });
  teleportPlayer(attacker, { x: victim.x - attacker.width, y: GROUND.y - attacker.height, facing: 1 });
  victim.damage = damage;
  victim.invulnTicks = 0;
  applyKnockback(attacker, victim, { id: move, charge });
  const stocks = victim.stocks;
  let freeTicks = -1;
  const up = attackData(victim, 'specialUp');
  const state = { boostDone: false, specialDone: false, teleports: up.teleportToFlag === true, tetherRange: up.tether?.range ?? 0, stage: world };
  for (let i = 0; i < FLIGHT_TICKS; i++) {
    const free = victim.hitstunTicks === 0 && victim.hitstopTicks === 0;
    if (free) freeTicks += 1;
    const input = recover && free ? recoveryInput(victim, state) : EMPTY_INPUT;
    stepWorld(world, [EMPTY_INPUT, input]);
    if (victim.stocks < stocks) return true;
    if (free && !recover) return false;
    if (recover && free && freeTicks > 2 && (victim.grounded || victim.ledgeSide !== 0)) return false;
  }
  return false;
}

/** Lowest % that dies (binary search), or null if not even at MAX_DAMAGE. */
function koPercent(target: CharacterId, move: AttackId, recover: boolean, charge = 0): number | null {
  if (!dies(target, move, MAX_DAMAGE, recover, charge)) return null;
  let lo = 0;
  let hi = MAX_DAMAGE;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (dies(target, move, mid, recover, charge)) hi = mid;
    else lo = mid;
  }
  return hi;
}

// Columns: launch alone / trying to come back, uncharged and fully charged.
const columns = MOVES.flatMap((move) => [`${move}`, `+rec`, `charged`, `charged+rec`]);
console.log(['target', ...columns].map((c) => c.padEnd(12)).join(''));
for (const id of CHARACTER_IDS) {
  const cells = MOVES.flatMap((move) => [
    koPercent(id, move, false),
    koPercent(id, move, true),
    koPercent(id, move, false, 1),
    koPercent(id, move, true, 1),
  ]);
  console.log([id, ...cells.map((c) => (c === null ? '—' : `${c}%`))].map((c) => c.padEnd(12)).join(''));
}
console.log('\n"+rec": the target tries to come back (towards the middle of the stage; below its height, every air jump, the up heavy lift and the up special).');
console.log('"charged": the heavy charged to the maximum.');
