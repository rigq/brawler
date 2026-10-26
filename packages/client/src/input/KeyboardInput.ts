import Phaser from 'phaser';
import type { PlayerInput } from '@brawler/shared';

const Key = Phaser.Input.Keyboard.KeyCodes;

/** Which keys drive one player. Each action accepts several keys. */
export interface KeyBindings {
  left: number[];
  right: number[];
  up: number[];
  down: number[];
  jump: number[];
  dodge: number[];
}

export const P1_BINDINGS: KeyBindings = {
  left: [Key.A],
  right: [Key.D],
  up: [Key.W],
  down: [Key.S],
  jump: [Key.W, Key.SPACE],
  dodge: [Key.L, Key.SHIFT],
};

/** Reads the keyboard once per render frame and turns it into a PlayerInput. */
export class KeyboardInput {
  private readonly keys: Record<keyof KeyBindings, Phaser.Input.Keyboard.Key[]>;

  constructor(keyboard: Phaser.Input.Keyboard.KeyboardPlugin, bindings: KeyBindings) {
    const toKeys = (codes: number[]) => codes.map((code) => keyboard.addKey(code));
    this.keys = {
      left: toKeys(bindings.left),
      right: toKeys(bindings.right),
      up: toKeys(bindings.up),
      down: toKeys(bindings.down),
      jump: toKeys(bindings.jump),
      dodge: toKeys(bindings.dodge),
    };
  }

  read(): PlayerInput {
    const isDown = (keys: Phaser.Input.Keyboard.Key[]) => keys.some((key) => key.isDown);
    return {
      left: isDown(this.keys.left),
      right: isDown(this.keys.right),
      up: isDown(this.keys.up),
      down: isDown(this.keys.down),
      jump: isDown(this.keys.jump),
      dodge: isDown(this.keys.dodge),
    };
  }
}
