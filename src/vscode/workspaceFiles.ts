import * as vscode from 'vscode';
import { DataFileInput } from '../data/MetadataStore';

/** Reads every file matching any of the globs across all workspace folders. */
export async function discoverDataFiles(globs: string[]): Promise<DataFileInput[]> {
  const seen = new Set<string>();
  const files: DataFileInput[] = [];

  for (const glob of globs) {
    const uris = await vscode.workspace.findFiles(glob);
    for (const uri of uris) {
      if (seen.has(uri.toString())) {
        continue;
      }
      seen.add(uri.toString());
      try {
        const bytes = await vscode.workspace.fs.readFile(uri);
        files.push({ source: uri.fsPath, content: Buffer.from(bytes).toString('utf8') });
      } catch {
        // unreadable file: skip silently, other files still load
      }
    }
  }
  return files;
}

/** Creates a watcher per glob; calls `onChange` on any create/change/delete. */
export function createWatchers(globs: string[], onChange: () => void): vscode.Disposable[] {
  return globs.map(glob => {
    const watcher = vscode.workspace.createFileSystemWatcher(glob);
    watcher.onDidCreate(onChange);
    watcher.onDidChange(onChange);
    watcher.onDidDelete(onChange);
    return watcher;
  });
}
