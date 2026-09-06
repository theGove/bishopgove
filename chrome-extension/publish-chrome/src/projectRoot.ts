import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Locates the folder that holds build.js and targets/ — the extension source
 * project this tool manages. Honors publishChrome.projectRoot if set, otherwise
 * checks each workspace folder, its parent, and a nested chrome-extension/ folder.
 */
export function resolveProjectRoot(): string | undefined {
  const configured = vscode.workspace.getConfiguration('publishChrome').get<string>('projectRoot');
  if (configured && configured.trim().length > 0) {
    return looksLikeProject(configured) ? configured : undefined;
  }

  const folders = vscode.workspace.workspaceFolders ?? [];
  for (const folder of folders) {
    const here = folder.uri.fsPath;
    if (looksLikeProject(here)) return here;

    const nested = path.join(here, 'chrome-extension');
    if (looksLikeProject(nested)) return nested;

    const up = path.dirname(here);
    if (looksLikeProject(up)) return up;
  }
  return undefined;
}

function looksLikeProject(dir: string): boolean {
  try {
    return (
      fs.existsSync(path.join(dir, 'build.js')) &&
      fs.existsSync(path.join(dir, 'targets')) &&
      fs.existsSync(path.join(dir, 'src', 'manifest.json'))
    );
  } catch {
    return false;
  }
}
