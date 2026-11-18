// Grabs: the answer to shields. A grab goes through them, but loses to any attack.
// While holding someone you pick a throw (forward, back, up, down); if you take too long, they get away.

import {
  GRAB_HOLD_TICKS,
  GRAB_PULL_SHARE,
  GRAB_RELEASE_LAG_TICKS,
  THROW_LAG_TICKS,
  THROW_MIN_HOLD_TICKS,
  type AttackId,
} from '../constants.ts';
import type { PlayerInput } from '../input.ts';
import type { Player } from '../sim/player.ts';
import { freezeBoth } from './hits.ts';
import { applyKnockback, interrupt } from './knockback.ts';

export type ThrowKind = 'none' | 'forward' | 'back' | 'up' | 'down';

export interface GrabState {
  /** Slot of the player being held, or -1. */
  holdingSlot: number;
  /** Ticks left to pick a throw while holding someone. */
  holdTicks: number;
  /** The throw picked, relative to where the holder faces; 'none' = not yet. */
  throwKind: ThrowKind;
  /** > 0 while being held: no control, cannot be hit. */
  grabbedTicks: number;
}

const THROW_ATTACK: Record<Exclude<ThrowKind, 'none'>, AttackId> = {
  forward: 'throwForward', back: 'throwBack', up: 'throwUp', down: 'throwDown',
};

export function createGrabState(): GrabState {
  return { holdingSlot: -1, holdTicks: 0, throwKind: 'none', grabbedTicks: 0 };
}

export function startGrab(holder: Player, target: Player, targetSlot: number): void {
  interrupt(target);
  target.hitstunTicks = 0;
  target.vx = 0;
  target.vy = 0;
  target.grabbedTicks = GRAB_HOLD_TICKS;
  holder.attackId = 'none';
  holder.vx = 0;
  holder.holdingSlot = targetSlot;
  holder.holdTicks = GRAB_HOLD_TICKS;
  holder.throwKind = 'none';
}

/** Read while holding: a direction throws that way (up and down win), light throws forward. */
export function chooseThrow(holder: Player, input: PlayerInput): void {
  const lightPressed = input.light && !holder.lightHeld;
  holder.lightHeld = input.light;
  if (holder.throwKind !== 'none') return;
  const dirX = Number(input.right) - Number(input.left);
  if (input.up) holder.throwKind = 'up';
  else if (input.down) holder.throwKind = 'down';
  else if (dirX !== 0) holder.throwKind = dirX === holder.facing ? 'forward' : 'back';
  else if (lightPressed) holder.throwKind = 'forward';
}

/** Runs once per step after hits: pulls held players to the hands, then throws or releases. */
export function resolveGrabs(players: Player[]): void {
  for (const holder of players) {
    if (holder.holdTicks === 0) continue;
    const target = players[holder.holdingSlot];
    if (!target) {
      endHold(holder);
      continue;
    }
    holder.holdTicks -= 1;
    target.grabbedTicks = holder.holdTicks;
    pullTowards(target, heldSpot(holder, target, holder.facing));
    const heldFor = GRAB_HOLD_TICKS - holder.holdTicks;
    if (holder.throwKind !== 'none' && heldFor >= THROW_MIN_HOLD_TICKS) throwTarget(holder, target);
    else if (holder.holdTicks === 0) release(holder, target);
  }
}

/** Puts the target on the throw's side: knockback always sends it away from the holder. */
function throwTarget(holder: Player, target: Player): void {
  const kind = holder.throwKind === 'none' ? 'forward' : holder.throwKind;
  const side = kind === 'back' ? -holder.facing : holder.facing;
  placeAt(target, heldSpot(holder, target, side === 1 ? 1 : -1));
  const dealt = applyKnockback(holder, target, { id: THROW_ATTACK[kind], charge: 0 });
  target.grabbedTicks = 0;
  endHold(holder);
  holder.lagTicks = THROW_LAG_TICKS;
  freezeBoth(holder, target, dealt);
}

function release(holder: Player, target: Player): void {
  target.grabbedTicks = 0;
  // Let go standing beside the holder: without this it would count as airborne for a tick.
  placeAt(target, heldSpot(holder, target, holder.facing));
  target.grounded = holder.grounded;
  endHold(holder);
  holder.lagTicks = GRAB_RELEASE_LAG_TICKS;
}

function endHold(holder: Player): void {
  holder.holdingSlot = -1;
  holder.holdTicks = 0;
  holder.throwKind = 'none';
}

interface Spot {
  x: number;
  y: number;
}

/**
 * Where a held player stands: touching the holder's `side`, feet on the
 * holder's feet. Matching the feet (not the heads) matters when sizes differ:
 * a tall rival held by a short one would end up inside the floor.
 */
function heldSpot(holder: Player, target: Player, side: 1 | -1): Spot {
  return {
    x: side === 1 ? holder.x + holder.width : holder.x - target.width,
    y: holder.y + holder.height - target.height,
  };
}

/** Closes part of the gap each tick (feet always on the holder's feet). */
function pullTowards(target: Player, spot: Spot): void {
  target.x += (spot.x - target.x) * GRAB_PULL_SHARE;
  target.y = spot.y;
}

function placeAt(target: Player, spot: Spot): void {
  target.x = target.prevX = spot.x;
  target.y = target.prevY = spot.y;
}
