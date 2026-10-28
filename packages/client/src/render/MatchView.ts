import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH, matchResult, type MatchResult, type World } from '@brawler/shared';
import { DamageHud } from '../ui/DamageHud.ts';
import { ResultOverlay } from '../ui/ResultOverlay.ts';
import { StatsHud } from '../ui/StatsHud.ts';
import { drawBackdrop } from './Backdrop.ts';
import { CameraRig } from './CameraRig.ts';
import { DebugOverlay } from './DebugOverlay.ts';
import { PLAYER_COLORS, playerColor } from './palette.ts';
import { PlayerView, type VisualOffset } from './PlayerView.ts';
import { drawStage } from './StageView.ts';

/**
 * Everything that draws a match: stage, players, camera, HUDs, debug overlay
 * and result screen. It only reads the World it is given each frame, so it
 * does not care whether that World is simulated locally or comes from the server.
 */
export class MatchView {
  private readonly scene: Phaser.Scene;
  private readonly playerViews: PlayerView[];
  private readonly cameraRig: CameraRig;
  private readonly debugOverlay: DebugOverlay;
  private readonly hud: StatsHud;
  private readonly damageHud: DamageHud;
  private readonly resultOverlay: ResultOverlay;

  constructor(scene: Phaser.Scene, world: World, rematchHint: string) {
    this.scene = scene;
    const worldObjects = [...drawBackdrop(scene), ...drawStage(scene, world)];
    this.playerViews = world.players.map((player, i) => new PlayerView(scene, player, playerColor(i)));
    worldObjects.push(...this.playerViews.flatMap((view) => view.gameObjects));
    this.debugOverlay = new DebugOverlay(scene);
    worldObjects.push(this.debugOverlay.gameObject);

    this.hud = new StatsHud(scene);
    this.damageHud = new DamageHud(scene, PLAYER_COLORS);
    this.resultOverlay = new ResultOverlay(scene, PLAYER_COLORS, rematchHint);

    this.cameraRig = new CameraRig(scene.cameras.main);
    this.addUi([this.hud.gameObject, ...this.damageHud.gameObjects, ...this.resultOverlay.gameObjects]);
    // A second, fixed camera draws only the UI, so text stays put whatever the zoom.
    const uiCamera = scene.cameras.add(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    uiCamera.ignore(worldObjects);
  }

  /** True while the end-of-match screen is up. */
  get isResultShown(): boolean {
    return this.resultOverlay.isShown;
  }

  /** Registers screen-space objects (HUD, text) so the zooming world camera skips them. */
  addUi(objects: Phaser.GameObjects.GameObject[]): void {
    this.scene.cameras.main.ignore(objects);
  }

  /**
   * `alpha`: how far between the last two simulation steps to draw (see FixedStepAccumulator).
   * Options (online): `offsets[i]` shifts player i visually (correction smoothing);
   * `result` replaces the locally computed result (the server decides, e.g. a forfeit).
   */
  render(world: World, alpha: number, frameMs: number, options: RenderOptions = {}): void {
    const { offsets = [], result = matchResult(world.players) } = options;
    world.players.forEach((player, i) => this.playerViews[i]?.render(player, alpha, offsets[i]));
    this.debugOverlay.render(world.players);
    const onScreen = this.playerViews.filter((view) => view.isVisible);
    this.cameraRig.update(
      onScreen.map((view) => view.drawnBounds),
      frameMs,
    );
    this.hud.update(frameMs, world);
    this.damageHud.update(world.players);
    this.resultOverlay.update(result, frameMs);
  }

  hideResult(): void {
    this.resultOverlay.hide();
  }

  /** Changes the line under the result (e.g. rematch votes online). */
  setResultHint(text: string): void {
    this.resultOverlay.setHint(text);
  }
}

export interface RenderOptions {
  offsets?: readonly (VisualOffset | undefined)[];
  result?: MatchResult;
}
