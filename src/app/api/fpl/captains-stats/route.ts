import { NextRequest, NextResponse } from "next/server";

const FPL_BASE = "https://fantasy.premierleague.com/api";

/**
 * FPL does not publish captaincy percentages, so they are measured from a real
 * sample: the picks of the top managers in the overall league (ID 314). The
 * first 10 of that sample double as the "Top 10" tier. Everything else here
 * (chip plays, most captained, averages) comes straight from bootstrap-static
 * for the requested gameweek.
 */
const OVERALL_LEAGUE_ID = 314;
const SAMPLE_PAGES = [1, 2]; // 50 managers per standings page → top 100
const TOP_TIER = 10;
const PICKS_CONCURRENCY = 10;
const MIN_SAMPLE = 5;

async function fplFetch(url: string, revalidate = 60) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`FPL API error: ${res.status}`);
  return res.json();
}

interface CaptainTally {
  top10: number;
  top100: number;
  tc: number;
}

interface TopSample {
  size: number;
  top10Size: number;
  captains: Map<number, CaptainTally>;
  vice: Map<number, number>;
  chips: { wildcard: number; freehit: number; benchboost: number; triplecaptain: number };
}

// Captain picks are locked at the deadline, so a sample stays valid for a long
// time; only the membership of the top 100 drifts while a gameweek is live.
const sampleCache = new Map<number, { at: number; ttl: number; value: TopSample | null }>();

async function sampleTopManagers(gameweek: number, finished: boolean): Promise<TopSample | null> {
  const cached = sampleCache.get(gameweek);
  if (cached && Date.now() - cached.at < cached.ttl) return cached.value;

  const pages = await Promise.all(
    SAMPLE_PAGES.map((page) =>
      fplFetch(
        `${FPL_BASE}/leagues-classic/${OVERALL_LEAGUE_ID}/standings/?page_standings=${page}`,
        600
      ).catch(() => null)
    )
  );
  const entries: number[] = pages
    .flatMap((page: any) => page?.standings?.results ?? [])
    .sort((a: any, b: any) => (a.rank || 0) - (b.rank || 0))
    .map((row: any) => row.entry)
    .filter((entry: unknown): entry is number => typeof entry === "number");

  const picksRevalidate = finished ? 6 * 3600 : 1800;
  const picks: Array<{ index: number; data: any } | null> = [];
  for (let i = 0; i < entries.length; i += PICKS_CONCURRENCY) {
    const chunk = entries.slice(i, i + PICKS_CONCURRENCY);
    const chunkPicks = await Promise.all(
      chunk.map(async (entry, j) => {
        try {
          const data = await fplFetch(
            `${FPL_BASE}/entry/${entry}/event/${gameweek}/picks/`,
            picksRevalidate
          );
          return { index: i + j, data };
        } catch {
          return null;
        }
      })
    );
    picks.push(...chunkPicks);
  }

  const sample: TopSample = {
    size: 0,
    top10Size: 0,
    captains: new Map(),
    vice: new Map(),
    chips: { wildcard: 0, freehit: 0, benchboost: 0, triplecaptain: 0 },
  };

  for (const result of picks) {
    if (!result || !Array.isArray(result.data?.picks)) continue;
    const inTop10 = result.index < TOP_TIER;
    sample.size += 1;
    if (inTop10) sample.top10Size += 1;

    const chip = result.data.active_chip as string | null;
    if (chip === "wildcard") sample.chips.wildcard += 1;
    if (chip === "freehit") sample.chips.freehit += 1;
    if (chip === "bboost") sample.chips.benchboost += 1;
    if (chip === "3xc") sample.chips.triplecaptain += 1;

    const captain = result.data.picks.find((p: any) => p.is_captain);
    if (captain) {
      const tally = sample.captains.get(captain.element) || { top10: 0, top100: 0, tc: 0 };
      tally.top100 += 1;
      if (inTop10) tally.top10 += 1;
      if (chip === "3xc") tally.tc += 1;
      sample.captains.set(captain.element, tally);
    }
    const vice = result.data.picks.find((p: any) => p.is_vice_captain);
    if (vice) sample.vice.set(vice.element, (sample.vice.get(vice.element) || 0) + 1);
  }

  const value = sample.size >= MIN_SAMPLE ? sample : null;
  // A missing sample usually means the deadline has not passed yet — retry soon.
  sampleCache.set(gameweek, {
    at: Date.now(),
    ttl: value ? picksRevalidate * 1000 : 5 * 60 * 1000,
    value,
  });
  return value;
}

const pct = (count: number, total: number) =>
  total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameweek = parseInt(searchParams.get("gameweek") || "1", 10);

    const [bootstrap, liveData] = await Promise.all([
      fplFetch(`${FPL_BASE}/bootstrap-static/`),
      fplFetch(`${FPL_BASE}/event/${gameweek}/live/`).catch(() => ({ elements: [] })),
    ]);

    const event = bootstrap.events.find((e: any) => e.id === gameweek);
    const playerMap = new Map<number, any>(bootstrap.elements.map((el: any) => [el.id, el]));
    const pointsMap = new Map<number, number>(
      (liveData.elements || []).map((el: any) => [el.id, el.stats?.total_points || 0])
    );

    const playerRef = (id: number | null | undefined) => {
      if (!id) return null;
      const el = playerMap.get(id);
      if (!el) return null;
      return {
        player_id: el.id,
        web_name: el.web_name,
        team: el.team,
        team_code: el.team_code,
        element_type: el.element_type,
        points: pointsMap.get(el.id) || 0,
      };
    };

    const sample = await sampleTopManagers(gameweek, Boolean(event?.finished));

    const topCaptains = sample
      ? Array.from(sample.captains.entries())
          .map(([id, tally]) => {
            const ref = playerRef(id);
            if (!ref) return null;
            const el = playerMap.get(id);
            return {
              ...ref,
              ownership_pct: parseFloat(el?.selected_by_percent || "0"),
              captain_count: tally.top100,
              captain_pct: pct(tally.top100, sample.size),
              captain_pct_top10: pct(tally.top10, sample.top10Size),
              tc_count: tally.tc,
              vice_pct: pct(sample.vice.get(id) || 0, sample.size),
              effective_points: ref.points * 2,
            };
          })
          .filter((c): c is NonNullable<typeof c> => c !== null)
          .sort((a, b) => b.captain_count - a.captain_count || b.points - a.points)
      : [];

    const chipPlays = (name: string) =>
      event?.chip_plays?.find((c: any) => c.chip_name === name)?.num_played || 0;

    // Chip usage for the requested gameweek (all managers)
    const chipUsage = {
      wildcard: chipPlays("wildcard"),
      freehit: chipPlays("freehit"),
      benchboost: chipPlays("bboost"),
      triplecaptain: chipPlays("3xc"),
    };

    // Only real tiers: both come from the same top-manager sample
    const tierList = (key: "captain_pct_top10" | "captain_pct") =>
      [...topCaptains]
        .filter((c) => c[key] > 0)
        .sort((a, b) => b[key] - a[key])
        .slice(0, 5)
        .map((c) => ({ web_name: c.web_name, ownership_pct: c[key], points: c.points }));
    const captainsByTier = sample
      ? [
          { tier: `Top ${TOP_TIER}`, captains: tierList("captain_pct_top10") },
          { tier: `Top ${sample.size}`, captains: tierList("captain_pct") },
        ]
      : [];

    const teams = bootstrap.teams.map((t: any) => ({
      id: t.id,
      name: t.name,
      short_name: t.short_name,
      code: t.code,
    }));

    return NextResponse.json({
      success: true,
      data: {
        gameweek,
        topCaptains,
        chipUsage,
        captainsByTier,
        sample: sample
          ? {
              size: sample.size,
              top10_size: sample.top10Size,
              chips: sample.chips,
            }
          : null,
        overall: {
          ranked_count: event?.ranked_count || 0,
          average_entry_score: event?.average_entry_score || 0,
          highest_score: event?.highest_score ?? null,
          most_captained: playerRef(event?.most_captained),
          most_vice_captained: playerRef(event?.most_vice_captained),
          top_element: playerRef(event?.top_element),
        },
        teams,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Captains stats API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
