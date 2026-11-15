import { h, hint } from './dom.ts';
import { listenMenuKeys } from './menuInput.ts';
import type { Screen } from './Shell.ts';

/** How long the copy button says "¡Copiado!". */
const COPIED_MS = 1600;

/** Online, after creating a room: the code in big letters, the link to share, and a way out. */
export function lobby(code: string, link: string, onLeave: () => void): Screen {
  const copy = h('button', 'small-button', 'Copiar enlace');
  copy.type = 'button';
  copy.addEventListener('click', () => {
    void navigator.clipboard?.writeText(link).then(() => {
      copy.textContent = '¡Copiado!';
      window.setTimeout(() => (copy.textContent = 'Copiar enlace'), COPIED_MS);
    });
  });
  const leave = h('button', 'blade is-selected', h('span', 'blade__label', 'Salir'));
  leave.type = 'button';
  leave.addEventListener('click', onLeave);
  const el = h(
    'section',
    'screen overlay',
    h(
      'div',
      'panel',
      h('span', 'kicker', 'Sala online'),
      h('div', 'room-code', ...[...code].map((letter) => h('span', '', letter))),
      h('p', 'waiting', 'Esperando rival'),
      h('div', 'link-row', h('code', '', link), copy),
      h('p', 'fighter__tagline', 'Pásale el enlace (por Discord, WhatsApp…) o que escriba el código en Online → Unirse.'),
      leave,
      h('footer', 'hint-bar', hint(['Esc'], 'Salir')),
    ),
  );
  el.dataset.screen = 'lobby';
  return { el, destroy: listenMenuKeys((_p, action) => action === 'back' && onLeave()) };
}
