import Phaser from 'phaser';
import type { PlayerInput } from '@brawler/shared';
import { P1_BINDINGS, P2_BINDINGS } from '../input/KeyboardInput.ts';

/** One section of the controls panel: a table with a header row, and an optional note under it. */
export interface ControlsSection {
  title: string;
  columns: string[];
  rows: string[][];
  note?: string;
}

const Key = Phaser.Input.Keyboard.KeyCodes;

/** How each key is written for a person. Letters and digits are worked out from their code. */
const KEY_LABELS: Partial<Record<number, string>> = {
  [Key.SPACE]: 'Espacio',
  [Key.SHIFT]: 'Shift',
  [Key.LEFT]: '←',
  [Key.RIGHT]: '→',
  [Key.UP]: '↑',
  [Key.DOWN]: '↓',
  [Key.COMMA]: ',',
  [Key.PERIOD]: '.',
  [Key.MINUS]: '-',
  [Key.FORWARD_SLASH]: '/',
  [Key.NUMPAD_ZERO]: '0 num.',
  [Key.NUMPAD_ONE]: '1 num.',
  [Key.NUMPAD_TWO]: '2 num.',
  [Key.NUMPAD_THREE]: '3 num.',
  [Key.NUMPAD_FOUR]: '4 num.',
};

function keyLabel(code: number): string {
  return KEY_LABELS[code] ?? String.fromCharCode(code);
}

/** Rows of the buttons table: the actions they cover (joined with " / ") and the gamepad's buttons. */
const BUTTON_ROWS: { label: string; actions: (keyof PlayerInput)[]; pad: string }[] = [
  { label: 'Moverse', actions: ['left', 'right'], pad: 'Stick o cruceta' },
  { label: 'Apuntar arriba / abajo', actions: ['up', 'down'], pad: 'Stick o cruceta' },
  { label: 'Saltar', actions: ['jump'], pad: 'A' },
  { label: 'Ligero', actions: ['light'], pad: 'X' },
  { label: 'Fuerte', actions: ['heavy'], pad: 'B' },
  { label: 'Escudo / esquiva', actions: ['dodge'], pad: 'LB, LT o RT' },
  { label: 'Agarre', actions: ['grab'], pad: 'RB' },
  { label: 'Especial', actions: ['special'], pad: 'Y' },
  { label: 'Provocar', actions: ['taunt'], pad: 'View / Select' },
];

/** Keys of one action written for a person: `pick` chooses which of its keys. */
function keysOf(codes: number[], pick: (codes: number[]) => number[]): string {
  return pick(codes).map(keyLabel).join(' o ');
}

/** P1's main key, its extra keys (the set for sharing the keyboard: C V B X), and all of P2's. */
const P1_MAIN = (codes: number[]) => codes.slice(0, 1);
const P1_SHARED = (codes: number[]) => (codes.length > 1 ? codes.slice(1) : codes);
const ALL = (codes: number[]) => codes;

function buttonsSection(): ControlsSection {
  const cell = (row: (typeof BUTTON_ROWS)[number], bindings: typeof P1_BINDINGS, pick: (codes: number[]) => number[]) =>
    row.actions.map((action) => keysOf(bindings[action], pick)).join(' / ');
  return {
    title: 'Botones',
    columns: ['Acción', 'P1', 'P1 (compartido)', 'P2', 'Mando'],
    rows: BUTTON_ROWS.map((row) => [row.label, cell(row, P1_BINDINGS, P1_MAIN), cell(row, P1_BINDINGS, P1_SHARED), cell(row, P2_BINDINGS, ALL), row.pad]),
    note: 'Mantén Fuerte para cargarlo. W y ↑ solo apuntan: no saltan. P1 puede usar cualquiera de sus dos juegos; el "compartido" deja J K L libres para P2.',
  };
}

const MOVEMENT: ControlsSection = {
  title: 'Movimiento',
  columns: ['Qué', 'Cómo'],
  rows: [
    ['Salto corto', 'Toque rápido de saltar'],
    ['Doble salto (2 en el aire)', 'Saltar otra vez en el aire'],
    ['Caída rápida', 'Abajo cuando ya caes'],
    ['Bajar de una plataforma', 'Abajo encima de ella'],
    ['Escudo', 'Mantener escudo en el suelo'],
    ['Rodar', 'Escudo + izquierda/derecha'],
    ['Esquiva en el sitio', 'Escudo + abajo'],
    ['Esquiva aérea (8 direcciones)', 'Escudo en el aire (+ dirección)'],
    ['Salir del escudo sin espera', 'Saltar'],
  ],
};

const ATTACKS: ControlsSection = {
  title: 'Ataques',
  columns: ['Qué', 'Cómo'],
  rows: [
    ['Jab (hasta 3 golpes)', 'Ligero sin dirección en el suelo; pulsa otra vez para encadenar'],
    ['Golpe lateral / arriba / abajo', 'Ligero + dirección en el suelo'],
    ['Aéreos', 'Ligero en el aire: sin dirección, adelante, atrás, arriba o abajo'],
    ['Fuertes', 'Fuerte + lado, arriba o abajo (mantén para cargar)'],
    ['Especial neutral', 'Especial sin arriba'],
    ['Especial arriba (volver al escenario)', 'Especial + arriba, una vez hasta tocar suelo'],
    ['Agarre', 'U (o escudo + ligero), cerca del rival; luego una dirección o ligero lo lanza'],
    ['Lanzar', 'Con el rival agarrado: adelante, atrás, arriba, abajo o ligero'],
  ],
  note: 'En el aire no te giras: adelante y atrás dependen de hacia dónde mirabas al saltar.',
};

const LEDGE: ControlsSection = {
  title: 'Colgado del borde',
  columns: ['Qué', 'Cómo'],
  rows: [
    ['Subir', 'Hacia el escenario'],
    ['Saltar', 'Saltar'],
    ['Subir atacando', 'Ligero o fuerte'],
    ['Rodar hacia dentro', 'Escudo'],
    ['Soltarse', 'Abajo o alejarse del escenario'],
  ],
};

const GAME_KEYS: ControlsSection = {
  title: 'Teclas del juego',
  columns: ['Tecla', 'Qué hace'],
  rows: [
    ['H', 'Abre o cierra este panel'],
    ['F1', 'Muestra hurtboxes (verde) y hitboxes (rojo)'],
    ['Enter, R o Start', 'Revancha al terminar'],
    ['Esc', 'Pausa: cambiar personaje, controles o salir'],
    ['R', 'Reiniciar (entrenamiento)'],
    ['8', 'El muñeco se cubre o no (entrenamiento)'],
    ['9 / 0', '−10 % / +10 % al muñeco (entrenamiento)'],
  ],
};

export const CONTROLS_SECTIONS: ControlsSection[] = [buttonsSection(), MOVEMENT, ATTACKS, LEDGE, GAME_KEYS];
