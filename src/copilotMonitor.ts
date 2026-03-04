import * as vscode from 'vscode';
import { RawEvent } from './types';
import { CHAT_POLL_INTERVAL_MS, CHAT_SESSION_GLOB } from './constants';

export type RawEventListener = (event: RawEvent) => void;

export class CopilotMonitor implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  private readonly listeners: RawEventListener[] = [];
  private chatPollTimer: ReturnType<typeof setInterval> | undefined;
  private knownChatFiles = new Set<string>();

  start(): void {
    // Terminal output detection (proposed API — may not be available)
    const windowAny = vscode.window as any;
    if (typeof windowAny.onDidWriteTerminalData === 'function') {
      this.disposables.push(
        windowAny.onDidWriteTerminalData((e: { data: string }) => {
          this.emit({
            type: 'terminal_output',
            timestamp: Date.now(),
            content: e.data,
          });
        }),
      );
    }

    // Fallback: detect terminal shell execution start/end
    if (vscode.window.onDidStartTerminalShellExecution) {
      this.disposables.push(
        vscode.window.onDidStartTerminalShellExecution(() => {
          this.emit({
            type: 'terminal_output',
            timestamp: Date.now(),
            content: '[shell execution started]',
          });
        }),
      );
    }
    if (vscode.window.onDidEndTerminalShellExecution) {
      this.disposables.push(
        vscode.window.onDidEndTerminalShellExecution(() => {
          this.emit({
            type: 'terminal_output',
            timestamp: Date.now(),
            content: '[shell execution ended]',
          });
        }),
      );
    }

    // File edit detection
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document.uri.scheme !== 'file') return;
        if (e.contentChanges.length === 0) return;
        this.emit({
          type: 'file_change',
          timestamp: Date.now(),
          uri: e.document.uri.toString(),
        });
      }),
    );

    // File create detection
    this.disposables.push(
      vscode.workspace.onDidCreateFiles((e) => {
        for (const file of e.files) {
          this.emit({
            type: 'file_create',
            timestamp: Date.now(),
            uri: file.toString(),
          });
        }
      }),
    );

    // File delete detection
    this.disposables.push(
      vscode.workspace.onDidDeleteFiles((e) => {
        for (const file of e.files) {
          this.emit({
            type: 'file_delete',
            timestamp: Date.now(),
            uri: file.toString(),
          });
        }
      }),
    );

    // Chat session file polling
    this.startChatPolling();
  }

  onRawEvent(listener: RawEventListener): void {
    this.listeners.push(listener);
  }

  private emit(event: RawEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private startChatPolling(): void {
    this.chatPollTimer = setInterval(() => {
      void this.pollChatSessions();
    }, CHAT_POLL_INTERVAL_MS);
  }

  private async pollChatSessions(): Promise<void> {
    try {
      const files = await vscode.workspace.findFiles(CHAT_SESSION_GLOB, null, 100);
      for (const file of files) {
        const key = file.toString();
        if (!this.knownChatFiles.has(key)) {
          this.knownChatFiles.add(key);
          this.emit({
            type: 'chat_session',
            timestamp: Date.now(),
            uri: key,
          });
        }
      }
    } catch {
      // Silently ignore polling errors
    }
  }

  dispose(): void {
    if (this.chatPollTimer) {
      clearInterval(this.chatPollTimer);
    }
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables.length = 0;
    this.listeners.length = 0;
  }
}
