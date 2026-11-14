// Game server: Colyseus over WebSocket. Node 24 runs this .ts file directly
// (type stripping), no build step.
import { defineRoom, defineServer } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { GAME_TITLE, MATCH_ROOM, SERVER_PORT } from '@brawler/shared';
import { MatchRoom } from './rooms/MatchRoom.ts';

const server = defineServer({
  transport: new WebSocketTransport(),
  rooms: {
    [MATCH_ROOM]: defineRoom(MatchRoom),
  },
});

// Hosting services (Fly.io, Render…) say which port to use through PORT.
const port = Number(process.env.PORT) || SERVER_PORT;
await server.listen(port);
console.log(`[${GAME_TITLE} server] listening on port ${port}`);
