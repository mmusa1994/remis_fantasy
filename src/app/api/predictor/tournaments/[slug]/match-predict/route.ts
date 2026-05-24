import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import {
  requireUser,
  jsonError,
  isMatchLocked,
  checkMembership,
} from "@/lib/predictor";
import type { SubmitMatchPredictionItem, Match } from "@/types/predictor";

// POST { items: [{ match_id, home_score, away_score }] }
// Upsert korisničkih predikcija po utakmici. Zaključane utakmice se preskaču.
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const { slug } = await context.params;
  const body = (await req.json()) as { items: SubmitMatchPredictionItem[] };
  if (!body?.items?.length) return jsonError("items su obavezni");

  const { data: tournament } = await supabaseServer
    .from("predictor_tournaments")
    .select("id, status, require_approval, prediction_lock_mode")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (!tournament) {
    return NextResponse.json(
      { error: "not_found", message: "Turnir nije pronađen." },
      { status: 404 },
    );
  }
  if (tournament.status === "draft") {
    return NextResponse.json(
      {
        error: "draft",
        message:
          "Turnir još nije objavljen. Admin ga mora objaviti prije nego što možeš sačuvati predikcije.",
      },
      { status: 409 },
    );
  }
  if (tournament.status === "locked" || tournament.status === "finished") {
    return NextResponse.json(
      {
        error: "locked",
        message:
          "Turnir je zaključan ili završen. predikcije se više ne mogu mijenjati.",
      },
      { status: 409 },
    );
  }

  // approval check
  const membership = await checkMembership(
    tournament.id,
    guard.user.id,
    !!tournament.require_approval,
  );
  if (!membership.allowed) {
    return NextResponse.json(
      {
        error: "not_approved",
        reason: membership.reason,
        message:
          membership.reason === "pending"
            ? "Tvoj zahtjev za učešće još čeka odobrenje admina."
            : membership.reason === "not_member"
              ? "Pridruži se ligi da bi mogao predviđati."
              : "Zahtjev odbijen ili nalog blokiran.",
      },
      { status: 403 },
    );
  }

  // dovuci sve utakmice pomenute u body-ju da provjerimo lock i tournament_id
  const matchIds = body.items.map((i) => i.match_id);
  const { data: matches } = await supabaseServer
    .from("predictor_matches")
    .select("*")
    .in("id", matchIds)
    .eq("tournament_id", tournament.id);

  if (!matches) return jsonError("greška pri učitavanju utakmica", 500);
  const typedMatches = matches as Match[];
  const matchMap = new Map<string, Match>(
    typedMatches.map((m) => [m.id, m]),
  );

  const lockMode = tournament.prediction_lock_mode || "per_match";

  const userId = guard.user.id;
  const userEmail = guard.user.email ?? null;
  const userName =
    guard.user.name ?? guard.user.email?.split("@")[0] ?? null;

  const rows: any[] = [];
  const skipped: Array<{ match_id: string; reason: string }> = [];

  for (const item of body.items) {
    const m = matchMap.get(item.match_id);
    if (!m) {
      skipped.push({ match_id: item.match_id, reason: "not_found" });
      continue;
    }
    if (
      isMatchLocked(m, {
        lockMode,
        allMatches: typedMatches,
        matchday: m.matchday,
      })
    ) {
      skipped.push({ match_id: item.match_id, reason: "locked" });
      continue;
    }
    if (
      item.home_score == null ||
      item.away_score == null ||
      Number(item.home_score) < 0 ||
      Number(item.away_score) < 0
    ) {
      skipped.push({ match_id: item.match_id, reason: "invalid_score" });
      continue;
    }
    rows.push({
      tournament_id: tournament.id,
      match_id: item.match_id,
      user_id: userId,
      user_email: userEmail,
      user_display_name: userName,
      home_score: Number(item.home_score),
      away_score: Number(item.away_score),
    });
  }

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, saved: 0, skipped });
  }

  const { data, error } = await supabaseServer
    .from("predictor_match_predictions")
    .upsert(rows, { onConflict: "user_id,match_id" })
    .select();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({
    ok: true,
    saved: data?.length ?? 0,
    skipped,
  });
}
