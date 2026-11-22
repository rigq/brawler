import Phaser from 'phaser';
import { GROUND, isActive, type World } from '@brawler/shared';

/** Depth: in front of the stage, behind the players' sparks. */
const DEPTH = { dust: 2, ko: 9 } as const;
const DUST = {
  color: 0xd8cfc0,
  lifeMs: 380,
  /** Landing faster than this (px/s) raises dust; harder landings raise more. */
  landSpeed: 260,
  landPuffs: 7,
  jumpPuffs: 4,
  speed: 70,
  radius: 4,
} as const;
const KO = {
  lifeMs: 650,
  /** In screen px: the beam is drawn on the screen, not in the world (the camera moves away as soon as someone is out). */
  length: 1100,
  width: 60,
  /** The beam starts at the edge of the screen, this far inside it. */
  margin: 24,
} as const;

interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  ageMs: number;
}

interface Beam {
  x: number;
  y: number;
  /** Unit vector from the stage towards where the player flew off. */
  dx: number;
  dy: number;
  color: number;
  ageMs: number;
}

/**
 * Moments that make a match feel alive: dust when someone jumps or lands, and
 * a big beam of their colour where they were knocked out. Found by comparing
 * each frame with the last (works with a mirrored World too). Render only.
 */
export class MatchFx {
  private readonly graphics: Phaser.GameObjects.Graphics;
  /** Screen space (drawn by the UI camera): KO beams. */
  private readonly screen: Phaser.GameObjects.Graphics;
  private readonly camera: Phaser.Cameras.Scene2D.Camera;
  private readonly colors: readonly number[];
  private last: { grounded: boolean; vy: number; stocks: number; x: number; y: number; airJumps: number }[] = [];
  private puffs: Puff[] = [];
  private beams: Beam[] = [];

  constructor(scene: Phaser.Scene, colors: readonly number[]) {
    this.graphics = scene.add.graphics().setDepth(DEPTH.dust);
    this.screen = scene.add.graphics().setDepth(DEPTH.ko);
    this.camera = scene.cameras.main;
    this.colors = colors;
  }

  /** Drawn in the world (with the zooming camera). */
  get worldObjects(): Phaser.GameObjects.GameObject[] {
    return [this.graphics];
  }

  /** Drawn on the screen (with the fixed UI camera). */
  get screenObjects(): Phaser.GameObjects.GameObject[] {
    return [this.screen];
  }

  update(world: World, frameMs: number): void {
    world.players.forEach((p, i) => {
      const before = this.last[i];
      const feetX = p.x + p.width / 2;
      const feetY = p.y + p.height;
      if (before && isActive(p)) {
        if (p.grounded && !before.grounded && before.vy > DUST.landSpeed) this.dust(feetX, feetY, DUST.landPuffs * Math.min(2, before.vy / 800 + 0.6));
        else if (!p.grounded && before.grounded && p.vy < 0) this.dust(feetX, feetY, DUST.jumpPuffs);
        else if (p.airJumpsLeft < before.airJumps) this.ring(feetX, feetY);
      }
      if (before && p.stocks < before.stocks) this.knockOut(before.x, before.y, this.colors[i] ?? 0xffffff);
      this.last[i] = { grounded: p.grounded, vy: p.vy, stocks: p.stocks, x: feetX, y: p.y + p.height / 2, airJumps: p.airJumpsLeft };
    });
    this.age(frameMs);
    this.draw();
  }

  /** Puffs rolling out to both sides of the feet. Render only: Math.random is fine. */
  private dust(x: number, y: number, count: number): void {
    for (let i = 0; i < Math.round(count); i++) {
      const side = i % 2 === 0 ? 1 : -1;
      this.puffs.push({
        x: x + side * (4 + Math.random() * 8),
        y: y - 2,
        vx: side * DUST.speed * (0.5 + Math.random()),
        vy: -15 - Math.random() * 25,
        radius: DUST.radius * (0.7 + Math.random() * 0.8),
        ageMs: 0,
      });
    }
  }

  /** An air jump: a small ring of air kicked downwards. */
  private ring(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI;
      this.puffs.push({ x, y, vx: Math.cos(angle) * 60, vy: Math.sin(angle) * 25, radius: 3, ageMs: 0 });
    }
  }

  /** On the edge of the screen where they flew off, pointing back at the stage; with a flash and a strong shake. */
  private knockOut(x: number, y: number, color: number): void {
    const view = this.camera.worldView;
    const toScreen = (wx: number, wy: number) => ({
      x: ((wx - view.x) / view.width) * this.camera.width,
      y: ((wy - view.y) / view.height) * this.camera.height,
    });
    const at = toScreen(x, y);
    const stage = toScreen(GROUND.x + GROUND.width / 2, GROUND.y - 150);
    const cx = Phaser.Math.Clamp(at.x, KO.margin, this.camera.width - KO.margin);
    const cy = Phaser.Math.Clamp(at.y, KO.margin, this.camera.height - KO.margin);
    const length = Math.hypot(at.x - stage.x, at.y - stage.y) || 1;
    this.beams.push({ x: cx, y: cy, dx: (at.x - stage.x) / length, dy: (at.y - stage.y) / length, color, ageMs: 0 });
    this.camera.flash(140, 255, 255, 255, true);
    this.camera.shake(380, 0.02, true);
  }

  private age(frameMs: number): void {
    const dt = frameMs / 1000;
    for (const puff of this.puffs) {
      puff.ageMs += frameMs;
      puff.x += puff.vx * dt;
      puff.y += puff.vy * dt;
      puff.vx *= 0.92;
    }
    for (const beam of this.beams) beam.ageMs += frameMs;
    this.puffs = this.puffs.filter((p) => p.ageMs < DUST.lifeMs);
    this.beams = this.beams.filter((b) => b.ageMs < KO.lifeMs);
  }

  private draw(): void {
    const g = this.graphics.clear();
    for (const puff of this.puffs) {
      const t = puff.ageMs / DUST.lifeMs;
      g.fillStyle(DUST.color, 0.55 * (1 - t)).fillCircle(puff.x, puff.y, puff.radius * (1 + t));
    }
    const s = this.screen.clear();
    for (const beam of this.beams) this.drawBeam(s, beam);
  }

  /** A wedge of colour pointing back at the stage, with a white core, that narrows as it fades. */
  private drawBeam(g: Phaser.GameObjects.Graphics, beam: Beam): void {
    const t = beam.ageMs / KO.lifeMs;
    const fade = 1 - t;
    const width = KO.width * (1 - t * 0.7);
    // Perpendicular to the beam.
    const px = -beam.dy;
    const py = beam.dx;
    const tipX = beam.x - beam.dx * KO.length;
    const tipY = beam.y - beam.dy * KO.length;
    const wedge = (w: number) => [
      { x: beam.x + px * w, y: beam.y + py * w },
      { x: beam.x - px * w, y: beam.y - py * w },
      { x: tipX, y: tipY },
    ];
    g.fillStyle(beam.color, 0.75 * fade).fillPoints(wedge(width), true);
    g.fillStyle(0xffffff, 0.9 * fade).fillPoints(wedge(width * 0.35), true);
    g.fillStyle(0xffffff, fade).fillCircle(beam.x, beam.y, width * 0.6);
  }
}
