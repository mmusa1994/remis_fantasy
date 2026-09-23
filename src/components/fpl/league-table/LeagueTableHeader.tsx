"use client";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cx } from "@/components/fpl/live/ui";
import type { SortDirection, SortKey } from "./types";

/**
 * Shared column layout for the standings header and rows.
 * Phones/tablets: # · Team · GW · Total. Desktop adds captain, yet to play,
 * transfers, value and chip columns (cells marked `hidden lg:*`).
 */
export const LEAGUE_ROW_GRID =
  "grid grid-cols-[2.25rem_minmax(0,1fr)_3.25rem_3.5rem] lg:grid-cols-[2.75rem_minmax(0,1.5fr)_minmax(0,1.1fr)_2.75rem_3.5rem_4rem_2.75rem_4rem_3rem] items-center gap-x-2 lg:gap-x-3";

function SortButton({
  k,
  sortKey,
  sortDir,
  onSort,
  children,
  className,
}: {
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDirection;
  onSort: (key: SortKey) => void;
  children: ReactNode;
  className?: string;
}) {
  const active = sortKey === k;
  return (
    <button
      type="button"
      onClick={() => onSort(k)}
      className={cx(
        "flex items-center gap-0.5 uppercase tracking-wider transition-colors hover:text-theme-text-secondary",
        active && "text-violet-600 dark:text-violet-300",
        className
      )}
    >
      {children}
      <span className={cx("text-[8px]", !active && "opacity-0")}>
        {active && sortDir === "asc" ? "▲" : "▼"}
      </span>
    </button>
  );
}

interface LeagueTableHeaderProps {
  sortKey: SortKey;
  sortDir: SortDirection;
  onSort: (key: SortKey) => void;
  showGwNet: boolean;
}

export default function LeagueTableHeader({
  sortKey,
  sortDir,
  onSort,
  showGwNet,
}: LeagueTableHeaderProps) {
  const { t } = useTranslation("fpl");
  const gwKey: SortKey = showGwNet ? "live_points_net" : "live_points_gross";

  return (
    <div
      className={cx(
        LEAGUE_ROW_GRID,
        "border-y border-theme-border bg-theme-card-secondary px-4 py-2 text-[10px] font-semibold text-theme-text-muted sm:px-5"
      )}
    >
      <SortButton sortKey={sortKey} sortDir={sortDir} onSort={onSort} k="rank">#</SortButton>
      <span className="uppercase tracking-wider">{t("fplLive.ui.leagues.team", "Team")}</span>
      <span className="hidden uppercase tracking-wider lg:block">
        {t("fplLive.ui.leagues.captain", "Captain")}
      </span>
      <SortButton sortKey={sortKey} sortDir={sortDir} onSort={onSort} k="players_to_play" className="hidden justify-center lg:flex">
        {t("fplLive.ui.leagues.yetShort", "Yet")}
      </SortButton>
      <SortButton sortKey={sortKey} sortDir={sortDir} onSort={onSort} k={gwKey} className="justify-end">
        GW
      </SortButton>
      <SortButton sortKey={sortKey} sortDir={sortDir} onSort={onSort} k="live_total" className="justify-end">
        {t("fplLive.ui.leagues.totalShort", "Total")}
      </SortButton>
      <SortButton sortKey={sortKey} sortDir={sortDir} onSort={onSort} k="transfers" className="hidden justify-center lg:flex">
        {t("fplLive.ui.leagues.transfersShort", "TR")}
      </SortButton>
      <SortButton sortKey={sortKey} sortDir={sortDir} onSort={onSort} k="team_value" className="hidden justify-end lg:flex">
        {t("fplLive.ui.leagues.valueShort", "Value")}
      </SortButton>
      <SortButton sortKey={sortKey} sortDir={sortDir} onSort={onSort} k="active_chip" className="hidden justify-center lg:flex">
        {t("fplLive.ui.leagues.chip", "Chip")}
      </SortButton>
    </div>
  );
}
