"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import LoadingCard from "@/components/shared/LoadingCard";
import Image from "next/image";
import { FaCalendarAlt } from "react-icons/fa";

interface WC2026Match {
  id: number;
  home_team: string;
  away_team: string;
  match_date: string;
  phase: string;
  group_name: string;
  venue: string;
  home_score: number | null;
  away_score: number | null;
  status: "Scheduled" | "Live" | "Finished" | "Postponed";
}

const PHASES = [
  "All",
  "Group Stage",
  "Round of 32",
  "Round of 16",
  "Quarter Finals",
  "Semi Finals",
  "Final",
];

const STATUSES = ["All", "Scheduled", "Live", "Finished"];

export default function WC2026Matches() {
  const [matches, setMatches] = useState<WC2026Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phaseFilter, setPhaseFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { t } = useTranslation("wc2026");

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch("/api/wc2026/matches");
      if (!response.ok) {
        throw new Error("Failed to fetch matches");
      }
      const data = await response.json();
      setMatches(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const phaseMatch = phaseFilter === "All" || match.phase === phaseFilter;
      const statusMatch =
        statusFilter === "All" || match.status === statusFilter;
      return phaseMatch && statusMatch;
    });
  }, [matches, phaseFilter, statusFilter]);

  const groupedMatches = useMemo(() => {
    const groups: Record<string, Record<string, WC2026Match[]>> = {};
    filteredMatches.forEach((match) => {
      const phase = match.phase || "Unknown";
      const date = new Date(match.match_date).toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[phase]) groups[phase] = {};
      if (!groups[phase][date]) groups[phase][date] = [];
      groups[phase][date].push(match);
    });
    return groups;
  }, [filteredMatches]);

  const getStatusBadge = (status: WC2026Match["status"]) => {
    switch (status) {
      case "Scheduled":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {t("matches.scheduled", "Scheduled")}
          </span>
        );
      case "Live":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {t("matches.live", "Live")}
          </span>
        );
      case "Finished":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400">
            {t("matches.finished", "Finished")}
          </span>
        );
      case "Postponed":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
            {t("matches.postponed", "Postponed")}
          </span>
        );
      default:
        return null;
    }
  };

  const formatMatchTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingCard title={t("matches.loading", "Loading matches...")} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">
              {t("matches.error", "Error loading matches")}
            </h3>
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <motion.div
        className="bg-theme-card rounded-xl border border-theme-border p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-theme-text-secondary mb-1.5 uppercase tracking-wide">
              {t("matches.phase", "Phase")}
            </label>
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-theme-border bg-theme-background text-theme-foreground text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-all"
            >
              {PHASES.map((phase) => (
                <option key={phase} value={phase}>
                  {phase === "All" ? t("matches.allPhases", "All Phases") : phase}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-theme-text-secondary mb-1.5 uppercase tracking-wide">
              {t("matches.status", "Status")}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-theme-border bg-theme-background text-theme-foreground text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-all"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status === "All"
                    ? t("matches.allStatuses", "All Statuses")
                    : status}
                </option>
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
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >
          {/* Empty State Header */}
          <div className={`relative overflow-hidden rounded-2xl border ${isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white border-gray-200/80"}`}>
            <div className="p-8 text-center">
              <Image
                src="/images/logos/wc-logo.png"
                alt="WC 2026"
                width={48}
                height={28}
                className="h-6 w-auto object-contain mx-auto opacity-50 mb-4"
              />

              {/* Small calendar icon */}
              <div className="mx-auto mb-4 w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/5 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-teal-500/60">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>

              <h3 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent mb-2">
                {t("matches.noMatches", "No matches scheduled")}
              </h3>
              <p className={`text-sm mb-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                {t("matches.noMatchesDescription", "Check back later for upcoming matches.")}
              </p>
              <p className={`text-xs font-medium ${isDark ? "text-gray-600" : "text-gray-300"}`}>
                {t("matches.dateRange", "June 11 - July 19, 2026")}
              </p>
            </div>
          </div>

          {/* Placeholder Match Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { borderColor: "border-t-[#002868]" },
              { borderColor: "border-t-[#006847]" },
              { borderColor: "border-t-[#BF0A30]" },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                className={`rounded-xl border-t-2 border p-5 ${card.borderColor} ${
                  isDark ? "bg-gray-800/30 border-gray-700/40" : "bg-white border-gray-200/60"
                }`}
              >
                {/* Status placeholder */}
                <div className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold mb-4 ${isDark ? "bg-gray-700/50 text-gray-500" : "bg-gray-100 text-gray-300"}`}>
                  {t("matches.scheduled", "Scheduled")}
                </div>

                {/* Team vs Team placeholder */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 text-right">
                    <div className={`inline-block w-14 h-2 rounded-full ${isDark ? "bg-gray-700/50" : "bg-gray-100"}`} />
                  </div>
                  <span className={`text-xs font-bold ${isDark ? "text-gray-600" : "text-gray-300"}`}>vs</span>
                  <div className="flex-1 text-left">
                    <div className={`inline-block w-14 h-2 rounded-full ${isDark ? "bg-gray-700/50" : "bg-gray-100"}`} />
                  </div>
                </div>

                {/* Venue placeholder */}
                <div className="mt-3 text-center">
                  <div className={`inline-block w-20 h-1.5 rounded-full ${isDark ? "bg-gray-700/30" : "bg-gray-100/60"}`} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : (
        Object.entries(groupedMatches).map(([phase, dateGroups], phaseIndex) => (
          <motion.div
            key={phase}
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: phaseIndex * 0.1 }}
          >
            {/* Phase Header */}
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-teal-600 dark:text-teal-400">
                {phase}
              </h3>
              <div className="flex-1 h-px bg-teal-200 dark:bg-teal-800" />
            </div>

            {Object.entries(dateGroups).map(([date, dateMatches]) => (
              <div key={date} className="space-y-3">
                {/* Date Header */}
                <div className="flex items-center gap-2 text-sm font-semibold text-theme-text-secondary">
                  <FaCalendarAlt className="w-3.5 h-3.5" />
                  {date}
                </div>

                {/* Match Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dateMatches.map((match, matchIndex) => (
                    <motion.div
                      key={match.id}
                      className="bg-theme-card rounded-xl border border-theme-border p-4 hover:border-teal-400/40 transition-all duration-200"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: matchIndex * 0.05,
                      }}
                      whileHover={{ scale: 1.01 }}
                    >
                      {/* Top row: status + group badge */}
                      <div className="flex items-center justify-between mb-3">
                        {getStatusBadge(match.status)}
                        {match.phase === "Group Stage" && match.group_name && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400">
                            {match.group_name}
                          </span>
                        )}
                      </div>

                      {/* Teams and Score */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 text-right">
                          <span className="font-bold text-theme-foreground text-sm">
                            {match.home_team}
                          </span>
                        </div>

                        <div className="flex-shrink-0 text-center px-3">
                          {match.status === "Finished" ||
                          match.status === "Live" ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black text-theme-foreground">
                                {match.home_score}
                              </span>
                              <span className="text-theme-text-secondary font-bold">
                                -
                              </span>
                              <span className="text-xl font-black text-theme-foreground">
                                {match.away_score}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                              {formatMatchTime(match.match_date)}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 text-left">
                          <span className="font-bold text-theme-foreground text-sm">
                            {match.away_team}
                          </span>
                        </div>
                      </div>

                      {/* Venue */}
                      {match.venue && (
                        <div className="mt-3 text-center">
                          <span className="text-xs text-theme-text-secondary">
                            {match.venue}
                          </span>
                        </div>
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
