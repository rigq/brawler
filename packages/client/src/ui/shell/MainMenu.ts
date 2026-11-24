import { CHARACTER_IDS, GAME_TITLE, characterOf, normalizeRoomCode } from '@brawler/shared';
import { setControlsPanelOpen } from '../ControlsPanel.ts';
import { bladeList, type BladeItem } from './bladeList.ts';
import { h, hint } from './dom.ts';
import { listenMenuKeys, type MenuAction } from './menuInput.ts';
import { idleSprite } from './sprites.ts';
import type { Screen } from './Shell.ts';

/** What the player picked in the main menu. */
export type MenuChoice = { mode: 'versus' } | { mode: 'training' } | { mode: 'online'; code: string | null };

/** Scale of the fighters lined up on the right (screen px per art px). */
const SHOWCASE_SCALE = 3;

/**
 * The title screen: Local / Entrenamiento / Online / Controles / Sonido, keyboard (both
 * players' keys) or mouse. Online opens a second list (create or join with a code).
 */
export function mainMenu(onChoose: (choice: MenuChoice) => void, onSound: () => void): Screen {
  const nav = h('nav');
  const extra = h('div');
  let list = bladeList([]);
  let back: (() => void) | null = null;

  const show = (items: BladeItem[], onBack: (() => void) | null) => {
    list = bladeList(items, true);
    back = onBack;
    extra.replaceChildren();
    nav.replaceChildren(list.el, extra);
  };

  const showMain = () =>
    show(
      [
        { label: 'Local', note: '2 jugadores, un teclado', run: () => onChoose({ mode: 'versus' }) },
        { label: 'Entrenamiento', note: 'contra la CPU', run: () => onChoose({ mode: 'training' }) },
        { label: 'Online', note: 'con un código de sala', run: showOnline },
        { label: 'Controles', note: 'tecla H', run: () => setControlsPanelOpen(true) },
        { label: 'Sonido', note: 'música y efectos', run: onSound },
      ],
      null,
    );
  const showOnline = () =>
    show(
      [
        { label: 'Crear sala', note: 'y pasa el enlace', run: () => onChoose({ mode: 'online', code: null }) },
        { label: 'Unirse', note: 'con el código de 4 letras', run: showJoin },
        { label: 'Volver', note: '', run: showMain },
      ],
      showMain,
    );
  const showJoin = () => {
    show([{ label: 'Volver', note: '', run: showOnline }], showOnline);
    list.clear();
    extra.replaceChildren(codeEntry((code) => onChoose({ mode: 'online', code })));
  };

  const onAction = (_player: number, action: MenuAction) => {
    if (action === 'up') list.move(-1);
    else if (action === 'down') list.move(1);
    else if (action === 'confirm' && !(document.activeElement instanceof HTMLInputElement)) list.run();
    else if (action === 'back') back?.();
  };

  showMain();
  const el = h(
    'section',
    'screen main-menu',
    h(
      'div',
      'main-menu__left',
      h('div', 'title', h('span', 'kicker', 'Lucha 1v1 · local u online'), h('span', 'display title__word', GAME_TITLE), h('span', 'title__rule')),
      nav,
    ),
    showcase(),
    h('footer', 'hint-bar', hint(['W', 'S'], 'Moverse'), hint(['J', 'Enter'], 'Elegir'), hint(['Esc'], 'Volver'), hint(['H'], 'Controles')),
  );
  return { el, destroy: listenMenuKeys(onAction) };
}

/** The four fighters doing their idle, standing in a row. */
function showcase(): HTMLElement {
  return h(
    'div',
    'roster-show',
    ...CHARACTER_IDS.map((id) =>
      h('div', 'roster-show__fighter', idleSprite(id, SHOWCASE_SCALE), h('span', 'display', characterOf({ characterId: id }).name)),
    ),
  );
}

/** Text field for a room code; Enter joins if the code is valid. */
function codeEntry(onJoin: (code: string) => void): HTMLElement {
  const input = h('input', 'code-entry__input');
  input.maxLength = 4;
  input.placeholder = 'ABCD';
  input.autocomplete = 'off';
  input.spellcheck = false;
  const error = h('div', 'code-entry__error');
  const join = () => {
    const code = normalizeRoomCode(input.value);
    if (code) onJoin(code);
    else error.textContent = 'El código son 4 letras (sin I, L ni O).';
  };
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') join();
  });
  const button = h('button', 'small-button', 'Entrar');
  button.type = 'button';
  button.addEventListener('click', join);
  queueMicrotask(() => input.focus());
  return h('div', 'code-entry', h('span', 'kicker', 'Código de sala'), h('div', 'link-row', input, button), error);
}
