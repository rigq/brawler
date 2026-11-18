// The two building blocks of every sound: a tone (oscillator) and a burst of
// filtered noise, each with a quick attack and an exponential fade.

/** Silence for exponential ramps (they cannot reach 0). */
const SILENT = 0.0001;
const DEFAULT_ATTACK = 0.005;

export interface ToneSpec {
  type?: OscillatorType;
  /** Start pitch (Hz) and, optionally, where it slides to by the end. */
  freq: number;
  to?: number;
  /** Seconds. */
  duration: number;
  gain: number;
  attack?: number;
  /** Seconds from now (or from `at`). */
  delay?: number;
  /** Through a low-pass at this frequency (Hz): softer, rounder. */
  lowpass?: number;
}

export interface NoiseSpec {
  duration: number;
  gain: number;
  /** Which part of the noise is heard: low rumble, a band, or hiss. */
  filter: BiquadFilterType;
  freq: number;
  to?: number;
  q?: number;
  attack?: number;
  delay?: number;
}

let noiseBuffer: AudioBuffer | null = null;

/** One second of white noise, made once (render only: Math.random is fine). */
function whiteNoise(ctx: BaseAudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer;
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buffer;
  return buffer;
}

/** A gain that rises to `peak` in `attack` s and fades out by `duration`. */
function envelope(ctx: BaseAudioContext, start: number, peak: number, attack: number, duration: number): GainNode {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(SILENT, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(SILENT, start + duration);
  return gain;
}

/** Slides a parameter from `from` to `to` over the sound (exponential: sounds natural for pitch). */
function slide(param: AudioParam, from: number, to: number | undefined, start: number, duration: number): void {
  param.setValueAtTime(from, start);
  if (to !== undefined) param.exponentialRampToValueAtTime(Math.max(to, 1), start + duration);
}

export function tone(ctx: BaseAudioContext, out: AudioNode, spec: ToneSpec, at = ctx.currentTime): void {
  const start = at + (spec.delay ?? 0);
  const osc = ctx.createOscillator();
  osc.type = spec.type ?? 'sine';
  slide(osc.frequency, spec.freq, spec.to, start, spec.duration);
  const env = envelope(ctx, start, spec.gain, spec.attack ?? DEFAULT_ATTACK, spec.duration);
  let node: AudioNode = osc;
  if (spec.lowpass) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = spec.lowpass;
    node = node.connect(filter);
  }
  node.connect(env).connect(out);
  osc.start(start);
  osc.stop(start + spec.duration + 0.02);
}

export function noise(ctx: BaseAudioContext, out: AudioNode, spec: NoiseSpec, at = ctx.currentTime): void {
  const start = at + (spec.delay ?? 0);
  const source = ctx.createBufferSource();
  source.buffer = whiteNoise(ctx);
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = spec.filter;
  filter.Q.value = spec.q ?? 1;
  slide(filter.frequency, spec.freq, spec.to, start, spec.duration);
  const env = envelope(ctx, start, spec.gain, spec.attack ?? DEFAULT_ATTACK, spec.duration);
  source.connect(filter).connect(env).connect(out);
  source.start(start);
  source.stop(start + spec.duration + 0.02);
}

/** MIDI note number to Hz (69 = A4 = 440 Hz). */
export function midi(note: number): number {
  return 440 * 2 ** ((note - 69) / 12);
}
