"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdArrowBack, MdRefresh } from "react-icons/md";
import Link from "next/link";
import LoadingCard from "@/components/shared/LoadingCard";
import type { FPLXPointsPrediction } from "@/types/fpl";

interface BootstrapElement {
  id: number;
  web_name: string;
  element_type: number;
  team: number;
}

const POSITION_LABEL: Record<number, string> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

type TabKey = "xpts" | "captaincy" | "bonus";

export default function PredictionsPage() {
  const { t } = useTranslation("fpl");
  const [gameweek, setGameweek] = useState<number | null>(null);
  const [predictions, setPredictions] = useState<FPLXPointsPrediction[]>([]);
  const [elements, setElements] = useState<BootstrapElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("xpts");

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

  const elementMap = new Map(elements.map((el) => [el.id, el]));

  const sorted = [...predictions].sort((a, b) => {
    if (tab === "captaincy") return b.captaincy_score - a.captaincy_score;
    if (tab === "bonus") return b.bonus_probability - a.bonus_probability;
    return b.expected_points - a.expected_points;
  });

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
            {t("predictions.title", "xPts Predictions")}
          </h1>
          {gameweek && (
            <p className="text-sm text-theme-text-secondary">
              GW {gameweek}
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
            onClick={() => fetchPredictions(gameweek)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-md disabled:opacity-50"
          >
            <MdRefresh className="w-4 h-4" />
            {t("leagueTables.refresh", "Refresh")}
          </button>
        )}
      </header>

      <div className="inline-flex rounded-md border border-theme-border overflow-hidden">
        <button
          onClick={() => setTab("xpts")}
          className={`px-3 py-1.5 text-sm ${
            tab === "xpts"
              ? "bg-purple-600 text-white"
              : "bg-theme-card text-theme-foreground"
          }`}
        >
          {t("predictions.expectedPoints", "xPts")}
        </button>
        <button
          onClick={() => setTab("captaincy")}
          className={`px-3 py-1.5 text-sm border-l border-theme-border ${
            tab === "captaincy"
              ? "bg-purple-600 text-white"
              : "bg-theme-card text-theme-foreground"
          }`}
        >
          {t("predictions.captaincyScore", "Captaincy")}
        </button>
        <button
          onClick={() => setTab("bonus")}
          className={`px-3 py-1.5 text-sm border-l border-theme-border ${
            tab === "bonus"
              ? "bg-purple-600 text-white"
              : "bg-theme-card text-theme-foreground"
          }`}
        >
          {t("predictions.bonusProbability", "Bonus Prob.")}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && predictions.length === 0 && <LoadingCard title="" description="" />}

      {predictions.length > 0 && (
        <div className="bg-theme-card border border-theme-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-theme-card-secondary text-theme-text-secondary uppercase">
                <tr>
                  <th className="px-2 py-2 text-left">#</th>
                  <th className="px-2 py-2 text-left">Player</th>
                  <th className="px-2 py-2 text-center">Pos</th>
                  <th className="px-2 py-2 text-right">xPts</th>
                  <th className="px-2 py-2 text-right">
                    {t("predictions.captaincyScore", "Captaincy")}
                  </th>
                  <th className="px-2 py-2 text-right">
                    {t("predictions.bonusProbability", "Bonus Prob.")}
                  </th>
                  <th className="px-2 py-2 text-right">
                    {t("predictions.minutesExpected", "Min Exp.")}
                  </th>
                  <th className="px-2 py-2 text-right">
                    {t("predictions.csProbability", "CS Prob.")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 80).map((p, idx) => {
                  const el = elementMap.get(p.player_id);
                  return (
                    <tr
                      key={p.player_id}
                      className="border-t border-theme-border"
                    >
                      <td className="px-2 py-2 font-bold">{idx + 1}</td>
                      <td className="px-2 py-2 font-medium text-theme-foreground truncate max-w-[140px]">
                        {p.web_name || el?.web_name || `#${p.player_id}`}
                      </td>
                      <td className="px-2 py-2 text-center text-theme-text-secondary">
                        {POSITION_LABEL[el?.element_type || 3] || ""}
                      </td>
                      <td className="px-2 py-2 text-right font-bold">
                        {p.expected_points.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {p.captaincy_score.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {(p.bonus_probability * 100).toFixed(0)}%
                      </td>
                      <td className="px-2 py-2 text-right">
                        {p.components.minutes_expected.toFixed(0)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {(p.components.cs_probability * 100).toFixed(0)}%
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
          "predictions.disclaimer",
          "MVP heuristic blending form, ICT, xG/xA and clean-sheet probability. Not ML-grade."
        )}
      </p>
    </div>
  );
}
