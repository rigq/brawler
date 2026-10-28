// Placeholder colours shared by the local and online scenes.

export const SOLID_COLOR = 0x5b6b8c;
export const PLATFORM_COLOR = 0x8fa3c9;
/** Indexed by player slot: P1 orange, P2 blue. */
export const PLAYER_COLORS = [0xf2a541, 0x4fc3f7] as const;

export function playerColor(slot: number): number {
  return PLAYER_COLORS[slot] ?? 0xffffff;
}

export function toCssColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}
