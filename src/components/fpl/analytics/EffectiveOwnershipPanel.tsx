"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";
import {
  cx,
  EmptyState,
  PlayerCell,
  POSITION_SHORT,
  Segmented,
  SkeletonRows,
} from "@/components/fpl/live/ui";
import {
  AnalyticsToolbar,
  Footnote,
  InlineError,
  ShowMoreButton,
} from "@/components/fpl/live/AnalyticsParts";
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
  team_code?: number;
  element_type: number;
}

const COLLAPSED_ROWS = 20;
const MAX_ROWS = 50;

const compactFmt = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// The API returns `net_transfers_percent` computed as
// `(global player net transfers this GW / sample_size) * 100`, which is NOT a
// real percentage. Undo the `* 100` to get back the global transfer count
// proxy and show it compactly.
const formatNetTransfers = (rawApiValue: number) => {
  const net = rawApiValue / 100;
  const sign = net > 0 ? "+" : net < 0 ? "−" : "";
  return `${sign}${compactFmt.format(Math.round(Math.abs(net)))}`;
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
  const [showAll, setShowAll] = useState(false);

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
      const res = await fetch(`/api/fpl/effective-ownership?gw=${gw}&bucket=${b}`);
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

  const elementMap = useMemo(() => new Map(elements.map((el) => [el.id, el])), [elements]);

  const topRows = rows.slice(0, MAX_ROWS);
  const visible = showAll ? topRows : topRows.slice(0, COLLAPSED_ROWS);

  const bucketLabel: Record<FPLEOBucket, string> = {
    top10k: t("effectiveOwnership.bucketTop10k", "Top 10k"),
    top100k: t("effectiveOwnership.bucketTop100k", "Top 100k"),
    overall: t("effectiveOwnership.bucketOverall", "Overall"),
  };

  return (
    <div>
      <AnalyticsToolbar
        gameweek={gameweek}
        updatedAt={lastUpdated}
        loading={loading}
        onRefresh={gameweek ? () => fetchData(gameweek, bucket) : undefined}
      >
        <Segmented<FPLEOBucket>
          value={bucket}
          onChange={(b) => {
            setBucket(b);
            setShowAll(false);
          }}
          options={(["top10k", "top100k", "overall"] as FPLEOBucket[]).map((b) => ({
            value: b,
            label: bucketLabel[b],
          }))}
        />
      </AnalyticsToolbar>

      {error && <InlineError message={t("fplLive.ui.leagues.loadError", "Couldn't load data. Try refreshing.")} />}

      {loading && rows.length === 0 && <SkeletonRows rows={6} className="border-t border-theme-border" />}

      {!loading && rows.length === 0 && !error && (
        <EmptyState
          className="border-t border-theme-border"
          icon={<Users />}
          title={t("fplLive.ui.leagues.noData", "No data yet for this gameweek.")}
        />
      )}

      {topRows.length > 0 && (
        <>
          <div
            className={cx(
              "grid grid-cols-[1.25rem_minmax(0,1fr)_4.25rem] items-center gap-x-2.5 border-y border-theme-border bg-theme-card-secondary px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-theme-text-muted sm:px-5",
              loading && "opacity-60"
            )}
          >
            <span>#</span>
            <span>{t("bps.thPlayer", "Player")}</span>
            <span className="text-right">{t("fplLive.ui.leagues.ownershipShort", "Owned")}</span>
          </div>
          <div className={cx("divide-y divide-theme-border", loading && "opacity-60")}>
            {visible.map((row, idx) => {
              const el = elementMap.get(row.player_id);
              const net = row.net_transfers_percent / 100;
              return (
                <div
                  key={row.player_id}
                  className="grid grid-cols-[1.25rem_minmax(0,1fr)_4.25rem] items-center gap-x-2.5 px-4 py-2 sm:px-5"
                >
                  <span className="text-[11px] tabular-nums text-theme-text-muted">{idx + 1}</span>
                  <PlayerCell
                    size="sm"
                    player={el}
                    name={el?.web_name || `#${row.player_id}`}
                    meta={
                      <>
                        <span>{POSITION_SHORT[el?.element_type ?? 0] ?? ""}</span>
                        <span aria-hidden>·</span>
                        <span className="tabular-nums">
                          {t("fplLive.ui.leagues.capShort", "C")} {formatPercent(row.captain_percent)}
                        </span>
                        {row.triple_captain_percent > 0 && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="tabular-nums">TC {formatPercent(row.triple_captain_percent)}</span>
                          </>
                        )}
                      </>
                    }
                  />
                  <div className="text-right">
                    <div className="text-sm font-semibold leading-none tabular-nums text-theme-heading-primary">
                      {formatPercent(row.ownership_percent)}
                    </div>
                    {Math.round(Math.abs(net)) > 0 && (
                      <div
                        className={cx(
                          "mt-1 text-[10px] leading-none tabular-nums",
                          net > 0 ? "text-emerald-500" : "text-rose-500"
                        )}
                        title={t("fplLive.ui.leagues.netTransfers", "Net transfers this GW")}
                      >
                        {formatNetTransfers(row.net_transfers_percent)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {topRows.length > COLLAPSED_ROWS && (
            <ShowMoreButton
              expanded={showAll}
              onClick={() => setShowAll((v) => !v)}
              count={topRows.length - COLLAPSED_ROWS}
            />
          )}
        </>
      )}

      <Footnote>
        {t(
          "fplLive.ui.leagues.eoFootnote",
          "Sampled from top managers in the Overall league. Owned = share of the sample with the player in their 15; C = share captaining him. Green/red = net transfers across all of FPL this GW."
        )}
      </Footnote>
    </div>
  );
}
