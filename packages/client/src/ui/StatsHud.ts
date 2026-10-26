import Phaser from 'phaser';

const REFRESH_MS = 500;

/**
 * Top-left overlay with render FPS and measured simulation rate.
 * If the loop is right, "sim" stays at ~60 whatever the FPS is.
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

  update(frameMs: number, currentTick: number): void {
    this.elapsedMs += frameMs;
    if (this.elapsedMs < REFRESH_MS) return;

    const simHz = ((currentTick - this.ticksAtLastRefresh) * 1000) / this.elapsedMs;
    const fps = this.scene.game.loop.actualFps;
    this.text.setText(`FPS ${fps.toFixed(0)}\nsim ${simHz.toFixed(1)} Hz\ntick ${currentTick}`);

    this.elapsedMs = 0;
    this.ticksAtLastRefresh = currentTick;
  }
}
