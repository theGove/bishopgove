import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Locates this extension's own source folder (containing its package.json with
 * name "publish-chrome"), so the "regenerate VSIX" command can rebuild itself
 * even when running from an installed copy that has no src/ or devDependencies.
 */
export function resolveExtensionSourceRoot(): string | undefined {
  const configured = vscode.workspace.getConfiguration('publishChrome').get<string>('extensionSourcePath');
  if (configured && configured.trim().length > 0) {
    return isExtensionSource(configured) ? configured : undefined;
  }

  const folders = vscode.workspace.workspaceFolders ?? [];
  for (const folder of folders) {
    const here = folder.uri.fsPath;
    if (isExtensionSource(here)) return here;

    for (const nested of [
      path.join(here, 'publish-chrome'),
      path.join(here, 'chrome-extension', 'publish-chrome'),
    ]) {
      if (isExtensionSource(nested)) return nested;
    }
  }
  return undefined;
}

function isExtensionSource(dir: string): boolean {
  try {
    const pkgPath = path.join(dir, 'package.json');
    if (!fs.existsSync(pkgPath) || !fs.existsSync(path.join(dir, 'src', 'extension.ts'))) return false;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.name === 'publish-chrome';
  } catch {
    return false;
  }
}
