import { h } from './dom.ts';

export interface BladeItem {
  label: string;
  note?: string;
  run: () => void;
  /** Shown greyed out; can't be chosen. */
  disabled?: boolean;
}

/**
 * A vertical list of slanted buttons with one highlighted. The buttons are made
 * once; moving the selection (mouse or keys) only moves the highlight, so the
 * element under the mouse never changes and clicks always land.
 */
export function bladeList(items: BladeItem[], numbered = false) {
  let selected = 0;
  const buttons = items.map((item, i) => {
    const button = h(
      'button',
      'blade',
      numbered ? h('span', 'blade__index', String(i + 1).padStart(2, '0')) : null,
      h('span', 'blade__label', item.label),
      item.note ? h('span', 'blade__note', item.note) : null,
    );
    button.type = 'button';
    button.disabled = item.disabled ?? false;
    button.addEventListener('mouseenter', () => select(i));
    button.addEventListener('click', () => item.run());
    return button;
  });
  const select = (i: number) => {
    selected = i;
    buttons.forEach((button, n) => button.classList.toggle('is-selected', n === i));
  };
  select(0);
  return {
    el: h('ol', 'menu-list', ...buttons.map((button) => h('li', '', button))),
    move: (step: number) => {
      // Skip greyed-out items.
      let next = selected;
      for (let n = 0; n < items.length; n++) {
        next = (next + step + items.length) % items.length;
        if (!items[next]?.disabled) break;
      }
      select(next);
    },
    /** Nothing highlighted (e.g. while typing a code). */
    clear: () => select(-1),
    run: () => {
      const item = items[selected];
      if (item && !item.disabled) item.run();
    },
  };
}
