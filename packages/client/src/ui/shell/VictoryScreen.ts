import { characterOf } from '@brawler/shared';
import type { MatchSummary, PlayerStats } from '../../render/MatchStats.ts';
import { victoryLine } from '../quotes.ts';
import { bladeList, type BladeItem } from './bladeList.ts';
import { h, hint } from './dom.ts';
import { listenMenuKeys, type MenuAction } from './menuInput.ts';
import type { Screen } from './Shell.ts';
import { headPortrait, idleSprite } from './sprites.ts';

/** Screen px per art px of the winner standing on the left. */
const HERO_SCALE = 4;
const PORTRAIT_SIZE = 44;

export interface VictoryOptions {
  rematch: () => void;
  /** Character select (local) or the online pick; missing: no button. */
  pickCharacter?: () => void;
  exit: () => void;
  /** Online: "Salir de la sala" instead of "Salir al menú". */
  online: boolean;
}

/** A screen that can change a line while it is up (online rematch votes). */
export interface VictoryScreen extends Screen {
  setStatus: (text: string) => void;
}

/**
 * End of a match: the winner big with their line, both players' numbers,
 * and what to do next (rematch, change character, leave).
 */
export function victoryScreen(summary: MatchSummary, options: VictoryOptions): VictoryScreen {
  const winner = summary.winner === null ? undefined : summary.players[summary.winner];
  const loser = summary.winner === null ? undefined : summary.players[1 - summary.winner];
  const items: BladeItem[] = [
    { label: 'Revancha', run: options.rematch },
    ...(options.pickCharacter ? [{ label: 'Cambiar personaje', run: options.pickCharacter }] : []),
    { label: options.online ? 'Salir de la sala' : 'Salir al menú', run: options.exit },
  ];
  const list = bladeList(items);
  const status = h('p', 'victory__status');
  const side = summary.winner === 1 ? 'victory--p2' : summary.winner === 0 ? 'victory--p1' : 'victory--draw';

  const hero = winner
    ? h(
        'div',
        'victory__hero',
        h('span', 'kicker', `Gana P${(summary.winner ?? 0) + 1}`),
        h('h1', 'display victory__name', characterOf({ characterId: winner.characterId }).name),
        h('div', 'victory__stage', idleSprite(winner.characterId, HERO_SCALE)),
        h('blockquote', 'victory__quote', `«${victoryLine(winner.characterId, loser?.characterId ?? null)}»`),
      )
    : h('div', 'victory__hero', h('span', 'kicker', 'Nadie se rinde'), h('h1', 'display victory__name', 'Empate'));

  const onAction = (_player: number, action: MenuAction) => {
    if (action === 'up') list.move(-1);
    else if (action === 'down') list.move(1);
    else if (action === 'confirm') list.run();
  };
  const el = h(
    'section',
    `screen overlay victory ${side}`,
    h('div', 'panel victory__panel', hero, h('div', 'victory__side', statsTable(summary.players), list.el, status)),
    h('footer', 'hint-bar', hint(['Ratón'], 'Elegir'), hint(['W', 'S'], 'Moverse'), hint(['Enter'], 'Elegir')),
  );
  el.dataset.screen = 'victory';
  return {
    el,
    destroy: listenMenuKeys(onAction, { attackConfirms: false }),
    setStatus: (text) => {
      if (status.textContent !== text) status.textContent = text;
    },
  };
}

/** Both players side by side: damage dealt, KOs, best hit. */
function statsTable(players: PlayerStats[]): HTMLElement {
  const rows: [string, (p: PlayerStats) => string][] = [
    ['Daño hecho', (p) => `${Math.round(p.damageDealt)} %`],
    ['KOs', (p) => String(p.kos)],
    ['Mayor golpe', (p) => `${Math.round(p.bestHit)} %`],
  ];
  return h(
    'div',
    'victory__stats',
    h('span', ''),
    ...players.map((p, i) => h('span', `victory__who victory__who--p${i + 1}`, headPortrait(p.characterId, PORTRAIT_SIZE), `P${i + 1}`)),
    ...rows.flatMap(([label, value]) => [
      h('span', 'victory__label', label),
      ...players.map((p, i) => h('span', `victory__value victory__value--p${i + 1}`, value(p))),
    ]),
  );
}
