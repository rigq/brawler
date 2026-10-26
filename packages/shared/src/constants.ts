// Every tunable number in the game lives here. Units: world pixels and seconds,
// unless the name says otherwise (e.g. `_MS`).

// --- Simulation clock ---
/** Fixed simulation rate. Client and server must step at exactly this rate. */
export const SIM_HZ = 60;
/** Length of one simulation step, in seconds (use this in physics). */
export const FIXED_DT = 1 / SIM_HZ;
/** Length of one simulation step, in milliseconds (use this in the loop). */
export const FIXED_DT_MS = 1000 / SIM_HZ;
/**
 * Longest frame the loop will try to catch up on. After a tab switch or a
 * breakpoint the frame can be seconds long; without a cap the loop would run
 * hundreds of steps at once and freeze ("spiral of death").
 */
export const MAX_FRAME_MS = 250;

// --- World ---
export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;

// --- Stage ---
/** Main platform. (x, y) is its top-left corner. */
export const GROUND = {
  x: 240,
  y: 560,
  width: 800,
  height: 40,
} as const;
/**
 * Floating one-way platforms: you can jump up through them and land on top.
 * Their top sits 130 px above the ground, within a single jump (~160 px).
 */
export const PLATFORMS = [
  { x: 330, y: 430, width: 220, height: 16 },
  { x: 730, y: 430, width: 220, height: 16 },
] as const;
/** How many steps you ignore platforms after pressing down on one (~0.2 s). */
export const DROP_THROUGH_TICKS = 12;
/** Where player 1 appears (top-left of the player box). */
export const SPAWN_P1 = { x: 620, y: 300 } as const;
/**
 * Temporary until F2.4 (death zone): falling this far below the screen
 * puts the player back at spawn.
 */
export const FALL_RESET_Y = WORLD_HEIGHT + 300;

// --- Player body ---
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 60;

// --- Running (px/s and px/s²) ---
/** Top horizontal speed. */
export const RUN_SPEED = 420;
/** How fast you reach RUN_SPEED on the ground. Higher = snappier. */
export const GROUND_ACCEL = 3600;
/** How fast you stop on the ground when no direction is held. */
export const GROUND_FRICTION = 4200;
/** Horizontal control in the air while holding a direction. */
export const AIR_ACCEL = 2000;
/** How fast horizontal speed fades in the air with no direction held. */
export const AIR_DRAG = 600;

// --- Jumping and gravity (px/s and px/s²) ---
export const GRAVITY = 2400;
/** Initial upward speed. Jump height = JUMP_SPEED² / (2 · GRAVITY) ≈ 169 px. */
export const JUMP_SPEED = 900;
/** Releasing jump while rising multiplies vy by this: short tap = short hop. */
export const JUMP_CUT = 0.45;
/** Terminal falling speed. */
export const MAX_FALL_SPEED = 1300;
/** Extra jumps available in the air; refilled on landing. */
export const AIR_JUMPS = 1;
/** Upward speed of an air jump. Height ≈ 820² / (2 · 2400) ≈ 140 px. */
export const DOUBLE_JUMP_SPEED = 820;
/**
 * Holding down in the air once you start falling snaps to this speed.
 * Must stay below ~60 px/step (3600 px/s) or bodies could skip thin platforms.
 */
export const FAST_FALL_SPEED = 1600;

// --- Dash and dodge (durations and cooldowns in simulation ticks, 60 = 1 s) ---
/** Ground dash: burst of horizontal speed. Distance ≈ 1000 · 10/60 ≈ 167 px. */
export const DASH_SPEED = 1000;
export const DASH_TICKS = 10;
/** Wait after a dash ends before the next dash or dodge. */
export const DASH_COOLDOWN_TICKS = 30;
/** Dodge in place on the ground (no direction held). Invulnerable. */
export const SPOT_DODGE_TICKS = 18;
/** Air dodge in the held direction (8 ways), gravity off. Invulnerable. */
export const AIR_DODGE_SPEED = 750;
export const AIR_DODGE_TICKS = 14;
/** Velocity kept when an air dodge ends (0 = full stop, 1 = keep all). */
export const AIR_DODGE_END_SPEED_MULT = 0.35;
/** Wait after a spot or air dodge ends before the next dash or dodge. */
export const DODGE_COOLDOWN_TICKS = 54;
