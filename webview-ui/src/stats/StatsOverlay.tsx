import { useEffect, useState } from 'react';
import type { ActivityType, DailyMetrics } from '../types';
import { MiniTimeline } from './MiniTimeline';

interface StatsOverlayProps {
  visible: boolean;
  metrics: DailyMetrics | null;
}

const ACTION_COLORS: Record<ActivityType, string> = {
  coding: '#4ae0a0',
  executing: '#e08040',
  thinking: '#a080e0',
  idle: '#555570',
};

export function StatsOverlay({ visible, metrics }: StatsOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      requestAnimationFrame(() => setAnimating(true));
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!mounted || !metrics) return null;

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Progress bar: % of 8h work day
  const workDaySeconds = 8 * 3600;
  const progressPct = Math.min(100, (metrics.totalActiveSeconds / workDaySeconds) * 100);

  // Max action count for bar chart scaling
  const maxAction = Math.max(1, ...Object.values(metrics.actionCounts));

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        background: 'rgba(10, 10, 20, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        fontFamily: 'monospace',
        color: '#ccc',
        opacity: animating ? 1 : 0,
        transition: 'opacity 300ms ease',
      }}
    >
      <div
        style={{
          padding: 24,
          maxWidth: 340,
          width: '100%',
          background: 'rgba(20, 20, 40, 0.5)',
          borderRadius: 12,
          border: '1px solid rgba(74, 224, 160, 0.15)',
          boxShadow: '0 0 20px rgba(74, 224, 160, 0.05)',
          transform: animating ? 'translateY(0)' : 'translateY(12px)',
          transition: 'transform 300ms ease, opacity 300ms ease',
          opacity: animating ? 1 : 0,
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
          <div style={{ fontSize: 20, color: '#4ae0a0', marginBottom: 6 }}>
            {formatTime(metrics.totalActiveSeconds)}
          </div>
          {/* Progress bar */}
          <div style={{
            width: '100%',
            height: 4,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progressPct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #4ae0a0, #40c090)',
              borderRadius: 2,
              transition: 'width 500ms ease',
            }} />
          </div>
          <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
            {progressPct.toFixed(0)}% of 8h day
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Actions</div>
          {(Object.entries(metrics.actionCounts) as [ActivityType, number][]).map(([type, count]) => (
            <div
              key={type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                marginBottom: 6,
              }}
            >
              <span style={{ width: 70 }}>{type}</span>
              <div style={{
                flex: 1,
                height: 6,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${(count / maxAction) * 100}%`,
                  height: '100%',
                  background: ACTION_COLORS[type],
                  borderRadius: 3,
                  transition: 'width 300ms ease',
                }} />
              </div>
              <span style={{ color: ACTION_COLORS[type], minWidth: 30, textAlign: 'right' }}>
                {count}
              </span>
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
