import Phaser from 'phaser';
import { isInvulnerable, type Player } from '@brawler/shared';

const DODGE_ALPHA = 0.4;
const DASH_COLOR = 0xffe0a8;

/** Draws one player as a placeholder rectangle. */
export class PlayerView {
  private readonly rect: Phaser.GameObjects.Rectangle;
  private readonly color: number;

  constructor(scene: Phaser.Scene, player: Player, color: number) {
    this.color = color;
    this.rect = scene.add.rectangle(player.x, player.y, player.width, player.height, color).setOrigin(0, 0);
  }

  /**
   * `alpha` (0–1) is how far we are between the last simulation step and the next.
   * Drawing in between keeps motion smooth on screens faster than 60 Hz.
   */
  render(player: Player, alpha: number): void {
    this.rect.setPosition(lerp(player.prevX, player.x, alpha), lerp(player.prevY, player.y, alpha));
    // Placeholder feedback: see-through while dodging, lighter while dashing.
    this.rect.setFillStyle(player.dodgeKind === 'dash' ? DASH_COLOR : this.color, isInvulnerable(player) ? DODGE_ALPHA : 1);
  }
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}
