import Phaser from 'phaser';
import { Client, type Room } from '@colyseus/sdk';
import {
  FIXED_DT_MS,
  FixedStepAccumulator,
  INPUT_MESSAGE,
  DEFAULT_LINEUP,
  MATCH_ROOM,
  CHARACTER_MESSAGE,
  REMATCH_MESSAGE,
  SERVER_PORT,
  SPAWNS,
  copyProjectile,
  characterOf,
  createPlayer,
  createProjectile,
  createWorld,
  normalizeRoomCode,
  readSyncedPlayer,
  type CharacterId,
  type CreateRoomOptions,
  type JoinOptions,
  type InputMessage,
  type MatchResult,
  type NetMatchState,
  type Player,
  type SyncedPlayer,
} from '@brawler/shared';
import { GamepadInput } from '../input/GamepadInput.ts';
import { CombinedInput, type InputSource } from '../input/InputSource.ts';
import { KeyboardInput, P1_BINDINGS, P2_BINDINGS } from '../input/KeyboardInput.ts';
import { RematchInput } from '../input/RematchInput.ts';
import { fakeLagMs, sendWithLag } from '../net/FakeLag.ts';
import { InterpDelay } from '../net/InterpDelay.ts';
import { Predictor } from '../net/Predictor.ts';
import { ServerClock } from '../net/ServerClock.ts';
import { Smoother } from '../net/Smoother.ts';
import { SnapshotBuffer } from '../net/SnapshotBuffer.ts';
import { preloadArt } from '../render/art.ts';
import { MatchView } from '../render/MatchView.ts';
import type { VisualOffset } from '../render/PlayerView.ts';
import { exposeForDebugging } from './GameScene.ts';
import type { MatchOverHandle, SceneHooks } from './hooks.ts';

/** Who you play and which room: `code` null creates one. `lineup`: both seats' characters (dev URLs). */
export interface OnlineOptions {
  character: CharacterId;
  code: string | null;
  lineup?: CharacterId[];
}

type MatchRoom = Room<unknown, NetMatchState>;
type Connection = 'connecting' | 'connected' | 'reconnecting' | 'closed';

const STATUS_STYLE = { fontFamily: 'monospace', fontSize: '18px', color: '#c9d1e0', lineSpacing: 6 } as const;
const STATUS_POS = { x: 12, y: 34 } as const;

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
  /** Rebuilt with the room's characters when its first state arrives. */
  private mirror = createWorld();
  /** Counts the same fixed 60 Hz ticks as the server, to send one input per tick. */
  private readonly accumulator = new FixedStepAccumulator();
  private readonly predictor = new Predictor();
  private readonly smoother = new Smoother();
  private readonly snapshots = new SnapshotBuffer();
  private readonly clock = new ServerClock();
  private readonly interpDelay = new InterpDelay();
  private readonly lagMs = fakeLagMs();
  private nextSeq = 0;
  /** Server tick of the last state applied, to reconcile once per new state. */
  private lastServerTick = -1;
  private controls!: InputSource;
  /** Created with the first server state, when we know each seat's character. */
  private view: MatchView | null = null;
  private readonly options: OnlineOptions;
  private readonly hooks: SceneHooks;
  private status!: Phaser.GameObjects.Text;
  /** Picked during a match: shown until the next one starts with it. */
  private nextCharacter: CharacterId | null = null;
  /** The victory screen, while it is up. */
  private overHandle: MatchOverHandle | null = null;
  /** The characters the view was drawn for: if the server's differ, it is drawn again. */
  private viewCharacters: CharacterId[] = [];

  constructor(options: OnlineOptions, hooks: SceneHooks = {}) {
    super('OnlineScene');
    this.options = options;
    this.hooks = hooks;
  }

  preload(): void {
    preloadArt(this);
  }

  create(): void {
    this.status = this.add.text(STATUS_POS.x, STATUS_POS.y, '', STATUS_STYLE);
    this.controls = this.createInput();
    if (!this.hooks.onMatchOver) new RematchInput(this, () => this.askRematch());
    // Online nothing pauses: Esc only opens the menu (to leave the room).
    this.input.keyboard?.on('keydown-ESC', () => {
      // The victory screen has the same options as buttons.
      if (this.overHandle) return;
      this.hooks.onPause?.({
        resume: () => {},
        changeCharacter: (character) => this.changeCharacter(character),
        character: this.nextCharacter ?? this.myCharacter(),
      });
    });
    for (const event of [Phaser.Scenes.Events.SHUTDOWN, Phaser.Scenes.Events.DESTROY]) {
      this.events.once(event, () => void this.room?.leave());
    }
    void this.connect();
  }

  update(_time: number, delta: number): void {
    const room = this.room;
    const mySlot = room?.state.seats?.get(room.sessionId);
    if (room) {
      this.applyServerState(room, mySlot);
      if (this.canPlay(room, mySlot)) this.sendAndPredict(room, mySlot, delta);
      this.drawOthers(mySlot, delta);
      this.view?.setResultHint(this.resultHint(room, mySlot));
    }
    this.status.setText(this.statusText(room, mySlot));

    const offsets: (VisualOffset | undefined)[] = [];
    if (mySlot !== undefined) offsets[mySlot] = { x: this.smoother.offsetX, y: this.smoother.offsetY };
    this.view?.render(this.mirror, this.accumulator.alpha, delta, { offsets, result: serverResult(room) });
    this.smoother.decay(delta);
    if (room) this.syncVictory(room, mySlot);
  }

  /** The victory screen comes up once the result shows, follows the rematch votes, and goes when a new match starts. */
  private syncVictory(room: MatchRoom, mySlot: number | undefined): void {
    const over = serverResult(room).over;
    if (over && this.view?.isResultShown && !this.overHandle && this.hooks.onMatchOver) {
      this.overHandle = this.hooks.onMatchOver(this.view.summary(), {
        rematch: () => this.askRematch(),
        changeCharacter: (character) => this.changeCharacter(character),
        character: this.nextCharacter ?? this.myCharacter(),
      });
    }
    this.overHandle?.setStatus(this.victoryStatus(room, mySlot));
    if (!over && this.overHandle) {
      this.overHandle = null;
      this.view?.resetStats();
      this.hooks.onMatchOverEnd?.();
    }
  }

  /** Under the victory screen's buttons: who asked for the rematch, or why the match ended. */
  private victoryStatus(room: MatchRoom, mySlot: number | undefined): string {
    if (room.state.endReason === 'forfeit' || room.state.seats.size < 2) return this.resultHint(room, mySlot);
    const iVoted = mySlot !== undefined && room.state.rematchVotes[mySlot];
    const rivalVoted = Array.from(room.state.rematchVotes).some((vote, slot) => vote && slot !== mySlot);
    if (iVoted) return 'Revancha pedida. Esperando al rival…';
    return rivalVoted ? '¡Tu rival quiere la revancha!' : '';
  }

  // --- Connection ---------------------------------------------------------

  /** Creates a room, or joins the one with the given code, bringing the chosen character. */
  private async connect(): Promise<void> {
    const client = new Client(serverUrl());
    const requested = this.options.code ?? '';
    const join: JoinOptions = { character: this.options.character };
    try {
      let room: MatchRoom;
      if (requested === '') {
        const lineup = this.options.lineup ?? [this.options.character, DEFAULT_LINEUP[1]!];
        const options: CreateRoomOptions & JoinOptions = { ...join, lineup };
        room = await client.create<NetMatchState>(MATCH_ROOM, options);
        showCodeInUrl(room.roomId);
      } else {
        const code = normalizeRoomCode(requested);
        if (!code) return this.fail(`"${requested}" no es un código de sala válido (4 letras).`);
        room = await client.joinById<NetMatchState>(code, join);
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
    // Timed when each state arrives (not at the next frame), so a low frame rate doesn't look like jitter.
    room.onStateChange(() => this.interpDelay.onState(performance.now()));
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
    return mySlot !== undefined && this.view !== null && this.connection === 'connected' && !isPaused(room);
  }

  /**
   * Runs once per new server state: stores it for interpolating others and
   * reconciles your own player (server version + replay of unconfirmed inputs).
   */
  private applyServerState(room: MatchRoom, mySlot: number | undefined): void {
    const { tick, acks } = room.state;
    if (!room.state.players || !acks || tick === this.lastServerTick) return;
    const players = Array.from(room.state.players, toPlayer);
    // Someone changed character (between matches, or a new rival came in): draw the match again.
    if (this.view && players.some((p, i) => p.characterId !== this.viewCharacters[i])) {
      this.view.destroy();
      this.view = null;
      this.snapshots.clear();
      this.buildView(players);
    }
    if (!this.view) {
      // Each player brings their character when joining: wait until both are in to draw them.
      if (room.state.seats.size < SPAWNS.length && room.state.phase === 'waiting') {
        this.hooks.onWaiting?.(room.roomId);
        return;
      }
      this.buildView(players);
      this.hooks.onWaitingEnd?.();
    }
    this.lastServerTick = tick;
    this.mirror.tick = tick;
    // Projectiles come straight from the server (no prediction): only the server decides hits.
    const projectiles = Array.from(room.state.projectiles ?? [], (synced) => {
      const copy = createProjectile();
      copyProjectile(copy, synced);
      return copy;
    });
    this.snapshots.push(tick, players, projectiles);
    this.clock.onServerTick(tick);

    if (mySlot === undefined) return;
    const me = this.mirror.players[mySlot];
    const server = players[mySlot];
    if (me && server) this.reconcileOwn(me, server, acks[mySlot] ?? -1);
  }

  /** The room's characters are known now: mirror and drawing are made for them. */
  private buildView(players: ArrayLike<Player>): void {
    this.viewCharacters = Array.from(players, (player) => player.characterId);
    this.mirror = createWorld(this.viewCharacters);
    this.view = new MatchView(this, this.mirror, '');
    this.view.addUi([this.status]);
    if (import.meta.env.DEV) exposeForDebugging(this.mirror, this.game);
  }

  private reconcileOwn(player: Player, server: Player, ack: number): void {
    const beforeX = player.x;
    const beforeY = player.y;
    this.predictor.reconcile(player, this.mirror, server, ack);
    this.smoother.absorb(beforeX, beforeY, player.x, player.y);
  }

  /**
   * Everyone except you, and every projectile, is shown a little in the past (InterpDelay), blended between
   * two states that already arrived: smooth motion at the cost of a small delay.
   */
  private drawOthers(mySlot: number | undefined, frameMs: number): void {
    this.clock.advance(frameMs);
    const renderTick = this.clock.tick - this.interpDelay.ms / FIXED_DT_MS;
    this.mirror.players.forEach((player, slot) => {
      if (slot !== mySlot) this.snapshots.sample(renderTick, slot, player);
    });
    // Drawn on the same timeline as the rival, so a shot and the rival it hits stay in sync.
    this.mirror.projectiles = this.snapshots.sampleProjectiles(renderTick);
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

  private myCharacter(): CharacterId | undefined {
    const slot = this.room?.state.seats.get(this.room.sessionId);
    return slot === undefined ? undefined : this.mirror.players[slot]?.characterId;
  }

  /** Another character: applied by the server now if no match is running (and that asks for the rematch), else next match. */
  private changeCharacter(character: CharacterId): void {
    const room = this.room;
    if (!room) return;
    room.send(CHARACTER_MESSAGE, { character } satisfies JoinOptions);
    const playing = room.state.phase === 'playing';
    // Mid-match it waits for the next one; otherwise the server applies it now (and a pending one is replaced).
    this.nextCharacter = playing ? character : null;
    if (room.state.phase === 'over') room.send(REMATCH_MESSAGE);
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

    if (room.state.phase === 'waiting' && this.hooks.onWaiting) return ''; // the lobby screen says it
    if (room.state.phase === 'waiting') {
      return `${header}\nEsperando rival… Comparte el código ${code} o este enlace:\n${shareLink(code)}`;
    }
    if (isPaused(room)) return `${header}\nEl rival se ha desconectado. Esperando a que vuelva…`;
    return header + this.nextCharacterLine(mySlot);
  }

  /** "Next match you play X", until it happens. */
  private nextCharacterLine(mySlot: number | undefined): string {
    const next = this.nextCharacter;
    if (!next || mySlot === undefined) return '';
    if (this.mirror.players[mySlot]?.characterId === next) {
      this.nextCharacter = null;
      return '';
    }
    return `\nEn la próxima partida jugarás con ${characterOf({ characterId: next }).name}`;
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
    return rivalVoted ? '¡Tu rival quiere la revancha! Enter, R o Start' : 'Revancha: Enter, R o Start · Personaje o menú: Esc';
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

/** A synced player (split into parts on the network) as a plain Player. */
function toPlayer(synced: SyncedPlayer, slot: number): Player {
  const player = createPlayer(SPAWNS[slot] ?? SPAWNS[0]);
  readSyncedPlayer(player, synced);
  return player;
}

/** Same host as the page (works from another device on the LAN), unless VITE_SERVER_URL says otherwise. */
function serverUrl(): string {
  const configured = import.meta.env.VITE_SERVER_URL as string | undefined;
  return configured ?? `${location.protocol}//${location.hostname}:${SERVER_PORT}`;
}

export function shareLink(code: string): string {
  return `${location.origin}${location.pathname}?online=${code}`;
}

/** After creating a room, the address bar shows the shareable link (keeping other params like lag). */
function showCodeInUrl(code: string): void {
  const url = new URL(location.href);
  url.searchParams.set('online', code);
  history.replaceState(null, '', url);
}
