// =============================================================
// FIFA Svjetsko prvenstvo 2026 — KOMPLETAN raspored
// Izvor: zvanični FIFA raspored objavljen u februaru 2024.
// Ždrijeb obavljen decembra 2025. Vremena su UTC (ET → UTC = +4h u junu).
// =============================================================

import type { MatchTemplateItem } from "./predictor-match-templates";

const STAGE_LABEL_LOCAL: Record<string, string> = {
  group_a: "Grupa A",
  group_b: "Grupa B",
  group_c: "Grupa C",
  group_d: "Grupa D",
  group_e: "Grupa E",
  group_f: "Grupa F",
  group_g: "Grupa G",
  group_h: "Grupa H",
  group_i: "Grupa I",
  group_j: "Grupa J",
  group_k: "Grupa K",
  group_l: "Grupa L",
  round_of_32: "Šesnaestina finala",
  round_of_16: "Osmina finala",
  quarter_final: "Četvrtfinale",
  semi_final: "Polufinale",
  third_place: "Za 3. mjesto",
  final: "FINALE",
};

type R = [
  stage: string,
  isoUtc: string,
  home: string,
  hcc: string,
  away: string,
  acc: string,
  venue: string,
  matchLabel?: string,
];

const m = (r: R): MatchTemplateItem => ({
  stage: r[0],
  stage_label: STAGE_LABEL_LOCAL[r[0]] ?? r[0],
  match_label: r[7],
  home_team: r[2],
  home_team_code: r[3],
  away_team: r[4],
  away_team_code: r[5],
  kickoff_at: r[1],
  venue: r[6],
});

// =============================================================
// GRUPNA FAZA — 72 utakmice (3 kola po grupi × 12 grupa × 2)
// =============================================================
export const WC_2026_GROUP_STAGE: MatchTemplateItem[] = [
  // === Matchday 1 ===
  // Jun 11 — Thursday
  m(["group_a", "2026-06-11T19:00:00.000Z", "Meksiko", "mx", "Južna Afrika", "za", "Estadio Azteca, Mexico City"]),
  m(["group_a", "2026-06-12T02:00:00.000Z", "Južna Koreja", "kr", "Češka", "cz", "Estadio Akron, Guadalajara"]),
  // Jun 12 — Friday
  m(["group_b", "2026-06-12T19:00:00.000Z", "Kanada", "ca", "Bosna i Hercegovina", "ba", "BMO Field, Toronto"]),
  m(["group_d", "2026-06-13T01:00:00.000Z", "SAD", "us", "Paragvaj", "py", "SoFi Stadium, Inglewood"]),
  // Jun 13 — Saturday
  m(["group_b", "2026-06-13T19:00:00.000Z", "Katar", "qa", "Švicarska", "ch", "Levi's Stadium, Santa Clara"]),
  m(["group_c", "2026-06-13T22:00:00.000Z", "Brazil", "br", "Maroko", "ma", "MetLife Stadium, East Rutherford"]),
  m(["group_c", "2026-06-14T01:00:00.000Z", "Haiti", "ht", "Škotska", "gb-sct", "Gillette Stadium, Foxborough"]),
  // Jun 14 — Sunday
  m(["group_d", "2026-06-14T04:00:00.000Z", "Australija", "au", "Turska", "tr", "BC Place, Vancouver"]),
  m(["group_e", "2026-06-14T17:00:00.000Z", "Njemačka", "de", "Kurasao", "cw", "NRG Stadium, Houston"]),
  m(["group_f", "2026-06-14T20:00:00.000Z", "Holandija", "nl", "Japan", "jp", "AT&T Stadium, Arlington"]),
  m(["group_e", "2026-06-14T23:00:00.000Z", "Obala Slonovače", "ci", "Ekvador", "ec", "Lincoln Financial Field, Philadelphia"]),
  m(["group_f", "2026-06-15T02:00:00.000Z", "Švedska", "se", "Tunis", "tn", "Estadio BBVA, Monterrey"]),
  // Jun 15 — Monday
  m(["group_h", "2026-06-15T16:00:00.000Z", "Španija", "es", "Zelenortska", "cv", "Mercedes-Benz Stadium, Atlanta"]),
  m(["group_g", "2026-06-15T19:00:00.000Z", "Belgija", "be", "Egipat", "eg", "Lumen Field, Seattle"]),
  m(["group_h", "2026-06-15T22:00:00.000Z", "Saudijska Arabija", "sa", "Urugvaj", "uy", "Hard Rock Stadium, Miami Gardens"]),
  m(["group_g", "2026-06-16T01:00:00.000Z", "Iran", "ir", "Novi Zeland", "nz", "SoFi Stadium, Inglewood"]),
  // Jun 16 — Tuesday
  m(["group_i", "2026-06-16T19:00:00.000Z", "Francuska", "fr", "Senegal", "sn", "MetLife Stadium, East Rutherford"]),
  m(["group_i", "2026-06-16T22:00:00.000Z", "Irak", "iq", "Norveška", "no", "Gillette Stadium, Foxborough"]),
  m(["group_j", "2026-06-17T01:00:00.000Z", "Argentina", "ar", "Alžir", "dz", "Arrowhead Stadium, Kansas City"]),
  // Jun 17 — Wednesday
  m(["group_j", "2026-06-17T04:00:00.000Z", "Austrija", "at", "Jordan", "jo", "Levi's Stadium, Santa Clara"]),
  m(["group_k", "2026-06-17T17:00:00.000Z", "Portugal", "pt", "DR Kongo", "cd", "NRG Stadium, Houston"]),
  m(["group_l", "2026-06-17T20:00:00.000Z", "Engleska", "gb-eng", "Hrvatska", "hr", "AT&T Stadium, Arlington"]),
  m(["group_l", "2026-06-17T23:00:00.000Z", "Gana", "gh", "Panama", "pa", "BMO Field, Toronto"]),
  m(["group_k", "2026-06-18T02:00:00.000Z", "Uzbekistan", "uz", "Kolumbija", "co", "Estadio Azteca, Mexico City"]),

  // === Matchday 2 ===
  // Jun 18 — Thursday
  m(["group_a", "2026-06-18T16:00:00.000Z", "Češka", "cz", "Južna Afrika", "za", "Mercedes-Benz Stadium, Atlanta"]),
  m(["group_b", "2026-06-18T19:00:00.000Z", "Švicarska", "ch", "Bosna i Hercegovina", "ba", "SoFi Stadium, Inglewood"]),
  m(["group_b", "2026-06-18T22:00:00.000Z", "Kanada", "ca", "Katar", "qa", "BC Place, Vancouver"]),
  m(["group_a", "2026-06-19T01:00:00.000Z", "Meksiko", "mx", "Južna Koreja", "kr", "Estadio Akron, Guadalajara"]),
  // Jun 19 — Friday
  m(["group_d", "2026-06-19T19:00:00.000Z", "SAD", "us", "Australija", "au", "Lumen Field, Seattle"]),
  m(["group_c", "2026-06-19T22:00:00.000Z", "Škotska", "gb-sct", "Maroko", "ma", "Gillette Stadium, Foxborough"]),
  m(["group_c", "2026-06-20T00:30:00.000Z", "Brazil", "br", "Haiti", "ht", "Lincoln Financial Field, Philadelphia"]),
  // Jun 20 — Saturday
  m(["group_d", "2026-06-20T04:00:00.000Z", "Turska", "tr", "Paragvaj", "py", "Levi's Stadium, Santa Clara"]),
  m(["group_f", "2026-06-20T17:00:00.000Z", "Holandija", "nl", "Švedska", "se", "NRG Stadium, Houston"]),
  m(["group_e", "2026-06-20T20:00:00.000Z", "Njemačka", "de", "Obala Slonovače", "ci", "BMO Field, Toronto"]),
  m(["group_e", "2026-06-21T00:00:00.000Z", "Ekvador", "ec", "Kurasao", "cw", "Arrowhead Stadium, Kansas City"]),
  // Jun 21 — Sunday
  m(["group_f", "2026-06-21T04:00:00.000Z", "Tunis", "tn", "Japan", "jp", "Estadio BBVA, Monterrey"]),
  m(["group_h", "2026-06-21T16:00:00.000Z", "Španija", "es", "Saudijska Arabija", "sa", "Mercedes-Benz Stadium, Atlanta"]),
  m(["group_g", "2026-06-21T19:00:00.000Z", "Belgija", "be", "Iran", "ir", "SoFi Stadium, Inglewood"]),
  m(["group_h", "2026-06-21T22:00:00.000Z", "Urugvaj", "uy", "Zelenortska", "cv", "Hard Rock Stadium, Miami Gardens"]),
  m(["group_g", "2026-06-22T01:00:00.000Z", "Novi Zeland", "nz", "Egipat", "eg", "BC Place, Vancouver"]),
  // Jun 22 — Monday
  m(["group_j", "2026-06-22T17:00:00.000Z", "Argentina", "ar", "Austrija", "at", "AT&T Stadium, Arlington"]),
  m(["group_i", "2026-06-22T21:00:00.000Z", "Francuska", "fr", "Irak", "iq", "Lincoln Financial Field, Philadelphia"]),
  m(["group_i", "2026-06-23T00:00:00.000Z", "Norveška", "no", "Senegal", "sn", "MetLife Stadium, East Rutherford"]),
  m(["group_j", "2026-06-23T03:00:00.000Z", "Jordan", "jo", "Alžir", "dz", "Levi's Stadium, Santa Clara"]),
  // Jun 23 — Tuesday
  m(["group_k", "2026-06-23T17:00:00.000Z", "Portugal", "pt", "Uzbekistan", "uz", "NRG Stadium, Houston"]),
  m(["group_l", "2026-06-23T20:00:00.000Z", "Engleska", "gb-eng", "Gana", "gh", "Gillette Stadium, Foxborough"]),
  m(["group_l", "2026-06-23T23:00:00.000Z", "Panama", "pa", "Hrvatska", "hr", "BMO Field, Toronto"]),
  m(["group_k", "2026-06-24T02:00:00.000Z", "Kolumbija", "co", "DR Kongo", "cd", "Estadio Akron, Guadalajara"]),

  // === Matchday 3 (parovi simultano) ===
  // Jun 24 — Wednesday
  m(["group_b", "2026-06-24T19:00:00.000Z", "Švicarska", "ch", "Kanada", "ca", "BC Place, Vancouver"]),
  m(["group_b", "2026-06-24T19:00:00.000Z", "Bosna i Hercegovina", "ba", "Katar", "qa", "Lumen Field, Seattle"]),
  m(["group_c", "2026-06-24T22:00:00.000Z", "Škotska", "gb-sct", "Brazil", "br", "Hard Rock Stadium, Miami Gardens"]),
  m(["group_c", "2026-06-24T22:00:00.000Z", "Maroko", "ma", "Haiti", "ht", "Mercedes-Benz Stadium, Atlanta"]),
  m(["group_a", "2026-06-25T01:00:00.000Z", "Češka", "cz", "Meksiko", "mx", "Estadio Azteca, Mexico City"]),
  m(["group_a", "2026-06-25T01:00:00.000Z", "Južna Afrika", "za", "Južna Koreja", "kr", "Estadio BBVA, Monterrey"]),
  // Jun 25 — Thursday
  m(["group_e", "2026-06-25T20:00:00.000Z", "Kurasao", "cw", "Obala Slonovače", "ci", "Lincoln Financial Field, Philadelphia"]),
  m(["group_e", "2026-06-25T20:00:00.000Z", "Ekvador", "ec", "Njemačka", "de", "MetLife Stadium, East Rutherford"]),
  m(["group_f", "2026-06-25T23:00:00.000Z", "Japan", "jp", "Švedska", "se", "AT&T Stadium, Arlington"]),
  m(["group_f", "2026-06-25T23:00:00.000Z", "Tunis", "tn", "Holandija", "nl", "Arrowhead Stadium, Kansas City"]),
  m(["group_d", "2026-06-26T02:00:00.000Z", "Turska", "tr", "SAD", "us", "SoFi Stadium, Inglewood"]),
  m(["group_d", "2026-06-26T02:00:00.000Z", "Paragvaj", "py", "Australija", "au", "Levi's Stadium, Santa Clara"]),
  // Jun 26 — Friday
  m(["group_i", "2026-06-26T19:00:00.000Z", "Norveška", "no", "Francuska", "fr", "Gillette Stadium, Foxborough"]),
  m(["group_i", "2026-06-26T19:00:00.000Z", "Senegal", "sn", "Irak", "iq", "BMO Field, Toronto"]),
  m(["group_h", "2026-06-27T00:00:00.000Z", "Zelenortska", "cv", "Saudijska Arabija", "sa", "NRG Stadium, Houston"]),
  m(["group_h", "2026-06-27T00:00:00.000Z", "Urugvaj", "uy", "Španija", "es", "Estadio Akron, Guadalajara"]),
  m(["group_g", "2026-06-27T03:00:00.000Z", "Egipat", "eg", "Iran", "ir", "Lumen Field, Seattle"]),
  m(["group_g", "2026-06-27T03:00:00.000Z", "Novi Zeland", "nz", "Belgija", "be", "BC Place, Vancouver"]),
  // Jun 27 — Saturday
  m(["group_l", "2026-06-27T21:00:00.000Z", "Panama", "pa", "Engleska", "gb-eng", "MetLife Stadium, East Rutherford"]),
  m(["group_l", "2026-06-27T21:00:00.000Z", "Hrvatska", "hr", "Gana", "gh", "Lincoln Financial Field, Philadelphia"]),
  m(["group_k", "2026-06-27T23:30:00.000Z", "Kolumbija", "co", "Portugal", "pt", "Hard Rock Stadium, Miami Gardens"]),
  m(["group_k", "2026-06-27T23:30:00.000Z", "DR Kongo", "cd", "Uzbekistan", "uz", "Mercedes-Benz Stadium, Atlanta"]),
  m(["group_j", "2026-06-28T02:00:00.000Z", "Alžir", "dz", "Austrija", "at", "Arrowhead Stadium, Kansas City"]),
  m(["group_j", "2026-06-28T02:00:00.000Z", "Jordan", "jo", "Argentina", "ar", "AT&T Stadium, Arlington"]),
];

// =============================================================
// NOKAUT FAZA — Šesnaestina (R32) + Osmina (R16) + ČF + PF + Finale
// Ekipe su placeholderi (1A, 2B, 3C/E/F/H/I…) jer zavise od rezultata grupa
// =============================================================
export const WC_2026_KNOCKOUT: MatchTemplateItem[] = [
  // R32 — Šesnaestina finala (16 utakmica, 28. jun – 3. jul)
  m(["round_of_32", "2026-06-28T19:00:00.000Z", "2A", "", "2B", "", "SoFi Stadium, Inglewood", "R32-1"]),
  m(["round_of_32", "2026-06-29T17:00:00.000Z", "1C", "", "2F", "", "NRG Stadium, Houston", "R32-2"]),
  m(["round_of_32", "2026-06-29T20:30:00.000Z", "1E", "", "Najbolji 3. ABCDF", "", "Gillette Stadium, Foxborough", "R32-3"]),
  m(["round_of_32", "2026-06-30T01:00:00.000Z", "1F", "", "2C", "", "Estadio BBVA, Monterrey", "R32-4"]),
  m(["round_of_32", "2026-06-30T17:00:00.000Z", "2E", "", "2I", "", "AT&T Stadium, Arlington", "R32-5"]),
  m(["round_of_32", "2026-06-30T21:00:00.000Z", "1I", "", "Najbolji 3. CDFGH", "", "MetLife Stadium, East Rutherford", "R32-6"]),
  m(["round_of_32", "2026-07-01T01:00:00.000Z", "1A", "", "Najbolji 3. CEFHI", "", "Estadio Azteca, Mexico City", "R32-7"]),
  m(["round_of_32", "2026-07-01T16:00:00.000Z", "1L", "", "Najbolji 3. EHIJK", "", "Mercedes-Benz Stadium, Atlanta", "R32-8"]),
  m(["round_of_32", "2026-07-01T20:00:00.000Z", "1G", "", "Najbolji 3. AEHIJ", "", "Lumen Field, Seattle", "R32-9"]),
  m(["round_of_32", "2026-07-02T00:00:00.000Z", "1D", "", "Najbolji 3. BEFIJ", "", "Levi's Stadium, Santa Clara", "R32-10"]),
  m(["round_of_32", "2026-07-02T19:00:00.000Z", "1H", "", "2J", "", "SoFi Stadium, Inglewood", "R32-11"]),
  m(["round_of_32", "2026-07-02T23:00:00.000Z", "2K", "", "2L", "", "BMO Field, Toronto", "R32-12"]),
  m(["round_of_32", "2026-07-03T03:00:00.000Z", "1B", "", "Najbolji 3. EFGIJ", "", "BC Place, Vancouver", "R32-13"]),
  m(["round_of_32", "2026-07-03T18:00:00.000Z", "2D", "", "2G", "", "AT&T Stadium, Arlington", "R32-14"]),
  m(["round_of_32", "2026-07-03T22:00:00.000Z", "1J", "", "2H", "", "Hard Rock Stadium, Miami Gardens", "R32-15"]),
  m(["round_of_32", "2026-07-04T01:30:00.000Z", "1K", "", "Najbolji 3. DEIJL", "", "Arrowhead Stadium, Kansas City", "R32-16"]),

  // R16 — Osmina finala (8 utakmica)
  m(["round_of_16", "2026-07-04T17:00:00.000Z", "Pob. R32-2", "", "Pob. R32-3", "", "NRG Stadium, Houston", "R16-1"]),
  m(["round_of_16", "2026-07-04T21:00:00.000Z", "Pob. R32-1", "", "Pob. R32-4", "", "Lincoln Financial Field, Philadelphia", "R16-2"]),
  m(["round_of_16", "2026-07-05T20:00:00.000Z", "Pob. R32-6", "", "Pob. R32-7", "", "MetLife Stadium, East Rutherford", "R16-3"]),
  m(["round_of_16", "2026-07-06T00:00:00.000Z", "Pob. R32-5", "", "Pob. R32-8", "", "Estadio Azteca, Mexico City", "R16-4"]),
  m(["round_of_16", "2026-07-06T19:00:00.000Z", "Pob. R32-10", "", "Pob. R32-11", "", "AT&T Stadium, Arlington", "R16-5"]),
  m(["round_of_16", "2026-07-07T00:00:00.000Z", "Pob. R32-9", "", "Pob. R32-12", "", "Lumen Field, Seattle", "R16-6"]),
  m(["round_of_16", "2026-07-07T16:00:00.000Z", "Pob. R32-14", "", "Pob. R32-15", "", "Mercedes-Benz Stadium, Atlanta", "R16-7"]),
  m(["round_of_16", "2026-07-07T20:00:00.000Z", "Pob. R32-13", "", "Pob. R32-16", "", "BC Place, Vancouver", "R16-8"]),

  // Četvrtfinale (4 utakmice)
  m(["quarter_final", "2026-07-09T20:00:00.000Z", "Pob. R16-1", "", "Pob. R16-2", "", "Gillette Stadium, Foxborough", "QF-1"]),
  m(["quarter_final", "2026-07-10T19:00:00.000Z", "Pob. R16-3", "", "Pob. R16-4", "", "SoFi Stadium, Inglewood", "QF-2"]),
  m(["quarter_final", "2026-07-11T21:00:00.000Z", "Pob. R16-5", "", "Pob. R16-6", "", "Hard Rock Stadium, Miami Gardens", "QF-3"]),
  m(["quarter_final", "2026-07-12T01:00:00.000Z", "Pob. R16-7", "", "Pob. R16-8", "", "Arrowhead Stadium, Kansas City", "QF-4"]),

  // Polufinale (2)
  m(["semi_final", "2026-07-14T19:00:00.000Z", "Pob. QF-1", "", "Pob. QF-2", "", "AT&T Stadium, Arlington", "SF-1"]),
  m(["semi_final", "2026-07-15T19:00:00.000Z", "Pob. QF-3", "", "Pob. QF-4", "", "Mercedes-Benz Stadium, Atlanta", "SF-2"]),

  // Za 3. mjesto
  m(["third_place", "2026-07-18T21:00:00.000Z", "Por. SF-1", "", "Por. SF-2", "", "Hard Rock Stadium, Miami Gardens", "3rd-Place"]),

  // Finale — 19. jul 2026, MetLife Stadium
  m(["final", "2026-07-19T19:00:00.000Z", "Pob. SF-1", "", "Pob. SF-2", "", "MetLife Stadium, East Rutherford", "Final"]),
];

// =============================================================
// Assign matchday to every fixture for per-round locking
// Group: MD1 (0-23), MD2 (24-47), MD3 (48-71)
// Knockout: R32=4, R16=5, QF=6, SF=7, 3rd=8, Final=9
// =============================================================
const KNOCKOUT_MATCHDAY: Record<string, number> = {
  round_of_32: 4,
  round_of_16: 5,
  quarter_final: 6,
  semi_final: 7,
  third_place: 8,
  final: 9,
};

function assignMatchdays(
  group: MatchTemplateItem[],
  knockout: MatchTemplateItem[],
): MatchTemplateItem[] {
  const g = group.map((m, i) => ({
    ...m,
    matchday: i < 24 ? 1 : i < 48 ? 2 : 3,
  }));
  const k = knockout.map((m) => ({
    ...m,
    matchday: KNOCKOUT_MATCHDAY[m.stage] ?? 10,
  }));
  return [...g, ...k];
}

export const WC_2026_FULL_SCHEDULE: MatchTemplateItem[] = assignMatchdays(
  WC_2026_GROUP_STAGE,
  WC_2026_KNOCKOUT,
);
