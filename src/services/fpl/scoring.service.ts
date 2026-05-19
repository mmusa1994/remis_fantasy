import {
  applyAutoSubs,
  type SquadPlayer,
  type AutoSubResult,
} from "../../utils/fpl/autoSubs";
import { getPositionCode } from "../../utils/fpl/positions";
import type {
  FPLActiveChip,
  FPLAutoSubApplied,
  FPLCaptainPromotion,
  FPLChipEffects,
  FPLFixture,
  FPLLiveElement,
  FPLLiveTeamScore,
  FPLManagerPick,
  FPLPlayer,
  FPLPlayerScoreDetail,
} from "../../types/fpl";

export interface ScoringOptions {
  applyAutoSubs: boolean;
  autoCaptainPromotion: boolean;
  includePredictedBonus: boolean;
}

export interface ScoringInput {
  picks: FPLManagerPick[];
  activeChip: string | null;
  liveElements: Map<number, FPLLiveElement>;
  playersById: Map<number, FPLPlayer>;
  fixtures: FPLFixture[];
  predictedBonusByElement: Map<number, number>;
  bonusAlreadyAdded: boolean;
  entryHistory: {
    event_transfers_cost: number;
    total_points: number;
    points: number;
  };
  options: ScoringOptions;
}

export const DEFAULT_SCORING_OPTIONS: ScoringOptions = {
  applyAutoSubs: true,
  autoCaptainPromotion: true,
  includePredictedBonus: true,
};

/**
 * Centralized FPL live score calculator.
 *
 * Handles:
 *  - Auto-subs (FPL rules: DNP starter swapped with eligible bench player respecting formation)
 *  - Bench Boost (BB): all 15 contribute, no auto-subs
 *  - Triple Captain (TC): captain multiplier is 3 (FPL already returns multiplier=3)
 *  - Free Hit / Wildcard (FH/WC): same scoring as normal; transfer cost forced to 0
 *  - Captain DNP -> Vice Captain promotion (captain's multiplier transfers to VC)
 *  - Provisional bonus injection mid-game (when bonus_added=false)
 *  - Gross (no hit) and Net (after transfer cost)
 */
export class FPLScoringService {
  private static instance: FPLScoringService;

  public static getInstance(): FPLScoringService {
    if (!FPLScoringService.instance) {
      FPLScoringService.instance = new FPLScoringService();
    }
    return FPLScoringService.instance;
  }

  public calculateLiveTeamScore(input: ScoringInput): FPLLiveTeamScore {
    const chip = this.normalizeChip(input.activeChip);

    const initialSquad = this.buildSquad(input, chip);
    const captainPickId = input.picks.find((p) => p.is_captain)?.element ?? null;
    const viceCaptainPickId =
      input.picks.find((p) => p.is_vice_captain)?.element ?? null;

    let workingSquad = initialSquad.map((p) => ({ ...p }));

    const benchBoostApplied = chip === "bboost";
    if (benchBoostApplied) {
      for (const p of workingSquad) {
        if (!p.isStarter && p.multiplier === 0) {
          p.multiplier = 1;
        }
      }
    }

    let autoSubResult: AutoSubResult | null = null;
    if (input.options.applyAutoSubs && !benchBoostApplied) {
      autoSubResult = applyAutoSubs(workingSquad);
      const finalIds = new Set(autoSubResult.appliedTeam.map((p) => p.id));
      workingSquad = workingSquad.map((p) => {
        const inFinal = finalIds.has(p.id);
        return {
          ...p,
          isStarter: inFinal ? true : false,
        };
      });
    }

    let captainPromoted: FPLCaptainPromotion | null = null;
    if (
      input.options.autoCaptainPromotion &&
      captainPickId !== null &&
      viceCaptainPickId !== null
    ) {
      const captain = workingSquad.find((p) => p.id === captainPickId);
      const vice = workingSquad.find((p) => p.id === viceCaptainPickId);
      const captainIsActive = captain?.isStarter || benchBoostApplied;
      const viceIsActive = vice?.isStarter || benchBoostApplied;
      const captainDNP =
        captain && captain.minutes === 0 && captain.fixtureFinished;
      const viceEligible = vice && vice.minutes > 0 && viceIsActive;
      if (captain && vice && captainIsActive && captainDNP && viceEligible) {
        const transferred = captain.multiplier;
        captain.multiplier = 1;
        vice.multiplier = transferred;
        captainPromoted = { fromId: captain.id, toId: vice.id };
      }
    }

    const contributingPlayers = workingSquad.filter(
      (p) => p.isStarter || benchBoostApplied
    );

    let livePointsGross = 0;
    for (const player of contributingPlayers) {
      livePointsGross += player.points * (player.multiplier || 0);
    }

    const chipBlocksHit = chip === "freehit" || chip === "wildcard";
    const effectiveHitCost = chipBlocksHit
      ? 0
      : input.entryHistory.event_transfers_cost || 0;
    const livePointsNet = livePointsGross - effectiveHitCost;
    const liveTotal =
      input.entryHistory.total_points -
      input.entryHistory.points +
      livePointsNet;

    const subsApplied: FPLAutoSubApplied[] = (autoSubResult?.subsApplied || []).map(
      (s) => ({
        outId: s.outId,
        inId: s.inId,
        reason: s.reason,
        orderUsed: s.orderUsed,
      })
    );

    const subbedInIds = new Set(subsApplied.map((s) => s.inId));
    const subbedOutIds = new Set(subsApplied.map((s) => s.outId));

    const playerDetails: FPLPlayerScoreDetail[] = workingSquad.map((p) => ({
      element: p.id,
      raw_points:
        input.liveElements.get(p.id)?.stats.total_points ?? p.points,
      bonus_predicted: input.bonusAlreadyAdded
        ? 0
        : input.predictedBonusByElement.get(p.id) || 0,
      effective_points: p.points,
      multiplier_final: p.multiplier,
      is_captain_final:
        captainPromoted?.toId === p.id
          ? true
          : p.id === captainPickId && !captainPromoted,
      is_starter_final: p.isStarter || benchBoostApplied,
      was_auto_subbed_in: subbedInIds.has(p.id),
      was_auto_subbed_out: subbedOutIds.has(p.id),
      was_captain_promoted: captainPromoted?.toId === p.id,
      fixture_finished: p.fixtureFinished,
      minutes: p.minutes,
    }));

    const chipEffects: FPLChipEffects = {
      bench_boost_applied: benchBoostApplied,
      triple_captain_applied: chip === "3xc",
      free_hit_applied: chip === "freehit",
      wildcard_applied: chip === "wildcard",
    };

    return {
      live_points_gross: livePointsGross,
      live_points_net: livePointsNet,
      live_total: liveTotal,
      chip,
      chip_effects: chipEffects,
      auto_subs_applied: subsApplied,
      captain_promoted: captainPromoted,
      player_details: playerDetails,
    };
  }

  private buildSquad(input: ScoringInput, _chip: FPLActiveChip): SquadPlayer[] {
    const benchOutfieldPicks = input.picks
      .filter((p) => p.position > 11)
      .filter((p) => {
        const player = input.playersById.get(p.element);
        return player ? player.element_type !== 1 : true;
      })
      .sort((a, b) => a.position - b.position);
    const benchOrderMap = new Map<number, number>();
    benchOutfieldPicks.forEach((p, idx) => {
      benchOrderMap.set(p.element, idx + 1);
    });

    const benchGKElement = input.picks.find((p) => {
      const player = input.playersById.get(p.element);
      return p.position > 11 && player && player.element_type === 1;
    });

    return input.picks.map((pick) => {
      const liveElement = input.liveElements.get(pick.element);
      const player = input.playersById.get(pick.element);
      const elementType = player?.element_type ?? 3;
      const playerTeamId = player?.team ?? 0;
      const minutes = liveElement?.stats.minutes ?? 0;
      const rawTotalPoints = liveElement?.stats.total_points ?? 0;
      const currentBonus = liveElement?.stats.bonus ?? 0;
      const playerHasLiveFixture = input.fixtures.some(
        (f) =>
          (f.team_h === playerTeamId || f.team_a === playerTeamId) &&
          f.started &&
          !f.finished
      );
      const shouldInjectBonus =
        input.options.includePredictedBonus &&
        !input.bonusAlreadyAdded &&
        currentBonus === 0 &&
        playerHasLiveFixture;
      const predictedBonus = shouldInjectBonus
        ? input.predictedBonusByElement.get(pick.element) || 0
        : 0;
      const effectivePoints = rawTotalPoints + predictedBonus;
      const fixtureFinished = playerTeamId
        ? this.isTeamFixtureFinished(playerTeamId, input.fixtures)
        : false;

      const baseMultiplier = pick.multiplier;
      const isStarter = pick.position <= 11;

      return {
        id: pick.element,
        position: getPositionCode(elementType),
        isStarter,
        benchOrder: benchOrderMap.get(pick.element),
        isBenchGK: benchGKElement?.element === pick.element,
        minutes,
        points: effectivePoints,
        multiplier: baseMultiplier,
        fixtureFinished,
      };
    });
  }

  private isTeamFixtureFinished(
    teamId: number,
    fixtures: FPLFixture[]
  ): boolean {
    const teamFixtures = fixtures.filter(
      (f) => f.team_h === teamId || f.team_a === teamId
    );
    if (teamFixtures.length === 0) return false;
    return teamFixtures.every((f) => f.finished === true);
  }

  private normalizeChip(activeChip: string | null): FPLActiveChip {
    if (!activeChip) return null;
    const normalized = activeChip.toLowerCase();
    if (normalized === "3xc" || normalized === "triple_captain") return "3xc";
    if (normalized === "bboost" || normalized === "bench_boost") return "bboost";
    if (normalized === "freehit" || normalized === "free_hit") return "freehit";
    if (normalized === "wildcard") return "wildcard";
    return null;
  }
}
