// Placeholder colours shared by the local and online scenes.
// Stage theme: "floating temple at night". Cool, dark background so the
// players' warm orange and light blue always stand out.

/** Indexed by player slot: P1 orange, P2 blue. */
export const PLAYER_COLORS = [0xf2a541, 0x4fc3f7] as const;

/**
 * Two players with the same character: the second one's sprite is multiplied
 * by this (a light version of P2's blue), so you can tell who is who.
 */
export const MIRROR_TINT = 0x9fd8ff;

export const THEME = {
  /** Shown before anything is drawn and outside the backdrop. */
  canvas: '#0b1026',
  sky: { top: 0x0b1026, bottom: 0x2b3a67 },
  /** Soft band of light behind the mountains. */
  horizonGlow: 0x3d5a80,
  moon: 0xf4f1de,
  star: 0xffffff,
  mountainsFar: 0x1c2541,
  mountainsNear: 0x22304f,
  island: {
    grass: 0x6fbf73,
    grassShadow: 0x4e9a55,
    rock: 0x4a4e69,
    rockDark: 0x2f3247,
    stone: 0x5c6080,
    root: 0x3a5a40,
    leaf: 0x588157,
    crystal: 0x7fdbda,
    flower: [0xffd6e0, 0xfff3b0, 0xcdb4db] as readonly number[],
  },
  /** Far floating islets with temple ruins, in the backdrop. */
  islet: { rock: 0x1f2a48, top: 0x2c3e5c, pillar: 0x34476b },
  platform: { top: 0xd4a373, body: 0xb08968, underside: 0x7f5539, rope: 0x9c7a56 },
  lantern: { body: 0xffb703, glow: 0xffd166, post: 0x2f3247 },
} as const;

export function playerColor(slot: number): number {
  return PLAYER_COLORS[slot] ?? 0xffffff;
}

export function toCssColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}
