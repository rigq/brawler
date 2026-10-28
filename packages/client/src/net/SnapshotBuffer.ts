import {
  FIXED_DT_MS,
  RECONCILE_SNAP_DISTANCE,
  SNAPSHOT_BUFFER_MS,
  SPAWNS,
  copyPlayer,
  createPlayer,
  type Player,
} from '@brawler/shared';

interface Snapshot {
  tick: number;
  /** Full copies, players[slot]. */
  players: Player[];
}

const KEEP_TICKS = SNAPSHOT_BUFFER_MS / FIXED_DT_MS;

/**
 * Recent server states, so other players can be drawn slightly in the past by
 * blending two states that both already arrived, instead of jumping from one
 * state to the next 30 times per second.
 */
export class SnapshotBuffer {
  private readonly snapshots: Snapshot[] = [];

  /** Stores a copy of every player as of `tick` (states must arrive in tick order). */
  push(tick: number, players: ArrayLike<Player>): void {
    const last = this.snapshots.at(-1);
    if (last && tick <= last.tick) return;
    const copies = Array.from(players, (source, slot) => {
      const copy = createPlayer(SPAWNS[slot] ?? SPAWNS[0]);
      copyPlayer(copy, source);
      return copy;
    });
    this.snapshots.push({ tick, players: copies });
    while (this.snapshots.length > 2 && this.snapshots[0]!.tick < tick - KEEP_TICKS) this.snapshots.shift();
  }

  get size(): number {
    return this.snapshots.length;
  }

  /**
   * Writes player `slot` as it was at `renderTick` into `target`: every field
   * from the state just before, and x/y blended towards the state just after.
   * Before the oldest or after the newest state, it holds that state (no guessing ahead).
   */
  sample(renderTick: number, slot: number, target: Player): boolean {
    const [from, to, t] = this.bracket(renderTick);
    const a = from?.players[slot];
    if (!a) return false;
    const b = to?.players[slot] ?? a;

    copyPlayer(target, a);
    const jump = Math.hypot(b.x - a.x, b.y - a.y);
    if (jump > RECONCILE_SNAP_DISTANCE) {
      // A teleport (respawn): blending would draw a streak across the stage.
      if (t >= 0.5) copyPlayer(target, b);
    } else {
      target.x = a.x + (b.x - a.x) * t;
      target.y = a.y + (b.y - a.y) * t;
    }
    // Already at its final drawn position: no extra interpolation by the renderer.
    target.prevX = target.x;
    target.prevY = target.y;
    return true;
  }

  /** The two snapshots around `tick` and how far between them (0–1). */
  private bracket(tick: number): [Snapshot | undefined, Snapshot | undefined, number] {
    const list = this.snapshots;
    const first = list[0];
    const last = list.at(-1);
    if (!first || !last) return [undefined, undefined, 0];
    if (tick <= first.tick) return [first, first, 0];
    if (tick >= last.tick) return [last, last, 0];
    for (let i = list.length - 1; i > 0; i--) {
      const from = list[i - 1]!;
      const to = list[i]!;
      if (from.tick <= tick) return [from, to, (tick - from.tick) / (to.tick - from.tick)];
    }
    return [first, first, 0];
  }
}
