import Phaser from 'phaser';
import type { Rect, StageGeometry } from '@brawler/shared';
import { seededRandom } from './Backdrop.ts';
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

/**
 * Draws the stage with simple shapes: a floating island (the solid ground),
 * wooden plank platforms and a few lanterns. Only the stage geometry from
 * @brawler/shared decides where things are; this is just how it looks.
 */
export function drawStage(scene: Phaser.Scene, stage: StageGeometry): Phaser.GameObjects.GameObject[] {
  const objects: Phaser.GameObjects.GameObject[] = [];
  for (const solid of stage.solids) objects.push(drawIsland(scene, solid), ...drawLanterns(scene, solid));
  for (const platform of stage.platforms) objects.push(drawPlatform(scene, platform));
  return objects;
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

  // Grass strip with a darker lip, slightly overhanging the edges.
  g.fillStyle(THEME.island.grassShadow, 1).fillRoundedRect(r.x - 6, r.y - 2, r.width + 12, GRASS_HEIGHT + 4, 5);
  g.fillStyle(THEME.island.grass, 1).fillRoundedRect(r.x - 6, r.y - 4, r.width + 12, GRASS_HEIGHT, 5);
  return g;
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

/**
 * Lanterns on posts along the island (LANTERN_SPOTS). The glow uses additive
 * blending: it adds light to what is behind instead of painting over it.
 */
function drawLanterns(scene: Phaser.Scene, ground: Rect): Phaser.GameObjects.Graphics[] {
  const glow = scene.add.graphics().setDepth(DEPTH.decor).setBlendMode(Phaser.BlendModes.ADD);
  const g = scene.add.graphics().setDepth(DEPTH.decor);
  for (const spot of LANTERN_SPOTS) {
    const x = ground.x + ground.width * spot;
    const top = ground.y - LANTERN.postHeight;
    for (const [radius, alpha] of [[LANTERN.glowRadius, 0.08], [LANTERN.glowRadius * 0.65, 0.12], [LANTERN.glowRadius * 0.35, 0.18]] as const) {
      glow.fillStyle(THEME.lantern.glow, alpha).fillCircle(x, top, radius);
    }
    g.fillStyle(THEME.lantern.post, 1).fillRect(x - 3, top, 6, LANTERN.postHeight);
    g.fillStyle(THEME.lantern.body, 1).fillRoundedRect(x - LANTERN.size / 2, top - LANTERN.size / 2, LANTERN.size, LANTERN.size, 4);
    g.fillStyle(THEME.lantern.post, 1).fillRect(x - LANTERN.size / 2 - 2, top - LANTERN.size / 2 - 4, LANTERN.size + 4, 4);
  }
  return [glow, g];
}
