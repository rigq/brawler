import type { CharacterId } from '@brawler/shared';
import { CHARACTER_ART } from '../../render/art.ts';
import { IDLE_FRAME_MS } from '../../render/bodyAnimation.ts';
import { CHARACTER_INFO } from '../characterInfo.ts';

const url = (file: string) => `url("${import.meta.env.BASE_URL}${file}")`;
/** CSS keyframes already added to the page, by name. */
const addedKeyframes = new Set<string>();

/**
 * A character's idle animation as a plain HTML element (menus), drawn from the
 * same pixel-art strip as in the game, `scale` screen px per art px. The pace
 * (and Robert's pause between drags) matches the game.
 */
export function idleSprite(id: CharacterId, scale: number): HTMLElement {
  const el = document.createElement('div');
  el.className = 'pixel-sprite';
  const art = CHARACTER_ART[id];
  const sheet = art?.anims?.idle ?? (art ? { ...art.body, frames: 1 } : undefined);
  if (!art || !sheet) return el;
  const frameMs = art.idle?.frameMs ?? IDLE_FRAME_MS;
  const restMs = art.idle?.restMs ?? 0;
  const width = sheet.frameWidth * scale;
  el.style.width = `${width}px`;
  el.style.height = `${sheet.frameHeight * scale}px`;
  el.style.backgroundImage = url(sheet.file);
  el.style.backgroundSize = `${width * sheet.frames}px 100%`;
  if (sheet.frames > 1) {
    const name = keyframes(id, sheet.frames, frameMs, restMs, width);
    el.style.animation = `${name} ${restMs + sheet.frames * frameMs}ms infinite`;
  }
  return el;
}

/**
 * The head of a character's still pose as a square portrait. Sized in CSS
 * (any size: the crop is in percentages), or `size` px if given.
 */
export function headPortrait(id: CharacterId, size?: number): HTMLElement {
  const el = document.createElement('div');
  el.className = 'pixel-sprite head-portrait';
  const art = CHARACTER_ART[id];
  if (!art) return el;
  const { top, height } = CHARACTER_INFO[id].head;
  const { frameWidth, frameHeight, file } = art.body;
  if (size) el.style.width = el.style.height = `${size}px`;
  el.style.backgroundImage = url(file);
  el.style.backgroundSize = `${(frameWidth / height) * 100}% ${(frameHeight / height) * 100}%`;
  el.style.backgroundPosition = `50% ${(top / (frameHeight - height)) * 100}%`;
  return el;
}

/**
 * Steps through the strip frame by frame (no blending between frames), holding
 * the first one for `restMs` first. Built per character because the timing differs.
 */
function keyframes(id: string, frames: number, frameMs: number, restMs: number, frameWidth: number): string {
  const name = `idle-${id}-${frameWidth}`;
  if (addedKeyframes.has(name)) return name;
  const total = restMs + frames * frameMs;
  const steps = Array.from({ length: frames }, (_, i) => {
    const at = i === 0 ? 0 : ((restMs + i * frameMs) / total) * 100;
    return `${at.toFixed(3)}% { background-position-x: ${-i * frameWidth}px; animation-timing-function: step-end; }`;
  });
  const style = document.createElement('style');
  style.textContent = `@keyframes ${name} { ${steps.join(' ')} 100% { background-position-x: 0; } }`;
  document.head.append(style);
  addedKeyframes.add(name);
  return name;
}
