import Phaser from 'phaser';
import type { CharacterId } from '@brawler/shared';

/** A sprite strip in public/sprites: frames side by side, all the same size. */
interface Sheet {
  key: string;
  file: string;
  frameWidth: number;
  frameHeight: number;
}

/** Every pixel-art sheet. Sizes match what tools/pixelate.ts wrote (1 art pixel = 1 world pixel). */
export const SHEETS = {
  donateBody: { key: 'donate-body', file: 'sprites/donate/donate.png', frameWidth: 25, frameHeight: 72 },
  donateTank: { key: 'donate-tank', file: 'sprites/donate/tank.png', frameWidth: 92, frameHeight: 78 },
  donateShell: { key: 'donate-shell', file: 'sprites/donate/shell.png', frameWidth: 44, frameHeight: 13 },
  donateExplosion: { key: 'donate-explosion', file: 'sprites/donate/explosion.png', frameWidth: 62, frameHeight: 64 },
  donateParachute: { key: 'donate-parachute', file: 'sprites/donate/parachute.png', frameWidth: 62, frameHeight: 46 },
} as const satisfies Record<string, Sheet>;

/** How a character with pixel art is drawn. Characters without an entry stay coloured rectangles. */
export interface CharacterArt {
  body: Sheet;
  /** Shown behind the character during the neutral special (frames: arrive, fire, after the shot). */
  neutralSpecial?: Sheet;
  /** Shown above the character while gliding down after the up special. */
  parachute?: Sheet;
}

export const CHARACTER_ART: Partial<Record<CharacterId, CharacterArt>> = {
  donate: { body: SHEETS.donateBody, neutralSpecial: SHEETS.donateTank, parachute: SHEETS.donateParachute },
};

/** What each projectile kind looks like, and what it leaves when it disappears. */
export const PROJECTILE_ART: Record<string, { sheet: Sheet; burst?: Sheet } | undefined> = {
  shell: { sheet: SHEETS.donateShell, burst: SHEETS.donateExplosion },
};

/** Queues every sheet for loading. Call from the scene's preload(). */
export function preloadArt(scene: Phaser.Scene): void {
  for (const sheet of Object.values(SHEETS)) {
    const { frameWidth, frameHeight } = sheet;
    scene.load.spritesheet(sheet.key, import.meta.env.BASE_URL + sheet.file, { frameWidth, frameHeight });
  }
  // Pixel art must stay sharp when the camera zooms: no smoothing between pixels.
  scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
    for (const sheet of Object.values(SHEETS)) {
      scene.textures.get(sheet.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  });
}
