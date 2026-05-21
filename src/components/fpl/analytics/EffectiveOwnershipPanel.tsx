"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdRefresh } from "react-icons/md";
import { PiTShirtFill } from "react-icons/pi";
import LoadingCard from "@/components/shared/LoadingCard";
import { getTeamColors } from "@/lib/team-colors";
import type { FPLEOBucket } from "@/types/fpl";

interface EORow {
  bucket: FPLEOBucket;
  player_id: number;
  ownership_percent: number;
  captain_percent: number;
  triple_captain_percent: number;
  transfer_in_percent: number;
  transfer_out_percent: number;
  net_transfers_percent: number;
}

interface Element {
  id: number;
  web_name: string;
  team: number;
  element_type: number;
}

const BUCKET_LABEL: Record<FPLEOBucket, string> = {
  top10k: "Top 10k",
  top100k: "Top 100k",
  overall: "Overall",
};

const POSITION_LABEL: Record<number, string> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

const compactFmt = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// The API returns `transfer_*` fields computed as
// `(global player.transfers_*_event / sample_size) * 100`, which is NOT a real
// percentage (it can easily exceed 100,000). The numerator is the global FPL
// transfer count for that player this gameweek. We reverse the `* 100` to
// recover the raw global transfer count proxy and display it compactly.
const formatTransfers = (rawApiValue: number) => {
  const transfers = rawApiValue / 100; // undo the broken `* 100`
  return compactFmt.format(Math.round(transfers));
};

const formatPercent = (value: number, digits = 1) => `${value.toFixed(digits)}%`;

export default function EffectiveOwnershipPanel() {
  const { t } = useTranslation("fpl");
  const [gameweek, setGameweek] = useState<number | null>(null);
  const [bucket, setBucket] = useState<FPLEOBucket>("top10k");
  const [rows, setRows] = useState<EORow[]>([]);
  const [elements, setElements] = useState<Element[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detectGameweek = useCallback(async () => {
    const res = await fetch("/api/fpl/bootstrap-static");
    const data = await res.json();
    if (data?.success && data.data?.events) {
      const events = data.data.events as Array<{
        id: number;
        is_current: boolean;
        is_next: boolean;
      }>;
      const current = events.find((e) => e.is_current) || events.find((e) => e.is_next);
      setElements(data.data.elements || []);
      if (current) {
        setGameweek(current.id);
        return current.id;
      }
    }
    return null;
  }, []);

  const fetchData = useCallback(async (gw: number, b: FPLEOBucket) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/fpl/effective-ownership?gw=${gw}&bucket=${b}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load");
      setRows(json.data.ownership || []);
      setLastUpdated(json.data.last_updated || new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const gw = await detectGameweek();
      if (gw) await fetchData(gw, bucket);
      else setLoading(false);
    })();
  }, [detectGameweek, fetchData, bucket]);

  const elementMap = useMemo(
    () => new Map(elements.map((el) => [el.id, el])),
    [elements]
  );

  const topRows = rows.slice(0, 50);

  return (
    <div className="space-y-4 p-4">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-theme-foreground">
            {t("effectiveOwnership.title", "Effective Ownership")}
          </h2>
          {gameweek && (
            <p className="text-sm text-theme-text-secondary">
              GW {gameweek} • {BUCKET_LABEL[bucket]}
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
            onClick={() => fetchData(gameweek, bucket)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-md disabled:opacity-50"
          >
            <MdRefresh className="w-4 h-4" />
            {t("leagueTables.refresh", "Refresh")}
          </button>
        )}
      </header>

      <div className="inline-flex rounded-md border border-theme-border overflow-hidden">
        {(["top10k", "top100k", "overall"] as FPLEOBucket[]).map((b) => (
          <button
            key={b}
            onClick={() => setBucket(b)}
            className={`px-3 py-1.5 text-sm ${
              bucket === b
                ? "bg-purple-600 text-white"
                : "bg-theme-card text-theme-foreground"
            }`}
          >
            {BUCKET_LABEL[b]}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && rows.length === 0 && <LoadingCard title="" description="" />}

      {!loading && rows.length > 0 && (
        <div className="bg-theme-card border border-theme-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-theme-card-secondary text-theme-text-secondary uppercase">
                <tr>
                  <th className="px-2 py-2 text-left">#</th>
                  <th className="px-2 py-2 text-left">Player</th>
                  <th className="px-2 py-2 text-center">Pos</th>
                  <th className="px-2 py-2 text-right">EO%</th>
                  <th className="px-2 py-2 text-right">
                    {t("effectiveOwnership.capEO", "Cap EO")}%
                  </th>
                  <th className="px-2 py-2 text-right">
                    {t("effectiveOwnership.tcEO", "TC EO")}%
                  </th>
                  <th className="px-2 py-2 text-right">TI</th>
                  <th className="px-2 py-2 text-right">TO</th>
                  <th className="px-2 py-2 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {topRows.map((row, idx) => {
                  const el = elementMap.get(row.player_id);
                  const netRaw = row.net_transfers_percent / 100;
                  const colors = getTeamColors(el?.team || 1);
                  return (
                    <tr
                      key={row.player_id}
                      className="border-t border-theme-border"
                    >
                      <td className="px-2 py-2 font-bold">{idx + 1}</td>
                      <td className="px-2 py-2 font-medium text-theme-foreground max-w-[160px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="flex items-center justify-center w-6 h-6 rounded-md shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${colors.primary}1a 0%, ${colors.primary}0d 100%)`,
                            }}
                          >
                            <PiTShirtFill
                              className="w-3.5 h-3.5"
                              style={{
                                color: colors.primary,
                                filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))",
                              } as React.CSSProperties}
                            />
                          </div>
                          <span className="truncate">
                            {el?.web_name || `#${row.player_id}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center text-theme-text-secondary">
                        {POSITION_LABEL[el?.element_type || 3] || ""}
                      </td>
                      <td className="px-2 py-2 text-right font-bold">
                        {formatPercent(row.ownership_percent)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {formatPercent(row.captain_percent)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {formatPercent(row.triple_captain_percent)}
                      </td>
                      <td className="px-2 py-2 text-right text-green-600 dark:text-green-400">
                        {formatTransfers(row.transfer_in_percent)}
                      </td>
                      <td className="px-2 py-2 text-right text-red-600 dark:text-red-400">
                        {formatTransfers(row.transfer_out_percent)}
                      </td>
                      <td
                        className={`px-2 py-2 text-right font-medium ${
                          netRaw >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {netRaw >= 0 ? "+" : "-"}
                        {compactFmt.format(Math.round(Math.abs(netRaw)))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-theme-text-secondary">
        {t(
          "effectiveOwnership.disclaimer",
          "Note: bucket data is sampled from top managers in the Overall league. TI/TO/Net columns reflect global FPL transfer counts (compact)."
        )}
      </p>
    </div>
  );
}
