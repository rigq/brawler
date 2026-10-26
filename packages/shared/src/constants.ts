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
