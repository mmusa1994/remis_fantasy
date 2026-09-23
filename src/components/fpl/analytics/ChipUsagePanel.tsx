"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Target } from "lucide-react";
import LeagueChipPill, { CHIP_FULL_NAME } from "@/components/fpl/league-table/LeagueChipPill";
import { Bar, EmptyState, PlayerJersey, SkeletonRows } from "@/components/fpl/live/ui";
import { AnalyticsToolbar, Footnote, InlineError } from "@/components/fpl/live/AnalyticsParts";
import type { FPLChipUsageResponse } from "@/types/fpl";

interface BootstrapElement {
  id: number;
  web_name: string;
  team: number;
  team_code?: number;
  element_type?: number;
}

export default function ChipUsagePanel() {
  const { t } = useTranslation("fpl");
  const [gameweek, setGameweek] = useState<number | null>(null);
  const [data, setData] = useState<FPLChipUsageResponse | null>(null);
  const [elements, setElements] = useState<BootstrapElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detectGameweek = useCallback(async () => {
    const res = await fetch("/api/fpl/bootstrap-static");
    const json = await res.json();
    if (json?.success && json.data?.events) {
      setElements(json.data.elements || []);
      const events = json.data.events as Array<{
        id: number;
        is_current: boolean;
        is_next: boolean;
      }>;
      const current = events.find((e) => e.is_current) || events.find((e) => e.is_next);
      if (current) {
        setGameweek(current.id);
        return current.id;
      }
    }
    return null;
  }, []);

  const elementMap = useMemo(() => new Map(elements.map((el) => [el.id, el])), [elements]);

  const fetchUsage = useCallback(async (gw: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fpl/chip-usage?gw=${gw}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load");
      setData(json.data);
      setLastUpdated(json.last_updated || new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const gw = await detectGameweek();
      if (gw) await fetchUsage(gw);
      else setLoading(false);
    })();
  }, [detectGameweek, fetchUsage]);

  return (
    <div>
      <AnalyticsToolbar
        gameweek={gameweek}
        updatedAt={lastUpdated}
        loading={loading}
        onRefresh={gameweek ? () => fetchUsage(gameweek) : undefined}
        meta={
          data
            ? ` · ${t("fplLive.ui.leagues.sample", "sample {{count}}", { count: data.sample_size })}`
            : null
        }
      />

      {error && <InlineError message={t("fplLive.ui.leagues.loadError", "Couldn't load data. Try refreshing.")} />}

      {loading && !data && <SkeletonRows rows={4} className="border-t border-theme-border" />}

      {!loading && data && data.by_chip.length === 0 && (
        <EmptyState
          className="border-t border-theme-border"
          icon={<Target />}
          title={t("fplLive.ui.leagues.noData", "No data yet for this gameweek.")}
        />
      )}

      {data && data.by_chip.length > 0 && (
        <div className="grid grid-cols-1 gap-3 border-t border-theme-border p-3 sm:p-4 md:grid-cols-2">
          {data.by_chip.map((stat) => (
            <div key={stat.chip ?? "none"} className="rounded-xl border border-theme-border p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <LeagueChipPill chip={stat.chip} size="sm" />
                  <span className="truncate text-sm font-medium text-theme-heading-primary">
                    {stat.chip ? CHIP_FULL_NAME[stat.chip] : "—"}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-lg font-semibold leading-none tabular-nums text-theme-heading-primary">
                    {stat.percentage.toFixed(1)}%
                  </div>
                  <div className="mt-1 text-[11px] tabular-nums text-theme-text-muted">
                    {stat.count} / {data.sample_size}
                  </div>
                </div>
              </div>
              <Bar value={stat.percentage} className="mt-2.5" />

              {stat.popular_captains.length > 0 && (
                <div className="mt-3">
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-theme-text-muted">
                    {t("chips.popularCaptains", "Popular Captains")}
                  </div>
                  <ul className="space-y-1.5">
                    {stat.popular_captains.map((cap) => {
                      const el = elementMap.get(cap.player_id);
                      return (
                        <li key={cap.player_id} className="flex items-center gap-2 text-xs">
                          {el && <PlayerJersey player={el} size="xs" />}
                          <span className="min-w-0 flex-1 truncate text-theme-text-secondary">
                            {cap.web_name || el?.web_name || `#${cap.player_id}`}
                          </span>
                          <span className="font-semibold tabular-nums text-theme-heading-primary">
                            {cap.percentage.toFixed(1)}%
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Footnote>
        {t("chips.disclaimer", "Chip usage is sampled from top managers in the Overall league.")}
      </Footnote>
    </div>
  );
}
