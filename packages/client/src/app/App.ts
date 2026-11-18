import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH, type CharacterId } from '@brawler/shared';
import { THEME } from '../render/palette.ts';
import { BackdropScene } from '../scenes/BackdropScene.ts';
import { GameScene, type LocalMode } from '../scenes/GameScene.ts';
import type { PauseActions, SceneHooks } from '../scenes/hooks.ts';
import { OnlineScene, shareLink, type OnlineOptions } from '../scenes/OnlineScene.ts';
import { characterSelect, type SelectMode } from '../ui/shell/CharacterSelect.ts';
import { lobby } from '../ui/shell/Lobby.ts';
import { mainMenu, type MenuChoice } from '../ui/shell/MainMenu.ts';
import { pauseMenu } from '../ui/shell/PauseMenu.ts';
import { Shell } from '../ui/shell/Shell.ts';

const BACKDROP = 'BackdropScene';

/**
 * The whole app as a small state machine of screens:
 * main menu → character select → match (→ pause / online lobby) → back to the menu.
 * Menus are HTML (Shell); matches are Phaser scenes, added when they start and
 * removed when you leave, so each match starts clean.
 */
export class App {
  private readonly game: Phaser.Game;
  private readonly shell = new Shell(document.body);
  /** Key of the match scene running now, if any. */
  private matchKey: string | null = null;

  constructor() {
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game',
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
      backgroundColor: THEME.canvas,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      input: { gamepad: true },
      scene: [BackdropScene],
    });
  }

  showMenu(): void {
    this.shell.show(mainMenu((choice) => this.onMenuChoice(choice)));
  }

  /** Straight to character select for a room code (someone shared a link). */
  joinFromLink(code: string): void {
    this.showSelect('online', `Online · sala ${code}`, ([mine]) => this.startOnline({ character: mine!, code }));
  }

  startLocal(mode: LocalMode, lineup: CharacterId[]): void {
    this.startMatch('GameScene', new GameScene(mode, lineup, this.hooks({ online: false, mode, lineup })), true);
  }

  startOnline(options: OnlineOptions): void {
    // The stage stays behind the lobby until the rival arrives and the match is drawn.
    this.startMatch('OnlineScene', new OnlineScene(options, this.hooks({ online: true })), false);
  }

  private onMenuChoice(choice: MenuChoice): void {
    if (choice.mode === 'online') {
      const chip = choice.code ? `Online · sala ${choice.code}` : 'Online · crear sala';
      this.showSelect('online', chip, ([mine]) => this.startOnline({ character: mine!, code: choice.code }));
      return;
    }
    const chip = choice.mode === 'versus' ? 'Local · 2 jugadores' : 'Entrenamiento';
    this.showSelect(choice.mode, chip, (lineup) => this.startLocal(choice.mode, lineup));
  }

  private showSelect(mode: SelectMode, chip: string, onDone: (lineup: CharacterId[]) => void): void {
    this.shell.show(characterSelect(mode, chip, onDone, () => this.showMenu()));
  }

  private startMatch(key: string, scene: Phaser.Scene, hideBackdrop: boolean): void {
    this.stopMatch();
    this.shell.hide();
    if (hideBackdrop) this.game.scene.sleep(BACKDROP);
    this.game.scene.add(key, scene, true);
    this.matchKey = key;
  }

  private stopMatch(): void {
    if (!this.matchKey) return;
    this.game.scene.remove(this.matchKey);
    this.matchKey = null;
    // Phaser keeps blocking the game keys (W, A, S, D, J…) after the scene is gone:
    // let them go, or they can't be typed in the menus (the room code field).
    this.game.input.keyboard?.clearCaptures();
  }

  private exitToMenu(): void {
    this.stopMatch();
    this.game.scene.wake(BACKDROP);
    // Drop ?online=CODE and friends: reloading now shows the menu.
    history.replaceState(null, '', location.pathname);
    this.showMenu();
  }

  /** Local: back to character select; the picks start a new match. */
  private pickLocalCharacters(mode: LocalMode, lineup: CharacterId[]): void {
    this.stopMatch();
    this.game.scene.wake(BACKDROP);
    const chip = mode === 'versus' ? 'Local · 2 jugadores' : 'Entrenamiento';
    this.shell.show(characterSelect(mode, chip, (picks) => this.startLocal(mode, picks), () => this.exitToMenu(), lineup));
  }

  /** Online: the room keeps going behind; the pick applies now if no match is running, else from the next one. */
  private pickOnlineCharacter(actions: PauseActions): (() => void) | undefined {
    const change = actions.changeCharacter;
    if (!change) return undefined;
    return () =>
      this.shell.show(
        characterSelect(
          'online',
          'Online · cambiar personaje',
          ([mine]) => {
            this.shell.hide();
            change(mine!);
          },
          () => this.shell.hide(),
          actions.character ? [actions.character] : [],
        ),
        true,
      );
  }

  /** What match scenes call: the pause menu, and the online lobby. */
  private hooks(match: { online: true } | { online: false; mode: LocalMode; lineup: CharacterId[] }): SceneHooks {
    const { online } = match;
    return {
      onPause: (actions: PauseActions) =>
        this.shell.show(
          pauseMenu(
            {
              ...actions,
              online,
              pickCharacter: match.online ? this.pickOnlineCharacter(actions) : () => this.pickLocalCharacters(match.mode, match.lineup),
              exit: () => this.exitToMenu(),
            },
            () => this.shell.hide(),
          ),
          true,
        ),
      onWaiting: (code) => {
        if (!this.shell.isShowing('lobby')) this.shell.show(lobby(code, shareLink(code), () => this.exitToMenu()), true);
      },
      onWaitingEnd: () => {
        this.game.scene.sleep(BACKDROP);
        if (this.shell.isShowing('lobby')) this.shell.hide();
      },
    };
  }
}
