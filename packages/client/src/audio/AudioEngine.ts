// The one AudioContext of the game, with a bus (volume) for music and one for effects.
// Browsers only allow sound after the player clicks or presses a key, so the
// context is created on the first gesture; sounds asked for before that are skipped.

export type Bus = 'music' | 'sfx';

const STORAGE_KEY = 'losvatos.volume';
const DEFAULT_VOLUME: Record<Bus, number> = { music: 0.5, sfx: 0.8 };
/** Everything goes through this (0..1) before the limiter, so many sounds at once do not clip. */
const MASTER_GAIN = 0.8;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private readonly buses: Partial<Record<Bus, GainNode>> = {};
  private readonly volumes: Record<Bus, number> = loadVolumes();
  private readonly unlockListeners: (() => void)[] = [];

  /** The context, or null until the first click or key press (or if the browser has no Web Audio). */
  get context(): AudioContext | null {
    return this.ctx;
  }

  /** Where sounds of this kind connect to, or null if there is no sound yet. */
  bus(name: Bus): GainNode | null {
    return this.buses[name] ?? null;
  }

  volume(name: Bus): number {
    return this.volumes[name];
  }

  /** 0..1, applied at once and remembered in this browser. */
  setVolume(name: Bus, value: number): void {
    this.volumes[name] = Math.max(0, Math.min(1, value));
    this.buses[name]?.gain.setTargetAtTime(this.volumes[name], this.ctx?.currentTime ?? 0, 0.02);
    saveVolumes(this.volumes);
  }

  /** Runs `listener` once sound is available (at once if it already is). */
  onUnlock(listener: () => void): void {
    if (this.ctx) listener();
    else this.unlockListeners.push(listener);
  }

  /** Call once at startup: the first gesture creates the context; a hidden tab goes quiet. */
  install(): void {
    const unlock = () => {
      if (!this.create()) return;
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else void this.ctx.resume();
    });
  }

  private create(): boolean {
    if (this.ctx) return true;
    if (typeof AudioContext === 'undefined') return false;
    const ctx = new AudioContext();
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.ratio.value = 12;
    const master = ctx.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(limiter).connect(ctx.destination);
    for (const name of ['music', 'sfx'] as const) {
      const gain = ctx.createGain();
      gain.gain.value = this.volumes[name];
      gain.connect(master);
      this.buses[name] = gain;
    }
    this.ctx = ctx;
    void ctx.resume();
    for (const listener of this.unlockListeners.splice(0)) listener();
    return true;
  }
}

function loadVolumes(): Record<Bus, number> {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Record<Bus, unknown>>;
    const pick = (name: Bus) => (typeof saved[name] === 'number' ? (saved[name] as number) : DEFAULT_VOLUME[name]);
    return { music: pick('music'), sfx: pick('sfx') };
  } catch {
    return { ...DEFAULT_VOLUME };
  }
}

function saveVolumes(volumes: Record<Bus, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(volumes));
  } catch {
    // Private mode or storage blocked: the volume just isn't remembered.
  }
}

export const audio = new AudioEngine();
