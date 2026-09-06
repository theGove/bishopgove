import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as fs from 'fs';
import { TargetConfig, distDir, zipPath } from './targets';

function run(command: string, args: string[], cwd: string, output: vscode.OutputChannel, useShell = process.platform === 'win32'): Promise<void> {
  output.appendLine(`$ ${command} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, shell: useShell });
    child.stdout.on('data', d => output.append(d.toString()));
    child.stderr.on('data', d => output.append(d.toString()));
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

export async function buildTarget(root: string, target: TargetConfig, output: vscode.OutputChannel): Promise<void> {
  await run('node', ['build.js', target.id], root, output);
}

export async function buildAll(root: string, output: vscode.OutputChannel): Promise<void> {
  await run('node', ['build.js'], root, output);
}

export async function zipTarget(root: string, target: TargetConfig, output: vscode.OutputChannel): Promise<void> {
  await buildTarget(root, target, output);
  const src = distDir(root, target);
  const dest = zipPath(root, target);
  if (!fs.existsSync(src)) {
    throw new Error(`Build output missing: ${src}`);
  }
  if (process.platform === 'win32') {
    const psCommand = `Compress-Archive -Path '${src.replace(/'/g, "''")}\\*' -DestinationPath '${dest.replace(/'/g, "''")}' -Force`;
    await run('powershell', ['-NoProfile', '-Command', psCommand], root, output);
  } else {
    await run('zip', ['-r', '-j', dest, '.'], src, output, true);
  }
}
