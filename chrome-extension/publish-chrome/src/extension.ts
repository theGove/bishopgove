import * as fs from 'fs';
import * as vscode from 'vscode';
import { resolveProjectRoot } from './projectRoot';
import { resolveExtensionSourceRoot } from './extensionSource';
import { TargetConfig, distDir, listTargets, zipPath, displayName } from './targets';
import { buildAll, buildTarget, zipTarget } from './buildRunner';
import { bumpTargetVersion, VersionPart } from './versionBump';
import { packageVsix } from './packageRunner';
import { TargetItem, TargetsTreeProvider } from './targetsTreeProvider';

let output: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
  output = vscode.window.createOutputChannel('Publish Chrome');

  const treeProvider = new TargetsTreeProvider(() => resolveProjectRoot());
  const treeView = vscode.window.createTreeView('publishChromeTargets', { treeDataProvider: treeProvider });
  context.subscriptions.push(treeView, output);

  const requireRoot = (): string | undefined => {
    const root = resolveProjectRoot();
    if (!root) {
      vscode.window.showErrorMessage(
        'Publish Chrome: could not find build.js / targets/ in this workspace. Set "publishChrome.projectRoot" in settings.'
      );
    }
    return root;
  };

  const pickTarget = async (root: string, item?: TargetItem): Promise<TargetConfig | undefined> => {
    if (item) return item.target;
    const targets = listTargets(root);
    const picked = await vscode.window.showQuickPick(
      targets.map(t => ({ label: displayName(t), description: t.id, target: t })),
      { placeHolder: 'Select a target' }
    );
    return picked?.target;
  };

  const withProgress = <T>(title: string, task: () => Promise<T>) =>
    vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title }, task);

  context.subscriptions.push(
    vscode.commands.registerCommand('publishChrome.refresh', () => treeProvider.refresh()),

    vscode.commands.registerCommand('publishChrome.buildAll', async () => {
      const root = requireRoot();
      if (!root) return;
      output.show(true);
      try {
        await withProgress('Publish Chrome: building all targets…', () => buildAll(root, output));
        vscode.window.showInformationMessage('Publish Chrome: all targets built.');
      } catch (e) {
        vscode.window.showErrorMessage(`Publish Chrome build failed: ${(e as Error).message}`);
      }
      treeProvider.refresh();
    }),

    vscode.commands.registerCommand('publishChrome.zipAll', async () => {
      const root = requireRoot();
      if (!root) return;
      output.show(true);
      try {
        await withProgress('Publish Chrome: building & zipping all targets…', async () => {
          for (const target of listTargets(root)) {
            await zipTarget(root, target, output);
          }
        });
        vscode.window.showInformationMessage('Publish Chrome: all targets zipped to dist/.');
      } catch (e) {
        vscode.window.showErrorMessage(`Publish Chrome zip failed: ${(e as Error).message}`);
      }
      treeProvider.refresh();
    }),

    vscode.commands.registerCommand('publishChrome.build', async (item?: TargetItem) => {
      const root = requireRoot();
      if (!root) return;
      const target = await pickTarget(root, item);
      if (!target) return;
      output.show(true);
      try {
        await withProgress(`Publish Chrome: building ${displayName(target)}…`, () => buildTarget(root, target, output));
        vscode.window.showInformationMessage(`Publish Chrome: built ${displayName(target)}.`);
      } catch (e) {
        vscode.window.showErrorMessage(`Publish Chrome build failed: ${(e as Error).message}`);
      }
      treeProvider.refresh();
    }),

    vscode.commands.registerCommand('publishChrome.zip', async (item?: TargetItem) => {
      const root = requireRoot();
      if (!root) return;
      const target = await pickTarget(root, item);
      if (!target) return;
      output.show(true);
      try {
        await withProgress(`Publish Chrome: building & zipping ${displayName(target)}…`, () => zipTarget(root, target, output));
        vscode.window.showInformationMessage(`Publish Chrome: ${displayName(target)} zipped to dist/${target.id}.zip`);
      } catch (e) {
        vscode.window.showErrorMessage(`Publish Chrome zip failed: ${(e as Error).message}`);
      }
      treeProvider.refresh();
    }),

    ...(['bumpPatch', 'bumpMinor', 'bumpMajor'] as const).map(cmd => {
      const part: VersionPart = cmd === 'bumpPatch' ? 'patch' : cmd === 'bumpMinor' ? 'minor' : 'major';
      return vscode.commands.registerCommand(`publishChrome.${cmd}`, async (item?: TargetItem) => {
        const root = requireRoot();
        if (!root) return;
        const target = await pickTarget(root, item);
        if (!target) return;
        const next = bumpTargetVersion(root, target, part);
        vscode.window.showInformationMessage(`Publish Chrome: ${displayName(target)} version bumped to ${next}.`);
        treeProvider.refresh();
      });
    }),

    vscode.commands.registerCommand('publishChrome.openDist', async (item?: TargetItem) => {
      const root = requireRoot();
      if (!root) return;
      const target = await pickTarget(root, item);
      if (!target) return;
      const dir = distDir(root, target);
      await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(dir));
    }),

    vscode.commands.registerCommand('publishChrome.revealZip', async (item?: TargetItem) => {
      const root = requireRoot();
      if (!root) return;
      const target = await pickTarget(root, item);
      if (!target) return;
      const zip = zipPath(root, target);
      if (!fs.existsSync(zip)) {
        const choice = await vscode.window.showWarningMessage(
          `No zip found for ${displayName(target)} yet.`,
          'Build & Zip Now'
        );
        if (choice === 'Build & Zip Now') {
          await vscode.commands.executeCommand('publishChrome.zip', item);
        }
        return;
      }
      await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(zip));
    }),

    vscode.commands.registerCommand('publishChrome.openWebStore', async () => {
      const url = vscode.workspace.getConfiguration('publishChrome').get<string>('webStoreDashboardUrl')
        ?? 'https://chrome.google.com/webstore/devconsole';
      await vscode.env.openExternal(vscode.Uri.parse(url));
    }),

    vscode.commands.registerCommand('publishChrome.regenerateVsix', async () => {
      const sourceRoot = resolveExtensionSourceRoot();
      if (!sourceRoot) {
        vscode.window.showErrorMessage(
          'Publish Chrome: could not find this extension\'s own source folder (needs package.json + src/extension.ts). ' +
          'Set "publishChrome.extensionSourcePath" in settings, or open the repo that contains publish-chrome/ as your workspace.'
        );
        return;
      }
      output.show(true);
      try {
        const vsixPath = await withProgress('Publish Chrome: packaging extension VSIX…', () => packageVsix(sourceRoot, output));
        const choice = await vscode.window.showInformationMessage(
          `Publish Chrome: rebuilt ${vsixPath}`,
          'Install Now',
          'Reveal in Explorer'
        );
        if (choice === 'Install Now') {
          await vscode.commands.executeCommand('workbench.extensions.installExtension', vscode.Uri.file(vsixPath));
          const reload = await vscode.window.showInformationMessage(
            'Publish Chrome: extension reinstalled. Reload the window to use the new version?',
            'Reload Window'
          );
          if (reload === 'Reload Window') {
            await vscode.commands.executeCommand('workbench.action.reloadWindow');
          }
        } else if (choice === 'Reveal in Explorer') {
          await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(vsixPath));
        }
      } catch (e) {
        vscode.window.showErrorMessage(`Publish Chrome: packaging failed — ${(e as Error).message}`);
      }
    })
  );
}

export function deactivate(): void {}
