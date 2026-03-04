import { ClassifiedEvent, Session, ActivityType } from './types';
import { DEFAULT_IDLE_TIMEOUT_MS } from './constants';

export interface SessionEvents {
  onSessionCreated(session: Session): void;
  onSessionUpdated(session: Session): void;
  onSessionEnded(session: Session): void;
}

export class SessionTracker {
  private currentSession: Session | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | undefined;
  private idleTimeoutMs: number;
  private readonly callbacks: SessionEvents;
  private sessionCounter = 0;

  constructor(callbacks: SessionEvents, idleTimeoutMs?: number) {
    this.callbacks = callbacks;
    this.idleTimeoutMs = idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
  }

  setIdleTimeout(ms: number): void {
    this.idleTimeoutMs = ms;
  }

  handleClassifiedEvent(event: ClassifiedEvent): void {
    // Only start/update sessions for high or medium confidence events
    if (event.confidence === 'low') return;

    if (!this.currentSession) {
      this.startSession(event);
    } else {
      this.updateSession(event);
    }

    this.resetIdleTimer();
  }

  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  endCurrentSession(): void {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.callbacks.onSessionEnded(this.currentSession);
      this.currentSession = null;
    }
    this.clearIdleTimer();
  }

  dispose(): void {
    this.clearIdleTimer();
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.currentSession = null;
    }
  }

  private startSession(event: ClassifiedEvent): void {
    this.sessionCounter++;
    this.currentSession = {
      id: `session-${Date.now()}-${this.sessionCounter}`,
      startTime: event.timestamp,
      lastActivityTime: event.timestamp,
      activityType: event.type,
      actionCounts: { coding: 0, executing: 0, thinking: 0, idle: 0 },
    };
    this.currentSession.actionCounts[event.type]++;
    this.callbacks.onSessionCreated(this.currentSession);
  }

  private updateSession(event: ClassifiedEvent): void {
    if (!this.currentSession) return;

    const prevType = this.currentSession.activityType;
    this.currentSession.lastActivityTime = event.timestamp;
    this.currentSession.activityType = event.type;
    this.currentSession.actionCounts[event.type]++;

    if (prevType !== event.type) {
      this.callbacks.onSessionUpdated(this.currentSession);
    }
  }

  private resetIdleTimer(): void {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      this.endCurrentSession();
    }, this.idleTimeoutMs);
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }
  }
}
