import Phaser from 'phaser';
import { WORLD_WIDTH, createWorld } from '@brawler/shared';
import { drawBackdrop } from '../render/Backdrop.ts';
import { drawStage } from '../render/StageView.ts';

/** Slight zoom so the slow drift never shows the edges. */
const ZOOM = 1.12;
/** The camera sways this far (px) over SWAY_MS, back and forth. */
const SWAY_PX = 40;
const SWAY_MS = 14000;

/** The night stage, empty and slowly drifting: what you see behind the menus. */
export class BackdropScene extends Phaser.Scene {
  private elapsedMs = 0;

  constructor() {
    super('BackdropScene');
  }

  create(): void {
    drawBackdrop(this);
    drawStage(this, createWorld());
    this.cameras.main.setZoom(ZOOM);
  }

  update(_time: number, delta: number): void {
    this.elapsedMs += delta;
    const sway = Math.sin((this.elapsedMs / SWAY_MS) * Math.PI * 2) * SWAY_PX;
    this.cameras.main.centerOn(WORLD_WIDTH / 2 + sway, this.cameras.main.height / 2);
  }
}
