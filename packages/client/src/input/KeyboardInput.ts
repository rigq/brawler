import Phaser from 'phaser';
import type { PlayerInput } from '@brawler/shared';
import type { InputSource } from './InputSource.ts';

const Key = Phaser.Input.Keyboard.KeyCodes;

/** Which keys drive one player. Each action accepts several keys. */
export type KeyBindings = Record<keyof PlayerInput, number[]>;

/** Two players share one keyboard: P1 uses the left half, P2 the right half. */
export const P1_BINDINGS: KeyBindings = {
  left: [Key.A],
  right: [Key.D],
  up: [Key.W],
  down: [Key.S],
  jump: [Key.W, Key.SPACE],
  dodge: [Key.B, Key.SHIFT],
  light: [Key.C],
  heavy: [Key.V],
};

export const P2_BINDINGS: KeyBindings = {
  left: [Key.LEFT],
  right: [Key.RIGHT],
  up: [Key.UP],
  down: [Key.DOWN],
  jump: [Key.UP],
  // MINUS is the "-" key next to the period on Spanish keyboards; "/" on US ones.
  dodge: [Key.MINUS, Key.FORWARD_SLASH, Key.NUMPAD_THREE],
  light: [Key.COMMA, Key.NUMPAD_ONE],
  heavy: [Key.PERIOD, Key.NUMPAD_TWO],
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
