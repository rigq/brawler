/**
 * What one player is pressing during one simulation step.
 * The simulation only ever sees this, never raw keys or positions,
 * so the server can run it with inputs received over the network.
 */
export interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  /** Dash on the ground with a direction, dodge otherwise. */
  dodge: boolean;
}

export const EMPTY_INPUT: Readonly<PlayerInput> = {
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  dodge: false,
};
