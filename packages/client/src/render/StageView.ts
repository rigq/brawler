import Phaser from 'phaser';
import type { Rect, StageGeometry } from '@brawler/shared';
import { seededRandom } from './Backdrop.ts';
import { bake } from './bake.ts';
import { THEME } from './palette.ts';

/** Behind the players (depth 0), in front of the backdrop. */
const DEPTH = { island: -20, decor: -15 } as const;
const GRASS_HEIGHT = 12;
/** How far the rocky underside hangs below the island, as a fraction of its width. */
const ISLAND_DEPTH_RATIO = 0.2;
/** One stone on the rock face per this many px of island width. */
const STONE_SPACING = 85;
/** Lanterns at these fractions of the island's width (one near each end). */
const LANTERN_SPOTS = [0.05, 0.95] as const;
const PLANK_WIDTH = 40;
const LANTERN = { postHeight: 70, size: 16, glowRadius: 46 } as const;
/** Extra room around each drawing when it is baked into a picture, so nothing is cut off. */
const BAKE_MARGIN = 8;

/**
 * Draws the stage with simple shapes: a floating island (the solid ground),
 * wooden plank platforms and a few lanterns. Only the stage geometry from
 * @brawler/shared decides where things are; this is just how it looks.
 */
export function drawStage(scene: Phaser.Scene, stage: StageGeometry): Phaser.GameObjects.GameObject[] {
  const objects: Phaser.GameObjects.GameObject[] = [];
  for (const solid of stage.solids) {
    const below = solid.y + solid.height + solid.width * ISLAND_DEPTH_RATIO + 30;
    objects.push(bake(drawIsland(scene, solid), around(solid.x, solid.y - 4, solid.x + solid.width, below)));
    const lanternTop = solid.y - LANTERN.postHeight - LANTERN.glowRadius;
    const lanternArea = around(solid.x - LANTERN.glowRadius, lanternTop, solid.x + solid.width + LANTERN.glowRadius, solid.y);
    objects.push(...drawLanterns(scene, solid).map((g) => bake(g, lanternArea)));
  }
  for (const p of stage.platforms) objects.push(bake(drawPlatform(scene, p), around(p.x, p.y, p.x + p.width, p.y + p.height + 20)));
  return objects;
}

/** The rectangle from (left, top) to (right, bottom), plus BAKE_MARGIN on every side. */
function around(left: number, top: number, right: number, bottom: number): Rect {
  return {
    x: left - BAKE_MARGIN,
    y: top - BAKE_MARGIN,
    width: right - left + 2 * BAKE_MARGIN,
    height: bottom - top + 2 * BAKE_MARGIN,
  };
}

/** Grass on top, rock face, and a rocky underside tapering to a point. */
function drawIsland(scene: Phaser.Scene, r: Rect): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(DEPTH.island);
  const random = seededRandom(11);
  const bottom = r.y + r.height;
  const depth = r.width * ISLAND_DEPTH_RATIO;

  // Underside: jagged, narrowing downwards.
  const tip = { x: r.x + r.width / 2, y: bottom + depth };
  const underside: Phaser.Types.Math.Vector2Like[] = [{ x: r.x, y: bottom }];
  const steps = 12;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const sag = Math.sin(t * Math.PI) * depth; // render-only maths, fine to use sin here
    underside.push({ x: r.x + t * r.width, y: bottom + sag * (0.75 + random() * 0.3) });
  }
  underside.push({ x: r.x + r.width, y: bottom });
  g.fillStyle(THEME.island.rockDark, 1).fillPoints(underside, true);
  g.fillStyle(THEME.island.rockDark, 1).fillTriangle(tip.x - 40, bottom + 60, tip.x + 40, bottom + 60, tip.x, tip.y + 30);

  // Rock face (the actual solid) and a few stones on it.
  g.fillStyle(THEME.island.rock, 1).fillRect(r.x, r.y, r.width, r.height);
  for (let i = 0; i < Math.round(r.width / STONE_SPACING); i++) {
    const x = r.x + 20 + random() * (r.width - 60);
    const y = r.y + 14 + random() * (r.height - 4);
    g.fillStyle(THEME.island.stone, 0.9).fillRoundedRect(x, y, 18 + random() * 22, 7 + random() * 6, 3);
  }

  drawCrystals(g, r, bottom, random);
  drawRoots(g, r, bottom, depth, random);

  // Grass strip with a darker lip, slightly overhanging the edges.
  g.fillStyle(THEME.island.grassShadow, 1).fillRoundedRect(r.x - 6, r.y - 2, r.width + 12, GRASS_HEIGHT + 4, 5);
  g.fillStyle(THEME.island.grass, 1).fillRoundedRect(r.x - 6, r.y - 4, r.width + 12, GRASS_HEIGHT, 5);
  drawTufts(g, r, random);
  return g;
}

/** Blades of grass and a few small flowers poking up along the top edge. */
function drawTufts(g: Phaser.GameObjects.Graphics, r: Rect, random: () => number): void {
  for (let x = r.x + 4; x < r.x + r.width - 4; x += 9 + random() * 14) {
    const h = 4 + random() * 6;
    g.fillStyle(random() < 0.5 ? THEME.island.grass : THEME.island.grassShadow, 1);
    g.fillTriangle(x - 2, r.y - 3, x + 2, r.y - 3, x + (random() - 0.5) * 3, r.y - 3 - h);
    if (random() < 0.12) {
      const colors = THEME.island.flower;
      g.fillStyle(colors[Math.floor(random() * colors.length)] ?? 0xffffff, 1).fillCircle(x, r.y - 4 - h, 2);
    }
  }
}

/** Roots and vines hanging from the underside, swaying nowhere (it is a picture), leaves on some. */
function drawRoots(g: Phaser.GameObjects.Graphics, r: Rect, bottom: number, depth: number, random: () => number): void {
  for (let i = 0; i < 14; i++) {
    const t = 0.08 + random() * 0.84;
    const x = r.x + t * r.width;
    const start = bottom + Math.sin(t * Math.PI) * depth * 0.55;
    const length = 20 + random() * 60;
    g.lineStyle(2, THEME.island.root, 0.9).beginPath();
    g.moveTo(x, start);
    g.lineTo(x + (random() - 0.5) * 10, start + length * 0.5);
    g.lineTo(x + (random() - 0.5) * 14, start + length);
    g.strokePath();
    if (random() < 0.6) g.fillStyle(THEME.island.leaf, 1).fillEllipse(x + 4, start + length * 0.6, 7, 4);
  }
}

/** Little glowing crystals stuck in the rock under the grass. */
function drawCrystals(g: Phaser.GameObjects.Graphics, r: Rect, bottom: number, random: () => number): void {
  for (let i = 0; i < 6; i++) {
    const x = r.x + 30 + random() * (r.width - 60);
    const y = bottom + 6 + random() * 30;
    const s = 4 + random() * 4;
    g.fillStyle(THEME.island.crystal, 0.08).fillCircle(x, y, s * 1.8);
    g.fillStyle(THEME.island.crystal, 0.95).fillTriangle(x - s * 0.6, y + s, x + s * 0.6, y + s, x, y - s * 1.4);
  }
}

/** Wooden planks: light top edge, body with plank seams, darker underside. */
function drawPlatform(scene: Phaser.Scene, r: Rect): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(DEPTH.island);
  g.fillStyle(THEME.platform.underside, 1).fillRoundedRect(r.x, r.y + 4, r.width, r.height, 4);
  g.fillStyle(THEME.platform.body, 1).fillRoundedRect(r.x, r.y, r.width, r.height - 2, 4);
  g.fillStyle(THEME.platform.top, 1).fillRect(r.x + 3, r.y, r.width - 6, 4);
  g.lineStyle(2, THEME.platform.underside, 0.6);
  for (let x = r.x + PLANK_WIDTH; x < r.x + r.width - 8; x += PLANK_WIDTH) {
    g.lineBetween(x, r.y + 5, x, r.y + r.height - 3);
  }
  // Two short ropes hanging below, as if the planks were tied together.
  g.lineStyle(2, THEME.platform.rope, 0.8);
  for (const x of [r.x + 18, r.x + r.width - 18]) g.lineBetween(x, r.y + r.height, x - 3, r.y + r.height + 18);
  return g;
}

/** Where the lanterns hang (their flickering light is drawn by StageLife). */
export function lanternSpots(ground: Rect): { x: number; y: number }[] {
  return LANTERN_SPOTS.map((spot) => ({ x: ground.x + ground.width * spot, y: ground.y - LANTERN.postHeight }));
}

/** Lanterns on posts along the island (LANTERN_SPOTS); their light flickers in StageLife. */
function drawLanterns(scene: Phaser.Scene, ground: Rect): Phaser.GameObjects.Graphics[] {
  const g = scene.add.graphics().setDepth(DEPTH.decor);
  for (const spot of LANTERN_SPOTS) {
    const x = ground.x + ground.width * spot;
    const top = ground.y - LANTERN.postHeight;
    g.fillStyle(THEME.lantern.post, 1).fillRect(x - 3, top, 6, LANTERN.postHeight);
    g.fillStyle(THEME.lantern.body, 1).fillRoundedRect(x - LANTERN.size / 2, top - LANTERN.size / 2, LANTERN.size, LANTERN.size, 4);
    g.fillStyle(THEME.lantern.post, 1).fillRect(x - LANTERN.size / 2 - 2, top - LANTERN.size / 2 - 4, LANTERN.size + 4, 4);
  }
  // The lantern panes glow a little brighter inside.
  for (const spot of LANTERN_SPOTS) {
    const x = ground.x + ground.width * spot;
    const top = ground.y - LANTERN.postHeight;
    g.fillStyle(THEME.lantern.glow, 1).fillRect(x - 3, top - 4, 6, 8);
  }
  return [g];
}
