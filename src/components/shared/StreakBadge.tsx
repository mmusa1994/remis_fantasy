"use client";

import { Flame, Trophy, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

// Streak / progress dopamine badge — shows next to the progress bar to
// reward users for how many predictions they've completed.

const MILESTONES = [10, 25, 50, 75, 100];

function nextMilestone(done: number): number {
  for (const m of MILESTONES) if (m > done) return m;
  // After the last hard-coded milestone, keep rolling +25.
  return Math.ceil((done + 1) / 25) * 25;
}

export default function StreakBadge({
  done,
  total,
  theme,
  compact,
}: {
  done: number;
  total: number;
  theme: string;
  compact?: boolean;
}) {
  const { t } = useTranslation("predictor");
  const dark = theme === "dark";
  const next = nextMilestone(done);
  const justHit = MILESTONES.includes(done);
  const Icon = done >= 50 ? Trophy : done >= 10 ? Flame : Sparkles;

  if (done === 0) return null;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
        justHit
          ? dark
            ? "bg-amber-500/20 border-amber-500/60 text-amber-200 shadow-md shadow-amber-500/30 animate-pulse"
            : "bg-amber-100 border-amber-400 text-amber-900 shadow-md shadow-amber-500/20 animate-pulse"
          : dark
            ? "bg-amber-500/10 border-amber-500/40 text-amber-200"
            : "bg-amber-50 border-amber-300 text-amber-800"
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm font-black tabular-nums leading-none">
        {done}
      </span>
      {!compact && (
        <span className="text-[10px] uppercase tracking-wider font-bold leading-none">
          {t("streak.label", "predikcija")}
        </span>
      )}
      {!compact && done < total && (
        <span
          className={`text-[10px] tracking-wider font-bold leading-none ml-1 ${dark ? "text-amber-300/70" : "text-amber-700/70"}`}
        >
          → {next}
        </span>
      )}
    </div>
  );
}
