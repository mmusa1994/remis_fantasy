"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp } from "lucide-react";
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
import type { FPLXPointsPrediction } from "@/types/fpl";

interface BootstrapElement {
  id: number;
  web_name: string;
  element_type: number;
  team: number;
  team_code?: number;
}

type TabKey = "xpts" | "captaincy" | "bonus";

const COLLAPSED_ROWS = 25;
const MAX_ROWS = 80;

export default function XptsPredictionsPanel() {
  const { t } = useTranslation("fpl");
  const [gameweek, setGameweek] = useState<number | null>(null);
  const [predictions, setPredictions] = useState<FPLXPointsPrediction[]>([]);
  const [elements, setElements] = useState<BootstrapElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("xpts");
  const [showAll, setShowAll] = useState(false);

  const detectGameweek = useCallback(async () => {
    const res = await fetch("/api/fpl/bootstrap-static");
    const json = await res.json();
    if (json?.success && json.data) {
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

  const fetchPredictions = useCallback(async (gw: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fpl/xpts-predictions?gw=${gw}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load");
      setPredictions(json.data.predictions || []);
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
      if (gw) await fetchPredictions(gw);
      else setLoading(false);
    })();
  }, [detectGameweek, fetchPredictions]);

  const elementMap = useMemo(() => new Map(elements.map((el) => [el.id, el])), [elements]);

  const sorted = useMemo(
    () =>
      [...predictions]
        .sort((a, b) => {
          if (tab === "captaincy") return b.captaincy_score - a.captaincy_score;
          if (tab === "bonus") return b.bonus_probability - a.bonus_probability;
          return b.expected_points - a.expected_points;
        })
        .slice(0, MAX_ROWS),
    [predictions, tab]
  );
  const visible = showAll ? sorted : sorted.slice(0, COLLAPSED_ROWS);

  const primary = (p: FPLXPointsPrediction) =>
    tab === "captaincy"
      ? p.captaincy_score.toFixed(1)
      : tab === "bonus"
        ? `${Math.round(p.bonus_probability * 100)}%`
        : p.expected_points.toFixed(1);

  const secondary = (p: FPLXPointsPrediction) =>
    tab === "xpts"
      ? `${t("fplLive.ui.leagues.capShort", "C")} ${p.captaincy_score.toFixed(1)}`
      : `xP ${p.expected_points.toFixed(1)}`;

  const columnLabel =
    tab === "captaincy"
      ? t("predictions.captaincyScore", "Captaincy")
      : tab === "bonus"
        ? t("fplLive.ui.leagues.bonusChance", "Bonus %")
        : "xPts";

  return (
    <div>
      <AnalyticsToolbar
        gameweek={gameweek}
        updatedAt={lastUpdated}
        loading={loading}
        onRefresh={gameweek ? () => fetchPredictions(gameweek) : undefined}
      >
        <Segmented<TabKey>
          value={tab}
          onChange={(next) => {
            setTab(next);
            setShowAll(false);
          }}
          options={[
            { value: "xpts", label: t("predictions.expectedPoints", "xPts") },
            { value: "captaincy", label: t("predictions.captaincyScore", "Captaincy") },
            { value: "bonus", label: t("predictions.bonusProbability", "Bonus Prob.") },
          ]}
        />
      </AnalyticsToolbar>

      {error && <InlineError message={t("fplLive.ui.leagues.loadError", "Couldn't load data. Try refreshing.")} />}

      {loading && predictions.length === 0 && <SkeletonRows rows={6} className="border-t border-theme-border" />}

      {!loading && predictions.length === 0 && !error && (
        <EmptyState
          className="border-t border-theme-border"
          icon={<TrendingUp />}
          title={t("fplLive.ui.leagues.noData", "No data yet for this gameweek.")}
        />
      )}

      {sorted.length > 0 && (
        <>
          <div className="grid grid-cols-[1.25rem_minmax(0,1fr)_3.75rem] items-center gap-x-2.5 border-y border-theme-border bg-theme-card-secondary px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-theme-text-muted sm:px-5">
            <span>#</span>
            <span>{t("bps.thPlayer", "Player")}</span>
            <span className="text-right">{columnLabel}</span>
          </div>
          <div className={cx("divide-y divide-theme-border", loading && "opacity-60")}>
            {visible.map((p, idx) => {
              const el = elementMap.get(p.player_id);
              return (
                <div
                  key={p.player_id}
                  className="grid grid-cols-[1.25rem_minmax(0,1fr)_3.75rem] items-center gap-x-2.5 px-4 py-2 sm:px-5"
                >
                  <span className="text-[11px] tabular-nums text-theme-text-muted">{idx + 1}</span>
                  <PlayerCell
                    size="sm"
                    player={el}
                    name={p.web_name || el?.web_name || `#${p.player_id}`}
                    meta={
                      <>
                        <span>{POSITION_SHORT[el?.element_type ?? 0] ?? ""}</span>
                        <span aria-hidden>·</span>
                        <span className="tabular-nums">
                          {Math.round(p.components.minutes_expected)}&apos;
                        </span>
                        {el && el.element_type <= 2 && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="tabular-nums">
                              {t("fplLive.ui.leagues.csShort", "CS")}{" "}
                              {Math.round(p.components.cs_probability * 100)}%
                            </span>
                          </>
                        )}
                      </>
                    }
                  />
                  <div className="text-right">
                    <div className="text-sm font-semibold leading-none tabular-nums text-theme-heading-primary">
                      {primary(p)}
                    </div>
                    <div className="mt-1 text-[10px] leading-none tabular-nums text-theme-text-muted">
                      {secondary(p)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {sorted.length > COLLAPSED_ROWS && (
            <ShowMoreButton
              expanded={showAll}
              onClick={() => setShowAll((v) => !v)}
              count={sorted.length - COLLAPSED_ROWS}
            />
          )}
        </>
      )}

      <Footnote>
        {t(
          "predictions.disclaimer",
          "MVP heuristic blending form, ICT, xG/xA and clean-sheet probability. Not ML-grade."
        )}
      </Footnote>
    </div>
  );
}
