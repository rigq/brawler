import { AIR_DODGE_TICKS, ROLL_TICKS, SPOT_DODGE_TICKS, attackData, attackPhase, type AttackId, type Player } from '@brawler/shared';

/** Every body animation a character can have, named like its strip in art/<character>/anim/. */
export const ANIM_NAMES = [
  'idle', 'run', 'jump', 'fall', 'hurt',
  'jab', 'light-side', 'light-up', 'light-down', 'dash-attack',
  'air-neutral', 'air-forward', 'air-back', 'air-up', 'air-down',
  'heavy-side', 'heavy-up', 'heavy-down',
  'shield', 'roll', 'dodge', 'grab', 'throw', 'ledge',
  'special-neutral', 'special-up',
] as const;
export type AnimName = (typeof ANIM_NAMES)[number];

/** Moving faster than this on the ground plays the run cycle. */
const RUN_MIN_SPEED = 40;
const RUN_FRAME_MS = 80;
const IDLE_FRAME_MS = 220;
/** Slower than this vertically counts as the top of a jump (first frame of the fall). */
const APEX_SPEED = 150;
/** Flying faster than this when hit: the "knocked back" frame instead of the flinch. */
const HURT_LAUNCH_SPEED = 400;
/** Shield: raising frames, then this one is held. */
const SHIELD_HOLD_FRAME = 2;
const SHIELD_RAISE_FRAME_MS = 50;
/**
 * Share of the recovery that still shows the hit frame. The active phase lasts
 * 1–3 ticks: without this the strike pose flashes for ~30 ms and nobody sees it.
 */
const HIT_HOLD_SHARE = 0.4;

const ATTACK_ANIM: Record<AttackId, AnimName> = {
  jab1: 'jab', jab2: 'jab', jab3: 'jab', dash: 'dash-attack',
  lightSide: 'light-side', lightUp: 'light-up', lightDown: 'light-down',
  airNeutral: 'air-neutral', airForward: 'air-forward', airBack: 'air-back', airUp: 'air-up', airDown: 'air-down',
  heavySide: 'heavy-side', heavyUp: 'heavy-up', heavyDown: 'heavy-down',
  grab: 'grab', throwForward: 'throw', throwBack: 'throw',
  specialNeutral: 'special-neutral', specialUp: 'special-up', specialProjectile: 'special-neutral',
};

/**
 * The frame shown while the attack's hitbox is out (default 1): earlier frames
 * spread over the startup, later ones over the recovery.
 */
const HIT_FRAME: Partial<Record<AnimName, number>> = {
  'heavy-side': 2, 'heavy-up': 2, 'heavy-down': 2, grab: 0, 'special-up': 0,
};

/** A missing animation borrows the closest one; with none, the character's still pose is drawn. */
const FALLBACK: Partial<Record<AnimName, AnimName>> = {
  'light-up': 'heavy-up',
  'heavy-up': 'light-up',
  'air-down': 'fall',
  'dash-attack': 'light-side',
  'air-neutral': 'fall',
  dodge: 'fall',
  'special-neutral': 'jab',
};

/** How a character's idle plays: `restMs` on the first frame between play-throughs, `frameMs` per frame. */
export interface IdleTiming {
  restMs?: number;
  frameMs?: number;
}

/** What the player is doing, as an animation name (it may not exist for this character). */
export function animFor(player: Player): AnimName {
  if (player.ledgeSide !== 0) return 'ledge';
  if (player.hitstunTicks > 0 || player.grabbedTicks > 0) return 'hurt';
  if (player.holdTicks > 0) return 'grab';
  if (player.attackId !== 'none') return ATTACK_ANIM[player.attackId];
  if (player.parachuting) return 'special-up';
  if (player.dodgeKind === 'roll') return 'roll';
  if (player.dodgeKind === 'spot' || player.dodgeKind === 'air') return 'dodge';
  if (player.shielding) return 'shield';
  if (!player.grounded) return player.vy < 0 ? 'jump' : 'fall';
  if (player.lagTicks > 0) return 'jump';
  if (player.dodgeKind === 'dash' || Math.abs(player.vx) > RUN_MIN_SPEED) return 'run';
  return 'idle';
}

/** The animation to draw among the ones this character has, or null for its still pose. */
export function resolveAnim(name: AnimName, has: (name: AnimName) => boolean): AnimName | null {
  // Fallbacks may point at each other (light-up ↔ heavy-up): stop once one repeats.
  const tried = new Set<AnimName>();
  for (let n: AnimName | undefined = name; n && !tried.has(n); n = FALLBACK[n]) {
    if (has(n)) return n;
    tried.add(n);
  }
  return null;
}

/**
 * Which frame of `anim` (with `frames` frames) to show. `stateMs`: time since
 * this animation started; `clockMs`: a free-running clock for loops.
 */
export function frameFor(
  player: Player,
  anim: AnimName,
  frames: number,
  stateMs: number,
  clockMs: number,
  idle: IdleTiming = {},
): number {
  const last = frames - 1;
  const clamp = (f: number) => Math.max(0, Math.min(last, Math.floor(f)));
  if (player.holdTicks > 0) return last;
  if (player.attackId !== 'none') return attackFrame(player, anim, last);
  switch (anim) {
    case 'run': return Math.floor(clockMs / RUN_FRAME_MS) % frames;
    // Counted from when the player stopped, so a rest always comes before the first play-through.
    case 'idle': return idleFrame(frames, stateMs, idle.restMs ?? 0, idle.frameMs ?? IDLE_FRAME_MS);
    case 'jump': return player.grounded ? 0 : last;
    case 'fall': return Math.abs(player.vy) < APEX_SPEED ? 0 : last;
    case 'hurt': return Math.hypot(player.vx, player.vy) > HURT_LAUNCH_SPEED ? last : 0;
    case 'special-up': return last;
    case 'shield': return clamp(Math.min(SHIELD_HOLD_FRAME, 1 + stateMs / SHIELD_RAISE_FRAME_MS));
    case 'roll': return clamp(progress(player.dodgeTicks, ROLL_TICKS) * frames);
    case 'dodge': return clamp(progress(player.dodgeTicks, player.dodgeKind === 'air' ? AIR_DODGE_TICKS : SPOT_DODGE_TICKS) * frames);
    default: return 0;
  }
}

/**
 * Idle loop. With `restMs`, the first frame is held that long before each
 * play-through: an action (a drag on a cigarette) every few seconds instead of non-stop.
 */
function idleFrame(frames: number, idleMs: number, restMs: number, frameMs: number): number {
  const t = idleMs % (restMs + frames * frameMs);
  return t < restMs ? 0 : Math.floor((t - restMs) / frameMs);
}

/** 0 when `ticksLeft` is the whole duration, close to 1 at the end. */
function progress(ticksLeft: number, total: number): number {
  return 1 - ticksLeft / total;
}

/** Wind-up frames over the startup, the hit frame while active (and a while after), follow-through over the rest of the recovery. */
function attackFrame(player: Player, anim: AnimName, last: number): number {
  if (player.attackId === 'none') return 0;
  const hit = Math.min(HIT_FRAME[anim] ?? 1, last);
  const { startup, active, recovery } = attackData(player, player.attackId);
  const t = player.attackTick;
  switch (attackPhase(player)) {
    case 'charge': return 0;
    case 'startup': return startup > 0 ? Math.min(hit, Math.floor((t / startup) * hit)) : hit;
    case 'active': return hit;
    default: {
      const after = last - hit;
      const held = (t - startup - active) / recovery - HIT_HOLD_SHARE;
      if (after === 0 || recovery <= 0 || held < 0) return hit;
      return Math.min(last, hit + 1 + Math.floor((held / (1 - HIT_HOLD_SHARE)) * after));
    }
  }
}
