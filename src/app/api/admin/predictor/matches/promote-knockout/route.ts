import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin, jsonError } from "@/lib/predictor";
import type { Match } from "@/types/predictor";

// =============================================================
// POST /api/admin/predictor/matches/promote-knockout
// Body: { tournament_id, dry_run?: boolean }
//
// Auto-popunjava placeholdere ("1A", "2B", "Najbolji 3. ABCDF",
// "Pob. R32-1", "Por. SF-1", itd.) u SCHEDULED knockout utakmicama
// na osnovu rezultata prethodnih rundi i grupne tabele.
//
// Vraća listu uspješno popunjenih utakmica i nerazriješenih placeholdera
// (sa razlogom — npr. grupna faza još nije završena, semi-final je remi,
// nepoznat oblik placeholdera, itd.). Ne dira utakmice koje već imaju
// stvarne timove (one čije ime ne matchira poznatim placeholder uzorcima).
// =============================================================

type ResolvedTeam = { name: string; code: string | null };

type Standing = {
  team: string;
  code: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
};

type Resolution =
  | { ok: true; team: ResolvedTeam }
  | { ok: false; reason: string };

const PLACEHOLDER_GROUP_POS = /^([123])([A-L])$/; // "1A", "2B", "3C"
const PLACEHOLDER_BEST_3RD = /^Najbolji\s+3\.\s+([A-L]+)$/i;
const PLACEHOLDER_WINNER = /^Pob\.?\s+(R32|R16|QF|SF)-(\d+)$/i;
const PLACEHOLDER_LOSER = /^Por\.?\s+(R32|R16|QF|SF)-(\d+)$/i;

function isResolvedTeam(name: string): boolean {
  // Stvaran tim — ako matchira bilo koji od placeholder uzoraka, nije razriješen.
  return (
    !PLACEHOLDER_GROUP_POS.test(name) &&
    !PLACEHOLDER_BEST_3RD.test(name) &&
    !PLACEHOLDER_WINNER.test(name) &&
    !PLACEHOLDER_LOSER.test(name)
  );
}

function flagFromCode(code: string | null): string | null {
  return code ? `https://flagcdn.com/w80/${code.toLowerCase()}.png` : null;
}

// ---------------- group standings ----------------

function buildStandings(matches: Match[]): Standing[] {
  // Akumuliraj po imenu tima — koristi nominalni naziv kao ključ.
  const table = new Map<string, Standing>();
  const ensure = (team: string, code: string | null): Standing => {
    const existing = table.get(team);
    if (existing) return existing;
    const fresh: Standing = {
      team,
      code,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0,
    };
    table.set(team, fresh);
    return fresh;
  };

  for (const m of matches) {
    if (m.status !== "finished") continue;
    if (m.home_score == null || m.away_score == null) continue;
    const h = ensure(m.home_team, m.home_team_code ?? null);
    const a = ensure(m.away_team, m.away_team_code ?? null);
    h.played += 1;
    a.played += 1;
    h.gf += m.home_score;
    h.ga += m.away_score;
    a.gf += m.away_score;
    a.ga += m.home_score;
    h.gd = h.gf - h.ga;
    a.gd = a.gf - a.ga;
    if (m.home_score > m.away_score) {
      h.wins += 1;
      a.losses += 1;
      h.pts += 3;
    } else if (m.home_score < m.away_score) {
      a.wins += 1;
      h.losses += 1;
      a.pts += 3;
    } else {
      h.draws += 1;
      a.draws += 1;
      h.pts += 1;
      a.pts += 1;
    }
  }

  return Array.from(table.values()).sort(compareStandings(matches));
}

function compareStandings(allMatches: Match[]) {
  return (a: Standing, b: Standing) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    // head-to-head poeni samo između izjednačenih
    const h2h = h2hPoints(a, b, allMatches);
    if (h2h.b !== h2h.a) return h2h.b - h2h.a;
    return a.team.localeCompare(b.team);
  };
}

function h2hPoints(
  a: Standing,
  b: Standing,
  allMatches: Match[],
): { a: number; b: number } {
  let pa = 0;
  let pb = 0;
  for (const m of allMatches) {
    if (m.status !== "finished") continue;
    if (m.home_score == null || m.away_score == null) continue;
    const involvesBoth =
      (m.home_team === a.team && m.away_team === b.team) ||
      (m.home_team === b.team && m.away_team === a.team);
    if (!involvesBoth) continue;
    const aIsHome = m.home_team === a.team;
    const aScore = aIsHome ? m.home_score : m.away_score;
    const bScore = aIsHome ? m.away_score : m.home_score;
    if (aScore > bScore) pa += 3;
    else if (bScore > aScore) pb += 3;
    else {
      pa += 1;
      pb += 1;
    }
  }
  return { a: pa, b: pb };
}

// Po grupi vrati uređeni niz Standing[]; prazno ako još nije završena.
function groupStandings(
  allMatches: Match[],
  groupLetter: string,
): Standing[] | null {
  const stage = `group_${groupLetter.toLowerCase()}`;
  const groupMatches = allMatches.filter((m) => m.stage === stage);
  if (groupMatches.length === 0) return null;
  const finished = groupMatches.filter((m) => m.status === "finished");
  // grupa mora biti potpuno odigrana
  if (finished.length !== groupMatches.length) return null;
  return buildStandings(groupMatches);
}

// ---------------- knockout winners ----------------

function knockoutOutcome(
  allMatches: Match[],
  roundPrefix: "R32" | "R16" | "QF" | "SF",
  num: number,
): { winner: ResolvedTeam | null; loser: ResolvedTeam | null; reason: string | null } {
  const label = `${roundPrefix}-${num}`;
  const match = allMatches.find((m) => m.match_label === label);
  if (!match) return { winner: null, loser: null, reason: `nedostaje ${label}` };
  if (match.status !== "finished") {
    return { winner: null, loser: null, reason: `${label} nije završen` };
  }
  if (match.home_score == null || match.away_score == null) {
    return { winner: null, loser: null, reason: `${label} nema rezultat` };
  }
  if (match.home_score === match.away_score) {
    // sistem ne čuva rezultat penala; admin mora ručno popraviti
    return {
      winner: null,
      loser: null,
      reason: `${label} je remi (rezultat penala se ne čuva)`,
    };
  }
  const homeTeam: ResolvedTeam = {
    name: match.home_team,
    code: match.home_team_code ?? null,
  };
  const awayTeam: ResolvedTeam = {
    name: match.away_team,
    code: match.away_team_code ?? null,
  };
  if (match.home_score > match.away_score) {
    return { winner: homeTeam, loser: awayTeam, reason: null };
  }
  return { winner: awayTeam, loser: homeTeam, reason: null };
}

// ---------------- best-3rd placement ----------------

function bestThirdPlaceRanked(allMatches: Match[]): Array<Standing & { group: string }> {
  const all: Array<Standing & { group: string }> = [];
  for (let i = 0; i < 12; i++) {
    const letter = String.fromCharCode("A".charCodeAt(0) + i);
    const st = groupStandings(allMatches, letter);
    if (!st || st.length < 3) continue;
    all.push({ ...st[2], group: letter });
  }
  // FIFA tiebreakers za 3rd place: pts → GD → GF
  return all.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team.localeCompare(b.team);
  });
}

// ---------------- placeholder resolver ----------------

function resolvePlaceholder(
  placeholder: string,
  ctx: {
    allMatches: Match[];
    standingsCache: Map<string, Standing[]>;
    bestThirds: Array<Standing & { group: string }>;
    bestThirdAssigned: Set<string>;
  },
): Resolution {
  const trimmed = placeholder.trim();

  // 1) "1A" / "2B" / "3C" — grupna pozicija
  const posMatch = PLACEHOLDER_GROUP_POS.exec(trimmed);
  if (posMatch) {
    const position = Number(posMatch[1]);
    const groupLetter = posMatch[2].toUpperCase();
    const key = groupLetter;
    let st = ctx.standingsCache.get(key);
    if (!st) {
      st = groupStandings(ctx.allMatches, groupLetter) ?? undefined;
      if (st) ctx.standingsCache.set(key, st);
    }
    if (!st) return { ok: false, reason: `Grupa ${groupLetter} nije završena` };
    if (st.length < position) {
      return { ok: false, reason: `Grupa ${groupLetter} nema ${position}. mjesto` };
    }
    const target = st[position - 1];
    return { ok: true, team: { name: target.team, code: target.code } };
  }

  // 2) "Najbolji 3. ABCDF" — top-8 third place pool
  const bestMatch = PLACEHOLDER_BEST_3RD.exec(trimmed);
  if (bestMatch) {
    const candidates = bestMatch[1].toUpperCase().split("");
    // uzmi top 8, pa pronađi najboljeg dostupnog čija je grupa u kandidatima
    const topEight = ctx.bestThirds.slice(0, 8);
    if (ctx.bestThirds.length < candidates.length) {
      return {
        ok: false,
        reason: `Nema dovoljno završenih grupa (potrebno ${candidates.length}, imam ${ctx.bestThirds.length})`,
      };
    }
    for (const t of topEight) {
      if (!candidates.includes(t.group)) continue;
      if (ctx.bestThirdAssigned.has(t.group)) continue;
      ctx.bestThirdAssigned.add(t.group);
      return { ok: true, team: { name: t.team, code: t.code } };
    }
    return {
      ok: false,
      reason: `Nijedna 3. ekipa iz grupa ${candidates.join("/")} nije u top 8`,
    };
  }

  // 3) "Pob. R32-1" — pobjednik
  const winMatch = PLACEHOLDER_WINNER.exec(trimmed);
  if (winMatch) {
    const round = winMatch[1].toUpperCase() as "R32" | "R16" | "QF" | "SF";
    const num = Number(winMatch[2]);
    const out = knockoutOutcome(ctx.allMatches, round, num);
    if (!out.winner) return { ok: false, reason: out.reason ?? "nema pobjednika" };
    return { ok: true, team: out.winner };
  }

  // 4) "Por. SF-1" — poraženi (samo za utakmicu za 3. mjesto)
  const loseMatch = PLACEHOLDER_LOSER.exec(trimmed);
  if (loseMatch) {
    const round = loseMatch[1].toUpperCase() as "R32" | "R16" | "QF" | "SF";
    const num = Number(loseMatch[2]);
    const out = knockoutOutcome(ctx.allMatches, round, num);
    if (!out.loser) return { ok: false, reason: out.reason ?? "nema poraženog" };
    return { ok: true, team: out.loser };
  }

  return { ok: false, reason: `Nepoznat oblik placeholdera: "${placeholder}"` };
}

// ---------------- handler ----------------

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  if (!body?.tournament_id) return jsonError("tournament_id je obavezan");
  const dryRun = !!body.dry_run;

  const { data: matches, error } = await supabaseServer
    .from("predictor_matches")
    .select("*")
    .eq("tournament_id", body.tournament_id)
    .order("kickoff_at", { ascending: true });

  if (error) return jsonError(error.message, 500);
  const all = (matches ?? []) as Match[];

  // Knockout utakmice (sve faze osim group_X)
  const isKnockoutStage = (s: string) => !s.startsWith("group");
  // Ne diraj zavšene/odgođene/otkazane utakmice.
  const knockoutPending = all.filter(
    (m) => isKnockoutStage(m.stage) && m.status === "scheduled",
  );

  const standingsCache = new Map<string, Standing[]>();
  const bestThirds = bestThirdPlaceRanked(all);

  // VAŽNO: rezolucija ide redom — early rounds prvo da se "Pob. R32-X"
  // u kasnijim rundama mogao razrijšiti tek nakon što je R32 odigran.
  const ROUND_ORDER: Record<string, number> = {
    round_of_32: 1,
    round_of_16: 2,
    quarter_final: 3,
    semi_final: 4,
    third_place: 5,
    final: 5,
  };
  knockoutPending.sort(
    (a, b) =>
      (ROUND_ORDER[a.stage] ?? 99) - (ROUND_ORDER[b.stage] ?? 99) ||
      (a.match_label ?? "").localeCompare(b.match_label ?? ""),
  );

  const updated: Array<{
    match_id: string;
    match_label: string | null;
    home: string;
    away: string;
  }> = [];
  const unresolved: Array<{
    match_id: string;
    match_label: string | null;
    home_placeholder: string;
    away_placeholder: string;
    reasons: string[];
  }> = [];
  const skipped: Array<{ match_id: string; match_label: string | null; reason: string }> = [];

  const bestThirdAssigned = new Set<string>();
  const ctx = { allMatches: all, standingsCache, bestThirds, bestThirdAssigned };

  for (const match of knockoutPending) {
    const homeIsResolved = isResolvedTeam(match.home_team);
    const awayIsResolved = isResolvedTeam(match.away_team);

    if (homeIsResolved && awayIsResolved) {
      skipped.push({
        match_id: match.id,
        match_label: match.match_label,
        reason: "već popunjeno",
      });
      continue;
    }

    const reasons: string[] = [];
    let newHome: ResolvedTeam | null = homeIsResolved
      ? { name: match.home_team, code: match.home_team_code ?? null }
      : null;
    let newAway: ResolvedTeam | null = awayIsResolved
      ? { name: match.away_team, code: match.away_team_code ?? null }
      : null;

    if (!newHome) {
      const r = resolvePlaceholder(match.home_team, ctx);
      if (r.ok) newHome = r.team;
      else reasons.push(`home: ${r.reason}`);
    }
    if (!newAway) {
      const r = resolvePlaceholder(match.away_team, ctx);
      if (r.ok) newAway = r.team;
      else reasons.push(`away: ${r.reason}`);
    }

    if (!newHome || !newAway) {
      unresolved.push({
        match_id: match.id,
        match_label: match.match_label,
        home_placeholder: match.home_team,
        away_placeholder: match.away_team,
        reasons,
      });
      continue;
    }

    if (!dryRun) {
      const { error: upErr } = await supabaseServer
        .from("predictor_matches")
        .update({
          home_team: newHome.name,
          home_team_code: newHome.code,
          home_logo_url: flagFromCode(newHome.code),
          away_team: newAway.name,
          away_team_code: newAway.code,
          away_logo_url: flagFromCode(newAway.code),
        })
        .eq("id", match.id);
      if (upErr) {
        unresolved.push({
          match_id: match.id,
          match_label: match.match_label,
          home_placeholder: match.home_team,
          away_placeholder: match.away_team,
          reasons: [`db: ${upErr.message}`],
        });
        continue;
      }
    }

    // Reflektuj rezoluciju u in-memory listi tako da kasnije
    // "Pob. R16-X" matchovi vide nove timove (ne utiče direktno jer
    // mi gledamo home_score; ali korisno za buduća proširenja).
    match.home_team = newHome.name;
    match.home_team_code = newHome.code;
    match.away_team = newAway.name;
    match.away_team_code = newAway.code;

    updated.push({
      match_id: match.id,
      match_label: match.match_label,
      home: newHome.name,
      away: newAway.name,
    });
  }

  return NextResponse.json({
    ok: true,
    dry_run: dryRun,
    updated_count: updated.length,
    updated,
    unresolved,
    skipped,
  });
}
