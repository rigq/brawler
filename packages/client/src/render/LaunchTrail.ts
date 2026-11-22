import Phaser from 'phaser';
import { TRAIL_INTERVAL_MS, TRAIL_LIFE_MS, TRAIL_MIN_SPEED, isActive, type Player } from '@brawler/shared';

const START_ALPHA = 0.45;
/** Afterimages sit just behind the player. */
const DEPTH = -1;

interface Ghost {
  object: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
  ageMs: number;
}

/**
 * Afterimages while a player flies off from a hit: copies of their own sprite
 * (the exact frame), filled with their colour and fading out. Render only.
 */
export class LaunchTrail {
  private readonly scene: Phaser.Scene;
  private readonly color: number;
  private readonly onCreate: (object: Phaser.GameObjects.GameObject) => void;
  private ghosts: Ghost[] = [];
  private sinceGhostMs = TRAIL_INTERVAL_MS;

  constructor(scene: Phaser.Scene, color: number, onCreate: (object: Phaser.GameObjects.GameObject) => void) {
    this.scene = scene;
    this.color = color;
    this.onCreate = onCreate;
  }

  /** `body`: the sprite drawn this frame (null for characters without art: a box instead). */
  update(player: Player, body: Phaser.GameObjects.Sprite | null, x: number, y: number, frameMs: number): void {
    this.age(frameMs);
    const flying = isActive(player) && player.hitstunTicks > 0 && player.hitstopTicks === 0;
    const fast = player.vx * player.vx + player.vy * player.vy > TRAIL_MIN_SPEED * TRAIL_MIN_SPEED;
    if (!flying || !fast) {
      this.sinceGhostMs = TRAIL_INTERVAL_MS; // the first one appears at once next time
      return;
    }
    this.sinceGhostMs += frameMs;
    if (this.sinceGhostMs < TRAIL_INTERVAL_MS) return;
    this.sinceGhostMs = 0;
    const object = body
      ? this.scene.add
          .sprite(body.x, body.y, body.texture.key, body.frame.name)
          .setOrigin(body.originX, body.originY)
          .setFlipX(body.flipX)
          .setTintFill(this.color)
      : this.scene.add.rectangle(x, y, player.width, player.height, this.color).setOrigin(0, 0);
    object.setDepth(DEPTH).setAlpha(START_ALPHA);
    this.onCreate(object);
    this.ghosts.push({ object, ageMs: 0 });
  }

  destroy(): void {
    for (const g of this.ghosts) g.object.destroy();
    this.ghosts = [];
  }

  private age(frameMs: number): void {
    for (const g of this.ghosts) {
      g.ageMs += frameMs;
      g.object.setAlpha(START_ALPHA * Math.max(0, 1 - g.ageMs / TRAIL_LIFE_MS));
      if (g.ageMs >= TRAIL_LIFE_MS) g.object.destroy();
    }
    this.ghosts = this.ghosts.filter((g) => g.object.active);
  }
}
