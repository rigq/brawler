import type { Player } from '@brawler/shared';

export interface ComboStats {
  hits: number;
  /** Total damage of the combo, in %. */
  damage: number;
}

/**
 * Counts true combos on one target: a hit extends the combo only if the target
 * was still in hitstun (or frozen in hitstop) when that step started, i.e. it
 * never got a single free tick to escape. Call beforeStep/afterStep around every
 * simulation step, not once per render frame.
 */
export class ComboTracker {
  current: ComboStats = { hits: 0, damage: 0 };
  best: ComboStats = { hits: 0, damage: 0 };
  private damageBefore = 0;
  private stunnedBefore = false;

  beforeStep(target: Player): void {
    this.damageBefore = target.damage;
    this.stunnedBefore = target.hitstunTicks > 0 || target.hitstopTicks > 0;
  }

  afterStep(target: Player): void {
    const dealt = target.damage - this.damageBefore;
    if (dealt <= 0) return;
    const continues = this.stunnedBefore && this.current.hits > 0;
    this.current = continues
      ? { hits: this.current.hits + 1, damage: this.current.damage + dealt }
      : { hits: 1, damage: dealt };
    if (isBetter(this.current, this.best)) this.best = { ...this.current };
  }

  /** True while the target can still be comboed (the current combo is alive). */
  isLive(target: Player): boolean {
    return this.current.hits > 0 && (target.hitstunTicks > 0 || target.hitstopTicks > 0);
  }

  reset(): void {
    this.current = { hits: 0, damage: 0 };
  }
}

/** More hits wins; on equal hits, more damage. */
function isBetter(a: ComboStats, b: ComboStats): boolean {
  return a.hits > b.hits || (a.hits === b.hits && a.damage > b.damage);
}
