import Phaser from 'phaser';
import { HITSTOP_JITTER_PX, SHIELD_MAX, attackBoxAt, attackData, attackCharge, attackPhase, isActive, isInvulnerable, type Player, type Rect } from '@brawler/shared';
import { CHARACTER_ART } from './art.ts';
import { CharacterSprite } from './CharacterSprite.ts';
import { SwingArc } from './SwingArc.ts';

const DODGE_ALPHA = 0.4;
/** After respawning the player blinks: this many ticks on, this many off. */
const RESPAWN_BLINK_TICKS = 6;
const RESPAWN_BLINK_ALPHA = { on: 0.9, off: 0.25 } as const;
const DASH_COLOR = 0xffe0a8;
const HIT_FLASH_COLOR = 0xffffff;
const EYE_COLOR = 0x1d2330;
const EYE_SIZE = 8;
const EYE_INSET_X = 6;
const EYE_Y = 12;
const SWING_ALPHA = { light: 0.55, heavy: 0.85 } as const;
/** During startup only the outline of where the hit will land is shown, as a warning. */
const SWING_WARNING_ALPHA = 0.45;
const SWING_OUTLINE_WIDTH = 2;
/**
 * A hit is shown for at least this long, even when it is active for only
 * 2 ticks: otherwise a dropped frame could hide it and the hit would seem to come from nowhere.
 */
const SWING_MIN_SHOW_MS = 80;
/** Characters with pixel art: the swing's fill is fainter so it does not cover the sprites. */
const SWING_ART_FILL_MULT = 0.4;
const CHARGE_BAR_COLOR = 0xffffff;
const CHARGE_BAR_HEIGHT = 5;
const CHARGE_BAR_GAP = 8;
/** The shield bubble shrinks from max to min radius as it wears out. */
const SHIELD_RADIUS = { min: 22, max: 56 } as const;
const SHIELD_ALPHA = 0.35;
const SHIELD_OUTLINE_WIDTH = 2;

/** Extra visual shift (px), e.g. to smooth out an online correction. Never affects gameplay. */
export interface VisualOffset {
  x: number;
  y: number;
}
const NO_OFFSET: VisualOffset = { x: 0, y: 0 };

/**
 * Draws one player: pixel art if its character has some (CharacterSprite),
 * otherwise a coloured rectangle with an "eye" on the side it faces. Plus the
 * attack swing, charge bar and shield, the same for everyone.
 */
export class PlayerView {
  private readonly body: Phaser.GameObjects.Rectangle;
  private readonly eye: Phaser.GameObjects.Rectangle;
  private readonly swing: Phaser.GameObjects.Rectangle;
  private readonly chargeBar: Phaser.GameObjects.Rectangle;
  private readonly swingArc: SwingArc;
  private readonly shield: Phaser.GameObjects.Arc;
  private readonly color: number;
  /** Null: no art for this character, the rectangle is the body. */
  private readonly sprite: CharacterSprite | null;
  private visible = true;
  /** Time the last active hitbox stays on screen after its active phase ended. */
  private swingLeftMs = 0;

  /** `tint`: multiplies the character's art (null: drawn as is). */
  constructor(scene: Phaser.Scene, player: Player, color: number, tint: number | null = null) {
    this.color = color;
    const art = CHARACTER_ART[player.characterId];
    this.sprite = art ? new CharacterSprite(scene, art, tint) : null;
    // With art the rectangle stays as an invisible box: the camera frames it.
    this.body = scene.add.rectangle(player.x, player.y, player.width, player.height, color).setOrigin(0, 0);
    this.eye = scene.add.rectangle(0, 0, EYE_SIZE, EYE_SIZE, EYE_COLOR).setOrigin(0, 0);
    if (this.sprite) {
      this.body.setFillStyle(color, 0);
      this.eye.setVisible(false);
    }
    this.swing = scene.add.rectangle(0, 0, 1, 1, color).setOrigin(0, 0).setVisible(false);
    this.chargeBar = scene.add.rectangle(0, 0, 1, CHARGE_BAR_HEIGHT, CHARGE_BAR_COLOR).setOrigin(0, 0);
    this.swingArc = new SwingArc(scene);
    this.shield = scene.add
      .circle(0, 0, SHIELD_RADIUS.max, color, SHIELD_ALPHA)
      .setStrokeStyle(SHIELD_OUTLINE_WIDTH, color)
      .setVisible(false);
  }

  /**
   * `alpha` (0–1) is how far we are between the last simulation step and the next.
   * Drawing in between keeps motion smooth on screens faster than 60 Hz.
   */
  render(player: Player, alpha: number, frameMs: number, offset: VisualOffset = NO_OFFSET): void {
    // Knocked out (waiting to respawn) or out of the match: draw nothing.
    this.visible = isActive(player);
    this.body.setVisible(this.visible);
    this.eye.setVisible(this.visible && !this.sprite);
    if (!this.visible) {
      this.sprite?.hide();
      this.swing.setVisible(false);
      this.chargeBar.setVisible(false);
      this.swingArc.hide();
      this.shield.setVisible(false);
      return;
    }

    const x = lerp(player.prevX, player.x, alpha) + offset.x + hitstopJitter(player);
    const y = lerp(player.prevY, player.y, alpha) + offset.y;
    const opacity = this.opacity(player);

    if (this.sprite) {
      this.body.setPosition(x, y);
      this.sprite.render(player, x, y, opacity, frameMs);
    } else {
      this.body.setPosition(x, y).setFillStyle(this.bodyColor(player), opacity);
      const eyeX = player.facing === 1 ? player.width - EYE_INSET_X - EYE_SIZE : EYE_INSET_X;
      this.eye.setPosition(x + eyeX, y + EYE_Y).setAlpha(opacity);
    }
    if (this.sprite) {
      // Drawn characters: a slash arc for hits, and the charge shows as a glow on the body (CharacterSprite).
      this.swingArc.render(player, x, y, frameMs);
    } else {
      this.renderSwing(player, x, y, frameMs);
      this.renderChargeBar(player, x, y);
    }
    this.renderShield(player, x, y);
  }

  /** False while the player is knocked out or out of the match; the camera skips it. */
  get isVisible(): boolean {
    return this.visible;
  }

  /** Where the player's body was drawn this frame (interpolated), for the camera. */
  get drawnBounds(): Rect {
    return { x: this.body.x, y: this.body.y, width: this.body.width, height: this.body.height };
  }

  get gameObjects(): Phaser.GameObjects.GameObject[] {
    return [this.swing, this.body, this.eye, ...(this.sprite?.gameObjects ?? []), this.swingArc.gameObject, this.chargeBar, this.shield];
  }

  /** Blinking right after respawning, see-through while dodging, solid otherwise. */
  private opacity(player: Player): number {
    if (player.invulnTicks > 0) {
      const blinkOn = player.invulnTicks % (RESPAWN_BLINK_TICKS * 2) < RESPAWN_BLINK_TICKS;
      return blinkOn ? RESPAWN_BLINK_ALPHA.on : RESPAWN_BLINK_ALPHA.off;
    }
    return isInvulnerable(player) ? DODGE_ALPHA : 1;
  }

  private bodyColor(player: Player): number {
    if (player.hitFlashTicks > 0) return HIT_FLASH_COLOR;
    if (player.dodgeKind === 'dash') return DASH_COLOR;
    return this.color;
  }

  /** Startup: outline (warning). Active: filled, and kept for SWING_MIN_SHOW_MS. Recovery: hidden. */
  private renderSwing(player: Player, x: number, y: number, frameMs: number): void {
    const phase = attackPhase(player);
    const box = attackBoxAt(player, x, y);
    if (phase === 'active') this.swingLeftMs = SWING_MIN_SHOW_MS;
    else this.swingLeftMs = Math.max(this.swingLeftMs - frameMs, 0);

    const filled = phase === 'active' || this.swingLeftMs > 0;
    const warning = phase === 'startup' || phase === 'charge';
    this.swing.setVisible(box !== null && (filled || warning));
    if (!box || !(filled || warning)) return;
    this.swing.setPosition(box.x, box.y).setSize(box.width, box.height);
    const heavy = player.attackId !== 'none' && attackData(player, player.attackId).heavy;
    const artMult = this.sprite ? SWING_ART_FILL_MULT : 1;
    const fill = filled ? (heavy ? SWING_ALPHA.heavy : SWING_ALPHA.light) * artMult : 0;
    this.swing.setFillStyle(this.color, fill).setStrokeStyle(SWING_OUTLINE_WIDTH, this.color, SWING_WARNING_ALPHA);
  }

  /** Bubble around the body: its size is how much shield is left. */
  private renderShield(player: Player, x: number, y: number): void {
    this.shield.setVisible(player.shielding);
    if (!player.shielding) return;
    const left = player.shieldHealth / SHIELD_MAX;
    const radius = SHIELD_RADIUS.min + (SHIELD_RADIUS.max - SHIELD_RADIUS.min) * left;
    this.shield.setPosition(x + player.width / 2, y + player.height / 2).setRadius(radius);
  }

  /** Bar above the head that fills while a heavy attack charges. */
  private renderChargeBar(player: Player, x: number, y: number): void {
    const charging = attackPhase(player) === 'charge';
    this.chargeBar.setVisible(charging);
    if (charging) {
      const width = Math.max(1, player.width * attackCharge(player));
      this.chargeBar.setPosition(x, y - CHARGE_BAR_GAP - CHARGE_BAR_HEIGHT).setSize(width, CHARGE_BAR_HEIGHT);
    }
  }
}

/** The player who got hit trembles while frozen; the attacker stays still. */
function hitstopJitter(player: Player): number {
  if (player.hitstopTicks === 0 || player.hitFlashTicks === 0) return 0;
  return player.hitstopTicks % 2 === 0 ? HITSTOP_JITTER_PX : -HITSTOP_JITTER_PX;
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}
