/**
 * PlayHQ public GraphQL client
 *
 * Uses the same GraphQL API that powers www.playhq.com — no API key needed.
 * Origin: https://www.playhq.com is sufficient for unauthenticated public data.
 *
 * YPFL 2026 grade IDs (from public PlayHQ URLs, stable for the season):
 *   A-Grade:      35988582
 *   Reserves:     a5a21c9a   (→ "B Grade" on site)
 *   U17 Boys:     8a1a6dcf   (→ "Senior Colts")
 *   U14 Mixed:    679a5557   (→ "Junior Colts")
 */

const GRAPHQL = 'https://api.playhq.com/graphql';
export const WALLAROO_ORG_ID = '55ab4e41';

// ── Grade map: PlayHQ grade ID → site display name ──────────────────────────
export const YPFL_GRADES = [
  { id: '35988582', siteName: 'A-Grade'      },
  { id: 'a5a21c9a', siteName: 'B Grade'      },
  { id: '8a1a6dcf', siteName: 'Senior Colts' },
  { id: '679a5557', siteName: 'Junior Colts' },
] as const;

export type GradeInfo = typeof YPFL_GRADES[number];

// ── HTTP ─────────────────────────────────────────────────────────────────────

function gqlHeaders() {
  return {
    'Content-Type': 'application/json',
    'Origin':       'https://www.playhq.com',
    'Referer':      'https://www.playhq.com/',
    'User-Agent':   'Mozilla/5.0 (compatible; WallarooFC/1.0)',
    'tenant':       'afl',
  };
}

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(GRAPHQL, {
    method:  'POST',
    headers: gqlHeaders(),
    body:    JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`PlayHQ GraphQL HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Strip grade suffix from PlayHQ team names.
 * PlayHQ appends " - Grade" to disambiguate clubs with multiple teams:
 *   "Kadina - A Grade" → "Kadina"
 *   "CMS Crows - Reserves" → "CMS Crows"
 *   "Wallaroo - U17" → "Wallaroo"
 */
function stripGrade(name: string): string {
  const i = name.indexOf(' - ');
  return i === -1 ? name : name.slice(0, i).trim();
}

/** Extract total points from the statistics array returned by PlayHQ */
function totalScore(statistics: Array<{ count: number; type: { value: string } }> | null | undefined): number | undefined {
  if (!statistics) return undefined;
  const s = statistics.find(x => x.type.value === 'TOTAL_SCORE');
  return s ? s.count : undefined;
}

/** Parse round number from PlayHQ round name ("Round 7" → 7, "Final" → NaN) */
function parseRound(name: string): number {
  const m = name.match(/\d+/);
  return m ? parseInt(m[0]) : NaN;
}

function isWallaroo(orgId: string) {
  return orgId === WALLAROO_ORG_ID;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface PHQGame {
  id: string;
  roundNumber: number;
  roundName: string;
  grade: string;          // site display name e.g. "A-Grade"
  status: 'completed' | 'upcoming' | 'bye';
  homeTeam: { id: string; name: string; orgId: string } | null;
  awayTeam: { id: string; name: string; orgId: string } | null;
  homeScore: number | undefined;
  awayScore: number | undefined;
  byeTeam: { id: string; name: string } | null;
  isWallarooHome: boolean;
  isWallarooAway: boolean;
}

export interface PHQLadderRow {
  grade: string;
  rank: number;
  teamId: string;
  teamName: string;
  orgId: string;
  orgName: string;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  byes: number;
  pointsFor: number;
  pointsAgainst: number;
  percentage: number;
}

// ── Queries ──────────────────────────────────────────────────────────────────

const GRADE_FIXTURE_QUERY = `
query discoverGradeFixture($gradeID: ID!) {
  discoverGradeFixture(gradeID: $gradeID) {
    id
    name
    isFinalsRound
    byes {
      ... on DiscoverTeam {
        id
        name
        organisation { id name }
      }
    }
    games {
      id
      status { value }
      home {
        ... on DiscoverTeam {
          id
          name
          organisation { id name }
        }
      }
      away {
        ... on DiscoverTeam {
          id
          name
          organisation { id name }
        }
      }
      result {
        home {
          statistics { count type { value } }
        }
        away {
          statistics { count type { value } }
        }
      }
    }
  }
}`;

const GRADE_LADDER_QUERY = `
query gradeLadder($gradeID: ID!) {
  discoverGrade(gradeID: $gradeID) {
    id
    name
    ladder {
      standings {
        team {
          id
          name
          organisation { id name }
        }
        played
        won
        lost
        drawn
        byes
        pointsFor
        pointsAgainst
        percentage
      }
    }
  }
}`;

// ── Public API ───────────────────────────────────────────────────────────────

/** Fetch all rounds + games for a grade. Returns flat list of PHQGame objects. */
export async function getGradeFixtures(gradeId: string, siteName: string): Promise<PHQGame[]> {
  const data = await gql<any>(GRADE_FIXTURE_QUERY, { gradeID: gradeId });
  const rounds: any[] = data.discoverGradeFixture ?? [];
  const games: PHQGame[] = [];

  for (const round of rounds) {
    if (round.isFinalsRound) continue; // skip finals — handled separately
    const roundNumber = parseRound(round.name);
    if (isNaN(roundNumber)) continue;

    // Bye entries
    for (const bye of round.byes ?? []) {
      games.push({
        id:             `bye-${round.id}-${bye.id}`,
        roundNumber,
        roundName:      round.name,
        grade:          siteName,
        status:         'bye',
        homeTeam:       null,
        awayTeam:       null,
        homeScore:      undefined,
        awayScore:      undefined,
        byeTeam:        { id: bye.id, name: stripGrade(bye.name) },
        isWallarooHome: false,
        isWallarooAway: false,
      });
    }

    // Game entries
    for (const game of round.games ?? []) {
      const statusVal: string = game.status?.value ?? 'UPCOMING';
      const status = statusVal === 'FINAL' ? 'completed' : 'upcoming';

      const home = game.home ?? null;
      const away = game.away ?? null;
      const res  = game.result ?? null;

      const homeScore = totalScore(res?.home?.statistics);
      const awayScore = totalScore(res?.away?.statistics);

      games.push({
        id:             game.id,
        roundNumber,
        roundName:      round.name,
        grade:          siteName,
        status,
        homeTeam:       home ? { id: home.id, name: stripGrade(home.name), orgId: home.organisation?.id } : null,
        awayTeam:       away ? { id: away.id, name: stripGrade(away.name), orgId: away.organisation?.id } : null,
        homeScore,
        awayScore,
        byeTeam:        null,
        isWallarooHome: home ? isWallaroo(home.organisation?.id) : false,
        isWallarooAway: away ? isWallaroo(away.organisation?.id) : false,
      });
    }
  }

  return games;
}

/** Fetch ladder standings for a grade. */
export async function getGradeLadder(gradeId: string, siteName: string): Promise<PHQLadderRow[]> {
  const data = await gql<any>(GRADE_LADDER_QUERY, { gradeID: gradeId });
  const grade = data.discoverGrade;
  if (!grade) return [];

  const rows: PHQLadderRow[] = [];
  const pools: any[] = grade.ladder ?? [];

  // ladder is an array of pools; YPFL typically has one pool
  for (const pool of pools) {
    const standings: any[] = pool.standings ?? [];
    standings.forEach((s: any, i: number) => {
      rows.push({
        grade:        siteName,
        rank:         i + 1,
        teamId:       s.team.id,
        teamName:     stripGrade(s.team.name),
        orgId:        s.team.organisation?.id ?? '',
        orgName:      s.team.organisation?.name ?? '',
        played:       s.played,
        won:          s.won,
        lost:         s.lost,
        drawn:        s.drawn,
        byes:         s.byes,
        pointsFor:    s.pointsFor,
        pointsAgainst: s.pointsAgainst,
        percentage:   s.percentage,
      });
    });
  }

  return rows;
}

/** Fetch fixtures + ladders for ALL known YPFL 2026 grades. */
export async function getAllGradesData(): Promise<{
  fixtures: PHQGame[];
  ladders:  PHQLadderRow[];
}> {
  const fixturePromises = YPFL_GRADES.map(g => getGradeFixtures(g.id, g.siteName));
  const ladderPromises  = YPFL_GRADES.map(g => getGradeLadder(g.id, g.siteName));

  const [allFixtures, allLadders] = await Promise.all([
    Promise.all(fixturePromises),
    Promise.all(ladderPromises),
  ]);

  return {
    fixtures: allFixtures.flat(),
    ladders:  allLadders.flat(),
  };
}

/** Kept for backwards compatibility — normalises a grade name string to the site name. */
export function normaliseGrade(raw: string): string {
  const r = raw.toLowerCase();
  if (r.includes('a-grade') || r.includes('a grade') || r.includes('senior a')) return 'A-Grade';
  if (r.includes('reserves') || r.includes('b grade') || r.includes('b-grade') || r.includes('senior b')) return 'B Grade';
  if (r.includes('senior colts') || r.includes('u17') || r.includes('under 17') || r.includes('u18') || r.includes('under 18')) return 'Senior Colts';
  if (r.includes('junior colts') || r.includes('u14') || r.includes('under 14') || r.includes('u16') || r.includes('under 16')) return 'Junior Colts';
  if (r.includes('u11') || r.includes('under 11')) return 'U11';
  if (r.includes('u9')  || r.includes('under 9'))  return 'U9';
  return raw;
}
