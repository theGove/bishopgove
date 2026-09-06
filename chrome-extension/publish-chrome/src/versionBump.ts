import * as fs from 'fs';
import { TargetConfig, effectiveVersion } from './targets';

export type VersionPart = 'major' | 'minor' | 'patch';

export function bumpVersionString(version: string, part: VersionPart): string {
  const idx = part === 'major' ? 0 : part === 'minor' ? 1 : 2;
  const parts = version.split('.').map(n => parseInt(n, 10) || 0);
  while (parts.length <= idx) parts.push(0);
  parts[idx] += 1;
  for (let i = idx + 1; i < parts.length; i++) parts[i] = 0;
  return parts.join('.');
}

/** Bumps a target's version and persists it into its targets/<id>.json manifest override. */
export function bumpTargetVersion(root: string, target: TargetConfig, part: VersionPart): string {
  const current = effectiveVersion(root, target);
  const next = bumpVersionString(current, part);

  const raw = JSON.parse(fs.readFileSync(target.filePath, 'utf8'));
  raw.manifest = raw.manifest ?? {};
  raw.manifest.version = next;
  fs.writeFileSync(target.filePath, JSON.stringify(raw, null, 2) + '\n');

  return next;
}
