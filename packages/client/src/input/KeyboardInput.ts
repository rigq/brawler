import Phaser from 'phaser';
import type { PlayerInput } from '@brawler/shared';
import type { InputSource } from './InputSource.ts';

const Key = Phaser.Input.Keyboard.KeyCodes;

/** Which keys drive one player. Each action accepts several keys. */
export type KeyBindings = Record<keyof PlayerInput, number[]>;

/**
 * P1: WASD to move and aim, Space to jump, J (light), K (heavy), L (shield/dodge), I (special).
 * Jump is not on W: with W as both "up" and "jump", pressing W a moment before
 * J jumped and gave the up aerial instead of the up tilt.
 * When two share one keyboard, J/K/L sit under P2's hand, so P1 can use C, V
 * and B (or Shift) instead: both sets always work.
 */
export const P1_BINDINGS: KeyBindings = {
  left: [Key.A],
  right: [Key.D],
  up: [Key.W],
  down: [Key.S],
  jump: [Key.SPACE],
  dodge: [Key.L, Key.B, Key.SHIFT],
  light: [Key.J, Key.C],
  heavy: [Key.K, Key.V],
  special: [Key.I, Key.X],
};

/** P2: arrows to move and aim, M to jump (next to , . -), so ↑ is only a direction. N is the special. */
export const P2_BINDINGS: KeyBindings = {
  left: [Key.LEFT],
  right: [Key.RIGHT],
  up: [Key.UP],
  down: [Key.DOWN],
  jump: [Key.M, Key.NUMPAD_ZERO],
  // MINUS is the "-" key next to the period on Spanish keyboards; "/" on US ones.
  dodge: [Key.MINUS, Key.FORWARD_SLASH, Key.NUMPAD_THREE],
  light: [Key.COMMA, Key.NUMPAD_ONE],
  heavy: [Key.PERIOD, Key.NUMPAD_TWO],
  special: [Key.N, Key.NUMPAD_FOUR],
};

/** Reads the keyboard once per render frame and turns it into a PlayerInput. */
export class KeyboardInput implements InputSource {
  private readonly keys: [keyof PlayerInput, Phaser.Input.Keyboard.Key[]][];

  constructor(keyboard: Phaser.Input.Keyboard.KeyboardPlugin, bindings: KeyBindings) {
    this.keys = (Object.keys(bindings) as (keyof PlayerInput)[]).map((action) => [
      action,
      bindings[action].map((code) => keyboard.addKey(code)),
    ]);
  }

  read(): PlayerInput {
    const input = {} as PlayerInput;
    for (const [action, keys] of this.keys) {
      input[action] = keys.some((key) => key.isDown);
    }
    return input;
  }
}
