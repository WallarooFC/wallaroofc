// Wallaroo FC Grand Final Ledger — every recorded flag, every score.
// Source: club archive as displayed on the current honours boards
// (transcribed by the Historian; scores where recorded).

export type GrandFinal = {
  year:    number;
  score?:  string;         // e.g. "11-10-76"
  opp?:    string;         // opponent name
  opp_score?: string;      // opponent score
  bog?:    string;         // best on ground (senior colts / mod-era)
};

export const A_GRADE_FINALS: GrandFinal[] = [
  { year: 1889 },
  { year: 1892 },
  { year: 1896 },
  { year: 1897 },
  { year: 1899 },
  { year: 1900 },
  { year: 1902, score: '3-12-30', opp: 'Wallaroo Mines', opp_score: '3-7-25' },
  { year: 1905, score: '10-3-63', opp: 'Wallaroo Mines', opp_score: '5-1-31' },
  { year: 1913, score: '8-7-55',  opp: 'Kadina',         opp_score: '8-6-54' },
  { year: 1914, score: '10-8-68', opp: 'Kadina',         opp_score: '6-9-45' },
  { year: 1919, score: '6-15-51', opp: 'Kadina',         opp_score: '5-5-35' },
  { year: 1920, score: '8-13-61', opp: 'Rovers',         opp_score: '6-4-40' },
  { year: 1925, score: '10-12-72',opp: 'Kadina',         opp_score: '9-9-63' },
  { year: 1927, score: '9-7-61',  opp: 'Kadina',         opp_score: '4-15-39' },
  { year: 1945, score: '11-10-76',opp: 'Paskeville',     opp_score: '10-10-70' },
  { year: 1950, score: '11-15-81',opp: 'Moonta',         opp_score: '7-9-51' },
  { year: 1952, score: '17-16-118',opp:'Kadina',         opp_score: '12-10-82' },
  { year: 1953, score: '10-6-66', opp: 'Kadina',         opp_score: '5-7-37' },
  { year: 1954, score: '11-6-72', opp: 'Paskeville',     opp_score: '9-10-64' },
  { year: 1976, score: '19-18-132',opp:'Paskeville',     opp_score: '14-17-101', bog: 'D. Haylock' },
  { year: 1983, score: '28-17-185',opp:'Maitland',       opp_score: '22-15-147', bog: 'B. Smith' },
  { year: 1990, score: '15-22-112',opp:'Ardrossan',      opp_score: '11-14-80',  bog: 'B. Kennedy' },
  { year: 1992, score: '17-11-113',opp:'Bute',           opp_score: '11-6-72',   bog: 'D. Page' },
  { year: 1996, score: '23-13-151',opp:'CMS Crows',      opp_score: '9-10-64',   bog: 'D. Owen' },
  { year: 1997, score: '16-16-112',opp:'CMS Crows',      opp_score: '10-10-70',  bog: 'M. Daniel' },
  { year: 1998, score: '15-15-105',opp:'CMS Crows',      opp_score: '10-11-71',  bog: 'M. Daniel' },
  { year: 2000, score: '14-13-97',opp: 'Kadina',         opp_score: '9-6-60',    bog: 'Darren Price' },
];

export const RESERVES_FINALS: GrandFinal[] = [
  { year: 1952, score: '17-16-118',opp:'Kadina',         opp_score: '12-10-82' },
  { year: 1958, score: '9-1-55',   opp:'Moonta',         opp_score: '8-5-53' },
  { year: 1982, score: '11-12-78', opp:'Maitland',       opp_score: '3-10-28',  bog: 'D. Kneebone' },
  { year: 1990, score: '13-11-89', opp:'Moonta',         opp_score: '8-4-52',   bog: 'S. Grillett' },
  { year: 1996, score: '8-10-58',  opp:'CMS Crows',      opp_score: '7-9-51',   bog: 'S. Scholes' },
  { year: 1997, score: '10-1-71',  opp:'Paskeville',     opp_score: '4-2-26',   bog: 'N. Raymond' },
  { year: 1998, score: '8-13-61',  opp:'CMS Crows',      opp_score: '4-8-32',   bog: 'S. Miller' },
];

export const SENIOR_COLTS_FINALS: GrandFinal[] = [
  { year: 1953, score: '10-6-66',  opp:'Kadina',         opp_score: '5-7-37' },
  { year: 1959, score: '9-9-63',   opp:'Moonta',         opp_score: '1-4-10' },
  { year: 1962, score: '2-12-24',  opp:'Paskeville',     opp_score: '3-2-20' },
  { year: 1964, score: '5-9-39',   opp:'Maitland',       opp_score: '4-8-32' },
  { year: 1981, score: '6-8-44',   opp:'Moonta',         opp_score: '6-5-41' },
  { year: 1987, score: '15-5-95',  opp:'Kadina',         opp_score: '7-3-45',   bog: 'C. Chittleborough' },
  { year: 1988, score: '6-7-43',   opp:'Bute',           opp_score: '3-6-24',   bog: 'M. Kromwyk' },
  { year: 1993, score: '9-6-60',   opp:'Kadina',         opp_score: '7-11-53' },
  { year: 2014, score: '10-12-72', opp:'CMS Crows',      opp_score: '5-5-36',   bog: 'L. Kirley' },
  { year: 2022, score: '13-7-85',  opp:'Cougars',        opp_score: '4-6-30',   bog: 'D. Bagnato' },
  { year: 2023, score: '10-14-74', opp:'Kadina',         opp_score: '4-4-28',   bog: 'J. Mumford' },
  { year: 2024, score: '13-22-100',opp:'Cougars',        opp_score: '6-5-41',   bog: 'J. Bull' },
  { year: 2025, score: '8-5-53',   opp:'Moonta',         opp_score: '4-6-30',   bog: 'H. Wellgreen' },
];

export const JUNIOR_COLTS_FINALS: GrandFinal[] = [
  { year: 1991, score: '6-11-47',  opp:'Ardrossan',      opp_score: '4-4-28',   bog: 'M. Oliver' },
  { year: 2021, score: '10-6-66',  opp:'Central Yorke',  opp_score: '1-3-9',    bog: 'H. Northeast' },
  { year: 2022, score: '12-17-89', opp:'Cougars',        opp_score: '0-3-3',    bog: 'H. Wellgreen' },
  { year: 2025, score: '6-7-43',   opp:'Crows',          opp_score: '3-1-19',   bog: 'H. Humford' },
];

// Before 1946, the colts and reserves ran as one competition — while still
// affiliated. Only the Bulldog grade is recorded.
export const PRE_1946_JUNIORS_RESERVES: { year: number; grade: string }[] = [
  { year: 1911, grade: 'Wallaroo II' },
  { year: 1912, grade: 'Wallaroo Juniors' },
  { year: 1925, grade: 'Wallaroo Swimmers' },
  { year: 1926, grade: 'Wallaroo Juniors' },
  { year: 1927, grade: 'Wallaroo Swimmers' },
  { year: 1934, grade: 'Wallaroo Juniors' },
  { year: 1936, grade: 'Wallaroo Juniors' },
  { year: 1942, grade: 'Wallaroo Juniors' },
  { year: 1943, grade: 'Wallaroo Juniors' },
];
