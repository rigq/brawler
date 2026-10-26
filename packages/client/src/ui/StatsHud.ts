import Phaser from 'phaser';
import type { World } from '@brawler/shared';

const REFRESH_MS = 250;

/**
 * Top-left overlay with render FPS, measured simulation rate and player 1's
 * physics state. If the loop is right, "sim" stays at ~60 whatever the FPS is.
 */
export class StatsHud {
  private readonly scene: Phaser.Scene;
  private readonly text: Phaser.GameObjects.Text;
  private elapsedMs = 0;
  private ticksAtLastRefresh = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.text = scene.add.text(12, 12, '', { fontFamily: 'monospace', fontSize: '16px', color: '#9fe870' });
  }

  update(frameMs: number, world: World): void {
    this.elapsedMs += frameMs;
    if (this.elapsedMs < REFRESH_MS) return;

    const simHz = ((world.tick - this.ticksAtLastRefresh) * 1000) / this.elapsedMs;
    const fps = this.scene.game.loop.actualFps;
    const lines = [`FPS ${fps.toFixed(0)}`, `sim ${simHz.toFixed(1)} Hz`, `tick ${world.tick}`];

    const p1 = world.players[0];
    if (p1) {
      lines.push(
        `vx ${p1.vx.toFixed(0)}  vy ${p1.vy.toFixed(0)}`,
        `grounded ${p1.grounded}`,
        `air jumps ${p1.airJumpsLeft}${p1.fastFalling ? '  FAST FALL' : ''}`,
        `dodge ${p1.dodgeKind}  cooldown ${p1.dodgeCooldown}  air dodge ${p1.airDodgeAvailable ? 'yes' : 'no'}`,
      );
    }
    this.text.setText(lines);

    this.elapsedMs = 0;
    this.ticksAtLastRefresh = world.tick;
  }
}
