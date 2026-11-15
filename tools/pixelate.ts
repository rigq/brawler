// Turns AI-generated "pixel art" (soft, uneven pixels on a magenta background)
// into clean sprite strips: one real pixel per art pixel, transparent background.
//
//   node tools/pixelate.ts art/donate/sprites.json
//
// The JSON lists the assets; paths are relative to the JSON file. Each asset:
//   name     output file name (no extension), written to `outDir`
//   file     source PNG or JPG (JPG goes through Windows' own decoder, or ImageMagick elsewhere: see readImage)
//   frames   number of frames, laid out left to right in equal columns of the source
//            (or `columns`: explicit [x0, x1] source ranges, one per frame)
//            (or `detect`: find this many frames by the empty space around them, row by row)
//   height / width   size in game pixels of the biggest frame (one of the two)
//            (or `standing`: how tall the character stands in this source, in source pixels;
//            the config's `standingHeight` is that height in game pixels. One scale for
//            every strip whatever the pose: a crouch comes out shorter, not bigger)
//   alignX   left | center | right | mass (default center); alignY bottom | center | top | ground (default bottom)
//            ground: each frame keeps its height above the strip's lowest feet (a jump or a flip in place)
//            mass: each frame's centre of mass goes to the middle, so the body stays put
//            while arms and legs reach out (animation strips)
//   minRowPixels     optional: drop rows with fewer solid pixels (thin cords, stray specks)
//   clean    optional: drop loose bits much smaller than the frame's main shape
//            (a neighbour's fist or heel that reached into this frame's columns)
//   cleanMinShare    optional: with `clean`, how big a bit must be to stay, as a share of
//            the main shape (default 0.05). Raise it when frames overlap and bigger pieces sneak in
//   rows     optional [y0, y1]: only use this horizontal band of the source (skip a bad row of frames)

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { readPng, writePng, type Rgba } from './png.ts';

interface AssetConfig {
  name: string;
  file: string;
  frames?: number;
  columns?: [number, number][];
  height?: number;
  width?: number;
  alignX?: 'left' | 'center' | 'right' | 'mass';
  alignY?: 'bottom' | 'center' | 'top' | 'ground';
  minRowPixels?: number;
  clean?: boolean;
  cleanMinShare?: number;
  rows?: [number, number];
  detect?: number;
  standing?: number;
}

interface Config {
  outDir: string;
  /** Optional: JSON file (relative to the config) with every strip's frame size, for the client. */
  manifest?: string;
  standingHeight?: number;
  assets: AssetConfig[];
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

function boundingBox(img: Rgba, x0: number, x1: number, rows: [number, number]): Box {
  let left = Infinity, top = Infinity, right = -1, bottom = -1;
  for (let y = rows[0]; y < rows[1]; y++) {
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

/** Lines (rows or columns) with fewer solid pixels than this are empty: JPG specks don't count. */
const DETECT_MIN_SOLID = 3;
/** Empty lines that separate two frames (shorter gaps are inside one frame). */
const DETECT_MIN_GAP = 25;
/** Runs thinner than this are leftovers, not frames. */
const DETECT_MIN_SIZE = 40;

/** [start, end) runs of lines with solid pixels, merging runs closer than DETECT_MIN_GAP. */
function solidRuns(length: number, solidAt: (line: number) => number): [number, number][] {
  const runs: [number, number][] = [];
  let start = -1, lastSolid = -Infinity;
  for (let i = 0; i < length; i++) {
    if (solidAt(i) < DETECT_MIN_SOLID) continue;
    if (start < 0 || i - lastSolid > DETECT_MIN_GAP) {
      if (start >= 0) runs.push([start, lastSolid + 1]);
      start = i;
    }
    lastSolid = i;
  }
  if (start >= 0) runs.push([start, lastSolid + 1]);
  return runs.filter(([a, b]) => b - a >= DETECT_MIN_SIZE);
}

function countSolid(img: Rgba, xs: [number, number], ys: [number, number]): number {
  let n = 0;
  for (let y = ys[0]; y < ys[1]; y++) for (let x = xs[0]; x < xs[1]; x++) if (!isBackground(img.data, (y * img.width + x) * 4)) n++;
  return n;
}

/** Frames found by the empty space around them: rows of frames top to bottom, each left to right. */
function detectFrames(img: Rgba, expected: number, rows: [number, number]): Box[] {
  const bands = solidRuns(rows[1] - rows[0], (j) => countSolid(img, [0, img.width], [rows[0] + j, rows[0] + j + 1]))
    .map(([a, b]): [number, number] => [rows[0] + a, rows[0] + b]);
  const boxes = bands.flatMap((band) =>
    solidRuns(img.width, (x) => countSolid(img, [x, x + 1], band)).map(([a, b]) => boundingBox(img, a, b, band)));
  if (boxes.length !== expected) throw new Error(`found ${boxes.length} frames, expected ${expected}`);
  return boxes;
}

function frameBoxes(img: Rgba, asset: AssetConfig): Box[] {
  const rows = asset.rows ?? [0, img.height];
  if (asset.detect) return detectFrames(img, asset.detect, rows);
  const count = asset.columns?.length ?? asset.frames ?? 1;
  const columns = asset.columns ?? Array.from({ length: count }, (_, f): [number, number] =>
    [Math.round((f * img.width) / count), Math.round(((f + 1) * img.width) / count)]);
  return columns.map(([a, b]) => boundingBox(img, a, b, rows));
}

/** Source pixels per game pixel. */
function scaleOf(boxes: Box[], asset: AssetConfig, standingHeight: number | undefined): number {
  if (asset.standing) {
    if (!standingHeight) throw new Error(`${asset.name}: "standing" needs "standingHeight" in the config`);
    return asset.standing / standingHeight;
  }
  const maxW = Math.max(...boxes.map((b) => b.w));
  const maxH = Math.max(...boxes.map((b) => b.h));
  return asset.height ? maxH / asset.height : maxW / (asset.width ?? maxW);
}

type Pixel = [number, number, number] | null;

/**
 * Cuts a frame down to its solid pixels. Needed after `clean`: a removed bit
 * (a neighbour's foot under this frame) must not leave empty rows below the
 * feet, or bottom alignment would leave the character floating.
 */
function trimmed(w: number, lines: Pixel[][]): { w: number; h: number; top: number; get: (i: number, j: number) => Pixel } {
  const solidRows = lines.flatMap((line, j) => (line.some(Boolean) ? [j] : []));
  const solidCols = Array.from({ length: w }, (_, i) => i).filter((i) => lines.some((line) => line[i]));
  const top = solidRows[0] ?? 0, bottom = solidRows.at(-1) ?? -1;
  const left = solidCols[0] ?? 0, right = solidCols.at(-1) ?? -1;
  return {
    w: right - left + 1,
    h: bottom - top + 1,
    top,
    get: (i, j) => lines[top + j]?.[left + i] ?? null,
  };
}

/** Loose bits smaller than this share of the biggest shape are dropped by `clean`. */
const CLEAN_MIN_SHARE = 0.05;

/** Clears every 8-connected group of solid pixels much smaller than the biggest one. */
function dropLooseBits(px: unknown[], w: number, h: number, minShare = CLEAN_MIN_SHARE): void {
  const group = new Int32Array(w * h).fill(-1);
  const sizes: number[] = [];
  for (let start = 0; start < px.length; start++) {
    if (!px[start] || group[start]! >= 0) continue;
    const id = sizes.length;
    const stack = [start];
    group[start] = id;
    let size = 0;
    while (stack.length) {
      const k = stack.pop()!;
      size++;
      const x = k % w, y = (k - x) / w;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy, n = ny * w + nx;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || !px[n] || group[n]! >= 0) continue;
        group[n] = id;
        stack.push(n);
      }
    }
    sizes.push(size);
  }
  const keep = Math.max(...sizes) * minShare;
  for (let k = 0; k < px.length; k++) if (group[k]! >= 0 && sizes[group[k]!]! < keep) px[k] = null;
}

/** Mean x of the solid pixels, in frame pixels. */
function massCenterX(frame: { w: number; h: number; get: (i: number, j: number) => unknown }): number {
  let sum = 0, n = 0;
  for (let j = 0; j < frame.h; j++) for (let i = 0; i < frame.w; i++) if (frame.get(i, j)) { sum += i + 0.5; n++; }
  return n ? sum / n : frame.w / 2;
}

function pixelate(img: Rgba, asset: AssetConfig, standingHeight?: number): { strip: Rgba; frameWidth: number; frameHeight: number; count: number } {
  const boxes = frameBoxes(img, asset);
  const count = boxes.length;
  const s = scaleOf(boxes, asset, standingHeight);

  // Each frame scaled on its own, then trimmed of thin rows if asked.
  const frames = boxes.map((box) => {
    const w = Math.ceil(box.w / s), h = Math.ceil(box.h / s);
    const px: ([number, number, number] | null)[] = [];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px.push(vote(img, box.x + i * s, box.y + j * s, s));
    if (asset.clean) dropLooseBits(px, w, h, asset.cleanMinShare);
    let rows = Array.from({ length: h }, (_, j) => j);
    if (asset.minRowPixels) {
      const solid = (j: number) => px.slice(j * w, (j + 1) * w).filter(Boolean).length >= asset.minRowPixels!;
      const first = rows.findIndex(solid);
      let last = first;
      while (last + 1 < h && solid(last + 1)) last++;
      rows = rows.slice(first, last + 1);
    }
    const frame = trimmed(w, rows.map((j) => px.slice(j * w, (j + 1) * w)));
    // Where the frame's top sits in the source, in game pixels (for alignY "ground").
    return { ...frame, sourceTop: box.y / s + (rows[frame.top] ?? 0) };
  });

  const centers = frames.map(massCenterX);
  const frameWidth = asset.alignX === 'mass'
    ? Math.ceil(2 * Math.max(...frames.map((f, k) => Math.max(centers[k]!, f.w - centers[k]!))))
    : Math.max(...frames.map((f) => f.w));
  // alignY "ground": every frame keeps its height above the lowest feet of the strip (jumps, flips).
  const groundY = Math.max(...frames.map((f) => f.sourceTop + f.h));
  const highestY = Math.min(...frames.map((f) => f.sourceTop));
  const frameHeight = asset.alignY === 'ground'
    ? Math.ceil(groundY - highestY)
    : Math.max(...frames.map((f) => f.h));
  const strip: Rgba = { width: frameWidth * count, height: frameHeight, data: new Uint8Array(frameWidth * count * frameHeight * 4) };
  frames.forEach((frame, f) => {
    const ox = asset.alignX === 'left' ? 0
      : asset.alignX === 'right' ? frameWidth - frame.w
      : asset.alignX === 'mass' ? Math.round(frameWidth / 2 - centers[f]!)
      : Math.floor((frameWidth - frame.w) / 2);
    const oy = asset.alignY === 'center' ? Math.floor((frameHeight - frame.h) / 2)
      : asset.alignY === 'top' ? 0
      : asset.alignY === 'ground' ? Math.min(frameHeight - frame.h, Math.round(frame.sourceTop - highestY))
      : frameHeight - frame.h;
    for (let j = 0; j < frame.h; j++) {
      for (let i = 0; i < frame.w; i++) {
        const c = frame.get(i, j);
        if (!c) continue;
        const k = ((oy + j) * strip.width + f * frameWidth + ox + i) * 4;
        strip.data.set([c[0], c[1], c[2], 255], k);
      }
    }
  });
  return { strip, frameWidth, frameHeight, count };
}

/**
 * PNG directly. JPG (what Gemini exports) is converted to a temporary PNG with
 * Windows' built-in System.Drawing through PowerShell: no npm dependency for a
 * full JPEG decoder. This only runs on Windows, like the rest of our art workflow.
 */
function readImage(path: string): Rgba {
  if (/\.png$/i.test(path)) return readPng(readFileSync(path));
  const dir = mkdtempSync(join(tmpdir(), 'pixelate-'));
  const png = join(dir, 'source.png');
  try {
    if (process.platform === 'win32') convertWithWindows(resolve(path), png);
    else convertWithImageMagick(resolve(path), png);
    return readPng(readFileSync(png));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Windows' own image decoder, through PowerShell: nothing to install. */
function convertWithWindows(input: string, output: string): void {
  // Paths go in environment variables: -Command does not pass arguments to the script.
  const script = `Add-Type -AssemblyName System.Drawing; $i = [System.Drawing.Image]::FromFile($env:PIXELATE_IN); $i.Save($env:PIXELATE_OUT, [System.Drawing.Imaging.ImageFormat]::Png); $i.Dispose()`;
  execFileSync('powershell', ['-NoProfile', '-Command', script], { env: { ...process.env, PIXELATE_IN: input, PIXELATE_OUT: output } });
}

/** Linux and macOS: ImageMagick (`magick` in version 7, `convert` before). */
function convertWithImageMagick(input: string, output: string): void {
  for (const command of ['magick', 'convert']) {
    try {
      // PNG32: always RGBA 8-bit, the only kind tools/png.ts reads.
      execFileSync(command, [input, `PNG32:${output}`], { stdio: 'ignore' });
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  throw new Error('Reading JPG outside Windows needs ImageMagick (apt install imagemagick / brew install imagemagick)');
}

const configPath = process.argv[2];
if (!configPath) throw new Error('usage: node tools/pixelate.ts <sprites.json>');
const config = JSON.parse(readFileSync(configPath, 'utf8')) as Config;
const base = dirname(configPath);
const outDir = join(base, config.outDir);
const manifest: Record<string, { frameWidth: number; frameHeight: number; frames: number }> = {};
for (const asset of config.assets) {
  const { strip, frameWidth, frameHeight, count } = pixelate(readImage(join(base, asset.file)), asset, config.standingHeight);
  const out = join(outDir, `${asset.name}.png`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, writePng(strip));
  manifest[asset.name] = { frameWidth, frameHeight, frames: count };
  console.log(`${asset.name}.png  ${strip.width}×${strip.height}  frame ${frameWidth}×${frameHeight}`);
}
if (config.manifest) {
  writeFileSync(join(base, config.manifest), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`manifest: ${config.manifest}`);
}
