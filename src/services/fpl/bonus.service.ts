import type { FPLFixture, FPLBonusPrediction } from "../../types/fpl";

/**
 * FPL Bonus Prediction Service
 *
 * Applies official FPL bonus tie-break rules to predict 3/2/1 bonus
 * distribution mid-game from BPS, and reads official bonus once finalized.
 *
 * Tie-break rules:
 *   1 alone, 2 alone, 3 alone               -> 3 / 2 / 1
 *   1 alone, 2 alone, 3 tied (N>=2)         -> 3 / 2 / 1 each of tied
 *   1 alone, 2 tied (N=2)                   -> 3 / 2 / 2 (no 1pt)
 *   1 alone, 2 tied (N>=3)                  -> 3 / 2 each tied / no 3rd
 *   1 tied (N=2)                            -> 3 / 3 / 1 to next BPS group
 *   1 tied (N>=3)                           -> 3 each / no 2nd / no 3rd
 */
export class FPLBonusService {
  private static instance: FPLBonusService;

  public static getInstance(): FPLBonusService {
    if (!FPLBonusService.instance) {
      FPLBonusService.instance = new FPLBonusService();
    }
    return FPLBonusService.instance;
  }

  /**
   * Predicts bonus across all fixtures of a gameweek.
   * Returns Map<elementId, totalBonusForGW> (sums across DGW fixtures).
   */
  public predictBonusForGameweek(fixtures: FPLFixture[]): Map<number, number> {
    const totalByElement = new Map<number, number>();
    for (const fixture of fixtures) {
      const predictions = this.predictBonusForFixture(fixture);
      for (const p of predictions) {
        const current = totalByElement.get(p.element) || 0;
        totalByElement.set(p.element, current + p.predicted_bonus);
      }
    }
    return totalByElement;
  }

  /**
   * Predicts bonus for a single fixture.
   *  - finished fixture: uses fixture.stats[bonus] directly (FPL's official)
   *  - in-progress fixture: applies tie-break rules to fixture.stats[bps]
   *  - not started: returns empty
   */
  public predictBonusForFixture(fixture: FPLFixture): FPLBonusPrediction[] {
    if (fixture.finished) {
      return this.readOfficialBonus(fixture);
    }
    if (!fixture.started) {
      return [];
    }
    return this.predictFromBPS(fixture);
  }

  private readOfficialBonus(fixture: FPLFixture): FPLBonusPrediction[] {
    const bonusStat = fixture.stats.find((s) => s.identifier === "bonus");
    if (!bonusStat) return [];
    const results: FPLBonusPrediction[] = [];
    for (const item of [...bonusStat.a, ...bonusStat.h]) {
      results.push({
        fixture_id: fixture.id,
        element: item.element,
        bps: 0,
        predicted_bonus: this.clampBonus(item.value),
      });
    }
    return results;
  }

  private predictFromBPS(fixture: FPLFixture): FPLBonusPrediction[] {
    const bpsStat = fixture.stats.find((s) => s.identifier === "bps");
    if (!bpsStat) return [];

    const all = [...bpsStat.a, ...bpsStat.h]
      .filter((p) => p.value > 0)
      .sort((a, b) => b.value - a.value);

    if (all.length === 0) return [];

    const groups: Array<{ bps: number; elements: number[] }> = [];
    for (const p of all) {
      const last = groups[groups.length - 1];
      if (last && last.bps === p.value) {
        last.elements.push(p.element);
      } else {
        groups.push({ bps: p.value, elements: [p.element] });
      }
    }

    const result: FPLBonusPrediction[] = [];
    const emit = (element: number, bonus: 0 | 1 | 2 | 3, bps: number) => {
      result.push({
        fixture_id: fixture.id,
        element,
        bps,
        predicted_bonus: bonus,
      });
    };

    const g1 = groups[0];
    const g2 = groups[1];
    const g3 = groups[2];

    if (!g1) return [];

    if (g1.elements.length === 1) {
      emit(g1.elements[0], 3, g1.bps);
      if (g2) {
        if (g2.elements.length === 1) {
          emit(g2.elements[0], 2, g2.bps);
          if (g3) {
            for (const e of g3.elements) emit(e, 1, g3.bps);
          }
        } else {
          for (const e of g2.elements) emit(e, 2, g2.bps);
        }
      }
    } else if (g1.elements.length === 2) {
      for (const e of g1.elements) emit(e, 3, g1.bps);
      if (g2) {
        for (const e of g2.elements) emit(e, 1, g2.bps);
      }
    } else {
      for (const e of g1.elements) emit(e, 3, g1.bps);
    }

    return result;
  }

  private clampBonus(value: number): 0 | 1 | 2 | 3 {
    if (value >= 3) return 3;
    if (value === 2) return 2;
    if (value === 1) return 1;
    return 0;
  }
}
