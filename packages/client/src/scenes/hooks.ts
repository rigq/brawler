import type { CharacterId } from '@brawler/shared';

/** What the pause menu can do to the match that opened it. */
export interface PauseActions {
  resume: () => void;
  /** Local matches only: start again with the same characters. */
  restart?: () => void;
  /**
   * Online only: play another character (from the next match if one is being
   * played). Local matches change character by going back to character select.
   */
  changeCharacter?: (character: CharacterId) => void;
  /** Online: the character you play now (where character select starts). */
  character?: CharacterId;
}

/**
 * How a match scene talks to the menus around it (app/App.ts). All optional:
 * started on its own (dev URLs), a scene still plays, just without menus.
 */
export interface SceneHooks {
  /** Esc was pressed: show the pause menu. */
  onPause?: (actions: PauseActions) => void;
  /** Online: the room exists and is waiting for the rival. */
  onWaiting?: (code: string) => void;
  /** Online: the rival is in, the match view is up. */
  onWaitingEnd?: () => void;
}
