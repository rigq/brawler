/** What a key means in the menus. */
export type MenuAction = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'back';

/** P1's and P2's menu keys: the same as their game controls (move, attack, shield). */
const PLAYER_KEYS: Record<string, MenuAction>[] = [
  { w: 'up', s: 'down', a: 'left', d: 'right', j: 'confirm', ' ': 'confirm', l: 'back' },
  { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', ',': 'confirm', '-': 'back' },
];
/** Keys anyone can use; they count as P1. */
const SHARED_KEYS: Record<string, MenuAction> = { Enter: 'confirm', Escape: 'back' };

/**
 * Listens to the keyboard for a menu screen and reports `(player, action)`.
 * While typing in a text field only Enter and Escape count. Returns a function that stops listening.
 */
export function listenMenuKeys(
  onAction: (player: number, action: MenuAction) => void,
  /** Pause menu: the attack keys must not confirm (J would hit as the match resumes); Enter and the mouse still do. */
  options: { attackConfirms?: boolean } = {},
): () => void {
  const attackConfirms = options.attackConfirms ?? true;
  const onKey = (event: KeyboardEvent) => {
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
    const typing = event.target instanceof HTMLInputElement;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const shared = SHARED_KEYS[key];
    if (shared) {
      event.preventDefault();
      onAction(0, shared);
      return;
    }
    if (typing) return;
    PLAYER_KEYS.forEach((keys, player) => {
      const action = keys[key];
      if (!action || (action === 'confirm' && !attackConfirms)) return;
      event.preventDefault();
      onAction(player, action);
    });
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
