import * as vscode from 'vscode';

let channel: vscode.OutputChannel | undefined;

export function getLogger(): vscode.OutputChannel {
  if (!channel) {
    channel = vscode.window.createOutputChannel('Blade Components IDE Helper');
  }
  return channel;
}

export function logWarnings(warnings: string[]): void {
  if (warnings.length === 0) {
    return;
  }
  const log = getLogger();
  for (const warning of warnings) {
    log.appendLine(`[warn] ${warning}`);
  }
}
