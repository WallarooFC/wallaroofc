/**
 * import-sponsors.mjs — one-off import of the real sponsor list from
 * https://www.wallaroofc.com/sponsors. Writes one YAML per sponsor.
 *
 * Run: node scripts/import-sponsors.mjs
 *
 * Idempotent in the sense that it rewrites the same files each run;
 * but it does delete any existing src/content/sponsors/*.yml that
 * aren't in the list below.
 */
import { readdirSync, writeFileSync, unlinkSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sponsorsDir = resolve(__dirname, '../src/content/sponsors');
if (!existsSync(sponsorsDir)) mkdirSync(sponsorsDir, { recursive: true });

const SPONSORS = {
  platinum: ['All Creeks', 'Hallett Concrete'],
  vip: [
    'Leanic Civil', 'Electrical NRG Solutions', 'Fence It YP', 'Real Estate On Yorke',
    'Poona Crushing and Gravel', 'SportsPower Kadina', 'Cornucopia Hotel', 'Subway',
    'Shippy Hardware', 'Wallaroo Alehouse', "Fat G's", "Angler's Inn",
  ],
  gold: [
    'Wallaroo Beachfront Tourist Park', 'T-Ports', 'YP Energy Solutions', 'Forty Winks',
    'BHS', 'Ballavarra Pty', 'Steve McDonald Electrical', 'Wallaroo Caravan Park',
    'Prince Edward Hotel', 'Murray Pest Control', 'YP Chiropractic', 'Josh Bennett',
    'Weeroona Hotel', 'Kadina McDonalds', 'WFI', 'Guns & Buns', 'Kurlben Pty Ltd',
    'Jeff White Mechanical', 'NYP Car Fix', 'T.R Depledge Gardening', 'C & S Fletcher',
    'Robust Worx', 'McDonalds', 'Spencer Gulf Searoad', 'Jacks Septics',
  ],
  silver: [
    'Enfield Furnishers', 'KP Lawyers', 'St Mary Mackillop School', 'Seaside Vet',
    'Burfit Concrete', 'Larwood Ag Services', 'Best Pizza', 'Wardle Co',
    'Kadina Electrical', 'Wallaroo Metal Fabricators', 'Hello World Kadina',
    'Wallaroo Hotel', 'Format Concrete', 'Bond Store Wallaroo', 'Shaun Miller Ray White',
    'YP Fire and Safety', 'Country Living Homes', 'MA Skinner', 'Gunnings',
    "Keepin it Clean", 'VDH Mobile Mechanical', 'Shores Eatery',
  ],
  bronze: [
    'Jetty Road Bakehouse', 'West Properties', 'Depledge Concrete', 'Brian Cooper',
    'AW Vater & Co', 'Centre State Foods', 'G & J East', 'Errington Family',
    'Newbery Chemists', 'Kadina Tyres and Auto', 'Kadina Mitre 10',
  ],
};

const slugify = (s) =>
  s.toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'and')
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Wipe existing sponsor files first so we don't keep stale placeholders.
for (const file of readdirSync(sponsorsDir)) {
  if (file.endsWith('.yml')) unlinkSync(join(sponsorsDir, file));
}

let count = 0;
const wrote = new Set();

for (const [tier, names] of Object.entries(SPONSORS)) {
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    let slug = slugify(name);
    // Disambiguate if a slug collides (e.g. Kadina McDonalds vs McDonalds).
    if (wrote.has(slug)) slug = `${slug}-${tier}`;
    wrote.add(slug);

    const data = {
      name,
      tier,
      order: i + 1,
    };
    writeFileSync(join(sponsorsDir, `${slug}.yml`), stringify(data));
    count++;
  }
}

console.log(`Wrote ${count} sponsor files to ${sponsorsDir}`);
console.log('Tiers:', Object.fromEntries(Object.entries(SPONSORS).map(([t, n]) => [t, n.length])));
