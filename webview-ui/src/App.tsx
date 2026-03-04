import { useRef, useEffect, useState, useCallback } from 'react';
import type { DailyMetrics, ExtensionToWebviewMessage } from './types';
import { OfficeState } from './office/engine/officeState';
import { Renderer } from './office/engine/renderer';
import { GameLoop } from './office/engine/gameLoop';
import { useExtensionMessages } from './hooks/useExtensionMessages';
import { StatsOverlay } from './stats/StatsOverlay';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const officeRef = useRef<OfficeState | null>(null);
  const loopRef = useRef<GameLoop | null>(null);

  const [showStats, setShowStats] = useState(false);
  const [metrics, setMetrics] = useState<DailyMetrics | null>(null);
  const [noActivity, setNoActivity] = useState(false);
  const [debug, setDebug] = useState(false);

  // Initialize game engine on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const office = new OfficeState();
    const renderer = new Renderer(canvas);
    const loop = new GameLoop(office, renderer);

    officeRef.current = office;
    loopRef.current = loop;

    // Handle resize
    const onResize = () => {
      renderer.resize(window.innerWidth, window.innerHeight);
    };
    onResize();
    window.addEventListener('resize', onResize);

    loop.start();

    return () => {
      loop.stop();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        setShowStats(prev => !prev);
      }
      if (e.key === 'd' || e.key === 'D') {
        setDebug(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Handle extension messages
  const handleMessage = useCallback((msg: ExtensionToWebviewMessage) => {
    const office = officeRef.current;
    if (!office) return;

    switch (msg.type) {
      case 'sessionCreated':
        office.addCharacter(msg.id);
        setNoActivity(false);
        break;
      case 'sessionEnded':
        office.removeCharacter(msg.id);
        break;
      case 'agentActivity':
        office.updateCharacterActivity(msg.id, msg.activityType);
        setNoActivity(false);
        break;
      case 'metricsUpdate':
        setMetrics(msg.metrics);
        break;
      case 'noActivityDetected':
        setNoActivity(true);
        break;
      case 'settingsLoaded':
        // Could handle zoom/sound settings here
        break;
      case 'assetsUri':
        // Could load external assets here
        break;
    }
  }, []);

  useExtensionMessages(handleMessage);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <canvas ref={canvasRef} />

      <StatsOverlay visible={showStats} metrics={metrics} />

      {noActivity && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(10, 10, 20, 0.8)',
            color: '#888',
            padding: '8px 16px',
            borderRadius: 6,
            fontFamily: 'monospace',
            fontSize: 12,
            zIndex: 5,
          }}
        >
          No AI activity detected. Start a Copilot chat to see your buddy!
        </div>
      )}

      {debug && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            left: 4,
            background: 'rgba(0,0,0,0.7)',
            color: '#4ae0a0',
            padding: '4px 8px',
            borderRadius: 4,
            fontFamily: 'monospace',
            fontSize: 10,
            zIndex: 20,
          }}
        >
          chars: {officeRef.current?.characters.size ?? 0}
          {officeRef.current?.getCharacters().map(c => (
            <div key={c.id}>
              {c.id.slice(0, 6)} [{c.state}] @({Math.round(c.x)},{Math.round(c.y)})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
