// Turns what happens in a match into sounds. Like HitEffects, it only compares
// each frame's World with the previous one (damage went up = a hit, stocks went
// down = a KO…), so it works the same with a local World and with one mirrored
// from the server.

import {
  SHIELD_BREAK_STUN_TICKS,
  attackCharge,
  attackData,
  attackPhase,
  counterHolds,
  rouletteChoice,
  isActive,
  type AttackId,
  type CharacterId,
  type Player,
  type World,
} from '@brawler/shared';
import { playSfx, type SfxName } from './sfx.ts';

/** Plays a sound (tests pass one that just records the names). */
export type Play = (name: SfxName, strength?: number) => void;

/** While typing a prompt, one key click every this many ticks. */
const TYPE_EVERY_TICKS = 3;
/** A hit of this much damage (or more) sounds as hard as it gets. */
const FULL_HIT_DAMAGE = 18;
/** Landing faster than this (px/s) makes a thud; harder up to `fullLandSpeed`. */
const LAND = { minSpeed: 250, fullSpeed: 1200 } as const;
/** Attacks that cut the air with a swing sound (specials have their own). */
const SWINGS = new Set<AttackId>([
  'jab1', 'jab2', 'jab3', 'lightSide', 'lightUp', 'lightDown',
  'airNeutral', 'airForward', 'airBack', 'airUp', 'airDown',
  'heavySide', 'heavyUp', 'heavyDown',
]);
/** What a projectile sounds like when fired, and when it disappears (if anything). */
const PROJECTILE_SOUND: Record<string, { fire: SfxName; burst?: SfxName }> = {
  shell: { fire: 'cannon', burst: 'blast' },
  smoke: { fire: 'puff' },
  ball: { fire: 'spike' },
  bubble: { fire: 'type' },
  star: { fire: 'sparkle' },
  bomb: { fire: 'drop', burst: 'blast' },
  clone: { fire: 'sparkle', burst: 'blast' },
};
/** Neutral specials heard when they start (the others are heard through their projectile). */
const NEUTRAL_SPECIAL_SOUND: Partial<Record<CharacterId, SfxName>> = { chachin: 'scream' };
/** Up specials: a launch for everyone, Samu teleports. */
const UP_SPECIAL_SOUND: Partial<Record<CharacterId, SfxName>> = { samu: 'teleport' };

/** The few fields of a player compared from one frame to the next. */
interface Seen {
  damage: number;
  /** Hit flash on: tells a real hit from damage set by hand (training keys). */
  flashing: boolean;
  stocks: number;
  active: boolean;
  grounded: boolean;
  vy: number;
  airJumpsLeft: number;
  dodgeKind: string;
  attackId: AttackId | 'none';
  attackCharging: boolean;
  fullyCharged: boolean;
  shieldStunTicks: number;
  hitstunTicks: number;
  holdTicks: number;
  ledgeSide: number;
  /** Roulette option showing while charging ('' when not). */
  pick: string;
  countering: boolean;
  attackTick: number;
  /** A tether pulling (active phase with a ledge hooked). */
  pulling: boolean;
  /** Starting up a tether recovery (typing the prompt). */
  typing: boolean;
  taunting: boolean;
  powerStacks: number;
}

function seen(p: Player): Seen {
  return {
    damage: p.damage,
    flashing: p.hitFlashTicks > 0,
    stocks: p.stocks,
    active: isActive(p),
    grounded: p.grounded,
    vy: p.vy,
    airJumpsLeft: p.airJumpsLeft,
    dodgeKind: p.dodgeKind,
    attackId: p.attackId,
    attackCharging: p.attackCharging,
    fullyCharged: p.attackCharging && attackCharge(p) >= 1,
    shieldStunTicks: p.shieldStunTicks,
    hitstunTicks: p.hitstunTicks,
    holdTicks: p.holdTicks,
    ledgeSide: p.ledgeSide,
    pick: rouletteChoice(p) ?? '',
    countering: counterHolds(p),
    attackTick: p.attackTick,
    pulling: p.tetherSide !== 0 && attackPhase(p) === 'active',
    typing: p.attackId !== 'none' && attackPhase(p) === 'startup' && attackData(p, p.attackId).tether !== undefined,
    taunting: p.tauntTicks > 0,
    powerStacks: p.powerStacks,
  };
}

export class MatchSounds {
  private last: Seen[] = [];
  private projectiles = new Map<number, { kind: string; strength: number }>();
  private resultPlayed = false;

  private readonly play: Play;

  constructor(play: Play = playSfx) {
    this.play = play;
  }

  /** Call once per rendered frame with the World being drawn. */
  update(world: World, matchOver: boolean): void {
    const now = world.players.map(seen);
    world.players.forEach((player, i) => {
      const before = this.last[i];
      if (before) playerSounds(this.play, before, now[i]!, player.characterId);
    });
    this.last = now;
    this.projectileSounds(world);
    if (matchOver && !this.resultPlayed) this.play('victory');
    this.resultPlayed = matchOver;
  }

  private projectileSounds(world: World): void {
    // Strength 0 for a normal shot, up to 1 for a fully charged one (power 1 → 1.5).
    const current = new Map(world.projectiles.map((p) => [p.id, { kind: p.kind, strength: (p.power - 1) * 2 }]));
    for (const [id, { kind, strength }] of current) {
      if (!this.projectiles.has(id)) this.play(PROJECTILE_SOUND[kind]?.fire ?? 'zap', strength);
    }
    for (const [id, { kind, strength }] of this.projectiles) {
      const burst = PROJECTILE_SOUND[kind]?.burst;
      if (!current.has(id) && burst) this.play(burst, strength);
    }
    this.projectiles = current;
  }
}

function playerSounds(play: Play, before: Seen, now: Seen, character: CharacterId): void {
  if (now.stocks < before.stocks) return play('ko');
  if (!before.active && now.active) return play('respawn');
  if (!now.active) return;
  combatSounds(play, before, now);
  movementSounds(play, before, now);
  attackSounds(play, before, now, character);
}

function combatSounds(play: Play, before: Seen, now: Seen): void {
  const dealt = now.damage - before.damage;
  if (dealt > 0 && now.flashing) play('hit', dealt / FULL_HIT_DAMAGE);
  else if (now.hitstunTicks >= SHIELD_BREAK_STUN_TICKS && before.hitstunTicks < SHIELD_BREAK_STUN_TICKS) play('shieldBreak');
  if (now.shieldStunTicks > before.shieldStunTicks) play('block');
  if (now.holdTicks > 0 && before.holdTicks === 0) play('grab');
}

function movementSounds(play: Play, before: Seen, now: Seen): void {
  if (now.airJumpsLeft < before.airJumpsLeft) play('airJump');
  else if (before.grounded && !now.grounded && now.vy < 0 && now.attackId === 'none') play('jump');
  if (!before.grounded && now.grounded && before.vy > LAND.minSpeed) play('land', before.vy / LAND.fullSpeed);
  if (now.dodgeKind !== 'none' && now.dodgeKind !== before.dodgeKind) play('whoosh', 0.5);
  if (now.ledgeSide !== 0 && before.ledgeSide === 0) play('ledge');
}

function attackSounds(play: Play, before: Seen, now: Seen, character: CharacterId): void {
  if (now.fullyCharged && !before.fullyCharged) play('chargeFull');
  if (now.pick && now.pick !== before.pick) play('rouletteTick');
  // Refused: the counter jumped straight to its recovery instead of running out.
  if (before.countering && !now.countering && now.attackId === before.attackId && now.attackTick - before.attackTick > 1) play('counter');
  if (now.pulling && !before.pulling) play('zip');
  if (now.taunting && !before.taunting) play('taunt');
  if (now.powerStacks > before.powerStacks) play('puff');
  // Typing the emergency prompt, frozen in the air: a key every few ticks.
  if (now.typing && now.attackTick !== before.attackTick && now.attackTick % TYPE_EVERY_TICKS === 0) play('type');
  const started = now.attackId !== 'none' && now.attackId !== before.attackId;
  const released = before.attackCharging && !now.attackCharging && now.attackId !== 'none';
  if (released || (started && !now.attackCharging && SWINGS.has(now.attackId as AttackId))) {
    play('swing', now.attackId.startsWith('heavy') ? 1 : 0.3);
  }
  if (!started) return;
  if (now.attackId === 'specialNeutral') {
    const sound = NEUTRAL_SPECIAL_SOUND[character];
    if (sound) play(sound);
  }
  if (now.attackId === 'specialUp') play(UP_SPECIAL_SOUND[character] ?? 'rocket');
}
