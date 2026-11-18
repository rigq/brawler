import { INTERP_ADAPT_RATE, INTERP_DELAY_MS, INTERP_JITTER_MARGIN } from '@brawler/shared';

/**
 * How far in the past to draw other players, adapted to the connection.
 * It watches when server states arrive: the average gap between them and how
 * much that gap varies (jitter). The delay must cover the gap plus a margin of
 * jitter, so there is always a state on each side of the moment drawn; anything
 * more only makes the rival lag behind. On a LAN this ends near the minimum;
 * on a bumpy connection it grows.
 */
export class InterpDelay {
  private lastArrivalMs: number | null = null;
  private meanGapMs: number = INTERP_DELAY_MS.min;
  private jitterMs = 0;
  private current: number = INTERP_DELAY_MS.start;

  get ms(): number {
    return this.current;
  }

  /** Call when a new server state arrives, with the local time (performance.now()). */
  onState(nowMs: number): void {
    if (this.lastArrivalMs !== null) {
      const gap = nowMs - this.lastArrivalMs;
      this.jitterMs += (Math.abs(gap - this.meanGapMs) - this.jitterMs) * INTERP_ADAPT_RATE;
      this.meanGapMs += (gap - this.meanGapMs) * INTERP_ADAPT_RATE;
    }
    this.lastArrivalMs = nowMs;
    const target = this.meanGapMs + INTERP_JITTER_MARGIN * this.jitterMs;
    const clamped = Math.min(Math.max(target, INTERP_DELAY_MS.min), INTERP_DELAY_MS.max);
    this.current += (clamped - this.current) * INTERP_ADAPT_RATE;
  }
}
