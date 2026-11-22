// Every sound effect, made from tones and noise (see synth.ts): no audio files.
// `strength` (0..1) scales the ones that depend on how hard something was.

import { audio } from './AudioEngine.ts';
import { midi, noise, tone } from './synth.ts';

type Maker = (ctx: AudioContext, out: AudioNode, strength: number) => void;

const SOUNDS = {
  /** A punch landing: a thump plus a crack, deeper and longer the harder it was. */
  hit: (ctx, out, s) => {
    tone(ctx, out, { freq: 190 - 70 * s, to: 45, duration: 0.12 + 0.18 * s, gain: 0.5 + 0.4 * s });
    noise(ctx, out, { filter: 'bandpass', freq: 2600 - 1200 * s, to: 500, q: 0.8, duration: 0.06 + 0.12 * s, gain: 0.35 + 0.35 * s });
    if (s > 0.55) tone(ctx, out, { type: 'sawtooth', freq: 110, to: 35, duration: 0.25 * s, gain: 0.18 * s, lowpass: 900 });
  },
  /** Blocked by the shield: a bright knock. */
  block: (ctx, out) => {
    tone(ctx, out, { type: 'triangle', freq: 1100, to: 760, duration: 0.09, gain: 0.25 });
    noise(ctx, out, { filter: 'highpass', freq: 3500, duration: 0.05, gain: 0.15 });
  },
  /** The shield breaks: glass and a falling whine. */
  shieldBreak: (ctx, out) => {
    for (const [i, note] of [96, 91, 88, 84].entries()) tone(ctx, out, { type: 'triangle', freq: midi(note), duration: 0.18, gain: 0.15, delay: i * 0.035 });
    noise(ctx, out, { filter: 'highpass', freq: 5000, to: 1500, duration: 0.35, gain: 0.25 });
    tone(ctx, out, { type: 'sawtooth', freq: 600, to: 120, duration: 0.6, gain: 0.08, lowpass: 2000 });
  },
  /** Knocked out: a big boom with a long tail. */
  ko: (ctx, out) => {
    noise(ctx, out, { filter: 'lowpass', freq: 1400, to: 60, duration: 1.1, gain: 0.8, attack: 0.01 });
    tone(ctx, out, { freq: 80, to: 28, duration: 0.9, gain: 0.7 });
    tone(ctx, out, { type: 'square', freq: 1320, to: 660, duration: 0.25, gain: 0.07, lowpass: 3000 });
  },
  jump: (ctx, out) => tone(ctx, out, { type: 'square', freq: 260, to: 520, duration: 0.09, gain: 0.07, lowpass: 2200 }),
  airJump: (ctx, out) => tone(ctx, out, { type: 'square', freq: 390, to: 780, duration: 0.09, gain: 0.07, lowpass: 2600 }),
  land: (ctx, out, s) => noise(ctx, out, { filter: 'lowpass', freq: 380, to: 90, duration: 0.09, gain: 0.15 + 0.25 * s }),
  /** Air rushing: rolls and dodges. */
  whoosh: (ctx, out, s) => noise(ctx, out, { filter: 'bandpass', freq: 500, to: 2200, q: 1.2, duration: 0.12 + 0.06 * s, gain: 0.12 + 0.1 * s, attack: 0.03 }),
  /** An attack cutting the air (lighter and shorter than a whoosh). */
  swing: (ctx, out, s) => noise(ctx, out, { filter: 'bandpass', freq: 1500 - 700 * s, to: 3200 - 1400 * s, q: 1.5, duration: 0.07 + 0.08 * s, gain: 0.1 + 0.08 * s, attack: 0.01 }),
  /** The heavy reached full charge. */
  chargeFull: (ctx, out) => {
    tone(ctx, out, { freq: midi(81), duration: 0.18, gain: 0.12 });
    tone(ctx, out, { freq: midi(88), duration: 0.22, gain: 0.1, delay: 0.05 });
  },
  grab: (ctx, out) => {
    tone(ctx, out, { type: 'square', freq: 150, to: 110, duration: 0.07, gain: 0.12, lowpass: 900 });
    noise(ctx, out, { filter: 'bandpass', freq: 900, duration: 0.05, gain: 0.12 });
  },
  ledge: (ctx, out) => tone(ctx, out, { type: 'triangle', freq: 520, to: 420, duration: 0.05, gain: 0.12 }),
  respawn: (ctx, out) => tone(ctx, out, { type: 'triangle', freq: midi(72), to: midi(84), duration: 0.35, gain: 0.1, attack: 0.05 }),
  /** Donate's tank fires; `s` = how charged the shell was (0 = a tap): deeper and longer. */
  cannon: (ctx, out, s) => {
    noise(ctx, out, { filter: 'lowpass', freq: 1600 - 500 * s, to: 90, duration: 0.5 + 0.35 * s, gain: 0.55 + 0.25 * s });
    tone(ctx, out, { freq: 110 - 35 * s, to: 38 - 10 * s, duration: 0.4 + 0.3 * s, gain: 0.5 + 0.25 * s });
  },
  /** Something explodes where it lands; bigger with `s`. */
  blast: (ctx, out, s) => {
    noise(ctx, out, { filter: 'lowpass', freq: 2000 - 600 * s, to: 120, duration: 0.45 + 0.35 * s, gain: 0.45 + 0.3 * s });
    tone(ctx, out, { freq: 70 - 20 * s, to: 30 - 8 * s, duration: 0.35 + 0.3 * s, gain: 0.35 + 0.25 * s });
  },
  /** Robert blows smoke. */
  puff: (ctx, out) => noise(ctx, out, { filter: 'lowpass', freq: 900, to: 250, duration: 0.45, gain: 0.3, attack: 0.08 }),
  /** Samu spikes the ball. */
  spike: (ctx, out) => {
    tone(ctx, out, { type: 'square', freq: 520, to: 180, duration: 0.1, gain: 0.15, lowpass: 1800 });
    noise(ctx, out, { filter: 'bandpass', freq: 1800, duration: 0.06, gain: 0.3 });
  },
  /** Any other shot. */
  zap: (ctx, out) => tone(ctx, out, { type: 'sawtooth', freq: 900, to: 300, duration: 0.15, gain: 0.08, lowpass: 2500 }),
  /** Chachin screams: two rough voices wobbling, and breath. */
  scream: (ctx, out) => {
    for (const [i, f] of [620, 655].entries()) {
      tone(ctx, out, { type: 'sawtooth', freq: f, to: f * 0.75, duration: 0.7, gain: 0.09, lowpass: 2400, attack: 0.04, delay: i * 0.01 });
    }
    noise(ctx, out, { filter: 'bandpass', freq: 1300, to: 900, q: 2, duration: 0.7, gain: 0.15, attack: 0.05 });
  },
  /** Launched up by a recovery. */
  rocket: (ctx, out) => {
    noise(ctx, out, { filter: 'bandpass', freq: 300, to: 3000, q: 1, duration: 0.45, gain: 0.3, attack: 0.03 });
    tone(ctx, out, { type: 'triangle', freq: 200, to: 800, duration: 0.35, gain: 0.08 });
  },
  /** Samu vanishes towards his flag. */
  teleport: (ctx, out) => {
    tone(ctx, out, { freq: 1500, to: 300, duration: 0.3, gain: 0.12 });
    tone(ctx, out, { freq: 300, to: 1500, duration: 0.3, gain: 0.1, delay: 0.25 });
  },
  /** The AI roulette moves on to the next icon. */
  rouletteTick: (ctx, out) => tone(ctx, out, { type: 'square', freq: 1180, duration: 0.03, gain: 0.06, lowpass: 4000 }),
  /** A counter refuses a hit: a firm "no" (two falling notes) and a knock. */
  counter: (ctx, out) => {
    tone(ctx, out, { type: 'triangle', freq: midi(79), duration: 0.12, gain: 0.16 });
    tone(ctx, out, { type: 'triangle', freq: midi(72), duration: 0.22, gain: 0.16, delay: 0.1 });
    noise(ctx, out, { filter: 'bandpass', freq: 2400, duration: 0.06, gain: 0.25 });
  },
  /** A text bubble flies out: a keyboard click. */
  type: (ctx, out) => noise(ctx, out, { filter: 'highpass', freq: 4500, duration: 0.025, gain: 0.18 }),
  /** Twin stars: a bright shimmer. */
  sparkle: (ctx, out) => {
    for (const [i, note] of [88, 93, 100].entries()) tone(ctx, out, { freq: midi(note), duration: 0.18, gain: 0.07, delay: i * 0.04 });
  },
  /** A tether pulls: a fast rising zip. */
  zip: (ctx, out) => {
    noise(ctx, out, { filter: 'bandpass', freq: 600, to: 4000, q: 2, duration: 0.25, gain: 0.25 });
    tone(ctx, out, { type: 'sawtooth', freq: 220, to: 880, duration: 0.2, gain: 0.05, lowpass: 2500 });
  },
  /** A taunt: a cheeky little "ta-da". */
  taunt: (ctx, out) => {
    tone(ctx, out, { type: 'square', freq: midi(72), duration: 0.08, gain: 0.07, lowpass: 3000 });
    tone(ctx, out, { type: 'square', freq: midi(79), duration: 0.16, gain: 0.07, lowpass: 3000, delay: 0.09 });
  },
  /** A bomb let go: a short falling whistle. */
  drop: (ctx, out) => tone(ctx, out, { freq: 1400, to: 500, duration: 0.25, gain: 0.06 }),
  /** "3", "2", "1". */
  countBeep: (ctx, out) => tone(ctx, out, { type: 'square', freq: midi(69), duration: 0.14, gain: 0.08, lowpass: 2500 }),
  /** "¡YA!": higher and longer, with a hit of noise. */
  countGo: (ctx, out) => {
    tone(ctx, out, { type: 'square', freq: midi(81), duration: 0.4, gain: 0.1, lowpass: 3000 });
    noise(ctx, out, { filter: 'bandpass', freq: 1800, duration: 0.15, gain: 0.15 });
  },
  menuMove: (ctx, out) => tone(ctx, out, { type: 'triangle', freq: 700, duration: 0.04, gain: 0.08 }),
  menuConfirm: (ctx, out) => {
    tone(ctx, out, { type: 'triangle', freq: midi(76), duration: 0.07, gain: 0.12 });
    tone(ctx, out, { type: 'triangle', freq: midi(83), duration: 0.1, gain: 0.12, delay: 0.06 });
  },
  menuBack: (ctx, out) => tone(ctx, out, { type: 'triangle', freq: 520, to: 330, duration: 0.09, gain: 0.1 }),
  /** The match is over. */
  victory: (ctx, out) => {
    for (const [i, note] of [72, 76, 79, 84].entries()) tone(ctx, out, { type: 'square', freq: midi(note), duration: i === 3 ? 0.6 : 0.14, gain: 0.08, lowpass: 3000, delay: i * 0.12 });
  },
} satisfies Record<string, Maker>;

export type SfxName = keyof typeof SOUNDS;

/** Plays an effect now (nothing happens before the first click or key press). */
export function playSfx(name: SfxName, strength = 1): void {
  const ctx = audio.context;
  const out = audio.bus('sfx');
  if (!ctx || !out || ctx.state !== 'running') return;
  SOUNDS[name](ctx, out, Number.isFinite(strength) ? Math.max(0, Math.min(1, strength)) : 1);
}
