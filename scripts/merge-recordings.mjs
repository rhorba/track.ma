#!/usr/bin/env node
/**
 * Merges all Playwright WebM recordings from .recordings/raw/ into a single
 * final video at .recordings/final/v1.0-YYYY-MM-DD.webm
 *
 * Ordering: spec files are prefixed 00- through 10- so the video reflects
 * the user journey from landing → login → dashboard → ... → demo.
 *
 * Usage:
 *   node scripts/merge-recordings.mjs
 *   node scripts/merge-recordings.mjs --output .recordings/final/custom.webm
 */

import { execSync } from 'child_process';
import {
  readdirSync,
  statSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  unlinkSync,
} from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const RAW_DIR = join(ROOT, '.recordings', 'raw');
const FINAL_DIR = join(ROOT, '.recordings', 'final');
const CONCAT_LIST = join(ROOT, '.recordings', 'concat_list.txt');

// Parse --output flag
const outputFlag = process.argv.indexOf('--output');
const dateStr = new Date().toISOString().slice(0, 10);
const OUTPUT =
  outputFlag !== -1
    ? resolve(process.argv[outputFlag + 1])
    : join(FINAL_DIR, `v1.0-${dateStr}.webm`);

// ── Collect all .webm files ───────────────────────────────────────────────────

function walkDir(dir, collected = []) {
  if (!existsSync(dir)) return collected;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkDir(full, collected);
    } else if (full.endsWith('.webm')) {
      collected.push(full);
    }
  }
  return collected;
}

const allVideos = walkDir(RAW_DIR);

if (allVideos.length === 0) {
  console.error('❌  No .webm files found in', RAW_DIR);
  console.error('   Run: pnpm --filter web test:video   first.');
  process.exit(1);
}

// ── Sort by spec number prefix (00- → 10-) ───────────────────────────────────

function specOrder(filePath) {
  // Path contains the test result folder name, which Playwright derives from
  // the test title. We match the numeric prefix from the spec file name.
  const match = filePath.match(/[/\\](\d{2})-/);
  return match ? parseInt(match[1], 10) : 99;
}

allVideos.sort((a, b) => {
  const orderDiff = specOrder(a) - specOrder(b);
  if (orderDiff !== 0) return orderDiff;
  // Within same spec: sort by directory mtime (test order)
  return statSync(dirname(a)).mtimeMs - statSync(dirname(b)).mtimeMs;
});

console.log(`\n🎬  Found ${allVideos.length} recording(s):\n`);
allVideos.forEach((f, i) => console.log(`  ${String(i + 1).padStart(2, ' ')}. ${f.replace(ROOT, '.')}`));

// ── Build ffmpeg concat list ──────────────────────────────────────────────────

const concatContent = allVideos
  .map((f) => `file '${f.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`)
  .join('\n');

mkdirSync(FINAL_DIR, { recursive: true });
writeFileSync(CONCAT_LIST, concatContent, 'utf8');

console.log(`\n📋  Concat list written → ${CONCAT_LIST.replace(ROOT, '.')}`);

// ── Run ffmpeg ────────────────────────────────────────────────────────────────

console.log(`\n🔀  Merging into → ${OUTPUT.replace(ROOT, '.')}\n`);

try {
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${CONCAT_LIST}" -c:v libvpx-vp9 -b:v 1M -c:a libopus "${OUTPUT}"`,
    { stdio: 'inherit' },
  );
  console.log(`\n✅  Final video saved → ${OUTPUT.replace(ROOT, '.')}`);
} catch {
  // If VP9 re-encode fails (codec mismatch), fall back to stream copy
  console.log('\n⚠️   VP9 encode failed — falling back to stream copy...');
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${CONCAT_LIST}" -c copy "${OUTPUT}"`,
    { stdio: 'inherit' },
  );
  console.log(`\n✅  Final video saved (stream copy) → ${OUTPUT.replace(ROOT, '.')}`);
}

// Cleanup concat list
try { unlinkSync(CONCAT_LIST); } catch { /* ignore */ }

console.log(`\n🎥  Open with:  start "${OUTPUT}"\n`);
