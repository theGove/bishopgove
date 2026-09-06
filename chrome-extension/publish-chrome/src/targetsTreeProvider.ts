import * as fs from 'fs';
import * as vscode from 'vscode';
import { TargetConfig, displayName, effectiveVersion, listTargets, zipPath } from './targets';

export class TargetItem extends vscode.TreeItem {
  constructor(public readonly target: TargetConfig, root: string) {
    super(displayName(target), vscode.TreeItemCollapsibleState.None);
    const version = effectiveVersion(root, target);
    const featureCount = target.features.length;
    this.description = `v${version} · ${featureCount} extra feature${featureCount === 1 ? '' : 's'}`;
    this.tooltip = new vscode.MarkdownString(
      `**${displayName(target)}** (\`${target.id}\`)\n\n` +
      `Version: ${version}\n\n` +
      `Description: ${target.manifest.description ?? '_none_'}\n\n` +
      (featureCount ? `Extra features: ${target.features.join(', ')}` : 'Core features only')
    );
    this.contextValue = 'publishTarget';
    this.iconPath = fs.existsSync(zipPath(root, target))
      ? new vscode.ThemeIcon('file-zip')
      : new vscode.ThemeIcon('package');
  }
}

export class TargetsTreeProvider implements vscode.TreeDataProvider<TargetItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly getRoot: () => string | undefined) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TargetItem): vscode.TreeItem {
    return element;
  }

  getChildren(): TargetItem[] {
    const root = this.getRoot();
    if (!root) return [];
    try {
      return listTargets(root).map(t => new TargetItem(t, root));
    } catch (e) {
      vscode.window.showErrorMessage(`Publish Chrome: failed to read targets/ — ${(e as Error).message}`);
      return [];
    }
  }
}
