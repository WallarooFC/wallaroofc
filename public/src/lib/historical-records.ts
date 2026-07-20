// Auto-transcribed from the club's Historical Records 1888-2008 archive.
// Source: Wallaroo Football Club archive (Michael West, Historian).
// The scanned original — 122 handwritten pages — sits at
// /public/history/historical-records-1888-2008.pdf.

// ── YPFL A Grade final ladder positions ──────────────────────────────────
// From 1961 (when the YPFL premiership sequence in the archive begins) to
// 2008 (the last year the historian's book covers). The premier is column 1,
// runner-up column 2, etc.  Some seasons ran with fewer clubs — trailing
// slots omitted.  Team codes as recorded:
//   And = Andrews · Anh = Anhurton · B = Bute · CY = CY Guyaans ·
//   CMS = Central Moonta/Sat (Combined Moonta Southern) · Eag = Sth Eagles ·
//   K/Kad = Kadina · Mait = Maitland · Moo = Moonta ·
//   Pos/Posky = Parkeville · PVic = Pt Victoria · W = Wallaroo

export type YpflLadder = {
  year:   number;
  positions: string[];   // 1st..Nth
};

export const YPFL_LADDERS: YpflLadder[] = [
  { year: 1961, positions: ['Pt Victoria','Kadina','Moo','Mait','Pos','Anh','And','Price','Wall','Bute'] },
  { year: 1962, positions: ['Parkeville','Kad','Mait','Bute','PVic','Anh','Moo','Wall','And','Price'] },
  { year: 1963, positions: ['Moonta','Kad','Price','Pos','Bute','And','Mait','Wall','PVic','Anh'] },
  { year: 1964, positions: ['Parkeville','Moo','Anh','Price','Kad','PVic','Mait','Wall','Bute','And'] },
  { year: 1965, positions: ['Andrews','Kad','Pos','PVic','Moo','Mait','Anh','Wall','Bute'] },
  { year: 1966, positions: ['Pt Victoria','And','Moo','Mait','Bute','Pos','Anh','Wall','Kad'] },
  { year: 1967, positions: ['Andrews','Mait','PVic','Moo','Bute','Pos','Anh','Kad','Wall'] },
  { year: 1968, positions: ['Andrews','Moo','Pos','Bute','Mait','Kad','Wall','PVic','Anh','Price'] },
  { year: 1969, positions: ['Bute','And','Moo','Mait','Anh','PVic','Pos','Wall','Kad','Price'] },
  { year: 1970, positions: ['Andrews','Bute','Moo','Anh','Mait','Wall','PVic','Kad','Pos','Price'] },
  { year: 1971, positions: ['Andrews','Bute','Moo','Mait','PVic','Kad','Anh','Pos','Price','Wall'] },
  { year: 1972, positions: ['Andrews','Bute','Moo','Mait','Pos','Anh','PVic','Wall','Kad','Price'] },
  { year: 1973, positions: ['Bute','And','Mait','Pos','Wall','Kad','Anh','PVic'] },
  { year: 1974, positions: ['Andrews','Bute','Anh','Wall','Kad','PVic','Pos','Mait','Moo'] },
  { year: 1975, positions: ['Pt Victoria','And','Bute','Anh','Wall','Kad','Mait','Pos','Moo'] },
  { year: 1976, positions: ['Wallaroo','Pos','Kad','Anh','PVic','Mait','And','Bute','Moo'] },
  { year: 1977, positions: ['Pt Victoria','Kad','Wall','Moo','Pos','Bute','Mait','Anh','And'] },
  { year: 1978, positions: ['Bute','And','Kad','Mait','Pos','Wall','PVic','Moo','Anh'] },
  { year: 1979, positions: ['Pt Victoria','Mait','Pos','Kad','And','Bute','Moo','Wall','Anh'] },
  { year: 1980, positions: ['Maitland','And','Moo','Bute','Anh','Kad','Pos','Wall','PVic'] },
  { year: 1981, positions: ['Maitland','And','Kad','Anh','Wall','Bute','Pos','Moo','PVic'] },
  { year: 1982, positions: ['Andrews','Mait','And','Bute','Pos','Moo','Wall','Kad','PVic'] },
  { year: 1983, positions: ['Wallaroo','Mait','Anh','And','Kad','Pos','Moo','Bute','PVic'] },
  { year: 1984, positions: ['Kadina','Anh','Wall','Pos','And','Bute','Moo','Mait','PVic'] },
  { year: 1985, positions: ['Parkeville','Kad','And','Moo','Anh','Mait','PVic','Bute','Wall'] },
  { year: 1986, positions: ['Andrews','Pos','Moo','Mait','Kad','And','Wall','Bute'] },
  { year: 1987, positions: ['Parkeville','Mait','Anh','Kad','Moo','And','Wall','Bute'] },
  { year: 1988, positions: ['Andrews','Mait','Kad','Pos','And','Wall','Bute','Moo'] },
  { year: 1989, positions: ['Andrews','Pos','Anh','Kad','Mait','Wall','Moo','Bute'] },
  { year: 1990, positions: ['Wallaroo','And','Anh','Pos','Kad','Bute','Mait','Moo'] },
  { year: 1991, positions: ['Bute','Wall','Pos','Mait','And','Anh','Kad','Moo'] },
  { year: 1992, positions: ['Wallaroo','Bute','Mait','Anh','And','Moo','Pos','Kad'] },
  { year: 1993, positions: ['Bute','Wall','Mait','Anh','And','Kad','Moo','Pos'] },
  { year: 1994, positions: ['Maitland','Wall','Bute','Eag','CMS','Kad','And','Moo','Anh','Pos'] },
  { year: 1995, positions: ['Eagles','Wall','CMS','Kad','And','Bute','Mait','Anh','Moo','Pos'] },
  { year: 1996, positions: ['Wallaroo','CMS','Kad','Bute','Pos','Moo','Eag','And','Mait','Anh'] },
  { year: 1997, positions: ['Wallaroo','CMS','Moo','Bute','Kad','Eag','Pos','CY','And'] },
  { year: 1998, positions: ['Wallaroo','CMS','Eag','Kad','Bute','Moo','CY','Pos','And'] },
  { year: 1999, positions: ['CMS','Bute','Kad','Pos','CY','Wall','And','Eag','Moo'] },
  { year: 2000, positions: ['Wallaroo','Kad','Bute','Pos','CY','And','Eag','Moo'] },
  { year: 2001, positions: ['Parkeville','Kad','CMS','Bute','Wall','And','CY','Eag','Moo'] },
  { year: 2002, positions: ['Kadina','CMS','Pos','Moo','Bute','And','Wall','Eag','CY'] },
  { year: 2003, positions: ['CMS','Pos','Kad','Bute','Moo','And','CY','Eag','Wall'] },
  { year: 2004, positions: ['Andrews','Bute','Moo','CY','Pos','CMS','Kad','Eag','Wall'] },
  { year: 2005, positions: ['Moonta','Pos','And','Bute','CY','CMS','Kad','Eag','Wall'] },
  { year: 2006, positions: ['CMS','Pos','Moo','CY','Bute','Eag','And','Wall','Kad'] },
  { year: 2007, positions: ['CY Guyaans','Pos','Kad','Bute','Eag','CMS','Moo','Wall'] },
  { year: 2008, positions: ['Sth Eagles','Moo','Bute','Pos','Eag','CMS','Kad','CY','And','Wall'] },
];

// ── Other-grade premierships 1961-2008 ────────────────────────────────────
export type OtherGradePremiership = {
  year: number;
  b_grade:      string;
  senior_colts: string;
  junior_colts: string;
};

export const OTHER_GRADE_PREMIERSHIPS: OtherGradePremiership[] = [
  { year: 1961, b_grade: 'Kadina',     senior_colts: 'Kadina',     junior_colts: '' },
  { year: 1962, b_grade: 'Moonta',     senior_colts: 'Wallaroo',   junior_colts: '' },
  { year: 1963, b_grade: 'Moonta',     senior_colts: 'Parkeville', junior_colts: 'Maitland' },
  { year: 1964, b_grade: 'Moonta',     senior_colts: 'Wallaroo',   junior_colts: 'Maitland' },
  { year: 1965, b_grade: 'Maitland',   senior_colts: 'Kadina',     junior_colts: 'Pt Victoria' },
  { year: 1966, b_grade: 'Parkeville', senior_colts: 'Maitland',   junior_colts: 'Andrews' },
  { year: 1967, b_grade: 'Parkeville', senior_colts: 'Andrews',    junior_colts: 'Andrews' },
  { year: 1968, b_grade: 'Maitland',   senior_colts: 'Andrews',    junior_colts: 'Bute' },
  { year: 1969, b_grade: 'Bute',       senior_colts: 'Andrews',    junior_colts: 'Bute' },
  { year: 1970, b_grade: 'Bute',       senior_colts: 'Bute',       junior_colts: 'Kadina' },
  { year: 1971, b_grade: 'Bute',       senior_colts: 'Bute',       junior_colts: 'Kadina' },
  { year: 1972, b_grade: 'Bute',       senior_colts: 'Pt Victoria',junior_colts: 'Moonta' },
  { year: 1973, b_grade: 'Bute',       senior_colts: 'Kadina',     junior_colts: 'Maitland' },
  { year: 1974, b_grade: 'Bute',       senior_colts: 'Moonta',     junior_colts: 'Kadina' },
  { year: 1975, b_grade: 'Maitland',   senior_colts: 'Maitland',   junior_colts: 'Maitland' },
  { year: 1976, b_grade: 'Kadina',     senior_colts: 'Maitland',   junior_colts: 'Maitland' },
  { year: 1977, b_grade: 'Kadina',     senior_colts: 'Maitland',   junior_colts: 'Maitland' },
  { year: 1978, b_grade: 'Maitland',   senior_colts: 'Pos/Bute',   junior_colts: 'Maitland' },
  { year: 1979, b_grade: 'Andrews',    senior_colts: 'Maitland',   junior_colts: 'Moonta' },
  { year: 1980, b_grade: 'Maitland',   senior_colts: 'Maitland',   junior_colts: 'Kadina' },
  { year: 1981, b_grade: 'Maitland',   senior_colts: 'Wallaroo',   junior_colts: 'Maitland' },
  { year: 1982, b_grade: 'Wallaroo',   senior_colts: 'Kadina',     junior_colts: 'Kadina' },
  { year: 1983, b_grade: 'Moonta',     senior_colts: 'Kadina',     junior_colts: 'Andrews' },
  { year: 1984, b_grade: 'Kadina',     senior_colts: 'Maitland',   junior_colts: 'Andrews' },
  { year: 1985, b_grade: 'Parkeville', senior_colts: 'Andrews',    junior_colts: 'Pt Victoria' },
  { year: 1986, b_grade: 'Andrews',    senior_colts: 'Bute',       junior_colts: 'Anhurton' },
  { year: 1987, b_grade: 'Maitland',   senior_colts: 'Wallaroo',   junior_colts: 'Anhurton' },
  { year: 1988, b_grade: 'Andrews',    senior_colts: 'Wallaroo',   junior_colts: 'Parkeville' },
  { year: 1989, b_grade: 'Maitland',   senior_colts: 'Andrews',    junior_colts: 'Kadina' },
  { year: 1990, b_grade: 'Wallaroo',   senior_colts: 'Bute',       junior_colts: 'Kadina' },
  { year: 1991, b_grade: 'Bute',       senior_colts: 'Maitland',   junior_colts: 'Wallaroo' },
  { year: 1992, b_grade: 'Maitland',   senior_colts: 'Kadina',     junior_colts: 'Kadina' },
  { year: 1993, b_grade: 'Anhurton',   senior_colts: 'Wallaroo',   junior_colts: 'Kadina' },
  { year: 1994, b_grade: 'Sth Eagles', senior_colts: 'CMS',        junior_colts: 'CMS' },
  { year: 1995, b_grade: 'CMS',        senior_colts: 'Kadina',     junior_colts: 'CMS' },
  { year: 1996, b_grade: 'Wallaroo',   senior_colts: 'Sth Eagles', junior_colts: 'Sth Eagles' },
  { year: 1997, b_grade: 'Wallaroo',   senior_colts: 'CY Guyaans', junior_colts: 'Sth Eagles' },
  { year: 1998, b_grade: 'Wallaroo',   senior_colts: 'CY Guyaans', junior_colts: 'CMS' },
  { year: 1999, b_grade: 'CMS',        senior_colts: 'CMS',        junior_colts: 'CMS' },
  { year: 2000, b_grade: 'CMS',        senior_colts: 'CY Guyaans', junior_colts: 'CY Guyaans' },
  { year: 2001, b_grade: 'Kadina',     senior_colts: 'CMS',        junior_colts: 'Kadina' },
  { year: 2002, b_grade: 'Kadina',     senior_colts: 'CMS',        junior_colts: 'CMS' },
  { year: 2003, b_grade: 'Kadina',     senior_colts: 'Kadina',     junior_colts: 'Andrews' },
  { year: 2004, b_grade: 'Kadina',     senior_colts: 'Kadina',     junior_colts: 'CMS' },
  { year: 2005, b_grade: 'Kadina',     senior_colts: 'CY Guyaans', junior_colts: 'Andrews' },
  { year: 2006, b_grade: 'Moonta',     senior_colts: 'CMS',        junior_colts: 'Kadina' },
  { year: 2007, b_grade: 'CY Guyaans', senior_colts: 'Sth Eagles', junior_colts: 'Moonta' },
  { year: 2008, b_grade: 'Sth Eagles', senior_colts: 'Andrews',    junior_colts: 'CMS' },
];

// ── Wallaroo Bulldogs to SANFL ─────────────────────────────────────────────
// Every Wallaroo-linked player who went on to play SANFL (or WAFL/VFL/AFL)
// as recorded in the Historical Records archive. Original abbreviations
// preserved — WAdel = West Adelaide, NAdel = North Adelaide, SAdel = South
// Adelaide, PAdel = Port Adelaide, Stunt = Sturt, Nor = Norwood, Glen =
// Glenelg, W Torr = West Torrens, NMelb = North Melbourne, etc.
export type SanflPlayer = {
  surname: string;
  given:   string;
  clubs:   string;  // as-recorded
  note?:   string;
};

export const SANFL_PLAYERS: SanflPlayer[] = [
  { surname: 'Avery',       given: 'Bill',            clubs: 'WAdel 1963 (2 games — 0 goals)' },
  { surname: 'Appleton',    given: 'Edgar Arthur',    clubs: 'SAdel 1933-40 (48-13)', note: '1938 Premiership' },
  { surname: 'Baker',       given: 'John "Beefy"',    clubs: 'WAdel 1910-15, 1919-20 (85-15) · Stunt 1921-22 (18-6) · SAust 1920 (1-0)', note: '1911-12 Premierships · Coach WA 1936' },
  { surname: 'Boase',       given: 'Michael',         clubs: 'Norwood 1971 (2-0)' },
  { surname: 'Bradley',     given: 'Jacob "Snake"',   clubs: 'Glenelg 1924 (5-1)' },
  { surname: 'Ball',        given: 'Douglas James',   clubs: 'WAdel 1935-36 (23-6)' },
  { surname: 'Borlace',     given: 'Scott Matthew',   clubs: 'Sturt (SA Cty), Norwood 1998-' },
  { surname: 'Conole',      given: 'Reginald Eric',   clubs: 'PAdel 1926-29 (61-42) · SAust 1929 (1-0) · Melbourne 1930-33 (47-6)', note: '★ 1927 Magarey Medal · 1928 Premiership · Kicked 83 in a match in Victoria — vs 26 at Ports' },
  { surname: 'Conole',      given: 'Dennis',          clubs: 'W Torr 1946 (1-0)', note: 'Son of R.E. Conole' },
  { surname: 'Cobb',        given: 'Douglas Godfrey', clubs: 'Stunt 1947 (4-10)', note: 'Whittled at Kangaroos c.1950' },
  { surname: 'Coley',       given: 'George E.R.',     clubs: 'WAdel 1905 (12-14) · SAdel 1907-14 (66-10)', note: 'Fell/road leading c.1900' },
  { surname: 'Clarke',      given: 'Stanley Richard', clubs: 'Glen 1923-24 (13-3)' },
  { surname: 'Donovan',     given: 'Patrick L.',      clubs: 'SAdel 1933-40 (48-0)', note: 'SAdel Premiership 1938 · SA/ST 1944 (1-0) · Subiaco 1946-47 (34-)', note_extra: 'Trials with N.Melb in later years' },
  { surname: 'Davies',      given: 'Lloyd Rees',      clubs: 'N Adel 1920-23 (24-34) · B/F 1920, 21 · NAdel 1926 Premiership', note: '"Unlucky to miss SAdel selection 1921"' },
  { surname: 'Edwards',     given: 'Clement',         clubs: 'W Torr 1928 (2-0) · Nor 1933-35 (24-8)', note: 'Brother-in-law of "Masher" Thomas · Son Doug (W Torr 1951-52, 54-55 21-1) · Grandsons: Russell NAdel 1956-57 3-3 · PAdel 1955 7-0 · Greg C. Districts (Kicked opposite one year) · Great-Grandson Shane NAdel 2005-06 (10-7) currently with N.Melb 2007-' },
  { surname: 'Fulton',      given: 'Claude Victor',   clubs: 'WAdel 1900-04, 07 (63-13) · Capt 1904, 1907 · Sturt 1905-06 (17-1) · Capt 1905-06' },
  { surname: 'Golding',     given: 'Leonard Cyril',   clubs: 'Stunt 1925, 1934 (13-3) · WAdel 1930-33 (44-61)', note: '(Kadina/Wallaroo)' },
  { surname: 'Graham',      given: 'Howard Ray',      clubs: 'WAdel 1931 (12-30)', note: 'Bros' },
  { surname: 'Graham',      given: 'James Henry',     clubs: 'WAdel 1931-35 (55-6)', note: '"Best CHB in State"' },
  { surname: 'Goodes',      given: 'Adam',            clubs: 'Sydney Swans …', note: '★ Sydney Swans premiership player & dual Brownlow medallist' },
  { surname: 'Hopkins',     given: 'George Gabriel',  clubs: 'Fremantle 1898-99 · E.Free 1899, 1904 · Sth Free 1900' },
  { surname: 'James',       given: 'Geoffrey',        clubs: 'WAdel 1988-89 (19-32)' },
  { surname: 'Jones',       given: 'Thomas Edgar "Hongo"', clubs: 'SAdel 1910-15 (54-21) · SAust 1910-11, 13 (3-0)' },
  { surname: 'Juniper',     given: 'Samuel Alfred',   clubs: 'Norwood 1909 (4-0)' },
  { surname: 'Evans',       given: 'Jimma',           clubs: 'WAdel …' },
  { surname: 'Kempster',    given: 'Henry',           clubs: 'PAdel 1888-90, 1892-95 (47-1) · SAust 1894 (1-0)' },
  { surname: 'Kempster',    given: 'Walter Fleet',    clubs: 'SAdel 1887 · PAdel 1889-91, 93-95, 97 (96-3)', note: 'Bros with Henry, Archie' },
  { surname: 'Kempster',    given: '"Archie"',        clubs: 'SAust 1890, 94 (3-0) · PAdel 1892-94, 96- (44-0) · WAdel 1899 (1-0)' },
  { surname: 'Kempster',    given: 'William Thomas',  clubs: 'W Torr 1926-28 (27-43)', note: 'Son of Archie' },
  { surname: 'Kempster',    given: 'Harry',           clubs: 'WAdel 1922-25, 31-32 (44-35)', note: 'Son of W.F.' },
  { surname: 'Kempster',    given: 'Walter',          clubs: 'SAdel 1919 (1-0) · SAdel 1929 (2-2)' },
  { surname: 'Lakeman',     given: 'Joscelin Cuthbert "Jos"', clubs: 'WAdel 1922, 24 (29-25)' },
  { surname: 'Lawson',      given: 'John Douglas',    clubs: 'Nor 1927-28 (9-10)' },
  { surname: 'Landon',      given: 'Bob',             clubs: 'PAdel 1934, 1936 (7-1)' },
  { surname: 'Murch',       given: 'Cecil',           clubs: 'NAdel 1914-15 (16-1)', note: 'Recruited while working & playing in Wallaroo' },
  { surname: 'Mutton',      given: 'Lyell Albert "Snide"', clubs: 'Glen 1922 (9-7) · Nor 1923-33 (134-226)', note: 'Nor Premiers 1923, 25, 29 · SAust 1924, 29 (3-5)' },
  { surname: 'Olds',        given: 'John Leslie',     clubs: 'SAdel 1914 (3-1)' },
  { surname: 'Ryles',       given: 'Colin Anthony',   clubs: 'Woody 1979, 81 (2-0)' },
  { surname: 'Surfield',    given: 'Thomas',          clubs: 'WAdel 1903 (1-2)' },
  { surname: 'Spry',        given: 'John William',    clubs: 'Glen 1922-25 (33-6) · Stunt 1926 (5-1)' },
  { surname: 'Tomlin',      given: 'Albert Edward P.',clubs: 'PAdel 1893-94 (93-4) · B/F 1892 · Capt 1893 · Natives (W Torr) 1895 (Capt) · SAdel 1896-99 (Capt 1898-99) · Sturt 1902-03 (Capt 1902-03) (24-3)', note: 'Brother-in-law to Kempsters' },
  { surname: 'Triplett',    given: 'Samuel',          clubs: 'Imperials (WAFL) 1897' },
  { surname: 'Thomas',      given: 'David "Taff"',    clubs: 'PAdel 1898-2000 (41-3)' },
  { surname: 'Thomas',      given: 'John "Tots"',     clubs: 'PAdel 1894-95 (2-0)' },
  { surname: 'Thomas',      given: 'Thomas "Masher"', clubs: 'WAdel 1909 (9-0)', note: 'Coach SAdel 1910-11, 1913' },
  { surname: 'Westlake',    given: 'Stan',            clubs: 'WAdel 1938 (2-1)' },
  { surname: 'Warmington',  given: 'Ernest',          clubs: 'Wall 1890s-1900s · PAdel 1873, 1875', note: 'Pre-Rebels' },
  { surname: 'Watson',      given: 'Donald',          clubs: 'Nor 1950-52 (28-0)', note: 'Went to Woomera' },
  { surname: 'Walsh',       given: 'Douglas John',    clubs: 'PAdel 1908 (8-2) · Stunt 1910-12 (32-2)', note: 'Chosen in SAust team 1911 but didn\'t play · Died of War wounds 1918' },
  { surname: 'Walsh',       given: 'Daniel John',     clubs: 'NAdel 1994-97, 99 (39-27)', note: 'Born Wallaroo?' },
  { surname: 'Wainwright',  given: 'James William',   clubs: 'W Torr 1907-11 (29-28) · NAdel 1913-14 (22-9) · SAdel 1919-20, 21 (20-27) (Total 7-64)', note: 'Prayed c.1907' },
];

// ── YPFL Mail Medal — Wallaroo winners only ─────────────────────────────
// From the archive's Mail Medalists roll 1961-2008. Only club wins listed
// here; the full cross-club list lives in the scanned original.
export type MailMedalWin = {
  year:  number;
  grade: 'A Grade' | 'B Grade' | 'Senior Colts' | 'Junior Colts' | 'U18 Tr' | 'Goalkicking';
  name:  string;
  detail?: string;
};

export const WALLAROO_MAIL_MEDALS: MailMedalWin[] = [
  { year: 1961, grade: 'Junior Colts', name: 'R. Standford' },
  { year: 1966, grade: 'Senior Colts', name: 'Graham Smith' },
  { year: 1967, grade: 'B Grade',      name: 'Norm Phillips' },
  { year: 1967, grade: 'Senior Colts', name: 'Graham Smith' },
  { year: 1968, grade: 'A Grade',      name: 'Peter Mildran' },
  { year: 1976, grade: 'A Grade',      name: 'Bennie Smith' },
  { year: 1984, grade: 'Goalkicking',  name: 'Rey Higgins', detail: '101 goals' },
  { year: 1987, grade: 'B Grade',      name: 'Bende Smith' },
  { year: 1987, grade: 'Senior Colts', name: 'Greg Chittleborough' },
  { year: 1988, grade: 'Goalkicking',  name: 'R. Higgins', detail: '93 goals' },
  { year: 1993, grade: 'Senior Colts', name: 'Stephen Dahnl' },
  { year: 1995, grade: 'A Grade',      name: 'Geoff James' },
  { year: 1995, grade: 'Goalkicking',  name: 'Geoff James', detail: '131 goals' },
  { year: 1996, grade: 'Goalkicking',  name: 'Geoff James', detail: '134 goals' },
  { year: 1997, grade: 'Goalkicking',  name: 'Geoff James', detail: '109 goals' },
  { year: 1998, grade: 'Goalkicking',  name: 'Geoff James', detail: '120 goals' },
  { year: 1999, grade: 'Goalkicking',  name: 'Geoff James', detail: '100 goals' },
];
