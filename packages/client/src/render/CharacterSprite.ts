import Phaser from 'phaser';
import { attackData, attackPhase, type Player } from '@brawler/shared';
import { SHEETS, type CharacterArt } from './art.ts';
import { animFor, frameFor, resolveAnim, type AnimName } from './bodyAnimation.ts';

/** The neutral-special prop (Donate's tank) overlaps the body's front edge by this much, where the shell comes out. */
const PROP_FRONT_OVERHANG = 20;
/** Its "after the shot" frame starts this many ticks after firing. */
const PROP_FIRE_TICKS = 6;
const PROP_FADE_IN_TICKS = 6;
/** The parachute canopy floats this far above the head; cords join it to the shoulders. */
const CANOPY_GAP = 30;
const CORD_COLOR = 0x3b4a2c;
const PARACHUTE_FRAME_MS = 300;
/** The up-special helper (Robert's rapper): crouched for this many ticks, then throwing until this tick, then cheering. */
const HELPER_CROUCH_TICKS = 3;
const HELPER_THROW_TICKS = 12;
/** The neutral aura (Chachin's scream) stays this many ticks into the recovery, on its fading frame. */
const AURA_LINGER_TICKS = 8;
/** The up blast (Chachin's rocket) changes frame at these ticks. */
const BLAST_FRAME_TICKS = [4, 10] as const;
/** Teleport: sparks on arrival last this many ticks. */
const TELEPORT_ARRIVAL_TICKS = 8;
/** Flag: plants (first frames) over this long, then waves. */
const FLAG_PLANT_MS = 250;
const FLAG_WAVE_FRAME_MS = 140;
/** Stars over the head of a player stunned this long while barely moving (a scream, not a launch). */
const DIZZY_MIN_STUN_TICKS = 18;
const DIZZY_MAX_SPEED = 300;
const DIZZY_FRAME_MS = 110;
const DIZZY_GAP = 6;
const DASH_TINT = 0xffe0a8;
const FLASH_TINT = 0xffffff;
/** Effects behind the body (props, helpers) and in front of it (auras, sparks). */
const DEPTH = { behind: -1, front: 1 } as const;

type Sprite = Phaser.GameObjects.Sprite;

/**
 * A character drawn with pixel art: the body sprite on the collision box (feet
 * on its bottom), plus the props and effects of its specials. The art faces
 * right; facing left mirrors it. Render only: everything comes from the Player.
 */
export class CharacterSprite {
  private readonly body: Sprite;
  private readonly prop: Sprite | null;
  private readonly helper: Sprite | null;
  private readonly aura: Sprite | null;
  private readonly blast: Sprite | null;
  private readonly teleport: Sprite | null;
  private readonly flag: Sprite | null;
  private readonly canopy: Sprite | null;
  private readonly cords: Phaser.GameObjects.Graphics;
  private readonly dizzy: Sprite;
  private readonly art: CharacterArt;
  /** The body's normal colour filter (null: none); the hit flash and the dash tint go over it. */
  private readonly tint: number | null;
  /** Where the current up special started (feet), so the helper stays there as the character rises. */
  private helperAt: { x: number; y: number } | null = null;
  private parachuteMs = 0;
  private airborneMs = 0;
  private clockMs = 0;
  /** The body animation being drawn (null: the still pose) and how long it has been on. */
  private anim: AnimName | null = null;
  private animMs = 0;

  constructor(scene: Phaser.Scene, art: CharacterArt, tint: number | null = null) {
    this.art = art;
    this.tint = tint;
    const add = (sheet: { key: string } | undefined, originX: number, originY: number, depth: number) =>
      sheet ? scene.add.sprite(0, 0, sheet.key, 0).setOrigin(originX, originY).setDepth(depth).setVisible(false) : null;
    this.flag = add(art.flag?.wave, 0, 1, DEPTH.behind);
    this.prop = add(art.neutralProp, 0, 1, DEPTH.behind);
    this.helper = add(art.upProp, 0.5, 1, DEPTH.behind);
    this.cords = scene.add.graphics();
    this.canopy = add(art.parachute, 0.5, 1, 0);
    this.body = scene.add.sprite(0, 0, art.body.key, 0).setOrigin(0.5, 1);
    this.blast = add(art.upBlast, 0.5, 0, DEPTH.behind);
    this.aura = add(art.neutralAura, 0.5, 0.5, DEPTH.front);
    this.teleport = add(art.teleport, 0.5, 1, DEPTH.front);
    this.dizzy = scene.add.sprite(0, 0, SHEETS.chachinDizzy.key, 0).setOrigin(0.5, 1).setDepth(DEPTH.front).setVisible(false);
  }

  get gameObjects(): Phaser.GameObjects.GameObject[] {
    const all = [this.flag, this.prop, this.helper, this.cords, this.canopy, this.body, this.blast, this.aura, this.teleport, this.dizzy];
    return all.filter((o): o is NonNullable<typeof o> => o !== null);
  }

  /** (x, y): the collision box's top-left corner as drawn this frame (interpolated). */
  render(player: Player, x: number, y: number, opacity: number, frameMs: number): void {
    this.clockMs += frameMs;
    const feetX = x + player.width / 2;
    const feetY = y + player.height;
    this.body.setVisible(true).setFlipX(player.facing === -1).setAlpha(opacity);
    this.renderBody(player, feetX, y, feetY, frameMs);
    if (player.hitFlashTicks > 0) this.body.setTintFill(FLASH_TINT);
    else if (player.dodgeKind === 'dash') this.body.setTint(DASH_TINT);
    else if (this.tint !== null) this.body.setTint(this.tint);
    else this.body.clearTint();
    this.renderProp(player, x, feetY);
    this.renderHelper(player);
    this.renderAura(player, feetX, y + player.height / 2);
    this.renderBlast(player, feetX, feetY);
    this.renderTeleport(player, feetX, feetY);
    this.renderFlag(player, frameMs);
    this.renderParachute(player, feetX, y, frameMs);
    this.renderDizzy(player, feetX, y);
  }

  /**
   * The animation for what the player is doing (or the still pose). Feet on the
   * bottom of the collision box; hanging from a ledge, hands at its top.
   */
  private renderBody(player: Player, feetX: number, top: number, feetY: number, frameMs: number): void {
    const anims = this.art.anims ?? {};
    const anim = resolveAnim(animFor(player), (name) => anims[name] !== undefined);
    this.animMs = anim === this.anim ? this.animMs + frameMs : 0;
    this.anim = anim;
    const sheet = anim ? anims[anim] : undefined;
    if (!anim || !sheet) {
      this.body.setTexture(this.art.body.key, 0).setOrigin(0.5, 1).setPosition(feetX, feetY);
      return;
    }
    const frame = frameFor(player, anim, sheet.frames, this.animMs, this.clockMs);
    const hanging = anim === 'ledge';
    this.body.setTexture(sheet.key, frame).setOrigin(0.5, hanging ? 0 : 1).setPosition(feetX, hanging ? top : feetY);
  }

  hide(): void {
    for (const o of [this.body, this.prop, this.helper, this.aura, this.blast, this.teleport, this.flag, this.canopy, this.dizzy]) {
      o?.setVisible(false);
    }
    this.cords.clear();
    this.helperAt = null;
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
    this.prop.setAlpha(Math.min(1, (t + 1) / PROP_FADE_IN_TICKS));
    const width = this.prop.width;
    const left = player.facing === 1 ? x + player.width + PROP_FRONT_OVERHANG - width : x - PROP_FRONT_OVERHANG;
    this.prop.setPosition(left, feetY).setFlipX(player.facing === -1);
  }

  /** Appears where the up special started and stays there while the character flies up. */
  private renderHelper(player: Player): void {
    if (!this.helper) return;
    const showing = player.attackId === 'specialUp';
    this.helper.setVisible(showing);
    if (!showing) {
      this.helperAt = null;
      return;
    }
    // prevX/prevY: where the body was at the start of the last step, the closest to the take-off spot.
    this.helperAt ??= { x: player.prevX + player.width / 2, y: player.prevY + player.height };
    const t = player.attackTick;
    this.helper.setFrame(t < HELPER_CROUCH_TICKS ? 0 : t < HELPER_THROW_TICKS ? 1 : 2);
    this.helper.setPosition(this.helperAt.x, this.helperAt.y).setFlipX(player.facing === -1);
  }

  /** Centred on the body: small while winding up, full while it hits, fading after. */
  private renderAura(player: Player, centerX: number, centerY: number): void {
    if (!this.aura) return;
    const phase = attackPhase(player);
    const { startup, active } = attackData(player, 'specialNeutral');
    const t = player.attackTick;
    const showing = player.attackId === 'specialNeutral' && (phase !== 'recovery' || t < startup + active + AURA_LINGER_TICKS);
    this.aura.setVisible(showing);
    if (!showing) return;
    const frame = phase === 'startup' ? 0 : phase === 'active' ? (t - startup < active / 2 ? 1 : 2) : 3;
    this.aura.setFrame(frame).setPosition(centerX, centerY);
  }

  /** Under the feet, following the character up: the scream that pushes the rocket. */
  private renderBlast(player: Player, feetX: number, feetY: number): void {
    if (!this.blast) return;
    const showing = player.attackId === 'specialUp';
    this.blast.setVisible(showing);
    if (!showing) return;
    const t = player.attackTick;
    this.blast.setFrame(t < BLAST_FRAME_TICKS[0] ? 0 : t < BLAST_FRAME_TICKS[1] ? 1 : 2).setPosition(feetX, feetY);
  }

  /** Sparks gathering while it winds up, then bursting where it arrives. */
  private renderTeleport(player: Player, feetX: number, feetY: number): void {
    if (!this.teleport) return;
    const { startup } = attackData(player, 'specialUp');
    const t = player.attackTick;
    const showing = player.attackId === 'specialUp' && t < startup + TELEPORT_ARRIVAL_TICKS;
    this.teleport.setVisible(showing);
    if (!showing) return;
    const frame = t < startup ? Math.min(2, Math.floor((t / startup) * 3)) : t < startup + TELEPORT_ARRIVAL_TICKS / 2 ? 3 : 4;
    this.teleport.setFrame(frame).setPosition(feetX, feetY);
  }

  /** Planted at the last spot stood on, shown while the player is away from it (in the air). */
  private renderFlag(player: Player, frameMs: number): void {
    if (!this.flag || !this.art.flag) return;
    const showing = !player.grounded;
    this.flag.setVisible(showing);
    if (!showing) {
      this.airborneMs = 0;
      return;
    }
    this.airborneMs += frameMs;
    const planting = this.airborneMs < FLAG_PLANT_MS;
    const sheet = planting ? this.art.flag.plant : this.art.flag.wave;
    const frame = planting ? Math.floor((this.airborneMs / FLAG_PLANT_MS) * 3) : Math.floor(this.clockMs / FLAG_WAVE_FRAME_MS) % 4;
    // The pole is at the sheet's left edge: plant it on the flag point.
    this.flag.setTexture(sheet.key, Math.min(frame, planting ? 2 : 3)).setPosition(player.flagX - 2, player.flagY);
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

  /** Stars circling over the head while stunned in place (Chachin's scream). */
  private renderDizzy(player: Player, centerX: number, top: number): void {
    const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    const showing = player.hitstunTicks >= DIZZY_MIN_STUN_TICKS && speed < DIZZY_MAX_SPEED;
    this.dizzy.setVisible(showing);
    if (showing) this.dizzy.setFrame(Math.floor(this.clockMs / DIZZY_FRAME_MS) % 4).setPosition(centerX, top - DIZZY_GAP);
  }
}
