import { RawEvent, ClassifiedEvent, Confidence } from './types';
import { BURST_WINDOW_MS, BURST_MIN_FILES } from './constants';

export class ActivityHeuristics {
  private recentFileChanges: RawEvent[] = [];
  private recentBackgroundChanges: RawEvent[] = [];

  classify(event: RawEvent): ClassifiedEvent {
    switch (event.type) {
      case 'terminal_output':
        return this.classifyTerminal(event);
      case 'file_change':
        return this.classifyFileChange(event);
      case 'file_create':
      case 'file_delete':
        return this.classifyFileOp(event);
      case 'chat_session':
        return this.classifyChatSession(event);
      case 'editor_focus':
        return {
          type: 'coding',
          confidence: 'low',
          evidence: 'Editor focus change detected',
          timestamp: event.timestamp,
          rawEvents: [event],
        };
      default:
        return {
          type: 'idle',
          confidence: 'low',
          evidence: 'Unknown event type',
          timestamp: event.timestamp,
          rawEvents: [event],
        };
    }
  }

  private classifyTerminal(event: RawEvent): ClassifiedEvent {
    // Shell execution events (command-level, not keystrokes).
    // Medium confidence: could be user running commands or Copilot Agent.
    // Combined with background file edits, this builds a stronger signal.
    return {
      type: 'executing',
      confidence: 'medium',
      evidence: 'Shell execution detected',
      timestamp: event.timestamp,
      rawEvents: [event],
    };
  }

  private classifyFileChange(event: RawEvent): ClassifiedEvent {
    const now = event.timestamp;

    // ── Burst detection (multiple files changing rapidly) ──
    this.recentFileChanges.push(event);
    this.recentFileChanges = this.recentFileChanges.filter(
      (e) => now - e.timestamp <= BURST_WINDOW_MS,
    );

    const uniqueFiles = new Set(this.recentFileChanges.map((e) => e.uri));

    if (uniqueFiles.size >= BURST_MIN_FILES) {
      const burstEvents = [...this.recentFileChanges];
      return {
        type: 'coding',
        confidence: 'high',
        evidence: `Burst: ${uniqueFiles.size} files changed in ${BURST_WINDOW_MS}ms`,
        timestamp: now,
        rawEvents: burstEvents,
      };
    }

    // ── Background file change (non-active editor) ──
    // When a file changes and the user is NOT editing that file,
    // it's very likely an agent (Copilot) making the edit.
    if (event.isBackground) {
      // Track background changes for stronger signal
      this.recentBackgroundChanges.push(event);
      this.recentBackgroundChanges = this.recentBackgroundChanges.filter(
        (e) => now - e.timestamp <= 2000,
      );

      const bgCount = this.recentBackgroundChanges.length;
      const confidence: Confidence = bgCount >= 3 ? 'high' : 'medium';

      return {
        type: 'coding',
        confidence,
        evidence: `Background edit in ${event.uri?.split('/').pop() ?? 'file'} (${bgCount} recent bg edits)`,
        timestamp: now,
        rawEvents: [event],
      };
    }

    // ── Active file change (user's current editor) ──
    // Low confidence — likely the user typing, not an agent.
    return {
      type: 'coding',
      confidence: 'low',
      evidence: 'Active file edit (likely user)',
      timestamp: now,
      rawEvents: [event],
    };
  }

  private classifyFileOp(event: RawEvent): ClassifiedEvent {
    const action = event.type === 'file_create' ? 'created' : 'deleted';
    return {
      type: 'coding',
      confidence: 'medium',
      evidence: `File ${action}: ${event.uri ?? 'unknown'}`,
      timestamp: event.timestamp,
      rawEvents: [event],
    };
  }

  private classifyChatSession(event: RawEvent): ClassifiedEvent {
    return {
      type: 'thinking',
      confidence: 'high',
      evidence: 'Chat session file change detected',
      timestamp: event.timestamp,
      rawEvents: [event],
    };
  }
}
