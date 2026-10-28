import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH, type MatchResult } from '@brawler/shared';

/** Wait after the final KO before covering the screen, so players see it happen. */
const SHOW_DELAY_MS = 900;
const DIM_COLOR = 0x0b0e14;
const DIM_ALPHA = 0.72;
const TITLE_STYLE = { fontFamily: 'monospace', fontStyle: 'bold', fontSize: '72px' } as const;
const HINT_STYLE = { fontFamily: 'monospace', fontSize: '22px', color: '#c9d1e0' } as const;
const DRAW_COLOR = '#ffffff';
const TITLE_Y = WORLD_HEIGHT / 2 - 30;
const HINT_GAP = 70;

/** End-of-match screen: who won (or draw) and how to start a rematch. */
export class ResultOverlay {
  private readonly dim: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly playerColors: readonly number[];
  private msSinceOver = 0;

  constructor(scene: Phaser.Scene, playerColors: readonly number[]) {
    this.playerColors = playerColors;
    this.dim = scene.add.rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, DIM_COLOR, DIM_ALPHA).setOrigin(0, 0);
    this.title = scene.add.text(WORLD_WIDTH / 2, TITLE_Y, '', TITLE_STYLE).setOrigin(0.5);
    this.hint = scene.add
      .text(WORLD_WIDTH / 2, TITLE_Y + HINT_GAP, 'Revancha: Enter, R o Start', HINT_STYLE)
      .setOrigin(0.5);
    this.hide();
  }

  get gameObjects(): Phaser.GameObjects.GameObject[] {
    return [this.dim, this.title, this.hint];
  }

  /** True once the result is on screen (rematch is only accepted then). */
  get isShown(): boolean {
    return this.dim.visible;
  }

  update(result: MatchResult, frameMs: number): void {
    if (!result.over) {
      this.msSinceOver = 0;
      this.hide();
      return;
    }
    this.msSinceOver += frameMs;
    if (this.msSinceOver < SHOW_DELAY_MS || this.isShown) return;

    const { text, color } = this.describe(result.winner);
    this.title.setText(text).setColor(color);
    for (const object of [this.dim, this.title, this.hint]) object.setVisible(true);
  }

  hide(): void {
    for (const object of [this.dim, this.title, this.hint]) object.setVisible(false);
  }

  private describe(winner: number | null): { text: string; color: string } {
    if (winner === null) return { text: 'EMPATE', color: DRAW_COLOR };
    const color = this.playerColors[winner] ?? 0xffffff;
    return { text: `GANA P${winner + 1}`, color: `#${color.toString(16).padStart(6, '0')}` };
  }
}
