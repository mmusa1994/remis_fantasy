import { BaseFPLService } from "./base.service";
import { FPLLeagueService } from "./league.service";
import { FPLTeamService } from "./team.service";
import { FPLBootstrapService } from "./bootstrap.service";
import { FPLServiceError } from "./errors";
import type {
  FPLActiveChip,
  FPLChipUsageResponse,
  FPLChipUsageStat,
  FPLServiceResponse,
} from "../../types/fpl";

const OVERALL_LEAGUE_ID = 314;

type ChipName = "3xc" | "bboost" | "freehit" | "wildcard";
const KNOWN_CHIPS: ChipName[] = ["3xc", "bboost", "freehit", "wildcard"];

/**
 * Chip usage aggregator. Samples top managers from the overall classic
 * league and aggregates active_chip + popular captains per chip.
 *
 * MVP: defaults to 200 sample size for fast turnaround.
 * Cache TTL: 5 minutes per gameweek.
 */
export class FPLChipUsageService extends BaseFPLService {
  private static instance: FPLChipUsageService;
  private teamService: FPLTeamService;
  private leagueService: FPLLeagueService;
  private bootstrapService: FPLBootstrapService;

  public static getInstance(): FPLChipUsageService {
    if (!FPLChipUsageService.instance) {
      FPLChipUsageService.instance = new FPLChipUsageService();
    }
    return FPLChipUsageService.instance;
  }

  constructor() {
    super();
    this.teamService = FPLTeamService.getInstance();
    this.leagueService = FPLLeagueService.getInstance();
    this.bootstrapService = FPLBootstrapService.getInstance();
  }

  public async computeChipUsageForGameweek(
    gameweek: number,
    sampleSize = 200
  ): Promise<FPLServiceResponse<FPLChipUsageResponse>> {
    this.validateGameweek(gameweek);
    const cacheKey = `chip_usage_gw${gameweek}_n${sampleSize}`;
    if (this.isCacheValid(cacheKey, 5 * 60 * 1000)) {
      const cached = this.getFromCache<FPLChipUsageResponse>(cacheKey);
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
      const standingsResponse =
        await this.leagueService.getClassicLeagueStandings(OVERALL_LEAGUE_ID, 1);
      if (!standingsResponse.success || !standingsResponse.data) {
        throw new Error("Failed to fetch overall league standings");
      }
      const standings = standingsResponse.data.standings.results.slice(
        0,
        sampleSize
      );

      const chipCount: Record<ChipName, number> = {
        "3xc": 0,
        bboost: 0,
        freehit: 0,
        wildcard: 0,
      };
      const captainByChip: Record<ChipName, Map<number, number>> = {
        "3xc": new Map(),
        bboost: new Map(),
        freehit: new Map(),
        wildcard: new Map(),
      };
      let withChipTotal = 0;

      const chunkSize = 10;
      for (let i = 0; i < standings.length; i += chunkSize) {
        const chunk = standings.slice(i, i + chunkSize);
        const responses = await Promise.all(
          chunk.map((entry) =>
            this.teamService
              .getManagerPicks(entry.entry, gameweek)
              .catch(() => null)
          )
        );
        for (const res of responses) {
          if (!res || !res.success || !res.data) continue;
          const chip = this.normalizeChip(res.data.active_chip);
          if (!chip) continue;
          chipCount[chip] += 1;
          withChipTotal += 1;
          const captainPick = res.data.picks.find((p) => p.is_captain);
          if (captainPick) {
            const map = captainByChip[chip];
            map.set(captainPick.element, (map.get(captainPick.element) || 0) + 1);
          }
        }
      }

      const playersResponse = await this.bootstrapService.getAllPlayers();
      const players = playersResponse.success ? playersResponse.data || [] : [];
      const playerById = new Map(players.map((p) => [p.id, p]));

      const byChip: FPLChipUsageStat[] = KNOWN_CHIPS.map((chip) => {
        const count = chipCount[chip];
        const percentage = (count / Math.max(standings.length, 1)) * 100;
        const captainEntries = Array.from(captainByChip[chip].entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([playerId, captainCount]) => ({
            player_id: playerId,
            web_name: playerById.get(playerId)?.web_name,
            percentage: Number(
              ((captainCount / Math.max(count, 1)) * 100).toFixed(2)
            ),
          }));
        return {
          chip,
          count,
          percentage: Number(percentage.toFixed(2)),
          popular_captains: captainEntries,
        } as FPLChipUsageStat;
      });

      const payload: FPLChipUsageResponse = {
        gameweek,
        sample_size: standings.length,
        total_with_chip: withChipTotal,
        by_chip: byChip,
      };

      this.setCache(cacheKey, payload, 5 * 60 * 1000);

      return {
        success: true,
        data: payload,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to compute chip usage for GW${gameweek}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLChipUsageService",
        "computeChipUsageForGameweek",
        error instanceof Error ? error : undefined
      );
    }
  }

  private normalizeChip(value: string | null | undefined): FPLActiveChip {
    if (!value) return null;
    const lower = value.toLowerCase();
    if (lower === "3xc" || lower === "triple_captain") return "3xc";
    if (lower === "bboost" || lower === "bench_boost") return "bboost";
    if (lower === "freehit" || lower === "free_hit") return "freehit";
    if (lower === "wildcard") return "wildcard";
    return null;
  }
}
