import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin, jsonError } from "@/lib/predictor";

// GET ?q=<search>&page=<n>&page_size=<n>
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(10, Number(searchParams.get("page_size") || "25")));
  const offset = (page - 1) * pageSize;

  // Try with the new column first; if it doesn't exist yet (migration not run),
  // fall back to the base columns and default credits to 0 across the board.
  const fullCols =
    "id, email, name, avatar_url, provider, email_verified, last_login, created_at, tournament_create_credits";
  const baseCols =
    "id, email, name, avatar_url, provider, email_verified, last_login, created_at";

  const buildQuery = (cols: string) => {
    let q2 = supabaseServer
      .from("users")
      .select(cols, { count: "exact" })
      .order("created_at", { ascending: false });
    if (q) {
      const like = `%${q.replace(/[%_]/g, "")}%`;
      q2 = q2.or(`email.ilike.${like},name.ilike.${like}`);
    }
    return q2.range(offset, offset + pageSize - 1);
  };

  let result = await buildQuery(fullCols);
  let migrationApplied = true;
  if (result.error) {
    // Likely "column does not exist" — degrade gracefully and signal it to the UI.
    if (
      /tournament_create_credits|column .* does not exist/i.test(
        result.error.message || "",
      )
    ) {
      migrationApplied = false;
      result = await buildQuery(baseCols);
    }
    if (result.error) return jsonError(result.error.message, 500);
  }

  const { data, count } = result;

  // Also fetch how many tournaments each user owns (best-effort; ignore if table not migrated yet)
  const userIds = (data || []).map((u: any) => u.id);
  const tournamentCounts: Record<string, number> = {};
  if (userIds.length > 0) {
    const { data: counts, error: tErr } = await supabaseServer
      .from("predictor_tournaments")
      .select("owner_user_id")
      .in("owner_user_id", userIds)
      .is("deleted_at", null);
    if (!tErr && counts) {
      for (const row of counts as any[]) {
        if (row.owner_user_id) {
          tournamentCounts[row.owner_user_id] =
            (tournamentCounts[row.owner_user_id] || 0) + 1;
        }
      }
    }
  }

  const enriched = (data || []).map((u: any) => ({
    ...u,
    tournament_create_credits: u.tournament_create_credits ?? 0,
    tournaments_owned: tournamentCounts[u.id] || 0,
  }));

  return NextResponse.json({
    users: enriched,
    page,
    page_size: pageSize,
    total: count ?? 0,
    migration_applied: migrationApplied,
  });
}

// PATCH { user_id, grant_credits, reason }
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const { user_id, grant_credits, reason } = body || {};

  if (!user_id) return jsonError("user_id is required");
  const amount = Number(grant_credits);
  if (!Number.isFinite(amount) || amount === 0) {
    return jsonError("grant_credits must be a non-zero number");
  }
  if (Math.abs(amount) > 1000) {
    return jsonError("grant_credits out of range");
  }

  // Read current and update atomically with optimistic concurrency
  const { data: user, error: readErr } = await supabaseServer
    .from("users")
    .select("tournament_create_credits")
    .eq("id", user_id)
    .maybeSingle();
  if (readErr) return jsonError(readErr.message, 500);
  if (!user) return jsonError("User not found", 404);

  const current = user.tournament_create_credits || 0;
  const next = Math.max(0, current + amount);

  const { error: updErr } = await supabaseServer
    .from("users")
    .update({ tournament_create_credits: next })
    .eq("id", user_id)
    .eq("tournament_create_credits", current); // CAS
  if (updErr) return jsonError(updErr.message, 500);

  await supabaseServer.from("tournament_credit_grants").insert({
    user_id,
    granted_by_admin_id: (guard.session.user as any).id,
    amount,
    reason: reason || null,
  });

  return NextResponse.json({ ok: true, tournament_create_credits: next });
}
