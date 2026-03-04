import { useRef, useEffect } from 'react';
import type { TimelineEntry } from '../types';

const ACTIVITY_COLORS: Record<string, string> = {
  coding: '#4ae0a0',
  executing: '#e08040',
  thinking: '#a080e0',
  idle: '#555570',
};

const WIDTH = 280;
const HEIGHT = 48;

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

    // Hour grid lines
    ctx.fillStyle = '#2a2a3e';
    for (let h = 0; h < 24; h++) {
      const x = (h / 24) * WIDTH;
      ctx.fillRect(Math.floor(x), 0, 1, HEIGHT);
    }

    // Hour labels (6, 12, 18)
    ctx.fillStyle = '#444';
    ctx.font = '7px monospace';
    for (const h of [6, 12, 18]) {
      const lx = (h / 24) * WIDTH;
      ctx.fillText(`${h}`, Math.floor(lx) + 1, HEIGHT - 2);
    }

    // Activity bars
    const maxSeconds = 3600;
    const barPadding = 1;
    for (const entry of timeline) {
      const x = (entry.hour / 24) * WIDTH;
      const barWidth = WIDTH / 24;
      const barHeight = Math.min((entry.activitySeconds / maxSeconds) * (HEIGHT - 10), HEIGHT - 10);
      const y = HEIGHT - 10 - barHeight;

      ctx.fillStyle = ACTIVITY_COLORS[entry.type] ?? '#555570';
      ctx.fillRect(
        Math.floor(x) + barPadding,
        Math.floor(y),
        Math.ceil(barWidth) - barPadding * 2,
        Math.ceil(barHeight),
      );
    }

    // Current hour marker
    const now = new Date();
    const currentX = ((now.getHours() + now.getMinutes() / 60) / 24) * WIDTH;
    ctx.fillStyle = '#ffffff66';
    ctx.fillRect(Math.floor(currentX), 0, 2, HEIGHT - 10);

    // Marker triangle
    ctx.fillStyle = '#ffffff88';
    ctx.beginPath();
    ctx.moveTo(Math.floor(currentX), 0);
    ctx.lineTo(Math.floor(currentX) + 3, 3);
    ctx.lineTo(Math.floor(currentX) - 1, 3);
    ctx.closePath();
    ctx.fill();
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
        borderRadius: 6,
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    />
  );
}
