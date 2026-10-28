import {
  MAX_PENDING_INPUTS,
  copyPlayer,
  isActive,
  stepPlayer,
  type InputMessage,
  type Player,
  type StageGeometry,
} from '@brawler/shared';

/**
 * Client-side prediction for your own player.
 *
 * Every tick your input is applied locally right away (no waiting for the
 * server) and kept as "pending". When a server state arrives, it says up to
 * which input it has simulated (the ack): we restart from the server's
 * version of the player and replay the inputs it has not seen yet.
 *
 * Only movement is predicted (stepPlayer). Hits, knockback and KOs come from
 * the server: the client never decides whether a hit lands.
 */
export class Predictor {
  private pending: InputMessage[] = [];

  /** Applies a freshly sent input to your player and remembers it for replay. */
  predict(player: Player, stage: StageGeometry, message: InputMessage): void {
    this.pending.push(message);
    if (this.pending.length > MAX_PENDING_INPUTS) this.pending.shift();
    if (isActive(player)) stepPlayer(player, message.input, stage);
  }

  /**
   * Rebuilds your player from the authoritative state: take the server's
   * player, forget inputs it already processed (seq ≤ ack), replay the rest.
   */
  reconcile(player: Player, stage: StageGeometry, serverPlayer: Player, ack: number): void {
    copyPlayer(player, serverPlayer);
    this.pending = this.pending.filter((message) => message.seq > ack);
    for (const message of this.pending) {
      if (isActive(player)) stepPlayer(player, message.input, stage);
    }
  }

  /** Inputs sent but not yet confirmed (shown in the debug HUD). */
  get pendingCount(): number {
    return this.pending.length;
  }

  reset(): void {
    this.pending = [];
  }
}
