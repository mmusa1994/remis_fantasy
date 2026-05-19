import { BaseFPLService } from "./base.service";
import { FPLLeagueService } from "./league.service";
import { FPLTeamService } from "./team.service";
import { FPLBootstrapService } from "./bootstrap.service";
import { FPLServiceError } from "./errors";
import type {
  FPLEffectiveOwnership,
  FPLEOBucket,
  FPLServiceResponse,
} from "../../types/fpl";

const OVERALL_LEAGUE_ID = 314;
const BUCKET_LIMITS: Record<FPLEOBucket, number> = {
  top10k: 100,
  top100k: 250,
  overall: 500,
};

interface EOAccumulator {
  owners: number;
  captains: number;
  triple_captains: number;
}

/**
 * Effective Ownership service for live FPL league analytics.
 *
 * MVP implementation: samples top N managers from the overall classic
 * league (ID 314) and aggregates ownership / captain / TC EO per player.
 *
 * Limitations:
 *  - "Top10k" bucket uses a sample of 100 managers (not the full 10k).
 *  - Reliable trend across buckets; absolute values approximate.
 *
 * Cache TTL: 5 minutes per (bucket, gameweek).
 */
export class FPLEffectiveOwnershipService extends BaseFPLService {
  private static instance: FPLEffectiveOwnershipService;
  private teamService: FPLTeamService;
  private leagueService: FPLLeagueService;
  private bootstrapService: FPLBootstrapService;

  public static getInstance(): FPLEffectiveOwnershipService {
    if (!FPLEffectiveOwnershipService.instance) {
      FPLEffectiveOwnershipService.instance = new FPLEffectiveOwnershipService();
    }
    return FPLEffectiveOwnershipService.instance;
  }

  constructor() {
    super();
    this.teamService = FPLTeamService.getInstance();
    this.leagueService = FPLLeagueService.getInstance();
    this.bootstrapService = FPLBootstrapService.getInstance();
  }

  public async computeEOForBucket(
    bucket: FPLEOBucket,
    gameweek: number,
    sampleSize?: number
  ): Promise<FPLServiceResponse<FPLEffectiveOwnership[]>> {
    this.validateGameweek(gameweek);
    const size = sampleSize ?? BUCKET_LIMITS[bucket];
    const cacheKey = `eo_${bucket}_gw${gameweek}_n${size}`;
    if (this.isCacheValid(cacheKey, 5 * 60 * 1000)) {
      const cached = this.getFromCache<FPLEffectiveOwnership[]>(cacheKey);
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
      const standings = standingsResponse.data.standings.results.slice(0, size);
      const accumulator = new Map<number, EOAccumulator>();

      const chunkSize = 10;
      for (let i = 0; i < standings.length; i += chunkSize) {
        const chunk = standings.slice(i, i + chunkSize);
        const picksResponses = await Promise.all(
          chunk.map((entry) =>
            this.teamService
              .getManagerPicks(entry.entry, gameweek)
              .catch(() => null)
          )
        );

        for (const response of picksResponses) {
          if (!response || !response.success || !response.data) continue;
          const data = response.data;
          const isTC = data.active_chip === "3xc";
          for (const pick of data.picks) {
            const entry = accumulator.get(pick.element) || {
              owners: 0,
              captains: 0,
              triple_captains: 0,
            };
            entry.owners += 1;
            if (pick.is_captain) {
              entry.captains += 1;
              if (isTC) entry.triple_captains += 1;
            }
            accumulator.set(pick.element, entry);
          }
        }
      }

      const sampled = standings.length;
      const result: FPLEffectiveOwnership[] = [];
      const playersResponse = await this.bootstrapService.getAllPlayers();
      const players = playersResponse.success ? playersResponse.data || [] : [];
      const playerById = new Map(players.map((p) => [p.id, p]));

      for (const [playerId, stats] of accumulator.entries()) {
        const player = playerById.get(playerId);
        const ownershipPercent = (stats.owners / sampled) * 100;
        const captainPercent = (stats.captains / sampled) * 100;
        const tcPercent = (stats.triple_captains / sampled) * 100;
        result.push({
          bucket,
          player_id: playerId,
          ownership_percent: Number(ownershipPercent.toFixed(2)),
          captain_percent: Number(captainPercent.toFixed(2)),
          triple_captain_percent: Number(tcPercent.toFixed(2)),
          transfer_in_percent: player
            ? Number(
                ((player.transfers_in_event / Math.max(sampled, 1)) * 100).toFixed(
                  2
                )
              )
            : 0,
          transfer_out_percent: player
            ? Number(
                (
                  (player.transfers_out_event / Math.max(sampled, 1)) *
                  100
                ).toFixed(2)
              )
            : 0,
          net_transfers_percent: player
            ? Number(
                (
                  ((player.transfers_in_event - player.transfers_out_event) /
                    Math.max(sampled, 1)) *
                  100
                ).toFixed(2)
              )
            : 0,
        });
      }

      result.sort((a, b) => b.ownership_percent - a.ownership_percent);
      this.setCache(cacheKey, result, 5 * 60 * 1000);

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new FPLServiceError(
        `Failed to compute EO for bucket ${bucket}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "FPLEffectiveOwnershipService",
        "computeEOForBucket",
        error instanceof Error ? error : undefined
      );
    }
  }
}
