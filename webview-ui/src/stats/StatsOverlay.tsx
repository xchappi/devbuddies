import type { DailyMetrics } from '../types';
import { MiniTimeline } from './MiniTimeline';

interface StatsOverlayProps {
  visible: boolean;
  metrics: DailyMetrics | null;
}

export function StatsOverlay({ visible, metrics }: StatsOverlayProps) {
  if (!visible || !metrics) return null;

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(10, 10, 20, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        fontFamily: 'monospace',
        color: '#ccc',
      }}
    >
      <div
        style={{
          padding: 24,
          maxWidth: 320,
          width: '100%',
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 16, color: '#fff' }}>
          Session Stats
        </h2>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Sessions</div>
          <div style={{ fontSize: 20, color: '#4ae0a0' }}>{metrics.sessionCount}</div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Active Time</div>
          <div style={{ fontSize: 20, color: '#4ae0a0' }}>
            {formatTime(metrics.totalActiveSeconds)}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Actions</div>
          {Object.entries(metrics.actionCounts).map(([type, count]) => (
            <div
              key={type}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                marginBottom: 4,
              }}
            >
              <span>{type}</span>
              <span style={{ color: '#4ae0a0' }}>{count}</span>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Timeline</div>
          <MiniTimeline timeline={metrics.timeline} />
        </div>

        <div style={{ fontSize: 11, color: '#555', marginTop: 16, textAlign: 'center' }}>
          Press M to close
        </div>
      </div>
    </div>
  );
}
