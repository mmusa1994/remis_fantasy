"use client";

// Dev-only vizuelni pregled AI komponenti bez prijave i bez trošenja kredita.
// U produkciji vraća 404.

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { notFound } from "next/navigation";
import AILoadingShow from "@/components/fpl/AILoadingShow";
import AITeamAnalysisReport from "@/components/fpl/AITeamAnalysisReport";
import { AIAnalysisToastView } from "@/components/fpl/AIAnalysisToast";
import { SAMPLE_TEAM_ANALYSIS_REPORT } from "@/lib/ai/sample-report";
import type { AnalysisMeta } from "@/lib/ai/fpl-analysis-prompt";

const XI = [
  { name: "Trafford", type: 1 },
  { name: "N.Williams", type: 2 },
  { name: "Muñoz", type: 2 },
  { name: "Muharemović", type: 2 },
  { name: "Barnes", type: 3 },
  { name: "Gibbs-White", type: 3 },
  { name: "Saka", type: 3 },
  { name: "B.Fernandes", type: 3 },
  { name: "Calvert-Lewin", type: 4 },
  { name: "Haaland", type: 4 },
  { name: "Barry", type: 4 },
];

const META: AnalysisMeta = {
  season: "2026/27",
  targetGW: 6,
  currentGW: 5,
  deadline: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
  picksGW: 5,
  hasSquad: true,
  teamName: "Preview FC",
  managerName: "Preview",
  model: "gpt-5.4-mini",
  generatedAt: new Date().toISOString(),
  durationMs: 17400,
  repaired: [],
};

export default function AIPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const [view, setView] = useState<"loader" | "report">("loader");
  const [lang, setLang] = useState<"bs" | "en">("bs");
  const [dark, setDark] = useState(true);
  const [toast, setToast] = useState<"running" | "ready" | "error" | "off">("running");
  const [loaderStart, setLoaderStart] = useState<number>(() => Date.now());
  const [finishing, setFinishing] = useState(false);
  const finish = () => {
    setFinishing(true);
    setTimeout(() => {
      setFinishing(false);
      setView("report");
    }, 650);
  };
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (toast !== "running") return;
    const t0 = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - t0), 250);
    return () => clearInterval(id);
  }, [toast]);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-500">AI preview</span>
            {(["loader", "report"] as const).map((v) => (
              <button
                key={v}
                onClick={() => {
                  setView(v);
                  if (v === "loader") setLoaderStart(Date.now());
                }}
                data-testid={`view-${v}`}
                className={`px-3 py-1.5 rounded-lg border ${
                  view === v ? "bg-violet-600 text-white border-violet-600" : "border-slate-300 dark:border-slate-700"
                }`}
              >
                {v}
              </button>
            ))}
            <button onClick={finish} data-testid="finish" className="px-3 py-1.5 rounded-lg border border-emerald-400 text-emerald-600 dark:text-emerald-300">
              finish
            </button>
            <button onClick={() => setLang(lang === "bs" ? "en" : "bs")} data-testid="toggle-lang" className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700">
              {lang}
            </button>
            <button onClick={() => setDark(!dark)} data-testid="toggle-theme" className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700">
              {dark ? "dark" : "light"}
            </button>
            <span className="ml-2 text-slate-500">toast:</span>
            {(["running", "ready", "error", "off"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setToast(v)}
                data-testid={`toast-${v}`}
                className={`px-2.5 py-1.5 rounded-lg border ${
                  toast === v ? "bg-fuchsia-600 text-white border-fuchsia-600" : "border-slate-300 dark:border-slate-700"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* isti okvir kao modal u FantasyPlanner-u */}
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl border border-violet-300/30 dark:border-violet-700/40 bg-gradient-to-br from-white via-violet-50/60 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950/40">
            <div className="relative px-5 sm:px-6 py-5 max-h-[74vh] overflow-y-auto" data-testid="modal-content">
              <AnimatePresence mode="popLayout">
                {view === "loader" && (
                  <motion.div key="scan" exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }} transition={{ duration: 0.3 }}>
                    <AILoadingShow lang={lang} squad={XI} startedAt={loaderStart} done={finishing} />
                  </motion.div>
                )}
              </AnimatePresence>
              {view === "report" && (
                <AITeamAnalysisReport report={SAMPLE_TEAM_ANALYSIS_REPORT} meta={META} lang={lang} />
              )}
            </div>
          </div>
        </div>
        {toast !== "off" && (
          <AIAnalysisToastView
            status={toast}
            elapsedMs={elapsed}
            visible
            lang={lang}
            squad={XI}
            startedAt={loaderStart}
            onOpen={() => setView("report")}
            onDismiss={() => setToast("off")}
          />
        )}
      </div>
    </div>
  );
}
