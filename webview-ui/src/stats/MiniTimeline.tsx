import { useRef, useEffect } from 'react';
import type { TimelineEntry } from '../types';

const ACTIVITY_COLORS: Record<string, string> = {
  coding: '#4ae0a0',
  executing: '#e08040',
  thinking: '#a080e0',
  idle: '#555570',
};

const WIDTH = 240;
const HEIGHT = 40;

interface MiniTimelineProps {
  timeline: TimelineEntry[];
}

export function MiniTimeline({ timeline }: MiniTimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Hour lines
    ctx.fillStyle = '#2a2a3e';
    for (let h = 0; h < 24; h++) {
      const x = (h / 24) * WIDTH;
      ctx.fillRect(Math.floor(x), 0, 1, HEIGHT);
    }

    // Activity bars
    const maxSeconds = 3600; // full hour = full height
    for (const entry of timeline) {
      const x = (entry.hour / 24) * WIDTH;
      const barWidth = WIDTH / 24;
      const barHeight = Math.min((entry.activitySeconds / maxSeconds) * HEIGHT, HEIGHT);
      const y = HEIGHT - barHeight;

      ctx.fillStyle = ACTIVITY_COLORS[entry.type] ?? '#555570';
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(barWidth) - 1, Math.ceil(barHeight));
    }

    // Current hour marker
    const now = new Date();
    const currentX = ((now.getHours() + now.getMinutes() / 60) / 24) * WIDTH;
    ctx.fillStyle = '#ffffff44';
    ctx.fillRect(Math.floor(currentX), 0, 2, HEIGHT);
  }, [timeline]);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      style={{
        width: WIDTH,
        height: HEIGHT,
        imageRendering: 'pixelated',
        borderRadius: 4,
      }}
    />
  );
}
