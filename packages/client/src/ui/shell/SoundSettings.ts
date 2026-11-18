import { audio, type Bus } from '../../audio/AudioEngine.ts';
import { playSfx } from '../../audio/sfx.ts';
import { h, hint } from './dom.ts';
import { listenMenuKeys, type MenuAction } from './menuInput.ts';
import type { Screen } from './Shell.ts';

/** A press of A/D (or the arrows) moves the volume this much. */
const KEY_STEP = 0.1;
const ROWS: { bus: Bus; label: string }[] = [
  { bus: 'music', label: 'Música' },
  { bus: 'sfx', label: 'Efectos' },
];

/**
 * Music and effects volume, remembered in this browser. Mouse (drag the bars)
 * or keys: W/S choose, A/D change, Esc goes back. From the main menu or the pause menu.
 */
export function soundSettings(onBack: () => void): Screen {
  let selected = 0;
  const rows = ROWS.map(({ bus, label }, i) => {
    const input = h('input', 'volume__slider');
    Object.assign(input, { type: 'range', min: '0', max: '100', step: '5' });
    const value = h('span', 'volume__value');
    const row = h('label', 'volume', h('span', 'volume__label', label), input, value);
    const show = () => {
      const percent = Math.round(audio.volume(bus) * 100);
      input.value = String(percent);
      value.textContent = `${percent} %`;
    };
    const set = (volume: number) => {
      audio.setVolume(bus, volume);
      show();
      // Hear the new effects volume right away (music is already playing).
      if (bus === 'sfx') playSfx('menuMove');
    };
    input.addEventListener('input', () => set(Number(input.value) / 100));
    row.addEventListener('mouseenter', () => select(i));
    show();
    return { row, nudge: (step: number) => set(audio.volume(bus) + step) };
  });
  const select = (i: number) => {
    selected = i;
    rows.forEach((r, n) => r.row.classList.toggle('is-selected', n === i));
  };
  select(0);

  const back = h('button', 'blade', h('span', 'blade__label', 'Volver'));
  back.type = 'button';
  back.addEventListener('click', onBack);

  const onAction = (_player: number, action: MenuAction) => {
    if (action === 'up' || action === 'down') {
      select((selected + (action === 'up' ? -1 : 1) + rows.length) % rows.length);
      playSfx('menuMove');
    } else if (action === 'left' || action === 'right') rows[selected]!.nudge(action === 'left' ? -KEY_STEP : KEY_STEP);
    else if (action === 'back' || action === 'confirm') onBack();
  };
  const el = h(
    'section',
    'screen overlay',
    h(
      'div',
      'panel',
      h('span', 'kicker', 'Ajustes'),
      h('h2', 'display panel__title', 'Sonido'),
      ...rows.map((r) => r.row),
      back,
      h('footer', 'hint-bar', hint(['W', 'S'], 'Elegir'), hint(['A', 'D'], 'Cambiar'), hint(['Esc'], 'Volver')),
    ),
  );
  return { el, destroy: listenMenuKeys(onAction, { attackConfirms: false }) };
}
