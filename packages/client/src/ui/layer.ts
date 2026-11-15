/** Game width the HUD is designed for: 1 em of the layer = 16 px at this width. */
const DESIGN_WIDTH = 1280;
const DESIGN_FONT_PX = 16;

let layer: HTMLElement | null = null;

/**
 * An HTML layer laid exactly over the game canvas, whatever the window size,
 * for HUDs. Its font size follows the canvas width, so anything sized in `em`
 * scales with the game.
 */
export function gameLayer(canvas: HTMLCanvasElement): HTMLElement {
  if (layer) return layer;
  const el = document.createElement('div');
  el.className = 'game-layer';
  Object.assign(el.style, { position: 'fixed', pointerEvents: 'none', zIndex: '5' });
  document.body.append(el);
  const sync = () => {
    const r = canvas.getBoundingClientRect();
    Object.assign(el.style, {
      left: `${r.left}px`,
      top: `${r.top}px`,
      width: `${r.width}px`,
      height: `${r.height}px`,
      fontSize: `${(r.width / DESIGN_WIDTH) * DESIGN_FONT_PX}px`,
    });
  };
  new ResizeObserver(sync).observe(canvas);
  window.addEventListener('resize', sync);
  sync();
  layer = el;
  return el;
}
