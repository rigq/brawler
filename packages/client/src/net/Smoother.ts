import { RECONCILE_SMOOTH_MS, RECONCILE_SNAP_DISTANCE } from '@brawler/shared';

/**
 * Hides small prediction corrections. When reconciliation moves your player,
 * we keep drawing it where it was (an offset) and fade that offset to zero
 * over a few frames, so a 5 px correction is a glide instead of a jump.
 * Purely visual: the simulation already uses the corrected position.
 */
export class Smoother {
  offsetX = 0;
  offsetY = 0;

  /** Call after a correction moved the player from (fromX, fromY) to (toX, toY). */
  absorb(fromX: number, fromY: number, toX: number, toY: number): void {
    const dx = this.offsetX + fromX - toX;
    const dy = this.offsetY + fromY - toY;
    // Big jumps (respawn, knockback you didn't predict) are real: show them at once.
    if (Math.hypot(dx, dy) > RECONCILE_SNAP_DISTANCE) {
      this.reset();
      return;
    }
    this.offsetX = dx;
    this.offsetY = dy;
  }

  /** Fades the offset; frame-rate independent like the camera smoothing. */
  decay(frameMs: number): void {
    const keep = Math.exp(-frameMs / RECONCILE_SMOOTH_MS);
    this.offsetX *= keep;
    this.offsetY *= keep;
  }

  reset(): void {
    this.offsetX = 0;
    this.offsetY = 0;
  }
}
