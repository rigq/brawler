import Phaser from 'phaser';
import { attackBoxAt, attackCharge, attackData, attackPhase, type AttackId, type Player } from '@brawler/shared';

/** Attacks that get a swing arc: punches, kicks and heavies (not grabs, throws or specials, which have their own art). */
const ARC_ATTACKS = new Set<AttackId>([
  'jab1', 'jab2', 'jab3', 'dash', 'lightSide', 'lightUp', 'lightDown',
  'airNeutral', 'airForward', 'airBack', 'airUp', 'airDown',
  'heavySide', 'heavyUp', 'heavyDown',
]);
/** How long an arc stays, fading (ms). */
const ARC_MS = 160;
/** Angle the arc covers (radians): heavies swing wider. */
const SWEEP = { light: 1.2, heavy: 1.5 } as const;
/** Line widths of the outer (white) and inner (coloured) stroke, light and heavy. */
const WIDTH = { light: 4, heavy: 6 } as const;
/** The arc passes through the middle of the hitbox, but never further than this from the shoulders (px). */
const RADIUS = { min: 22, max: 56 } as const;
const OUTER_COLOR = 0xffffff;
const LIGHT_COLOR = 0xbfe3ff;
/** Heavies glow warmer the more they were charged. */
const HEAVY_COLOR = { uncharged: 0xffd27a, full: 0xff8a3d } as const;
/** Centre of the swing, as a share of the body height from the top (about the shoulders). */
const PIVOT_Y = 0.4;

interface Arc {
  /** Relative to the body's top-left, so the arc moves with the attacker. */
  dx: number;
  dy: number;
  radius: number;
  start: number;
  end: number;
  width: number;
  color: number;
  leftMs: number;
}

/**
 * A curved slash where each punch or kick lands, instead of a box: it starts at
 * the shoulders, points at the hitbox and sweeps the way the character faces,
 * then fades. Only drawing; hits are still decided by the hitbox.
 */
export class SwingArc {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private arc: Arc | null = null;
  private lastActive = '';

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(1);
  }

  get gameObject(): Phaser.GameObjects.GameObject {
    return this.graphics;
  }

  render(player: Player, x: number, y: number, frameMs: number): void {
    this.startIfNew(player, x, y);
    this.graphics.clear();
    if (!this.arc) return;
    this.arc.leftMs -= frameMs;
    if (this.arc.leftMs <= 0) {
      this.arc = null;
      return;
    }
    this.draw(this.arc, x, y);
  }

  hide(): void {
    this.graphics.clear();
    this.arc = null;
  }

  /** A new arc the first frame an attack is active (a jab chain restarts it for each hit). */
  private startIfNew(player: Player, x: number, y: number): void {
    const id = player.attackId;
    const active = id !== 'none' && ARC_ATTACKS.has(id) && attackPhase(player) === 'active';
    // A new arc when an attack becomes active (each hit of a jab chain is a new attack id).
    const isNew = active && this.lastActive !== id;
    this.lastActive = active ? id : '';
    if (!isNew) return;
    const box = attackBoxAt(player, x, y);
    if (!box) return;
    const heavy = attackData(player, id).heavy;
    const cx = x + player.width / 2;
    const cy = y + player.height * PIVOT_Y;
    const bx = box.x + box.width / 2;
    const by = box.y + box.height / 2;
    const angle = Math.atan2(by - cy, bx - cx);
    const reach = Math.min(Math.max(Math.hypot(bx - cx, by - cy), RADIUS.min), RADIUS.max);
    const sweep = heavy ? SWEEP.heavy : SWEEP.light;
    // Facing right the slash goes downwards-forward (clockwise); facing left, the mirror.
    const half = (sweep / 2) * player.facing;
    this.arc = {
      dx: cx - x,
      dy: cy - y,
      radius: reach,
      start: angle - half,
      end: angle + half,
      width: heavy ? WIDTH.heavy : WIDTH.light,
      color: heavy ? mixColor(HEAVY_COLOR.uncharged, HEAVY_COLOR.full, attackCharge(player)) : LIGHT_COLOR,
      leftMs: ARC_MS,
    };
  }

  private draw(arc: Arc, x: number, y: number): void {
    const t = arc.leftMs / ARC_MS;
    const cx = x + arc.dx;
    const cy = y + arc.dy;
    // Grows a little as it fades: reads as a swing, not a static shape.
    const radius = arc.radius * (1 + (1 - t) * 0.12);
    const anticlockwise = arc.end < arc.start;
    const stroke = (width: number, color: number, alpha: number, r: number) => {
      this.graphics.lineStyle(width, color, alpha);
      this.graphics.beginPath();
      this.graphics.arc(cx, cy, r, arc.start, arc.end, anticlockwise);
      this.graphics.strokePath();
    };
    stroke(arc.width * 1.6, arc.color, 0.35 * t, radius);
    stroke(arc.width, OUTER_COLOR, 0.9 * t, radius);
    stroke(arc.width * 0.45, arc.color, t, radius - arc.width * 0.6);
  }
}

function mixColor(from: number, to: number, t: number): number {
  const a = Phaser.Display.Color.IntegerToColor(from);
  const b = Phaser.Display.Color.IntegerToColor(to);
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, 1, Math.min(Math.max(t, 0), 1));
  return Phaser.Display.Color.GetColor(Math.round(c.r), Math.round(c.g), Math.round(c.b));
}
