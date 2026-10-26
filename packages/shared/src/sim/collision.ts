import { FIXED_DT } from '../constants.ts';
import { overlaps, type Rect } from '../math/rect.ts';

/** Anything that moves and collides with the stage. */
export interface Body extends Rect {
  vx: number;
  vy: number;
  /** True if the body ended the last step standing on a solid or a platform. */
  grounded: boolean;
  /** True if what it stands on is a one-way platform (so it can drop through). */
  onPlatform: boolean;
}

export interface StageGeometry {
  /** Block from every side. */
  solids: readonly Rect[];
  /** One-way: only block a body falling onto their top edge. */
  platforms: readonly Rect[];
}

/**
 * Moves the body by its velocity for one step and pushes it out of the stage.
 * X and Y are resolved separately: that way we always know which side we hit
 * (a wall stops vx, a floor or ceiling stops vy).
 */
export function moveAndCollide(body: Body, stage: StageGeometry, ignorePlatforms: boolean): void {
  moveX(body, stage.solids);
  moveY(body, stage, ignorePlatforms);
}

function moveX(body: Body, solids: readonly Rect[]): void {
  body.x += body.vx * FIXED_DT;
  for (const solid of solids) {
    if (!overlaps(body, solid)) continue;
    body.x = body.vx > 0 ? solid.x - body.width : solid.x + solid.width;
    body.vx = 0;
  }
}

function moveY(body: Body, stage: StageGeometry, ignorePlatforms: boolean): void {
  const prevBottom = body.y + body.height;
  body.y += body.vy * FIXED_DT;
  body.grounded = false;
  body.onPlatform = false;

  for (const solid of stage.solids) {
    if (!overlaps(body, solid)) continue;
    if (body.vy > 0) {
      landOn(body, solid);
    } else {
      body.y = solid.y + solid.height;
    }
    body.vy = 0;
  }

  if (ignorePlatforms || body.vy <= 0) return;
  for (const platform of stage.platforms) {
    // Only land if our feet were above the platform's top before this step.
    if (prevBottom > platform.y || !overlaps(body, platform)) continue;
    landOn(body, platform);
    body.onPlatform = true;
    body.vy = 0;
  }
}

function landOn(body: Body, surface: Rect): void {
  body.y = surface.y - body.height;
  body.grounded = true;
}
