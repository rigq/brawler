import { FIXED_DT_MS, SERVER_CLOCK_CORRECTION, SERVER_CLOCK_SNAP_TICKS } from '@brawler/shared';

/**
 * Estimates which tick the server is on right now, as a smooth fractional
 * number. It runs on local time between states and is nudged gently towards
 * every tick the server reports, so uneven packet arrival doesn't make it jump.
 */
export class ServerClock {
  private estimate = 0;
  private started = false;

  get tick(): number {
    return this.estimate;
  }

  /** Called every render frame. */
  advance(frameMs: number): void {
    if (this.started) this.estimate += frameMs / FIXED_DT_MS;
  }

  /** Called when a state for `serverTick` arrives. */
  onServerTick(serverTick: number): void {
    const error = serverTick - this.estimate;
    if (!this.started || Math.abs(error) > SERVER_CLOCK_SNAP_TICKS) {
      this.estimate = serverTick;
      this.started = true;
      return;
    }
    this.estimate += error * SERVER_CLOCK_CORRECTION;
  }
}
