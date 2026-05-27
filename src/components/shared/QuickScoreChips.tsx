"use client";

import { useTranslation } from "react-i18next";
import type { AccentClasses } from "@/utils/predictor-accent";

const PRESETS: Array<{ h: number; a: number }> = [
  { h: 1, a: 0 },
  { h: 2, a: 0 },
  { h: 2, a: 1 },
  { h: 3, a: 1 },
  { h: 0, a: 0 },
  { h: 1, a: 1 },
  { h: 2, a: 2 },
  { h: 0, a: 1 },
  { h: 1, a: 2 },
  { h: 1, a: 3 },
];

export default function QuickScoreChips({
  homeName,
  awayName,
  selected,
  disabled,
  onPick,
  theme,
  ac,
}: {
  homeName?: string;
  awayName?: string;
  selected?: { home: number | null; away: number | null };
  disabled?: boolean;
  onPick: (home: number, away: number) => void;
  theme: string;
  ac: AccentClasses;
}) {
  const { t } = useTranslation("predictor");
  const dark = theme === "dark";

  return (
    <div className="mt-2.5">
      <p
        className={`text-[9px] uppercase tracking-widest font-bold mb-1.5 ${dark ? "text-gray-500" : "text-gray-400"}`}
      >
        {t("quickPick", "Brzi tip")}
      </p>
      <div className="grid grid-cols-5 gap-1">
        {PRESETS.map((p) => {
          const isSelected =
            selected?.home === p.h && selected?.away === p.a;
          const winner = p.h > p.a ? "home" : p.h < p.a ? "away" : "draw";
          return (
            <button
              key={`${p.h}-${p.a}`}
              type="button"
              disabled={disabled}
              onClick={() => onPick(p.h, p.a)}
              aria-label={
                winner === "draw"
                  ? `${p.h} : ${p.a}`
                  : winner === "home"
                    ? `${homeName ?? "domaćin"} ${p.h} : ${p.a}`
                    : `${p.h} : ${p.a} ${awayName ?? "gost"}`
              }
              className={`inline-flex items-center justify-center gap-0.5 px-1.5 py-1 rounded-lg text-xs font-bold tabular-nums transition-all active:scale-95 ${
                isSelected
                  ? `${ac.bgSolid} ${ac.textOn} border ${ac.ring400} shadow-sm ${ac.shadow500_30}`
                  : dark
                    ? `bg-gray-900/60 text-gray-300 border border-gray-700 ${ac.hoverBorder500_60}`
                    : `bg-gray-50 text-gray-700 border border-gray-200 ${ac.hoverBorder500_60}`
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {p.h}
              <span
                className={`${isSelected ? `${ac.textOn} opacity-60` : dark ? "text-gray-600" : "text-gray-400"}`}
              >
                :
              </span>
              {p.a}
            </button>
          );
        })}
      </div>
    </div>
  );
}
