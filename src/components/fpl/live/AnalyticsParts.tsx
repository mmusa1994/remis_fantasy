"use client";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, RefreshCw } from "lucide-react";
import { cx, GhostButton, dateLocale } from "./ui";

/** Shared chrome for the live analytics panels (BPS, EO, chips, xPts). */

export function AnalyticsToolbar({
  gameweek,
  updatedAt,
  loading,
  onRefresh,
  meta,
  children,
}: {
  gameweek: number | null;
  updatedAt: string | null;
  loading: boolean;
  onRefresh?: () => void;
  /** Extra text after "GW 5 · Updated 09:40". */
  meta?: ReactNode;
  /** Controls row under the meta line (segmented filters...). */
  children?: ReactNode;
}) {
  const { t, i18n } = useTranslation("fpl");
  const time = updatedAt
    ? new Date(updatedAt).toLocaleTimeString(dateLocale(i18n.language), { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="space-y-2.5 px-4 py-3 sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-xs text-theme-text-muted">
          {gameweek ? `GW ${gameweek}` : "—"}
          {time && ` · ${t("fplLive.ui.leagues.updatedAt", "Updated {{time}}", { time })}`}
          {meta}
        </p>
        {onRefresh && gameweek && (
          <GhostButton
            onClick={onRefresh}
            disabled={loading}
            className="h-8 w-8 shrink-0 !px-0"
            title={t("fplLive.ui.leagues.refresh", "Refresh")}
          >
            <RefreshCw className={cx(loading && "animate-spin")} />
          </GhostButton>
        )}
      </div>
      {children}
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <div className="mx-4 mb-3 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 sm:mx-5">
      {message}
    </div>
  );
}

export function Footnote({ children }: { children: ReactNode }) {
  return (
    <p className="border-t border-theme-border px-4 py-3 text-[11px] leading-relaxed text-theme-text-muted sm:px-5">
      {children}
    </p>
  );
}

export function ShowMoreButton({
  expanded,
  onClick,
  count,
}: {
  expanded: boolean;
  onClick: () => void;
  /** How many more rows expanding reveals. */
  count?: number;
}) {
  const { t } = useTranslation("fpl");
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1 border-t border-theme-border py-2.5 text-xs font-medium text-theme-text-muted transition-colors hover:bg-theme-card-secondary hover:text-theme-text-secondary"
    >
      {expanded
        ? t("fplLive.ui.leagues.showLess", "Show less")
        : typeof count === "number" && count > 0
          ? t("fplLive.ui.leagues.showMoreCount", "Show {{count}} more", { count })
          : t("fplLive.ui.leagues.showMore", "Show more")}
      <ChevronDown className={cx("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
    </button>
  );
}
