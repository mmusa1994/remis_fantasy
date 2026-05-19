import { NextRequest, NextResponse } from "next/server";
import {
  FPLBonusService,
  FPLBootstrapService,
  FPLFixtureService,
  FPLLiveService,
} from "@/services/fpl";
import type { FPLPlayer, FPLLiveElement } from "@/types/fpl";

const bonusService = FPLBonusService.getInstance();
const bootstrapService = FPLBootstrapService.getInstance();
const fixtureService = FPLFixtureService.getInstance();
const liveService = FPLLiveService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gwParam = searchParams.get("gw");
    if (!gwParam) {
      return NextResponse.json(
        { success: false, error: "Missing gw query parameter" },
        { status: 400 }
      );
    }
    const gameweek = parseInt(gwParam, 10);
    if (Number.isNaN(gameweek) || gameweek < 1 || gameweek > 38) {
      return NextResponse.json(
        { success: false, error: "Invalid gameweek" },
        { status: 400 }
      );
    }

    const [bootstrapResponse, fixturesResponse, liveResponse] =
      await Promise.all([
        bootstrapService.getBootstrapStatic(),
        fixtureService.getAllFixtures(),
        liveService.getLiveData(gameweek),
      ]);

    if (
      !bootstrapResponse.success ||
      !bootstrapResponse.data ||
      !liveResponse.success ||
      !liveResponse.data
    ) {
      throw new Error("Failed to fetch FPL data");
    }

    const players = bootstrapResponse.data.elements;
    const teams = bootstrapResponse.data.teams;
    const fixtures = fixturesResponse.success
      ? (fixturesResponse.data || []).filter((f) => f.event === gameweek)
      : [];
    const playerMap = new Map<number, FPLPlayer>(
      players.map((p: FPLPlayer) => [p.id, p])
    );
    const teamMap = new Map(teams.map((t) => [t.id, t]));
    const liveElementMap = new Map<number, FPLLiveElement>(
      (liveResponse.data.elements || []).map((el) => [el.id, el])
    );

    const leaderboard = fixtures.map((fixture) => {
      const predictions = bonusService.predictBonusForFixture(fixture);
      const predictionMap = new Map<number, (typeof predictions)[number]>(
        predictions.map((p) => [p.element, p])
      );
      const bpsStat = fixture.stats.find((s) => s.identifier === "bps");
      const bpsEntries = bpsStat
        ? [...bpsStat.a, ...bpsStat.h]
        : [];
      const seen = new Set<number>();
      const players = bpsEntries
        .filter((b) => {
          if (seen.has(b.element)) return false;
          seen.add(b.element);
          return true;
        })
        .map((b) => {
          const player = playerMap.get(b.element);
          const live = liveElementMap.get(b.element);
          const prediction = predictionMap.get(b.element);
          const currentBonus = live?.stats.bonus ?? 0;
          return {
            element: b.element,
            web_name: player?.web_name ?? "",
            team: player?.team ?? 0,
            position: player?.element_type ?? 0,
            minutes: live?.stats.minutes ?? 0,
            bps: b.value,
            predicted_bonus: prediction?.predicted_bonus ?? 0,
            current_bonus: currentBonus,
          };
        })
        .sort((a, b) => b.bps - a.bps);

      return {
        fixture_id: fixture.id,
        kickoff_time: fixture.kickoff_time,
        started: fixture.started,
        finished: fixture.finished,
        finished_provisional: fixture.finished_provisional,
        minutes: fixture.minutes,
        team_h: teamMap.get(fixture.team_h)?.short_name ?? "",
        team_a: teamMap.get(fixture.team_a)?.short_name ?? "",
        team_h_id: fixture.team_h,
        team_a_id: fixture.team_a,
        team_h_score: fixture.team_h_score,
        team_a_score: fixture.team_a_score,
        bps_leaderboard: players,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        gameweek,
        last_updated: new Date().toISOString(),
        fixtures: leaderboard,
      },
    });
  } catch (error) {
    console.error("BPS leaderboard error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
