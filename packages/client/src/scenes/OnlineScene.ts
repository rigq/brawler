import Phaser from 'phaser';
import { Client, type Room } from '@colyseus/sdk';
import {
  FIXED_DT_MS,
  FixedStepAccumulator,
  INPUT_MESSAGE,
  INTERP_DELAY_MS,
  MATCH_ROOM,
  REMATCH_MESSAGE,
  SERVER_PORT,
  createWorld,
  normalizeRoomCode,
  type InputMessage,
  type MatchResult,
  type NetMatchState,
  type Player,
} from '@brawler/shared';
import { GamepadInput } from '../input/GamepadInput.ts';
import { CombinedInput, type InputSource } from '../input/InputSource.ts';
import { KeyboardInput, P1_BINDINGS, P2_BINDINGS } from '../input/KeyboardInput.ts';
import { RematchInput } from '../input/RematchInput.ts';
import { fakeLagMs, sendWithLag } from '../net/FakeLag.ts';
import { Predictor } from '../net/Predictor.ts';
import { ServerClock } from '../net/ServerClock.ts';
import { Smoother } from '../net/Smoother.ts';
import { SnapshotBuffer } from '../net/SnapshotBuffer.ts';
import { MatchView } from '../render/MatchView.ts';
import type { VisualOffset } from '../render/PlayerView.ts';
import { exposeForDebugging } from './GameScene.ts';

type MatchRoom = Room<unknown, NetMatchState>;
type Connection = 'connecting' | 'connected' | 'reconnecting' | 'closed';

const STATUS_STYLE = { fontFamily: 'monospace', fontSize: '18px', color: '#c9d1e0', lineSpacing: 6 } as const;
const STATUS_POS = { x: 12, y: 150 } as const;

/**
 * Online match. `?online` creates a room and shows its 4-letter code;
 * `?online=ABCD` joins that room.
 *
 * The server is the authority; this scene sends your input every tick,
 * predicts your own player locally so it responds instantly, corrects that
 * prediction whenever a server state arrives, and draws other players
 * interpolated about 100 ms in the past so they move smoothly.
 */
export class OnlineScene extends Phaser.Scene {
  private room: MatchRoom | null = null;
  private connection: Connection = 'connecting';
  /** Why we could not get into a room, shown instead of the normal status. */
  private failure = '';
  /** The world as this client sees it: rival interpolated, own player predicted. */
  private readonly mirror = createWorld();
  /** Counts the same fixed 60 Hz ticks as the server, to send one input per tick. */
  private readonly accumulator = new FixedStepAccumulator();
  private readonly predictor = new Predictor();
  private readonly smoother = new Smoother();
  private readonly snapshots = new SnapshotBuffer();
  private readonly clock = new ServerClock();
  private readonly lagMs = fakeLagMs();
  private nextSeq = 0;
  /** Server tick of the last state applied, to reconcile once per new state. */
  private lastServerTick = -1;
  private controls!: InputSource;
  private view!: MatchView;
  private status!: Phaser.GameObjects.Text;

  constructor() {
    super('OnlineScene');
  }

  create(): void {
    this.view = new MatchView(this, this.mirror, '');
    this.status = this.add.text(STATUS_POS.x, STATUS_POS.y, '', STATUS_STYLE);
    this.view.addUi([this.status]);
    this.controls = this.createInput();
    new RematchInput(this, () => this.askRematch());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => void this.room?.leave());
    if (import.meta.env.DEV) exposeForDebugging(this.mirror, this.game);
    void this.connect();
  }

  update(_time: number, delta: number): void {
    const room = this.room;
    const mySlot = room?.state.seats?.get(room.sessionId);
    if (room) {
      this.applyServerState(room, mySlot);
      if (this.canPlay(room, mySlot)) this.sendAndPredict(room, mySlot, delta);
      this.drawOthers(mySlot, delta);
      this.view.setResultHint(this.resultHint(room, mySlot));
    }
    this.status.setText(this.statusText(room, mySlot));

    const offsets: (VisualOffset | undefined)[] = [];
    if (mySlot !== undefined) offsets[mySlot] = { x: this.smoother.offsetX, y: this.smoother.offsetY };
    this.view.render(this.mirror, this.accumulator.alpha, delta, { offsets, result: serverResult(room) });
    this.smoother.decay(delta);
  }

  // --- Connection ---------------------------------------------------------

  /** Creates a room, or joins the one whose code is in the URL. */
  private async connect(): Promise<void> {
    const client = new Client(serverUrl());
    const requested = new URLSearchParams(location.search).get('online') ?? '';
    try {
      let room: MatchRoom;
      if (requested === '') {
        room = await client.create<NetMatchState>(MATCH_ROOM);
        showCodeInUrl(room.roomId);
      } else {
        const code = normalizeRoomCode(requested);
        if (!code) return this.fail(`"${requested}" no es un código de sala válido (4 letras).`);
        room = await client.joinById<NetMatchState>(code);
      }
      this.listen(room);
    } catch (error) {
      console.error(error);
      const what = requested ? `No se pudo entrar en la sala ${requested.toUpperCase()}: no existe o está llena.` : '';
      this.fail(what || `No se pudo conectar a ${serverUrl()}. ¿Está el servidor arrancado? (npm run dev:server)`);
    }
  }

  private listen(room: MatchRoom): void {
    this.room = room;
    this.connection = 'connected';
    // The SDK reconnects on its own after a drop; these only update what we show.
    room.onDrop(() => (this.connection = 'reconnecting'));
    room.onReconnect(() => (this.connection = 'connected'));
    room.onLeave(() => {
      this.room = null;
      this.connection = 'closed';
    });
  }

  private fail(message: string): void {
    this.connection = 'closed';
    this.failure = message;
  }

  // --- Simulation ----------------------------------------------------------

  /** You only send and predict while you are seated, connected and the match isn't paused. */
  private canPlay(room: MatchRoom, mySlot: number | undefined): mySlot is number {
    return mySlot !== undefined && this.connection === 'connected' && !isPaused(room);
  }

  /**
   * Runs once per new server state: stores it for interpolating others and
   * reconciles your own player (server version + replay of unconfirmed inputs).
   */
  private applyServerState(room: MatchRoom, mySlot: number | undefined): void {
    const { players, tick, acks } = room.state;
    if (!players || !acks || tick === this.lastServerTick) return;
    this.lastServerTick = tick;
    this.mirror.tick = tick;
    this.snapshots.push(tick, players);
    this.clock.onServerTick(tick);

    if (mySlot === undefined) return;
    const me = this.mirror.players[mySlot];
    const server = players[mySlot];
    if (me && server) this.reconcileOwn(me, server, acks[mySlot] ?? -1);
  }

  private reconcileOwn(player: Player, server: Player, ack: number): void {
    const beforeX = player.x;
    const beforeY = player.y;
    this.predictor.reconcile(player, this.mirror, server, ack);
    this.smoother.absorb(beforeX, beforeY, player.x, player.y);
  }

  /**
   * Everyone except you is shown INTERP_DELAY_MS in the past, blended between
   * two states that already arrived: smooth motion at the cost of a small delay.
   */
  private drawOthers(mySlot: number | undefined, frameMs: number): void {
    this.clock.advance(frameMs);
    const renderTick = this.clock.tick - INTERP_DELAY_MS / FIXED_DT_MS;
    this.mirror.players.forEach((player, slot) => {
      if (slot !== mySlot) this.snapshots.sample(renderTick, slot, player);
    });
  }

  /** One numbered input per fixed tick: sent to the server and applied locally at once. */
  private sendAndPredict(room: MatchRoom, mySlot: number, frameMs: number): void {
    const input = this.controls.read();
    const steps = this.accumulator.consume(frameMs);
    const me = this.mirror.players[mySlot];
    for (let i = 0; i < steps; i++) {
      const message: InputMessage = { seq: this.nextSeq++, input };
      sendWithLag(this.lagMs, () => room.send(INPUT_MESSAGE, message));
      if (me) this.predictor.predict(me, this.mirror, message);
    }
  }

  private askRematch(): void {
    if (this.room?.state.phase === 'over') this.room.send(REMATCH_MESSAGE);
  }

  // --- Text on screen ------------------------------------------------------

  private statusText(room: MatchRoom | null, mySlot: number | undefined): string {
    if (this.failure) return this.failure;
    if (this.connection === 'connecting') return `Conectando a ${serverUrl()}…`;
    if (this.connection === 'reconnecting') return 'Conexión perdida. Reconectando…';
    if (!room || this.connection === 'closed') return 'Desconectado del servidor. Recarga la página para volver a entrar.';

    const code = room.roomId;
    const you = mySlot === undefined ? 'Entrando…' : `Eres P${mySlot + 1}`;
    const debug = import.meta.env.DEV ? ` · pendientes ${this.predictor.pendingCount}` : '';
    const lag = this.lagMs > 0 ? ` · lag simulado ${this.lagMs} ms` : '';
    const header = `Sala ${code} · ${you}${debug}${lag}`;

    if (room.state.phase === 'waiting') {
      return `${header}\nEsperando rival… Comparte el código ${code} o este enlace:\n${shareLink(code)}\n(Mientras, puedes practicar.)`;
    }
    if (isPaused(room)) return `${header}\nEl rival se ha desconectado. Esperando a que vuelva…`;
    return header;
  }

  /** Line under the result: rematch instructions, votes, or why it ended. */
  private resultHint(room: MatchRoom, mySlot: number | undefined): string {
    const state = room.state;
    if (state.phase !== 'over') return '';
    if (state.seats.size < 2) {
      return `El rival se ha ido. Comparte el código ${room.roomId} para jugar con otra persona.`;
    }
    const iVoted = mySlot !== undefined && state.rematchVotes[mySlot];
    const rivalVoted = Array.from(state.rematchVotes).some((vote, slot) => vote && slot !== mySlot);
    if (iVoted) return 'Revancha pedida. Esperando al rival…';
    return rivalVoted ? '¡Tu rival quiere la revancha! Enter, R o Start' : 'Revancha: Enter, R o Start';
  }

  /** Online you control one player, so both keyboard halves and the first gamepad all work. */
  private createInput(): InputSource {
    const keyboard = this.input.keyboard!;
    const sources: InputSource[] = [new KeyboardInput(keyboard, P1_BINDINGS), new KeyboardInput(keyboard, P2_BINDINGS)];
    if (this.input.gamepad) sources.push(new GamepadInput(this.input.gamepad, 0));
    return new CombinedInput(sources);
  }
}

/** A playing match freezes on the server while someone is reconnecting. */
function isPaused(room: MatchRoom): boolean {
  return room.state.phase === 'playing' && Array.from(room.state.away ?? []).some(Boolean);
}

/** Online the result comes from the server (it also knows about forfeits). */
function serverResult(room: MatchRoom | null): MatchResult {
  if (!room || room.state.phase !== 'over') return { over: false };
  const winner = room.state.winner;
  return { over: true, winner: winner < 0 ? null : winner };
}

/** Same host as the page (works from another device on the LAN), unless VITE_SERVER_URL says otherwise. */
function serverUrl(): string {
  const configured = import.meta.env.VITE_SERVER_URL as string | undefined;
  return configured ?? `${location.protocol}//${location.hostname}:${SERVER_PORT}`;
}

function shareLink(code: string): string {
  return `${location.origin}${location.pathname}?online=${code}`;
}

/** After creating a room, the address bar shows the shareable link (keeping other params like lag). */
function showCodeInUrl(code: string): void {
  const url = new URL(location.href);
  url.searchParams.set('online', code);
  history.replaceState(null, '', url);
}
