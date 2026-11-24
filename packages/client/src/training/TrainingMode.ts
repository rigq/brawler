import Phaser from 'phaser';
import { BOT_LEVELS, EMPTY_INPUT, STOCKS, botInput, createBot, type Bot, type BotLevel, type PlayerInput, type World } from '@brawler/shared';
import { TrainingHud } from '../ui/TrainingHud.ts';
import { ComboTracker } from './ComboTracker.ts';

/** P2's slot is the rival: the CPU, or a dummy that never receives input. */
export const DUMMY_SLOT = 1;
/** What the rival is: key 7 goes round these, starting with the first. */
const RIVALS: (BotLevel | 'dummy')[] = ['expert', 'normal', 'dummy'];
/** 9 / 0 change the dummy's damage by this much (%). */
const DAMAGE_STEP = 10;
const MAX_DAMAGE = 300;
const Key = Phaser.Input.Keyboard.KeyCodes;

/**
 * Training rules on top of a normal local match: infinite lives, a rival that
 * fights back (the CPU, ai/bot.ts in shared) or a dummy that stands still (or
 * shields), a combo counter and keys to reset or set its damage.
 * The simulation is untouched; this only adjusts the World between steps.
 */
export class TrainingMode {
  private readonly combos = new ComboTracker();
  private readonly hud: TrainingHud;
  private dummyShields = false;
  private rival = 0;
  private bot: Bot | null = createBot('expert');

  constructor(scene: Phaser.Scene, getWorld: () => World, onReset: () => void) {
    this.hud = new TrainingHud(scene);
    const keyboard = scene.input.keyboard;
    keyboard?.addKey(Key.R).on('down', () => {
      this.combos.reset();
      onReset();
    });
    keyboard?.addKey(Key.SEVEN).on('down', () => this.nextRival());
    keyboard?.addKey(Key.EIGHT).on('down', () => {
      this.dummyShields = !this.dummyShields;
    });
    keyboard?.addKey(Key.NINE).on('down', () => this.changeDummyDamage(getWorld(), -DAMAGE_STEP));
    keyboard?.addKey(Key.ZERO).on('down', () => this.changeDummyDamage(getWorld(), DAMAGE_STEP));
  }

  get gameObjects(): Phaser.GameObjects.GameObject[] {
    return this.hud.gameObjects;
  }

  /** The rival's buttons for the next step: the CPU's choice, or the dummy (nothing, or the shield with key 8). */
  rivalInput(world: World, playerInput: PlayerInput): PlayerInput {
    if (!this.bot) return { ...EMPTY_INPUT, dodge: this.dummyShields };
    return botInput(this.bot, world, DUMMY_SLOT, playerInput);
  }

  /** Key 7: CPU expert → CPU normal → dummy → … */
  private nextRival(): void {
    this.rival = (this.rival + 1) % RIVALS.length;
    const kind = RIVALS[this.rival]!;
    this.bot = kind === 'dummy' ? null : createBot(kind);
  }

  private get rivalLabel(): string {
    const kind = RIVALS[this.rival]!;
    return kind === 'dummy' ? 'muñeco' : BOT_LEVELS[kind].label;
  }

  beforeStep(world: World): void {
    const dummy = world.players[DUMMY_SLOT];
    if (dummy) this.combos.beforeStep(dummy);
  }

  afterStep(world: World): void {
    const dummy = world.players[DUMMY_SLOT];
    if (dummy) this.combos.afterStep(dummy);
    // Infinite lives: a KO still sends you back to your spawn, but never ends the match.
    for (const player of world.players) player.stocks = STOCKS;
  }

  render(world: World): void {
    const dummy = world.players[DUMMY_SLOT];
    this.hud.update(this.combos.current, this.combos.best, dummy ? this.combos.isLive(dummy) : false, this.rivalLabel);
  }

  private changeDummyDamage(world: World, amount: number): void {
    const dummy = world.players[DUMMY_SLOT];
    if (dummy) dummy.damage = Phaser.Math.Clamp(dummy.damage + amount, 0, MAX_DAMAGE);
  }
}
