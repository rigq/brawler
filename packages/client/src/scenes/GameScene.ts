import Phaser from 'phaser';
import { FixedStepAccumulator, createWorld, startCountdown, stepWorld, type CharacterId, type World } from '@brawler/shared';
import { GamepadInput } from '../input/GamepadInput.ts';
import { CombinedInput, type InputSource } from '../input/InputSource.ts';
import { KeyboardInput, P1_BINDINGS, P2_BINDINGS, type KeyBindings } from '../input/KeyboardInput.ts';
import { RematchInput } from '../input/RematchInput.ts';
import { preloadArt } from '../render/art.ts';
import { MatchView } from '../render/MatchView.ts';
import { DUMMY_SLOT, TrainingMode } from '../training/TrainingMode.ts';
import type { SceneHooks } from './hooks.ts';

const PLAYER_BINDINGS: KeyBindings[] = [P1_BINDINGS, P2_BINDINGS];

export type LocalMode = 'versus' | 'training';

/**
 * Local match: runs the shared simulation at a fixed 60 Hz and draws it once per render frame.
 * 'versus': 2 players on one keyboard. 'training': P1 against a dummy (see TrainingMode).
 */
export class GameScene extends Phaser.Scene {
  private readonly accumulator = new FixedStepAccumulator();
  private readonly mode: LocalMode;
  private readonly characters: readonly CharacterId[];
  private world: World = createWorld();
  private inputs: InputSource[] = [];
  private view!: MatchView;
  private training: TrainingMode | null = null;
  private readonly hooks: SceneHooks;
  /** While the pause menu is open the simulation does not advance. */
  private paused = false;
  /** The victory screen is up for this match (it comes up once). */
  private overShown = false;

  constructor(mode: LocalMode = 'versus', characters: readonly CharacterId[] = [], hooks: SceneHooks = {}) {
    super('GameScene');
    this.mode = mode;
    this.characters = characters;
    this.hooks = hooks;
  }

  preload(): void {
    preloadArt(this);
  }

  create(): void {
    this.world = this.newWorld();
    this.view = new MatchView(this, this.world, 'Revancha: Enter, R o Start · Personaje o menú: Esc');
    this.input.keyboard?.on('keydown-ESC', () => this.pause());
    if (this.mode === 'training') {
      this.training = new TrainingMode(this, () => this.world, () => this.restart());
      this.view.addUi(this.training.gameObjects);
    } else {
      // With menus around (App), the victory screen has the rematch button instead.
      if (!this.hooks.onMatchOver) new RematchInput(this, () => this.rematch());
    }
    this.inputs = this.world.players.map((_, i) =>
      this.training && i === DUMMY_SLOT ? this.training.dummyInput : this.createInput(i),
    );
    if (import.meta.env.DEV) exposeForDebugging(this.world, this.game);
  }

  update(_time: number, delta: number): void {
    if (this.paused) return;
    // Keys are read once per render frame and reused for every step in it.
    const frameInputs = this.inputs.map((input) => input.read());
    const steps = this.accumulator.consume(delta);
    for (let i = 0; i < steps; i++) {
      this.training?.beforeStep(this.world);
      stepWorld(this.world, frameInputs);
      this.training?.afterStep(this.world);
    }
    this.view.render(this.world, this.accumulator.alpha, delta);
    this.training?.render(this.world);
    this.showVictoryOnce();
  }

  /** When the result appears, the victory screen comes up over it (once per match). */
  private showVictoryOnce(): void {
    if (this.overShown || !this.view.isResultShown || !this.hooks.onMatchOver) return;
    this.overShown = true;
    this.hooks.onMatchOver(this.view.summary(), { rematch: () => this.rematch() });
  }

  private pause(): void {
    // The victory screen has its own buttons.
    if (this.paused || !this.hooks.onPause || this.overShown) return;
    this.paused = true;
    this.hooks.onPause({
      resume: () => (this.paused = false),
      restart: () => {
        this.view.hideResult();
        this.restart();
        this.paused = false;
      },
    });
  }

  /**
   * A fresh World is all a new match needs: the view draws whatever world
   * it is given each frame, so nothing else is rebuilt.
   */
  private rematch(): void {
    if (!this.view.isResultShown) return;
    this.view.hideResult();
    this.restart();
    this.overShown = false;
    this.hooks.onMatchOverEnd?.();
  }

  private restart(): void {
    this.world = this.newWorld();
    if (import.meta.env.DEV) exposeForDebugging(this.world, this.game);
  }

  /** A fresh match: versus starts with the "3, 2, 1, ¡YA!"; training straight away. */
  private newWorld(): World {
    const world = createWorld(this.characters);
    if (this.mode === 'versus') startCountdown(world);
    return world;
  }

  /** Player i: its half of the keyboard, plus gamepad number i if one is connected. */
  private createInput(playerIndex: number): InputSource {
    const sources: InputSource[] = [];
    const bindings = PLAYER_BINDINGS[playerIndex];
    if (bindings) sources.push(new KeyboardInput(this.input.keyboard!, bindings));
    if (this.input.gamepad) sources.push(new GamepadInput(this.input.gamepad, playerIndex));
    return new CombinedInput(sources);
  }
}

/** Dev only: inspect the live world and game from the browser console as `__world` / `__game`. */
export function exposeForDebugging(world: World, game: Phaser.Game): void {
  Object.assign(window, { __world: world, __game: game });
}
