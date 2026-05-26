"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import LoadingCard from "@/components/shared/LoadingCard";
import { getCountryFlagCode } from "@/utils/countryMapping";
import { localizeTeamName } from "@/utils/wc2026-team-names";
import Image from "next/image";
import { Calendar } from "lucide-react";

function TeamFlag({ name, size = 20 }: { name: string; size?: number }) {
  const code = getCountryFlagCode(name);
  if (code === "xx") return null;
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={name}
      width={size}
      height={Math.round(size * 0.67)}
      className="rounded-sm object-cover inline-block"
      style={{ width: size, height: Math.round(size * 0.67) }}
    />
  );
}

interface WC2026Match {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  phase: string;
  group_name: string | null;
  venue: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
}

const PHASE_KEYS = [
  "all",
  "group_stage",
  "round_of_32",
  "round_of_16",
  "quarter_finals",
  "semi_finals",
  "third_place",
  "final",
];

const STATUS_KEYS = ["all", "scheduled", "live", "finished", "postponed"];

export default function WC2026Matches() {
  const [matches, setMatches] = useState<WC2026Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { t, i18n } = useTranslation("wc2026");
  const lang = (i18n.language === "en" ? "en" : "bs") as "en" | "bs";

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch("/api/wc2026/matches");
      if (!response.ok) throw new Error("Failed to fetch matches");
      const data = await response.json();
      setMatches(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const phaseName = (key: string) => t(`matches.phases.${key}`, key);
  const statusName = (key: string) => t(`matches.statuses.${key}`, key);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      const phaseOk = phaseFilter === "all" || m.phase === phaseFilter;
      const statusOk = statusFilter === "all" || m.status === statusFilter;
      return phaseOk && statusOk;
    });
  }, [matches, phaseFilter, statusFilter]);

  const groupedMatches = useMemo(() => {
    const groups: Record<string, Record<string, WC2026Match[]>> = {};
    filteredMatches.forEach((m) => {
      const phase = m.phase || "unknown";
      const date = new Date(m.match_date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!groups[phase]) groups[phase] = {};
      if (!groups[phase][date]) groups[phase][date] = [];
      groups[phase][date].push(m);
    });
    return groups;
  }, [filteredMatches]);

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "live")
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          {t("matches.statuses.live")}
        </span>
      );
    if (s === "finished")
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400">
          {t("matches.statuses.finished")}
        </span>
      );
    if (s === "postponed")
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
          {t("matches.statuses.postponed")}
        </span>
      );
    return null;
  };

  if (loading) return <LoadingCard title={t("matches.loading")} />;

  if (error) {
    return (
      <div className={`rounded-xl border p-6 ${isDark ? "bg-red-900/10 border-red-800/30" : "bg-red-50 border-red-200"}`}>
        <p className={`text-sm ${isDark ? "text-red-400" : "text-red-600"}`}>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border p-4 ${isDark ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"}`}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              {t("matches.filterByPhase")}
            </label>
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/30 ${
                isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
              }`}
            >
              {PHASE_KEYS.map((k) => (
                <option key={k} value={k}>{phaseName(k)}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              {t("matches.filterByStatus")}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/30 ${
                isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
              }`}
            >
              {STATUS_KEYS.map((k) => (
                <option key={k} value={k}>{statusName(k)}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Matches */}
      {Object.keys(groupedMatches).length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border p-10 text-center ${isDark ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"}`}
        >
          <Image src="/images/logos/wc-logo.png" alt="WC" width={48} height={28} className="h-6 w-auto object-contain mx-auto opacity-40 mb-4" />
          <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>{t("matches.noMatches")}</p>
        </motion.div>
      ) : (
        Object.entries(groupedMatches).map(([phase, dateGroups], pi) => (
          <motion.div
            key={phase}
            className="space-y-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: pi * 0.05 }}
          >
            {/* Phase Header */}
            <div className="flex items-center gap-3">
              <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-teal-400" : "text-teal-600"}`}>
                {phaseName(phase)}
              </h3>
              <div className={`flex-1 h-px ${isDark ? "bg-gray-800" : "bg-gray-200"}`} />
            </div>

            {Object.entries(dateGroups).map(([date, dateMatches]) => (
              <div key={date} className="space-y-2">
                <div className={`flex items-center gap-2 text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  <Calendar className="w-3.5 h-3.5" />
                  {date}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {dateMatches.map((match, mi) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: mi * 0.03 }}
                      className={`rounded-xl border p-4 transition-all hover:shadow-md ${
                        isDark
                          ? "bg-gray-900/50 border-gray-800 hover:border-teal-500/20"
                          : "bg-white border-gray-200 hover:border-teal-400/30"
                      }`}
                    >
                      {/* Status + Group badge */}
                      <div className="flex items-center justify-between mb-3">
                        {getStatusBadge(match.status)}
                        {match.group_name && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                            {t("groups.group")} {match.group_name}
                          </span>
                        )}
                      </div>

                      {/* Teams */}
                      <div className="flex items-center gap-3">
                        {/* Home */}
                        <div className="flex-1 flex items-center justify-end gap-2">
                          <span className={`text-sm font-bold text-right ${isDark ? "text-white" : "text-gray-900"}`}>
                            {localizeTeamName(match.home_team, lang)}
                          </span>
                          <TeamFlag name={match.home_team} />
                        </div>

                        {/* Score / Time */}
                        <div className="flex-shrink-0 w-16 text-center">
                          {match.status === "finished" || match.status === "live" ? (
                            <span className={`text-lg font-black ${isDark ? "text-white" : "text-gray-900"}`}>
                              {match.home_score} - {match.away_score}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded">
                              {formatTime(match.match_date)}
                            </span>
                          )}
                        </div>

                        {/* Away */}
                        <div className="flex-1 flex items-center gap-2">
                          <TeamFlag name={match.away_team} />
                          <span className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                            {localizeTeamName(match.away_team, lang)}
                          </span>
                        </div>
                      </div>

                      {/* Venue */}
                      {match.venue && (
                        <p className={`text-center text-[11px] mt-2.5 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                          {match.venue}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        ))
      )}
    </div>
  );
}
