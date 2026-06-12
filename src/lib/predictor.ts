import "server-only";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";
import type {
  PredictionCategory,
  PredictionOption,
  UserPrediction,
  Match,
  MatchPrediction,
} from "@/types/predictor";

// --- auth guards ---------------------------------------------------------

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true as const, session };
}

export async function requireUser() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true as const, session, user };
}

// Vraća OK ako je trenutni user vlasnik datog turnira (provjera u predictor_tournaments).
// Site admini imaju bypass — mogu upravljati svim turnirima preko owner ruta.
export async function requireTournamentOwner(tournamentId: string) {
  const u = await requireUser();
  if (!u.ok) return u;
  if (!tournamentId) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "tournament_id required" }, { status: 400 }),
    };
  }
  const { data, error } = await supabaseServer
    .from("predictor_tournaments")
    .select("owner_user_id")
    .eq("id", tournamentId)
    .maybeSingle();
  if (error) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: error.message }, { status: 500 }),
    };
  }
  const isAdmin = !!(u.user as any).isAdmin;
  if (!data || (data.owner_user_id !== u.user.id && !isAdmin)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true as const, user: u.user };
}

// Provjeri da li je korisnik odobren za turnir (samo ako require_approval=true)
// Vraća { allowed: boolean, reason?: string }
export async function checkMembership(
  tournamentId: string,
  userId: string,
  requireApproval: boolean,
): Promise<{ allowed: boolean; reason?: string }> {
  if (!requireApproval) return { allowed: true };
  const { data: member } = await supabaseServer
    .from("predictor_members")
    .select("status")
    .eq("tournament_id", tournamentId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!member) return { allowed: false, reason: "not_member" };
  if (member.status === "approved") return { allowed: true };
  return { allowed: false, reason: member.status };
}

// --- helpers --------------------------------------------------------------

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isLocked(
  tournamentRegistrationLockAt: string | null,
  categoryLockAt: string | null,
  tournamentStatus: string,
  predictionsLocked = false,
  predictionsForceUnlocked = false,
): boolean {
  // Manual master lock for category predictions — set by the tournament owner,
  // independent of `status` and of match locking.
  if (predictionsLocked) return true;
  // A finished tournament reveals the correct answers (is_correct on options),
  // so it must stay read-only even if a force-unlock was left set earlier —
  // otherwise players could copy the revealed answers and get rescored.
  if (tournamentStatus === "finished") return true;
  // Owner's explicit unlock overrides the time locks and the legacy "locked"
  // status, so a player who forgot a pick can still enter it mid-event.
  if (predictionsForceUnlocked) return false;
  if (tournamentStatus === "locked") {
    return true;
  }
  const now = Date.now();
  const tLock = tournamentRegistrationLockAt
    ? Date.parse(tournamentRegistrationLockAt)
    : null;
  const cLock = categoryLockAt ? Date.parse(categoryLockAt) : null;
  if (cLock && now >= cLock) return true;
  if (tLock && now >= tLock) return true;
  return false;
}

// --- scoring -------------------------------------------------------------
// Computes points for ONE prediction given the category + correct options.
// Pure function, no DB access.

export function computePoints(
  category: PredictionCategory,
  options: PredictionOption[],
  prediction: Pick<
    UserPrediction,
    | "selected_option_ids"
    | "text_value"
    | "numeric_value"
    | "score_home"
    | "score_away"
  >,
): number {
  const correctOptions = options.filter((o) => o.is_correct);
  const correctIds = new Set(correctOptions.map((o) => o.id));
  const selected = Array.isArray(prediction.selected_option_ids)
    ? prediction.selected_option_ids
    : [];

  switch (category.category_type) {
    case "single_choice":
    case "team_selection":
    case "player_selection": {
      const pick = selected[0];
      return pick && correctIds.has(pick) ? category.points_correct : 0;
    }

    case "multiple_choice": {
      // award points_partial per correct pick (capped at correct count),
      // award full points_correct if user picked exactly the correct set
      const hits = selected.filter((id) => correctIds.has(id)).length;
      if (
        hits === correctIds.size &&
        selected.length === correctIds.size
      ) {
        return category.points_correct;
      }
      return hits * (category.points_partial || 0);
    }

    case "ranked_top_n": {
      // points_partial per correct pick (any rank)
      // points_ranked_bonus per pick at the exact correct rank
      // points_correct if the whole ordered list matches
      const rankByOption = new Map<string, number>();
      for (const o of options) {
        if (o.is_correct && o.correct_rank != null) {
          rankByOption.set(o.id, o.correct_rank);
        }
      }
      let total = 0;
      let exactRanks = 0;
      let presence = 0;
      selected.forEach((id, idx) => {
        if (rankByOption.has(id)) {
          presence += 1;
          if (rankByOption.get(id) === idx + 1) exactRanks += 1;
        }
      });
      total += presence * (category.points_partial || 0);
      total += exactRanks * (category.points_ranked_bonus || 0);
      const expectedCount = rankByOption.size || category.max_selections;
      if (exactRanks === expectedCount && selected.length === expectedCount) {
        // perfect — full points (do not double count)
        total = Math.max(total, category.points_correct);
      }
      return total;
    }

    case "exact_score": {
      // metadata on category options is not used; correct answer stored
      // either in category metadata via two "correct" options carrying
      // {home,away} OR via per-option home/away metadata. We treat the
      // is_correct option's metadata.home / metadata.away as the answer.
      const target = correctOptions[0]?.metadata as
        | { home?: number; away?: number }
        | undefined;
      if (
        target?.home != null &&
        target?.away != null &&
        prediction.score_home === target.home &&
        prediction.score_away === target.away
      ) {
        return category.points_correct;
      }
      // partial: correct winner direction
      if (target?.home != null && target?.away != null) {
        const tDir = Math.sign(target.home - target.away);
        const pDir = Math.sign(
          (prediction.score_home ?? 0) - (prediction.score_away ?? 0),
        );
        if (tDir === pDir) return category.points_partial || 0;
      }
      return 0;
    }

    case "numeric": {
      const target = (correctOptions[0]?.metadata as { value?: number })?.value;
      if (target == null || prediction.numeric_value == null) return 0;
      if (Number(prediction.numeric_value) === Number(target)) {
        return category.points_correct;
      }
      // optional within-1 partial credit
      const diff = Math.abs(Number(prediction.numeric_value) - Number(target));
      if (diff === 1) return category.points_partial || 0;
      return 0;
    }

    case "free_text": {
      const target = (correctOptions[0]?.metadata as { value?: string })?.value;
      if (!target || !prediction.text_value) return 0;
      const a = String(prediction.text_value).trim().toLowerCase();
      const b = String(target).trim().toLowerCase();
      return a === b ? category.points_correct : 0;
    }

    default:
      return 0;
  }
}

// ------------------------------------------------------------------
// Match-by-match scoring (UEFA UCL Predictor style)
// ------------------------------------------------------------------

export function isMatchLocked(
  match: Pick<Match, "kickoff_at" | "status" | "force_unlocked">,
  opts?: {
    lockMode?: "per_match" | "per_round";
    allMatches?: Pick<Match, "kickoff_at" | "matchday">[];
    matchday?: number | null;
  },
): boolean {
  if (match.force_unlocked) return false;
  if (match.status !== "scheduled") return true;
  if (!match.kickoff_at) return false;

  const now = Date.now();

  if (
    opts?.lockMode === "per_round" &&
    opts.matchday != null &&
    opts.allMatches
  ) {
    const roundMatches = opts.allMatches.filter(
      (m) => m.matchday === opts.matchday && m.kickoff_at,
    );
    if (roundMatches.length > 0) {
      const earliestKickoff = Math.min(
        ...roundMatches.map((m) => Date.parse(m.kickoff_at!)),
      );
      return now >= earliestKickoff;
    }
  }

  return now >= Date.parse(match.kickoff_at);
}

export function computeMatchPoints(
  match: Pick<
    Match,
    "home_score" | "away_score" | "points_exact" | "points_diff" | "points_winner"
  >,
  prediction: Pick<MatchPrediction, "home_score" | "away_score">,
): number {
  if (match.home_score == null || match.away_score == null) return 0;

  // tačan rezultat (implies tačna razlika i pobjednik — nikad manje od nižih nivoa)
  if (
    prediction.home_score === match.home_score &&
    prediction.away_score === match.away_score
  ) {
    return Math.max(match.points_exact, match.points_diff, match.points_winner);
  }

  const actualDiff = match.home_score - match.away_score;
  const predDiff = prediction.home_score - prediction.away_score;

  // tačna razlika (npr. 2-1 pred, 3-2 actual) — implies tačan pobjednik
  if (actualDiff === predDiff) {
    return Math.max(match.points_diff, match.points_winner);
  }

  // samo tačan pobjednik (smjer)
  if (Math.sign(actualDiff) === Math.sign(predDiff)) {
    return match.points_winner;
  }

  return 0;
}

// Score every prediction for a single match (after admin enters result).
export async function rescoreMatch(matchId: string): Promise<{ updated: number }> {
  const { data: match } = await supabaseServer
    .from("predictor_matches")
    .select("*")
    .eq("id", matchId)
    .single();
  if (!match) return { updated: 0 };

  const { data: predictions } = await supabaseServer
    .from("predictor_match_predictions")
    .select("*")
    .eq("match_id", matchId);

  if (!predictions) return { updated: 0 };

  let updated = 0;
  for (const pred of predictions as MatchPrediction[]) {
    const points = computeMatchPoints(match as Match, pred);
    const { error } = await supabaseServer
      .from("predictor_match_predictions")
      .update({ points_awarded: points, is_scored: true })
      .eq("id", pred.id);
    if (!error) updated += 1;
  }
  return { updated };
}

// Rescore every prediction in a tournament. Returns count of rows updated.
export async function rescoreTournament(tournamentId: string): Promise<{
  updated: number;
}> {
  const [{ data: categories }, { data: options }, { data: predictions }] =
    await Promise.all([
      supabaseServer
        .from("predictor_categories")
        .select("*")
        .eq("tournament_id", tournamentId),
      supabaseServer
        .from("predictor_options")
        .select(
          "id, category_id, label, value, image_url, group_label, metadata, sort_order, is_correct, correct_rank, created_at",
        ),
      supabaseServer
        .from("predictor_predictions")
        .select("*")
        .eq("tournament_id", tournamentId),
    ]);

  if (!categories || !options || !predictions) return { updated: 0 };

  const optionsByCategory = new Map<string, PredictionOption[]>();
  for (const o of options as PredictionOption[]) {
    const arr = optionsByCategory.get(o.category_id) ?? [];
    arr.push(o);
    optionsByCategory.set(o.category_id, arr);
  }

  let updated = 0;
  for (const pred of predictions as UserPrediction[]) {
    const category = (categories as PredictionCategory[]).find(
      (c) => c.id === pred.category_id,
    );
    if (!category) continue;
    const catOptions = optionsByCategory.get(pred.category_id) ?? [];
    const points = computePoints(category, catOptions, pred);
    const { error } = await supabaseServer
      .from("predictor_predictions")
      .update({ points_awarded: points, is_scored: true })
      .eq("id", pred.id);
    if (!error) updated += 1;
  }
  return { updated };
}
