import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";
import {
  getBootstrapStatic,
  getFixtures,
  getUserTeam,
  getUserPicks,
  getTeamHistory,
} from "@/lib/fplTools";
import { buildTeamAnalysisContext } from "@/lib/ai/fpl-context";
import {
  buildTeamAnalysisSystemPrompt,
  extractSquadRules,
  TEAM_ANALYSIS_JSON_SCHEMA,
  type FplTeamAnalysisReport,
} from "@/lib/ai/fpl-analysis-prompt";

export const runtime = "nodejs";
export const maxDuration = 120;

const PRIMARY_MODEL = process.env.FPL_AI_MODEL || "gpt-5.4-mini";
const FALLBACK_MODEL = process.env.FPL_AI_FALLBACK_MODEL || "gpt-4.1-mini";
const WEEKLY_LIMIT_MS = 7 * 24 * 60 * 60 * 1000;

type ErrorCode =
  | "unauthenticated"
  | "no_manager_id"
  | "weekly_limit"
  | "fpl_unavailable"
  | "ai_no_credit"
  | "ai_invalid_key"
  | "ai_rate_limited"
  | "ai_unavailable"
  | "server_error";

function fail(code: ErrorCode, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ code, ...extra }, { status });
}

/** GPT-5 / o-serija koriste max_completion_tokens i ne primaju custom temperature. */
function completionParams(model: string, maxTokens: number) {
  const isReasoning = /^(gpt-5|o[1-9])/.test(model);
  return isReasoning
    ? { max_completion_tokens: maxTokens, reasoning_effort: "medium" as const }
    : { max_tokens: maxTokens, temperature: 0.4 };
}

function classifyOpenAIError(err: any): ErrorCode {
  const code = err?.code || err?.error?.code || "";
  const type = err?.type || err?.error?.type || "";
  const status = err?.status;
  const message = String(err?.message || err?.error?.message || "");

  if (code === "credit_balance_exhausted" || type === "insufficient_quota")
    return "ai_no_credit";
  if (/no credits remaining|insufficient_quota|exceeded your current quota/i.test(message))
    return "ai_no_credit";
  if (status === 401 || code === "invalid_api_key") return "ai_invalid_key";
  if (status === 429) return "ai_rate_limited";
  return "ai_unavailable";
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return fail("unauthenticated", 401);
    }

    if (!process.env.OPENAI_API_KEY) {
      return fail("ai_invalid_key", 503);
    }

    const body = await req.json().catch(() => ({}));
    const language: "bs" | "en" = body?.language === "en" ? "en" : "bs";
    const force = body?.force === true && process.env.NODE_ENV !== "production";

    // --- korisnik + sedmični limit ---
    const { data: userRow, error: userError } = await supabaseServer
      .from("users")
      .select("manager_id, ai_team_analyzing")
      .eq("id", session.user.id)
      .single();

    if (userError) {
      console.error("[ai-team-analysis] user lookup failed:", userError);
      return fail("server_error", 500);
    }
    if (!userRow?.manager_id) {
      return fail("no_manager_id", 400);
    }

    const lastRun = userRow.ai_team_analyzing
      ? new Date(userRow.ai_team_analyzing)
      : null;
    if (!force && lastRun && Date.now() - lastRun.getTime() < WEEKLY_LIMIT_MS) {
      return fail("weekly_limit", 429, {
        nextAvailableAt: new Date(lastRun.getTime() + WEEKLY_LIMIT_MS).toISOString(),
      });
    }

    // --- live FPL podaci ---
    let bootstrap: any;
    let fixtures: any[];
    try {
      const [b, f] = await Promise.all([getBootstrapStatic(), getFixtures()]);
      bootstrap = b;
      fixtures = f as any[];
      if (!bootstrap?.elements || !bootstrap?.teams || !Array.isArray(fixtures)) {
        throw new Error("incomplete bootstrap/fixtures");
      }
    } catch (error) {
      console.error("[ai-team-analysis] FPL fetch failed:", error);
      return fail("fpl_unavailable", 503);
    }

    const events: any[] = bootstrap.events ?? [];
    const currentGW = events.find((e) => e.is_current)?.id ?? null;
    const nextGW = events.find((e) => e.is_next)?.id ?? null;

    // picks: probaj tekuće kolo, pa unazad (kolo prije deadlinea nema picks)
    let picks: any = null;
    let picksGW: number | null = null;
    const startGW = currentGW ?? (nextGW ? nextGW - 1 : 1);
    for (let g = startGW; g >= Math.max(1, startGW - 4); g--) {
      try {
        picks = await getUserPicks(String(userRow.manager_id), g);
        picksGW = g;
        break;
      } catch {
        /* kolo nije dostupno, probaj prethodno */
      }
    }

    const [entry, history] = await Promise.all([
      getUserTeam(String(userRow.manager_id)).catch(() => null),
      getTeamHistory(String(userRow.manager_id)).catch(() => null),
    ]);

    const context = buildTeamAnalysisContext({
      bootstrap,
      fixtures,
      picks,
      entry,
      history,
      picksGW,
    });

    const rules = extractSquadRules(bootstrap);
    const systemPrompt = buildTeamAnalysisSystemPrompt({
      gw: context.gw,
      rules,
      language,
      hasSquad: context.hasSquad,
    });

    const userPrompt = `${context.dataPack}

ZADATAK: Uradi kompletan pregled ovog tima za GW${context.gw.targetGW} sezone ${context.gw.seasonLabel} i vrati JSON po shemi. Prođi svih 9 koraka metoda analize nad podacima iznad prije nego popuniš polja.`;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 100_000,
      maxRetries: 1,
    });

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userPrompt },
    ];

    let raw = "";
    let usedModel = PRIMARY_MODEL;
    let primaryError: any = null;

    for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
      try {
        const completion = await client.chat.completions.create({
          model,
          messages,
          response_format: TEAM_ANALYSIS_JSON_SCHEMA,
          ...completionParams(model, 6000),
        } as any);
        raw = completion.choices[0]?.message?.content ?? "";
        usedModel = model;
        if (raw.trim()) break;
      } catch (error: any) {
        primaryError = error;
        const code = classifyOpenAIError(error);
        // Nema smisla pokušavati fallback ako je problem sa nalogom/ključem.
        if (code === "ai_no_credit" || code === "ai_invalid_key") {
          console.error(`[ai-team-analysis] ${code}:`, error?.message);
          return fail(code, 503);
        }
        console.warn(`[ai-team-analysis] model ${model} failed:`, error?.message);
      }
    }

    if (!raw.trim()) {
      const code = primaryError ? classifyOpenAIError(primaryError) : "ai_unavailable";
      return fail(code, 503);
    }

    let report: FplTeamAnalysisReport;
    try {
      report = JSON.parse(raw);
    } catch {
      console.error("[ai-team-analysis] JSON parse failed:", raw.slice(0, 400));
      return fail("ai_unavailable", 503);
    }

    if (!force) {
      await supabaseServer
        .from("users")
        .update({ ai_team_analyzing: new Date().toISOString() })
        .eq("id", session.user.id);
    }

    return NextResponse.json({
      report,
      meta: {
        season: context.gw.seasonLabel,
        targetGW: context.gw.targetGW,
        currentGW: context.gw.currentGW,
        deadline: context.gw.deadline,
        picksGW,
        hasSquad: context.hasSquad,
        teamName: context.teamName,
        managerName: context.managerName,
        model: usedModel,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[ai-team-analysis] unhandled:", error);
    return fail("server_error", 500);
  }
}
