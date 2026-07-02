# Assets

How images live in the codebase, how to add a new one, and the build-time
pipeline Astro runs on them.

## Where things live

```
src/assets/
├── logos/                          # 9 YPFL club crests
│   ├── wallaroo-bulldog.jpg
│   ├── ardrossan.jpg
│   ├── bute.jpg
│   ├── central-yorke.jpg
│   ├── cms-crows.jpg
│   ├── kadina.jpg
│   ├── moonta.jpg
│   ├── paskeville.jpg
│   └── southern-eagles.jpg
│
└── photos/                         # 11 match-day photos for the gallery
    ├── wallaroo-oval-home-crowd.jpg
    ├── u11-contest-vs-yorketown.jpg
    ├── bulldogs-vs-crows.jpg
    └── …
```

All images are JPEG originals at roughly 800–2000px on the long edge. At build
time, Astro generates 1–6 responsive WebP variants per image (the exact number
depends on how the image is used). 20 originals → 119 variants currently.

**Why `src/assets/` and not `public/`?** Anything in `src/assets/` goes through
Astro's `<Image>` component, which gives you:
- Automatic WebP conversion + size variants
- `width` / `height` attributes baked into the HTML (no CLS)
- Hashed filenames for aggressive caching
- `loading="lazy"` and `decoding="async"` by default
- Optional `densities` (1x/2x) or `widths` (responsive) lists

If you put an image in `public/` it ships as-is, no processing. Only use that
for things that aren't images-as-content — favicon, PDFs, etc.

## How the crests work

Crests are imported once, in `src/lib/clubs.ts`:

```ts
import wallarooBulldog from '../assets/logos/wallaroo-bulldog.jpg';
// …

export const CLUBS: Record<ClubSlug, Club> = {
  'wallaroo': {
    slug: 'wallaroo',
    name: 'Wallaroo',
    nickname: 'Bulldogs',
    crest: wallarooBulldog,        // ImageMetadata
    altName: 'Wallaroo Football Club crest',
  },
  // …
};
```

Every page that shows a crest does so through the shared `<Crest>` component:

```astro
<Crest club="ardrossan" size={36} />
<Crest club="wallaroo" size={780} loading="eager" fetchpriority="high"
       widths={[380, 780, 1200]} sizes="(max-width: 768px) 380px, 780px" />
```

`size` is the display size in CSS pixels. By default `Crest` emits 1× and 2×
variants for retina. If you pass `widths` it switches to a true responsive
srcset.

## How the gallery photos work

Each gallery photo is imported in `src/components/Gallery.astro` and
`src/pages/gallery/index.astro` and used directly with Astro's `<Image>`:

```astro
import wallarooOval from '../assets/photos/wallaroo-oval-home-crowd.jpg';
// …

<Image
  src={wallarooOval}
  alt="Wallaroo Oval home crowd"
  widths={[320, 640, 960, 1280]}
  sizes="(max-width: 700px) 90vw, 25vw"
  loading="lazy"
  format="webp"
/>
```

This is the pattern to copy when adding a new gallery photo.

## Adding a new club crest

(Rare — happens once every few years when the YPFL roster changes.)

1. Drop the new crest into `src/assets/logos/{slug}.jpg`. JPEG, around 256×256
   to 512×512. PNG also works.
2. Add an entry to `src/lib/clubs.ts`:
   ```ts
   import newClub from '../assets/logos/new-club.jpg';

   export type ClubSlug = '…' | 'new-club';

   export const CLUBS = {
     // …
     'new-club': {
       slug: 'new-club',
       name: 'New Club',
       nickname: 'Nicknames',
       crest: newClub,
       altName: 'New Club Football Club crest',
     },
   };

   export const CLUB_ORDER = [/* …, */ 'new-club'];
   ```
3. Update the `clubSlug` enum in `src/content.config.ts`:
   ```ts
   const CLUB_SLUGS = ['…existing…', 'new-club'] as const;
   ```
4. Update every `options:` list in `public/admin/config.yml` that has the
   club-slug dropdowns (currently 4 — search for `wallaroo` in the file and
   you'll find them).
5. Rebuild. The YPFL strip on the homepage auto-includes the new club because
   it iterates `CLUB_ORDER`.

## Adding a new gallery photo

(Frequent — committee will want to drop new match-day photos in regularly.)

### Option A — committee, via Decap CMS

Currently the gallery photo list is **hard-coded** as ESM imports in
`src/pages/gallery/index.astro`, so the committee can't add photos via the CMS.
This is a known Wave 4 limitation — see "Moving the gallery to a content
collection" below.

For now: committee emails the photo to a developer who follows Option B.

### Option B — developer

1. Save the photo at `src/assets/photos/{descriptive-slug}.jpg`.
   - Aim for landscape, 1600–2000px on the long edge
   - JPEG quality ~85, file size under ~500 KB if possible
   - Use [Squoosh](https://squoosh.app/) to compress big photos before commit
   - Descriptive filename — `r6-vs-ardrossan-finn-takes-screamer.jpg` beats
     `IMG_4827.jpg`
2. Add to the photo list in `src/components/Gallery.astro` (homepage section):
   ```astro
   import newPhoto from '../assets/photos/new-photo.jpg';
   // …
   const photos: PhotoTile[] = [
     // …
     { src: newPhoto, alt: 'Descriptive alt text', caption: 'Short caption' },
   ];
   ```
3. Also add to `src/pages/gallery/index.astro` — same shape, but with `round`
   and `grade` fields for the filter pills:
   ```astro
   { src: newPhoto, alt: '…', caption: '…', round: 7, grade: 'A-Grade' },
   ```
4. Commit + push. The build will pick it up and emit WebP variants.

## Moving the gallery to a content collection (future enhancement)

This isn't done yet. When someone gets to it:

- Add a `gallery` content collection in `src/content.config.ts`
- Each entry has fields: `image` (image widget), `alt`, `caption`, `round`,
  `grade`
- Update `Gallery.astro` and `pages/gallery/index.astro` to `getCollection('gallery')`
- Add the collection to `public/admin/config.yml` so Decap can upload new
  photos and the committee can add captions / round / grade tags

The hold-up is that Astro's image-pipeline interaction with content-collection
image fields is straightforward but adds a layer of indirection most other
sections don't need. Worth doing if the committee wants self-service photo
uploads.

## How the original extraction worked (historical reference)

The site was designed as a single-file HTML mockup (`wallaroo_homepage_v14.html`)
with every image embedded as base64. The one-time extraction lives in `scripts/`:

| Script | What it did |
| --- | --- |
| `extract-assets.mjs` | Read the v14 HTML, found every `data:image/...` URL, decoded and deduped by content hash, wrote each unique image to `src/assets/` |
| `rename-assets.mjs` | Mapped hash-named files (e.g. `image-069bd244.jpg`) to semantic names (e.g. `wallaroo-bulldog.jpg`) based on the surrounding alt text |
| `split-array-yamls.mjs` | Converted the initial single-file array YAMLs into folder collections |
| `import-sponsors.mjs` | Bulk-generated the 72 sponsor YAML files from the live-site sponsor list |

You shouldn't need to run any of these again — they're kept for reference and in
case the original v14 mockup ever needs to be re-extracted (e.g. higher-res
versions of the photos arrive).

## Image-pipeline quick facts

- **WebP is the only output format used currently.** AVIF is technically
  supported by Astro but the size savings are small for our photos and AVIF
  encoding is slow (would lengthen builds). Stay with WebP unless someone has a
  good reason.
- **Jpeg fallbacks are not emitted.** Every browser since ~2020 supports WebP.
  Adding JPEG fallbacks would double the build's image output for ~0% practical
  benefit. The brief asked for "WebP with JPEG fallback"; this was a deliberate
  simplification — flag if you disagree.
- **The bulldog crest gets reused across the site in ~17 places** at different
  sizes (32px in ladder rows, 96px in the masthead, 780px in the hero
  watermark). Astro generates a variant per call-site, so it ends up with ~30
  WebP files for the bulldog alone. That's fine — they all live in `dist/_astro/`
  with hashed names, are cache-busted automatically, and total only ~60 KB.
- **Cache** lives in `node_modules/.astro/` — Astro skips re-processing an image
  if its source hash hasn't changed. First build takes ~10s; cached rebuilds
  ~3s.
