"use client";

import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PlayerJersey } from "@/components/fpl/live/ui";

type JerseyPlayer = { team?: number; team_code?: number; element_type?: number } | null;

interface AutoSubArrowProps {
  outName: string;
  inName: string;
  outMinutes?: number;
  inPoints?: number;
  reason?: string;
  outPlayer?: JerseyPlayer;
  inPlayer?: JerseyPlayer;
}

/** One automatic substitution: who went off (0') and who came in (+pts). */
export default function AutoSubArrow({
  outName,
  inName,
  outMinutes,
  inPoints,
  reason,
  outPlayer,
  inPlayer,
}: AutoSubArrowProps) {
  const { t } = useTranslation("fpl");
  const reasonLabel =
    reason && /dnp/i.test(reason)
      ? t("fplLive.ui.leagues.didNotPlay", "Didn't play")
      : reason;

  return (
    <div className="flex items-center gap-2 rounded-xl bg-theme-card-secondary px-3 py-2 text-xs">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {outPlayer && <PlayerJersey player={outPlayer} size="xs" className="opacity-60" />}
        <span className="truncate text-theme-text-muted line-through">{outName}</span>
        {typeof outMinutes === "number" && (
          <span className="shrink-0 tabular-nums text-theme-text-muted">{outMinutes}&apos;</span>
        )}
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-theme-text-muted" />
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {inPlayer && <PlayerJersey player={inPlayer} size="xs" />}
        <span className="truncate font-medium text-theme-heading-primary">{inName}</span>
        {typeof inPoints === "number" && (
          <span className="shrink-0 font-semibold tabular-nums text-emerald-500">+{inPoints}</span>
        )}
      </div>
      {reasonLabel && (
        <span className="hidden shrink-0 text-[10px] text-theme-text-muted sm:inline">{reasonLabel}</span>
      )}
    </div>
  );
}
