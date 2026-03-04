import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
  ExtensionToWebviewMessage,
  WebviewToExtensionMessage,
} from './types';

export type WebviewMessageListener = (msg: WebviewToExtensionMessage) => void;

export class DevBuddiesViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'devbuddies.officeView';

  private view: vscode.WebviewView | undefined;
  private readonly extensionUri: vscode.Uri;
  private readonly listeners: WebviewMessageListener[] = [];

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtmlContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((msg: WebviewToExtensionMessage) => {
      for (const listener of this.listeners) {
        listener(msg);
      }
    });

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        // Webview became visible again, it will send webviewReady
      }
    });
  }

  onMessage(listener: WebviewMessageListener): void {
    this.listeners.push(listener);
  }

  postMessage(message: ExtensionToWebviewMessage): void {
    if (this.view?.visible) {
      void this.view.webview.postMessage(message);
    }
  }

  private getHtmlContent(webview: vscode.Webview): string {
    const htmlPath = path.join(
      this.extensionUri.fsPath,
      'dist',
      'webview',
      'index.html',
    );

    // If the built webview HTML exists, load and patch asset URIs
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf8');

      // Convert relative asset paths to webview URIs
      const distWebviewUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview'),
      );
      const assetsUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this.extensionUri, 'assets'),
      );

      // Replace relative paths in src/href attributes
      html = html.replace(/(src|href)="\.?\/?/g, `$1="${distWebviewUri}/`);

      // Inject assets base URI for the webview to use
      html = html.replace(
        '</head>',
        `<script>window.__DEVBUDDIES_ASSETS_URI__ = "${assetsUri}";</script></head>`,
      );

      return html;
    }

    // Fallback: minimal HTML when webview hasn't been built yet
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <p style="padding:1em;color:#ccc;font-family:sans-serif;">
    Webview not built yet. Run <code>npm run build:webview</code>.
  </p>
</body>
</html>`;
  }
}
