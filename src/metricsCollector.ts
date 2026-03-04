import * as vscode from 'vscode';
import { DailyMetrics, Session, ActivityType, TimelineEntry } from './types';
import {
  METRICS_UPDATE_INTERVAL_MS,
  STORAGE_KEY_METRICS,
} from './constants';

export type MetricsUpdateListener = (metrics: DailyMetrics) => void;

export class MetricsCollector implements vscode.Disposable {
  private metrics: DailyMetrics;
  private readonly listeners: MetricsUpdateListener[] = [];
  private updateTimer: ReturnType<typeof setInterval> | undefined;
  private readonly globalState: vscode.Memento;

  constructor(globalState: vscode.Memento) {
    this.globalState = globalState;
    this.metrics = this.loadOrCreateToday();
    this.startPeriodicUpdates();
  }

  onMetricsUpdate(listener: MetricsUpdateListener): void {
    this.listeners.push(listener);
  }

  recordSessionStart(_session: Session): void {
    this.ensureToday();
    this.metrics.sessionCount++;
    this.persist();
  }

  recordSessionEnd(session: Session): void {
    this.ensureToday();
    const durationSec = Math.round(
      ((session.endTime ?? Date.now()) - session.startTime) / 1000,
    );
    this.metrics.totalActiveSeconds += durationSec;

    // Merge action counts
    for (const key of Object.keys(session.actionCounts) as ActivityType[]) {
      this.metrics.actionCounts[key] += session.actionCounts[key];
    }

    // Update timeline
    this.addTimelineEntry(session);
    this.persist();
  }

  recordActivity(type: ActivityType): void {
    this.ensureToday();
    this.metrics.actionCounts[type]++;
    this.persist();
  }

  getMetrics(): DailyMetrics {
    this.ensureToday();
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = this.createEmptyMetrics();
    this.persist();
    this.notifyListeners();
  }

  dispose(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    this.persist();
    this.listeners.length = 0;
  }

  private startPeriodicUpdates(): void {
    this.updateTimer = setInterval(() => {
      this.notifyListeners();
    }, METRICS_UPDATE_INTERVAL_MS);
  }

  private notifyListeners(): void {
    const snapshot = this.getMetrics();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private addTimelineEntry(session: Session): void {
    const startHour = new Date(session.startTime).getHours();
    const durationSec = Math.round(
      ((session.endTime ?? Date.now()) - session.startTime) / 1000,
    );

    const existing = this.metrics.timeline.find(
      (e) => e.hour === startHour && e.type === session.activityType,
    );
    if (existing) {
      existing.activitySeconds += durationSec;
    } else {
      this.metrics.timeline.push({
        hour: startHour,
        activitySeconds: durationSec,
        type: session.activityType,
      });
    }
  }

  private ensureToday(): void {
    const today = this.todayKey();
    if (this.metrics.date !== today) {
      this.persist();
      this.metrics = this.createEmptyMetrics();
    }
  }

  private loadOrCreateToday(): DailyMetrics {
    const stored = this.globalState.get<DailyMetrics>(STORAGE_KEY_METRICS);
    if (stored && stored.date === this.todayKey()) {
      return stored;
    }
    return this.createEmptyMetrics();
  }

  private createEmptyMetrics(): DailyMetrics {
    return {
      date: this.todayKey(),
      sessionCount: 0,
      totalActiveSeconds: 0,
      actionCounts: { coding: 0, executing: 0, thinking: 0, idle: 0 },
      timeline: [],
    };
  }

  private persist(): void {
    void this.globalState.update(STORAGE_KEY_METRICS, this.metrics);
  }

  private todayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
