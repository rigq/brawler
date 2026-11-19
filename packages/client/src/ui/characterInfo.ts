import type { CharacterId } from '@brawler/shared';

/** What menus say about each character (the simulation only needs the data files). */
export interface CharacterInfo {
  /** One line under the name. */
  tagline: string;
  /** Neutral and up special, as players call them. */
  specials: [string, string];
  /** Head crop for portraits, in px of the still pose: top edge and height. */
  head: { top: number; height: number };
}

export const CHARACTER_INFO: Record<CharacterId, CharacterInfo> = {
  donate: {
    tagline: 'Heredero de la Guardia de Segovia. Su padre dispara desde el tanque.',
    specials: ['Cañonazo (mantén para cargar)', 'Salto de mortero'],
    head: { top: 0, height: 24 },
  },
  robert: {
    tagline: 'El malote del barrio. Lento, pesado y pega como un camión.',
    specials: ['Calada', 'Aúpa del rapero'],
    head: { top: 1, height: 24 },
  },
  samu: {
    tagline: 'Jugador de vóley con una mochila llena de pesas.',
    specials: ['Remate', 'A la bandera'],
    head: { top: 0, height: 24 },
  },
  chachin: {
    tagline: 'El más pequeño y el más rápido. Y grita como un loco.',
    specials: ['Grito', 'Grito-cohete'],
    head: { top: 0, height: 18 },
  },
  riga: {
    tagline: 'El más alto. Lo resuelve todo con IA. Llega lejos, pega flojo.',
    specials: ['Ruleta de IAs (mantén: Claude · ChatGPT · Gemini)', 'Prompt de emergencia'],
    head: { top: 0, height: 22 },
  },
};

/** Labels of the 1–5 ratings, in the order they are shown. */
export const STAT_LABELS = [
  ['speed', 'Velocidad'],
  ['weight', 'Peso'],
  ['damage', 'Daño'],
  ['reach', 'Alcance'],
] as const;
