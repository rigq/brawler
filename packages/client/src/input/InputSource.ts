import { EMPTY_INPUT, type PlayerInput } from '@brawler/shared';

/** Anything that can say what one player is pressing right now. */
export interface InputSource {
  read(): PlayerInput;
}

/** Merges several sources (e.g. keyboard + gamepad): a button counts if any source presses it. */
export class CombinedInput implements InputSource {
  private readonly sources: InputSource[];

  constructor(sources: InputSource[]) {
    this.sources = sources;
  }

  read(): PlayerInput {
    const merged: PlayerInput = { ...EMPTY_INPUT };
    for (const source of this.sources) {
      const input = source.read();
      for (const action of Object.keys(merged) as (keyof PlayerInput)[]) {
        merged[action] ||= input[action];
      }
    }
    return merged;
  }
}
