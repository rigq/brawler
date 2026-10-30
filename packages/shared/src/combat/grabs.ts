// Grabs: the answer to shields. A grab goes through them, but loses to any attack.
// While holding someone you pick a throw; if you take too long, they get away.

import { GRAB_HOLD_TICKS, GRAB_RELEASE_LAG_TICKS, THROW_LAG_TICKS } from '../constants.ts';
import type { PlayerInput } from '../input.ts';
import type { Player } from '../sim/player.ts';
import { freezeBoth } from './hits.ts';
import { applyKnockback, interrupt } from './knockback.ts';

export interface GrabState {
  /** Slot of the player being held, or -1. */
  holdingSlot: number;
  /** Ticks left to pick a throw while holding someone. */
  holdTicks: number;
  /** Absolute direction of the throw picked this step (-1, 1), 0 = none yet. */
  throwDir: number;
  /** > 0 while being held: no control, cannot be hit. */
  grabbedTicks: number;
}

export function createGrabState(): GrabState {
  return { holdingSlot: -1, holdTicks: 0, throwDir: 0, grabbedTicks: 0 };
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
  holder.throwDir = 0;
}

/** Read while holding: a direction throws that way, light throws forward. */
export function chooseThrow(holder: Player, input: PlayerInput): void {
  const dirX = Number(input.right) - Number(input.left);
  if (dirX !== 0) holder.throwDir = dirX;
  else if (input.light && !holder.lightHeld) holder.throwDir = holder.facing;
  holder.lightHeld = input.light;
}

/** Runs once per step after hits: keeps held players in place, then throws or releases. */
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
    placeBeside(holder, target, holder.facing);
    if (holder.throwDir !== 0) throwTarget(holder, target);
    else if (holder.holdTicks === 0) release(holder, target);
  }
}

/** Puts the target on the throw's side: knockback always sends it away from the holder. */
function throwTarget(holder: Player, target: Player): void {
  const forward = holder.throwDir === holder.facing;
  placeBeside(holder, target, holder.throwDir === 1 ? 1 : -1);
  const dealt = applyKnockback(holder, target, { id: forward ? 'throwForward' : 'throwBack', charge: 0 });
  target.grabbedTicks = 0;
  endHold(holder);
  holder.lagTicks = THROW_LAG_TICKS;
  freezeBoth(holder, target, dealt);
}

function release(holder: Player, target: Player): void {
  target.grabbedTicks = 0;
  // It stands where the holder stands: without this it would count as airborne for a tick.
  target.grounded = holder.grounded;
  endHold(holder);
  holder.lagTicks = GRAB_RELEASE_LAG_TICKS;
}

function endHold(holder: Player): void {
  holder.holdingSlot = -1;
  holder.holdTicks = 0;
  holder.throwDir = 0;
}

function placeBeside(holder: Player, target: Player, side: 1 | -1): void {
  target.x = target.prevX = holder.x + side * holder.width;
  target.y = target.prevY = holder.y;
}
