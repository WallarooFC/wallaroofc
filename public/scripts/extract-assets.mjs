/**
 * extract-assets.mjs — one-time extraction of base64 data URLs from
 * the v14 homepage mockup into deduped image files under src/assets/.
 *
 * Run: node scripts/extract-assets.mjs <path-to-v14.html>
 *
 * Outputs:
 *   src/assets/logos/*.{png,svg}      — club crests
 *   src/assets/photos/*.{jpg,png}     — match-day photos
 *   scripts/_v14_clean.html           — v14 markup with data URLs replaced by [[ASSET:filename]] placeholders
 *   scripts/extraction-manifest.json  — every occurrence: line, byte offset, hash, assigned filename, alt text
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const v14Path = process.argv[2] ?? resolve(process.env.HOME ?? 'C:/Users/trist', 'Downloads/wallaroo_homepage_v14.html');

if (!existsSync(v14Path)) {
  console.error(`v14 file not found at ${v14Path}`);
  process.exit(1);
}

console.log(`Reading ${v14Path}…`);
const source = readFileSync(v14Path, 'utf8');

const logosDir = join(projectRoot, 'src/assets/logos');
const photosDir = join(projectRoot, 'src/assets/photos');
for (const d of [logosDir, photosDir]) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

// Match data:image/...;base64,... data URLs inside src="…", url("…"), or url(…) attributes.
// Group 1 = MIME subtype (png/jpeg/webp/svg+xml), Group 2 = base64 payload.
const DATA_URL_RE = /data:image\/(png|jpe?g|webp|svg\+xml);base64,([A-Za-z0-9+/=]+)/g;

// Slug helper
const slugify = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

// Try to find a useful alt text or descriptive context for a data URL occurrence.
// Looks back up to 400 chars in the source for alt="…" / aria-label="…" / class="…" / nearby text.
function inferName(source, offset) {
  const before = source.slice(Math.max(0, offset - 600), offset);
  const after = source.slice(offset, Math.min(source.length, offset + 600));

  // 1. alt="…" on the same <img> tag (look ahead)
  const altAhead = after.match(/^[^>]*\balt="([^"]+)"/i);
  if (altAhead) return slugify(altAhead[1]);

  // 2. alt="…" on the enclosing <img> if data URL is later in the tag (look back)
  const tagOpen = before.lastIndexOf('<');
  if (tagOpen >= 0) {
    const tagSoFar = before.slice(tagOpen);
    const altBack = tagSoFar.match(/\balt="([^"]+)"/i);
    if (altBack) return slugify(altBack[1]);
  }

  // 3. aria-label="…"
  const ariaAhead = after.match(/^[^>]*\baria-label="([^"]+)"/i);
  if (ariaAhead) return slugify(ariaAhead[1]);

  // 4. class="…" — pick the most descriptive class for the parent or img
  const classMatch = (after.match(/^[^>]*\bclass="([^"]+)"/i) || before.match(/\bclass="([^"]+)"(?=[^<]*$)/i));
  if (classMatch) {
    const classes = classMatch[1].split(/\s+/);
    // Prefer specific ones like "ypfl-club" or "gallery-photo"
    const pick = classes.find(c => /^(brand|nm|fixture|ypfl|gallery|footer|hero|fx|ladder|crest|club|photo)/.test(c));
    if (pick) return slugify(pick);
    if (classes[0]) return slugify(classes[0]);
  }

  return null;
}

// Track all references and dedupe by content hash
const byHash = new Map(); // hash -> { mime, ext, hintNames: Set<string>, count }
const occurrences = []; // { offset, hash, hintName }

let m;
let replaced = source;
const replacements = []; // { start, end, placeholder }

while ((m = DATA_URL_RE.exec(source)) !== null) {
  const fullMatch = m[0];
  const mime = m[1];
  const b64 = m[2];
  const buf = Buffer.from(b64, 'base64');
  const hash = createHash('sha256').update(buf).digest('hex').slice(0, 12);
  const ext = mime === 'jpeg' || mime === 'jpg' ? 'jpg' : mime === 'svg+xml' ? 'svg' : mime;

  const hintName = inferName(source, m.index);

  if (!byHash.has(hash)) {
    byHash.set(hash, { mime, ext, hintNames: new Set(), buf, count: 0 });
  }
  const entry = byHash.get(hash);
  entry.count++;
  if (hintName) entry.hintNames.add(hintName);

  occurrences.push({ offset: m.index, length: fullMatch.length, hash, hintName, mime });

  replacements.push({ start: m.index, end: m.index + fullMatch.length, hash });
}

console.log(`Found ${occurrences.length} data-URL references → ${byHash.size} unique images.`);

// Resolve final filenames: prefer the most common / longest hint name per hash.
// Disambiguate collisions by appending -2, -3, etc.
const usedNames = new Set();
const finalNames = new Map(); // hash -> filename (without dir)

for (const [hash, entry] of byHash) {
  const hints = [...entry.hintNames].sort((a, b) => b.length - a.length);
  let base = hints[0] || `image-${hash.slice(0, 8)}`;
  // Strip generic ones
  if (/^(brand-logo|fixture-crest|crest-cell|footer-logo|nm-crest-wrap|ypfl-club)$/.test(base)) {
    base = `image-${hash.slice(0, 8)}`;
  }
  let name = `${base}.${entry.ext}`;
  let i = 2;
  while (usedNames.has(name)) {
    name = `${base}-${i}.${entry.ext}`;
    i++;
  }
  usedNames.add(name);
  finalNames.set(hash, name);

  // Classify logos vs photos: PNG/SVG/WebP small files = logos; JPEG = photos
  const isPhoto = entry.mime === 'jpeg' || entry.mime === 'jpg' || (entry.mime === 'webp' && entry.buf.length > 30_000);
  const outDir = isPhoto ? photosDir : logosDir;
  const outPath = join(outDir, name);
  writeFileSync(outPath, entry.buf);
  console.log(`  ${isPhoto ? '📷' : '🛡 '} ${name}  (${(entry.buf.length / 1024).toFixed(1)} KB, ${entry.count}×)`);
}

// Apply replacements in reverse order so offsets stay valid
replacements.sort((a, b) => b.start - a.start);
for (const r of replacements) {
  const filename = finalNames.get(r.hash);
  replaced = replaced.slice(0, r.start) + `[[ASSET:${filename}]]` + replaced.slice(r.end);
}

const cleanPath = join(__dirname, '_v14_clean.html');
writeFileSync(cleanPath, replaced);
console.log(`\nClean v14 markup written to ${cleanPath} (${(replaced.length / 1024).toFixed(1)} KB)`);

const manifestPath = join(__dirname, 'extraction-manifest.json');
const manifest = {
  source: v14Path,
  generatedAt: new Date().toISOString(),
  totalReferences: occurrences.length,
  uniqueImages: byHash.size,
  assets: [...byHash.entries()].map(([hash, entry]) => ({
    hash,
    filename: finalNames.get(hash),
    mime: entry.mime,
    bytes: entry.buf.length,
    referenceCount: entry.count,
    hintNames: [...entry.hintNames],
    classification: (entry.mime === 'jpeg' || (entry.mime === 'webp' && entry.buf.length > 30_000)) ? 'photo' : 'logo',
  })),
};
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`Manifest written to ${manifestPath}`);
