import Phaser from 'phaser';
import { attackBoxAt, attackPhase, hurtbox, isActive, type Player, type Rect } from '@brawler/shared';

const HURTBOX_COLOR = 0x4cff7a;
const HITBOX_COLOR = 0xff3b3b;
/** Startup/recovery: where the hitbox will be / was, drawn faint. */
const INACTIVE_ALPHA = 0.35;
const LINE_WIDTH = 2;

/**
 * F1 toggles outlines of every hurtbox (green) and hitbox (red), from the
 * simulation's own boxes. They are drawn at the same in-between position as the
 * bodies, so they never drift apart from what you see (at most 1 tick behind the check).
 */
export class DebugOverlay {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private enabled = false;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(1000);
    // Phaser captures F1 so the browser does not open its help page.
    scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F1).on('down', () => {
      this.enabled = !this.enabled;
      this.graphics.clear();
    });
  }

  get gameObject(): Phaser.GameObjects.GameObject {
    return this.graphics;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  render(players: readonly Player[], alpha: number): void {
    if (!this.enabled) return;
    this.graphics.clear();
    for (const player of players) {
      if (!isActive(player)) continue;
      const x = player.prevX + (player.x - player.prevX) * alpha;
      const y = player.prevY + (player.y - player.prevY) * alpha;
      this.outline({ ...hurtbox(player), x, y }, HURTBOX_COLOR, 1);
      const box = attackBoxAt(player, x, y);
      if (box) this.outline(box, HITBOX_COLOR, attackPhase(player) === 'active' ? 1 : INACTIVE_ALPHA);
    }
  }

  private outline(rect: Rect, color: number, alpha: number): void {
    this.graphics.lineStyle(LINE_WIDTH, color, alpha).strokeRect(rect.x, rect.y, rect.width, rect.height);
  }
}
