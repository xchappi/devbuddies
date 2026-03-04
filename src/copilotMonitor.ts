import * as vscode from 'vscode';
import { RawEvent } from './types';
import { CHAT_POLL_INTERVAL_MS } from './constants';

export type RawEventListener = (event: RawEvent) => void;

export class CopilotMonitor implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  private readonly listeners: RawEventListener[] = [];
  private chatPollTimer: ReturnType<typeof setInterval> | undefined;
  private knownChatFiles = new Set<string>();
  /** URI of the currently active text editor — used to distinguish user edits from agent edits */
  private activeEditorUri: string | undefined;

  start(): void {
    // Track the active editor so we can distinguish user edits from agent edits
    this.activeEditorUri = vscode.window.activeTextEditor?.document.uri.toString();
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        this.activeEditorUri = editor?.document.uri.toString();
      }),
    );

    // ── Terminal shell execution (command-level, not keystroke-level) ──
    // These fire only when actual commands execute, not on every keypress.
    // Useful for detecting Copilot Agent running terminal commands.
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

    // NOTE: We intentionally do NOT use onDidWriteTerminalData.
    // That API fires on every character written to any terminal (including user keystrokes),
    // which causes massive false positives. Shell execution events above are sufficient.

    // ── File edit detection ──
    // Key insight: when Copilot Agent edits files, those files are usually
    // NOT the user's active editor. We tag these as "background" edits.
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document.uri.scheme !== 'file') return;
        if (e.contentChanges.length === 0) return;

        const changedUri = e.document.uri.toString();
        const isBackground = changedUri !== this.activeEditorUri;

        this.emit({
          type: 'file_change',
          timestamp: Date.now(),
          uri: changedUri,
          isBackground,
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

    // Chat session file polling (watches Copilot workspace storage)
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
      // Search for Copilot chat session files in workspace
      const files = await vscode.workspace.findFiles('**/chatSessions/**', null, 100);
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
