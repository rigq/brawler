import { STOCKS, characterOf, type CharacterId, type Player } from '@brawler/shared';
import { h } from '../shell/dom.ts';
import { headPortrait } from '../shell/sprites.ts';
import './hud.css';

/** Percent colour: white → yellow → red as damage climbs to DANGER_DAMAGE. */
const DANGER_DAMAGE = 150;
const COLOR_STOPS = [
  [255, 255, 255],
  [255, 214, 64],
  [255, 72, 72],
] as const;
/** A hit of this much damage (or more) shakes the number the most. */
const BIG_HIT_DAMAGE = 20;
const SHAKE_EM = { min: 0.06, max: 0.32 } as const;

interface Card {
  percent: HTMLElement;
  stocks: HTMLElement;
  icons: HTMLElement[];
  shownDamage: number;
  shownStocks: number;
}

/**
 * Each player's card along the bottom of the game: head portrait, name, damage %
 * (it jolts when hit and turns red as it climbs) and lives as little heads.
 * HTML over the canvas (see layer.ts): sharp at any size; only touched when something changes.
 */
export class Hud {
  private readonly root: HTMLElement;
  private readonly cards: Card[];

  constructor(layer: HTMLElement, characters: readonly CharacterId[]) {
    this.cards = characters.map((id) => {
      const percent = h('div', 'hud-card__percent');
      const icons = Array.from({ length: STOCKS }, () => headPortrait(id));
      return { percent, icons, stocks: h('div', 'hud-card__stocks', ...icons), shownDamage: -1, shownStocks: -1 };
    });
    this.root = h(
      'div',
      'hud',
      ...characters.map((id, i) => {
        const card = this.cards[i]!;
        return h(
          'div',
          `hud-card hud-card--p${i + 1}`,
          h('div', 'hud-card__portrait', headPortrait(id)),
          h(
            'div',
            'hud-card__info',
            h('div', 'hud-card__name', h('span', 'hud-card__slot', `P${i + 1}`), characterOf({ characterId: id }).name),
            card.percent,
            card.stocks,
          ),
        );
      }),
    );
    for (const portrait of this.root.querySelectorAll<HTMLElement>('.hud-card__portrait > .head-portrait')) {
      portrait.style.width = portrait.style.height = '100%';
      portrait.style.borderRadius = '50%';
    }
    layer.append(this.root);
  }

  update(players: readonly Player[]): void {
    players.forEach((player, i) => {
      const card = this.cards[i];
      if (card) this.updateCard(card, player);
    });
  }

  destroy(): void {
    this.root.remove();
  }

  private updateCard(card: Card, player: Player): void {
    if (player.stocks !== card.shownStocks) {
      card.shownStocks = player.stocks;
      card.icons.forEach((icon, n) => icon.classList.toggle('is-lost', n >= player.stocks));
    }
    const damage = Math.floor(player.damage);
    if (damage === card.shownDamage && player.stocks > 0) return;
    if (player.stocks === 0) {
      card.percent.textContent = 'OUT';
      card.percent.classList.add('is-out');
      card.shownDamage = damage;
      return;
    }
    if (damage > card.shownDamage && card.shownDamage >= 0) jolt(card.percent, damage - card.shownDamage);
    card.shownDamage = damage;
    card.percent.classList.remove('is-out');
    card.percent.replaceChildren(String(damage), h('small', '', '%'));
    card.percent.style.color = damageColor(damage);
  }
}

/** Restarts the hit animation, stronger for bigger hits. */
function jolt(el: HTMLElement, dealt: number): void {
  const t = Math.min(dealt / BIG_HIT_DAMAGE, 1);
  el.style.setProperty('--shake', `${SHAKE_EM.min + (SHAKE_EM.max - SHAKE_EM.min) * t}em`);
  el.classList.remove('is-hit');
  void el.offsetWidth; // reflow, so the same animation can play again
  el.classList.add('is-hit');
}

function damageColor(damage: number): string {
  const t = Math.min(damage / DANGER_DAMAGE, 1) * (COLOR_STOPS.length - 1);
  const i = Math.min(Math.floor(t), COLOR_STOPS.length - 2);
  const from = COLOR_STOPS[i]!;
  const to = COLOR_STOPS[i + 1]!;
  const mix = (k: number) => Math.round(from[k]! + (to[k]! - from[k]!) * (t - i));
  return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`;
}
