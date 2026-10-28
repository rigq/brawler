import Phaser from 'phaser';
import {
  FixedStepAccumulator,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  createWorld,
  matchResult,
  stepWorld,
  type World,
} from '@brawler/shared';
import { GamepadInput } from '../input/GamepadInput.ts';
import { CombinedInput, type InputSource } from '../input/InputSource.ts';
import { KeyboardInput, P1_BINDINGS, P2_BINDINGS, type KeyBindings } from '../input/KeyboardInput.ts';
import { RematchInput } from '../input/RematchInput.ts';
import { CameraRig } from '../render/CameraRig.ts';
import { DebugOverlay } from '../render/DebugOverlay.ts';
import { PlayerView } from '../render/PlayerView.ts';
import { DamageHud } from '../ui/DamageHud.ts';
import { ResultOverlay } from '../ui/ResultOverlay.ts';
import { StatsHud } from '../ui/StatsHud.ts';

const SOLID_COLOR = 0x5b6b8c;
const PLATFORM_COLOR = 0x8fa3c9;
const PLAYER_COLORS = [0xf2a541, 0x4fc3f7];
const PLAYER_BINDINGS: KeyBindings[] = [P1_BINDINGS, P2_BINDINGS];

// Runs the shared simulation at a fixed 60 Hz and draws it once per render frame.
export class GameScene extends Phaser.Scene {
  private readonly accumulator = new FixedStepAccumulator();
  private world: World = createWorld();
  private inputs: InputSource[] = [];
  private playerViews: PlayerView[] = [];
  private cameraRig!: CameraRig;
  private debugOverlay!: DebugOverlay;
  private hud!: StatsHud;
  private damageHud!: DamageHud;
  private resultOverlay!: ResultOverlay;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.world = createWorld();
    const worldObjects: Phaser.GameObjects.GameObject[] = [];
    for (const solid of this.world.solids) {
      worldObjects.push(this.add.rectangle(solid.x, solid.y, solid.width, solid.height, SOLID_COLOR).setOrigin(0, 0));
    }
    for (const platform of this.world.platforms) {
      worldObjects.push(
        this.add.rectangle(platform.x, platform.y, platform.width, platform.height, PLATFORM_COLOR).setOrigin(0, 0),
      );
    }
    this.playerViews = this.world.players.map(
      (player, i) => new PlayerView(this, player, PLAYER_COLORS[i] ?? 0xffffff),
    );
    worldObjects.push(...this.playerViews.flatMap((view) => view.gameObjects));
    this.debugOverlay = new DebugOverlay(this);
    worldObjects.push(this.debugOverlay.gameObject);
    this.inputs = this.world.players.map((_, i) => this.createInput(i));
    this.hud = new StatsHud(this);
    this.damageHud = new DamageHud(this, PLAYER_COLORS);
    this.resultOverlay = new ResultOverlay(this, PLAYER_COLORS);
    new RematchInput(this, () => this.rematch());

    this.setUpCameras(worldObjects, [
      this.hud.gameObject,
      ...this.damageHud.gameObjects,
      ...this.resultOverlay.gameObjects,
    ]);

    if (import.meta.env.DEV) exposeForDebugging(this.world, this.game);
  }

  update(_time: number, delta: number): void {
    // Keys are read once per render frame and reused for every step in it.
    const frameInputs = this.inputs.map((input) => input.read());
    const steps = this.accumulator.consume(delta);
    for (let i = 0; i < steps; i++) {
      stepWorld(this.world, frameInputs);
    }

    this.world.players.forEach((player, i) => this.playerViews[i]?.render(player, this.accumulator.alpha));
    this.debugOverlay.render(this.world.players);
    const onScreen = this.playerViews.filter((view) => view.isVisible);
    this.cameraRig.update(
      onScreen.map((view) => view.drawnBounds),
      delta,
    );
    this.hud.update(delta, this.world);
    this.damageHud.update(this.world.players);
    this.resultOverlay.update(matchResult(this.world.players), delta);
  }

  /**
   * A fresh World is all a new match needs: views, camera and HUDs draw
   * whatever world they are given each frame, so nothing else is rebuilt.
   */
  private rematch(): void {
    if (!this.resultOverlay.isShown) return;
    this.world = createWorld();
    this.resultOverlay.hide();
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

  /**
   * The main camera follows the players and zooms. A second, fixed camera draws
   * only the HUD, so text stays put and readable whatever the zoom.
   */
  private setUpCameras(worldObjects: Phaser.GameObjects.GameObject[], uiObjects: Phaser.GameObjects.GameObject[]): void {
    this.cameraRig = new CameraRig(this.cameras.main);
    this.cameras.main.ignore(uiObjects);
    const uiCamera = this.cameras.add(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    uiCamera.ignore(worldObjects);
  }
}

/** Dev only: inspect the live world and game from the browser console as `__world` / `__game`. */
function exposeForDebugging(world: World, game: Phaser.Game): void {
  Object.assign(window, { __world: world, __game: game });
}
