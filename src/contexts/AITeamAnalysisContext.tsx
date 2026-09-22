"use client";

// Drži AI analizu tima IZVAN modala: zahtjev nastavlja da radi kad korisnik zatvori modal
// ili promijeni stranicu, rezultat se čuva (server + localStorage), a toast u donjem desnom
// uglu javlja kad je gotovo.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import type { FplTeamAnalysisReport, AnalysisMeta } from "@/lib/ai/fpl-analysis-prompt";
import type { SquadPlayer } from "@/lib/ai/pitch-layout";

export type AIAnalysisStatus = "idle" | "running" | "ready" | "error";

export interface AIAnalysisError {
  code: string;
  nextAvailableAt?: string;
}

interface State {
  status: AIAnalysisStatus;
  report: FplTeamAnalysisReport | null;
  meta: AnalysisMeta | null;
  error: AIAnalysisError | null;
  startedAt: number | null;
  finishedAt: number | null;
  /** Korisnik je vidio rezultat (modal otvoren nakon završetka) → toast se ne prikazuje. */
  resultSeen: boolean;
  /** Serverski status sedmičnog limita. */
  locked: boolean;
  nextAvailableAt: string | null;
  hasManagerId: boolean | null;
  hydrated: boolean;
  /** Prvih 11 iz plannera — loader i toast crtaju stvarnu postavu. */
  squad: SquadPlayer[] | null;
}

interface Api extends State {
  start: (opts: { language: "bs" | "en"; squad?: SquadPlayer[]; mock?: boolean; mockDelayMs?: number }) => Promise<void>;
  /** Modal javlja da li je otvoren — dok je otvoren toast se ne prikazuje. */
  setModalOpen: (open: boolean) => void;
  modalOpen: boolean;
  /** Toast traži da se modal otvori (FantasyPlanner to konzumira). */
  openRequested: boolean;
  requestOpen: () => void;
  consumeOpenRequest: () => void;
  dismissToast: () => void;
  toastDismissed: boolean;
  clearError: () => void;
  refresh: () => Promise<void>;
  elapsedMs: number;
}

const STORAGE_KEY = (userId: string) => `remis:ai-team-analysis:v1:${userId}`;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const initial: State = {
  status: "idle",
  report: null,
  meta: null,
  error: null,
  startedAt: null,
  finishedAt: null,
  resultSeen: false,
  locked: false,
  nextAvailableAt: null,
  hasManagerId: null,
  hydrated: false,
  squad: null,
};

const Ctx = createContext<Api | null>(null);

function readLocal(userId: string): { report: FplTeamAnalysisReport; meta: AnalysisMeta } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.report || !parsed?.meta?.generatedAt) return null;
    if (Date.now() - new Date(parsed.meta.generatedAt).getTime() > WEEK_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocal(userId: string, payload: { report: FplTeamAnalysisReport; meta: AnalysisMeta }) {
  try {
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(payload));
  } catch {
    /* privatni mod / puna memorija — nije kritično */
  }
}

export function AITeamAnalysisProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const [state, setState] = useState<State>(initial);
  const [modalOpen, setModalOpenState] = useState(false);
  const [openRequested, setOpenRequested] = useState(false);
  const [toastDismissed, setToastDismissed] = useState(false);
  const [now, setNow] = useState(0);
  const inFlight = useRef<AbortController | null>(null);
  const hydratedFor = useRef<string | null>(null);

  // --- hydrate: server (ako tabela postoji) → localStorage ---
  const refresh = useCallback(async () => {
    if (!userId) return;
    let serverReport: { report: FplTeamAnalysisReport; meta: AnalysisMeta } | null = null;
    let locked = false;
    let nextAvailableAt: string | null = null;
    let hasManagerId: boolean | null = null;
    try {
      const res = await fetch("/api/fpl/ai-team-analysis", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        locked = !!data.locked;
        nextAvailableAt = data.nextAvailableAt ?? null;
        hasManagerId = data.hasManagerId ?? null;
        if (data.report && data.meta) serverReport = { report: data.report, meta: data.meta };
      }
    } catch {
      /* offline — fallback na localStorage */
    }
    const local = serverReport ?? readLocal(userId);
    setState((s) => {
      if (s.status === "running") return { ...s, locked, nextAvailableAt, hasManagerId, hydrated: true };
      return {
        ...s,
        locked,
        nextAvailableAt,
        hasManagerId,
        hydrated: true,
        ...(local && s.status !== "ready"
          ? { status: "ready" as const, report: local.report, meta: local.meta, resultSeen: true, error: null }
          : {}),
      };
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      hydratedFor.current = null;
      return;
    }
    if (hydratedFor.current === userId) return;
    hydratedFor.current = userId;
    refresh();
  }, [userId, refresh]);

  // Bez korisnika nema ni stanja — izvedeno, bez reset-a u efektu.
  const effective = userId ? state : initial;

  // --- elapsed tick dok traje (samo interval mijenja stanje) ---
  useEffect(() => {
    if (state.status !== "running" || !state.startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [state.status, state.startedAt]);
  const elapsedMs =
    effective.status === "running" && effective.startedAt ? Math.max(0, now - effective.startedAt) : 0;

  const start = useCallback<Api["start"]>(
    async ({ language, squad, mock, mockDelayMs }) => {
      if (!userId || state.status === "running") return;
      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;
      setToastDismissed(false);
      setState((s) => ({
        ...s,
        status: "running",
        error: null,
        startedAt: Date.now(),
        finishedAt: null,
        resultSeen: false,
        squad: squad ?? s.squad,
      }));

      try {
        const res = await fetch("/api/fpl/ai-team-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language, ...(mock ? { mock: true, mockDelayMs } : {}) }),
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        setToastDismissed(false);
        if (!res.ok) {
          const code = String(data?.code ?? "server_error");
          setState((s) => ({
            ...s,
            status: "error",
            error: { code, nextAvailableAt: data?.nextAvailableAt },
            finishedAt: Date.now(),
            ...(code === "weekly_limit" ? { locked: true, nextAvailableAt: data?.nextAvailableAt ?? s.nextAvailableAt } : {}),
          }));
          return;
        }
        const payload = { report: data.report as FplTeamAnalysisReport, meta: data.meta as AnalysisMeta };
        if (!payload.meta?.mock) writeLocal(userId, payload);
        setState((s) => ({
          ...s,
          status: "ready",
          report: payload.report,
          meta: payload.meta,
          error: null,
          finishedAt: Date.now(),
          locked: !payload.meta?.mock,
          nextAvailableAt: payload.meta?.mock
            ? s.nextAvailableAt
            : new Date(new Date(payload.meta.generatedAt).getTime() + WEEK_MS).toISOString(),
        }));
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setToastDismissed(false);
        setState((s) => ({ ...s, status: "error", error: { code: "network" }, finishedAt: Date.now() }));
      } finally {
        if (inFlight.current === controller) inFlight.current = null;
      }
    },
    [userId, state.status]
  );

  const setModalOpen = useCallback((open: boolean) => {
    setModalOpenState(open);
    if (open) {
      setToastDismissed(false);
      setState((s) => (s.status === "ready" || s.status === "error" ? { ...s, resultSeen: true } : s));
    }
  }, []);

  const value = useMemo<Api>(
    () => ({
      ...effective,
      start,
      modalOpen,
      setModalOpen,
      openRequested,
      requestOpen: () => setOpenRequested(true),
      consumeOpenRequest: () => setOpenRequested(false),
      dismissToast: () => setToastDismissed(true),
      toastDismissed,
      clearError: () => setState((s) => ({ ...s, status: s.report ? "ready" : "idle", error: null })),
      refresh,
      elapsedMs,
    }),
    [effective, start, modalOpen, setModalOpen, openRequested, toastDismissed, refresh, elapsedMs]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAITeamAnalysis() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAITeamAnalysis must be used within AITeamAnalysisProvider");
  return ctx;
}

/** Ne baca grešku van providera — za komponente koje samo žele znati da li je toast vidljiv. */
export function useAIToastVisible(): boolean {
  const ctx = useContext(Ctx);
  if (!ctx) return false;
  return (
    !ctx.modalOpen &&
    !ctx.toastDismissed &&
    (ctx.status === "running" || ((ctx.status === "ready" || ctx.status === "error") && !ctx.resultSeen))
  );
}
