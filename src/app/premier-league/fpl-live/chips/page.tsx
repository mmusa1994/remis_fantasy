"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdArrowBack, MdRefresh } from "react-icons/md";
import Link from "next/link";
import LoadingCard from "@/components/shared/LoadingCard";
import LeagueChipPill from "@/components/fpl/league-table/LeagueChipPill";
import type { FPLActiveChip, FPLChipUsageResponse } from "@/types/fpl";

const CHIP_LABEL: Record<NonNullable<FPLActiveChip>, string> = {
  "3xc": "Triple Captain",
  bboost: "Bench Boost",
  freehit: "Free Hit",
  wildcard: "Wildcard",
};

export default function ChipsPage() {
  const { t } = useTranslation("fpl");
  const [gameweek, setGameweek] = useState<number | null>(null);
  const [data, setData] = useState<FPLChipUsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detectGameweek = useCallback(async () => {
    const res = await fetch("/api/fpl/bootstrap-static");
    const json = await res.json();
    if (json?.success && json.data?.events) {
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
    <div className="container mx-auto px-3 sm:px-6 py-6 space-y-4">
      <Link
        href="/premier-league/fpl-live"
        className="inline-flex items-center gap-1.5 text-sm text-theme-text-secondary hover:text-theme-foreground transition-colors"
      >
        <MdArrowBack className="w-4 h-4" />
        {t("backToLive", "Back to FPL Live")}
      </Link>
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-theme-foreground">
            {t("chips.title", "Chip Usage")}
          </h1>
          {gameweek && (
            <p className="text-sm text-theme-text-secondary">
              GW {gameweek}
              {data && (
                <span className="ml-2">
                  • {t("chips.sampleSize", "Sample")}: {data.sample_size}
                </span>
              )}
              {lastUpdated && (
                <span className="ml-2">
                  · {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </p>
          )}
        </div>
        {gameweek && (
          <button
            onClick={() => fetchUsage(gameweek)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-md disabled:opacity-50"
          >
            <MdRefresh className="w-4 h-4" />
            {t("leagueTables.refresh", "Refresh")}
          </button>
        )}
      </header>

      {error && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && !data && <LoadingCard title="" description="" />}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.by_chip.map((stat) => (
            <div
              key={stat.chip}
              className="bg-theme-card border border-theme-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <LeagueChipPill chip={stat.chip} size="sm" />
                  <span className="font-semibold text-theme-foreground">
                    {stat.chip ? CHIP_LABEL[stat.chip] : "—"}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-theme-foreground">
                    {stat.percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-theme-text-secondary">
                    {stat.count} / {data.sample_size}
                  </div>
                </div>
              </div>
              <div className="w-full h-2 bg-theme-card-secondary rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-purple-500"
                  style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                />
              </div>
              {stat.popular_captains.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase font-bold text-theme-text-secondary mb-2">
                    {t("chips.popularCaptains", "Popular Captains")}
                  </h4>
                  <ul className="space-y-1">
                    {stat.popular_captains.map((cap) => (
                      <li
                        key={cap.player_id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-theme-foreground">
                          {cap.web_name || `#${cap.player_id}`}
                        </span>
                        <span className="font-bold text-theme-foreground">
                          {cap.percentage.toFixed(1)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-theme-text-secondary">
        {t(
          "chips.disclaimer",
          "Chip usage is sampled from top managers in the Overall league."
        )}
      </p>
    </div>
  );
}
