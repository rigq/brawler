import Phaser from 'phaser';
import {
  TRAIL_INTERVAL_MS,
  TRAIL_LIFE_MS,
  TRAIL_MIN_SPEED,
  isActive,
  type Player,
} from '@brawler/shared';

/** Sparks in front of the players, afterimages just behind them (players are at depth 0). */
const DEPTH = { trail: -1, sparks: 10 } as const;
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
} as const;
const TRAIL_START_ALPHA = 0.35;

interface Spark {
  x: number;
  y: number;
  /** Unit vectors of each ray. */
  rays: { dx: number; dy: number }[];
  /** Size multiplier, bigger for stronger hits. */
  scale: number;
  ageMs: number;
}

interface Ghost {
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  ageMs: number;
}

/**
 * Impact sparks and the launch trail. It finds hits on its own by watching each
 * player's damage go up (with the hit flash on), so it works the same with a local World and with one
 * mirrored from the server. Render only: Math.random is fine here.
 */
export class HitEffects {
  private readonly sparksGraphics: Phaser.GameObjects.Graphics;
  private readonly trailGraphics: Phaser.GameObjects.Graphics;
  private readonly colors: readonly number[];
  private readonly lastDamage: number[] = [];
  private readonly sinceGhostMs: number[] = [];
  private sparks: Spark[] = [];
  private ghosts: Ghost[] = [];

  constructor(scene: Phaser.Scene, colors: readonly number[]) {
    this.colors = colors;
    this.sparksGraphics = scene.add.graphics().setDepth(DEPTH.sparks).setBlendMode(Phaser.BlendModes.ADD);
    this.trailGraphics = scene.add.graphics().setDepth(DEPTH.trail);
  }

  get gameObjects(): Phaser.GameObjects.GameObject[] {
    return [this.trailGraphics, this.sparksGraphics];
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
      this.updateTrail(player, i, frameMs);
    });
    this.age(frameMs);
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
    this.sparks.push({
      x: player.x + player.width / 2 + (side * player.width) / 2,
      y: player.y + player.height * 0.4,
      rays,
      scale: Math.min(SPARK.minScale + dealt * SPARK.scalePerDamage, SPARK.maxScale),
      ageMs: 0,
    });
  }

  /** Drops an afterimage every TRAIL_INTERVAL_MS while the player flies fast in hitstun. */
  private updateTrail(player: Player, slot: number, frameMs: number): void {
    const flying = isActive(player) && player.hitstunTicks > 0 && player.hitstopTicks === 0;
    const fast = player.vx * player.vx + player.vy * player.vy > TRAIL_MIN_SPEED * TRAIL_MIN_SPEED;
    if (!flying || !fast) {
      this.sinceGhostMs[slot] = TRAIL_INTERVAL_MS; // first ghost appears at once next time
      return;
    }
    const since = (this.sinceGhostMs[slot] ?? 0) + frameMs;
    if (since < TRAIL_INTERVAL_MS) {
      this.sinceGhostMs[slot] = since;
      return;
    }
    this.sinceGhostMs[slot] = 0;
    const { x, y, width, height } = player;
    this.ghosts.push({ x, y, width, height, color: this.colors[slot] ?? 0xffffff, ageMs: 0 });
  }

  private age(frameMs: number): void {
    for (const spark of this.sparks) spark.ageMs += frameMs;
    for (const ghost of this.ghosts) ghost.ageMs += frameMs;
    this.sparks = this.sparks.filter((spark) => spark.ageMs < SPARK.lifeMs);
    this.ghosts = this.ghosts.filter((ghost) => ghost.ageMs < TRAIL_LIFE_MS);
  }

  private draw(): void {
    const g = this.trailGraphics.clear();
    for (const ghost of this.ghosts) {
      const alpha = TRAIL_START_ALPHA * (1 - ghost.ageMs / TRAIL_LIFE_MS);
      g.fillStyle(ghost.color, alpha).fillRect(ghost.x, ghost.y, ghost.width, ghost.height);
    }

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
