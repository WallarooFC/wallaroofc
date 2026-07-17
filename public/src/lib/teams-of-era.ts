// Wallaroo FC Teams of the Era — the club's own selected line-ups for
// the last half-century plus decade-by-decade Bulldog XIs. Positions
// follow the classic Australian rules football lineup: 3 forwards, 3 half
// forwards, 3 centre, 3 half back, 3 backs, ruck (usually 3 — followers),
// bench (4). Where a player carried the 2nd Ruck role, the archive marks
// them with a '*' — preserved here.

export type TeamPositions = {
  forwards:      string[];
  half_forwards: string[];
  centre:        string[];
  half_back:     string[];
  backs:         string[];
  first_ruck:    string[];
  bench:         string[];
  coach?:        string;
};

export type EraTeam = {
  id:       string;
  title:    string;
  subtitle: string;
  positions: TeamPositions;
  note?:    string;
};

export const ERA_TEAMS: EraTeam[] = [
  {
    id: 'half-century',
    title: 'Team of the Last 50 Years',
    subtitle: '1970 – 2020',
    positions: {
      forwards:      ['S. Dunstan*', 'G. James',   'S. Dohnt*'],
      half_forwards: ['M. Jeffries*','P. Mildren', 'M. Oliver'],
      centre:        ['S. Willment', 'I. Borchard','C. Mansell'],
      half_back:     ['G. Simpson',  'R. Hibbard', 'B. Smith'],
      backs:         ['D. Haylock',  'M. Lilikakis','J. Wilkinson'],
      first_ruck:    ['R. Lounder',  'B. Kennedy', 'M. Daniel'],
      bench:         ['D. Owen', 'L. Pearce', 'C. Ryles', 'S. Taylor'],
      coach:         'J. Ryan',
    },
    note: 'The Bulldog XVIII of the last half-century — voted by the club.',
  },
  {
    id: '70s',
    title: 'Team of the 70s',
    subtitle: '1970 – 1979',
    positions: {
      forwards:      ['C. Ryles*',   'R. Newhousen','D. Haylock'],
      half_forwards: ['G. Borlace',  'P. Mildren', 'K. Penney'],
      centre:        ['N. Tobin',    'J. Ryan',    'I. Thomas'],
      half_back:     ['J. Cass',     'G. Oliver',  'G. Simpson'],
      backs:         ['B. Hann',     'R. Hibbard', 'J. Boys'],
      first_ruck:    ['J. Slee',     'B. Smith',   'P. Miller'],
      bench:         ['P. Sanders',  'B. Cronin',  'P. Willment','J. Evans'],
    },
  },
  {
    id: '80s',
    title: 'Team of the 80s',
    subtitle: '1980 – 1989',
    positions: {
      forwards:      ['P. Miller*',  'R. Higgins', 'D. Haylock*'],
      half_forwards: ['K. Penney',   'R. Cock',    'G. Jarman*'],
      centre:        ['D. Thomson',  'I. Borchard','C. Ryles'],
      half_back:     ['J. Cass',     'I. Westbrook','G. Simpson'],
      backs:         ['J. Mensforth','B. Hann',    'J. Boys'],
      first_ruck:    ['A. Ladner',   'B. Smith',   'C. Kartinyeri'],
      bench:         ['P. Penney',   'T. White',   'K. Flint',   'M. Dalby'],
    },
  },
  {
    id: '90s',
    title: 'Team of the 90s',
    subtitle: '1990 – 1999',
    positions: {
      forwards:      ['R. Higgins',       'G. James',      'M. Rayner'],
      half_forwards: ['S. Dohnt*',        'M. Oliver',     'S. Taylor'],
      centre:        ['S. Willment',      'M. Daniel',     'D. Page'],
      half_back:     ['J. Chittleborough','J. Wilkinson',  'W. Bown'],
      backs:         ['C. Johns',         'M. Lilikakis',  'D. Owen'],
      first_ruck:    ['R. Lounder',       'L. Pearce',     'B. Kennedy'],
      bench:         ['D. Price', 'S. Adams', 'D. Thomson', 'R. Depledge'],
    },
    note: 'The Bulldog dynasty that lifted three straight A Grade flags 1996-98.',
  },
  {
    id: '00s',
    title: 'Team of the 00s',
    subtitle: '2000 – 2009',
    positions: {
      forwards:      ['D. Price*',        'G. James',      'M. Rayner*'],
      half_forwards: ['S. Broad*',        'N. Flynn',      'S. Dohnt'],
      centre:        ['S. Ebert',         'C. Mansell',    'S. Willment'],
      half_back:     ['J. Chittleborough','D. Owen',       'J. Beatie'],
      backs:         ['W. Bown',          'B. Cuthill',    'M. Grillett'],
      first_ruck:    ['S. Dunstan',       'M. Jeffries',   'A. Tomich'],
      bench:         ['R. Juckers', 'C. Johns', 'T. Desfontains', 'S. Dalby'],
    },
  },
  {
    id: '10s',
    title: 'Team of the 10s',
    subtitle: '2010 – 2019',
    positions: {
      forwards:      ['C. Martin',     'A. Ross',     'J. Bollmeyer'],
      half_forwards: ['N. Murphy*',    'D. Cutting',  'L. Carey*'],
      centre:        ['C. Norsworthy', 'B. Russell',  'B. Ellis'],
      half_back:     ['I. Bollmeyer',  'M. Grillett', 'D. Westlake'],
      backs:         ['G. Bretten',    'M. Beadle',   'S. Flint'],
      first_ruck:    ['N. Wright',     'S. Jordan',   'R. Westlake'],
      bench:         ['S. Holman', 'C. Jamar*', 'J. Bollmeyer', 'B. Abela'],
    },
  },
];
