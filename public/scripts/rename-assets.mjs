/**
 * rename-assets.mjs — one-time rename of hash-named extracted assets to
 * semantic names, based on alt-text mapping derived from _v14_clean.html.
 *
 * Idempotent: skips if target already exists.
 */
import { renameSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const logosDir = join(projectRoot, 'src/assets/logos');
const photosDir = join(projectRoot, 'src/assets/photos');
const photoSrcDir = photosDir;

if (!existsSync(logosDir)) mkdirSync(logosDir, { recursive: true });

// Logos: 9 club crests (currently in photos/ because mime-classifier put JPEGs there)
const LOGOS = {
  'image-069bd244.jpg': 'wallaroo-bulldog.jpg',
  'image-9b2b9d5a.jpg': 'ardrossan.jpg',
  'image-08199c92.jpg': 'bute.jpg',
  'image-27a281f7.jpg': 'central-yorke.jpg',
  'image-769bbe24.jpg': 'cms-crows.jpg',
  'image-e6883eb0.jpg': 'kadina.jpg',
  'image-fabd1396.jpg': 'moonta.jpg',
  'image-3fd91ee2.jpg': 'paskeville.jpg',
  'image-5c745ee4.jpg': 'southern-eagles.jpg',
};

// Photos: 11 gallery shots
const PHOTOS = {
  'image-df1169c9.jpg': 'wallaroo-oval-home-crowd.jpg',
  'image-55bfc8e7.jpg': 'u11-contest-vs-yorketown.jpg',
  'image-6c969616.jpg': 'in-the-pack.jpg',
  'image-2039e8cc.jpg': 'midfield-battle.jpg',
  'image-85171f91.jpg': 'on-the-run.jpg',
  'image-f25f31de.jpg': 'first-to-the-footy.jpg',
  'image-c8678ee8.jpg': 'bulldogs-vs-crows.jpg',
  'image-7f49d44b.jpg': 'match-day-runner.jpg',
  'image-0389eb09.jpg': 'bulldogs-in-the-contest.jpg',
  'image-d30ebf2f.jpg': 'quick-hands.jpg',
  'image-932d3b7b.jpg': 'open-field-running.jpg',
};

let moved = 0;
let skipped = 0;

for (const [from, to] of Object.entries(LOGOS)) {
  const src = join(photoSrcDir, from);
  const dest = join(logosDir, to);
  if (existsSync(dest)) { skipped++; continue; }
  if (!existsSync(src)) { console.warn(`  missing: ${from}`); continue; }
  renameSync(src, dest);
  console.log(`🛡  ${from}  →  logos/${to}`);
  moved++;
}

for (const [from, to] of Object.entries(PHOTOS)) {
  const src = join(photoSrcDir, from);
  const dest = join(photosDir, to);
  if (existsSync(dest)) { skipped++; continue; }
  if (!existsSync(src)) { console.warn(`  missing: ${from}`); continue; }
  renameSync(src, dest);
  console.log(`📷 ${from}  →  photos/${to}`);
  moved++;
}

console.log(`\nDone. Moved ${moved}, skipped ${skipped}.`);
