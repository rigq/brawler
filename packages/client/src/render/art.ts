import Phaser from 'phaser';
import type { CharacterId } from '@brawler/shared';
import { ANIM_NAMES, type AnimName, type IdleTiming } from './bodyAnimation.ts';

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
  robertBody: { key: 'robert-body', file: 'sprites/robert/robert.png', frameWidth: 41, frameHeight: 74 },
  robertSmoke: { key: 'robert-smoke', file: 'sprites/robert/smoke.png', frameWidth: 39, frameHeight: 56 },
  robertRapper: { key: 'robert-rapper', file: 'sprites/robert/rapper.png', frameWidth: 43, frameHeight: 87 },
  samuBody: { key: 'samu-body', file: 'sprites/samu/samu.png', frameWidth: 32, frameHeight: 72 },
  samuBall: { key: 'samu-ball', file: 'sprites/samu/ball.png', frameWidth: 17, frameHeight: 16 },
  samuFlag: { key: 'samu-flag', file: 'sprites/samu/flag.png', frameWidth: 33, frameHeight: 64 },
  samuFlagPlant: { key: 'samu-flag-plant', file: 'sprites/samu/flag-plant.png', frameWidth: 39, frameHeight: 64 },
  samuTeleport: { key: 'samu-teleport', file: 'sprites/samu/teleport.png', frameWidth: 38, frameHeight: 96 },
  chachinBody: { key: 'chachin-body', file: 'sprites/chachin/chachin.png', frameWidth: 16, frameHeight: 54 },
  chachinScream: { key: 'chachin-scream', file: 'sprites/chachin/scream.png', frameWidth: 101, frameHeight: 128 },
  chachinRocket: { key: 'chachin-rocket', file: 'sprites/chachin/scream-rocket.png', frameWidth: 65, frameHeight: 96 },
  chachinDizzy: { key: 'chachin-dizzy', file: 'sprites/chachin/dizzy.png', frameWidth: 48, frameHeight: 35 },
} as const satisfies Record<string, Sheet>;

/** Frame sizes of a character's animation strips, as tools/pixelate.ts writes them (anims/<character>.json). */
type AnimManifest = Partial<Record<string, { frameWidth: number; frameHeight: number; frames: number }>>;

export interface AnimSheet extends Sheet {
  frames: number;
}

/**
 * Every manifest in anims/, by file name. A character gets its animations as soon
 * as tools/pixelate.ts writes anims/<character>.json: no code to touch.
 */
const ANIM_MANIFESTS = import.meta.glob<AnimManifest>('./anims/*.json', { eager: true, import: 'default' });

/** The strips in public/sprites/<character>/anim/ listed in its manifest. Unknown names are ignored. */
function animSheets(character: CharacterId): Partial<Record<AnimName, AnimSheet>> {
  const manifest = ANIM_MANIFESTS[`./anims/${character}.json`] ?? {};
  const sheets: Partial<Record<AnimName, AnimSheet>> = {};
  for (const name of ANIM_NAMES) {
    const size = manifest[name];
    if (size) sheets[name] = { key: `${character}-anim-${name}`, file: `sprites/${character}/anim/${name}.png`, ...size };
  }
  return sheets;
}

/** How a character with pixel art is drawn. Characters without an entry stay coloured rectangles. */
export interface CharacterArt {
  /** The still pose: used when there is no animation for what the character is doing. */
  body: Sheet;
  /** Body animations by name (see bodyAnimation.ts); missing ones fall back to a similar one or the still pose. */
  anims?: Partial<Record<AnimName, AnimSheet>>;
  /** Idle pace: a rest on the first frame between play-throughs (an idle that is an action, not breathing), frame length. */
  idle?: IdleTiming;
  /** Shown behind the character during the neutral special (frames: arrive, fire, after the shot). */
  neutralProp?: Sheet;
  /** Shown on the ground where the up special started (frames: startup, active, recovery). */
  upProp?: Sheet;
  /** Shown above the character while gliding down after the up special. */
  parachute?: Sheet;
  /** Centred on the body during the neutral special (frames: winding up, hitting ×2, fading). */
  neutralAura?: Sheet;
  /** Under the feet during the up special, rising with the character (3 frames). */
  upBlast?: Sheet;
  /** Around the body during a teleporting up special (frames: gathering ×3, arriving ×2). */
  teleport?: Sheet;
  /** Planted at the player's flag point while they are in the air: planting, then waving. */
  flag?: { plant: Sheet; wave: Sheet };
}

/** Robert: 1 s standing still, then a ~1.5 s drag (one every ~2.5 s, the first 1 s after stopping). */
const ROBERT_IDLE: IdleTiming = { restMs: 1000 };
/** Samu: 1.5 s in guard, then grabs a dumbbell from his backpack, two curls, puts it back (~2 s). */
const SAMU_IDLE: IdleTiming = { restMs: 1500, frameMs: 170 };
/** Chachin: 1.5 s bouncing in guard, then a quick ~0.9 s backflip. */
const CHACHIN_IDLE: IdleTiming = { restMs: 1500, frameMs: 110 };

export const CHARACTER_ART: Partial<Record<CharacterId, CharacterArt>> = {
  donate: { body: SHEETS.donateBody, anims: animSheets('donate'), neutralProp: SHEETS.donateTank, parachute: SHEETS.donateParachute },
  // His idle is a drag on the cigarette, with a short pause between drags.
  robert: { body: SHEETS.robertBody, anims: animSheets('robert'), idle: ROBERT_IDLE, upProp: SHEETS.robertRapper },
  samu: {
    body: SHEETS.samuBody,
    anims: animSheets('samu'),
    idle: SAMU_IDLE,
    teleport: SHEETS.samuTeleport,
    flag: { plant: SHEETS.samuFlagPlant, wave: SHEETS.samuFlag },
  },
  // His idle is a show-off backflip every couple of seconds.
  chachin: { body: SHEETS.chachinBody, anims: animSheets('chachin'), idle: CHACHIN_IDLE, neutralAura: SHEETS.chachinScream, upBlast: SHEETS.chachinRocket },
};

/**
 * What each projectile kind looks like and what it leaves when it disappears.
 * `animation`: 'loop' cycles its frames; 'life' plays them over its lifetime
 * (first frame: appearing, last: breaking up, the middle two loop meanwhile).
 */
export interface ProjectileArt {
  sheet: Sheet;
  animation: 'loop' | 'life';
  burst?: Sheet;
}

export const PROJECTILE_ART: Record<string, ProjectileArt | undefined> = {
  shell: { sheet: SHEETS.donateShell, animation: 'loop', burst: SHEETS.donateExplosion },
  smoke: { sheet: SHEETS.robertSmoke, animation: 'life' },
  ball: { sheet: SHEETS.samuBall, animation: 'loop' },
};

/** Every sheet to load: the fixed ones and each character's animations. */
const ALL_SHEETS: Sheet[] = [
  ...Object.values(SHEETS),
  ...Object.values(CHARACTER_ART).flatMap((art) => Object.values(art.anims ?? {})),
];

/** Queues every sheet for loading. Call from the scene's preload(). */
export function preloadArt(scene: Phaser.Scene): void {
  for (const sheet of ALL_SHEETS) {
    const { frameWidth, frameHeight } = sheet;
    scene.load.spritesheet(sheet.key, import.meta.env.BASE_URL + sheet.file, { frameWidth, frameHeight });
  }
  // Pixel art must stay sharp when the camera zooms: no smoothing between pixels.
  scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
    for (const sheet of ALL_SHEETS) {
      scene.textures.get(sheet.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  });
}
