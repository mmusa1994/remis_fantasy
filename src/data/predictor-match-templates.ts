// =============================================================
// Predefinisani rasporedi utakmica koje admin može uvesti jednim
// klikom. Korisno za otvaranje turnira, knockout faze, itd.
//
// Svaki template = niz utakmica koje se umetnu u tournament_id
// preko bulk insert API-ja.
// =============================================================

export interface MatchTemplateItem {
  stage: string;
  stage_label?: string;
  match_label?: string;
  home_team: string;
  away_team: string;
  home_team_code?: string;
  away_team_code?: string;
  kickoff_at?: string; // ISO 8601
  venue?: string;
  matchday?: number;
}

export interface MatchSetTemplate {
  id: string;
  name: string;
  description: string;
  count: number; // za prikaz, popunjava se runtime-om
  tag?: "world-cup-2026" | "champions-league" | "euro" | "generic";
  matches: MatchTemplateItem[];
}

const flag = (cc: string) => `https://flagcdn.com/w80/${cc}.png`;

// -------------------------------------------------------------
// SP 2026. KOMPLETAN RASPORED (104 utakmice, real podaci sa FIFA)
// Grupna faza sa stvarnim parovima; nokaut sa placeholder ekipama
// -------------------------------------------------------------
import {
  WC_2026_GROUP_STAGE,
  WC_2026_KNOCKOUT as WC_2026_KNOCKOUT_MATCHES,
  WC_2026_FULL_SCHEDULE,
} from "./predictor-wc-2026-fixtures";

const WC_2026_FULL: MatchSetTemplate = {
  id: "wc-2026-full",
  name: "SP 2026. KOMPLETAN raspored",
  description:
    "Svih 104 utakmice (72 grupne + 32 nokaut). Datumi, vremena (UTC), stadioni i parovi prema zvaničnom FIFA rasporedu nakon ždrijeba.",
  tag: "world-cup-2026",
  count: WC_2026_FULL_SCHEDULE.length,
  matches: WC_2026_FULL_SCHEDULE,
};

const WC_2026_GROUPS_ONLY: MatchSetTemplate = {
  id: "wc-2026-groups",
  name: "SP 2026. Samo grupna faza",
  description:
    "72 utakmice grupne faze sa stvarnim parovima (Meksiko vs Južna Afrika, SAD vs Paragvaj, Brazil vs Maroko, itd.). Datumi i stadioni po zvaničnom rasporedu.",
  tag: "world-cup-2026",
  count: WC_2026_GROUP_STAGE.length,
  matches: WC_2026_GROUP_STAGE,
};

const WC_2026_KNOCKOUT_ONLY: MatchSetTemplate = {
  id: "wc-2026-knockout",
  name: "SP 2026. Samo nokaut faza",
  description:
    "32 utakmice nokaut faze: 16 R32 + 8 R16 + 4 ČF + 2 PF + 3. mjesto + FINALE. Ekipe su placeholderi (1A, 2B, Pob. R32-1…) jer zavise od grupa.",
  tag: "world-cup-2026",
  count: WC_2026_KNOCKOUT_MATCHES.length,
  matches: WC_2026_KNOCKOUT_MATCHES,
};

const WC_2026_OPENERS: MatchSetTemplate = {
  id: "wc-2026-openers",
  name: "SP 2026. Prvih 5 dana (Matchday 1)",
  description:
    "Sve utakmice prvog kola grupne faze. 24 utakmice od 11.06 do 17.06. Idealno da brzo postaviš početak turnira.",
  tag: "world-cup-2026",
  count: 24,
  matches: WC_2026_GROUP_STAGE.slice(0, 24),
};

// -------------------------------------------------------------
// Liga prvaka. Polufinalni dan (template za sve evropske turnire)
// -------------------------------------------------------------
const CL_SEMIFINALS: MatchSetTemplate = {
  id: "cl-semifinals",
  name: "Liga prvaka. Polufinale (2 utakmice)",
  description:
    "Dva polufinala. uredi ekipe i datume nakon ždrijeba. Standardni 5/3/2 sistem bodovanja.",
  tag: "champions-league",
  count: 2,
  matches: [
    {
      stage: "semi_final",
      stage_label: "Polufinale",
      match_label: "SF-1",
      home_team: "Polufinalist 1",
      away_team: "Polufinalist 2",
      kickoff_at: "2026-04-28T19:00:00.000Z",
    },
    {
      stage: "semi_final",
      stage_label: "Polufinale",
      match_label: "SF-2",
      home_team: "Polufinalist 3",
      away_team: "Polufinalist 4",
      kickoff_at: "2026-04-29T19:00:00.000Z",
    },
  ],
};

// -------------------------------------------------------------
// 12 grupa po 4 ekipe. skeleton (72 utakmice)
// -------------------------------------------------------------
const TWELVE_GROUPS_SKELETON: MatchSetTemplate = (() => {
  const groups = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
  const matches: MatchTemplateItem[] = [];
  let dayOffset = 0;
  for (const g of groups) {
    // 4 ekipe → 6 utakmica po grupi (T1vT2, T1vT3, T1vT4, T2vT3, T2vT4, T3vT4)
    const pairings: [number, number][] = [
      [1, 2],
      [3, 4],
      [1, 3],
      [2, 4],
      [1, 4],
      [2, 3],
    ];
    for (const [h, a] of pairings) {
      matches.push({
        stage: `group_${g}`,
        stage_label: `Grupa ${g.toUpperCase()}`,
        home_team: `Grupa ${g.toUpperCase()}. Tim ${h}`,
        away_team: `Grupa ${g.toUpperCase()}. Tim ${a}`,
        kickoff_at: new Date(
          Date.parse("2026-06-11T17:00:00.000Z") +
            dayOffset * 24 * 3600 * 1000,
        ).toISOString(),
      });
      dayOffset += 0.25; // razmakni utakmice
    }
  }
  return {
    id: "twelve-groups-skeleton",
    name: "12 grupa × 4 ekipe. skeleton (72 utakmice)",
    description:
      "Generička struktura SP 2026 grupne faze. 72 utakmice. Promijeni nazive ekipa kad bude poznat ždrijeb.",
    tag: "world-cup-2026",
    count: 72,
    matches,
  };
})();

export const MATCH_TEMPLATES: MatchSetTemplate[] = [
  WC_2026_FULL,
  WC_2026_GROUPS_ONLY,
  WC_2026_KNOCKOUT_ONLY,
  WC_2026_OPENERS,
  TWELVE_GROUPS_SKELETON,
  CL_SEMIFINALS,
];

export function getMatchTemplate(id: string): MatchSetTemplate | undefined {
  return MATCH_TEMPLATES.find((t) => t.id === id);
}

// Helper za primjenu. dodaje zastave na osnovu kodova
export function expandMatchTemplate(
  template: MatchSetTemplate,
): Array<Record<string, unknown>> {
  return template.matches.map((m, idx) => ({
    stage: m.stage,
    stage_label: m.stage_label ?? null,
    match_label: (m as any).match_label ?? null,
    home_team: m.home_team,
    away_team: m.away_team,
    home_team_code: m.home_team_code ?? null,
    away_team_code: m.away_team_code ?? null,
    home_logo_url: m.home_team_code ? flag(m.home_team_code) : null,
    away_logo_url: m.away_team_code ? flag(m.away_team_code) : null,
    kickoff_at: m.kickoff_at ?? null,
    venue: m.venue ?? null,
    sort_order: idx,
    matchday: m.matchday ?? null,
  }));
}
