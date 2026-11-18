import { CHARACTER_IDS, characterOf, characterStats, type CharacterId } from '@brawler/shared';
import { playSfx } from '../../audio/sfx.ts';
import { CHARACTER_INFO, STAT_LABELS } from '../characterInfo.ts';
import { h, hint } from './dom.ts';
import { listenMenuKeys, type MenuAction } from './menuInput.ts';
import { headPortrait, idleSprite } from './sprites.ts';
import type { Screen } from './Shell.ts';

/**
 * 'versus': P1 and P2 pick at the same time with their own keys.
 * 'training': P1 picks a fighter, then the dummy.
 * 'online': P1 picks; the rival picks on their own screen.
 */
export type SelectMode = 'versus' | 'training' | 'online';

const CARD_PORTRAIT = 72;
const FIGHTER_SCALE = 3;
/** Time the "¡A PELEAR!" banner stays before the match starts. */
const START_DELAY_MS = 900;
const COLUMNS = 2;

interface Seat {
  cursor: number;
  ready: boolean;
  /** Who moves this seat's cursor: a player index, or null (nobody: online rival). */
  controller: number | null;
  label: string;
}

/**
 * Character select for 1–2 players. Calls `onDone` with one character per seat, or `onBack`.
 * `current`: where the cursors start (changing character mid-session starts on the one you had).
 */
export function characterSelect(
  mode: SelectMode,
  chip: string,
  onDone: (lineup: CharacterId[]) => void,
  onBack: () => void,
  current: readonly CharacterId[] = [],
): Screen {
  const startCursor = (i: number) => Math.max(0, CHARACTER_IDS.indexOf(current[i] ?? CHARACTER_IDS[i]!));
  const seats: Seat[] = [
    { cursor: startCursor(0), ready: false, controller: 0, label: 'P1' },
    { cursor: startCursor(1), ready: false, controller: mode === 'versus' ? 1 : null, label: mode === 'training' ? 'Muñeco' : 'P2' },
  ];
  const roster = h('div', 'roster');
  const panels = seats.map((_, i) => h('div', `fighter fighter--p${i + 1}`));
  const body = h('div', 'select__body', panels[0]!, roster, panels[1]!);
  const el = h(
    'section',
    'screen select',
    h('header', 'select__head', h('h1', 'display select__title', 'Elige luchador'), h('span', 'chip', chip)),
    body,
    h('footer', 'hint-bar', ...hints(mode)),
  );
  let startTimer = 0;

  const render = () => {
    roster.replaceChildren(...CHARACTER_IDS.map((id, i) => card(id, i)));
    seats.forEach((seat, i) => panels[i]!.replaceChildren(...panel(seat, i)));
  };

  const card = (id: CharacterId, index: number) => {
    const here = seats.map((seat, i) => (seat.cursor === index && isShown(i) ? i : -1)).filter((i) => i >= 0);
    const button = h(
      'button',
      `card${here.includes(0) ? ' has-p1' : ''}${here.includes(1) ? ' has-p2' : ''}`,
      h('div', 'card__tags', ...here.map((i) => h('span', `tag tag--p${i + 1}`, seats[i]!.label === 'Muñeco' ? 'CPU' : seats[i]!.label))),
      headPortrait(id, CARD_PORTRAIT),
      h('span', 'display card__name', characterOf({ characterId: id }).name),
    );
    button.type = 'button';
    button.addEventListener('click', () => {
      const seat = activeSeatFor(0);
      if (!seat) return;
      seat.cursor = index;
      confirm(seat);
    });
    return button;
  };

  /** Online the rival's panel just waits; in training the dummy appears once P1 is ready. */
  const isShown = (i: number) => i === 0 || mode === 'versus' || (mode === 'training' && seats[0]!.ready);

  const panel = (seat: Seat, i: number): Node[] => {
    if (!isShown(i)) {
      const text = mode === 'online' ? 'Tu rival elige en su pantalla' : 'Elige primero tu luchador';
      panels[i]!.classList.add('is-idle');
      return [h('div', 'display fighter__slot', seat.label), h('div', 'fighter__stage'), h('p', 'fighter__status', text)];
    }
    panels[i]!.classList.remove('is-idle');
    const id = CHARACTER_IDS[seat.cursor]!;
    const info = CHARACTER_INFO[id];
    const stats = characterStats(id);
    return [
      h('div', 'display fighter__slot', seat.label),
      h('div', 'fighter__stage', idleSprite(id, FIGHTER_SCALE), seat.ready ? h('div', 'ready-stamp', '¡Listo!') : null),
      h(
        'div',
        'fighter__info',
        h('div', 'display fighter__name', characterOf({ characterId: id }).name),
        h('p', 'fighter__tagline', info.tagline),
        h('div', 'stats', ...STAT_LABELS.flatMap(([key, label]) => [h('span', '', label), bar(stats[key])])),
        h('p', 'specials', h('b', '', 'Especiales: '), `${info.specials[0]} · ${info.specials[1]} (↑)`),
      ),
    ];
  };

  /** The seat a player is moving now: training hands P1 the dummy once their own pick is in. */
  const activeSeatFor = (player: number): Seat | undefined => {
    const own = seats.filter((seat) => seat.controller === player);
    if (mode === 'training' && player === 0) return seats[0]!.ready ? seats[1] : seats[0];
    return own.find((seat) => !seat.ready) ?? own[0];
  };

  const confirm = (seat: Seat) => {
    seat.ready = true;
    playSfx('menuConfirm');
    if (mode === 'training' && seat === seats[0]) seats[1]!.cursor = seats[0]!.cursor === 1 ? 0 : 1;
    const needed = mode === 'online' ? [seats[0]!] : seats;
    if (needed.every((s) => s.ready)) start();
    render();
  };

  const start = () => {
    body.after(h('div', 'display fight-banner', '¡A pelear!'));
    startTimer = window.setTimeout(() => onDone(seats.map((seat) => CHARACTER_IDS[seat.cursor]!)), START_DELAY_MS);
  };

  const onAction = (player: number, action: MenuAction) => {
    if (startTimer) return;
    const seat = activeSeatFor(player) ?? (mode === 'training' ? seats[0] : undefined);
    if (action === 'back') {
      // Back undoes the last pick; with nothing picked it leaves the screen.
      const undo = [...seats].reverse().find((s) => s.ready && (s.controller === player || (mode === 'training' && player === 0)));
      playSfx('menuBack');
      if (undo) undo.ready = false;
      else if (player === 0) return onBack();
      render();
      return;
    }
    if (!seat || seat.ready) return;
    const n = CHARACTER_IDS.length;
    if (action === 'left') seat.cursor = (seat.cursor - 1 + n) % n;
    else if (action === 'right') seat.cursor = (seat.cursor + 1) % n;
    else if (action === 'up' || action === 'down') seat.cursor = (seat.cursor + COLUMNS) % n;
    else if (action === 'confirm') return confirm(seat);
    playSfx('menuMove');
    render();
  };

  render();
  const stop = listenMenuKeys(onAction);
  return {
    el,
    destroy: () => {
      stop();
      window.clearTimeout(startTimer);
    },
  };
}

function bar(value: number): HTMLElement {
  return h('div', 'stats__bar', ...Array.from({ length: 5 }, (_, i) => h('i', i < value ? 'on' : '')));
}

function hints(mode: SelectMode): HTMLElement[] {
  const p1 = [hint(['A', 'D'], 'P1 elige'), hint(['J'], 'Confirmar'), hint(['L'], 'Deshacer')];
  const p2 = [hint(['←', '→'], 'P2 elige'), hint([','], 'Confirmar'), hint(['-'], 'Deshacer')];
  return [...p1, ...(mode === 'versus' ? p2 : []), hint(['Esc'], 'Volver')];
}
