import { COUNTDOWN_TICKS, type World } from '@brawler/shared';
import { h } from '../shell/dom.ts';

/** "¡YA!" stays this long after the countdown ends (ticks). */
const GO_TICKS = 40;
const STEPS = 3;

/** What the countdown shows on this tick of `world`: '3', '2', '1', '¡YA!' or nothing. */
export function countdownLabel(world: World): string {
  if (world.frozenUntil === 0) return '';
  const left = world.frozenUntil - world.tick;
  if (left > 0) return String(Math.ceil(left / (COUNTDOWN_TICKS / STEPS)));
  return left > -GO_TICKS ? '¡YA!' : '';
}

/**
 * The big "3, 2, 1, ¡YA!" in the middle of the screen before a match. HTML over
 * the canvas like the HUD; each new label is a new element, so its pop-in
 * animation plays again.
 */
export class Countdown {
  private readonly root: HTMLElement;
  private shown = '';

  constructor(layer: HTMLElement) {
    this.root = h('div', 'countdown');
    layer.append(this.root);
  }

  update(world: World): void {
    const label = countdownLabel(world);
    if (label === this.shown) return;
    this.shown = label;
    this.root.replaceChildren(label ? h('span', label === '¡YA!' ? 'countdown__go' : 'countdown__num', label) : '');
  }

  destroy(): void {
    this.root.remove();
  }
}
