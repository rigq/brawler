import type Phaser from 'phaser';
import { attackCharge, attackData, attackPhase, counterHolds, rouletteChoice, type Player } from '@brawler/shared';
import { COUNTER_LINES, TAUNT_LINES } from '../ui/quotes.ts';
import { drawAiIcon, type AiIcon } from './aiIcons.ts';
import { SHEETS } from './art.ts';

/** Above the head, in px. */
const ICON_GAP = 18;
/** The icon pops a little each time it changes (ms). */
const POP_MS = 120;
const COUNTER = { color: 0xd97757, radius: 12, pulseMs: 220 } as const;
const CURSOR = { color: 0xffffff, outline: 0x0b1026 } as const;
/** Power stacks (Robert's smoke): puffs going round the head. */
const PUFF = { orbit: 18, turnMs: 1400 } as const;
/** Robert gathers up to 3 stacks. */
const MAX_PUFFS = 3;
/** Each click frame of the cursor lasts this many ticks. */
const CURSOR_CLICK_TICKS = 3;
/** At full charge the flames switch frame this often (ms). */
const FLAME_MS = 90;
const BUBBLE_STYLE = {
  fontFamily: 'system-ui, sans-serif',
  fontSize: '11px',
  fontStyle: 'bold',
  color: '#0b1026',
  backgroundColor: '#f4f1de',
  padding: { x: 6, y: 4 },
  wordWrap: { width: 170 },
  align: 'center',
} as const;
/** Bubbles sit this far above the head (px). */
const BUBBLE_GAP = 26;

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

  private readonly bubble: Phaser.GameObjects.Text;
  /** Pixel-art pieces (art/fx): Claude's hand, the tether cursor, smoke stacks, the charge flames. */
  private readonly hand: Phaser.GameObjects.Sprite;
  private readonly cursor: Phaser.GameObjects.Sprite;
  private readonly puffs: Phaser.GameObjects.Sprite[];
  private readonly flames: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, icons: readonly AiIcon[] = []) {
    this.graphics = scene.add.graphics().setDepth(5);
    this.bubble = scene.add.text(0, 0, '', BUBBLE_STYLE).setOrigin(0.5, 1).setDepth(6).setResolution(2).setVisible(false);
    this.icons = icons;
    const sprite = (key: string, depth: number) => scene.add.sprite(0, 0, key, 0).setDepth(depth).setVisible(false);
    this.hand = sprite(SHEETS.fxCounter.key, 4).setAlpha(0.9).setScale(0.7);
    this.cursor = sprite(SHEETS.fxCursor.key, 6).setOrigin(0, 0).setScale(1.2);
    this.puffs = Array.from({ length: MAX_PUFFS }, () => sprite(SHEETS.fxSmokePuff.key, 4).setFrame(2).setAlpha(0.85).setScale(0.8));
    // Behind the body: the flames rise around the feet.
    this.flames = sprite(SHEETS.fxCharge.key, -1).setOrigin(0.5, 0.92);
  }

  get gameObjects(): Phaser.GameObjects.GameObject[] {
    return [this.graphics, this.bubble, this.hand, this.cursor, ...this.puffs, this.flames];
  }

  hide(): void {
    this.graphics.clear();
    this.bubble.setVisible(false);
    for (const s of [this.hand, this.cursor, ...this.puffs, this.flames]) s.setVisible(false);
  }

  render(player: Player, x: number, y: number, frameMs: number, rival?: Player): void {
    this.clockMs += frameMs;
    const g = this.graphics.clear();
    this.renderRoulette(g, player, x, y, frameMs);
    if (counterHolds(player)) this.renderCounter(g, player, x, y);
    else this.hand.setVisible(false);
    this.renderTether(g, player, x, y);
    this.renderStacks(player, x, y);
    this.renderCharge(player, x, y);
    this.renderBubble(player, x, y, rival);
  }

  /** Charging a heavy (or a chargeable special): a ring of flames at the feet, growing with the charge. */
  private renderCharge(player: Player, x: number, y: number): void {
    const charging = attackPhase(player) === 'charge';
    this.flames.setVisible(charging);
    if (!charging) return;
    const charge = attackCharge(player);
    this.flames
      .setPosition(x + player.width / 2, y + player.height)
      .setScale(((player.width + 24) / SHEETS.fxCharge.frameWidth) * (0.7 + 0.3 * charge))
      .setAlpha(0.45 + 0.55 * charge)
      // Frames 0–1 while it grows; at full charge the two biggest alternate: the flames dance.
      .setFrame(charge >= 1 ? 2 + (Math.floor(this.clockMs / FLAME_MS) % 2) : Math.floor(charge * 2));
  }

  /** Taunting: the character's line. Countering: what Claude says to this rival. */
  private renderBubble(player: Player, x: number, y: number, rival?: Player): void {
    const countering = player.attackId !== 'none' && attackData(player, player.attackId).counter === true;
    const text = player.tauntTicks > 0
      ? TAUNT_LINES[player.characterId]
      : countering
        ? (rival ? COUNTER_LINES[rival.characterId] : undefined) ?? COUNTER_LINES.default
        : '';
    this.bubble.setVisible(text !== '');
    if (!text) return;
    if (this.bubble.text !== text) this.bubble.setText(text);
    this.bubble.setPosition(x + player.width / 2, y - BUBBLE_GAP);
  }

  /** Smoke stacks: puffs of smoke going round the head, one per stack. */
  private renderStacks(player: Player, x: number, y: number): void {
    const cx = x + player.width / 2;
    const cy = y + 6;
    this.puffs.forEach((puff, i) => {
      const on = i < player.powerStacks;
      puff.setVisible(on);
      if (!on) return;
      const angle = (this.clockMs / PUFF.turnMs) * Math.PI * 2 + (i / Math.max(1, player.powerStacks)) * Math.PI * 2;
      // In front of the head on the near half of the circle, behind it on the far half.
      puff.setPosition(cx + Math.cos(angle) * PUFF.orbit, cy + Math.sin(angle) * PUFF.orbit * 0.4).setDepth(Math.sin(angle) > 0 ? 4 : -1);
    });
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

  /** "Lo siento, no puedo ayudarte con eso": a hand of orange light raised in front of him, and a faint ring. */
  private renderCounter(g: Phaser.GameObjects.Graphics, player: Player, x: number, y: number): void {
    const pulse = 0.5 + 0.5 * Math.sin((this.clockMs / COUNTER.pulseMs) * Math.PI * 2);
    const cx = x + player.width / 2;
    const cy = y + player.height / 2;
    const radius = Math.max(player.width, player.height) / 2 + COUNTER.radius;
    g.fillStyle(COUNTER.color, 0.06 + 0.06 * pulse).fillCircle(cx, cy, radius);
    g.lineStyle(2, COUNTER.color, 0.35 + 0.3 * pulse).strokeCircle(cx, cy, radius);
    const started = player.attackTick - attackData(player, player.attackId === 'none' ? 'jab1' : player.attackId).startup;
    this.hand
      .setVisible(true)
      .setPosition(cx + player.facing * (player.width / 2 + 10), cy - 6)
      .setFlipX(player.facing === -1)
      .setFrame(started < 3 ? 0 : 1 + (Math.floor(this.clockMs / COUNTER.pulseMs) % 2));
  }

  /** While typing the prompt the cursor blinks on the hooked ledge; when it pulls, it clicks and a line joins them. */
  private renderTether(g: Phaser.GameObjects.Graphics, player: Player, x: number, y: number): void {
    const data = player.attackId === 'none' ? undefined : attackData(player, player.attackId);
    const phase = attackPhase(player);
    const showing = player.tetherSide !== 0 && data?.tether !== undefined && (phase === 'startup' || phase === 'active');
    this.cursor.setVisible(showing);
    if (!showing || !data) return;
    const hand = { x: x + player.width / 2, y: y + 6 };
    if (phase === 'active') {
      g.lineStyle(4, CURSOR.outline, 0.9).lineBetween(hand.x, hand.y, player.tetherX, player.tetherY);
      g.lineStyle(2, CURSOR.color, 1).lineBetween(hand.x, hand.y, player.tetherX, player.tetherY);
    }
    // Frames: 0 the pointer, 1–4 the click growing and fading.
    const pulling = player.attackTick - data.startup;
    const frame = phase === 'active' ? Math.min(4, 1 + Math.floor(pulling / CURSOR_CLICK_TICKS)) : 0;
    const blinkOff = phase === 'startup' && Math.floor(this.clockMs / 90) % 2 === 1;
    this.cursor.setPosition(player.tetherX, player.tetherY).setFrame(frame).setAlpha(blinkOff ? 0.35 : 1);
  }
}
