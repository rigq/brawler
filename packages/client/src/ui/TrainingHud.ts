import Phaser from 'phaser';
import { WORLD_WIDTH } from '@brawler/shared';
import type { ComboStats } from '../training/ComboTracker.ts';

const MARGIN = 16;
/** Dark outline so the text stays readable over the moon and the sky. */
const FONT = { fontFamily: 'monospace', fontStyle: 'bold', stroke: '#0b1026', strokeThickness: 4 } as const;
const TITLE_COLOR = '#ffd166';
const LIVE_COLOR = '#ffffff';
/** The last combo stays on screen, dimmed, once the target escapes. */
const ENDED_ALPHA = 0.45;
const HELP_COLOR = '#c9d1e0';
const HELP_TEXT = 'R reiniciar   9 / 0  −/+ 10 % al muñeco';

/** Training mode panel, top-right: current combo, best combo and the keys. */
export class TrainingHud {
  private readonly combo: Phaser.GameObjects.Text;
  private readonly best: Phaser.GameObjects.Text;
  private readonly objects: Phaser.GameObjects.GameObject[];

  constructor(scene: Phaser.Scene) {
    const x = WORLD_WIDTH - MARGIN;
    const title = scene.add
      .text(x, MARGIN, 'ENTRENAMIENTO', { ...FONT, fontSize: '20px', color: TITLE_COLOR })
      .setOrigin(1, 0);
    this.combo = scene.add.text(x, MARGIN + 30, '', { ...FONT, fontSize: '34px', color: LIVE_COLOR }).setOrigin(1, 0);
    this.best = scene.add.text(x, MARGIN + 74, '', { ...FONT, fontSize: '16px', color: HELP_COLOR }).setOrigin(1, 0);
    const help = scene.add.text(x, MARGIN + 98, HELP_TEXT, { ...FONT, fontSize: '14px', color: HELP_COLOR }).setOrigin(1, 0);
    this.objects = [title, this.combo, this.best, help];
  }

  get gameObjects(): Phaser.GameObjects.GameObject[] {
    return this.objects;
  }

  update(current: ComboStats, best: ComboStats, live: boolean): void {
    this.combo.setText(current.hits > 0 ? describe(current) : '—').setAlpha(live ? 1 : ENDED_ALPHA);
    this.best.setText(best.hits > 0 ? `Mejor: ${describe(best)}` : '');
  }
}

function describe(combo: ComboStats): string {
  const hits = combo.hits === 1 ? '1 golpe' : `${combo.hits} golpes`;
  return `${hits} · ${Math.round(combo.damage)} %`;
}
