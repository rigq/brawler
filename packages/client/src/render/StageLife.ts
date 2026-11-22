import Phaser from 'phaser';
import { CAMERA_MIN_ZOOM, WORLD_WIDTH, type StageGeometry } from '@brawler/shared';
import { lanternSpots } from './StageView.ts';
import { THEME } from './palette.ts';

// What moves on the stage while nobody touches it: drifting clouds, the
// lanterns' flickering light, fireflies, and now and then a shooting star.
// Render only (Math.random and the clock are fine here).

const DEPTH = { cloudsFar: -88, cloudsNear: -76, shootingStar: -94, glow: -16, fireflies: -14 } as const;
const COVER_W = (WORLD_WIDTH / CAMERA_MIN_ZOOM) * 1.4;

interface Cloud {
  x: number;
  y: number;
  width: number;
  /** px per second (they all drift the same way, the nearer ones faster). */
  speed: number;
}

interface CloudLayer {
  graphics: Phaser.GameObjects.Graphics;
  clouds: Cloud[];
  color: number;
  alpha: number;
}

interface Firefly {
  /** Centre of its wandering, a phase and how far it wanders. */
  homeX: number;
  homeY: number;
  phase: number;
  range: number;
}

const LANTERN_GLOW = { radius: 56, flickerMs: 90 } as const;
const GLOW_RINGS = 8;
const FIREFLY = { count: 14, color: 0xe9ff8a, radius: 1.4 } as const;
/** A shooting star every this many ms on average. */
const SHOOTING_STAR_EVERY_MS = 7000;

export class StageLife {
  private readonly layers: CloudLayer[];
  private readonly glow: Phaser.GameObjects.Graphics;
  private readonly flies: Phaser.GameObjects.Graphics;
  private readonly sky: Phaser.GameObjects.Graphics;
  private readonly lanterns: { x: number; y: number; seed: number }[];
  private readonly fireflies: Firefly[];
  private clockMs = 0;
  private star: { x: number; y: number; ageMs: number } | null = null;
  private nextStarMs = SHOOTING_STAR_EVERY_MS / 2;

  constructor(scene: Phaser.Scene, stage: StageGeometry) {
    this.layers = [
      this.cloudLayer(scene, { depth: DEPTH.cloudsFar, scroll: 0.15, count: 6, y: [40, 220], width: [180, 340], speed: 6, alpha: 0.035 }),
      this.cloudLayer(scene, { depth: DEPTH.cloudsNear, scroll: 0.4, count: 4, y: [560, 720], width: [260, 440], speed: 14, alpha: 0.03 }),
    ];
    this.glow = scene.add.graphics().setDepth(DEPTH.glow).setBlendMode(Phaser.BlendModes.ADD);
    this.flies = scene.add.graphics().setDepth(DEPTH.fireflies).setBlendMode(Phaser.BlendModes.ADD);
    this.sky = scene.add.graphics().setDepth(DEPTH.shootingStar).setScrollFactor(0.05);
    this.lanterns = stage.solids.flatMap((solid) => lanternSpots(solid)).map((spot, i) => ({ ...spot, seed: i * 1.7 }));
    const ground = stage.solids[0];
    this.fireflies = Array.from({ length: FIREFLY.count }, () => ({
      homeX: (ground?.x ?? 0) + Math.random() * (ground?.width ?? WORLD_WIDTH),
      homeY: (ground?.y ?? 500) - 30 - Math.random() * 220,
      phase: Math.random() * Math.PI * 2,
      range: 20 + Math.random() * 40,
    }));
  }

  get gameObjects(): Phaser.GameObjects.GameObject[] {
    return [...this.layers.map((l) => l.graphics), this.glow, this.flies, this.sky];
  }

  update(frameMs: number): void {
    this.clockMs += frameMs;
    for (const layer of this.layers) this.drawClouds(layer, frameMs);
    this.drawGlow();
    this.drawFireflies();
    this.drawShootingStar(frameMs);
  }

  private cloudLayer(
    scene: Phaser.Scene,
    o: { depth: number; scroll: number; count: number; y: [number, number]; width: [number, number]; speed: number; alpha: number },
  ): CloudLayer {
    const graphics = scene.add.graphics().setDepth(o.depth).setScrollFactor(o.scroll);
    const clouds = Array.from({ length: o.count }, (_, i) => ({
      x: WORLD_WIDTH / 2 - COVER_W / 2 + (i + Math.random() * 0.6) * (COVER_W / o.count),
      y: o.y[0] + Math.random() * (o.y[1] - o.y[0]),
      width: o.width[0] + Math.random() * (o.width[1] - o.width[0]),
      speed: o.speed * (0.7 + Math.random() * 0.6),
    }));
    return { graphics, clouds, color: THEME.moon, alpha: o.alpha };
  }

  /** Soft clouds made of overlapping ellipses, drifting right and coming back round on the left. */
  private drawClouds(layer: CloudLayer, frameMs: number): void {
    const g = layer.graphics.clear();
    const left = WORLD_WIDTH / 2 - COVER_W / 2;
    for (const c of layer.clouds) {
      c.x += (c.speed * frameMs) / 1000;
      if (c.x - c.width > left + COVER_W) c.x = left - c.width;
      // Several faint layers, wider and thinner towards the edge: soft borders instead of a flat shape.
      for (const spread of [1, 0.8, 0.6]) {
        g.fillStyle(layer.color, layer.alpha);
        g.fillEllipse(c.x, c.y, c.width * spread, c.width * 0.18 * spread);
        g.fillEllipse(c.x - c.width * 0.2 * spread, c.y - c.width * 0.05, c.width * 0.45 * spread, c.width * 0.16 * spread);
        g.fillEllipse(c.x + c.width * 0.16 * spread, c.y - c.width * 0.06, c.width * 0.4 * spread, c.width * 0.18 * spread);
      }
    }
  }

  /** Each lantern's light breathes and flickers like a flame (a few sines at odd speeds). */
  private drawGlow(): void {
    const g = this.glow.clear();
    const t = this.clockMs / LANTERN_GLOW.flickerMs;
    for (const l of this.lanterns) {
      const flicker = 0.82 + 0.1 * Math.sin(t * 0.7 + l.seed) + 0.06 * Math.sin(t * 2.3 + l.seed * 3) + 0.04 * Math.sin(t * 5.1 + l.seed);
      // Many faint rings, not three strong ones: a smooth falloff instead of visible steps.
      for (let ring = 0; ring < GLOW_RINGS; ring++) {
        const share = 1 - ring / GLOW_RINGS;
        g.fillStyle(THEME.lantern.glow, 0.04 * flicker).fillCircle(l.x, l.y, LANTERN_GLOW.radius * share * (0.92 + flicker * 0.1));
      }
    }
  }

  /** Little lights wandering in loops, each fading in and out. */
  private drawFireflies(): void {
    const g = this.flies.clear();
    const t = this.clockMs / 1000;
    for (const f of this.fireflies) {
      const x = f.homeX + Math.sin(t * 0.6 + f.phase) * f.range + Math.sin(t * 1.7 + f.phase * 2) * 6;
      const y = f.homeY + Math.cos(t * 0.45 + f.phase) * f.range * 0.5;
      const blink = Math.max(0, Math.sin(t * 1.3 + f.phase * 3));
      g.fillStyle(FIREFLY.color, 0.06 * blink).fillCircle(x, y, FIREFLY.radius * 3);
      g.fillStyle(FIREFLY.color, 0.85 * blink).fillCircle(x, y, FIREFLY.radius);
    }
  }

  /** Now and then, a streak across the top of the sky. */
  private drawShootingStar(frameMs: number): void {
    const g = this.sky.clear();
    this.nextStarMs -= frameMs;
    if (!this.star && this.nextStarMs <= 0) {
      this.star = { x: WORLD_WIDTH * (0.1 + Math.random() * 0.6), y: 30 + Math.random() * 120, ageMs: 0 };
      this.nextStarMs = SHOOTING_STAR_EVERY_MS * (0.6 + Math.random() * 0.8);
    }
    if (!this.star) return;
    const life = 700;
    this.star.ageMs += frameMs;
    const t = this.star.ageMs / life;
    if (t >= 1) {
      this.star = null;
      return;
    }
    const headX = this.star.x + t * 380;
    const headY = this.star.y + t * 140;
    const fade = Math.sin(t * Math.PI);
    g.lineStyle(2, THEME.star, 0.8 * fade).lineBetween(headX - 90, headY - 33, headX, headY);
    g.fillStyle(THEME.star, fade).fillCircle(headX, headY, 2);
  }
}
