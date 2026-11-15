import { setControlsPanelOpen } from '../ControlsPanel.ts';
import { h, hint } from './dom.ts';
import { listenMenuKeys, type MenuAction } from './menuInput.ts';
import type { Screen } from './Shell.ts';

export interface PauseOptions {
  /** Online the match keeps going: the title says so instead of "Pausa". */
  online: boolean;
  resume: () => void;
  restart?: () => void;
  exit: () => void;
}

/**
 * Wait before handing control back: the key that chose "Continuar" (J is also
 * attack) is usually released by then, so it does not hit as the game resumes.
 */
const RESUME_DELAY_MS = 120;

/** Esc during a match: continue, restart (local), controls, or back to the menu. */
export function pauseMenu(options: PauseOptions, close: () => void): Screen {
  const resume = () => {
    close();
    window.setTimeout(options.resume, RESUME_DELAY_MS);
  };
  const items: [string, () => void][] = [
    ['Continuar', resume],
    ...(options.restart ? ([['Reiniciar', () => (close(), options.restart!())]] as [string, () => void][]) : []),
    ['Controles', () => setControlsPanelOpen(true)],
    [options.online ? 'Salir de la sala' : 'Salir al menú', options.exit],
  ];
  let selected = 0;
  const list = h('ol', 'menu-list');
  const render = () =>
    list.replaceChildren(
      ...items.map(([label, run], i) => {
        const button = h('button', `blade${i === selected ? ' is-selected' : ''}`, h('span', 'blade__label', label));
        button.type = 'button';
        button.addEventListener('mouseenter', () => ((selected = i), render()));
        button.addEventListener('click', run);
        return h('li', '', button);
      }),
    );
  const onAction = (_player: number, action: MenuAction) => {
    if (action === 'up') selected = (selected - 1 + items.length) % items.length;
    else if (action === 'down') selected = (selected + 1) % items.length;
    else if (action === 'confirm') return items[selected]![1]();
    else if (action === 'back') return resume();
    render();
  };
  render();
  const el = h(
    'section',
    'screen overlay',
    h(
      'div',
      'panel',
      h('span', 'kicker', options.online ? 'La partida sigue' : 'Partida en pausa'),
      h('h2', 'display panel__title', options.online ? 'Menú' : 'Pausa'),
      list,
      h('footer', 'hint-bar', hint(['W', 'S'], 'Moverse'), hint(['J'], 'Elegir'), hint(['Esc'], 'Continuar')),
    ),
  );
  return { el, destroy: listenMenuKeys(onAction) };
}
