import Phaser from 'phaser';
import {
  FIXED_DT_MS,
  SHAKE_BASE,
  SHAKE_EXTRA_MS,
  SHAKE_MAX,
  SHAKE_PER_DAMAGE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  hitstopTicks,
  matchResult,
  type MatchResult,
  type World,
} from '@brawler/shared';
import { MatchSounds } from '../audio/MatchSounds.ts';
import { Countdown } from '../ui/hud/Countdown.ts';
import { Hud } from '../ui/hud/Hud.ts';
import { gameLayer } from '../ui/layer.ts';
import { ResultOverlay } from '../ui/ResultOverlay.ts';
import { StatsHud } from '../ui/StatsHud.ts';
import { drawBackdrop } from './Backdrop.ts';
import { CameraRig } from './CameraRig.ts';
import { DebugOverlay } from './DebugOverlay.ts';
import { HitEffects } from './HitEffects.ts';
import { MatchFx } from './MatchFx.ts';
import { MatchStats, type MatchSummary } from './MatchStats.ts';
import { MIRROR_TINT, PLAYER_COLORS, playerColor } from './palette.ts';
import { PlayerView, type VisualOffset } from './PlayerView.ts';
import { ProjectileView } from './ProjectileView.ts';
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
  private readonly projectileView: ProjectileView;
  private readonly hitEffects: HitEffects;
  private readonly fx: MatchFx;
  private readonly sounds = new MatchSounds();
  private stats = new MatchStats();
  private lastResult: MatchResult = { over: false };
  private readonly hud: StatsHud;
  private readonly playerHud: Hud;
  private readonly countdown: Countdown;
  private readonly resultOverlay: ResultOverlay;
  /** Everything this view created, for destroy(). */
  private readonly owned: Phaser.GameObjects.GameObject[];
  private readonly uiCamera: Phaser.Cameras.Scene2D.Camera;

  constructor(scene: Phaser.Scene, world: World, rematchHint: string) {
    this.scene = scene;
    const worldObjects = [...drawBackdrop(scene), ...drawStage(scene, world)];
    // Same character as someone before them (Donate vs Donate): tinted, so the two look different.
    this.playerViews = world.players.map((player, i) => {
      const repeated = world.players.slice(0, i).some((other) => other.characterId === player.characterId);
      return new PlayerView(scene, player, playerColor(i), repeated ? MIRROR_TINT : null);
    });
    worldObjects.push(...this.playerViews.flatMap((view) => view.gameObjects));
    this.hitEffects = new HitEffects(scene, PLAYER_COLORS);
    worldObjects.push(...this.hitEffects.gameObjects);
    this.fx = new MatchFx(scene, PLAYER_COLORS);
    worldObjects.push(...this.fx.worldObjects);
    this.debugOverlay = new DebugOverlay(scene);
    worldObjects.push(this.debugOverlay.gameObject);

    this.hud = new StatsHud(scene);
    // HTML over the canvas: removed with the scene (back to the menu, rematch online…).
    this.playerHud = new Hud(gameLayer(scene.game.canvas), world.players.map((p) => p.characterId));
    this.countdown = new Countdown(gameLayer(scene.game.canvas));
    for (const event of [Phaser.Scenes.Events.SHUTDOWN, Phaser.Scenes.Events.DESTROY]) {
      scene.events.once(event, () => {
        this.playerHud.destroy();
        this.countdown.destroy();
      });
    }
    this.resultOverlay = new ResultOverlay(scene, PLAYER_COLORS, rematchHint);

    this.cameraRig = new CameraRig(scene.cameras.main);
    this.addUi([this.hud.gameObject, ...this.resultOverlay.gameObjects, ...this.fx.screenObjects]);
    // A second, fixed camera draws only the UI, so text stays put whatever the zoom.
    const uiCamera = scene.cameras.add(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    uiCamera.ignore(worldObjects);
    this.uiCamera = uiCamera;
    // Projectiles come and go during the match: each new object is hidden from the UI camera as it appears.
    this.projectileView = new ProjectileView(scene, (object) => uiCamera.ignore(object));
    this.owned = [...worldObjects, this.hud.gameObject, ...this.resultOverlay.gameObjects, ...this.fx.screenObjects];
  }

  /**
   * Removes everything this view drew, so a new one can be built in the same
   * scene (online, when someone changes character between matches).
   */
  destroy(): void {
    for (const object of this.owned) object.destroy();
    this.projectileView.destroy();
    this.playerHud.destroy();
    this.countdown.destroy();
    this.scene.cameras.remove(this.uiCamera);
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
    // In a 1v1 the rival is the other player (some effects depend on who it is).
    world.players.forEach((player, i) => this.playerViews[i]?.render(player, alpha, frameMs, offsets[i], world.players[1 - i]));
    this.projectileView.render(world.projectiles, alpha, frameMs);
    this.debugOverlay.render(world.players, alpha);
    for (const dealt of this.hitEffects.update(world.players, frameMs)) this.shake(dealt);
    this.fx.update(world, frameMs);
    this.sounds.update(world, result.over);
    this.stats.update(world);
    this.lastResult = result;
    const onScreen = this.playerViews.filter((view) => view.isVisible);
    this.cameraRig.update(
      onScreen.map((view) => view.drawnBounds),
      frameMs,
    );
    this.hud.update(frameMs);
    this.playerHud.update(world.players);
    this.countdown.update(world);
    this.resultOverlay.update(result, frameMs);
  }

  /** Shakes the world camera only (the UI camera stays still), harder for stronger hits. */
  private shake(dealt: number): void {
    const intensity = Math.min(SHAKE_BASE + dealt * SHAKE_PER_DAMAGE, SHAKE_MAX);
    const duration = hitstopTicks(dealt) * FIXED_DT_MS + SHAKE_EXTRA_MS;
    // force = true: a new hit restarts the shake instead of being ignored.
    this.scene.cameras.main.shake(duration, intensity, true);
  }

  hideResult(): void {
    this.resultOverlay.hide();
    this.resetStats();
  }

  /** A new match: the stats start again on the next frame. */
  resetStats(): void {
    this.stats = new MatchStats();
  }

  /** How the match went (for the victory screen). */
  summary(): MatchSummary {
    return this.stats.summary(this.lastResult.over ? this.lastResult.winner : null);
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
