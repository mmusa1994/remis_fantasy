import { NextRequest, NextResponse } from "next/server";
import { mockMatchResults, mockStats } from "@/data/mock-match-results";
import { FPLBonusService } from "@/services/fpl/bonus.service";

/**
 * Gameweek match results built from each fixture's own `stats` block, so
 * scorers, assists, own goals, cards and bonus belong to the right match
 * (the old version attributed a player's whole-GW stats to every fixture of
 * his team, which double-counted in double gameweeks).
 *
 * Per-fixture FPL points come from the live `explain` breakdown.
 */

const FPL_BASE = "https://fantasy.premierleague.com/api";

// Cache for bootstrap data to reduce API calls
let bootstrapCache: any = null;
let bootstrapCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Feature flag for using mock data (useful for development/testing)
const USE_MOCK_DATA =
  process.env.NODE_ENV === "development" && process.env.FPL_USE_MOCK === "true";

const bonusService = FPLBonusService.getInstance();

async function fplJson(path: string, revalidate: number) {
  const response = await fetch(`${FPL_BASE}${path}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate },
  });
  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

type StatEntry = { value: number; element: number };

const statEntries = (fixture: any, identifier: string, side: "h" | "a"): StatEntry[] => {
  const stat = Array.isArray(fixture?.stats)
    ? fixture.stats.find((s: any) => s?.identifier === identifier)
    : null;
  const list = stat && Array.isArray(stat[side]) ? stat[side] : [];
  return list.filter((e: any) => typeof e?.element === "number" && e.value > 0);
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const gameweek = parseInt(url.searchParams.get("gameweek") || "1");
  const statsOnly = url.searchParams.get("stats") === "true";

  try {
    if (isNaN(gameweek) || gameweek < 1 || gameweek > 38) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid gameweek. Must be between 1 and 38.",
        },
        { status: 400 }
      );
    }

    // Check if we should use mock data
    if (USE_MOCK_DATA) {
      if (statsOnly) {
        return NextResponse.json({
          success: true,
          data: mockStats,
          gameweek,
          timestamp: new Date().toISOString(),
          mock: true,
        });
      }

      return NextResponse.json({
        success: true,
        data: mockMatchResults,
        gameweek,
        count: mockMatchResults.length,
        timestamp: new Date().toISOString(),
        data_sources: {
          fixtures_api: "MOCK_DATA",
          live_api: "MOCK_DATA",
          bootstrap_api: "MOCK_DATA",
        },
        mock: true,
      });
    }

    // Get bootstrap data (teams, players) - use cache
    let bootstrapData = null;
    const now = Date.now();
    if (bootstrapCache && now - bootstrapCacheTime < CACHE_TTL) {
      bootstrapData = bootstrapCache;
    } else {
      bootstrapData = await fplJson("/bootstrap-static/", 300);
      bootstrapCache = bootstrapData;
      bootstrapCacheTime = now;
    }

    // Only this gameweek's fixtures, and the live data behind them. A short
    // revalidate keeps polling cheap without going stale during matches.
    const [gameweekFixtures, liveData] = await Promise.all([
      fplJson(`/fixtures/?event=${gameweek}`, 30),
      fplJson(`/event/${gameweek}/live/`, 30),
    ]);

    const teamsMap = new Map<number, any>();
    const playersMap = new Map<number, any>();
    bootstrapData.teams.forEach((team: any) => teamsMap.set(team.id, team));
    bootstrapData.elements.forEach((player: any) => playersMap.set(player.id, player));

    const liveElements: any[] = liveData.elements || [];

    // Per-fixture FPL points and defensive contributions from `explain`.
    const fixturePoints = new Map<string, number>();
    const fixtureDefcon = new Map<number, Array<{ element: number; value: number; points: number }>>();
    const fixtureElements = new Map<number, Set<number>>();
    for (const element of liveElements) {
      for (const explain of element.explain || []) {
        const fixtureId = explain.fixture;
        const stats: any[] = explain.stats || [];
        const points = stats.reduce((sum, s) => sum + (s.points || 0), 0);
        fixturePoints.set(`${fixtureId}:${element.id}`, points);

        const minutes = stats.find((s) => s.identifier === "minutes")?.value || 0;
        if (minutes > 0) {
          if (!fixtureElements.has(fixtureId)) fixtureElements.set(fixtureId, new Set());
          fixtureElements.get(fixtureId)!.add(element.id);
        }

        const defcon = stats.find((s) => s.identifier === "defensive_contribution");
        if (defcon && defcon.points > 0) {
          if (!fixtureDefcon.has(fixtureId)) fixtureDefcon.set(fixtureId, []);
          fixtureDefcon.get(fixtureId)!.push({
            element: element.id,
            value: defcon.value,
            points: defcon.points,
          });
        }
      }
    }

    const toPlayer = (elementId: number, fixtureId?: number) => {
      const player = playersMap.get(elementId);
      const ownership = parseFloat(player?.selected_by_percent || "0");
      return {
        id: elementId,
        web_name: player?.web_name || "Unknown",
        team_id: player?.team || 0,
        team_code: player?.team_code,
        element_type: player?.element_type,
        // Kept under its old name for compatibility — this is overall ownership.
        ownership_top10k: ownership,
        ownership_overall: ownership,
        points:
          fixtureId !== undefined
            ? fixturePoints.get(`${fixtureId}:${elementId}`) ?? 0
            : 0,
      };
    };

    // GW-level summary (also served on its own with ?stats=true)
    const topPerformer = [...liveElements]
      .filter((e: any) => (e.stats?.total_points || 0) > 0)
      .sort((a: any, b: any) => b.stats.total_points - a.stats.total_points)[0];

    const fixturesList: any[] = Array.isArray(gameweekFixtures) ? gameweekFixtures : [];
    const isOver = (f: any) => !!(f.finished || f.finished_provisional);

    const summary = {
      totalGoals: liveElements.reduce(
        (sum: number, e: any) => sum + (e.stats?.goals_scored || 0),
        0
      ),
      totalAssists: liveElements.reduce(
        (sum: number, e: any) => sum + (e.stats?.assists || 0),
        0
      ),
      highestScorer: topPerformer
        ? {
            ...toPlayer(topPerformer.id),
            points: topPerformer.stats.total_points,
          }
        : null,
      mostOwned: null,
      biggestDifferential: null,
      matchesTotal: fixturesList.length,
      matchesFinished: fixturesList.filter(isOver).length,
      matchesLive: fixturesList.filter((f) => f.started && !isOver(f)).length,
      matchesUpcoming: fixturesList.filter((f) => !f.started).length,
      gameweek,
      timestamp: new Date().toISOString(),
    };

    if (statsOnly) {
      return NextResponse.json({
        success: true,
        data: summary,
        gameweek,
        timestamp: new Date().toISOString(),
      });
    }

    const matchResults = fixturesList
      .slice()
      .sort((a, b) => {
        const ta = a.kickoff_time ? Date.parse(a.kickoff_time) : Infinity;
        const tb = b.kickoff_time ? Date.parse(b.kickoff_time) : Infinity;
        return ta - tb || a.id - b.id;
      })
      .map((fixture: any) => {
        const fid = fixture.id;
        const homeTeam = teamsMap.get(fixture.team_h);
        const awayTeam = teamsMap.get(fixture.team_a);

        const goalsFor = (side: "h" | "a") => {
          const goals = statEntries(fixture, "goals_scored", side).flatMap((g) =>
            Array.from({ length: g.value }, () => ({
              player: toPlayer(g.element, fid),
              minute: 0, // FPL does not expose goal minutes
              own_goal: false,
              penalty: false,
            }))
          );
          // An own goal by the other side counts for this team.
          const ownGoals = statEntries(fixture, "own_goals", side === "h" ? "a" : "h").flatMap(
            (g) =>
              Array.from({ length: g.value }, () => ({
                player: toPlayer(g.element, fid),
                minute: 0,
                own_goal: true,
                penalty: false,
              }))
          );
          return [...goals, ...ownGoals];
        };

        const assistsFor = (side: "h" | "a") =>
          statEntries(fixture, "assists", side).flatMap((a) =>
            Array.from({ length: a.value }, () => ({
              player: toPlayer(a.element, fid),
              minute: 0,
              goal_player_id: 0,
            }))
          );

        const players = (identifier: string) =>
          (["h", "a"] as const).flatMap((side) =>
            statEntries(fixture, identifier, side).map((e) => ({
              player: toPlayer(e.element, fid),
              side: side === "h" ? "home" : "away",
              value: e.value,
            }))
          );

        // Bonus: official once FPL marks the fixture finished, otherwise
        // predicted from live BPS with the official tie-break rules.
        const bpsAll = [...statEntries(fixture, "bps", "h"), ...statEntries(fixture, "bps", "a")].sort(
          (a, b) => b.value - a.value
        );
        const bpsById = new Map(bpsAll.map((e) => [e.element, e.value]));
        let predictions = fixture.started ? bonusService.predictBonusForFixture(fixture) : [];
        if (fixture.finished && predictions.length === 0) {
          predictions = bonusService.predictBonusForFixture({ ...fixture, finished: false });
        }
        const bonusById = new Map(predictions.map((p) => [p.element, p.predicted_bonus]));
        const bonus = predictions
          .filter((p) => p.predicted_bonus > 0)
          .map((p) => ({
            player: toPlayer(p.element, fid),
            bps: bpsById.get(p.element) ?? p.bps,
            bonus: p.predicted_bonus,
          }))
          .sort((a, b) => b.bonus - a.bonus || b.bps - a.bps);

        const bpsTop = bpsAll.slice(0, 6).map((e) => ({
          player: toPlayer(e.element, fid),
          bps: e.value,
          bonus: bonusById.get(e.element) || 0,
        }));

        // Top FPL scorers of this match, per side.
        const played = Array.from(fixtureElements.get(fid) || []);
        const performers = (teamId: number) =>
          played
            .filter((id) => playersMap.get(id)?.team === teamId)
            .map((id) => toPlayer(id, fid))
            .filter((p) => p.points > 0)
            .sort((a, b) => b.points - a.points)
            .slice(0, 5);

        const ownership = (teamId: number) => {
          const team = played.filter((id) => playersMap.get(id)?.team === teamId);
          if (team.length === 0) return 0;
          const total = team.reduce(
            (sum, id) => sum + parseFloat(playersMap.get(id)?.selected_by_percent || "0"),
            0
          );
          return Math.round((total / team.length) * 10) / 10;
        };

        let status = "SCHEDULED";
        let minutes = 0;
        if (isOver(fixture)) {
          status = "FT";
          minutes = fixture.minutes || 90;
        } else if (fixture.started) {
          status = "LIVE";
          minutes = fixture.minutes || 0;
        }

        return {
          fixture_id: fid,
          gameweek: fixture.event,
          home_team: {
            id: fixture.team_h,
            code: homeTeam?.code,
            name: homeTeam?.name || "Unknown",
            short_name: homeTeam?.short_name || "UNK",
          },
          away_team: {
            id: fixture.team_a,
            code: awayTeam?.code,
            name: awayTeam?.name || "Unknown",
            short_name: awayTeam?.short_name || "UNK",
          },
          home_score: fixture.team_h_score ?? 0,
          away_score: fixture.team_a_score ?? 0,
          status,
          kickoff_time: fixture.kickoff_time,
          minutes,
          bonus_status: !fixture.started ? "none" : fixture.finished ? "official" : "provisional",
          home_goals: goalsFor("h"),
          away_goals: goalsFor("a"),
          home_assists: assistsFor("h"),
          away_assists: assistsFor("a"),
          top_performers: {
            home: performers(fixture.team_h),
            away: performers(fixture.team_a),
          },
          bonus,
          bps_top: bpsTop,
          yellow_cards: players("yellow_cards"),
          red_cards: players("red_cards"),
          penalties_saved: players("penalties_saved"),
          penalties_missed: players("penalties_missed"),
          saves: players("saves").sort((a, b) => b.value - a.value),
          defensive_contributions: (fixtureDefcon.get(fid) || [])
            .map((d) => ({
              player: toPlayer(d.element, fid),
              side: playersMap.get(d.element)?.team === fixture.team_h ? "home" : "away",
              value: d.value,
              points: d.points,
            }))
            .sort((a, b) => b.value - a.value),
          home_ownership: ownership(fixture.team_h),
          away_ownership: ownership(fixture.team_a),
        };
      });

    return NextResponse.json({
      success: true,
      data: matchResults,
      summary,
      gameweek,
      count: matchResults.length,
      timestamp: new Date().toISOString(),
      data_sources: {
        fixtures_api: `${FPL_BASE}/fixtures/?event=${gameweek}`,
        live_api: `${FPL_BASE}/event/${gameweek}/live/`,
        bootstrap_api: `${FPL_BASE}/bootstrap-static/`,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching match results:", error);

    // In case of API failure, provide fallback mock data in development
    if (process.env.NODE_ENV === "development") {
      if (statsOnly) {
        return NextResponse.json({
          success: true,
          data: mockStats,
          gameweek,
          timestamp: new Date().toISOString(),
          fallback: true,
          error:
            error instanceof Error
              ? error.message
              : "API temporarily unavailable",
        });
      }

      return NextResponse.json({
        success: true,
        data: mockMatchResults,
        gameweek,
        count: mockMatchResults.length,
        timestamp: new Date().toISOString(),
        data_sources: {
          fixtures_api: "FALLBACK_MOCK_DATA",
          live_api: "FALLBACK_MOCK_DATA",
          bootstrap_api: "FALLBACK_MOCK_DATA",
        },
        fallback: true,
        error:
          error instanceof Error
            ? error.message
            : "API temporarily unavailable",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch match results",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
