import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { spawn } from 'child_process';

function run(command: string, args: string[], cwd: string, output: vscode.OutputChannel): Promise<void> {
  output.appendLine(`$ ${command} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, shell: process.platform === 'win32' });
    child.stdout.on('data', d => output.append(d.toString()));
    child.stderr.on('data', d => output.append(d.toString()));
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

const VSIX_NAME = 'publish-chrome.vsix';

/** Builds a fresh publish-chrome.vsix from the extension's own source, installing devDependencies on first run. */
export async function packageVsix(sourceRoot: string, output: vscode.OutputChannel): Promise<string> {
  if (!fs.existsSync(path.join(sourceRoot, 'node_modules'))) {
    output.appendLine('node_modules not found — installing build dependencies (first run only)...');
    await run('npm', ['install'], sourceRoot, output);
  }
  await run('npm', ['run', 'package'], sourceRoot, output);
  return path.join(sourceRoot, VSIX_NAME);
}
