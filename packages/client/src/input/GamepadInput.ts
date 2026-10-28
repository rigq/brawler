import Phaser from 'phaser';
import { EMPTY_INPUT, type PlayerInput } from '@brawler/shared';
import type { InputSource } from './InputSource.ts';

/** How far the stick must be pushed (0–1) to count as a direction. */
const STICK_DEADZONE = 0.5;

/** Button indices in the browser's "standard" gamepad layout (Xbox names). */
const Button = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
} as const;

/**
 * Optional controller for one player. Browsers only report a pad after
 * one of its buttons has been pressed; until then this reads as nothing pressed.
 */
export class GamepadInput implements InputSource {
  private readonly plugin: Phaser.Input.Gamepad.GamepadPlugin;
  private readonly padIndex: number;

  constructor(plugin: Phaser.Input.Gamepad.GamepadPlugin, padIndex: number) {
    this.plugin = plugin;
    this.padIndex = padIndex;
  }

  read(): PlayerInput {
    const pad = this.plugin.getPad(this.padIndex);
    if (!pad) return { ...EMPTY_INPUT };

    const pressed = (...indices: number[]) => indices.some((i) => pad.buttons[i]?.pressed ?? false);
    const stick = pad.leftStick;
    return {
      left: stick.x < -STICK_DEADZONE || pressed(Button.DPAD_LEFT),
      right: stick.x > STICK_DEADZONE || pressed(Button.DPAD_RIGHT),
      up: stick.y < -STICK_DEADZONE || pressed(Button.DPAD_UP),
      down: stick.y > STICK_DEADZONE || pressed(Button.DPAD_DOWN),
      jump: pressed(Button.A),
      dodge: pressed(Button.LB, Button.RB, Button.LT, Button.RT),
      light: pressed(Button.X),
      heavy: pressed(Button.B, Button.Y),
    };
  }
}
