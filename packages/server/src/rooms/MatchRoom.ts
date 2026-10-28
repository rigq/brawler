import { Room, type Client } from '@colyseus/core';
import {
  FixedStepAccumulator,
  INPUT_MESSAGE,
  MAX_MESSAGES_PER_SECOND,
  PATCH_RATE_HZ,
  RECONNECT_GRACE_SECONDS,
  REMATCH_MESSAGE,
  SPAWNS,
  STOCKS,
  copyPlayer,
  createPlayer,
  createWorld,
  matchResult,
  parseInputMessage,
  stepWorld,
  type EndReason,
  type MatchPhase,
  type Player,
} from '@brawler/shared';
import { InputQueue } from '../net/InputQueue.ts';
import { MatchState, PlayerState } from '../state/MatchState.ts';
import { claimRoomCode, releaseRoomCode } from './roomCodes.ts';

/**
 * One authoritative 1v1 match, joined by its 4-letter code (the room id).
 * The server owns the World: clients only send inputs, the server runs the same
 * simulation as local play (@brawler/shared) at a fixed 60 Hz and sends the
 * resulting state to everyone.
 *
 * Flow: waiting (warm-up, infinite lives) → playing (2 players) → over (result
 * on screen) → playing again once both ask for a rematch.
 * If a player's connection drops, the match pauses and their seat is kept for
 * RECONNECT_GRACE_SECONDS; if they don't come back, the other one wins.
 */
export class MatchRoom extends Room<{ state: MatchState }> {
  maxClients = SPAWNS.length;
  maxMessagesPerSecond = MAX_MESSAGES_PER_SECOND;
  patchRate = 1000 / PATCH_RATE_HZ;
  state = new MatchState();

  private readonly world = createWorld();
  private readonly accumulator = new FixedStepAccumulator();
  /** inputQueues[slot]: one queue per player, empty seats stay idle. */
  private readonly inputQueues = SPAWNS.map(() => new InputQueue());

  onCreate(): void {
    this.roomId = claimRoomCode();
    // Only reachable by code: never handed out to someone looking for any match.
    void this.setPrivate(true);
    for (const player of this.world.players) {
      const synced = new PlayerState();
      copyPlayer(synced as unknown as Player, player);
      this.state.players.push(synced);
      this.state.acks.push(-1);
      this.state.away.push(false);
      this.state.rematchVotes.push(false);
    }
    this.setPhase('waiting');
    this.onMessage(INPUT_MESSAGE, (client, raw) => this.receiveInput(client, raw));
    this.onMessage(REMATCH_MESSAGE, (client) => this.voteRematch(client));
    // Measured wall-clock delta in, whole fixed 60 Hz steps out: same loop as the client.
    this.setTimestep((deltaMs) => this.update(deltaMs));
    this.log('created');
  }

  onDispose(): void {
    releaseRoomCode(this.roomId);
    this.log('closed');
  }

  onJoin(client: Client): void {
    const slot = this.freeSlot();
    this.resetPlayer(slot);
    this.inputQueues[slot]?.reset();
    this.state.seats.set(client.sessionId, slot);
    this.state.away[slot] = false;
    this.state.rematchVotes[slot] = false;
    this.log(`${client.sessionId} joined as P${slot + 1}`);
    if (this.state.seats.size === SPAWNS.length) this.startMatch();
  }

  /** Connection lost without leaving: pause and keep the seat for a while. */
  onDrop(client: Client): void {
    const slot = this.state.seats.get(client.sessionId);
    if (slot === undefined) return;
    this.state.away[slot] = true;
    this.log(`P${slot + 1} dropped, waiting ${RECONNECT_GRACE_SECONDS} s`);
    this.allowReconnection(client, RECONNECT_GRACE_SECONDS);
  }

  onReconnect(client: Client): void {
    const slot = this.state.seats.get(client.sessionId);
    if (slot === undefined) return;
    this.state.away[slot] = false;
    this.log(`P${slot + 1} reconnected`);
  }

  /** Gone for good (left on purpose, or did not reconnect in time). */
  onLeave(client: Client): void {
    const slot = this.state.seats.get(client.sessionId);
    if (slot === undefined) return;
    this.state.seats.delete(client.sessionId);
    this.state.away[slot] = false;
    this.state.rematchVotes[slot] = false;
    this.inputQueues[slot]?.reset();
    this.log(`P${slot + 1} left`);

    if (this.state.phase === 'playing') {
      const remaining = [...this.state.seats.values()][0];
      this.endMatch(remaining ?? -1, 'forfeit');
    }
  }

  private receiveInput(client: Client, raw: unknown): void {
    const slot = this.state.seats.get(client.sessionId);
    const message = parseInputMessage(raw);
    if (slot === undefined || !message) return;
    this.inputQueues[slot]?.push(message);
  }

  private voteRematch(client: Client): void {
    const slot = this.state.seats.get(client.sessionId);
    if (slot === undefined || this.state.phase !== 'over') return;
    this.state.rematchVotes[slot] = true;
    const seated = [...this.state.seats.values()];
    const everyoneAgrees = seated.length === SPAWNS.length && seated.every((s) => this.state.rematchVotes[s]);
    if (everyoneAgrees) this.startMatch();
  }

  private update(deltaMs: number): void {
    const steps = this.accumulator.consume(deltaMs);
    if (steps === 0 || this.isPaused()) return;
    for (let i = 0; i < steps; i++) {
      stepWorld(
        this.world,
        this.inputQueues.map((queue) => queue.next()),
      );
      if (this.state.phase === 'waiting') this.refillLives();
    }
    const result = matchResult(this.world.players);
    if (this.state.phase === 'playing' && result.over) this.endMatch(result.winner ?? -1, 'ko');
    this.syncState();
  }

  /** A playing match freezes while someone is reconnecting, so nobody loses lives meanwhile. */
  private isPaused(): boolean {
    return this.state.phase === 'playing' && Array.from(this.state.away).some(Boolean);
  }

  /** Fresh players, same tick counter (clients rely on it only going up). */
  private startMatch(): void {
    SPAWNS.forEach((_, slot) => {
      this.resetPlayer(slot);
      this.state.rematchVotes[slot] = false;
    });
    this.setPhase('playing');
    this.syncState();
    this.log('match started');
  }

  private endMatch(winner: number, reason: EndReason): void {
    this.setPhase('over', winner, reason);
    this.log(winner < 0 ? `draw (${reason})` : `P${winner + 1} wins (${reason})`);
  }

  private setPhase(phase: MatchPhase, winner = -1, reason: EndReason = ''): void {
    this.state.phase = phase;
    this.state.winner = winner;
    this.state.endReason = reason;
  }

  /** Warm-up has unlimited lives: practice falling off without running out. */
  private refillLives(): void {
    for (const player of this.world.players) player.stocks = STOCKS;
  }

  private resetPlayer(slot: number): void {
    const player = this.world.players[slot];
    const spawn = SPAWNS[slot];
    if (player && spawn) copyPlayer(player, createPlayer(spawn));
  }

  /**
   * Copies the simulated World into the synced state; Colyseus sends only what changed.
   * The acks go with it, so each client knows which of its inputs this state already includes.
   */
  private syncState(): void {
    this.state.tick = this.world.tick;
    this.world.players.forEach((player, slot) => {
      const synced = this.state.players[slot];
      if (synced) copyPlayer(synced as unknown as Player, player);
      this.state.acks[slot] = this.inputQueues[slot]?.lastProcessedSeq ?? -1;
    });
  }

  /** Lowest slot nobody is using, so a player who leaves frees their place. */
  private freeSlot(): number {
    const taken = new Set(this.state.seats.values());
    let slot = 0;
    while (taken.has(slot)) slot += 1;
    return slot;
  }

  private log(message: string): void {
    console.log(`[room ${this.roomId}] ${message}`);
  }
}
