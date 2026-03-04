# DevBuddies

Visualize GitHub Copilot Agent Mode activity as animated pixel art characters in a virtual office inside VS Code.

## What it does

DevBuddies watches for AI agent activity in your editor and brings it to life:

- **Pixel art characters** walk into a virtual office when Copilot starts working
- **State animations** — typing, executing commands, thinking, idle
- **Stats overlay** — session count, active time, action breakdown (press `M`)
- **Activity timeline** — 24-hour view of AI-assisted development patterns

## How detection works

Since GitHub Copilot has no transcript API, DevBuddies uses **heuristic-based activity detection**:

| Signal | Confidence | What it means |
|--------|------------|---------------|
| Terminal output without user input | High | Agent executing commands |
| 3+ file changes in 500ms | High | Agent writing code |
| Chat session file changes | High | Agent thinking |
| File create/delete | Medium | Agent scaffolding |
| Single file edit | Low (ignored) | Could be the user |

Only **high and medium** confidence events trigger character animations. This prevents false positives from normal development activity.

Press `D` to toggle a debug overlay showing confidence scores and recent events.

## Installation

### From source (development)

```bash
git clone https://github.com/xchappi/devbuddies.git
cd devbuddies
npm install
cd webview-ui && npm install && cd ..
npm run build
```

Then press `F5` in VS Code to launch the Extension Development Host.

### From VSIX

```bash
npm run package
code --install-extension devbuddies-0.1.0.vsix
```

## Usage

1. Open the **DevBuddies: Virtual Office** panel (View → Panel → DevBuddies)
2. Start a GitHub Copilot agent task (chat, inline edit, etc.)
3. Watch your buddy appear and start working!

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `M` | Toggle stats overlay |
| `D` | Toggle debug overlay |

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `devbuddies.soundEnabled` | `true` | Play notification sounds |
| `devbuddies.zoomLevel` | `2` | Pixel zoom level (1-4) |
| `devbuddies.idleTimeoutSeconds` | `120` | Seconds before ending a session |

## Architecture

```
VS Code Events → CopilotMonitor → ActivityHeuristics → SessionTracker → PostMessage → Webview
```

- **Extension host** (Node.js): Monitors VS Code events, classifies activity, manages sessions
- **Webview** (React 19 + Canvas 2D): Renders pixel art office, character animations, stats

The office rendering uses an **imperative game loop** (not React re-renders) for smooth 30fps animation. React only manages UI overlays.

## Privacy

All data stays local. No telemetry. No network calls. Session metrics are stored in VS Code's `globalState` and reset daily.

## Inspired by

- [pixel-agents](https://github.com/pablodelucca/pixel-agents) — Claude Code visualizer

## License

MIT
