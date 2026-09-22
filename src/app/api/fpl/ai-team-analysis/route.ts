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
  type AnalysisMeta,
} from "@/lib/ai/fpl-analysis-prompt";
import { validateAndRepairReport } from "@/lib/ai/fpl-report-validate";
import { SAMPLE_TEAM_ANALYSIS_REPORT } from "@/lib/ai/sample-report";

export const runtime = "nodejs";
export const maxDuration = 120;

const PRIMARY_MODEL = process.env.FPL_AI_MODEL || "gpt-5.4-mini";
const FALLBACK_MODEL = process.env.FPL_AI_FALLBACK_MODEL || "gpt-4.1-mini";
const REASONING = (process.env.FPL_AI_REASONING || "low") as "minimal" | "low" | "medium" | "high";
const WEEKLY_LIMIT_MS = 7 * 24 * 60 * 60 * 1000;
const FPL_CACHE_TTL_MS = 3 * 60 * 1000;
const IS_PROD = process.env.NODE_ENV === "production";

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

// Fluid compute drži instancu živom između poziva — bootstrap/fixtures se ne skidaju svaki put.
const fplCache = new Map<string, { at: number; data: unknown }>();
async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = fplCache.get(key);
  if (hit && Date.now() - hit.at < FPL_CACHE_TTL_MS) return hit.data as T;
  const data = await fetcher();
  fplCache.set(key, { at: Date.now(), data });
  return data;
}

/** GPT-5 / o-serija koriste max_completion_tokens i ne primaju custom temperature. */
function completionParams(model: string, maxTokens: number) {
  const isReasoning = /^(gpt-5|o[1-9])/.test(model);
  return isReasoning
    ? { max_completion_tokens: maxTokens, reasoning_effort: REASONING }
    : { max_tokens: maxTokens, temperature: 0.3 };
}

function classifyOpenAIError(err: any): ErrorCode {
  const code = err?.code || err?.error?.code || "";
  const type = err?.type || err?.error?.type || "";
  const status = err?.status;
  const message = String(err?.message || err?.error?.message || "");
  if (code === "credit_balance_exhausted" || type === "insufficient_quota") return "ai_no_credit";
  if (/no credits remaining|insufficient_quota|exceeded your current quota/i.test(message)) return "ai_no_credit";
  if (status === 401 || code === "invalid_api_key") return "ai_invalid_key";
  if (status === 429) return "ai_rate_limited";
  return "ai_unavailable";
}

async function loadLatestStoredReport(userId: string) {
  try {
    const { data, error } = await supabaseServer
      .from("ai_team_analysis_reports")
      .select("report, meta, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return data as { report: FplTeamAnalysisReport; meta: AnalysisMeta; created_at: string };
  } catch {
    return null;
  }
}

/** GET → zadnji sačuvani izvještaj (ako tabela postoji) + status sedmičnog limita. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail("unauthenticated", 401);

  const { data: userRow } = await supabaseServer
    .from("users")
    .select("ai_team_analyzing, manager_id")
    .eq("id", session.user.id)
    .single();

  const lastRun = userRow?.ai_team_analyzing ? new Date(userRow.ai_team_analyzing) : null;
  const locked = !!lastRun && Date.now() - lastRun.getTime() < WEEKLY_LIMIT_MS;
  const stored = await loadLatestStoredReport(session.user.id);
  const storedFresh =
    stored && Date.now() - new Date(stored.created_at).getTime() < WEEKLY_LIMIT_MS ? stored : null;

  return NextResponse.json({
    hasManagerId: !!userRow?.manager_id,
    locked,
    lastRunAt: lastRun?.toISOString() ?? null,
    nextAvailableAt: locked && lastRun ? new Date(lastRun.getTime() + WEEKLY_LIMIT_MS).toISOString() : null,
    report: storedFresh?.report ?? null,
    meta: storedFresh?.meta ?? null,
  });
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return fail("unauthenticated", 401);

    const body = await req.json().catch(() => ({}));
    const language: "bs" | "en" = body?.language === "en" ? "en" : "bs";
    const force = body?.force === true && !IS_PROD;
    const mock = process.env.FPL_AI_MOCK === "1" || (body?.mock === true && !IS_PROD);

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
    if (!userRow?.manager_id && !mock) return fail("no_manager_id", 400);

    const lastRun = userRow?.ai_team_analyzing ? new Date(userRow.ai_team_analyzing) : null;
    if (!force && !mock && lastRun && Date.now() - lastRun.getTime() < WEEKLY_LIMIT_MS) {
      return fail("weekly_limit", 429, {
        nextAvailableAt: new Date(lastRun.getTime() + WEEKLY_LIMIT_MS).toISOString(),
      });
    }

    // --- mock: za vizuelno testiranje bez trošenja kredita ---
    if (mock) {
      const delay = Math.min(60_000, Math.max(0, Number(body?.mockDelayMs ?? 9000)));
      await new Promise((r) => setTimeout(r, delay));
      if (body?.mockError) return fail(String(body.mockError) as ErrorCode, 503);
      const meta: AnalysisMeta = {
        season: "2026/27",
        targetGW: 6,
        currentGW: 5,
        deadline: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
        picksGW: 5,
        hasSquad: true,
        teamName: "Mock FC",
        managerName: session.user.name ?? null,
        model: "mock",
        generatedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        repaired: [],
        mock: true,
      };
      return NextResponse.json({ report: SAMPLE_TEAM_ANALYSIS_REPORT, meta });
    }

    if (!process.env.OPENAI_API_KEY) return fail("ai_invalid_key", 503);

    // --- live FPL podaci (paralelno, keširano) ---
    const managerId = String(userRow.manager_id);
    let bootstrap: any;
    let fixtures: any[];
    let entry: any = null;
    let history: any = null;
    try {
      [bootstrap, fixtures, entry, history] = await Promise.all([
        cached("bootstrap", getBootstrapStatic),
        cached("fixtures", getFixtures) as Promise<any[]>,
        getUserTeam(managerId).catch(() => null),
        getTeamHistory(managerId).catch(() => null),
      ]);
      if (!bootstrap?.elements || !bootstrap?.teams || !Array.isArray(fixtures)) {
        throw new Error("incomplete bootstrap/fixtures");
      }
    } catch (error) {
      console.error("[ai-team-analysis] FPL fetch failed:", error);
      return fail("fpl_unavailable", 503);
    }

    const events: any[] = bootstrap.events ?? [];
    const currentGW: number | null = events.find((e) => e.is_current)?.id ?? null;
    const nextGW: number | null = events.find((e) => e.is_next)?.id ?? null;
    const startGW = currentGW ?? (nextGW ? nextGW - 1 : 1);

    // picks: probaj 3 zadnja kola paralelno, uzmi najnovije koje postoji
    const candidates = [startGW, startGW - 1, startGW - 2].filter((g) => g >= 1);
    const settled = await Promise.allSettled(
      candidates.map((g) => getUserPicks(managerId, g) as Promise<any>)
    );
    let picks: any = null;
    let picksGW: number | null = null;
    settled.forEach((r, i) => {
      if (picks == null && r.status === "fulfilled" && r.value?.picks?.length) {
        picks = r.value;
        picksGW = candidates[i];
      }
    });

    const context = buildTeamAnalysisContext({ bootstrap, fixtures, picks, entry, history, picksGW });
    const rules = extractSquadRules(bootstrap);
    const systemPrompt = buildTeamAnalysisSystemPrompt({
      gw: context.gw,
      rules,
      language,
      hasSquad: context.hasSquad,
    });
    const userPrompt = `${context.dataPack}

ZADATAK: Uradi kompletan pregled ovog tima za GW${context.gw.targetGW} sezone ${context.gw.seasonLabel} i vrati JSON po shemi. Prođi svih 9 koraka metoda analize nad podacima iznad prije nego popuniš polja. Urgent, captaincy, lineup i out: samo sekcija A. In i watchlist: samo sekcija C.`;

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 100_000, maxRetries: 1 });
    const baseMessages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userPrompt },
    ];

    const callModel = async (
      messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
    ): Promise<{ raw: string; model: string } | { error: ErrorCode }> => {
      let lastError: any = null;
      for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
        try {
          const completion = await client.chat.completions.create({
            model,
            messages,
            response_format: TEAM_ANALYSIS_JSON_SCHEMA,
            ...completionParams(model, 9000),
          } as any);
          const choice = completion.choices[0];
          const raw = choice?.message?.content ?? "";
          if (raw.trim()) return { raw, model };
          console.warn(`[ai-team-analysis] ${model} returned empty content (finish=${choice?.finish_reason})`);
        } catch (error: any) {
          lastError = error;
          const code = classifyOpenAIError(error);
          if (code === "ai_no_credit" || code === "ai_invalid_key") {
            console.error(`[ai-team-analysis] ${code}:`, error?.message);
            return { error: code };
          }
          console.warn(`[ai-team-analysis] model ${model} failed:`, error?.message);
        }
      }
      return { error: lastError ? classifyOpenAIError(lastError) : "ai_unavailable" };
    };

    const first = await callModel(baseMessages);
    if ("error" in first) return fail(first.error, 503);

    let parsed: FplTeamAnalysisReport;
    try {
      parsed = JSON.parse(first.raw);
    } catch {
      console.error("[ai-team-analysis] JSON parse failed:", first.raw.slice(0, 300));
      return fail("ai_unavailable", 503);
    }

    const squadIds = new Set(context.squadPlayerIds);
    const vctx = { bootstrap, squadIds, bank: context.bank, clubLimit: rules.clubLimit };
    let validation = validateAndRepairReport(parsed, vctx);
    let usedModel = first.model;

    // Jedan popravni krug ako je model prekršio pravila koja se ne mogu automatski ispraviti.
    if (validation.unrepairable.length > 0) {
      console.warn("[ai-team-analysis] repair round:", validation.unrepairable);
      const repairMessages = [
        ...baseMessages,
        { role: "assistant" as const, content: first.raw },
        {
          role: "user" as const,
          content: `VALIDACIJA PROTIV STVARNIH PODATAKA NIJE PROŠLA:\n- ${validation.unrepairable.join(
            "\n- "
          )}\n\nIspravi izvještaj: koristi samo igrače iz sekcije A za out/urgent/kapitena, samo igrače iz sekcije C za in/watchlist, poštuj budžet (banka + cijena odlaznog ≥ cijena dolaznog), klub limit ${rules.clubLimit} i istu poziciju. Ako validan transfer ne postoji, vrati recommendation "hold" sa praznim moves. Vrati kompletan JSON po istoj shemi.`,
        },
      ];
      const second = await callModel(repairMessages);
      if (!("error" in second)) {
        try {
          const reparsed = JSON.parse(second.raw) as FplTeamAnalysisReport;
          const v2 = validateAndRepairReport(reparsed, vctx);
          validation = {
            report: v2.report,
            repaired: [...validation.unrepairable.map((u) => `popravni krug: ${u}`), ...v2.repaired],
            unrepairable: v2.unrepairable,
          };
          usedModel = second.model;
        } catch {
          /* zadrži prvu (očišćenu) verziju */
        }
      }
      // Ako i dalje ima nevaljanih poteza, validator ih je već izbacio — izvještaj je konzistentan.
      if (validation.unrepairable.length > 0) {
        validation.repaired.push(...validation.unrepairable.map((u) => `izbačeno: ${u}`));
      }
    }

    const report = validation.report;
    const meta: AnalysisMeta = {
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
      durationMs: Date.now() - startedAt,
      repaired: validation.repaired,
    };

    if (!force) {
      await supabaseServer
        .from("users")
        .update({ ai_team_analyzing: meta.generatedAt })
        .eq("id", session.user.id);
    }

    // Best-effort trajno čuvanje (tabela je opciona — vidi db/sql/add-ai-team-analysis-reports.sql)
    supabaseServer
      .from("ai_team_analysis_reports")
      .insert({
        user_id: session.user.id,
        season: meta.season,
        target_gw: meta.targetGW,
        model: meta.model,
        report,
        meta,
      })
      .then(({ error }) => {
        if (error) console.warn("[ai-team-analysis] report not persisted:", error.message);
      });

    console.info(
      `[ai-team-analysis] ok model=${usedModel} ${meta.durationMs}ms repaired=${validation.repaired.length}`
    );
    return NextResponse.json({ report, meta });
  } catch (error: any) {
    console.error("[ai-team-analysis] unhandled:", error);
    return fail("server_error", 500);
  }
}
