// Hitboxes from the art: each attack hits where its animation draws the fist,
// foot or swing, not in an invisible box around it (19 nov playtest: "they hit
// with imaginary lines").
//
//   node tools/hitboxes.ts
//
// For every character and normal attack it takes the strike frame (the one
// shown while the hitbox is out), finds the pixels that stick out of the body
// near where the written box was, and writes their outline (plus a small margin)
// to packages/shared/src/characters/artHitboxes.ts. Run it again after
// replacing an attack's strip. It prints old and new boxes so the change is visible.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CHARACTER_IDS, writtenCharacter, type CharacterId } from '../packages/shared/src/characters/index.ts';
import type { AttackId } from '../packages/shared/src/constants.ts';
import { ATTACK_ANIM, hitFrame, resolveAnim, type AnimName } from '../packages/client/src/render/bodyAnimation.ts';
import { readPng, type Rgba } from './png.ts';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(ROOT, 'packages/shared/src/characters/artHitboxes.ts');

/** Punches, kicks and heavies. Grabs keep their written reach; throws and specials have no hitbox of this kind. */
const ATTACKS: AttackId[] = [
  'jab1', 'jab2', 'jab3', 'lightSide', 'lightUp', 'lightDown',
  'airNeutral', 'airForward', 'airBack', 'airUp', 'airDown',
  'heavySide', 'heavyUp', 'heavyDown',
];
/** Pixels are looked for this far around the written box (px): it says roughly where the strike goes. */
const SEARCH_MARGIN = 16;
/** Margin around the drawn limb (px): a fist that brushes you still hits. */
const PAD = 5;
/** No side shorter than this (px), or a thin limb would be nearly impossible to land. */
const MIN_SIZE = 16;
/** Fewer pixels than this outside the body: the strike is drawn over the body, so the body part in the box counts. */
const MIN_LIMB_PIXELS = 8;

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Manifest {
  [anim: string]: { frameWidth: number; frameHeight: number; frames: number } | undefined;
}

/** The drawn pixels of a strip frame, in body coordinates (as CharacterSprite draws it: centred, feet on the bottom). */
function framePixels(sheet: Rgba, frame: number, size: { frameWidth: number; frameHeight: number }, body: Box): { x: number; y: number }[] {
  const left = body.width / 2 - size.frameWidth / 2;
  const top = body.height - size.frameHeight;
  const pixels: { x: number; y: number }[] = [];
  for (let py = 0; py < size.frameHeight; py++) {
    for (let px = 0; px < size.frameWidth; px++) {
      const alpha = sheet.data[(py * sheet.width + frame * size.frameWidth + px) * 4 + 3]!;
      if (alpha > 0) pixels.push({ x: left + px + 0.5, y: top + py + 0.5 });
    }
  }
  return pixels;
}

function inside(p: { x: number; y: number }, b: Box, margin = 0): boolean {
  return p.x >= b.x - margin && p.x <= b.x + b.width + margin && p.y >= b.y - margin && p.y <= b.y + b.height + margin;
}

function outline(points: { x: number; y: number }[]): Box {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x = Math.floor(Math.min(...xs));
  const y = Math.floor(Math.min(...ys));
  return { x, y, width: Math.ceil(Math.max(...xs)) - x, height: Math.ceil(Math.max(...ys)) - y };
}

/** Margin all round, then grown evenly up to MIN_SIZE. */
function padded(b: Box): Box {
  const grow = (start: number, length: number): [number, number] => {
    const size = Math.max(MIN_SIZE, length + 2 * PAD);
    return [Math.round(start - (size - length) / 2), Math.round(size)];
  };
  const [x, width] = grow(b.x, b.width);
  const [y, height] = grow(b.y, b.height);
  return { x, y, width, height };
}

/** The new box, or null (no pixels near the written box: the strip does not show this strike). */
function measure(pixels: { x: number; y: number }[], written: Box, body: Box): Box | null {
  const near = pixels.filter((p) => inside(p, written, SEARCH_MARGIN));
  const limb = near.filter((p) => !inside(p, body));
  const used = limb.length >= MIN_LIMB_PIXELS ? limb : near;
  return used.length > 0 ? padded(outline(used)) : null;
}

const show = (b: Box) => `${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}×${Math.round(b.height)}`;

function boxesFor(id: CharacterId): Partial<Record<AttackId, Box>> {
  const manifest = JSON.parse(readFileSync(resolve(ROOT, `packages/client/src/render/anims/${id}.json`), 'utf8')) as Manifest;
  const character = writtenCharacter(id);
  const body: Box = { x: 0, y: 0, width: character.width, height: character.height };
  const boxes: Partial<Record<AttackId, Box>> = {};
  const sheets = new Map<AnimName, Rgba>();
  console.log(`\n${character.name} (body ${body.width}×${body.height})`);
  for (const attack of ATTACKS) {
    const anim = resolveAnim(ATTACK_ANIM[attack], (name) => manifest[name] !== undefined);
    const size = anim && manifest[anim];
    const written = character.attacks[attack].box;
    if (!anim || !size) {
      console.log(`  ${attack.padEnd(11)} no strip: keeps ${show(written)}`);
      continue;
    }
    if (!sheets.has(anim)) sheets.set(anim, readPng(readFileSync(resolve(ROOT, `packages/client/public/sprites/${id}/anim/${anim}.png`))));
    const frame = hitFrame(anim, size.frames);
    const box = measure(framePixels(sheets.get(anim)!, frame, size, body), written, body);
    if (!box) {
      console.log(`  ${attack.padEnd(11)} nothing drawn near it in ${anim}: keeps ${show(written)}`);
      continue;
    }
    boxes[attack] = box;
    console.log(`  ${attack.padEnd(11)} ${show(written).padEnd(18)} → ${show(box)}  (${anim} frame ${frame + 1})`);
  }
  return boxes;
}

const all = Object.fromEntries(CHARACTER_IDS.map((id) => [id, boxesFor(id)]));
const lines = Object.entries(all).map(([id, boxes]) => {
  const entries = Object.entries(boxes).map(([attack, b]) => `    ${attack}: { x: ${b.x}, y: ${b.y}, width: ${b.width}, height: ${b.height} },`);
  return `  ${id}: {\n${entries.join('\n')}\n  },`;
});
writeFileSync(
  OUT,
  `// Generated by tools/hitboxes.ts from the attack animations: do not edit by hand.
// Run \`node tools/hitboxes.ts\` again after changing an attack's strip.

import type { AttackId } from '../constants.ts';

/** Hitboxes in px from the body's top-left, facing right (mirrored when facing left). */
export type ArtBoxes = Partial<Record<AttackId, { x: number; y: number; width: number; height: number }>>;

export const ART_HITBOXES: Partial<Record<string, ArtBoxes>> = {
${lines.join('\n')}
};
`,
);
console.log(`\nWritten: ${OUT}`);
