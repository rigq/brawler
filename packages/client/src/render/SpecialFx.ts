import type Phaser from 'phaser';
import { attackData, attackPhase, counterHolds, rouletteChoice, type Player } from '@brawler/shared';
import { drawAiIcon, type AiIcon } from './aiIcons.ts';

/** Above the head, in px. */
const ICON_GAP = 18;
/** The icon pops a little each time it changes (ms). */
const POP_MS = 120;
const COUNTER = { color: 0xd97757, radius: 12, pulseMs: 220 } as const;
const CURSOR = { color: 0xffffff, outline: 0x0b1026 } as const;

/**
 * What special powers draw around a fighter, from the attack data alone:
 * the roulette icon over the head while charging, the counter's glow, and the
 * tether's line and cursor. Render only.
 */
export class SpecialFx {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly icons: readonly AiIcon[];
  private lastPick = '';
  private sincePickMs = POP_MS;
  private clockMs = 0;

  constructor(scene: Phaser.Scene, icons: readonly AiIcon[] = []) {
    this.graphics = scene.add.graphics().setDepth(5);
    this.icons = icons;
  }

  get gameObject(): Phaser.GameObjects.GameObject {
    return this.graphics;
  }

  hide(): void {
    this.graphics.clear();
  }

  render(player: Player, x: number, y: number, frameMs: number): void {
    this.clockMs += frameMs;
    const g = this.graphics.clear();
    this.renderRoulette(g, player, x, y, frameMs);
    if (counterHolds(player)) this.renderCounter(g, player, x, y);
    this.renderTether(g, player, x, y);
  }

  private renderRoulette(g: Phaser.GameObjects.Graphics, player: Player, x: number, y: number, frameMs: number): void {
    const pick = rouletteChoice(player);
    if (!pick || player.attackId === 'none') {
      this.lastPick = '';
      return;
    }
    const options = attackData(player, player.attackId).roulette?.options ?? [];
    const icon = this.icons[options.indexOf(pick)];
    if (!icon) return;
    this.sincePickMs = pick === this.lastPick ? this.sincePickMs + frameMs : 0;
    this.lastPick = pick;
    const pop = 1 + 0.35 * Math.max(0, 1 - this.sincePickMs / POP_MS);
    drawAiIcon(g, icon, x + player.width / 2, y - ICON_GAP, pop);
  }

  /** "Lo siento, no puedo ayudarte con eso": a pulsing orange ring, a hand up. */
  private renderCounter(g: Phaser.GameObjects.Graphics, player: Player, x: number, y: number): void {
    const pulse = 0.5 + 0.5 * Math.sin((this.clockMs / COUNTER.pulseMs) * Math.PI * 2);
    const cx = x + player.width / 2;
    const cy = y + player.height / 2;
    const radius = Math.max(player.width, player.height) / 2 + COUNTER.radius;
    g.fillStyle(COUNTER.color, 0.12 + 0.1 * pulse).fillCircle(cx, cy, radius);
    g.lineStyle(3, COUNTER.color, 0.6 + 0.4 * pulse).strokeCircle(cx, cy, radius);
  }

  /** While typing the prompt the cursor blinks on the hooked ledge; while pulling, a line joins them. */
  private renderTether(g: Phaser.GameObjects.Graphics, player: Player, x: number, y: number): void {
    if (player.attackId === 'none' || player.tetherSide === 0 || !attackData(player, player.attackId).tether) return;
    const phase = attackPhase(player);
    if (phase !== 'startup' && phase !== 'active') return;
    const hand = { x: x + player.width / 2, y: y + 6 };
    if (phase === 'active') {
      g.lineStyle(4, CURSOR.outline, 0.9).lineBetween(hand.x, hand.y, player.tetherX, player.tetherY);
      g.lineStyle(2, CURSOR.color, 1).lineBetween(hand.x, hand.y, player.tetherX, player.tetherY);
    }
    if (phase === 'active' || Math.floor(this.clockMs / 90) % 2 === 0) drawCursor(g, player.tetherX, player.tetherY);
  }
}

/** A big mouse pointer with its tip at (x, y). */
function drawCursor(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  const s = 2;
  const arrow = [
    { x, y }, { x, y: y + 14 * s }, { x: x + 4 * s, y: y + 10 * s }, { x: x + 7 * s, y: y + 16 * s },
    { x: x + 9 * s, y: y + 15 * s }, { x: x + 6 * s, y: y + 9 * s }, { x: x + 11 * s, y: y + 9 * s },
  ];
  g.fillStyle(CURSOR.color, 1).fillPoints(arrow, true);
  g.lineStyle(2, CURSOR.outline, 1).strokePoints(arrow, true);
}
