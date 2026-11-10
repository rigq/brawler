import Phaser from 'phaser';
import type { Rect } from '@brawler/shared';

/**
 * Turns a Graphics that never changes into a picture, drawn once.
 * In WebGL a Graphics rebuilds every shape on every frame: a sky with a few
 * hundred stars was costing ~10 ms of the 16.7 ms each frame has. `area` is
 * the part of the world the drawing covers; anything outside it is cut off.
 */
export function bake(graphics: Phaser.GameObjects.Graphics, area: Rect): Phaser.GameObjects.RenderTexture {
  const { scene } = graphics;
  const picture = scene.add
    .renderTexture(area.x, area.y, Math.ceil(area.width), Math.ceil(area.height))
    .setOrigin(0, 0)
    .setDepth(graphics.depth)
    .setScrollFactor(graphics.scrollFactorX, graphics.scrollFactorY)
    .setBlendMode(graphics.blendMode);
  // Paint it normally into the picture; the picture itself keeps the blend mode (e.g. additive glow).
  graphics.setBlendMode(Phaser.BlendModes.NORMAL);
  picture.draw(graphics, -area.x, -area.y);
  graphics.destroy();
  return picture;
}
