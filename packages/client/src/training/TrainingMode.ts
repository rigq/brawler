import Phaser from 'phaser';
import { STOCKS, type World } from '@brawler/shared';
import { TrainingHud } from '../ui/TrainingHud.ts';
import { ComboTracker } from './ComboTracker.ts';

/** P2's slot is the dummy: it never receives input. */
export const DUMMY_SLOT = 1;
/** 9 / 0 change the dummy's damage by this much (%). */
const DAMAGE_STEP = 10;
const MAX_DAMAGE = 300;
const Key = Phaser.Input.Keyboard.KeyCodes;

/**
 * Training rules on top of a normal local match: infinite lives, a dummy that
 * stands still, a combo counter and keys to reset or set the dummy's damage.
 * The simulation is untouched; this only adjusts the World between steps.
 */
export class TrainingMode {
  private readonly combos = new ComboTracker();
  private readonly hud: TrainingHud;

  constructor(scene: Phaser.Scene, getWorld: () => World, onReset: () => void) {
    this.hud = new TrainingHud(scene);
    const keyboard = scene.input.keyboard;
    keyboard?.addKey(Key.R).on('down', () => {
      this.combos.reset();
      onReset();
    });
    keyboard?.addKey(Key.NINE).on('down', () => this.changeDummyDamage(getWorld(), -DAMAGE_STEP));
    keyboard?.addKey(Key.ZERO).on('down', () => this.changeDummyDamage(getWorld(), DAMAGE_STEP));
  }

  get gameObjects(): Phaser.GameObjects.GameObject[] {
    return this.hud.gameObjects;
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
    this.hud.update(this.combos.current, this.combos.best, dummy ? this.combos.isLive(dummy) : false);
  }

  private changeDummyDamage(world: World, amount: number): void {
    const dummy = world.players[DUMMY_SLOT];
    if (dummy) dummy.damage = Phaser.Math.Clamp(dummy.damage + amount, 0, MAX_DAMAGE);
  }
}
