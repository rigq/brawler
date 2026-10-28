import {
  EMPTY_INPUT,
  INPUT_BUFFER_MAX,
  INPUT_HOLD_MAX_TICKS,
  type InputMessage,
  type PlayerInput,
} from '@brawler/shared';

/**
 * Inputs from one client, waiting to be simulated: one is consumed per server tick.
 * Network jitter makes inputs arrive in bursts; the queue smooths that out.
 */
export class InputQueue {
  private readonly queue: InputMessage[] = [];
  private lastQueuedSeq = -1;
  /** Input used on the last tick; repeated when nothing new has arrived. */
  private current: PlayerInput = { ...EMPTY_INPUT };
  /** Ticks in a row with nothing new from this client. */
  private dryTicks = 0;
  /** Seq of the last input actually simulated (F3.3 sends it back to the client). */
  lastProcessedSeq = -1;

  push(message: InputMessage): void {
    if (message.seq <= this.lastQueuedSeq) return; // duplicate or out of order
    this.lastQueuedSeq = message.seq;
    this.queue.push(message);
    // Too far behind: drop the oldest instead of letting the delay grow.
    while (this.queue.length > INPUT_BUFFER_MAX) this.queue.shift();
  }

  /**
   * The input for this tick. If the queue ran dry (late packet), the last
   * input is held: assuming "still pressing the same" is the best guess.
   * But only briefly: a client that stopped sending (tab in background, lag
   * spike) must not keep its player running off the stage.
   */
  next(): PlayerInput {
    const message = this.queue.shift();
    if (message) {
      this.current = message.input;
      this.lastProcessedSeq = message.seq;
      this.dryTicks = 0;
    } else if (++this.dryTicks > INPUT_HOLD_MAX_TICKS) {
      this.current = { ...EMPTY_INPUT };
    }
    return this.current;
  }

  /** Forget everything (the seat changed hands). */
  reset(): void {
    this.queue.length = 0;
    this.lastQueuedSeq = -1;
    this.lastProcessedSeq = -1;
    this.dryTicks = 0;
    this.current = { ...EMPTY_INPUT };
  }
}
