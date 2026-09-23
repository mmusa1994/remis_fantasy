import { useTranslation } from "react-i18next";
import type { FPLActiveChip } from "@/types/fpl";

interface LeagueChipPillProps {
  chip: FPLActiveChip;
  size?: "xs" | "sm";
  /** Render an em dash when no chip is active (table cells). */
  showEmpty?: boolean;
}

export const CHIP_LABELS: Record<NonNullable<FPLActiveChip>, string> = {
  "3xc": "TC",
  bboost: "BB",
  freehit: "FH",
  wildcard: "WC",
};

export const CHIP_FULL_NAME: Record<NonNullable<FPLActiveChip>, string> = {
  "3xc": "Triple Captain",
  bboost: "Bench Boost",
  freehit: "Free Hit",
  wildcard: "Wildcard",
};

/** Active chip marker — one quiet accent style for every chip. */
export default function LeagueChipPill({
  chip,
  size = "xs",
  showEmpty = true,
}: LeagueChipPillProps) {
  const { t } = useTranslation("fpl");
  if (!chip) {
    if (!showEmpty) return null;
    return (
      <span className="text-xs text-theme-text-muted" aria-label={t("fplLive.ui.leagues.noChip", "No chip")}>
        —
      </span>
    );
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-md font-semibold uppercase tracking-wide bg-violet-500/10 text-violet-600 ring-1 ring-inset ring-violet-500/25 dark:text-violet-300 ${
        size === "xs" ? "px-1.5 py-px text-[9px]" : "px-2 py-0.5 text-[11px]"
      }`}
      title={CHIP_FULL_NAME[chip]}
    >
      {CHIP_LABELS[chip]}
    </span>
  );
}
