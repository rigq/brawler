// Lives: knock-outs, waiting to respawn, reappearing invulnerable, and who wins.

import { BLAST_ZONE, RESPAWN_DELAY_TICKS, RESPAWN_INVULN_TICKS, STOCKS } from '../constants.ts';
import { teleportPlayer, type Player } from './player.ts';

export interface StockState {
  /** Lives left, counting the current one. 0 = out of the match. */
  stocks: number;
  /** > 0 while knocked out and waiting to reappear. */
  respawnTicks: number;
  /** > 0 right after reappearing: cannot be hit. */
  invulnTicks: number;
}

export function createStockState(): StockState {
  return { stocks: STOCKS, respawnTicks: 0, invulnTicks: 0 };
}

/** In play: has lives left and is not waiting to respawn. Only active players move, hit or get hit. */
export function isActive(player: Player): boolean {
  return player.stocks > 0 && player.respawnTicks === 0;
}

/** True once the whole player box has left the death zone. */
export function isOutsideBlastZone(player: Player): boolean {
  return (
    player.x + player.width < BLAST_ZONE.left ||
    player.x > BLAST_ZONE.right ||
    player.y + player.height < BLAST_ZONE.top ||
    player.y > BLAST_ZONE.bottom
  );
}

/** Loses a life. With lives left, starts the wait to reappear; otherwise the player is out. */
export function knockOut(player: Player): void {
  player.stocks -= 1;
  player.respawnTicks = player.stocks > 0 ? RESPAWN_DELAY_TICKS : 0;
}

/** Called every step for an inactive player: counts down and brings it back at its spawn. */
export function advanceRespawn(player: Player, spawn: { x: number; y: number; facing: 1 | -1 }): void {
  if (player.respawnTicks === 0) return;
  player.respawnTicks -= 1;
  if (player.respawnTicks > 0) return;
  teleportPlayer(player, spawn);
  player.invulnTicks = RESPAWN_INVULN_TICKS;
}

export type MatchResult = { over: false } | { over: true; winner: number | null };

/**
 * The match ends when at most one player has lives left. `winner` is that
 * player's index, or null if the last lives were lost on the same tick (draw).
 */
export function matchResult(players: readonly Player[]): MatchResult {
  const alive = players.flatMap((player, i) => (player.stocks > 0 ? [i] : []));
  if (alive.length > 1) return { over: false };
  return { over: true, winner: alive[0] ?? null };
}
