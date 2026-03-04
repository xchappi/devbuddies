// ── Re-export message types (mirrored from extension for webview use) ──

export type ActivityType = 'coding' | 'executing' | 'thinking' | 'idle';

export type ExtensionToWebviewMessage =
  | { type: 'sessionCreated'; id: string; startTime: number }
  | { type: 'sessionEnded'; id: string; endTime: number }
  | { type: 'agentActivity'; id: string; activityType: ActivityType; evidence?: string }
  | { type: 'metricsUpdate'; metrics: DailyMetrics }
  | { type: 'settingsLoaded'; sound: boolean; zoom: number }
  | { type: 'noActivityDetected' }
  | { type: 'assetsUri'; baseUri: string };

export type WebviewToExtensionMessage =
  | { type: 'webviewReady' }
  | { type: 'setSoundEnabled'; enabled: boolean }
  | { type: 'setZoomLevel'; level: number };

export interface DailyMetrics {
  date: string;
  sessionCount: number;
  totalActiveSeconds: number;
  actionCounts: Record<ActivityType, number>;
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  hour: number;
  activitySeconds: number;
  type: ActivityType;
}

// ── Character state machine ──────────────────────────────────────────

export type CharacterState = 'idle' | 'walking' | 'typing' | 'executing' | 'celebrating';

export interface Character {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: CharacterState;
  animFrame: number;
  animTimer: number;
  deskIndex: number;
  direction: 'left' | 'right';
  path: Array<{ x: number; y: number }>;
  pathIndex: number;
}

// ── Office layout ────────────────────────────────────────────────────

export type TileType = 'floor' | 'wall' | 'desk' | 'chair' | 'plant' | 'computer';

export interface Tile {
  type: TileType;
  walkable: boolean;
  spriteX: number;
  spriteY: number;
}
