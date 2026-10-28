import Phaser from 'phaser';
import { STOCKS, WORLD_HEIGHT, WORLD_WIDTH, type Player } from '@brawler/shared';
import { toCssColor } from '../render/palette.ts';

const BOTTOM_MARGIN = 84;
const FONT = { fontFamily: 'monospace', fontStyle: 'bold' } as const;
const LABEL_SIZE = '18px';
const PERCENT_SIZE = '40px';
const STOCKS_SIZE = '20px';
const STOCK_FULL = '●';
const STOCK_LOST = '○';
const OUT_COLOR = '#6b7280';
/** Percent colour goes white → yellow → red as damage climbs to this. */
const DANGER_DAMAGE = 150;
const WHITE = new Phaser.Display.Color(255, 255, 255);
const YELLOW = new Phaser.Display.Color(255, 214, 64);
const RED = new Phaser.Display.Color(255, 64, 64);

interface PlayerPanel {
  percent: Phaser.GameObjects.Text;
  stocks: Phaser.GameObjects.Text;
}

/** Each player's damage % and lives, along the bottom of the screen. */
export class DamageHud {
  private readonly panels: PlayerPanel[];
  private readonly objects: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, colors: readonly number[]) {
    this.panels = colors.map((color, i) => {
      const x = (WORLD_WIDTH * (i + 1)) / (colors.length + 1);
      const y = WORLD_HEIGHT - BOTTOM_MARGIN;
      const css = toCssColor(color);
      const label = scene.add.text(x, y, `P${i + 1}`, { ...FONT, fontSize: LABEL_SIZE, color: css }).setOrigin(0.5, 1);
      const percent = scene.add.text(x, y, '0%', { ...FONT, fontSize: PERCENT_SIZE }).setOrigin(0.5, 0);
      const stocks = scene.add
        .text(x, y + percent.height, '', { ...FONT, fontSize: STOCKS_SIZE, color: css })
        .setOrigin(0.5, 0);
      this.objects.push(label, percent, stocks);
      return { percent, stocks };
    });
  }

  get gameObjects(): Phaser.GameObjects.GameObject[] {
    return this.objects;
  }

  update(players: readonly Player[]): void {
    players.forEach((player, i) => {
      const panel = this.panels[i];
      if (!panel) return;
      panel.stocks.setText(STOCK_FULL.repeat(player.stocks) + STOCK_LOST.repeat(STOCKS - player.stocks));
      if (player.stocks === 0) {
        panel.percent.setText('OUT').setColor(OUT_COLOR);
      } else {
        panel.percent.setText(`${Math.floor(player.damage)}%`).setColor(damageColor(player.damage));
      }
    });
  }
}

function damageColor(damage: number): string {
  const t = Math.min(damage / DANGER_DAMAGE, 1);
  const [from, to, local] = t < 0.5 ? [WHITE, YELLOW, t * 2] : [YELLOW, RED, (t - 0.5) * 2];
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 1, local);
  return Phaser.Display.Color.RGBToString(Math.round(c.r), Math.round(c.g), Math.round(c.b));
}
