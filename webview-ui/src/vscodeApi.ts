import type { WebviewToExtensionMessage } from './types';

interface VsCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

// acquireVsCodeApi is injected by VS Code webview host; stub for dev mode
const api: VsCodeApi =
  typeof acquireVsCodeApi === 'function'
    ? acquireVsCodeApi()
    : { postMessage: () => {}, getState: () => null, setState: () => {} };

export function postMessage(msg: WebviewToExtensionMessage): void {
  api.postMessage(msg);
}

export function getState(): unknown {
  return api.getState();
}

export function setState(state: unknown): void {
  api.setState(state);
}
