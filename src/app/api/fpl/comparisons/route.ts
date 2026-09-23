import { NextRequest, NextResponse } from "next/server";

/**
 * "How do I compare?" data for the FPL Live Compare tab.
 *
 * Everything here is read from FPL, not guessed:
 * - rank cut-offs: the total points of the manager sitting at rank N in the
 *   overall league (page ceil(N / 50) of league 314);
 * - Top 10K / Top 100K gameweek averages: a sample of managers spread evenly
 *   across that rank band (their official GW points), labelled as a sample;
 * - per-position points and the "template": the same sample's picks scored
 *   with the live data.
 *
 * The previous version multiplied the overall average by made-up factors and
 * mixed gameweek scores with season totals in the rank table.
 */

const FPL_BASE = "https://fantasy.premierleague.com/api";
const OVERALL_LEAGUE_ID = 314;
const PAGE_SIZE = 50;

const RANK_TARGETS = [
  { key: "1", rank: 1 },
  { key: "100", rank: 100 },
  { key: "1k", rank: 1_000 },
  { key: "10k", rank: 10_000 },
  { key: "100k", rank: 100_000 },
  { key: "500k", rank: 500_000 },
  { key: "1m", rank: 1_000_000 },
] as const;

const SAMPLE_BANDS = {
  top10k: 10_000,
  top100k: 100_000,
} as const;
const SAMPLE_PAGES = 6;
const SAMPLE_ROWS_PER_PAGE = [0, 12, 24, 36, 48];

const POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;
type Position = (typeof POSITIONS)[number];
const POSITION_BY_TYPE: Record<number, Position> = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };

async function fplFetch(path: string, revalidate: number) {
  const res = await fetch(`${FPL_BASE}${path}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`FPL API error ${res.status} for ${path}`);
  return res.json();
}

const standingsPage = (page: number) =>
  fplFetch(
    `/leagues-classic/${OVERALL_LEAGUE_ID}/standings/?page_standings=${page}`,
    600
  ).catch(() => null);

/** Pages spread evenly over a rank band: 10K → 1, 41, 81, 120, 160, 200. */
const bandPages = (maxRank: number) => {
  const lastPage = Math.ceil(maxRank / PAGE_SIZE);
  return Array.from({ length: SAMPLE_PAGES }, (_, i) =>
    Math.max(1, Math.round(1 + (i * (lastPage - 1)) / (SAMPLE_PAGES - 1)))
  );
};

/** Multipliers after automatic substitutions (vice inherits the armband). */
function effectiveMultipliers(picksData: any): Map<number, number> {
  const picks: any[] = picksData?.picks || [];
  const multipliers = new Map<number, number>(picks.map((p) => [p.element, p.multiplier]));
  const subbedOut = new Set<number>();
  let captainMultiplier = 0;

  for (const sub of picksData?.automatic_subs || []) {
    const outMultiplier = multipliers.get(sub.element_out) ?? 0;
    if (outMultiplier > 1) captainMultiplier = outMultiplier;
    multipliers.set(sub.element_out, 0);
    multipliers.set(sub.element_in, Math.max(1, multipliers.get(sub.element_in) ?? 0));
    subbedOut.add(sub.element_out);
  }

  if (captainMultiplier > 1) {
    const vice = picks.find((p) => p.is_vice_captain);
    if (vice && !subbedOut.has(vice.element)) {
      multipliers.set(vice.element, captainMultiplier);
    }
  }
  return multipliers;
}

function pointsByPosition(
  picksData: any,
  livePoints: Map<number, number>,
  elementTypes: Map<number, number>
): Record<Position, number> {
  const totals: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  const multipliers = effectiveMultipliers(picksData);
  for (const pick of picksData?.picks || []) {
    const multiplier = multipliers.get(pick.element) ?? 0;
    if (multiplier <= 0) continue;
    const type = pick.element_type ?? elementTypes.get(pick.element);
    const position = POSITION_BY_TYPE[type];
    if (!position) continue;
    totals[position] += (livePoints.get(pick.element) || 0) * multiplier;
  }
  return totals;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get("managerId");
    const gameweek = parseInt(searchParams.get("gameweek") || "1");

    if (!managerId) {
      return NextResponse.json(
        { success: false, error: "managerId is required" },
        { status: 400 }
      );
    }

    const [bootstrap, managerHistory, picksData, liveData] = await Promise.all([
      fplFetch(`/bootstrap-static/`, 300),
      fplFetch(`/entry/${managerId}/history/`, 60),
      fplFetch(`/entry/${managerId}/event/${gameweek}/picks/`, 60),
      fplFetch(`/event/${gameweek}/live/`, 60),
    ]);

    const events: any[] = bootstrap.events || [];
    const event = events.find((e) => e.id === gameweek);
    const currentEvent = events.find((e) => e.is_current);
    const totalPlayers: number = bootstrap.total_players || 0;

    const livePoints = new Map<number, number>(
      (liveData.elements || []).map((el: any) => [el.id, el.stats?.total_points || 0])
    );
    const elementTypes = new Map<number, number>(
      (bootstrap.elements || []).map((el: any) => [el.id, el.element_type])
    );
    const elementsById = new Map<number, any>(
      (bootstrap.elements || []).map((el: any) => [el.id, el])
    );

    /* -------------------------- You -------------------------- */
    const history: any[] = managerHistory.current || [];
    const gwHistory = history.find((h) => h.event === gameweek);
    const latest = history[history.length - 1];
    const yourGwPoints: number =
      picksData.entry_history?.points ?? gwHistory?.points ?? 0;
    const gwRank: number | null = picksData.entry_history?.rank ?? gwHistory?.rank ?? null;
    const currentTotal: number = latest?.total_points ?? 0;
    const currentOverallRank: number | null = latest?.overall_rank ?? null;
    const percentile = (rank: number | null) =>
      rank && totalPlayers ? round1((rank / totalPlayers) * 100) : null;

    const you = {
      gwPoints: yourGwPoints,
      transferCost: picksData.entry_history?.event_transfers_cost || 0,
      gwRank,
      gwPercentile: percentile(gwRank),
      totalPoints: currentTotal,
      overallRank: currentOverallRank,
      overallPercentile: percentile(currentOverallRank),
      totalPlayers,
    };

    /* ---------------------- Standings pages ---------------------- */
    const samplePages = {
      top10k: bandPages(SAMPLE_BANDS.top10k),
      top100k: bandPages(SAMPLE_BANDS.top100k),
    };
    const thresholdPages = RANK_TARGETS.map((r) => Math.ceil(r.rank / PAGE_SIZE));
    const allPages = Array.from(
      new Set([...thresholdPages, ...samplePages.top10k, ...samplePages.top100k])
    );
    const pages = new Map<number, any>();
    const fetched = await Promise.all(allPages.map((p) => standingsPage(p)));
    allPages.forEach((p, i) => pages.set(p, fetched[i]));

    const standingsUpdatedAt: string | null =
      fetched.find((page) => page?.last_updated_data)?.last_updated_data ?? null;

    const ranksNeeded = RANK_TARGETS.map((target) => {
      const page = pages.get(Math.ceil(target.rank / PAGE_SIZE));
      const results: any[] = page?.standings?.results || [];
      const entry = results[(target.rank - 1) % PAGE_SIZE] || results[results.length - 1];
      if (!entry) return null;
      return {
        key: target.key,
        targetRank: target.rank,
        rank: target.rank === 1 ? "1st" : `Top ${target.key.toUpperCase()}`,
        pointsNeeded: entry.total as number,
        yourPoints: currentTotal,
        gap: currentTotal - (entry.total as number),
      };
    }).filter(Boolean);

    /* --------------------- Sampled managers --------------------- */
    const sampleEntries = (band: keyof typeof SAMPLE_BANDS) => {
      const ids: number[] = [];
      for (const pageNo of samplePages[band]) {
        const results: any[] = pages.get(pageNo)?.standings?.results || [];
        for (const row of SAMPLE_ROWS_PER_PAGE) {
          if (results[row]?.entry) ids.push(results[row].entry);
        }
      }
      return ids;
    };
    const top10kIds = sampleEntries("top10k");
    const top100kIds = sampleEntries("top100k");
    const sampleIds = Array.from(new Set([...top10kIds, ...top100kIds]));

    // Picks never change after the deadline, so these cache well.
    const picksById = new Map<number, any>();
    const CHUNK = 15;
    for (let i = 0; i < sampleIds.length; i += CHUNK) {
      const chunk = sampleIds.slice(i, i + CHUNK);
      const responses = await Promise.all(
        chunk.map((id) =>
          fplFetch(`/entry/${id}/event/${gameweek}/picks/`, 300).catch(() => null)
        )
      );
      chunk.forEach((id, idx) => {
        if (responses[idx]?.picks?.length) picksById.set(id, responses[idx]);
      });
    }

    const bandStats = (ids: number[]) => {
      const teams = ids.map((id) => picksById.get(id)).filter(Boolean);
      if (teams.length === 0) return null;
      const avgPoints =
        teams.reduce((sum, p) => sum + (p.entry_history?.points || 0), 0) / teams.length;
      const byPosition: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
      for (const team of teams) {
        const totals = pointsByPosition(team, livePoints, elementTypes);
        for (const pos of POSITIONS) byPosition[pos] += totals[pos];
      }
      for (const pos of POSITIONS) byPosition[pos] = round1(byPosition[pos] / teams.length);
      return { avgPoints: Math.round(avgPoints), sampleSize: teams.length, byPosition, teams };
    };

    const top10k = bandStats(top10kIds);
    const top100k = bandStats(top100kIds);

    const benchmark = (avg: number | null | undefined, sampleSize?: number) =>
      typeof avg === "number"
        ? {
            avgPoints: avg,
            yourPoints: yourGwPoints,
            diff: yourGwPoints - avg,
            ...(sampleSize ? { sampleSize } : {}),
          }
        : null;

    const vsBenchmarks = {
      overall: benchmark(event?.average_entry_score ?? 0),
      top100k: top100k ? benchmark(top100k.avgPoints, top100k.sampleSize) : null,
      top10k: top10k ? benchmark(top10k.avgPoints, top10k.sampleSize) : null,
      highest: benchmark(event?.highest_score ?? null),
    };

    /* ---------------------- Positions & template ---------------------- */
    const yourByPosition = pointsByPosition(picksData, livePoints, elementTypes);
    const byPosition = Object.fromEntries(
      POSITIONS.map((pos) => [
        pos,
        { yours: yourByPosition[pos], top10k: top10k ? top10k.byPosition[pos] : null },
      ])
    );

    const yourSquad = new Set<number>((picksData.picks || []).map((p: any) => p.element));
    let templatePct: number | null = null;
    let template: any[] = [];
    if (top10k) {
      const ownership = new Map<number, number>();
      let overlapSum = 0;
      for (const team of top10k.teams) {
        let overlap = 0;
        for (const pick of team.picks) {
          ownership.set(pick.element, (ownership.get(pick.element) || 0) + 1);
          if (yourSquad.has(pick.element)) overlap += 1;
        }
        overlapSum += overlap / Math.max(team.picks.length, 1);
      }
      templatePct = Math.round((overlapSum / top10k.teams.length) * 100);

      template = Array.from(ownership.entries())
        .map(([id, owners]) => ({ id, ownership: (owners / top10k.teams.length) * 100 }))
        .filter((row) => row.ownership >= 30)
        .sort((a, b) => b.ownership - a.ownership)
        .slice(0, 12)
        .map((row) => {
          const el = elementsById.get(row.id);
          return {
            id: row.id,
            web_name: el?.web_name || "Unknown",
            team: el?.team,
            team_code: el?.team_code,
            element_type: el?.element_type,
            ownership: Math.round(row.ownership),
            points: livePoints.get(row.id) || 0,
            owned: yourSquad.has(row.id),
          };
        });
    }

    return NextResponse.json({
      success: true,
      data: {
        gameweek,
        isCurrentGameweek: currentEvent?.id === gameweek,
        you,
        vsBenchmarks,
        ranksNeeded,
        standingsUpdatedAt,
        teamRatings: {
          templatePct,
          sampleSize: top10k?.sampleSize ?? 0,
          byPosition,
        },
        template,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Comparisons API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
