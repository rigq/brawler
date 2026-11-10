import Phaser from 'phaser';
import { attackData, type Player } from '@brawler/shared';
import type { CharacterArt } from './art.ts';

/** The neutral-special prop (Donate's tank) overlaps the body's front edge by this much, where the shell comes out. */
const PROP_FRONT_OVERHANG = 20;
/** Its "after the shot" frame starts this many ticks after firing. */
const PROP_FIRE_TICKS = 6;
const PROP_FADE_IN_TICKS = 6;
/** The parachute canopy floats this far above the head; cords join it to the shoulders. */
const CANOPY_GAP = 30;
const CORD_COLOR = 0x3b4a2c;
const PARACHUTE_FRAME_MS = 300;
const DASH_TINT = 0xffe0a8;
const FLASH_TINT = 0xffffff;

/**
 * A character drawn with pixel art instead of a rectangle: the body sprite on
 * the collision box (feet on its bottom), plus the props of its specials.
 * The art faces right; facing left mirrors it.
 */
export class CharacterSprite {
  private readonly body: Phaser.GameObjects.Sprite;
  private readonly prop: Phaser.GameObjects.Sprite | null;
  private readonly canopy: Phaser.GameObjects.Sprite | null;
  private readonly cords: Phaser.GameObjects.Graphics;
  private parachuteMs = 0;

  constructor(scene: Phaser.Scene, art: CharacterArt) {
    this.prop = art.neutralSpecial ? scene.add.sprite(0, 0, art.neutralSpecial.key, 0).setOrigin(0, 1).setDepth(-1) : null;
    this.cords = scene.add.graphics();
    this.canopy = art.parachute ? scene.add.sprite(0, 0, art.parachute.key, 0).setOrigin(0.5, 1) : null;
    this.body = scene.add.sprite(0, 0, art.body.key, 0).setOrigin(0.5, 1);
  }

  get gameObjects(): Phaser.GameObjects.GameObject[] {
    return [this.prop, this.cords, this.canopy, this.body].filter((o): o is NonNullable<typeof o> => o !== null);
  }

  /** (x, y): the collision box's top-left corner as drawn this frame (interpolated). */
  render(player: Player, x: number, y: number, opacity: number, frameMs: number): void {
    const feetX = x + player.width / 2;
    const feetY = y + player.height;
    this.body.setVisible(true).setPosition(feetX, feetY).setFlipX(player.facing === -1).setAlpha(opacity);
    if (player.hitFlashTicks > 0) this.body.setTintFill(FLASH_TINT);
    else if (player.dodgeKind === 'dash') this.body.setTint(DASH_TINT);
    else this.body.clearTint();
    this.renderProp(player, x, feetY);
    this.renderParachute(player, feetX, y, frameMs);
  }

  hide(): void {
    for (const object of [this.body, this.prop, this.canopy]) object?.setVisible(false);
    this.cords.clear();
  }

  /** Behind the character, its front edge just past the body's: the shell leaves from its muzzle. */
  private renderProp(player: Player, x: number, feetY: number): void {
    if (!this.prop) return;
    const showing = player.attackId === 'specialNeutral';
    this.prop.setVisible(showing);
    if (!showing) return;
    const { startup } = attackData(player, 'specialNeutral');
    const t = player.attackTick;
    this.prop.setFrame(t < startup ? 0 : t < startup + PROP_FIRE_TICKS ? 1 : 2);
    this.prop.setAlpha(player.attackCharging ? 1 : Math.min(1, (t + 1) / PROP_FADE_IN_TICKS));
    const width = this.prop.width;
    const left = player.facing === 1 ? x + player.width + PROP_FRONT_OVERHANG - width : x - PROP_FRONT_OVERHANG;
    this.prop.setPosition(left, feetY).setFlipX(player.facing === -1);
  }

  private renderParachute(player: Player, centerX: number, top: number, frameMs: number): void {
    this.cords.clear();
    if (!this.canopy) return;
    this.canopy.setVisible(player.parachuting);
    if (!player.parachuting) {
      this.parachuteMs = 0;
      return;
    }
    this.parachuteMs += frameMs;
    const canopyBottom = top - CANOPY_GAP;
    this.canopy.setPosition(centerX, canopyBottom).setFrame(Math.floor(this.parachuteMs / PARACHUTE_FRAME_MS) % 2);
    // Cords from the canopy's rim to the shoulders.
    const half = this.canopy.width / 2 - 4;
    const shoulderY = top + 14;
    this.cords.lineStyle(1, CORD_COLOR, 1);
    for (const [fromX, toX] of [[-half, -6], [-half / 3, -3], [half / 3, 3], [half, 6]] as const) {
      this.cords.lineBetween(centerX + fromX, canopyBottom - 2, centerX + toX, shoulderY);
    }
  }
}
