import Phaser from 'phaser';
import { SHEETS } from './art.ts';
import { OneShots } from './OneShots.ts';
import {
  isActive,
  type Player,
} from '@brawler/shared';

/** Sparks in front of the players, afterimages just behind them (players are at depth 0). */
const DEPTH = { sparks: 10 } as const;
const SPARK = {
  lifeMs: 180,
  /** Rays per hit: base + damage dealt × perDamage. */
  baseRays: 5,
  raysPerDamage: 0.4,
  /** Ray length grows from minLength to maxLength (scaled by the hit) as it fades. */
  minLength: 10,
  maxLength: 46,
  ringRadius: 34,
  /** Size multiplier: a jab ≈ 1.1, a heavy ≈ 1.7, capped at maxScale. */
  minScale: 0.6,
  scalePerDamage: 1 / 12,
  maxScale: 2,
  color: 0xfff3c4,
  /** Hits at least this big (scale) also get the drawn rays and ring over the pixel-art spark. */
  raysFrom: 1.3,
} as const;
/** The pixel-art impact (art/common/hit-spark): 3 frames. */
const SPARK_SHEET = { key: SHEETS.fxSpark.key, frames: 3, frameMs: 55 } as const;
/** Strong hits (art/fx/heavy-spark): a bigger star with a ring, 4 frames. */
const HEAVY_SPARK_SHEET = { key: SHEETS.fxHeavySpark.key, frames: 4, frameMs: 60 } as const;
/** Hits of at least this much damage use the heavy spark. */
const HEAVY_SPARK_DAMAGE = 10;

interface Spark {
  x: number;
  y: number;
  /** Unit vectors of each ray. */
  rays: { dx: number; dy: number }[];
  /** Size multiplier, bigger for stronger hits. */
  scale: number;
  ageMs: number;
}


/**
 * Impact sparks (the launch trail is LaunchTrail). It finds hits on its own by watching each
 * player's damage go up (with the hit flash on), so it works the same with a local World and with one
 * mirrored from the server. Render only: Math.random is fine here.
 */
export class HitEffects {
  private readonly sparksGraphics: Phaser.GameObjects.Graphics;
  private readonly lastDamage: number[] = [];
  private sparks: Spark[] = [];

  private readonly shots: OneShots;

  constructor(scene: Phaser.Scene, onCreate: (object: Phaser.GameObjects.GameObject) => void = () => {}) {
    this.shots = new OneShots(scene, DEPTH.sparks, onCreate);
    this.sparksGraphics = scene.add.graphics().setDepth(DEPTH.sparks).setBlendMode(Phaser.BlendModes.ADD);
  }

  get gameObjects(): Phaser.GameObjects.GameObject[] {
    return [this.sparksGraphics];
  }

  /** Returns the damage dealt by each hit found this frame (empty if none), for the screen shake. */
  update(players: readonly Player[], frameMs: number): number[] {
    const hits: number[] = [];
    players.forEach((player, i) => {
      const dealt = player.damage - (this.lastDamage[i] ?? player.damage);
      this.lastDamage[i] = player.damage;
      // The flash tells a real hit from damage set by hand (training mode keys).
      if (dealt > 0 && player.hitFlashTicks > 0 && isActive(player)) {
        hits.push(dealt);
        this.spawnSpark(player, dealt);
      }
    });
    this.age(frameMs);
    this.shots.update(frameMs);
    this.draw();
    return hits;
  }

  /** On the side the hit came from: launched right means hit from the left. */
  private spawnSpark(player: Player, dealt: number): void {
    const side = player.vx > 0 ? -1 : player.vx < 0 ? 1 : 0;
    const count = Math.round(SPARK.baseRays + dealt * SPARK.raysPerDamage);
    const rays = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      return { dx: Math.cos(angle), dy: Math.sin(angle) };
    });
    const x = player.x + player.width / 2 + (side * player.width) / 2;
    const y = player.y + player.height * 0.4;
    const scale = Math.min(SPARK.minScale + dealt * SPARK.scalePerDamage, SPARK.maxScale);
    if (dealt >= HEAVY_SPARK_DAMAGE) this.shots.play(HEAVY_SPARK_SHEET, x, y, { scale: Math.min(1.6, scale * 0.9) });
    else this.shots.play(SPARK_SHEET, x, y, { scale: scale * 1.2, rotation: Math.random() * Math.PI * 2 });
    // The drawn rays only for the very biggest hits, on top of the art.
    if (scale >= SPARK.raysFrom + 0.4) this.sparks.push({ x, y, rays, scale, ageMs: 0 });
  }

  private age(frameMs: number): void {
    for (const spark of this.sparks) spark.ageMs += frameMs;
    this.sparks = this.sparks.filter((spark) => spark.ageMs < SPARK.lifeMs);
  }

  private draw(): void {
    const s = this.sparksGraphics.clear();
    for (const spark of this.sparks) {
      const t = spark.ageMs / SPARK.lifeMs;
      const fade = 1 - t;
      const inner = SPARK.minLength * spark.scale * t;
      const outer = (SPARK.minLength + (SPARK.maxLength - SPARK.minLength) * t) * spark.scale;
      s.lineStyle(3, SPARK.color, fade);
      for (const { dx, dy } of spark.rays) {
        s.lineBetween(spark.x + dx * inner, spark.y + dy * inner, spark.x + dx * outer, spark.y + dy * outer);
      }
      s.lineStyle(2, SPARK.color, fade * 0.6).strokeCircle(spark.x, spark.y, SPARK.ringRadius * spark.scale * t);
    }
  }
}
