import * as vscode from 'vscode';
import { CopilotMonitor } from './copilotMonitor';
import { ActivityHeuristics } from './activityHeuristics';
import { SessionTracker } from './sessionTracker';
import { MetricsCollector } from './metricsCollector';
import { DevBuddiesViewProvider } from './DevBuddiesViewProvider';
import { NO_ACTIVITY_DELAY_MS } from './constants';

export function activate(context: vscode.ExtensionContext): void {
  const config = vscode.workspace.getConfiguration('devbuddies');

  // ── Core components ────────────────────────────────────────────────
  const monitor = new CopilotMonitor();
  const heuristics = new ActivityHeuristics();
  const metrics = new MetricsCollector(context.globalState);
  const viewProvider = new DevBuddiesViewProvider(context.extensionUri);

  const idleTimeoutMs = (config.get<number>('idleTimeoutSeconds') ?? 120) * 1000;

  const sessionTracker = new SessionTracker(
    {
      onSessionCreated(session) {
        metrics.recordSessionStart(session);
        viewProvider.postMessage({
          type: 'sessionCreated',
          id: session.id,
          startTime: session.startTime,
        });
        clearNoActivityTimer();
      },
      onSessionUpdated(session) {
        viewProvider.postMessage({
          type: 'agentActivity',
          id: session.id,
          activityType: session.activityType,
        });
      },
      onSessionEnded(session) {
        metrics.recordSessionEnd(session);
        viewProvider.postMessage({
          type: 'sessionEnded',
          id: session.id,
          endTime: session.endTime!,
        });
        startNoActivityTimer();
      },
    },
    idleTimeoutMs,
  );

  // ── No-activity timer ──────────────────────────────────────────────
  let noActivityTimer: ReturnType<typeof setTimeout> | undefined;

  function startNoActivityTimer(): void {
    clearNoActivityTimer();
    noActivityTimer = setTimeout(() => {
      viewProvider.postMessage({ type: 'noActivityDetected' });
    }, NO_ACTIVITY_DELAY_MS);
  }

  function clearNoActivityTimer(): void {
    if (noActivityTimer) {
      clearTimeout(noActivityTimer);
      noActivityTimer = undefined;
    }
  }

  // ── Wire pipeline: Monitor → Heuristics → SessionTracker ──────────
  monitor.onRawEvent((rawEvent) => {
    const classified = heuristics.classify(rawEvent);
    sessionTracker.handleClassifiedEvent(classified);
  });

  // ── Metrics → Webview updates ──────────────────────────────────────
  metrics.onMetricsUpdate((m) => {
    viewProvider.postMessage({ type: 'metricsUpdate', metrics: m });
  });

  // ── Webview message handling ───────────────────────────────────────
  viewProvider.onMessage((msg) => {
    switch (msg.type) {
      case 'webviewReady': {
        const sound = config.get<boolean>('soundEnabled') ?? true;
        const zoom = config.get<number>('zoomLevel') ?? 2;
        viewProvider.postMessage({ type: 'settingsLoaded', sound, zoom });
        viewProvider.postMessage({
          type: 'metricsUpdate',
          metrics: metrics.getMetrics(),
        });

        // If there's an active session, send its state
        const current = sessionTracker.getCurrentSession();
        if (current) {
          viewProvider.postMessage({
            type: 'sessionCreated',
            id: current.id,
            startTime: current.startTime,
          });
          viewProvider.postMessage({
            type: 'agentActivity',
            id: current.id,
            activityType: current.activityType,
          });
        } else {
          startNoActivityTimer();
        }
        break;
      }
      case 'setSoundEnabled':
        void config.update(
          'soundEnabled',
          msg.enabled,
          vscode.ConfigurationTarget.Global,
        );
        break;
      case 'setZoomLevel':
        void config.update(
          'zoomLevel',
          msg.level,
          vscode.ConfigurationTarget.Global,
        );
        break;
    }
  });

  // ── Register view provider ─────────────────────────────────────────
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      DevBuddiesViewProvider.viewType,
      viewProvider,
    ),
  );

  // ── Commands ───────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('devbuddies.togglePanel', () => {
      void vscode.commands.executeCommand('devbuddies.officeView.focus');
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('devbuddies.resetStats', () => {
      metrics.reset();
      sessionTracker.endCurrentSession();
      void vscode.window.showInformationMessage(
        'DevBuddies: Statistics reset.',
      );
    }),
  );

  // ── Configuration change listener ──────────────────────────────────
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('devbuddies.idleTimeoutSeconds')) {
        const newTimeout =
          (vscode.workspace
            .getConfiguration('devbuddies')
            .get<number>('idleTimeoutSeconds') ?? 120) * 1000;
        sessionTracker.setIdleTimeout(newTimeout);
      }
    }),
  );

  // ── Start monitoring ───────────────────────────────────────────────
  monitor.start();
  startNoActivityTimer();

  // ── Cleanup ────────────────────────────────────────────────────────
  context.subscriptions.push(monitor, metrics);
  context.subscriptions.push({
    dispose() {
      sessionTracker.dispose();
      clearNoActivityTimer();
    },
  });
}

export function deactivate(): void {
  // Disposables registered on context.subscriptions are cleaned up automatically
}
