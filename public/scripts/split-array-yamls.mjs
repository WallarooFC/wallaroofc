/**
 * split-array-yamls.mjs — one-time refactor: convert single-file array YAMLs
 * into folder collections (one file per item). Idempotent: skips if the
 * destination folder exists with files.
 *
 * Why: Decap CMS's "folder collection" pattern is far simpler for non-technical
 * editors than nested list widgets — each entry is its own file.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(__dirname, '../src/content');

const SPLITS = [
  { source: 'fixtures.yml',  folder: 'fixtures',     id: e => e.id ?? `r${e.round}` },
  { source: 'finals.yml',    folder: 'finals',       id: e => e.id ?? e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
  { source: 'social.yml',    folder: 'social',       id: e => e.id ?? `r${e.round}` },
  { source: 'sponsors.yml',  folder: 'sponsors',     id: e => e.id ?? e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
  { source: 'this-week.yml', folder: 'this-week',    id: e => e.id ?? e.grade.toLowerCase().replace(/\s+/g, '-') },
];

for (const split of SPLITS) {
  const srcPath = join(contentDir, split.source);
  const dstDir = join(contentDir, split.folder);

  if (!existsSync(srcPath)) {
    console.log(`  skip ${split.source} (source not found — already split?)`);
    continue;
  }

  if (existsSync(dstDir) && readdirSync(dstDir).length > 0) {
    console.log(`  skip ${split.source} → ${split.folder}/ (destination exists)`);
    continue;
  }

  if (!existsSync(dstDir)) mkdirSync(dstDir, { recursive: true });

  const text = readFileSync(srcPath, 'utf8');
  const arr = parse(text);
  if (!Array.isArray(arr)) {
    console.warn(`  ⚠ ${split.source} is not a top-level array; skipping`);
    continue;
  }

  console.log(`  ${split.source} → ${split.folder}/  (${arr.length} entries)`);
  for (const entry of arr) {
    const id = split.id(entry);
    if (!id) throw new Error(`No id for entry in ${split.source}: ${JSON.stringify(entry).slice(0, 80)}`);
    const { id: _drop, ...rest } = entry;
    const outFile = join(dstDir, `${id}.yml`);
    writeFileSync(outFile, stringify(rest));
  }

  // Remove the original array file once split succeeded
  unlinkSync(srcPath);
  console.log(`    removed ${split.source}`);
}
