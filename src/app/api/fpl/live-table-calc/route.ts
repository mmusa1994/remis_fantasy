import { NextRequest, NextResponse } from "next/server";
import {
  FPLBootstrapService,
  FPLFixtureService,
  FPLLeagueService,
  FPLLiveService,
  FPLTeamService,
  FPLScoringService,
  FPLBonusService,
} from "@/services/fpl";
import { DEFAULT_SCORING_OPTIONS } from "@/services/fpl/scoring.service";
import type {
  FPLActiveChip,
  FPLClassicLeagueEntry,
  FPLLiveElement,
  FPLPlayer,
  FPLPlayerScoreDetail,
} from "@/types/fpl";

const bootstrapService = FPLBootstrapService.getInstance();
const fixtureService = FPLFixtureService.getInstance();
const leagueService = FPLLeagueService.getInstance();
const liveService = FPLLiveService.getInstance();
const teamService = FPLTeamService.getInstance();
const scoringService = FPLScoringService.getInstance();
const bonusService = FPLBonusService.getInstance();

interface ProcessedTeam {
  id: number;
  player_name: string;
  entry_name: string;
  rank: number;
  last_rank: number;
  rank_change: number;
  event_total: number;
  total: number;
  live_points: number;
  live_points_gross: number;
  live_points_net: number;
  live_total: number;
  captain: { name: string; points: number };
  players_to_play: number;
  active_chip: FPLActiveChip;
  chip_effects: {
    bench_boost_applied: boolean;
    triple_captain_applied: boolean;
    free_hit_applied: boolean;
    wildcard_applied: boolean;
  };
  auto_subs_applied: Array<{ outId: number; inId: number; reason: string }>;
  captain_promoted: { fromId: number; toId: number } | null;
  picks: Array<{
    element: number;
    position: number;
    multiplier: number;
    is_captain: boolean;
    is_vice_captain: boolean;
  }>;
  event_transfers: number;
  event_transfers_cost: number;
  team_value: number;
  bank: number;
  player_details: Array<
    FPLPlayerScoreDetail & {
      points: number;
      live_points: number;
      multiplier: number;
      position: number;
      is_captain: boolean;
      is_vice_captain: boolean;
      opponent?: string;
      is_home?: boolean;
    }
  >;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const managerId = searchParams.get("managerId");
    const gameweekParam = searchParams.get("gameweek");
    const leagueId = searchParams.get("leagueId");
    const autoSubsParam = searchParams.get("autoSubs");

    if (!managerId || !leagueId) {
      return NextResponse.json(
        { success: false, error: "Manager ID and League ID are required" },
        { status: 400 }
      );
    }

    const requestedGameweek = parseInt(gameweekParam || "1", 10);
    const applyAutoSubs = autoSubsParam !== "0";

    const [bootstrapResponse, fixturesResponse, leagueResponse] =
      await Promise.all([
        bootstrapService.getBootstrapStatic(),
        fixtureService.getAllFixtures(),
        leagueService.getClassicLeagueStandings(parseInt(leagueId, 10), 1),
      ]);

    if (!bootstrapResponse.success || !bootstrapResponse.data) {
      throw new Error("Failed to fetch bootstrap static data");
    }
    if (!leagueResponse.success || !leagueResponse.data) {
      throw new Error("Failed to fetch league standings");
    }

    const bootstrap = bootstrapResponse.data;
    const players = bootstrap.elements;
    const teams = bootstrap.teams;
    const events = bootstrap.events;

    const currentEvent =
      events.find((e) => e.is_current) ||
      events.find((e) => e.id === requestedGameweek) ||
      events[Math.max(0, requestedGameweek - 1)];
    if (!currentEvent) {
      throw new Error("Current event not found");
    }
    const gameweek = currentEvent.id;

    const [liveResponse, eventStatusResponse] = await Promise.all([
      liveService.getLiveData(gameweek),
      liveService.getEventStatus(),
    ]);

    if (!liveResponse.success || !liveResponse.data) {
      throw new Error("Failed to fetch live event data");
    }

    const liveElements: FPLLiveElement[] = liveResponse.data.elements;
    const allFixtures = fixturesResponse.success
      ? fixturesResponse.data || []
      : [];
    const fixtures = allFixtures.filter((f) => f.event === gameweek);

    const bonusStatus =
      eventStatusResponse.success && eventStatusResponse.data
        ? eventStatusResponse.data.status?.find(
            (s: { event: number; bonus_added: boolean }) =>
              s.event === gameweek
          )
        : null;
    const bonusAdded = bonusStatus?.bonus_added || false;

    const predictedBonusMap = bonusService.predictBonusForGameweek(fixtures);

    const liveElementMap = new Map<number, FPLLiveElement>(
      liveElements.map((e) => [e.id, e])
    );
    const playerByIdMap = new Map<number, FPLPlayer>(
      players.map((p: FPLPlayer) => [p.id, p])
    );

    const standings: FPLClassicLeagueEntry[] =
      leagueResponse.data.standings.results.slice(0, 50);

    const processedTeams: ProcessedTeam[] = [];

    const chunkSize = 10;
    for (let i = 0; i < standings.length; i += chunkSize) {
      const chunk = standings.slice(i, i + chunkSize);
      const picksResponses = await Promise.all(
        chunk.map((entry) =>
          teamService
            .getManagerPicks(entry.entry, gameweek)
            .then((res) => ({ entry, res }))
            .catch(() => ({ entry, res: null as null }))
        )
      );

      for (const { entry, res } of picksResponses) {
        if (!res || !res.success || !res.data) continue;
        const managerPicks = res.data;

        const scoreResult = scoringService.calculateLiveTeamScore({
          picks: managerPicks.picks,
          activeChip: managerPicks.active_chip,
          liveElements: liveElementMap,
          playersById: playerByIdMap,
          fixtures,
          predictedBonusByElement: predictedBonusMap,
          bonusAlreadyAdded: bonusAdded,
          entryHistory: {
            event_transfers_cost:
              managerPicks.entry_history.event_transfers_cost || 0,
            total_points: managerPicks.entry_history.total_points,
            points: managerPicks.entry_history.points,
          },
          options: {
            ...DEFAULT_SCORING_OPTIONS,
            applyAutoSubs,
          },
        });

        let captainName = "";
        let captainPoints = 0;
        const captainPick = managerPicks.picks.find((p) => p.is_captain);
        if (captainPick) {
          const captainPlayer = playerByIdMap.get(captainPick.element);
          captainName = captainPlayer?.web_name || "";
          const captainDetail = scoreResult.player_details.find(
            (d) => d.element === captainPick.element
          );
          captainPoints =
            (captainDetail?.effective_points || 0) *
            (captainDetail?.multiplier_final || captainPick.multiplier);
        }
        if (scoreResult.captain_promoted) {
          const promoted = playerByIdMap.get(scoreResult.captain_promoted.toId);
          captainName = promoted?.web_name || captainName;
          const promotedDetail = scoreResult.player_details.find(
            (d) => d.element === scoreResult.captain_promoted!.toId
          );
          captainPoints =
            (promotedDetail?.effective_points || 0) *
            (promotedDetail?.multiplier_final || 2);
        }

        let playersToPlay = 0;
        const playerDetails: ProcessedTeam["player_details"] = [];
        for (const pick of managerPicks.picks) {
          const detail = scoreResult.player_details.find(
            (d) => d.element === pick.element
          );
          const liveEl = liveElementMap.get(pick.element);
          const player = playerByIdMap.get(pick.element);

          const hasPlayed =
            (liveEl?.stats.minutes || 0) > 0 ||
            fixtures.some(
              (f) =>
                (f.team_h === player?.team || f.team_a === player?.team) &&
                f.finished
            );
          if (pick.position <= 11 && !hasPlayed) {
            playersToPlay += 1;
          }

          const upcomingFixture = fixtures.find(
            (f) =>
              (f.team_h === player?.team || f.team_a === player?.team) &&
              !f.finished
          );
          let opponent: string | undefined;
          let isHome: boolean | undefined;
          if (upcomingFixture && player) {
            const opponentTeamId =
              upcomingFixture.team_h === player.team
                ? upcomingFixture.team_a
                : upcomingFixture.team_h;
            const opponentTeam = teams.find((t) => t.id === opponentTeamId);
            if (opponentTeam) {
              opponent = opponentTeam.short_name;
              isHome = upcomingFixture.team_h === player.team;
            }
          }

          playerDetails.push({
            element: pick.element,
            raw_points: detail?.raw_points ?? 0,
            bonus_predicted: detail?.bonus_predicted ?? 0,
            effective_points: detail?.effective_points ?? 0,
            multiplier_final:
              detail?.multiplier_final ?? pick.multiplier,
            is_captain_final: detail?.is_captain_final ?? pick.is_captain,
            is_starter_final: detail?.is_starter_final ?? pick.position <= 11,
            was_auto_subbed_in: detail?.was_auto_subbed_in ?? false,
            was_auto_subbed_out: detail?.was_auto_subbed_out ?? false,
            was_captain_promoted: detail?.was_captain_promoted ?? false,
            fixture_finished: detail?.fixture_finished ?? false,
            minutes: detail?.minutes ?? liveEl?.stats.minutes ?? 0,
            // backwards-compat fields kept for legacy clients
            points: detail?.raw_points ?? 0,
            live_points: detail?.effective_points ?? 0,
            multiplier: pick.multiplier,
            position: pick.position,
            is_captain: pick.is_captain,
            is_vice_captain: pick.is_vice_captain,
            opponent,
            is_home: isHome,
          });
        }

        processedTeams.push({
          id: entry.entry,
          player_name: entry.player_name,
          entry_name: entry.entry_name,
          rank: entry.rank,
          last_rank: entry.last_rank,
          rank_change: entry.last_rank - entry.rank,
          event_total: entry.event_total,
          total: entry.total,
          live_points: scoreResult.live_points_net,
          live_points_gross: scoreResult.live_points_gross,
          live_points_net: scoreResult.live_points_net,
          live_total: scoreResult.live_total,
          captain: { name: captainName, points: captainPoints },
          players_to_play: playersToPlay,
          active_chip: scoreResult.chip,
          chip_effects: scoreResult.chip_effects,
          auto_subs_applied: scoreResult.auto_subs_applied.map((sub) => ({
            outId: sub.outId,
            inId: sub.inId,
            reason: sub.reason,
          })),
          captain_promoted: scoreResult.captain_promoted,
          picks: managerPicks.picks.map((pick) => ({
            element: pick.element,
            position: pick.position,
            multiplier: pick.multiplier,
            is_captain: pick.is_captain,
            is_vice_captain: pick.is_vice_captain,
          })),
          event_transfers: managerPicks.entry_history.event_transfers,
          event_transfers_cost: managerPicks.entry_history.event_transfers_cost,
          team_value: managerPicks.entry_history.value,
          bank: managerPicks.entry_history.bank,
          player_details: playerDetails,
        });
      }
    }

    processedTeams.sort((a, b) => b.live_total - a.live_total);
    processedTeams.forEach((team, index) => {
      team.rank = index + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        league: {
          id: leagueId,
          name: leagueResponse.data.league.name,
        },
        gameweek,
        bonus_added: bonusAdded,
        auto_subs_enabled: applyAutoSubs,
        teams: processedTeams,
        elements: players.map((p) => ({
          id: p.id,
          first_name: p.first_name,
          second_name: p.second_name,
          web_name: p.web_name,
          team: p.team,
          element_type: p.element_type,
        })),
        fpl_teams: teams,
        last_updated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Live table calculation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
