import Phaser from 'phaser';
import type { Projectile } from '@brawler/shared';
import { drawBubble, drawStar } from './aiIcons.ts';
import { PROJECTILE_ART, type ProjectileArt } from './art.ts';

/** Projectiles without art: a plain glowing ball. */
const ORB_COLOR = 0xfff3c4;
const FLIGHT_FRAME_MS = 80;
const BURST_FRAME_MS = 70;
/** 'life' animations: share of the lifetime spent appearing and breaking up. */
const LIFE_APPEAR = 0.15;
const LIFE_BREAK = 0.85;

/** Phaser counts an extra "__BASE" frame (the whole image) in every texture. */
function frameCount(sprite: Phaser.GameObjects.Sprite): number {
  return sprite.texture.frameTotal - 1;
}

/** Shots drawn in code, centred on (0, 0) of their Graphics; `spin`: turns per second. */
const DRAWN: Record<string, { draw: (g: Phaser.GameObjects.Graphics, p: Projectile) => void; spin?: number }> = {
  bubble: { draw: (g, p) => drawBubble(g, 0, 0, p.width, p.height) },
  star: { draw: (g, p) => drawStar(g, 0, 0, p.width / 18, 0x4e8cff, 0xa57bff), spin: 2 },
};

interface Flying {
  object: Phaser.GameObjects.Sprite | Phaser.GameObjects.Arc | Phaser.GameObjects.Graphics;
  kind: string;
  /** Drawn size / the art's size: a charged shot is bigger, and so is its explosion. */
  scale: number;
  centerX: number;
  centerY: number;
}

interface Burst {
  sprite: Phaser.GameObjects.Sprite;
  ageMs: number;
}

/**
 * Draws the World's projectiles, matching them by id between frames, and an
 * explosion where each one disappears (it hit someone or ran out of range).
 * Render only: it never decides anything.
 */
export class ProjectileView {
  private readonly scene: Phaser.Scene;
  /** Called with every object it creates, so the UI camera can ignore it. */
  private readonly onCreate: (object: Phaser.GameObjects.GameObject) => void;
  private readonly flying = new Map<number, Flying>();
  private bursts: Burst[] = [];
  private ageMs = 0;

  constructor(scene: Phaser.Scene, onCreate: (object: Phaser.GameObjects.GameObject) => void) {
    this.scene = scene;
    this.onCreate = onCreate;
  }

  /** Removes every projectile and explosion on screen. */
  destroy(): void {
    for (const view of this.flying.values()) view.object.destroy();
    for (const burst of this.bursts) burst.sprite.destroy();
    this.flying.clear();
    this.bursts = [];
  }

  render(projectiles: readonly Projectile[], alpha: number, frameMs: number): void {
    this.ageMs += frameMs;
    const seen = new Set<number>();
    for (const p of projectiles) {
      seen.add(p.id);
      const view = this.flying.get(p.id) ?? this.create(p);
      const x = p.prevX + (p.x - p.prevX) * alpha;
      const y = p.prevY + (p.y - p.prevY) * alpha;
      view.centerX = x + p.width / 2;
      view.centerY = y + p.height / 2;
      const art = PROJECTILE_ART[p.kind];
      if (art && view.object instanceof Phaser.GameObjects.Sprite) {
        view.object.setPosition(view.centerX, view.centerY).setFlipX(p.vx < 0);
        view.object.setFrame(this.frameFor(art, p, frameCount(view.object)));
      } else {
        view.object.setPosition(view.centerX, view.centerY);
        const spin = DRAWN[p.kind]?.spin;
        if (spin) view.object.setRotation((this.ageMs / 1000) * spin * Math.PI * 2 * Math.sign(p.vx || 1));
      }
    }
    for (const [id, view] of this.flying) {
      if (seen.has(id)) continue;
      this.explode(view);
      view.object.destroy();
      this.flying.delete(id);
    }
    this.updateBursts(frameMs);
  }

  private create(p: Projectile): Flying {
    const art = PROJECTILE_ART[p.kind];
    const scale = art ? p.width / art.sheet.frameWidth : 1;
    const drawn = DRAWN[p.kind];
    const object = art
      ? this.scene.add.sprite(p.x, p.y, art.sheet.key, 0).setOrigin(0.5, 0.5).setScale(scale)
      : drawn
        ? this.drawShot(drawn.draw, p)
        : this.scene.add.circle(p.x, p.y, p.width / 2, ORB_COLOR);
    this.onCreate(object);
    const view: Flying = { object, kind: p.kind, scale, centerX: p.x, centerY: p.y };
    this.flying.set(p.id, view);
    return view;
  }

  private drawShot(draw: (g: Phaser.GameObjects.Graphics, p: Projectile) => void, p: Projectile): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    draw(g, p);
    return g;
  }

  private frameFor(art: ProjectileArt, p: Projectile, frames: number): number {
    const loop = Math.floor(this.ageMs / FLIGHT_FRAME_MS);
    if (art.animation === 'loop' || frames < 4) return loop % frames;
    const age = 1 - p.ticksLeft / Math.max(p.lifetime, 1);
    if (age < LIFE_APPEAR / 2) return 0;
    if (age < LIFE_APPEAR) return 1;
    if (age >= LIFE_BREAK) return frames - 1;
    return 2 + (loop % (frames - 3));
  }

  private explode(view: Flying): void {
    const burst = PROJECTILE_ART[view.kind]?.burst;
    if (!burst) return;
    const sprite = this.scene.add.sprite(view.centerX, view.centerY, burst.key, 0).setOrigin(0.5, 0.5).setScale(view.scale);
    this.onCreate(sprite);
    this.bursts.push({ sprite, ageMs: 0 });
  }

  private updateBursts(frameMs: number): void {
    for (const burst of this.bursts) {
      burst.ageMs += frameMs;
      const frame = Math.floor(burst.ageMs / BURST_FRAME_MS);
      if (frame < frameCount(burst.sprite)) burst.sprite.setFrame(frame);
      else burst.sprite.destroy();
    }
    this.bursts = this.bursts.filter((burst) => burst.sprite.active);
  }
}
