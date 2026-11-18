import { setControlsPanelOpen } from '../ControlsPanel.ts';
import { bladeList } from './bladeList.ts';
import { h, hint } from './dom.ts';
import { listenMenuKeys, type MenuAction } from './menuInput.ts';
import type { Screen } from './Shell.ts';

export interface PauseOptions {
  /** Online the match keeps going: the title says so instead of "Pausa". */
  online: boolean;
  resume: () => void;
  restart?: () => void;
  /** Opens character select (local: a new match with the picks; online: from the next match). */
  pickCharacter?: () => void;
  /** Opens the volume settings. */
  sound?: () => void;
  exit: () => void;
}

/** A moment before handing control back, so the click or key that chose "Continuar" is not read by the game. */
const RESUME_DELAY_MS = 120;

/** Esc during a match: continue, restart (local), change character, controls, or back to the menu. Mouse, or W/S + Enter (not J: it is attack). */
export function pauseMenu(options: PauseOptions, close: () => void): Screen {
  const resume = () => {
    close();
    window.setTimeout(options.resume, RESUME_DELAY_MS);
  };
  const list = bladeList([
    { label: 'Continuar', run: resume },
    ...(options.restart ? [{ label: 'Reiniciar', run: () => (close(), options.restart!()) }] : []),
    ...(options.pickCharacter ? [{ label: 'Cambiar personaje', run: options.pickCharacter }] : []),
    { label: 'Controles', run: () => setControlsPanelOpen(true) },
    ...(options.sound ? [{ label: 'Sonido', run: options.sound }] : []),
    { label: options.online ? 'Salir de la sala' : 'Salir al menú', run: options.exit },
  ]);
  const onAction = (_player: number, action: MenuAction) => {
    if (action === 'up') list.move(-1);
    else if (action === 'down') list.move(1);
    else if (action === 'confirm') list.run();
    else if (action === 'back') resume();
  };
  const el = h(
    'section',
    'screen overlay',
    h(
      'div',
      'panel',
      h('span', 'kicker', options.online ? 'La partida sigue' : 'Partida en pausa'),
      h('h2', 'display panel__title', options.online ? 'Menú' : 'Pausa'),
      list.el,
      h('footer', 'hint-bar', hint(['Ratón'], 'Elegir'), hint(['W', 'S'], 'Moverse'), hint(['Enter'], 'Elegir'), hint(['Esc'], 'Continuar')),
    ),
  );
  return { el, destroy: listenMenuKeys(onAction, { attackConfirms: false }) };
}
