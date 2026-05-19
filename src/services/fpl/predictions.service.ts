import { BaseFPLService } from "./base.service";
import { FPLBootstrapService } from "./bootstrap.service";
import { FPLFixtureService } from "./fixture.service";
import { FPLServiceError } from "./errors";
import type {
  FPLPlayer,
  FPLServiceResponse,
  FPLXPointsPrediction,
} from "../../types/fpl";

/**
 * MVP xPts (expected points) prediction service.
 *
 * Uses a deterministic heuristic blending form, ICT index, expected
 * goals/assists, and clean-sheet probability derived from fixture
 * difficulty. Not ML-grade; intended for relative ranking on UI.
 *
 * Cache TTL: 1 hour per gameweek.
 */
export class FPLPredictionsService extends BaseFPLService {
  private static instance: FPLPredictionsService;
  private bootstrapService: FPLBootstrapService;
  private fixtureService: FPLFixtureService;

  public static getInstance(): FPLPredictionsService {
    if (!FPLPredictionsService.instance) {
      FPLPredictionsService.instance = new FPLPredictionsService();
    }
    return FPLPredictionsService.instance;
  }

  constructor() {
    super();
    this.bootstrapService = FPLBootstrapService.getInstance();
    this.fixtureService = FPLFixtureService.getInstance();
  }

  public async predictForGameweek(
    gameweek: number
  ): Promise<FPLServiceResponse<FPLXPointsPrediction[]>> {
    this.validateGameweek(gameweek);
    const cacheKey = `xpts_predictions_gw${gameweek}`;
    if (this.isCacheValid(cacheKey, 60 * 60 * 1000)) {
      const cached = this.getFromCache<FPLXPointsPrediction[]>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          timestamp: new Date().toISOString(),
          cache_hit: true,
        };
      }
    }

    try {
      const [playersResponse, fixturesResponse] = await Promise.all([
        this.bootstrapService.getAllPlayers(),
        this.fixtureService.getAllFixtures(),
      ]);
      if (!playersResponse.success || !playersResponse.data) {
        throw new Error("Failed to fetch bootstrap players");
      }
      const players: FPLPlayer[] = playersResponse.data;
      const fixtures = fixturesResponse.success
        ? (fixturesResponse.data || []).filter(
            (f: { event: number }) => f.event === gameweek
          )
        : [];

      const teamFixturesMap = new Map<
        number,
        { is_home: boolean; difficulty: number }[]
      >();
      for (const f of fixtures) {
        const home = teamFixturesMap.get(f.team_h) || [];
        home.push({ is_home: true, difficulty: f.team_h_difficulty });
        teamFixturesMap.set(f.team_h, home);
        const away = teamFixturesMap.get(f.team_a) || [];
        away.push({ is_home: false, difficulty: f.team_a_difficulty });
        teamFixturesMap.set(f.team_a, away);
      }

      const predictions: FPLXPointsPrediction[] = [];
      for (const player of players) {
        if (player.status !== "a" && player.status !== "d") continue;
        const teamFixtures = teamFixturesMap.get(player.team) || [];
        if (teamFixtures.length === 0) continue;

        const xPts = this.estimateXPoints(player, teamFixtures);
        if (xPts.expected_points <= 0.5) continue;
        predictions.push({
          player_id: player.id,
          web_name: player.web_name,
          ...xPts,
        });
      }

      predictions.sort((a, b) => b.expected_points - a.expected_points);

      this.setCache(cacheKey, predictions, 60 * 60 * 1000);
      return {
        success: true,
        data: predictions,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to predict xPts for GW${gameweek}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLPredictionsService",
        "predictForGameweek",
        error instanceof Error ? error : undefined
      );
    }
  }

  private estimateXPoints(
    player: FPLPlayer,
    fixtures: { is_home: boolean; difficulty: number }[]
  ): Omit<FPLXPointsPrediction, "player_id" | "web_name"> {
    const form = parseFloat(player.form || "0") || 0;
    const ictPerGame =
      parseFloat(player.ict_index || "0") /
      Math.max(parseFloat(player.starts_per_90?.toString() || "1") || 1, 1);
    const xG = parseFloat(player.expected_goals_per_90?.toString() || "0") || 0;
    const xA =
      parseFloat(player.expected_assists_per_90?.toString() || "0") || 0;

    const positionType = player.element_type;
    const goalPoints = positionType === 1 ? 10 : positionType === 2 ? 6 : positionType === 3 ? 5 : 4;
    const assistPoints = 3;
    const csPoints = positionType === 1 || positionType === 2 ? 4 : positionType === 3 ? 1 : 0;

    const fixtureCount = fixtures.length;
    const minutesProb = this.minutesProbability(player);
    const minutesExpected = minutesProb * 90 * fixtureCount;
    const minutesPoints = minutesProb >= 0.8 ? 2 * fixtureCount : minutesProb >= 0.5 ? 1 * fixtureCount : 0;

    const avgDifficulty =
      fixtures.reduce((s, f) => s + (f.difficulty || 3), 0) /
      Math.max(fixtures.length, 1);
    const difficultyMultiplier = 1 + (3 - avgDifficulty) * 0.1;

    const expectedGoals =
      xG * minutesProb * fixtureCount * difficultyMultiplier;
    const expectedAssists =
      xA * minutesProb * fixtureCount * difficultyMultiplier;
    const csProbability = this.cleanSheetProbability(avgDifficulty);
    const expectedCS = csProbability * fixtureCount;

    const goalContribution = expectedGoals * goalPoints;
    const assistContribution = expectedAssists * assistPoints;
    const csContribution = expectedCS * csPoints;
    const formContribution = form * 0.4;
    const ictContribution = (ictPerGame / 30) * fixtureCount;
    const bonusProbability = Math.min(
      0.95,
      ((expectedGoals + expectedAssists) * 0.4 + form * 0.05) / 2
    );
    const bonusContribution = bonusProbability * 1.5 * fixtureCount;

    const expectedPoints =
      minutesPoints +
      goalContribution +
      assistContribution +
      csContribution +
      formContribution +
      ictContribution +
      bonusContribution;

    return {
      expected_points: Number(expectedPoints.toFixed(2)),
      captaincy_score: Number((expectedPoints * 2).toFixed(2)),
      bonus_probability: Number(bonusProbability.toFixed(3)),
      components: {
        minutes_expected: Number(minutesExpected.toFixed(1)),
        goal_threat: Number(goalContribution.toFixed(2)),
        assist_threat: Number(assistContribution.toFixed(2)),
        cs_probability: Number(csProbability.toFixed(3)),
      },
    };
  }

  private minutesProbability(player: FPLPlayer): number {
    if (player.status === "u" || player.status === "n") return 0;
    if (player.status === "i" || player.status === "s") return 0.1;
    const chanceNext = player.chance_of_playing_next_round;
    if (chanceNext === 0) return 0;
    if (chanceNext === null) {
      const minutesPerStart = player.starts > 0 ? 90 : 60;
      return Math.min(1, minutesPerStart / 90);
    }
    return chanceNext / 100;
  }

  private cleanSheetProbability(avgDifficulty: number): number {
    if (avgDifficulty <= 2) return 0.55;
    if (avgDifficulty === 3) return 0.32;
    if (avgDifficulty === 4) return 0.18;
    return 0.08;
  }
}
