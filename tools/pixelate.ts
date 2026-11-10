// Turns AI-generated "pixel art" (soft, uneven pixels on a magenta background)
// into clean sprite strips: one real pixel per art pixel, transparent background.
//
//   node tools/pixelate.ts art/donate/sprites.json
//
// The JSON lists the assets; paths are relative to the JSON file. Each asset:
//   name     output file name (no extension), written to `outDir`
//   file     source PNG
//   frames   number of frames, laid out left to right in equal columns of the source
//            (or `columns`: explicit [x0, x1] source ranges, one per frame)
//   height / width   size in game pixels of the biggest frame (one of the two)
//   alignX   left | center | right (default center); alignY bottom | center (default bottom)
//   minRowPixels     optional: drop rows with fewer solid pixels (thin cords, stray specks)

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { readPng, writePng, type Rgba } from './png.ts';

interface AssetConfig {
  name: string;
  file: string;
  frames?: number;
  columns?: [number, number][];
  height?: number;
  width?: number;
  alignX?: 'left' | 'center' | 'right';
  alignY?: 'bottom' | 'center';
  minRowPixels?: number;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Magenta and the pinkish halo AI tools leave around it. */
function isBackground(d: Uint8Array, i: number): boolean {
  return d[i + 3]! < 20 || (d[i]! - d[i + 1]! > 70 && d[i + 2]! - d[i + 1]! > 70);
}

function boundingBox(img: Rgba, x0: number, x1: number): Box {
  let left = Infinity, top = Infinity, right = -1, bottom = -1;
  for (let y = 0; y < img.height; y++) {
    for (let x = x0; x < x1; x++) {
      if (isBackground(img.data, (y * img.width + x) * 4)) continue;
      left = Math.min(left, x);
      right = Math.max(right, x + 1);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y + 1);
    }
  }
  if (right < 0) throw new Error(`empty frame between x ${x0} and ${x1}`);
  return { x: left, y: top, w: right - left, h: bottom - top };
}

/**
 * One output pixel from an s×s block: transparent if the block is mostly
 * background, else the most common colour in it. A vote, not an average, so
 * stray in-between colours from the generator are dropped.
 */
function vote(img: Rgba, sx: number, sy: number, s: number): [number, number, number] | null {
  const bins = new Map<number, [number, number, number, number]>();
  let background = 0, total = 0;
  for (let y = Math.floor(sy); y < Math.floor(sy + s); y++) {
    for (let x = Math.floor(sx); x < Math.floor(sx + s); x++) {
      total++;
      if (x < 0 || y < 0 || x >= img.width || y >= img.height) { background++; continue; }
      const i = (y * img.width + x) * 4;
      if (isBackground(img.data, i)) { background++; continue; }
      const [r, g, b] = [img.data[i]!, img.data[i + 1]!, img.data[i + 2]!];
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const bin = bins.get(key) ?? [0, 0, 0, 0];
      bin[0]++; bin[1] += r; bin[2] += g; bin[3] += b;
      bins.set(key, bin);
    }
  }
  if (background * 2 > total || bins.size === 0) return null;
  let best: [number, number, number, number] = [0, 0, 0, 0];
  for (const bin of bins.values()) if (bin[0] > best[0]) best = bin;
  return [Math.round(best[1] / best[0]), Math.round(best[2] / best[0]), Math.round(best[3] / best[0])];
}

function pixelate(img: Rgba, asset: AssetConfig): { strip: Rgba; frameWidth: number; frameHeight: number } {
  const count = asset.columns?.length ?? asset.frames ?? 1;
  const columns = asset.columns ?? Array.from({ length: count }, (_, f): [number, number] =>
    [Math.round((f * img.width) / count), Math.round(((f + 1) * img.width) / count)]);
  const boxes = columns.map(([a, b]) => boundingBox(img, a, b));
  const maxW = Math.max(...boxes.map((b) => b.w));
  const maxH = Math.max(...boxes.map((b) => b.h));
  const s = asset.height ? maxH / asset.height : maxW / (asset.width ?? maxW);

  // Each frame scaled on its own, then trimmed of thin rows if asked.
  const frames = boxes.map((box) => {
    const w = Math.ceil(box.w / s), h = Math.ceil(box.h / s);
    const px: ([number, number, number] | null)[] = [];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px.push(vote(img, box.x + i * s, box.y + j * s, s));
    let rows = Array.from({ length: h }, (_, j) => j);
    if (asset.minRowPixels) {
      const solid = (j: number) => px.slice(j * w, (j + 1) * w).filter(Boolean).length >= asset.minRowPixels!;
      const first = rows.findIndex(solid);
      let last = first;
      while (last + 1 < h && solid(last + 1)) last++;
      rows = rows.slice(first, last + 1);
    }
    return { w, h: rows.length, get: (i: number, j: number) => px[rows[j]! * w + i] ?? null };
  });

  const frameWidth = Math.max(...frames.map((f) => f.w));
  const frameHeight = Math.max(...frames.map((f) => f.h));
  const strip: Rgba = { width: frameWidth * count, height: frameHeight, data: new Uint8Array(frameWidth * count * frameHeight * 4) };
  frames.forEach((frame, f) => {
    const ox = asset.alignX === 'left' ? 0 : asset.alignX === 'right' ? frameWidth - frame.w : Math.floor((frameWidth - frame.w) / 2);
    const oy = asset.alignY === 'center' ? Math.floor((frameHeight - frame.h) / 2) : frameHeight - frame.h;
    for (let j = 0; j < frame.h; j++) {
      for (let i = 0; i < frame.w; i++) {
        const c = frame.get(i, j);
        if (!c) continue;
        const k = ((oy + j) * strip.width + f * frameWidth + ox + i) * 4;
        strip.data.set([c[0], c[1], c[2], 255], k);
      }
    }
  });
  return { strip, frameWidth, frameHeight };
}

const configPath = process.argv[2];
if (!configPath) throw new Error('usage: node tools/pixelate.ts <sprites.json>');
const config = JSON.parse(readFileSync(configPath, 'utf8')) as { outDir: string; assets: AssetConfig[] };
const base = dirname(configPath);
const outDir = join(base, config.outDir);
mkdirSync(outDir, { recursive: true });
for (const asset of config.assets) {
  const { strip, frameWidth, frameHeight } = pixelate(readPng(readFileSync(join(base, asset.file))), asset);
  writeFileSync(join(outDir, `${asset.name}.png`), writePng(strip));
  console.log(`${asset.name}.png  ${strip.width}×${strip.height}  frame ${frameWidth}×${frameHeight}`);
}
