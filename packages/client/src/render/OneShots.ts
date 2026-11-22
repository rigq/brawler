import Phaser from 'phaser';

/** A sheet played once: which texture, how many frames, how long each lasts. */
export interface OneShotSheet {
  key: string;
  frames: number;
  frameMs: number;
}

interface Playing {
  sprite: Phaser.GameObjects.Sprite;
  sheet: OneShotSheet;
  ageMs: number;
}

/**
 * Pixel-art effects that play once and vanish (impact sparks, dust, bursts):
 * one sprite per effect, stepped through its frames, then destroyed. Render only.
 */
export class OneShots {
  private readonly scene: Phaser.Scene;
  private readonly depth: number;
  /** Told about every sprite made (e.g. so the UI camera ignores it). */
  private readonly onCreate: (object: Phaser.GameObjects.GameObject) => void;
  private playing: Playing[] = [];

  constructor(scene: Phaser.Scene, depth: number, onCreate: (object: Phaser.GameObjects.GameObject) => void = () => {}) {
    this.scene = scene;
    this.depth = depth;
    this.onCreate = onCreate;
  }

  /** Plays `sheet` centred on (x, y); `originY` 1 puts its bottom there instead (dust on the floor). */
  play(sheet: OneShotSheet, x: number, y: number, options: { scale?: number; flipX?: boolean; originY?: number; rotation?: number } = {}): void {
    if (!this.scene.textures.exists(sheet.key)) return;
    const sprite = this.scene.add
      .sprite(x, y, sheet.key, 0)
      .setOrigin(0.5, options.originY ?? 0.5)
      .setScale(options.scale ?? 1)
      .setFlipX(options.flipX ?? false)
      .setRotation(options.rotation ?? 0)
      .setDepth(this.depth);
    this.onCreate(sprite);
    this.playing.push({ sprite, sheet, ageMs: 0 });
  }

  update(frameMs: number): void {
    for (const p of this.playing) {
      p.ageMs += frameMs;
      const frame = Math.floor(p.ageMs / p.sheet.frameMs);
      if (frame >= p.sheet.frames) p.sprite.destroy();
      else p.sprite.setFrame(frame);
    }
    this.playing = this.playing.filter((p) => p.sprite.active);
  }

  destroy(): void {
    for (const p of this.playing) p.sprite.destroy();
    this.playing = [];
  }
}
