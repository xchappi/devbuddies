import { useRef, useEffect, useState, useCallback } from 'react';
import type { DailyMetrics, ExtensionToWebviewMessage } from './types';
import { OfficeState } from './office/engine/officeState';
import { Renderer } from './office/engine/renderer';
import { GameLoop } from './office/engine/gameLoop';
import { SoundSystem } from './office/engine/sounds';
import { useExtensionMessages } from './hooks/useExtensionMessages';
import { StatsOverlay } from './stats/StatsOverlay';
import { postMessage } from './vscodeApi';

// ── Fade transition hook ─────────────────────────────────────────────

function useFadeTransition(visible: boolean, durationMs = 300) {
  const [shouldRender, setShouldRender] = useState(visible);
  const [opacity, setOpacity] = useState(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      requestAnimationFrame(() => setOpacity(1));
    } else {
      setOpacity(0);
      const timer = setTimeout(() => setShouldRender(false), durationMs);
      return () => clearTimeout(timer);
    }
  }, [visible, durationMs]);

  return { shouldRender, opacity };
}

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const officeRef = useRef<OfficeState | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const loopRef = useRef<GameLoop | null>(null);
  const soundRef = useRef<SoundSystem>(new SoundSystem());

  const [showStats, setShowStats] = useState(false);
  const [metrics, setMetrics] = useState<DailyMetrics | null>(null);
  const [noActivity, setNoActivity] = useState(false);
  const [debug, setDebug] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeCount, setActiveCount] = useState(0);

  // Initialize game engine on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const office = new OfficeState();
    const renderer = new Renderer(canvas);
    const loop = new GameLoop(office, renderer);

    officeRef.current = office;
    rendererRef.current = renderer;
    loopRef.current = loop;

    // Handle resize
    const onResize = () => {
      renderer.resize(window.innerWidth, window.innerHeight);
    };
    onResize();
    window.addEventListener('resize', onResize);

    loop.start();

    // Update active count periodically
    const countInterval = setInterval(() => {
      setActiveCount(office.characters.size);
    }, 500);

    return () => {
      loop.stop();
      window.removeEventListener('resize', onResize);
      clearInterval(countInterval);
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

  // Canvas mouse hover for tooltips
  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer) return;

    const onMouseMove = (e: MouseEvent) => {
      const office = officeRef.current;
      if (!office) return;

      const rect = canvas.getBoundingClientRect();
      const scale = renderer.getScale();
      const mx = (e.clientX - rect.left) / scale;
      const my = (e.clientY - rect.top) / scale;

      // Check if mouse is over any character
      let found = false;
      for (const char of office.getCharacters()) {
        const cx = Math.round(char.x);
        const cy = Math.round(char.y);
        if (mx >= cx && mx <= cx + 16 && my >= cy && my <= cy + 16) {
          setTooltip({
            x: e.clientX,
            y: e.clientY,
            text: `${char.id.slice(0, 8)} [${char.state}]`,
          });
          found = true;
          break;
        }
      }
      if (!found) {
        setTooltip(null);
      }
    };

    const onMouseLeave = () => setTooltip(null);

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  // Handle extension messages
  const handleMessage = useCallback((msg: ExtensionToWebviewMessage) => {
    const office = officeRef.current;
    if (!office) return;

    switch (msg.type) {
      case 'sessionCreated':
        office.addCharacter(msg.id);
        setNoActivity(false);
        setActiveCount(office.characters.size);
        soundRef.current.playSessionStart();
        break;
      case 'sessionEnded':
        office.removeCharacter(msg.id);
        setActiveCount(office.characters.size);
        soundRef.current.playSessionEnd();
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
        soundRef.current.enabled = msg.sound;
        setSoundEnabled(msg.sound);
        break;
      case 'assetsUri':
        break;
    }
  }, []);

  useExtensionMessages(handleMessage);

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    soundRef.current.enabled = newVal;
    postMessage({ type: 'setSoundEnabled', enabled: newVal });
  };

  const handleZoom = (delta: number) => {
    postMessage({ type: 'setZoomLevel', level: delta });
  };

  // Fade transitions
  const noActivityFade = useFadeTransition(noActivity);
  const tooltipFade = useFadeTransition(tooltip !== null, 150);

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
      <canvas ref={canvasRef} style={{ cursor: tooltip ? 'pointer' : 'default' }} />

      <StatsOverlay visible={showStats} metrics={metrics} />

      {/* Character tooltip */}
      {tooltipFade.shouldRender && tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x + 12,
            top: tooltip.y - 24,
            background: 'rgba(10, 10, 20, 0.9)',
            color: '#4ae0a0',
            padding: '3px 8px',
            borderRadius: 4,
            fontFamily: 'monospace',
            fontSize: 10,
            zIndex: 30,
            pointerEvents: 'none',
            border: '1px solid rgba(74, 224, 160, 0.3)',
            opacity: tooltipFade.opacity,
            transition: 'opacity 150ms ease',
            whiteSpace: 'nowrap',
          }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Status bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(10, 10, 20, 0.6)',
          color: '#888',
          padding: '3px 8px',
          fontFamily: 'monospace',
          fontSize: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 5,
        }}
      >
        <span style={{ color: activeCount > 0 ? '#4ae0a0' : '#555' }}>
          {activeCount} active
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ color: '#666' }}>M: stats</span>
        <span style={{ color: '#666' }}>D: debug</span>
      </div>

      {/* Zoom controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          right: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => handleZoom(1)}
          style={zoomBtnStyle}
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => handleZoom(-1)}
          style={zoomBtnStyle}
          title="Zoom out"
        >
          -
        </button>
        <button
          onClick={toggleSound}
          style={{ ...zoomBtnStyle, fontSize: 11 }}
          title={soundEnabled ? 'Mute' : 'Unmute'}
        >
          {soundEnabled ? '\u266B' : '\u266A'}
        </button>
      </div>

      {/* No activity toast */}
      {noActivityFade.shouldRender && (
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(10, 10, 20, 0.8)',
            color: '#888',
            padding: '8px 16px',
            borderRadius: 6,
            fontFamily: 'monospace',
            fontSize: 12,
            zIndex: 5,
            opacity: noActivityFade.opacity,
            transition: 'opacity 300ms ease',
          }}
        >
          No AI activity detected. Start a Copilot chat to see your buddy!
        </div>
      )}

      {/* Debug overlay */}
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
          chars: {officeRef.current?.characters.size ?? 0} |
          particles: {officeRef.current?.particles.particles.length ?? 0}
          {officeRef.current?.getCharacters().map(c => (
            <div key={c.id}>
              {c.id.slice(0, 6)} [{c.state}] p{c.paletteIndex} @({Math.round(c.x)},{Math.round(c.y)})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const zoomBtnStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  background: 'rgba(10, 10, 20, 0.7)',
  color: '#888',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 3,
  fontFamily: 'monospace',
  fontSize: 13,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
};
