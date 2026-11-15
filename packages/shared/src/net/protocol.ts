// What client and server agree on over the network. Plain types and helpers only:
// the server implements the state with Colyseus schemas, the client reads it.

import { createProjectile, type Projectile } from '../combat/projectiles.ts';
import { SPAWNS } from '../constants.ts';
import { EMPTY_INPUT, type PlayerInput } from '../input.ts';
import { createPlayer, type Player } from '../sim/player.ts';
import { DEFAULT_LINEUP, isCharacterId, type CharacterId } from '../characters/index.ts';

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
/** What the client sends when creating a room. */
export interface CreateRoomOptions {
  /** Character of each seat (P1, P2). Until character select (I2) it comes from ?p1=…&p2=…. */
  lineup?: CharacterId[];
}

/** What each client sends when creating or joining a room: the character it chose. */
export interface JoinOptions {
  character?: CharacterId;
}

/** The character from untrusted join options, or null if missing or unknown. */
export function parseCharacter(raw: unknown): CharacterId | null {
  const id = typeof raw === 'object' && raw !== null ? (raw as { character?: unknown }).character : undefined;
  return typeof id === 'string' && isCharacterId(id) ? id : null;
}

/** The lineup from untrusted room options: unknown or missing seats get the default character. */
export function parseLineup(raw: unknown): CharacterId[] {
  const asked = Array.isArray(raw) ? raw : [];
  return SPAWNS.map((_, slot) => {
    const id: unknown = asked[slot];
    return typeof id === 'string' && isCharacterId(id) ? id : DEFAULT_LINEUP[slot]!;
  });
}

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
  /** players[slot]: same order as World.players, split into parts (readSyncedPlayer). */
  players: ArrayLike<SyncedPlayer>;
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
  /** Every projectile in flight, as World.projectiles. */
  projectiles: ArrayLike<Projectile>;
}

/** Every Projectile field, in a fixed order. */
export const PROJECTILE_FIELDS = Object.keys(createProjectile()) as (keyof Projectile)[];

/** Copies every Projectile field from `source` into `target` (plain object or synced schema). */
export function copyProjectile(target: Projectile, source: Projectile): void {
  const to = target as unknown as Record<string, unknown>;
  const from = source as unknown as Record<string, unknown>;
  for (const field of PROJECTILE_FIELDS) to[field] = from[field];
}

/**
 * Player fields that never travel over the network: where the body was at the
 * start of the last step, only used to smooth the drawing. Each client sets them
 * itself (prediction steps them, the interpolation of other players overwrites them).
 */
const LOCAL_ONLY_FIELDS: readonly (keyof Player)[] = ['prevX', 'prevY'];

/** Every synced Player field, in a fixed order. */
export const PLAYER_FIELDS = (Object.keys(createPlayer(SPAWNS[0])) as (keyof Player)[]).filter(
  (field) => !LOCAL_ONLY_FIELDS.includes(field),
);

/** Copies every synced Player field from `source` into `target` (both plain Players). */
export function copyPlayer(target: Player, source: Player): void {
  const to = target as unknown as Record<string, unknown>;
  const from = source as unknown as Record<string, unknown>;
  for (const field of PLAYER_FIELDS) to[field] = from[field];
}

/**
 * A synced schema can hold at most 63 fields, and a Player has more. So on the
 * network a player travels split into parts (part0, part1…) of at most
 * PLAYER_PART_SIZE fields each. Adding a field to Player just grows the parts.
 */
export const PLAYER_PART_SIZE = 40;

/** PLAYER_FIELDS cut into parts: PLAYER_PARTS[i] are the fields of `part${i}`. */
export const PLAYER_PARTS: readonly (readonly (keyof Player)[])[] = Array.from(
  { length: Math.ceil(PLAYER_FIELDS.length / PLAYER_PART_SIZE) },
  (_, i) => PLAYER_FIELDS.slice(i * PLAYER_PART_SIZE, (i + 1) * PLAYER_PART_SIZE),
);

/** Name of part `index` inside a synced player. */
export function playerPartKey(index: number): string {
  return `part${index}`;
}

/** A player as it travels: { part0: {…fields}, part1: {…fields} }. */
export type SyncedPlayer = Readonly<Record<string, Record<string, unknown> | undefined>>;

/** Server side: spreads a simulated Player over the parts of its synced copy. */
export function writeSyncedPlayer(target: SyncedPlayer, source: Player): void {
  const from = source as unknown as Record<string, unknown>;
  PLAYER_PARTS.forEach((fields, i) => {
    const part = target[playerPartKey(i)];
    if (part) for (const field of fields) part[field] = from[field];
  });
}

/** Client side: gathers the parts of a synced player back into a plain Player. */
export function readSyncedPlayer(target: Player, source: SyncedPlayer): void {
  const to = target as unknown as Record<string, unknown>;
  PLAYER_PARTS.forEach((fields, i) => {
    const part = source[playerPartKey(i)];
    if (part) for (const field of fields) to[field] = part[field];
  });
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
