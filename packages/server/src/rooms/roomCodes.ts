import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '@brawler/shared';

/** Codes of rooms currently open in this server process. */
const inUse = new Set<string>();

/**
 * A random, unused 4-letter code. Math.random is fine here: this is server
 * bookkeeping, not part of the deterministic simulation.
 */
export function claimRoomCode(): string {
  for (;;) {
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
    }
    if (!inUse.has(code)) {
      inUse.add(code);
      return code;
    }
  }
}

export function releaseRoomCode(code: string): void {
  inUse.delete(code);
}
