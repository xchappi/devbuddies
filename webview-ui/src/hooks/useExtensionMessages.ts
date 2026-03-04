import { useEffect } from 'react';
import type { ExtensionToWebviewMessage } from '../types';
import { postMessage } from '../vscodeApi';

type MessageHandler = (msg: ExtensionToWebviewMessage) => void;

/**
 * Listen for messages from the extension host and dispatch to handler.
 * Sends 'webviewReady' on mount.
 */
export function useExtensionMessages(handler: MessageHandler): void {
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const msg = event.data as ExtensionToWebviewMessage;
      if (msg && typeof msg.type === 'string') {
        handler(msg);
      }
    };

    window.addEventListener('message', onMessage);
    postMessage({ type: 'webviewReady' });

    return () => {
      window.removeEventListener('message', onMessage);
    };
    // handler is intentionally excluded — caller should use a ref or stable callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
