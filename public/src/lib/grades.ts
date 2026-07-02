/**
 * Per-grade metadata for /teams/[grade]/ routes.
 * Kept here (not in a content collection) because it changes rarely and
 * couples to component behaviour (training nights, ladder references).
 *
 * Coach / captain data sourced from wallaroofc.com/list — refresh at the
 * start of each season or when the AGM confirms appointments.
 */
export interface GradeMeta {
  slug: string;
  displayName: string;
  shortName: string;
  bounceTime: string;
  duration: string;
  trainingNight: string;
  /** Maps to the file id in src/content/ladders/. Omit for grades without a ladder (U9, U11). */
  ladderId?: 'a-grade' | 'b-grade' | 'senior-colts' | 'junior-colts';
  description: string;
  coach: string;
  assistants?: string[];
  teamManager?: string;
  captains?: string[];
  viceCaptains?: string[];
  ageBracket: string;
}

export const GRADES: GradeMeta[] = [
  {
    slug: 'a-grade', displayName: 'A-Grade', shortName: 'A-Grade',
    bounceTime: '2:40 PM', duration: '~120 min',
    trainingNight: 'Tuesday & Thursday · 6:00–7:30 PM',
    ladderId: 'a-grade',
    description: "The senior team. Saturday afternoon under the lights of country footy. The same red, white and blue your dad wore — and his dad before him.",
    coach: 'Matt Rankine',
    assistants: ['F. Wanganeen', 'S. Mumford'],
    teamManager: 'J. Russel',
    captains: ['C. Martin', 'H. Errington'],
    viceCaptains: ['D. Westlake', 'J. Summerton'],
    ageBracket: '18+',
  },
  {
    slug: 'b-grade', displayName: 'B Grade', shortName: 'B Grade',
    bounceTime: '12:55 PM', duration: '~110 min',
    trainingNight: 'Tuesday & Thursday · 6:00–7:30 PM',
    ladderId: 'b-grade',
    description: "B Grade plays the second-half of a Saturday double-header. Stepping stone for Senior Colts moving up and recovering A-Graders.",
    coach: 'Jamie Yeates',
    assistants: ['N. Wright', 'A. Dekort'],
    teamManager: 'M. West',
    captains: ['T. Summerton'],
    viceCaptains: ['J. Errington', 'C. Kaiser'],
    ageBracket: '18+',
  },
  {
    slug: 'senior-colts', displayName: 'Senior Colts (U17)', shortName: 'Senior Colts',
    bounceTime: '11:20 AM', duration: '~100 min',
    trainingNight: 'Wednesday · 5:30–7:00 PM',
    ladderId: 'senior-colts',
    description: "The senior pathway grade. Pre-season runs with the B-Grade. Several debut for A-Grade in their final year.",
    coach: 'Caine Kaiser',
    teamManager: 'N. Masters',
    ageBracket: 'Ages 15–17',
  },
  {
    slug: 'junior-colts', displayName: 'Junior Colts (U14)', shortName: 'Junior Colts',
    bounceTime: '10:00 AM', duration: '~90 min',
    trainingNight: 'Wednesday · 5:00–6:30 PM',
    ladderId: 'junior-colts',
    description: "Full-field football, structured training. Where many lifelong Bulldogs careers begin.",
    coach: 'Paul Marner',
    teamManager: 'P. Green',
    ageBracket: 'Ages 12–14',
  },
  {
    slug: 'u11', displayName: 'Under 11', shortName: 'U11',
    bounceTime: '9:00 AM', duration: '~70 min',
    trainingNight: 'Thursday · 4:30–5:30 PM',
    description: "Modified rules and full grades. First real taste of YPFL competition with weekly fixtures and a season ladder.",
    coach: 'Brad Depledge',
    teamManager: 'Boris Depledge',
    ageBracket: 'Ages 9–11',
  },
  {
    slug: 'u9', displayName: 'Under 9', shortName: 'U9',
    bounceTime: '9:00 AM', duration: '~60 min',
    trainingNight: 'Thursday · 4:30–5:30 PM',
    description: "First match-day jumper. Bridging Auskick and competition footy with modified rules and a 9am bounce.",
    coach: 'Dave Thomson',
    teamManager: 'S. Thomson',
    ageBracket: 'Ages 7–9',
  },
];
