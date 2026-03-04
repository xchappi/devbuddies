import { RawEvent, ClassifiedEvent, ActivityType, Confidence } from './types';
import { BURST_WINDOW_MS, BURST_MIN_FILES } from './constants';

export class ActivityHeuristics {
  private recentFileChanges: RawEvent[] = [];

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
    return {
      type: 'executing',
      confidence: 'high',
      evidence: 'Terminal output detected without user input',
      timestamp: event.timestamp,
      rawEvents: [event],
    };
  }

  private classifyFileChange(event: RawEvent): ClassifiedEvent {
    const now = event.timestamp;

    // Add to recent changes, prune old ones
    this.recentFileChanges.push(event);
    this.recentFileChanges = this.recentFileChanges.filter(
      (e) => now - e.timestamp <= BURST_WINDOW_MS,
    );

    // Count unique files in the burst window
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

    return {
      type: 'coding',
      confidence: 'low',
      evidence: 'Single file edit (may be user)',
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
