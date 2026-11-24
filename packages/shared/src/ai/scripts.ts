// What the CPU can choose to do: short "scripts" of buttons, tick by tick
// (walk a bit, short hop + up aerial, charge the heavy 30 ticks…). They are
// plain functions of the tick and the player, so the same script gives the
// same buttons when it is tried in a copy of the world and when it is played.

import { attackData } from '../combat/attacks.ts';
import { DROP_HOLD_TICKS } from '../constants.ts';
import { EMPTY_INPUT, type PlayerInput } from '../input.ts';
import type { Player } from '../sim/player.ts';
import { recoveryInput } from './recovery.ts';
import type { StageGeometry } from '../sim/collision.ts';

export interface Script {
  name: string;
  /** Buttons on tick `t` of the script (0 = the first). */
  at(t: number, self: Player): PlayerInput;
  /** Runs at least this many ticks, then ends as soon as the player is free to act. */
  minTicks: number;
  /** Movement and shield: rethought every few ticks. Attacks run to the end. */
  interruptible: boolean;
}

type Dir = -1 | 0 | 1;
type Aerial = 'neutral' | 'forward' | 'back' | 'up' | 'down';

const press = (parts: Partial<PlayerInput>): PlayerInput => ({ ...EMPTY_INPUT, ...parts });
const side = (dir: number): Partial<PlayerInput> => ({ left: dir < 0, right: dir > 0 });

/** Holding a direction (or nothing) for a few ticks. */
function move(name: string, dir: Dir, ticks: number, extra: Partial<PlayerInput> = {}): Script {
  return { name, minTicks: ticks, interruptible: true, at: () => press({ ...side(dir), ...extra }) };
}

/**
 * Presses `buttons` on tick `lead`, holding them `hold` ticks. `dir` only on the
 * press (it picks the way it faces): held longer, it would slide while charging.
 */
function attack(name: string, buttons: Partial<PlayerInput>, dir: Dir, hold = 1, lead = 0): Script {
  return {
    name,
    minTicks: lead + hold + 1,
    interruptible: false,
    at: (t) => press({ ...(t === lead ? side(dir) : {}), ...(t >= lead && t < lead + hold ? buttons : {}) }),
  };
}

/** Light on the ground with no direction is the jab: if facing away, turn first (one tick). */
function jab(self: Player, dir: Dir): Script {
  const lead = self.facing === dir ? 0 : 1;
  return {
    name: 'jab',
    minTicks: lead + 14,
    interruptible: false,
    // Light again on ticks 7 and 14 chains the 2nd and 3rd hits.
    at: (t) => (t < lead ? press(side(dir)) : press({ light: [0, 7, 14].includes(t - lead) })),
  };
}

/** Buttons for an aerial of this kind, given where the player faces now. */
function aerialButtons(kind: Aerial, self: Player): Partial<PlayerInput> {
  switch (kind) {
    case 'up': return { light: true, up: true };
    case 'down': return { light: true, down: true };
    case 'forward': return { light: true, ...side(self.facing) };
    case 'back': return { light: true, ...side(-self.facing) };
    default: return { light: true };
  }
}

/**
 * A jump (short: tapped; full: held) drifting towards `drift`, with an aerial
 * on tick `when`. From the ground it is a hop; in the air, the double jump.
 */
function jumpAerial(name: string, kind: Aerial, drift: Dir, full: boolean, when: number): Script {
  const jumpTicks = full ? 14 : 1;
  return {
    name,
    minTicks: when + 2,
    interruptible: false,
    at: (t, self) => {
      if (t === when) return press({ ...side(drift), ...aerialButtons(kind, self), jump: t < jumpTicks });
      return press({ ...side(drift), jump: t < jumpTicks });
    },
  };
}

/** An aerial right now, drifting towards `drift`. */
function aerialNow(kind: Aerial, drift: Dir): Script {
  return {
    name: `air-${kind}${drift ? '-drift' : ''}`,
    minTicks: 2,
    interruptible: false,
    at: (t, self) => press({ ...side(drift), ...(t === 0 ? aerialButtons(kind, self) : {}) }),
  };
}

const AERIALS: Aerial[] = ['neutral', 'forward', 'back', 'up', 'down'];

/** Hold lengths worth trying for the neutral special: a tap, a full charge, or each roulette option. */
function specialHolds(self: Player): number[] {
  const data = attackData(self, 'specialNeutral');
  if (data.roulette) return data.roulette.options.map((_, i) => i * data.roulette!.stepTicks + 2);
  if (data.chargeTicks) return [1, data.chargeTicks + 1];
  return [1];
}

function specials(self: Player, dir: Dir): Script[] {
  return specialHolds(self).map((hold) => attack(`special-${hold}`, { special: true }, dir, hold));
}

/** Grab, then throw towards `throwDir` (or up). */
function grabThrow(name: string, dir: Dir, throwButtons: Partial<PlayerInput>): Script {
  return {
    name,
    minTicks: 4,
    interruptible: false,
    at: (t) => (t === 0 ? press({ ...side(dir), grab: true }) : t >= 2 ? press(throwButtons) : EMPTY_INPUT),
  };
}

/** Context for building the options: where the rival is, and which way is "out" of the stage for them. */
export interface Situation {
  self: Player;
  /** Towards the rival (never 0). */
  toward: -1 | 1;
  /** From the middle of the stage towards the rival: throwing this way sends them out. */
  out: -1 | 1;
  /** Close enough for the close attacks to be worth trying. */
  close: boolean;
  /** Something is coming at it (an attack or a shot it has seen): defensive options too. */
  threatened: boolean;
}

/** On the ground, free to act. */
export function groundScripts(s: Situation): Script[] {
  const { self, toward: d } = s;
  const list: Script[] = [move('wait', 0, 6), move('walk-in', d, 6), move('walk-out', -d as Dir, 6)];
  if (self.onPlatform) list.push({ ...move('drop', 0, DROP_HOLD_TICKS + 2, { down: true }), interruptible: false });
  list.push(...specials(self, d));
  if (s.close) {
    list.push(
      jab(self, d),
      attack('light-side', { light: true }, d),
      attack('light-up', { light: true, up: true }, d),
      attack('light-down', { light: true, down: true }, d),
      attack('heavy-side', { heavy: true }, d),
      attack('heavy-side-charged', { heavy: true }, d, 30),
      attack('heavy-up', { heavy: true, up: true }, d),
      attack('heavy-up-charged', { heavy: true, up: true }, d, 30),
      attack('heavy-down', { heavy: true, down: true }, d),
      grabThrow('grab-out', d, side(s.out)),
      grabThrow('grab-up', d, { up: true }),
    );
    for (const kind of AERIALS) {
      list.push(jumpAerial(`hop-${kind}`, kind, d, false, 3));
      list.push(jumpAerial(`jump-${kind}`, kind, d, true, 10));
    }
  } else {
    list.push(move('run-in-jump', d, 10, { jump: true }));
  }
  if (s.threatened) list.push(...defenceScripts(d));
  return list;
}

function defenceScripts(d: Dir): Script[] {
  return [
    move('shield', 0, 4, { dodge: true }),
    attack('spot-dodge', { dodge: true, down: true }, 0, 2),
    attack('roll-away', { dodge: true, ...side(-d) }, 0, 2),
    attack('roll-through', { dodge: true, ...side(d) }, 0, 2),
    { ...move('jump-away', -d as Dir, 12, { jump: true }), interruptible: false },
  ];
}

/** In the air (and over the stage), free to act. */
export function airScripts(s: Situation): Script[] {
  const { self, toward: d } = s;
  const list: Script[] = [move('drift-in', d, 4), move('drift-out', -d as Dir, 4), move('float', 0, 4), move('fast-fall', 0, 4, { down: true })];
  list.push(...specials(self, d));
  if (s.close) {
    for (const kind of AERIALS) {
      list.push(aerialNow(kind, d), aerialNow(kind, 0));
      if (self.airJumpsLeft > 0) list.push(jumpAerial(`double-${kind}`, kind, d, false, 4));
    }
  }
  if (s.threatened && self.airDodgeAvailable) {
    list.push(attack('air-dodge-out', { dodge: true, ...side(-d) }, 0, 1), attack('air-dodge', { dodge: true }, 0, 1));
  }
  return list;
}

/** Holding the shield: keep it, or get out of it (grab, jump, roll, dodge, drop it). */
export function shieldScripts(s: Situation): Script[] {
  const d = s.toward;
  const list: Script[] = [
    move('keep-shield', 0, 3, { dodge: true }),
    move('drop-shield', 0, 3),
    attack('shield-grab', { dodge: true, light: true }, 0),
    attack('shield-roll-away', { dodge: true, ...side(-d) }, 0, 2),
    attack('shield-roll-through', { dodge: true, ...side(d) }, 0, 2),
    attack('shield-spot', { dodge: true, down: true }, 0, 2),
  ];
  for (const kind of ['up', 'neutral', 'forward'] as Aerial[]) list.push(jumpAerial(`shield-jump-${kind}`, kind, d, false, 3));
  return list;
}

/** Holding the rival: one throw of each kind. */
export function throwScripts(): Script[] {
  return [
    attack('throw-left', { left: true }, 0, 3),
    attack('throw-right', { right: true }, 0, 3),
    attack('throw-up', { up: true }, 0, 3),
    attack('throw-down', { down: true }, 0, 3),
  ];
}

/** Hanging from a ledge: the ways up (each a fresh press), or waiting a little. */
export function ledgeScripts(self: Player): Script[] {
  const toStage = -self.ledgeSide as Dir;
  return [
    move('hang', 0, 8),
    attack('ledge-climb', side(toStage), 0, 2),
    attack('ledge-jump', { jump: true }, 0, 1),
    attack('ledge-attack', { light: true }, 0, 1),
    attack('ledge-roll', { dodge: true }, 0, 1),
  ];
}

/** Off the stage: the default way back, or one of its steps right now (rollouts judge which is best). */
export function recoveryScripts(self: Player, stage: StageGeometry): Script[] {
  const dir = recoveryInput(self, stage);
  const towards: Partial<PlayerInput> = { left: dir.left, right: dir.right };
  const list: Script[] = [
    { name: 'recover', minTicks: 4, interruptible: true, at: (_t, p) => recoveryInput(p, stage) },
    move('drift-back', (dir.right ? 1 : dir.left ? -1 : 0) as Dir, 4),
    attack('rec-up-special', { ...towards, up: true, special: true }, 0, 1),
    attack('rec-up-special-straight', { up: true, special: true }, 0, 1),
    attack('rec-boost', { ...towards, up: true, heavy: true }, 0, 1),
  ];
  if (self.airJumpsLeft > 0) list.push(attack('rec-jump', { ...towards, jump: true }, 0, 1));
  if (self.airDodgeAvailable) list.push(attack('rec-air-dodge', { ...towards, dodge: true }, 0, 1));
  return list;
}
