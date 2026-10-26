import { FIXED_DT_MS, MAX_FRAME_MS } from '../constants.ts';

/**
 * Turns variable-length render frames into a whole number of fixed simulation
 * steps. Pure: the caller passes the elapsed time in, so it never reads a clock.
 */
export class FixedStepAccumulator {
  private accumulatorMs = 0;

  /** Adds a frame's elapsed time and returns how many fixed steps to run now. */
  consume(frameMs: number): number {
    this.accumulatorMs += Math.min(Math.max(frameMs, 0), MAX_FRAME_MS);
    const steps = Math.floor(this.accumulatorMs / FIXED_DT_MS);
    this.accumulatorMs -= steps * FIXED_DT_MS;
    return steps;
  }

  /**
   * How far we are between the last step and the next one, from 0 to 1.
   * The renderer uses it to interpolate positions so motion looks smooth.
   */
  get alpha(): number {
    return this.accumulatorMs / FIXED_DT_MS;
  }
}
