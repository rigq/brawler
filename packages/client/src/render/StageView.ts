import Phaser from 'phaser';
import type { StageGeometry } from '@brawler/shared';
import { PLATFORM_COLOR, SOLID_COLOR } from './palette.ts';

/** Draws the stage: solid ground and one-way platforms. */
export function drawStage(scene: Phaser.Scene, stage: StageGeometry): Phaser.GameObjects.GameObject[] {
  const solids = stage.solids.map((r) =>
    scene.add.rectangle(r.x, r.y, r.width, r.height, SOLID_COLOR).setOrigin(0, 0),
  );
  const platforms = stage.platforms.map((r) =>
    scene.add.rectangle(r.x, r.y, r.width, r.height, PLATFORM_COLOR).setOrigin(0, 0),
  );
  return [...solids, ...platforms];
}
