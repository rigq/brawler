import Phaser from 'phaser';
import { CAMERA_MIN_ZOOM, WORLD_HEIGHT, WORLD_WIDTH } from '@brawler/shared';
import { THEME } from './palette.ts';

/**
 * Night sky behind the stage, drawn with shapes only (no image files).
 * Layers further away use a lower scrollFactor, so they move less than the
 * camera: that parallax is what gives a flat 2D scene some depth.
 */
export function drawBackdrop(scene: Phaser.Scene): Phaser.GameObjects.GameObject[] {
  return [
    drawSky(scene),
    drawStars(scene),
    drawMoon(scene),
    drawHorizonGlow(scene),
    drawMountains(scene, { color: THEME.mountainsFar, scroll: 0.25, baseY: 980, peakMin: 360, peakMax: 520, step: 140, seed: 7 }),
    drawMountains(scene, { color: THEME.mountainsNear, scroll: 0.5, baseY: 1120, peakMin: 560, peakMax: 680, step: 220, seed: 21 }),
  ];
}

/** Depths: backdrop far behind, stage behind the players (which use 0). */
const DEPTH = { sky: -100, stars: -95, moon: -90, glow: -85, mountains: -80 } as const;

/** Big enough to fill the screen even fully zoomed out. */
const COVER_W = (WORLD_WIDTH / CAMERA_MIN_ZOOM) * 1.2;
const COVER_H = (WORLD_HEIGHT / CAMERA_MIN_ZOOM) * 1.2;
const CENTER_X = WORLD_WIDTH / 2;
const CENTER_Y = WORLD_HEIGHT / 2;

function drawSky(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const { top, bottom } = THEME.sky;
  const sky = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.sky);
  sky.fillGradientStyle(top, top, bottom, bottom, 1);
  sky.fillRect(CENTER_X - COVER_W / 2, CENTER_Y - COVER_H / 2, COVER_W, COVER_H);
  return sky;
}

function drawStars(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const stars = scene.add.graphics().setScrollFactor(0.05).setDepth(DEPTH.stars);
  const random = seededRandom(3);
  for (let i = 0; i < 140; i++) {
    const x = CENTER_X + (random() - 0.5) * COVER_W;
    const y = CENTER_Y - COVER_H / 2 + random() * COVER_H * 0.55;
    stars.fillStyle(THEME.star, 0.25 + random() * 0.6).fillCircle(x, y, random() < 0.15 ? 2 : 1);
  }
  return stars;
}

function drawMoon(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const moon = scene.add.graphics().setScrollFactor(0.1).setDepth(DEPTH.moon);
  const x = 1010;
  const y = 70;
  // Soft halo: a few transparent circles, biggest first.
  for (const [radius, alpha] of [[110, 0.05], [80, 0.08], [60, 0.12]] as const) {
    moon.fillStyle(THEME.moon, alpha).fillCircle(x, y, radius);
  }
  moon.fillStyle(THEME.moon, 1).fillCircle(x, y, 42);
  // A couple of darker "craters".
  moon.fillStyle(THEME.mountainsNear, 0.12).fillCircle(x - 12, y - 8, 9).fillCircle(x + 14, y + 12, 6);
  return moon;
}

function drawHorizonGlow(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const glow = scene.add.graphics().setScrollFactor(0.2).setDepth(DEPTH.glow);
  for (const [height, alpha] of [[420, 0.1], [260, 0.12], [140, 0.15]] as const) {
    glow.fillStyle(THEME.horizonGlow, alpha).fillEllipse(CENTER_X, 640, COVER_W, height);
  }
  return glow;
}

interface MountainLayer {
  color: number;
  /** How much the layer follows the camera (0 = fixed, 1 = moves with the stage). */
  scroll: number;
  baseY: number;
  /** Peaks land between these heights (smaller y = taller). */
  peakMin: number;
  peakMax: number;
  /** Horizontal distance between points. */
  step: number;
  seed: number;
}

/** A jagged silhouette across the whole view. Fixed seed: same mountains every time. */
function drawMountains(scene: Phaser.Scene, layer: MountainLayer): Phaser.GameObjects.Graphics {
  const random = seededRandom(layer.seed);
  const left = CENTER_X - COVER_W;
  const right = CENTER_X + COVER_W;
  const points: Phaser.Types.Math.Vector2Like[] = [{ x: left, y: layer.baseY }];
  for (let x = left; x <= right; x += layer.step) {
    points.push({ x, y: layer.peakMin + random() * (layer.peakMax - layer.peakMin) });
  }
  points.push({ x: right, y: layer.baseY });

  const mountains = scene.add.graphics().setScrollFactor(layer.scroll).setDepth(DEPTH.mountains);
  mountains.fillStyle(layer.color, 1).fillPoints(points, true);
  return mountains;
}

/** Tiny deterministic generator, so the decoration looks the same on every load. */
export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}
