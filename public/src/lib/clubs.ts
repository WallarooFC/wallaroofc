/**
 * Central registry of YPFL clubs and their crest imports.
 * Static imports so Astro/Vite can bundle and optimise each asset.
 *
 * Update this file when a club joins/leaves the league or a crest is updated.
 */
import type { ImageMetadata } from 'astro';

import wallarooBulldog from '../assets/logos/wallaroo-bulldog.jpg';
import ardrossan from '../assets/logos/ardrossan.jpg';
import bute from '../assets/logos/bute.jpg';
import centralYorke from '../assets/logos/central-yorke.jpg';
import cmsCrows from '../assets/logos/cms-crows.jpg';
import kadina from '../assets/logos/kadina.jpg';
import moonta from '../assets/logos/moonta.jpg';
import paskeville from '../assets/logos/paskeville.jpg';
import southernEagles from '../assets/logos/southern-eagles.jpg';

export type ClubSlug =
  | 'wallaroo'
  | 'ardrossan'
  | 'bute'
  | 'central-yorke'
  | 'cms'
  | 'kadina'
  | 'moonta'
  | 'paskeville'
  | 'southern-eagles';

export interface Club {
  slug: ClubSlug;
  name: string;
  nickname: string;
  crest: ImageMetadata;
  altName: string;
}

export const CLUBS: Record<ClubSlug, Club> = {
  'wallaroo':         { slug: 'wallaroo',         name: 'Wallaroo',       nickname: 'Bulldogs',       crest: wallarooBulldog, altName: 'Wallaroo Football Club crest' },
  'ardrossan':        { slug: 'ardrossan',        name: 'Ardrossan',      nickname: 'Kangaroos',      crest: ardrossan,       altName: 'Ardrossan Kangaroos Football Club crest' },
  'bute':             { slug: 'bute',             name: 'Bute',           nickname: 'Roosters',       crest: bute,            altName: 'Bute Roosters Football Club crest' },
  'central-yorke':    { slug: 'central-yorke',    name: 'Central Yorke',  nickname: 'Cougars',        crest: centralYorke,    altName: 'Central Yorke Cougars Football Club crest' },
  'cms':              { slug: 'cms',              name: 'CMS',            nickname: 'Crows',          crest: cmsCrows,        altName: 'CMS Crows Football Club crest' },
  'kadina':           { slug: 'kadina',           name: 'Kadina',         nickname: 'Bloods',         crest: kadina,          altName: 'Kadina Bloods Football Club crest' },
  'moonta':           { slug: 'moonta',           name: 'Moonta',         nickname: 'Demons',         crest: moonta,          altName: 'Moonta Demons Football Club crest' },
  'paskeville':       { slug: 'paskeville',       name: 'Paskeville',     nickname: 'Magpies',        crest: paskeville,      altName: 'Paskeville Magpies Football Club crest' },
  'southern-eagles':  { slug: 'southern-eagles',  name: 'Southern',       nickname: 'Eagles',         crest: southernEagles,  altName: 'Southern Eagles Football Club crest' },
};

export const CLUB_ORDER: ClubSlug[] = [
  'ardrossan', 'bute', 'central-yorke', 'cms', 'kadina',
  'moonta', 'paskeville', 'southern-eagles', 'wallaroo',
];

/** Map a PlayHQ/Supabase team name string to a ClubSlug for crests */
const NAME_MAP: Record<string, ClubSlug> = {
  'wallaroo':          'wallaroo',
  'wallaroo fc':       'wallaroo',
  'wallaroo bulldogs': 'wallaroo',
  'ardrossan':         'ardrossan',
  'bute':              'bute',
  'central yorke':     'central-yorke',
  'central-yorke':     'central-yorke',
  'cms':               'cms',
  'cms crows':         'cms',
  'kadina':            'kadina',
  'moonta':            'moonta',
  'paskeville':        'paskeville',
  'southern eagles':   'southern-eagles',
  'southern':          'southern-eagles',
};

export function nameToSlug(name?: string | null): ClubSlug | undefined {
  if (!name) return undefined;
  return NAME_MAP[name.toLowerCase().trim()];
}
