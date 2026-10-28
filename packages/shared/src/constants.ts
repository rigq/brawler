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
/**
 * Where each player appears (top-left of the player box), one per player.
 * Centred above each floating platform, so they drop onto it, facing each other.
 */
export const SPAWNS = [
  { x: 420, y: 300, facing: 1 },
  { x: 820, y: 300, facing: -1 },
] as const;
/**
 * Death zone edges: a player whose box leaves this area is knocked out.
 * The stage spans x 240–1040; there is room to be launched and recover.
 */
export const BLAST_ZONE = { left: -360, right: 1640, top: -420, bottom: WORLD_HEIGHT + 300 } as const;

// --- Lives ---
/** Lives per player. Losing the last one puts you out of the match. */
export const STOCKS = 3;
/** Ticks a knocked-out player waits, off screen, before reappearing (1 s). */
export const RESPAWN_DELAY_TICKS = 60;
/** Ticks of invulnerability after reappearing (2 s). Attacking ends it early. */
export const RESPAWN_INVULN_TICKS = 120;

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

// --- Combat: light attacks ---
/**
 * Each attack goes through three phases, in ticks (60 = 1 s):
 * startup (winding up, harmless) → active (hitbox can hit) → recovery (harmless, can't act).
 * `box`: hitbox relative to the player's top-left corner when facing right
 * (mirrored when facing left). The player box is 40×60.
 * `damage`: % added to the target.
 * Knockback speed (px/s) = kbBase + kbScale × target's damage after the hit.
 * (kbX, kbY): launch direction, x pointing away from the attacker, y up = negative.
 * Any length works, it is normalised. Vectors, not angles: sin/cos are not deterministic.
 */
export const LIGHT_ATTACKS = {
  /** Jab in front. Also used with no direction held. */
  side: {
    startup: 5, active: 3, recovery: 10, box: { x: 40, y: 14, width: 52, height: 26 },
    damage: 6, kbBase: 320, kbScale: 7, kbX: 1, kbY: -0.45,
  },
  /** Arc above the head. */
  up: {
    startup: 6, active: 4, recovery: 12, box: { x: -12, y: -48, width: 64, height: 52 },
    damage: 6, kbBase: 340, kbScale: 7, kbX: 0.2, kbY: -1,
  },
  /** Low swipe covering the feet and below (useful in the air). */
  down: {
    startup: 6, active: 3, recovery: 14, box: { x: 8, y: 40, width: 62, height: 40 },
    damage: 5, kbBase: 300, kbScale: 6, kbX: 1, kbY: -0.6,
  },
} as const;

// --- Combat: heavy attacks ---
/**
 * Same shape as LIGHT_ATTACKS, but slower, with more reach and harder hits.
 * Before startup there is a charge phase while the button is held.
 */
export const HEAVY_ATTACKS = {
  /** Long reach in front. */
  side: {
    startup: 10, active: 5, recovery: 22, box: { x: 36, y: 8, width: 92, height: 36 },
    damage: 13, kbBase: 480, kbScale: 13, kbX: 1, kbY: -0.5,
  },
  /** Big arc above, a bit to both sides. */
  up: {
    startup: 11, active: 6, recovery: 24, box: { x: -28, y: -82, width: 96, height: 86 },
    damage: 12, kbBase: 500, kbScale: 12, kbX: 0.25, kbY: -1,
  },
  /** Ground-level sweep reaching both sides. */
  down: {
    startup: 12, active: 5, recovery: 26, box: { x: -46, y: 30, width: 132, height: 44 },
    damage: 11, kbBase: 460, kbScale: 12, kbX: 1, kbY: -0.7,
  },
} as const;
/** Holding heavy charges for at most this long (~0.6 s), then it fires on its own. */
export const HEAVY_MAX_CHARGE_TICKS = 36;
/** A fully charged heavy deals (1 + this) × damage and knockback; scales linearly with charge. */
export const HEAVY_CHARGE_BONUS = 0.4;

// --- Combat: getting hit ---
/** Launch speed cap. Keeps a step under ~60 px so nobody tunnels through platforms. */
export const KNOCKBACK_MAX_SPEED = 3600;
/** Hitstun (no control) = base + knockback speed × this, in ticks. 1000 px/s ≈ 18 ticks. */
export const HITSTUN_BASE_TICKS = 6;
export const HITSTUN_TICKS_PER_SPEED = 0.012;
/** How fast horizontal launch speed fades during hitstun (px/s²). Low = flies further. */
export const HITSTUN_DRAG = 900;
/** How long a player flashes white after being hit (visual only). */
export const HIT_FLASH_TICKS = 8;

// --- Camera (render only: the simulation never reads these) ---
/** Empty space kept around the players' bounding box, in world px. */
export const CAMERA_PADDING_X = 280;
export const CAMERA_PADDING_Y = 200;
/** Zoom range. < 1 shows more than the 1280×720 stage, > 1 zooms in. */
export const CAMERA_MIN_ZOOM = 0.75;
export const CAMERA_MAX_ZOOM = 1.35;
/**
 * Smoothing time constant in ms: after this long the camera has covered ~63 %
 * of the way to its target. Lower = snappier, higher = floatier.
 */
export const CAMERA_SMOOTH_MS = 140;
/** The camera never shows anything outside this area. */
export const CAMERA_BOUNDS = { x: -400, y: -300, width: 2080, height: 1400 } as const;

// --- Network ---
/** Port the game server listens on (WebSocket + HTTP). */
export const SERVER_PORT = 2567;
/** How often the server sends state patches to clients (the plan says 20–30 Hz). */
export const PATCH_RATE_HZ = 30;
/**
 * Inputs the server keeps queued per player. A few absorb network jitter;
 * more would only add delay, so older ones are dropped beyond this (~100 ms).
 */
export const INPUT_BUFFER_MAX = 6;
/** A client sending more messages than this per second is disconnected (it sends ~60). */
export const MAX_MESSAGES_PER_SECOND = 120;
/**
 * When a client's inputs stop arriving, the server repeats its last input for
 * at most this many ticks (~0.15 s), then treats it as nothing pressed.
 */
export const INPUT_HOLD_MAX_TICKS = 10;

// --- Client prediction (render side: the simulation never reads these) ---
/** Inputs sent but not yet confirmed by the server, kept for replay (~2 s). Older ones are dropped. */
export const MAX_PENDING_INPUTS = 120;
/**
 * When the server corrects your predicted position, the visible difference is
 * faded out with this time constant (ms) instead of snapping. Lower = snappier.
 */
export const RECONCILE_SMOOTH_MS = 80;
/** Corrections bigger than this (px) snap at once: a KO, a respawn, a big hit. */
export const RECONCILE_SNAP_DISTANCE = 160;

// --- Rival interpolation (render side) ---
/**
 * Other players are drawn this far in the past (ms), between two states that
 * already arrived. Must cover the gap between patches (33 ms at 30 Hz) plus
 * network jitter; the plan says ~100 ms.
 */
export const INTERP_DELAY_MS = 100;
/** How much past state is kept for interpolation (ms). */
export const SNAPSHOT_BUFFER_MS = 1000;
/**
 * The client's estimate of the server tick drifts towards each received tick by
 * this fraction, so jittery arrivals don't make the rival stutter.
 */
export const SERVER_CLOCK_CORRECTION = 0.1;
/** If the estimate is off by more than this many ticks (tab was in background), it jumps. */
export const SERVER_CLOCK_SNAP_TICKS = 15;
/** A player whose connection drops keeps their seat this long (s); the match pauses meanwhile. */
export const RECONNECT_GRACE_SECONDS = 20;
