"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import {
  MdTrendingUp,
  MdTrendingDown,
} from "react-icons/md";
import LoadingCard from "@/components/shared/LoadingCard";

interface Entry {
  rank: number;
  team_name: string;
  manager_name: string;
  points: number;
  last_rank: number | null;
}

type Season = "25" | "26";

const MEDAL_COLORS: Record<number, string> = {
  1: "#D4AF37",
  2: "#A8A8A8",
  3: "#CD7F32",
};

export default function F1TabeleFromDBPage() {
  const { theme } = useTheme();
  const { t } = useTranslation("f1");
  const isDark = theme === "dark";
  const [season, setSeason] = useState<Season>("26");
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextRace, setNextRace] = useState<string>("");
  const [lastRace, setLastRace] = useState<string>("");

  const accent = season === "26" ? "#E10600" : "#782e2e";

  const loadData = useCallback(async (s: Season) => {
    try {
      setLoading(true);
      setError(null);
      const [tableRes, raceInfoRes] = await Promise.all([
        fetch(`/api/f1/table?season=${s}`),
        fetch(`/api/f1/race-info?season=${s}`),
      ]);
      const tableJson = await tableRes.json();
      if (!tableJson.success) throw new Error(tableJson.error || "Failed to fetch");
      setEntries(tableJson.data.standings || []);
      setLastUpdated(tableJson.data.lastUpdated || null);
      const raceInfoJson = await raceInfoRes.json();
      if (raceInfoJson.success) {
        setNextRace(raceInfoJson.data.nextRace);
        setLastRace(raceInfoJson.data.lastRace);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(season);
  }, [season, loadData]);

  const getMovement = (rank: number, lastRank: number | null) => {
    if (!lastRank || lastRank === rank) return { type: "same" as const, change: 0 };
    if (rank < lastRank) return { type: "up" as const, change: lastRank - rank };
    return { type: "down" as const, change: rank - lastRank };
  };

  if (loading && !entries.length) {
    return (
      <div className="min-h-screen bg-theme-background">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <LoadingCard title={t("leaderboard.loading")} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-background">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{t("leaderboard.error")}</p>
          <p className="text-theme-text-secondary mb-6">{error}</p>
          <button
            onClick={() => location.reload()}
            className="px-5 py-2.5 font-anta uppercase tracking-widest text-xs text-white transition-colors"
            style={{ backgroundColor: accent }}
          >
            {t("leaderboard.retry")}
          </button>
        </div>
      </div>
    );
  }

  const prizes26 = [
    { place: "1.", pct: "35%", extra: `${t("prizes.trophyLabel")} + ${t("prizes.shirtLabel")}`, color: MEDAL_COLORS[1] },
    { place: "2.", pct: "25%", extra: t("prizes.modelCarLabel"), color: MEDAL_COLORS[2] },
    { place: "3.", pct: "15%", extra: t("prizes.keychainLabel"), color: MEDAL_COLORS[3] },
  ];

  const prizes25 = [
    { place: "1.", amount: "120 KM", color: MEDAL_COLORS[1] },
    { place: "2.", amount: "80 KM", color: MEDAL_COLORS[2] },
    { place: "3.", amount: "60 KM", color: MEDAL_COLORS[3] },
  ];

  return (
    <div className="min-h-screen bg-theme-background">
      <div className="container mx-auto px-4 py-10 max-w-3xl">

        {/* ── Title ── */}
        <div className="text-center mb-2">
          <h1
            className="font-anta uppercase tracking-[0.2em] text-3xl md:text-4xl"
            style={{ color: accent }}
          >
            {t("pageTitle")}
          </h1>
        </div>

        {/* ── Season Tabs ── */}
        <div className="flex items-center justify-center gap-8 mb-8">
          {(["25", "26"] as Season[]).map((s) => {
            const isActive = season === s;
            const tabAccent = s === "26" ? "#E10600" : "#782e2e";
            return (
              <button
                key={s}
                onClick={() => setSeason(s)}
                className="relative py-3 font-anta uppercase tracking-[0.15em] text-sm transition-all duration-300"
                style={{
                  color: isActive
                    ? tabAccent
                    : isDark
                    ? "rgba(255,255,255,0.55)"
                    : "rgba(0,0,0,0.45)",
                }}
              >
                20{s}
                {s === "25" && !isActive && (
                  <span
                    className="ml-1.5 text-[10px] tracking-wider"
                    style={{ opacity: 0.5 }}
                  >
                    {t("seasonCompleted")}
                  </span>
                )}
                {/* Underline indicator */}
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-300"
                  style={{
                    backgroundColor: isActive ? tabAccent : "transparent",
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* ── Race Info ── */}
        <div className="text-center mb-8">
          <p
            className={`font-anta text-sm tracking-wide ${
              isDark ? "text-white/70" : "text-black/60"
            }`}
          >
            {t("nextLast", { next: nextRace, last: lastRace })}
          </p>
        </div>

        {/* ── Prize Strip ── */}
        <div
          className={`grid grid-cols-3 divide-x mb-10 ${
            isDark ? "divide-white/[0.06]" : "divide-black/[0.06]"
          }`}
        >
          {season === "26"
            ? prizes26.map((p, i) => (
                <div key={i} className="text-center py-4 px-2">
                  <span
                    className="block font-anta text-[11px] uppercase tracking-[0.2em] mb-1"
                    style={{ color: p.color }}
                  >
                    {p.place}
                  </span>
                  <span
                    className="block font-anta text-2xl md:text-3xl leading-none mb-1"
                    style={{ color: accent }}
                  >
                    {p.pct}
                  </span>
                  <span
                    className={`block text-[10px] tracking-wide ${
                      isDark ? "text-white/50" : "text-black/45"
                    }`}
                  >
                    + {p.extra}
                  </span>
                </div>
              ))
            : prizes25.map((p, i) => (
                <div key={i} className="text-center py-4 px-2">
                  <span
                    className="block font-anta text-[11px] uppercase tracking-[0.2em] mb-1"
                    style={{ color: p.color }}
                  >
                    {p.place}
                  </span>
                  <span
                    className={`block font-anta text-2xl md:text-3xl leading-none ${
                      isDark ? "text-white/90" : "text-black/80"
                    }`}
                  >
                    {p.amount}
                  </span>
                </div>
              ))}
        </div>

        {/* ── Leaderboard ── */}
        {entries.length === 0 ? (
          <div
            className={`text-center py-16 border ${
              isDark ? "border-white/[0.08]" : "border-black/[0.08]"
            }`}
          >
            <p
              className={`font-anta text-sm uppercase tracking-widest ${
                isDark ? "text-white/25" : "text-black/25"
              }`}
            >
              {t("leaderboard.loading")}
            </p>
          </div>
        ) : (
          <div
            className={`border overflow-hidden ${
              isDark ? "border-white/[0.08]" : "border-black/[0.08]"
            }`}
          >
            {/* Column Header */}
            <div
              className={`flex items-center px-4 md:px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-medium ${
                isDark
                  ? "text-white/45 bg-white/[0.03] border-b border-white/[0.08]"
                  : "text-black/40 bg-black/[0.02] border-b border-black/[0.08]"
              }`}
            >
              <span className="w-8">#</span>
              <span className="w-10" />
              <span className="flex-1">{t("leaderboard.player")}</span>
              <span className="flex-1 text-right hidden sm:block">{t("leaderboard.team")}</span>
              <span className="w-20 text-right">{t("leaderboard.points")}</span>
            </div>

            {/* Rows */}
            {entries.map((entry, index) => {
              const movement = getMovement(entry.rank, entry.last_rank ?? null);
              const medalColor = MEDAL_COLORS[entry.rank];
              const isTop3 = entry.rank <= 3;
              const isFirst = entry.rank === 1;

              // Bottom glow: medal color for top 3, subtle neutral for rest
              const glowColor = isFirst
                ? isDark
                  ? "0 1px 12px -2px rgba(212,175,55,0.25), 0 1px 4px -1px rgba(212,175,55,0.15)"
                  : "0 1px 10px -2px rgba(212,175,55,0.2), 0 1px 4px -1px rgba(212,175,55,0.1)"
                : isTop3
                ? isDark
                  ? `0 1px 8px -2px ${medalColor}22, 0 1px 3px -1px ${medalColor}18`
                  : `0 1px 6px -2px ${medalColor}1a, 0 1px 3px -1px ${medalColor}12`
                : isDark
                ? "0 1px 4px -2px rgba(255,255,255,0.04)"
                : "0 1px 4px -2px rgba(0,0,0,0.03)";

              return (
                <div
                  key={`${entry.rank}-${entry.team_name}`}
                  className={`group relative flex items-center h-[58px] px-4 md:px-5 transition-all duration-200 ${
                    index > 0
                      ? isDark
                        ? "border-t border-white/[0.06]"
                        : "border-t border-black/[0.06]"
                      : ""
                  } ${
                    isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]"
                  } ${
                    isFirst
                      ? isDark
                        ? "bg-gradient-to-r from-[#D4AF37]/[0.06] via-transparent to-[#D4AF37]/[0.03]"
                        : "bg-gradient-to-r from-[#D4AF37]/[0.05] via-transparent to-[#D4AF37]/[0.02]"
                      : ""
                  }`}
                  style={{ boxShadow: glowColor }}
                >
                  {/* Left accent — top 3 only */}
                  {isTop3 && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-[2px]"
                      style={{
                        backgroundColor: medalColor,
                        boxShadow: isFirst
                          ? `1px 0 8px 0 ${medalColor}40`
                          : `1px 0 4px 0 ${medalColor}20`,
                      }}
                    />
                  )}

                  {/* Rank */}
                  <div className="w-8 shrink-0">
                    {isTop3 ? (
                      <span
                        className="font-anta text-base font-bold"
                        style={{ color: medalColor }}
                      >
                        {entry.rank}
                      </span>
                    ) : (
                      <span
                        className={`font-anta text-sm ${
                          isDark ? "text-white/50" : "text-black/45"
                        }`}
                      >
                        {entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Movement */}
                  <div className="w-10 shrink-0 flex items-center">
                    {movement.type === "up" && (
                      <span className="flex items-center gap-0.5 text-emerald-500">
                        <MdTrendingUp className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-anta">{movement.change}</span>
                      </span>
                    )}
                    {movement.type === "down" && (
                      <span className="flex items-center gap-0.5 text-red-400">
                        <MdTrendingDown className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-anta">{movement.change}</span>
                      </span>
                    )}
                    {movement.type === "same" && (
                      <span
                        className={`text-[10px] font-anta ${
                          isDark ? "text-white/30" : "text-black/25"
                        }`}
                      >
                        —
                      </span>
                    )}
                  </div>

                  {/* Manager */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={`font-anta text-sm tracking-wide truncate block ${
                        isFirst
                          ? "text-[#D4AF37]"
                          : isTop3
                          ? isDark
                            ? "text-white"
                            : "text-black"
                          : isDark
                          ? "text-white/90"
                          : "text-black/80"
                      }`}
                    >
                      {entry.manager_name}
                    </span>
                    {/* Team name — mobile only */}
                    <span
                      className={`sm:hidden block text-[10px] font-anta uppercase tracking-wider mt-0.5 truncate ${
                        isDark ? "text-white/40" : "text-black/35"
                      }`}
                    >
                      {entry.team_name}
                    </span>
                  </div>

                  {/* Team — desktop */}
                  <div className="flex-1 text-right min-w-0 hidden sm:block">
                    <span
                      className={`font-anta text-xs uppercase tracking-wider truncate block ${
                        isDark ? "text-white/45" : "text-black/40"
                      }`}
                    >
                      {entry.team_name}
                    </span>
                  </div>

                  {/* Points */}
                  <div className="w-20 text-right">
                    <span
                      className={`font-anta text-base tabular-nums ${
                        isFirst
                          ? "text-[#D4AF37] font-bold"
                          : isTop3
                          ? isDark
                            ? "text-white"
                            : "text-black"
                          : isDark
                          ? "text-white/80"
                          : "text-black/70"
                      }`}
                    >
                      {entry.points.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="text-center mt-8">
          <p
            className={`text-[11px] tracking-wider ${
              isDark ? "text-white/40" : "text-black/35"
            }`}
          >
            {t("leaderboard.lastUpdated")}{" "}
            {lastUpdated
              ? new Date(lastUpdated).toLocaleString("sr-RS")
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
