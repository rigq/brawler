/** `h('div', 'a b', child, 'text')`: an element with classes and children. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  ...children: (Node | string | null | undefined)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  for (const child of children) if (child !== null && child !== undefined) el.append(child);
  return el;
}

/** A keycap, as in the hint bars. */
export function keycap(label: string): HTMLElement {
  return h('kbd', 'keycap', label);
}

/** "[J] Elegir": keycaps followed by what they do. */
export function hint(keys: string[], action: string): HTMLElement {
  return h('span', '', ...keys.map(keycap), action);
}
