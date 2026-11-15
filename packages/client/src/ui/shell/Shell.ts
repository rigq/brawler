import './shell.css';

/** One menu screen: its element and how to stop it (key listeners, timers). */
export interface Screen {
  el: HTMLElement;
  destroy: () => void;
}

/** The full-screen layer that shows one menu screen at a time over the game. */
export class Shell {
  private readonly root: HTMLElement;
  private current: Screen | null = null;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'shell';
    this.root.hidden = true;
    parent.append(this.root);
  }

  /** `over`: the screen sits over a match (pause, lobby), so the side shading of the menus is off. */
  show(screen: Screen, over = false): void {
    this.clear();
    this.current = screen;
    this.root.classList.toggle('shell--over', over);
    this.root.append(screen.el);
    this.root.hidden = false;
  }

  /** True if the screen showing now has this name (the `data-screen` of its element). */
  isShowing(name: string): boolean {
    return !this.root.hidden && this.current?.el.dataset.screen === name;
  }

  /** Removes the screen; the game underneath is visible and playable again. */
  hide(): void {
    this.clear();
    this.root.hidden = true;
  }

  private clear(): void {
    this.current?.destroy();
    this.current?.el.remove();
    this.current = null;
  }
}
