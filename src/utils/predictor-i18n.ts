/**
 * Predictor i18n field resolvers.
 *
 * The predictor module stores user-facing copy in two columns per field:
 * the bare column (BS — default) and a `_en` companion. These helpers pick
 * the right value based on the active i18n language and fall back to the
 * BS copy whenever the EN copy is missing.
 */

import type {
  Match,
  PredictionCategory,
  PredictionOption,
  Tournament,
  TournamentReward,
  TournamentRule,
} from "@/types/predictor";

export type PredictorLang = "bs" | "en";

export function normalizeLang(lang: string | undefined | null): PredictorLang {
  return lang?.toLowerCase().startsWith("en") ? "en" : "bs";
}

/** Returns `en` when language is English AND the EN value is present, else falls back. */
export function pickLocalized(
  lang: PredictorLang,
  bs: string | null | undefined,
  en: string | null | undefined,
): string {
  if (lang === "en") {
    const trimmed = en?.trim();
    if (trimmed) return en as string;
  }
  return (bs ?? "") as string;
}

export function pickLocalizedNullable(
  lang: PredictorLang,
  bs: string | null | undefined,
  en: string | null | undefined,
): string | null {
  if (lang === "en") {
    const trimmed = en?.trim();
    if (trimmed) return en as string;
  }
  return (bs ?? null) as string | null;
}

export function localizedTournamentName(t: Tournament, lang: PredictorLang): string {
  return pickLocalized(lang, t.name, t.name_en);
}

export function localizedTournamentShort(t: Tournament, lang: PredictorLang): string | null {
  return pickLocalizedNullable(lang, t.short_description, t.short_description_en);
}

export function localizedTournamentLong(t: Tournament, lang: PredictorLang): string | null {
  return pickLocalizedNullable(lang, t.long_description, t.long_description_en);
}

export function localizedCategoryName(c: PredictionCategory, lang: PredictorLang): string {
  return pickLocalized(lang, c.name, c.name_en);
}

export function localizedCategoryDescription(
  c: PredictionCategory,
  lang: PredictorLang,
): string | null {
  return pickLocalizedNullable(lang, c.description, c.description_en);
}

export function localizedOptionLabel(o: PredictionOption, lang: PredictorLang): string {
  return pickLocalized(lang, o.label, o.label_en);
}

export function localizedOptionGroup(
  o: PredictionOption,
  lang: PredictorLang,
): string | null {
  return pickLocalizedNullable(lang, o.group_label, o.group_label_en);
}

export function localizedRuleTitle(r: TournamentRule, lang: PredictorLang): string {
  return pickLocalized(lang, r.title, r.title_en);
}

export function localizedRuleBody(r: TournamentRule, lang: PredictorLang): string | null {
  return pickLocalizedNullable(lang, r.body_md, r.body_md_en);
}

export function localizedRewardTitle(r: TournamentReward, lang: PredictorLang): string {
  return pickLocalized(lang, r.title, r.title_en);
}

export function localizedRewardDescription(
  r: TournamentReward,
  lang: PredictorLang,
): string | null {
  return pickLocalizedNullable(lang, r.description, r.description_en);
}

export function localizedMatchStageLabel(m: Match, lang: PredictorLang): string | null {
  return pickLocalizedNullable(lang, m.stage_label, m.stage_label_en);
}

export function localizedMatchLabel(m: Match, lang: PredictorLang): string | null {
  return pickLocalizedNullable(lang, m.match_label, m.match_label_en);
}

export function localizedMatchVenue(m: Match, lang: PredictorLang): string | null {
  return pickLocalizedNullable(lang, m.venue, m.venue_en);
}

/**
 * Matchday → round label, used when a tournament locks predictions
 * per round (`prediction_lock_mode === "per_round"`). Shared by the public
 * Matches tab and the standings player modal so the "kolo" labels stay in sync.
 */
export const MATCHDAY_LABELS: Record<number, { bs: string; en: string }> = {
  1: { bs: "1. kolo", en: "Matchday 1" },
  2: { bs: "2. kolo", en: "Matchday 2" },
  3: { bs: "3. kolo", en: "Matchday 3" },
  4: { bs: "Sesnaestina finala", en: "Round of 32" },
  5: { bs: "Osmina finala", en: "Round of 16" },
  6: { bs: "Cetvrtfinale", en: "Quarter-finals" },
  7: { bs: "Polufinale", en: "Semi-finals" },
  8: { bs: "Za 3. mjesto", en: "Third place" },
  9: { bs: "Finale", en: "Final" },
};

export function matchdayLabel(
  matchday: number | null | undefined,
  lang: PredictorLang,
): string {
  if (matchday == null) return lang === "en" ? "Other" : "Ostalo";
  const entry = MATCHDAY_LABELS[matchday];
  if (entry) return lang === "en" ? entry.en : entry.bs;
  return lang === "en" ? `Matchday ${matchday}` : `${matchday}. kolo`;
}

export function localizedMatchHomeTeam(m: Match, lang: PredictorLang): string {
  return pickLocalized(lang, m.home_team, m.home_team_en);
}

export function localizedMatchAwayTeam(m: Match, lang: PredictorLang): string {
  return pickLocalized(lang, m.away_team, m.away_team_en);
}
