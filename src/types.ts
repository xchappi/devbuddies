// ── Raw events from VS Code API ──────────────────────────────────────

export type RawEventType =
  | 'terminal_output'
  | 'file_change'
  | 'file_create'
  | 'file_delete'
  | 'editor_focus'
  | 'chat_session';

export interface RawEvent {
  type: RawEventType;
  timestamp: number;
  uri?: string;
  content?: string;
  /** True if the file change happened in a non-active editor (likely agent edit) */
  isBackground?: boolean;
}

// ── Heuristic classification ─────────────────────────────────────────

export type Confidence = 'high' | 'medium' | 'low';

export type ActivityType = 'coding' | 'executing' | 'thinking' | 'idle';

export interface ClassifiedEvent {
  type: ActivityType;
  confidence: Confidence;
  evidence: string;
  timestamp: number;
  rawEvents: RawEvent[];
}

// ── Session lifecycle ────────────────────────────────────────────────

export interface Session {
  id: string;
  startTime: number;
  endTime?: number;
  lastActivityTime: number;
  activityType: ActivityType;
  actionCounts: Record<ActivityType, number>;
}

// ── Metrics ──────────────────────────────────────────────────────────

export interface DailyMetrics {
  date: string; // YYYY-MM-DD
  sessionCount: number;
  totalActiveSeconds: number;
  actionCounts: Record<ActivityType, number>;
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  hour: number; // 0-23
  activitySeconds: number;
  type: ActivityType;
}

// ── PostMessage protocol ─────────────────────────────────────────────

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
