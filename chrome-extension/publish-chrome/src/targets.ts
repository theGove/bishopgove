import * as fs from 'fs';
import * as path from 'path';

export interface TargetManifestOverrides {
  name?: string;
  description?: string;
  version?: string;
  [key: string]: unknown;
}

export interface TargetConfig {
  id: string;
  manifest: TargetManifestOverrides;
  features: string[];
  /** absolute path to the targets/<id>.json file this was loaded from */
  filePath: string;
}

export function listTargets(root: string): TargetConfig[] {
  const dir = path.join(root, 'targets');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  return files
    .map(f => {
      const filePath = path.join(dir, f);
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return { ...parsed, filePath } as TargetConfig;
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function getBaseManifest(root: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(root, 'src', 'manifest.json'), 'utf8'));
}

export function displayName(target: TargetConfig): string {
  return target.manifest.name ?? target.id;
}

export function effectiveVersion(root: string, target: TargetConfig): string {
  if (target.manifest.version) return target.manifest.version;
  const base = getBaseManifest(root);
  return typeof base.version === 'string' ? base.version : '0.0';
}

export function distDir(root: string, target: TargetConfig): string {
  return path.join(root, 'dist', target.id);
}

export function zipPath(root: string, target: TargetConfig): string {
  return path.join(root, 'dist', `${target.id}.zip`);
}
