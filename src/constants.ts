// ── Timing ────────────────────────────────────────────────────────────

/** Milliseconds of inactivity before ending a session (default, overridden by settings) */
export const DEFAULT_IDLE_TIMEOUT_MS = 120_000;

/** Milliseconds between metrics updates sent to webview */
export const METRICS_UPDATE_INTERVAL_MS = 30_000;

/** Milliseconds to wait before showing "no activity" overlay */
export const NO_ACTIVITY_DELAY_MS = 30_000;

/** Milliseconds window for burst edit detection */
export const BURST_WINDOW_MS = 500;

/** Minimum files changed in burst window to classify as high-confidence agent edit */
export const BURST_MIN_FILES = 3;

// ── Chat session polling ─────────────────────────────────────────────

/** Milliseconds between chat session directory polls */
export const CHAT_POLL_INTERVAL_MS = 5_000;

/** Glob pattern for Copilot chat session files (relative to workspaceStorage) */
export const CHAT_SESSION_GLOB = '**/chatSessions/**';

// ── Canvas / rendering ───────────────────────────────────────────────

/** Tile size in source pixels */
export const TILE_SIZE = 16;

/** Office grid dimensions (tiles) */
export const OFFICE_COLS = 20;
export const OFFICE_ROWS = 14;

/** Target game loop FPS */
export const TARGET_FPS = 30;

/** Max delta time (ms) to prevent spiral-of-death */
export const MAX_DELTA_MS = 100;

// ── Character animation ──────────────────────────────────────────────

/** Character walk speed in tiles per second */
export const WALK_SPEED = 2.5;

/** Animation frame duration in ms */
export const ANIM_FRAME_MS = 150;

/** Sprite dimensions in source pixels */
export const CHAR_WIDTH = 16;
export const CHAR_HEIGHT = 16;

// ── Desk positions (tile coordinates) for characters ─────────────────

export const DESK_POSITIONS = [
  { x: 4, y: 3 },
  { x: 8, y: 3 },
  { x: 12, y: 3 },
  { x: 16, y: 3 },
  { x: 4, y: 8 },
  { x: 8, y: 8 },
  { x: 12, y: 8 },
  { x: 16, y: 8 },
] as const;

// ── Storage keys ─────────────────────────────────────────────────────

export const STORAGE_KEY_METRICS = 'devbuddies.metrics';
export const STORAGE_KEY_SESSIONS = 'devbuddies.sessions';
