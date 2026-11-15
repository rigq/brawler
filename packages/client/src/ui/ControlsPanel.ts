import { CONTROLS_SECTIONS, type ControlsSection } from './controlsContent.ts';
import './controlsPanel.css';

/** The key that opens and closes the panel (not used by any player). */
const TOGGLE_KEY = 'h';
/** Remembers whether the panel was left open (per browser; nothing breaks if storage is blocked). */
const STORAGE_KEY = 'brawler.controlsPanelOpen';
/** Sections shown unfolded the first time the panel opens. */
const OPEN_SECTIONS = new Set(['Botones']);

/**
 * A panel over the game, top right, that explains the controls. It folds into a
 * small tab and unfolds with a click or H; each section folds on its own too.
 * Plain HTML on top of the canvas: crisp text, scrolls, no effect on the game.
 */
/** Opens or closes the panel from elsewhere (the menus' "Controles" option). Set once mounted. */
export let setControlsPanelOpen: (open: boolean) => void = () => {};

export function mountControlsPanel(parent: HTMLElement): void {
  const panel = element('aside', 'controls-panel');
  panel.setAttribute('aria-label', 'Controles');
  const toggle = element('button', 'controls-panel__toggle');
  toggle.type = 'button';
  toggle.setAttribute('aria-controls', 'controls-panel-body');
  toggle.append(text('span', 'controls-panel__title', 'Controles'), text('kbd', '', 'H'), element('span', 'controls-panel__chevron'));
  const body = element('div', 'controls-panel__body');
  body.id = 'controls-panel-body';
  const content = element('div', 'controls-panel__content');
  content.append(...CONTROLS_SECTIONS.map(renderSection));
  body.append(content);
  panel.append(toggle, body);
  parent.append(panel);

  const setOpen = (open: boolean) => {
    panel.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    body.inert = !open;
    save(open);
  };
  setOpen(load());
  setControlsPanelOpen = setOpen;
  keepFocusOnGame(panel);
  toggle.addEventListener('click', () => setOpen(!panel.classList.contains('is-open')));
  window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() !== TOGGLE_KEY || event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
    setOpen(!panel.classList.contains('is-open'));
  });
}

function renderSection(section: ControlsSection): HTMLElement {
  const details = element('details', 'controls-panel__section');
  details.open = OPEN_SECTIONS.has(section.title);
  details.append(text('summary', '', section.title));
  const table = element('table');
  const head = element('tr');
  head.append(...section.columns.map((column) => text('th', '', column)));
  const rows = section.rows.map((cells) => {
    const row = element('tr');
    row.append(...cells.map((cell, i) => text(i === 0 ? 'th' : 'td', '', cell)));
    return row;
  });
  table.append(element('thead'), element('tbody'));
  table.tHead!.append(head);
  table.tBodies[0]!.append(...rows);
  details.append(table);
  if (section.note) details.append(text('p', 'controls-panel__note', section.note));
  return details;
}

/**
 * Clicking the panel must not leave a button focused: Space (jump) would then
 * also press it. The mouse still works; keyboard users toggle with H.
 */
function keepFocusOnGame(panel: HTMLElement): void {
  panel.addEventListener('mousedown', (event) => {
    if ((event.target as HTMLElement).closest('button, summary')) event.preventDefault();
  });
}

function load(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function save(open: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(open));
  } catch {
    // Private mode or blocked storage: the panel just starts closed next time.
  }
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function text<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, value: string): HTMLElementTagNameMap[K] {
  const node = element(tag, className);
  node.textContent = value;
  return node;
}
