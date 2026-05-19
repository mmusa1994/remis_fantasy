"use client";
import { useTranslation } from "react-i18next";
import { MdArrowDropDown, MdArrowDropUp } from "react-icons/md";
import type { SortDirection, SortKey } from "./types";

interface LeagueTableHeaderProps {
  variant: "tablet" | "desktop";
  sortKey: SortKey;
  sortDir: SortDirection;
  onSort: (key: SortKey) => void;
}

export default function LeagueTableHeader({
  variant,
  sortKey,
  sortDir,
  onSort,
}: LeagueTableHeaderProps) {
  const { t } = useTranslation("fpl");

  const renderSortIndicator = (key: SortKey) => {
    if (sortKey !== key) {
      return (
        <span className="inline-block w-3 h-3 opacity-30">
          <MdArrowDropDown className="w-3 h-3" />
        </span>
      );
    }
    return sortDir === "desc" ? (
      <MdArrowDropDown className="w-3 h-3 text-purple-600 dark:text-purple-400" />
    ) : (
      <MdArrowDropUp className="w-3 h-3 text-purple-600 dark:text-purple-400" />
    );
  };

  if (variant === "tablet") {
    return (
      <div className="sticky top-0 z-10 bg-theme-card-secondary border-b-2 border-theme-border">
        <div className="px-3 py-2">
          <div className="grid grid-cols-[40px_minmax(0,_1fr)_40px_60px_70px_50px_30px] gap-2 text-xs font-bold text-theme-text-secondary uppercase">
            <button
              type="button"
              onClick={() => onSort("rank")}
              className="flex items-center justify-center gap-0.5 hover:text-purple-600"
            >
              POS {renderSortIndicator("rank")}
            </button>
            <span className="flex items-center">
              {t("leagueTables.team", "Team")}
            </span>
            <button
              type="button"
              onClick={() => onSort("players_to_play")}
              className="flex items-center justify-center gap-0.5 hover:text-purple-600"
            >
              YET {renderSortIndicator("players_to_play")}
            </button>
            <button
              type="button"
              onClick={() => onSort("live_points_net")}
              className="flex items-center justify-center gap-0.5 hover:text-purple-600"
            >
              GW {renderSortIndicator("live_points_net")}
            </button>
            <button
              type="button"
              onClick={() => onSort("live_total")}
              className="flex items-center justify-center gap-0.5 hover:text-purple-600"
            >
              TOT {renderSortIndicator("live_total")}
            </button>
            <button
              type="button"
              onClick={() => onSort("active_chip")}
              className="flex items-center justify-center gap-0.5 hover:text-purple-600"
            >
              CHIP {renderSortIndicator("active_chip")}
            </button>
            <span />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-10 bg-theme-card-secondary border-b-2 border-theme-border">
      <div className="px-4 py-3">
        <div className="grid grid-cols-[60px_minmax(0,_1.4fr)_minmax(0,_1.2fr)_40px_minmax(0,_1fr)_70px_70px_80px_50px_70px_60px_50px_30px] gap-2 text-xs font-bold text-theme-text-secondary uppercase">
          <button
            type="button"
            onClick={() => onSort("rank")}
            className="flex items-center gap-1 hover:text-purple-600"
          >
            POS {renderSortIndicator("rank")}
          </button>
          <span>{t("leagueTables.manager", "Manager")}</span>
          <span>{t("leagueTables.team", "Team")}</span>
          <button
            type="button"
            onClick={() => onSort("players_to_play")}
            className="flex items-center justify-center gap-0.5 hover:text-purple-600"
          >
            YET {renderSortIndicator("players_to_play")}
          </button>
          <span>(C)</span>
          <button
            type="button"
            onClick={() => onSort("live_points_gross")}
            className="flex items-center justify-center gap-0.5 hover:text-purple-600"
          >
            {t("leagueTables.gwGross", "GW")}{" "}
            {renderSortIndicator("live_points_gross")}
          </button>
          <button
            type="button"
            onClick={() => onSort("live_points_net")}
            className="flex items-center justify-center gap-0.5 hover:text-purple-600"
          >
            {t("leagueTables.gwNet", "Net")}{" "}
            {renderSortIndicator("live_points_net")}
          </button>
          <button
            type="button"
            onClick={() => onSort("live_total")}
            className="flex items-center justify-center gap-0.5 hover:text-purple-600"
          >
            TOT {renderSortIndicator("live_total")}
          </button>
          <button
            type="button"
            onClick={() => onSort("transfers")}
            className="flex items-center justify-center gap-0.5 hover:text-purple-600"
          >
            FT {renderSortIndicator("transfers")}
          </button>
          <button
            type="button"
            onClick={() => onSort("team_value")}
            className="flex items-center justify-center gap-0.5 hover:text-purple-600"
          >
            TV {renderSortIndicator("team_value")}
          </button>
          <button
            type="button"
            onClick={() => onSort("active_chip")}
            className="flex items-center justify-center gap-0.5 hover:text-purple-600"
          >
            CHIP {renderSortIndicator("active_chip")}
          </button>
          <span className="text-center">PLD</span>
          <span />
        </div>
      </div>
    </div>
  );
}
