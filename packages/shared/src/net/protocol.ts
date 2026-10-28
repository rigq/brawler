// What client and server agree on over the network. Plain types and helpers only:
// the server implements the state with Colyseus schemas, the client reads it.

import { SPAWNS } from '../constants.ts';
import { EMPTY_INPUT, type PlayerInput } from '../input.ts';
import { createPlayer, type Player } from '../sim/player.ts';

/** Name of the room type every match is played in. */
export const MATCH_ROOM = 'match';

/** Client → server, once per simulation tick: what this player pressed on that tick. */
export const INPUT_MESSAGE = 'input';
export interface InputMessage {
  /** Increases by 1 per tick. Lets the server drop duplicates and acknowledge inputs. */
  seq: number;
  input: PlayerInput;
}

/** Client → server, no payload: "I want a rematch" (only counts once the match is over). */
export const REMATCH_MESSAGE = 'rematch';

/**
 * Room codes are the room id: 4 letters a friend can type. No I, L or O,
 * which are easy to mix up with 1 and 0.
 */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ';
export const ROOM_CODE_LENGTH = 4;

/** Upper-cases a typed code and checks it could be one; null if not. */
export function normalizeRoomCode(raw: string): string | null {
  const code = raw.trim().toUpperCase();
  const valid = code.length === ROOM_CODE_LENGTH && [...code].every((c) => ROOM_CODE_ALPHABET.includes(c));
  return valid ? code : null;
}

/** waiting: fewer than 2 players (free warm-up). playing: the match counts. over: result is up. */
export type MatchPhase = 'waiting' | 'playing' | 'over';
/** Why a match ended: the last life was lost, or the rival left for good. */
export type EndReason = '' | 'ko' | 'forfeit';

/**
 * The synced room state, as the client sees it. `players` mirrors the server's
 * World players exactly (every field), so the client can draw them and
 * re-simulate its own player from them.
 */
export interface NetMatchState {
  /** Server simulation tick. Keeps counting across rematches. */
  tick: number;
  /** players[slot]: same order as World.players. */
  players: ArrayLike<Player>;
  /** Which slot each connected client controls, keyed by session id. */
  seats: ReadonlyMap<string, number>;
  /** acks[slot]: seq of the last input from that slot the server has simulated (-1 = none). */
  acks: ArrayLike<number>;
  phase: MatchPhase;
  /** With phase 'over': winning slot, or -1 for a draw. */
  winner: number;
  endReason: EndReason;
  /** away[slot]: that player dropped and may still reconnect. The match is paused meanwhile. */
  away: ArrayLike<boolean>;
  /** rematchVotes[slot]: that player asked for a rematch. */
  rematchVotes: ArrayLike<boolean>;
}

/** Every Player field, in a fixed order: exactly what gets synced. */
export const PLAYER_FIELDS = Object.keys(createPlayer(SPAWNS[0])) as (keyof Player)[];

/** Copies every Player field from `source` into `target` (plain object or synced schema). */
export function copyPlayer(target: Player, source: Player): void {
  const to = target as unknown as Record<string, unknown>;
  const from = source as unknown as Record<string, unknown>;
  for (const field of PLAYER_FIELDS) to[field] = from[field];
}

/**
 * Turns whatever a client sent into a valid InputMessage, or null.
 * Never trust the network: anything missing or of the wrong type counts as not pressed.
 */
export function parseInputMessage(raw: unknown): InputMessage | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { seq, input } = raw as { seq?: unknown; input?: unknown };
  if (typeof seq !== 'number' || !Number.isSafeInteger(seq) || seq < 0) return null;

  const pressed = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>;
  const clean = { ...EMPTY_INPUT };
  for (const action of Object.keys(clean) as (keyof PlayerInput)[]) clean[action] = pressed[action] === true;
  return { seq, input: clean };
}
