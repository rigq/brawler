// Synced state, defined with schema() instead of decorators: decorators are not
// "erasable" TypeScript, so Node could not run this file without a build step.
// Colyseus only sends the fields that changed since the last patch.

import { schema, t, type SchemaType } from '@colyseus/schema';
import {
  PLAYER_PARTS,
  PROJECTILE_FIELDS,
  SPAWNS,
  createPlayer,
  createProjectile,
  playerPartKey,
  type SyncedPlayer,
} from '@brawler/shared';

/**
 * One synced field per Player field, generated from a real Player so the two can
 * never drift apart: add a field to Player and it is synced automatically.
 * Numbers are float64 so positions and speeds arrive exactly as simulated.
 */
function schemaFields(template: Record<string, unknown>, fields: readonly string[]) {
  return Object.fromEntries(
    fields.map((field) => {
      const value = template[field];
      if (typeof value === 'number') return [field, t.float64()];
      if (typeof value === 'boolean') return [field, t.boolean()];
      return [field, t.string()];
    }),
  );
}

const playerTemplate = createPlayer(SPAWNS[0]) as unknown as Record<string, unknown>;

/** One schema per part of the player (see PLAYER_PARTS): each stays under the 63-field limit. */
const PlayerPartStates = PLAYER_PARTS.map((fields, i) => schema(schemaFields(playerTemplate, fields), `PlayerPart${i}`));

/** A synced player: { part0, part1… }, each part a schema of up to PLAYER_PART_SIZE fields. */
export const PlayerState = schema(
  Object.fromEntries(PlayerPartStates.map((Part, i) => [playerPartKey(i), Part])),
  'PlayerState',
);

/** A synced player with every part created, ready for writeSyncedPlayer. */
export function createPlayerState(): SyncedPlayer {
  const synced = new PlayerState() as unknown as Record<string, unknown>;
  PlayerPartStates.forEach((Part, i) => {
    synced[playerPartKey(i)] = new Part();
  });
  return synced as SyncedPlayer;
}

/** One synced field per Projectile field, the same way. */
export const ProjectileState = schema(
  schemaFields(createProjectile() as unknown as Record<string, unknown>, PROJECTILE_FIELDS),
  'ProjectileState',
);
export type ProjectileState = SchemaType<typeof ProjectileState>;
export type PlayerState = SchemaType<typeof PlayerState>;

export const MatchState = schema(
  {
    tick: t.uint32(),
    /** players[slot] mirrors World.players[slot]. */
    players: t.array(PlayerState),
    /** Session id → slot of each connected client. */
    seats: t.map('uint8'),
    /** acks[slot]: seq of the last input from that slot already simulated (-1 = none). */
    acks: t.array('float64'),
    /** 'waiting' | 'playing' | 'over' (MatchPhase in @brawler/shared). */
    phase: t.string(),
    /** With phase 'over': winning slot, or -1 for a draw. */
    winner: t.int8(),
    /** '' | 'ko' | 'forfeit' (EndReason in @brawler/shared). */
    endReason: t.string(),
    /** away[slot]: dropped, may still reconnect; the match is paused meanwhile. */
    away: t.array('boolean'),
    /** rematchVotes[slot]: that player asked for a rematch. */
    rematchVotes: t.array('boolean'),
    /** Every projectile in flight (World.projectiles). */
    projectiles: t.array(ProjectileState),
  },
  'MatchState',
);
export type MatchState = SchemaType<typeof MatchState>;
