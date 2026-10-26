import Phaser from 'phaser';
import { FixedStepAccumulator, GROUND, createWorld, stepWorld, type World } from '@brawler/shared';
import { StatsHud } from '../ui/StatsHud.ts';

const GROUND_COLOR = 0x5b6b8c;

// Runs the shared simulation at a fixed 60 Hz and draws it once per render frame.
export class GameScene extends Phaser.Scene {
  private readonly accumulator = new FixedStepAccumulator();
  private world: World = createWorld();
  private hud!: StatsHud;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.world = createWorld();
    this.add.rectangle(GROUND.x, GROUND.y, GROUND.width, GROUND.height, GROUND_COLOR).setOrigin(0, 0);
    this.hud = new StatsHud(this);
  }

  update(_time: number, delta: number): void {
    const steps = this.accumulator.consume(delta);
    for (let i = 0; i < steps; i++) {
      stepWorld(this.world);
    }
    this.hud.update(delta, this.world.tick);
  }
}
