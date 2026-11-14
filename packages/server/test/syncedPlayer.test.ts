import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Encoder, Reflection } from '@colyseus/schema';
import {
  PLAYER_FIELDS,
  PLAYER_PARTS,
  SPAWNS,
  createPlayer,
  readSyncedPlayer,
  writeSyncedPlayer,
  type Player,
  type SyncedPlayer,
} from '@brawler/shared';
import { MatchState, createPlayerState, type PlayerState } from '../src/state/MatchState.ts';

/** Colyseus refuses a schema with 63 fields or more (the index 63 is reserved). */
const SCHEMA_FIELD_LIMIT = 63;

/** A player whose every field differs from a fresh one, so a lost field shows up. */
function busyPlayer(): Player {
  const player = createPlayer(SPAWNS[1]!, 'samu');
  const fields = player as unknown as Record<string, unknown>;
  for (const field of PLAYER_FIELDS) {
    const value = fields[field];
    if (typeof value === 'number') fields[field] = value + 7.25;
    else if (typeof value === 'boolean') fields[field] = !value;
  }
  return player;
}

test('every part of a synced player stays under the schema field limit', () => {
  for (const part of PLAYER_PARTS) assert.ok(part.length < SCHEMA_FIELD_LIMIT);
  assert.equal(PLAYER_PARTS.flat().length, PLAYER_FIELDS.length);
});

test('a player survives the trip server → network → client unchanged', () => {
  const sent = busyPlayer();
  const state = new MatchState();
  const synced = createPlayerState();
  writeSyncedPlayer(synced, sent);
  state.players.push(synced as unknown as PlayerState);

  // What the client SDK does: rebuild the schema from the handshake, then decode.
  const encoder = new Encoder(state);
  const decoder = Reflection.decode(Reflection.encode(encoder));
  decoder.decode(encoder.encodeAll());
  const decodedPlayers = (decoder.state as unknown as { players: ArrayLike<SyncedPlayer> }).players;

  const received = createPlayer(SPAWNS[0]!);
  readSyncedPlayer(received, decodedPlayers[0]!);
  for (const field of PLAYER_FIELDS) assert.deepEqual(received[field], sent[field], `field ${field}`);
});
