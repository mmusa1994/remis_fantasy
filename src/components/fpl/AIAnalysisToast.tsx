"use client";

// Obavještenje u donjem desnom uglu: analiza radi u pozadini / spremna je / pukla je.
// Klik otvara modal (i vodi na planner ako je korisnik na drugoj stranici).

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, Check, Sparkles, X } from "lucide-react";
import { useAITeamAnalysis, useAIToastVisible } from "@/contexts/AITeamAnalysisContext";
import AILoadingShow from "@/components/fpl/AILoadingShow";
import type { SquadPlayer } from "@/lib/ai/pitch-layout";

const PLANNER_PATH = "/premier-league/team-planner";

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export interface AIAnalysisToastViewProps {
  status: "running" | "ready" | "error";
  elapsedMs: number;
  visible: boolean;
  lang: string;
  squad?: SquadPlayer[] | null;
  startedAt?: number | null;
  onOpen: () => void;
  onDismiss: () => void;
}

/** Povezana verzija — čita stanje iz AITeamAnalysisProvider-a. */
export default function AIAnalysisToast() {
  const ai = useAITeamAnalysis();
  const { i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const visible = useAIToastVisible();

  if (ai.status === "idle") return null;

  return (
    <AIAnalysisToastView
      status={ai.status}
      elapsedMs={ai.elapsedMs}
      visible={visible}
      lang={i18n.language}
      squad={ai.squad}
      startedAt={ai.startedAt}
      onOpen={() => {
        ai.requestOpen();
        if (pathname !== PLANNER_PATH) router.push(PLANNER_PATH);
      }}
      onDismiss={ai.dismissToast}
    />
  );
}

/** Čisti prikaz — koristi ga i dev pregled. */
export function AIAnalysisToastView({ status, elapsedMs, visible, lang, squad, startedAt, onOpen, onDismiss }: AIAnalysisToastViewProps) {
  const bs = lang === "bs";
  const reduce = useReducedMotion();
  const ai = { status, elapsedMs };

  // Iskrena "pseudo" progresija: asimptotski prema 95% (klijent zna samo protekle sekunde)
  const progress = useMemo(() => {
    if (status !== "running") return 1;
    return Math.min(0.95, 1 - Math.exp(-elapsedMs / 22000));
  }, [status, elapsedMs]);

  const open = onOpen;

  const tone =
    ai.status === "ready"
      ? { ring: "from-emerald-400 via-teal-400 to-emerald-500", glow: "bg-emerald-400/40", border: "border-emerald-400/50" }
      : ai.status === "error"
      ? { ring: "from-rose-400 via-orange-400 to-rose-500", glow: "bg-rose-400/40", border: "border-rose-400/50" }
      : { ring: "from-violet-500 via-fuchsia-500 to-indigo-500", glow: "bg-fuchsia-500/40", border: "border-violet-400/40" };

  const title =
    ai.status === "running"
      ? bs ? "AI analizira tvoj tim" : "AI is analysing your team"
      : ai.status === "ready"
      ? bs ? "Analiza je spremna" : "Your analysis is ready"
      : bs ? "Analiza nije uspjela" : "Analysis failed";

  const subtitle =
    ai.status === "running"
      ? bs ? `Slobodno nastavi dalje · ${fmt(ai.elapsedMs)}` : `Feel free to keep browsing · ${fmt(ai.elapsedMs)}`
      : ai.status === "ready"
      ? bs ? "Klikni da otvoriš izvještaj" : "Click to open the report"
      : bs ? "Klikni za detalje i ponovni pokušaj" : "Click for details and retry";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="ai-analysis-toast"
          role="status"
          aria-live="polite"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 380, damping: 26, mass: 0.8 }}
          className="fixed z-[95] left-3 right-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:left-auto md:right-6 md:bottom-6 md:w-[340px]"
        >
          <button
            type="button"
            onClick={open}
            className={`group relative w-full text-left rounded-2xl border ${tone.border} bg-slate-950/90 backdrop-blur-xl shadow-2xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400`}
          >
            {/* halo */}
            <motion.span
              aria-hidden
              className={`absolute -inset-2 -z-10 blur-2xl ${tone.glow}`}
              animate={reduce ? undefined : { opacity: ai.status === "ready" ? [0.35, 0.75, 0.35] : [0.25, 0.45, 0.25] }}
              transition={{ repeat: Infinity, duration: ai.status === "ready" ? 1.8 : 3, ease: "easeInOut" }}
            />
            {/* shimmer when ready */}
            {ai.status === "ready" && !reduce && (
              <motion.span
                aria-hidden
                initial={{ x: "-120%" }}
                animate={{ x: "240%" }}
                transition={{ duration: 1.3, ease: "easeOut", delay: 0.2 }}
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none"
              />
            )}

            <div className="relative flex items-center gap-3 pl-3.5 pr-10 py-3">
              {/* mini tabla dok radi (ista postava kao u modalu), orb inače */}
              {status === "running" && squad && squad.length > 0 ? (
                <div className="relative w-20 h-11 shrink-0 rounded-xl bg-white/5 overflow-hidden flex items-center">
                  <AILoadingShow variant="mini" squad={squad} startedAt={startedAt} lang={lang} />
                </div>
              ) : (
              <div className="relative w-11 h-11 shrink-0">
                <motion.span
                  aria-hidden
                  className={`absolute inset-0 rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] ${tone.ring}`}
                  style={{ maskImage: "radial-gradient(circle, transparent 58%, black 60%)", WebkitMaskImage: "radial-gradient(circle, transparent 58%, black 60%)" }}
                  animate={ai.status === "running" && !reduce ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
                />
                <span key={status} className="absolute inset-[5px] rounded-full bg-slate-900 flex items-center justify-center text-white">
                  {ai.status === "running" ? (
                    <motion.span
                      animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                    >
                      <Sparkles className="w-4 h-4 text-fuchsia-300" />
                    </motion.span>
                  ) : ai.status === "ready" ? (
                    <motion.span initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.1 }}>
                      <Check className="w-5 h-5 text-emerald-300" strokeWidth={3} />
                    </motion.span>
                  ) : (
                    <AlertTriangle className="w-4.5 h-4.5 w-[18px] h-[18px] text-rose-300" strokeWidth={2.5} />
                  )}
                </span>
              </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-white leading-snug truncate">{title}</p>
                <p className="text-[11px] text-slate-300/90 leading-snug truncate">{subtitle}</p>
              </div>

              {ai.status !== "running" && (
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors shrink-0" />
              )}
            </div>

            {/* progress hairline */}
            <div className="absolute left-0 right-0 bottom-0 h-[3px] bg-white/5">
              <motion.div
                className={`h-full bg-gradient-to-r ${tone.ring}`}
                animate={{ width: `${Math.round(progress * 100)}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </button>

          {/* dismiss */}
          <button
            type="button"
            aria-label={bs ? "Zatvori" : "Dismiss"}
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
