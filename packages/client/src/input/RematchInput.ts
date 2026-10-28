import Phaser from 'phaser';

/** "Start" on the browser's standard gamepad layout. */
const GAMEPAD_START = 9;

/**
 * Calls `onRematch` when Enter or R is pressed, or Start on any gamepad.
 * The scene decides whether a rematch is allowed right now.
 */
export class RematchInput {
  constructor(scene: Phaser.Scene, onRematch: () => void) {
    const keyboard = scene.input.keyboard;
    const keys = [Phaser.Input.Keyboard.KeyCodes.ENTER, Phaser.Input.Keyboard.KeyCodes.R].map((code) =>
      keyboard?.addKey(code),
    );
    for (const key of keys) key?.on('down', onRematch);

    const onPadButton = (_pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button) => {
      if (button.index === GAMEPAD_START) onRematch();
    };
    scene.input.gamepad?.on('down', onPadButton);

    // Avoid duplicate listeners if the scene is ever restarted.
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const key of keys) key?.off('down', onRematch);
      scene.input.gamepad?.off('down', onPadButton);
    });
  }
}
