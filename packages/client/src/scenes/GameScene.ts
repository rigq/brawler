import Phaser from 'phaser';
import { FixedStepAccumulator, createWorld, stepWorld, type World } from '@brawler/shared';
import { GamepadInput } from '../input/GamepadInput.ts';
import { CombinedInput, type InputSource } from '../input/InputSource.ts';
import { KeyboardInput, P1_BINDINGS, P2_BINDINGS, type KeyBindings } from '../input/KeyboardInput.ts';
import { RematchInput } from '../input/RematchInput.ts';
import { MatchView } from '../render/MatchView.ts';

const PLAYER_BINDINGS: KeyBindings[] = [P1_BINDINGS, P2_BINDINGS];

// Local 2-player match: runs the shared simulation at a fixed 60 Hz and draws it once per render frame.
export class GameScene extends Phaser.Scene {
  private readonly accumulator = new FixedStepAccumulator();
  private world: World = createWorld();
  private inputs: InputSource[] = [];
  private view!: MatchView;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.world = createWorld();
    this.view = new MatchView(this, this.world, 'Revancha: Enter, R o Start');
    this.inputs = this.world.players.map((_, i) => this.createInput(i));
    new RematchInput(this, () => this.rematch());
    if (import.meta.env.DEV) exposeForDebugging(this.world, this.game);
  }

  update(_time: number, delta: number): void {
    // Keys are read once per render frame and reused for every step in it.
    const frameInputs = this.inputs.map((input) => input.read());
    const steps = this.accumulator.consume(delta);
    for (let i = 0; i < steps; i++) {
      stepWorld(this.world, frameInputs);
    }
    this.view.render(this.world, this.accumulator.alpha, delta);
  }

  /**
   * A fresh World is all a new match needs: the view draws whatever world
   * it is given each frame, so nothing else is rebuilt.
   */
  private rematch(): void {
    if (!this.view.isResultShown) return;
    this.world = createWorld();
    this.view.hideResult();
    if (import.meta.env.DEV) exposeForDebugging(this.world, this.game);
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
