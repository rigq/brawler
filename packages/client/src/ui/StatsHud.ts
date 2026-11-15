import Phaser from 'phaser';

const REFRESH_MS = 250;

/** Top-left FPS counter, small and quiet. */
export class StatsHud {
  private readonly scene: Phaser.Scene;
  private readonly text: Phaser.GameObjects.Text;
  private elapsedMs = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.text = scene.add.text(12, 10, '', { fontFamily: 'monospace', fontSize: '14px', color: '#9aa5c4' }).setAlpha(0.7);
  }

  get gameObject(): Phaser.GameObjects.GameObject {
    return this.text;
  }

  update(frameMs: number): void {
    this.elapsedMs += frameMs;
    if (this.elapsedMs < REFRESH_MS) return;
    this.text.setText(`FPS ${this.scene.game.loop.actualFps.toFixed(0)}`);
    this.elapsedMs = 0;
  }
}
