import { isActive, type CharacterId, type World } from '@brawler/shared';

export interface PlayerStats {
  characterId: CharacterId;
  /** % dealt to the rival. */
  damageDealt: number;
  kos: number;
  /** The strongest single hit landed (%). */
  bestHit: number;
}

/** How a match went, for the victory screen. */
export interface MatchSummary {
  /** Slot of the winner, or null for a draw. */
  winner: number | null;
  players: PlayerStats[];
}

/**
 * Counts damage, KOs and the best hit by watching the World frame to frame
 * (like HitEffects), so it works the same locally and online. In a 1v1 every
 * hit on one player is the other's.
 */
export class MatchStats {
  private stats: PlayerStats[] = [];
  private lastDamage: number[] = [];
  private lastStocks: number[] = [];

  update(world: World): void {
    if (this.stats.length !== world.players.length) this.reset(world);
    world.players.forEach((player, i) => {
      const other = this.stats[1 - i];
      const dealt = player.damage - (this.lastDamage[i] ?? player.damage);
      if (other && dealt > 0 && player.hitFlashTicks > 0 && isActive(player)) {
        other.damageDealt += dealt;
        other.bestHit = Math.max(other.bestHit, dealt);
      }
      if (other && player.stocks < (this.lastStocks[i] ?? player.stocks)) other.kos += 1;
      this.lastDamage[i] = player.damage;
      this.lastStocks[i] = player.stocks;
    });
  }

  /** A new match (rematch): counts start again. */
  reset(world: World): void {
    this.stats = world.players.map((p) => ({ characterId: p.characterId, damageDealt: 0, kos: 0, bestHit: 0 }));
    this.lastDamage = world.players.map((p) => p.damage);
    this.lastStocks = world.players.map((p) => p.stocks);
  }

  summary(winner: number | null): MatchSummary {
    return { winner, players: this.stats.map((s) => ({ ...s })) };
  }
}
