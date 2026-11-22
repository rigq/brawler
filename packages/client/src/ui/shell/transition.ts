/** How long the wipe takes, in and out (must match the CSS animation). */
const WIPE_MS = 700;

/**
 * A slanted band in the game's colours sweeps across the screen: covers what
 * was there, then uncovers what comes next. Purely visual: it never blocks clicks.
 */
export function playWipe(): void {
  document.querySelector('.wipe')?.remove();
  const wipe = document.createElement('div');
  wipe.className = 'wipe';
  wipe.innerHTML = '<span class="wipe__band wipe__band--a"></span><span class="wipe__band wipe__band--b"></span>';
  document.body.append(wipe);
  window.setTimeout(() => wipe.remove(), WIPE_MS + 50);
}
