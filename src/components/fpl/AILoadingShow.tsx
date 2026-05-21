"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { FaRobot } from "react-icons/fa";
import { Check, Activity, Target, TrendingUp, Sparkles } from "lucide-react";

interface AILoadingShowProps {
  /** @deprecated language is now read from i18n; kept for backwards compatibility */
  lang?: string;
}

interface Step {
  key: string;
  labelKey: string;
  labelFallback: string;
  icon: React.ComponentType<{ className?: string }>;
  targetCount: number;
  unitKey: string;
  unitFallback: string;
  color: string;
}

const STEPS: Step[] = [
  {
    key: "players",
    labelKey: "fplDashboard.aiLoading.scanningPlayers",
    labelFallback: "Scanning players",
    icon: Activity,
    targetCount: 678,
    unitKey: "fplDashboard.aiLoading.playersUnit",
    unitFallback: "players",
    color: "violet",
  },
  {
    key: "form",
    labelKey: "fplDashboard.aiLoading.computingForm",
    labelFallback: "Computing form",
    icon: TrendingUp,
    targetCount: 142,
    unitKey: "fplDashboard.aiLoading.ratingsUnit",
    unitFallback: "ratings",
    color: "fuchsia",
  },
  {
    key: "fixtures",
    labelKey: "fplDashboard.aiLoading.analyzingFixtures",
    labelFallback: "Analyzing fixtures",
    icon: Target,
    targetCount: 95,
    unitKey: "fplDashboard.aiLoading.fixturesUnit",
    unitFallback: "fixtures",
    color: "indigo",
  },
  {
    key: "verdict",
    labelKey: "fplDashboard.aiLoading.buildingRecommendations",
    labelFallback: "Building recommendations",
    icon: Sparkles,
    targetCount: 5,
    unitKey: "fplDashboard.aiLoading.insightsUnit",
    unitFallback: "insights",
    color: "purple",
  },
];

function useAnimatedCount(target: number, duration = 1100, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const startTs = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTs;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return count;
}

function StepRow({
  step,
  idx,
  state,
}: {
  step: Step;
  idx: number;
  state: "pending" | "active" | "done";
}) {
  const { t } = useTranslation("fpl");
  const Icon = step.icon;
  const count = useAnimatedCount(step.targetCount, 1000, state !== "pending");
  const isActive = state === "active";
  const isDone = state === "done";
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.12 }}
      className={`relative flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
        isDone
          ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40"
          : isActive
          ? "bg-gradient-to-r from-violet-50 via-fuchsia-50 to-indigo-50 dark:from-violet-950/40 dark:via-fuchsia-950/30 dark:to-indigo-950/40 border-violet-300/60 dark:border-violet-700/50 shadow-sm"
          : "bg-white/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/40"
      }`}
    >
      {/* Active animated bar */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent"
            animate={{ x: ["-100%", "400%"] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
          />
        </motion.div>
      )}

      <div
        className={`relative flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-all ${
          isDone
            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
            : isActive
            ? "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 text-white shadow-md shadow-violet-500/40"
            : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
        }`}
      >
        {isDone ? (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 16 }}>
            <Check className="w-4 h-4" />
          </motion.span>
        ) : (
          <motion.span animate={isActive ? { scale: [1, 1.15, 1] } : {}} transition={{ repeat: Infinity, duration: 1.4 }}>
            <Icon className="w-4 h-4" />
          </motion.span>
        )}
        {isActive && (
          <span className="absolute -inset-0.5 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 opacity-40 blur-md -z-10" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-semibold ${
            isDone
              ? "text-emerald-700 dark:text-emerald-300"
              : isActive
              ? "text-slate-800 dark:text-slate-100"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {t(step.labelKey, step.labelFallback)}
        </p>
        <div className="flex items-baseline gap-1 mt-0.5">
          <motion.span
            key={count}
            className={`text-sm font-bold tabular-nums ${
              isDone ? "text-emerald-600 dark:text-emerald-400" : isActive ? "text-violet-700 dark:text-violet-300" : "text-slate-400 dark:text-slate-600"
            }`}
          >
            {count.toLocaleString()}
          </motion.span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{t(step.unitKey, step.unitFallback)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function AILoadingShow(_props: AILoadingShowProps = {}) {
  const { t } = useTranslation("fpl");
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((i) => (i + 1) % (STEPS.length + 1));
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center py-6">
      {/* Hero orbit loader */}
      <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 border-r-fuchsia-500"
        />
        <motion.span
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 3.2, ease: "linear" }}
          className="absolute inset-2 rounded-full border-2 border-transparent border-b-indigo-500 border-l-violet-400"
        />
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
          className="absolute inset-4 rounded-full border border-fuchsia-400/40 border-dashed"
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/40"
        >
          <FaRobot className="w-6 h-6 text-white" />
          <span className="absolute -inset-1 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 opacity-40 blur-xl -z-10" />
        </motion.div>
      </div>

      {/* Title with shimmer */}
      <div className="relative inline-block">
        <motion.p
          className="text-base font-bold bg-gradient-to-r from-violet-700 via-fuchsia-600 to-indigo-700 dark:from-violet-300 dark:via-fuchsia-300 dark:to-indigo-300 bg-clip-text text-transparent"
        >
          {t("fplDashboard.aiLoading.aiMagic", "AI is working its magic…")}
        </motion.p>
        <AnimatePresence mode="wait">
          <motion.span
            key={activeIdx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="block mt-1 text-[11px] text-slate-500 dark:text-slate-400"
          >
            {activeIdx < STEPS.length
              ? t(STEPS[activeIdx].labelKey, STEPS[activeIdx].labelFallback) + "…"
              : t("fplDashboard.aiLoading.almostDone", "Almost done…")}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Step list */}
      <div className="mt-5 max-w-sm mx-auto space-y-2 text-left">
        {STEPS.map((step, i) => {
          const state: "pending" | "active" | "done" = i < activeIdx ? "done" : i === activeIdx ? "active" : "pending";
          return <StepRow key={step.key} step={step} idx={i} state={state} />;
        })}
      </div>

      {/* Bottom tip */}
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
        className="mt-5 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500"
      >
        {t("fplDashboard.aiLoading.optimizing", "🎯 Optimizing for next gameweek")}
      </motion.p>
    </div>
  );
}
