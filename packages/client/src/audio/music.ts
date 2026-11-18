// Background music, composed here and played by a small step sequencer: an
// original night-time loop in A minor. 'menu' is calm (pad and arpeggio);
// 'match' adds drums and bass. Notes are scheduled slightly ahead with the
// audio clock, so a busy frame never makes the beat stumble.

import { audio } from './AudioEngine.ts';
import { midi, noise, tone } from './synth.ts';

export type Mood = 'menu' | 'match';

const BPM = 104;
const STEP_S = 60 / BPM / 4;
const STEPS_PER_BAR = 16;
/** How far ahead notes are scheduled (s), and how often the scheduler wakes up (ms). */
const LOOKAHEAD_S = 0.15;
const TICK_MS = 30;

/** Am – F – C – G, one chord per bar: [bass note, chord notes] as MIDI numbers. */
const CHORDS: [number, number[]][] = [
  [45, [69, 72, 76]],
  [41, [65, 69, 72]],
  [48, [67, 72, 76]],
  [43, [67, 71, 74]],
];
const ARP_ORDER = [0, 1, 2, 1];
const BASS_STEPS = new Set([0, 3, 6, 8, 11, 14]);
const KICK_STEPS = new Set([0, 7, 8, 10]);
const SNARE_STEPS = new Set([4, 12]);

class Music {
  private mood: Mood | null = null;
  private timer = 0;
  private step = 0;
  private nextTime = 0;

  /** Switches to this mood (from the next beat), starting the music once sound is available. */
  play(mood: Mood): void {
    if (this.mood === mood) return;
    this.mood = mood;
    audio.onUnlock(() => this.start());
  }

  private start(): void {
    const ctx = audio.context;
    if (!ctx || this.timer) return;
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), TICK_MS);
  }

  private schedule(): void {
    const ctx = audio.context;
    const out = audio.bus('music');
    if (!ctx || !out || ctx.state !== 'running') return;
    // After a pause (hidden tab), start again from now instead of catching up.
    if (this.nextTime < ctx.currentTime) this.nextTime = ctx.currentTime + 0.05;
    while (this.nextTime < ctx.currentTime + LOOKAHEAD_S) {
      this.playStep(ctx, out, this.step, this.nextTime);
      this.step = (this.step + 1) % (STEPS_PER_BAR * CHORDS.length);
      this.nextTime += STEP_S;
    }
  }

  private playStep(ctx: AudioContext, out: AudioNode, step: number, at: number): void {
    const inBar = step % STEPS_PER_BAR;
    const [bass, chord] = CHORDS[Math.floor(step / STEPS_PER_BAR)]!;
    const match = this.mood === 'match';
    if (inBar === 0) pad(ctx, out, chord, at, match ? 0.025 : 0.04);
    if (inBar % 2 === 0) {
      const note = chord[ARP_ORDER[(inBar / 2) % ARP_ORDER.length]!]! + (inBar >= 8 ? 12 : 0);
      tone(ctx, out, { type: 'triangle', freq: midi(note), duration: STEP_S * 1.8, gain: match ? 0.05 : 0.06 }, at);
    }
    if (!match) return;
    if (BASS_STEPS.has(inBar)) tone(ctx, out, { type: 'sawtooth', freq: midi(bass), duration: STEP_S * 1.6, gain: 0.12, lowpass: 600 }, at);
    if (KICK_STEPS.has(inBar)) tone(ctx, out, { freq: 120, to: 40, duration: 0.18, gain: 0.35 }, at);
    if (SNARE_STEPS.has(inBar)) noise(ctx, out, { filter: 'bandpass', freq: 1800, q: 0.7, duration: 0.14, gain: 0.16 }, at);
    if (inBar % 2 === 1) noise(ctx, out, { filter: 'highpass', freq: 7000, duration: 0.03, gain: 0.05 }, at);
  }
}

/** A soft chord held for the whole bar. */
function pad(ctx: AudioContext, out: AudioNode, chord: number[], at: number, gain: number): void {
  for (const note of chord) {
    tone(ctx, out, { freq: midi(note - 12), duration: STEP_S * STEPS_PER_BAR, gain, attack: 0.4 }, at);
  }
}

export const music = new Music();
