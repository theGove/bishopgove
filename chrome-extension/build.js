#!/usr/bin/env node
// Builds the published extension variants from src/ using per-target feature lists.
// Usage: node build.js [targetId ...]   (defaults to all targets in targets/)
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const TARGETS_DIR = path.join(ROOT, 'targets');
const DIST = path.join(ROOT, 'dist');

const MARKERS = {
  '.js': {
    start: /^\s*\/\/\s*@feature:start\s+(.+?)\s*$/,
    end: /^\s*\/\/\s*@feature:end\b/,
  },
  '.html': {
    start: /^\s*<!--\s*@feature:start\s+(.+?)\s*-->\s*$/,
    end: /^\s*<!--\s*@feature:end\b.*-->\s*$/,
  },
};

function stripFeatures(content, ext, enabledFeatures) {
  const { start, end } = MARKERS[ext];
  const lines = content.split('\n');
  const out = [];
  let skipping = false;

  for (const line of lines) {
    if (skipping) {
      if (end.test(line)) skipping = false;
      continue;
    }
    const m = start.exec(line);
    if (m) {
      const names = m[1].split(',').map(s => s.trim());
      skipping = !names.some(n => enabledFeatures.includes(n));
      continue; // drop the marker line itself either way
    }
    if (end.test(line)) continue; // closing marker for a kept block
    out.push(line);
  }
  return out.join('\n');
}

function applySubstitutions(content, target) {
  return content.replace(/\{\{APP_NAME\}\}/g, target.manifest.name);
}

function buildTarget(targetFile) {
  const target = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
  const outDir = path.join(DIST, target.id);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  for (const file of fs.readdirSync(SRC)) {
    const srcPath = path.join(SRC, file);
    const ext = path.extname(file);
    const outPath = path.join(outDir, file);

    if (file === 'manifest.json') {
      const manifest = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
      Object.assign(manifest, target.manifest);
      fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');
    } else if (MARKERS[ext]) {
      const content = fs.readFileSync(srcPath, 'utf8');
      const stripped = stripFeatures(content, ext, target.features);
      fs.writeFileSync(outPath, applySubstitutions(stripped, target));
    } else {
      fs.copyFileSync(srcPath, outPath);
    }
  }
  console.log(`Built ${target.id} -> ${path.relative(ROOT, outDir)}`);
}

const requested = process.argv.slice(2);
const allTargetFiles = fs.readdirSync(TARGETS_DIR).filter(f => f.endsWith('.json'));
const targetFiles = requested.length
  ? allTargetFiles.filter(f => requested.includes(path.basename(f, '.json')))
  : allTargetFiles;

if (!targetFiles.length) {
  console.error(`No matching targets in ${requested.join(', ')}. Available: ${allTargetFiles.map(f => path.basename(f, '.json')).join(', ')}`);
  process.exit(1);
}

for (const f of targetFiles) buildTarget(path.join(TARGETS_DIR, f));
