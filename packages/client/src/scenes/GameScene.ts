import Phaser from 'phaser';
import { FixedStepAccumulator, createWorld, stepWorld, type World } from '@brawler/shared';
import { KeyboardInput, P1_BINDINGS } from '../input/KeyboardInput.ts';
import { PlayerView } from '../render/PlayerView.ts';
import { StatsHud } from '../ui/StatsHud.ts';

const SOLID_COLOR = 0x5b6b8c;
const PLATFORM_COLOR = 0x8fa3c9;
const PLAYER_COLORS = [0xf2a541];

// Runs the shared simulation at a fixed 60 Hz and draws it once per render frame.
export class GameScene extends Phaser.Scene {
  private readonly accumulator = new FixedStepAccumulator();
  private world: World = createWorld();
  private inputs: KeyboardInput[] = [];
  private playerViews: PlayerView[] = [];
  private hud!: StatsHud;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.world = createWorld();
    for (const solid of this.world.solids) {
      this.add.rectangle(solid.x, solid.y, solid.width, solid.height, SOLID_COLOR).setOrigin(0, 0);
    }
    for (const platform of this.world.platforms) {
      this.add.rectangle(platform.x, platform.y, platform.width, platform.height, PLATFORM_COLOR).setOrigin(0, 0);
    }
    this.playerViews = this.world.players.map(
      (player, i) => new PlayerView(this, player, PLAYER_COLORS[i] ?? 0xffffff),
    );
    this.inputs = [new KeyboardInput(this.input.keyboard!, P1_BINDINGS)];
    this.hud = new StatsHud(this);

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
    this.hud.update(delta, this.world);
  }
}

/** Dev only: inspect the live world and game from the browser console as `__world` / `__game`. */
function exposeForDebugging(world: World, game: Phaser.Game): void {
  Object.assign(window, { __world: world, __game: game });
}
