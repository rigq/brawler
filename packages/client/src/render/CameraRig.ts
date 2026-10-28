import Phaser from 'phaser';
import {
  CAMERA_BOUNDS,
  CAMERA_MAX_ZOOM,
  CAMERA_MIN_ZOOM,
  CAMERA_PADDING_X,
  CAMERA_PADDING_Y,
  CAMERA_SMOOTH_MS,
  type Rect,
} from '@brawler/shared';

/**
 * Keeps every target on screen: frames their bounding box plus some padding,
 * zooming in when they are close and out when they are far apart.
 * Purely visual, so it can use floats, Math.exp and render time freely.
 */
export class CameraRig {
  private readonly camera: Phaser.Cameras.Scene2D.Camera;
  private centerX = 0;
  private centerY = 0;
  private zoom = 1;
  private initialised = false;

  constructor(camera: Phaser.Cameras.Scene2D.Camera) {
    this.camera = camera;
    camera.setBounds(CAMERA_BOUNDS.x, CAMERA_BOUNDS.y, CAMERA_BOUNDS.width, CAMERA_BOUNDS.height);
  }

  update(targets: readonly Rect[], frameMs: number): void {
    if (targets.length === 0) return;
    const goal = this.frame(targets);

    // Exponential smoothing that behaves the same at 30, 60 or 144 FPS.
    const t = this.initialised ? 1 - Math.exp(-frameMs / CAMERA_SMOOTH_MS) : 1;
    this.initialised = true;
    this.centerX += (goal.centerX - this.centerX) * t;
    this.centerY += (goal.centerY - this.centerY) * t;
    this.zoom += (goal.zoom - this.zoom) * t;

    this.camera.setZoom(this.zoom);
    this.camera.centerOn(this.centerX, this.centerY);
  }

  /** Where the camera wants to be: the centre of all targets and a zoom that fits them. */
  private frame(targets: readonly Rect[]): { centerX: number; centerY: number; zoom: number } {
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (const r of targets) {
      left = Math.min(left, r.x);
      top = Math.min(top, r.y);
      right = Math.max(right, r.x + r.width);
      bottom = Math.max(bottom, r.y + r.height);
    }
    const width = right - left + 2 * CAMERA_PADDING_X;
    const height = bottom - top + 2 * CAMERA_PADDING_Y;
    const fit = Math.min(this.camera.width / width, this.camera.height / height);

    return {
      centerX: (left + right) / 2,
      centerY: (top + bottom) / 2,
      zoom: Phaser.Math.Clamp(fit, CAMERA_MIN_ZOOM, CAMERA_MAX_ZOOM),
    };
  }
}
