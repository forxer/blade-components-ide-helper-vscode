import * as vscode from 'vscode';
import { MetadataStore } from './data/MetadataStore';
import { BladeCompletionProvider } from './providers/CompletionProvider';
import { BladeHoverProvider } from './providers/HoverProvider';
import { discoverDataFiles, createWatchers } from './vscode/workspaceFiles';
import { logWarnings } from './vscode/logger';

const LANGUAGE = 'blade';

let pendingReload: NodeJS.Timeout | undefined;

function getConfig(): { enable: boolean; globs: string[] } {
  const config = vscode.workspace.getConfiguration('bladeComponents');
  return {
    enable: config.get<boolean>('enable', true),
    globs: config.get<string[]>('customDataGlobs', ['.vscode/*.html-data.json']),
  };
}

export function activate(context: vscode.ExtensionContext): void {
  const store = new MetadataStore();
  let watchers: vscode.Disposable[] = [];

  const reload = async (): Promise<void> => {
    const { globs } = getConfig();
    const files = await discoverDataFiles(globs);
    const warnings = store.load(files);
    logWarnings(warnings);
  };

  const scheduleReload = (): void => {
    if (pendingReload) {
      clearTimeout(pendingReload);
    }
    pendingReload = setTimeout(() => { void reload(); }, 150);
  };

  // Recreate the watchers, disposing the previous set and replacing it in the subscriptions
  // array (rather than appending) so repeated config changes don't accumulate stale handles.
  const setupWatchers = (): void => {
    watchers.forEach(w => {
      w.dispose();
      const index = context.subscriptions.indexOf(w);
      if (index !== -1) {
        context.subscriptions.splice(index, 1);
      }
    });
    const { globs } = getConfig();
    watchers = createWatchers(globs, scheduleReload);
    context.subscriptions.push(...watchers);
  };

  const { enable } = getConfig();
  if (enable) {
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        LANGUAGE,
        new BladeCompletionProvider(store),
        ...BladeCompletionProvider.triggerCharacters,
      ),
      vscode.languages.registerHoverProvider(LANGUAGE, new BladeHoverProvider(store)),
    );
  }

  setupWatchers();
  void reload();

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('bladeComponents')) {
        setupWatchers();
        void reload();
      }
    }),
  );
}

export function deactivate(): void {
  // Cancel any in-flight debounced reload; the rest of the subscriptions are disposed by VS Code.
  if (pendingReload) {
    clearTimeout(pendingReload);
    pendingReload = undefined;
  }
}
