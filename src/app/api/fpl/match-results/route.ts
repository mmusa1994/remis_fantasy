import { NextRequest, NextResponse } from "next/server";
import { mockMatchResults, mockStats } from "@/data/mock-match-results";

// Cache for bootstrap data to reduce API calls
let bootstrapCache: any = null;
let bootstrapCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Feature flag for using mock data (useful for development/testing)
const USE_MOCK_DATA =
  process.env.NODE_ENV === "development" && process.env.FPL_USE_MOCK === "true";

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
      const bootstrapResponse = await fetch(
        "https://fantasy.premierleague.com/api/bootstrap-static/"
      );

      if (!bootstrapResponse.ok) {
        throw new Error(
          `Bootstrap API failed: ${bootstrapResponse.status} ${bootstrapResponse.statusText}`
        );
      }

      bootstrapData = await bootstrapResponse.json();
      bootstrapCache = bootstrapData;
      bootstrapCacheTime = now;
    }

    // Fetch fixtures using the correct endpoint
    const fixturesResponse = await fetch(
      "https://fantasy.premierleague.com/api/fixtures/"
    );

    if (!fixturesResponse.ok) {
      throw new Error(
        `Fixtures API failed: ${fixturesResponse.status} ${fixturesResponse.statusText}`
      );
    }

    const allFixtures = await fixturesResponse.json();

    // Filter fixtures for the specified gameweek
    const gameweekFixtures = allFixtures.filter(
      (f: any) => f.event === gameweek
    );

    // Fetch live gameweek data
    const liveResponse = await fetch(
      `https://fantasy.premierleague.com/api/event/${gameweek}/live/`
    );

    if (!liveResponse.ok) {
      throw new Error(
        `Live API failed: ${liveResponse.status} ${liveResponse.statusText}`
      );
    }

    const liveData = await liveResponse.json();

    // Create team lookup maps
    const teamsMap = new Map();
    const playersMap = new Map();

    bootstrapData.teams.forEach((team: any) => {
      teamsMap.set(team.id, team);
    });

    bootstrapData.elements.forEach((player: any) => {
      playersMap.set(player.id, player);
    });

    // Return stats only if requested
    if (statsOnly) {
      // Calculate key stats from live data
      const liveElements = liveData.elements || [];
      const topPerformers = liveElements
        .filter((e: any) => e.stats.total_points > 0)
        .sort((a: any, b: any) => b.stats.total_points - a.stats.total_points)
        .slice(0, 10);

      const stats = {
        totalGoals: liveElements.reduce(
          (sum: number, e: any) => sum + (e.stats.goals_scored || 0),
          0
        ),
        totalAssists: liveElements.reduce(
          (sum: number, e: any) => sum + (e.stats.assists || 0),
          0
        ),
        highestScorer:
          topPerformers.length > 0
            ? {
                id: topPerformers[0].id,
                web_name:
                  playersMap.get(topPerformers[0].id)?.web_name || "Unknown",
                team_id: playersMap.get(topPerformers[0].id)?.team || 0,
                ownership_top10k:
                  playersMap.get(topPerformers[0].id)?.selected_by_percent || 0,
                points: topPerformers[0].stats.total_points,
              }
            : null,
        mostOwned: null, // Can be calculated if needed
        biggestDifferential: null, // Can be calculated if needed
        gameweek: gameweek,
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: stats,
        gameweek,
        timestamp: new Date().toISOString(),
      });
    }

    // Process match results

    const matchResults = gameweekFixtures.map((fixture: any) => {
      const homeTeam = teamsMap.get(fixture.team_h);
      const awayTeam = teamsMap.get(fixture.team_a);

      // Get live stats for players in this fixture
      const fixtureElements =
        liveData.elements?.filter((e: any) => {
          const player = playersMap.get(e.id);
          return (
            player &&
            (player.team === fixture.team_h || player.team === fixture.team_a)
          );
        }) || [];

      // Extract goals and assists from live data
      const homeGoals: any[] = [];
      const awayGoals: any[] = [];
      const homeAssists: any[] = [];
      const awayAssists: any[] = [];

      fixtureElements.forEach((element: any) => {
        const player = playersMap.get(element.id);
        if (!player) return;

        const isHomeTeam = player.team === fixture.team_h;

        // Add goals
        for (let i = 0; i < (element.stats.goals_scored || 0); i++) {
          const goalData = {
            player: {
              id: player.id,
              web_name: player.web_name,
              team_id: player.team,
              ownership_top10k: parseFloat(player.selected_by_percent || "0"),
              points: element.stats.total_points,
            },
            minute: 45, // Default minute (can't get exact from API)
            own_goal: false,
            penalty: false, // Could be determined from explain array if needed
          };

          if (isHomeTeam) {
            homeGoals.push(goalData);
          } else {
            awayGoals.push(goalData);
          }
        }

        // Add assists
        for (let i = 0; i < (element.stats.assists || 0); i++) {
          const assistData = {
            player: {
              id: player.id,
              web_name: player.web_name,
              team_id: player.team,
              ownership_top10k: parseFloat(player.selected_by_percent || "0"),
              points: element.stats.total_points,
            },
            minute: 45, // Default minute
            goal_player_id: 0, // Would need additional processing to link
          };

          if (isHomeTeam) {
            homeAssists.push(assistData);
          } else {
            awayAssists.push(assistData);
          }
        }
      });

      // Get top performers for each team (by points)
      const homePerformers = fixtureElements
        .filter((e: any) => {
          const player = playersMap.get(e.id);
          return (
            player && player.team === fixture.team_h && e.stats.total_points > 0
          );
        })
        .sort((a: any, b: any) => b.stats.total_points - a.stats.total_points)
        .slice(0, 5)
        .map((e: any) => {
          const player = playersMap.get(e.id);
          return {
            id: player.id,
            web_name: player.web_name,
            team_id: player.team,
            ownership_top10k: parseFloat(player.selected_by_percent || "0"),
            points: e.stats.total_points,
          };
        });

      const awayPerformers = fixtureElements
        .filter((e: any) => {
          const player = playersMap.get(e.id);
          return (
            player && player.team === fixture.team_a && e.stats.total_points > 0
          );
        })
        .sort((a: any, b: any) => b.stats.total_points - a.stats.total_points)
        .slice(0, 5)
        .map((e: any) => {
          const player = playersMap.get(e.id);
          return {
            id: player.id,
            web_name: player.web_name,
            team_id: player.team,
            ownership_top10k: parseFloat(player.selected_by_percent || "0"),
            points: e.stats.total_points,
          };
        });

      // Calculate team ownership percentages
      const homeOwnership =
        fixtureElements
          .filter((e: any) => {
            const player = playersMap.get(e.id);
            return player && player.team === fixture.team_h;
          })
          .reduce((sum: number, e: any) => {
            const player = playersMap.get(e.id);
            return sum + parseFloat(player?.selected_by_percent || "0");
          }, 0) /
        Math.max(
          fixtureElements.filter((e: any) => {
            const player = playersMap.get(e.id);
            return player && player.team === fixture.team_h;
          }).length,
          1
        );

      const awayOwnership =
        fixtureElements
          .filter((e: any) => {
            const player = playersMap.get(e.id);
            return player && player.team === fixture.team_a;
          })
          .reduce((sum: number, e: any) => {
            const player = playersMap.get(e.id);
            return sum + parseFloat(player?.selected_by_percent || "0");
          }, 0) /
        Math.max(
          fixtureElements.filter((e: any) => {
            const player = playersMap.get(e.id);
            return player && player.team === fixture.team_a;
          }).length,
          1
        );

      // Determine status
      let status = "SCHEDULED";
      let minutes = 0;

      if (fixture.started && !fixture.finished) {
        status = "LIVE";
        minutes = fixture.minutes || 0;
      } else if (fixture.finished) {
        status = "FT";
        minutes = 90;
      }

      return {
        fixture_id: fixture.id,
        gameweek: fixture.event,
        home_team: {
          id: fixture.team_h,
          name: homeTeam?.name || "Unknown",
          short_name: homeTeam?.short_name || "UNK",
        },
        away_team: {
          id: fixture.team_a,
          name: awayTeam?.name || "Unknown",
          short_name: awayTeam?.short_name || "UNK",
        },
        home_score: fixture.team_h_score || 0,
        away_score: fixture.team_a_score || 0,
        status: status,
        kickoff_time: fixture.kickoff_time,
        minutes: minutes,
        home_goals: homeGoals,
        away_goals: awayGoals,
        home_assists: homeAssists,
        away_assists: awayAssists,
        top_performers: {
          home: homePerformers,
          away: awayPerformers,
        },
        home_ownership: Math.round(homeOwnership * 10) / 10,
        away_ownership: Math.round(awayOwnership * 10) / 10,
      };
    });

    return NextResponse.json({
      success: true,
      data: matchResults,
      gameweek,
      count: matchResults.length,
      timestamp: new Date().toISOString(),
      data_sources: {
        fixtures_api: "https://fantasy.premierleague.com/api/fixtures/",
        live_api: `https://fantasy.premierleague.com/api/event/${gameweek}/live/`,
        bootstrap_api:
          "https://fantasy.premierleague.com/api/bootstrap-static/",
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
