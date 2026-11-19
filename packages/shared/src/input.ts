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
  /** Shield on the ground (with a direction: roll; down: spot dodge), air dodge in the air. */
  dodge: boolean;
  /** Light attack; up/down held pick its direction, otherwise it goes sideways. */
  light: boolean;
  /** Heavy attack: hold to charge, release to strike. Direction works like light. */
  heavy: boolean;
  /** Special: up for the up special (recovery), otherwise the neutral special. */
  special: boolean;
  /** Grab on its own button (shield + light still works too). */
  grab: boolean;
  /** Taunt (on the ground, standing still): about a second showing off, wide open. */
  taunt: boolean;
}

export const EMPTY_INPUT: Readonly<PlayerInput> = {
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  dodge: false,
  light: false,
  heavy: false,
  special: false,
  grab: false,
  taunt: false,
};
