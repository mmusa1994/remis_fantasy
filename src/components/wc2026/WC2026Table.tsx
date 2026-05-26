"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import LoadingCard from "@/components/shared/LoadingCard";

interface WC2026Player {
  id: number;
  rank: number;
  team_name: string;
  user_name: string;
  avatar_url: string;
  member_number: number;
  points: number;
  last_md_points: number;
  is_winner: boolean;
  is_loser: boolean;
  is_tie: boolean;
}

export default function WC2026Table() {
  const [players, setPlayers] = useState<WC2026Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const { t } = useTranslation("wc2026");
  const isDark = theme === "dark";

  useEffect(() => {
    fetchTableData();
  }, []);

  const fetchTableData = async () => {
    try {
      const response = await fetch("/api/wc2026/table");
      if (!response.ok) throw new Error("Failed to fetch table data");
      const data = await response.json();
      setPlayers(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: "bg-amber-50 dark:bg-amber-900/10", border: "border-l-2 border-amber-400", badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" };
    if (rank === 2) return { bg: "bg-gray-50 dark:bg-gray-800/30", border: "border-l-2 border-gray-300 dark:border-gray-600", badge: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300" };
    if (rank === 3) return { bg: "bg-orange-50/50 dark:bg-orange-900/10", border: "border-l-2 border-orange-300 dark:border-orange-700", badge: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" };
    return { bg: "", border: "border-l-2 border-transparent", badge: `${isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"}` };
  };

  if (loading) {
    return <LoadingCard title={t("table.loading")} />;
  }

  if (error) {
    return (
      <div className={`rounded-xl border p-6 ${isDark ? "bg-red-900/10 border-red-800/30" : "bg-red-50 border-red-200"}`}>
        <p className={`text-sm ${isDark ? "text-red-400" : "text-red-600"}`}>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Prize Summary — subtle, elegant */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`rounded-xl border p-5 ${isDark ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              REMIS WC 2026 Fantasy
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              {t("table.currentStandings")}
            </p>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: "1.", value: "TBD", color: "text-amber-600 dark:text-amber-400" },
              { label: "2.", value: "TBD", color: "text-gray-500 dark:text-gray-400" },
              { label: "3.", value: "TBD", color: "text-orange-600 dark:text-orange-400" },
            ].map((p) => (
              <div key={p.label} className="text-center">
                <span className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? "text-gray-600" : "text-gray-400"}`}>{p.label}</span>
                <p className={`text-sm font-bold ${p.color}`}>{p.value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className={`rounded-xl border overflow-hidden ${isDark ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"}`}
      >
        {/* Desktop Header */}
        <div className={`hidden md:grid grid-cols-12 gap-4 items-center px-5 py-3 text-[11px] font-semibold uppercase tracking-wider ${isDark ? "text-gray-500 border-b border-gray-800" : "text-gray-400 border-b border-gray-100"}`}>
          <div className="col-span-1">{t("table.rank")}</div>
          <div className="col-span-6">{t("table.player")}</div>
          <div className="col-span-2 text-center">{t("table.lastMD")}</div>
          <div className="col-span-2 text-center">{t("table.total")}</div>
          <div className="col-span-1 text-center">{t("table.prize")}</div>
        </div>

        {players.length === 0 ? (
          <div className={`py-16 text-center ${isDark ? "text-gray-600" : "text-gray-400"}`}>
            <p className="text-sm">{t("table.noData")}</p>
          </div>
        ) : (
          <div>
            {/* Desktop rows */}
            <div className="hidden md:block">
              {players.map((player, index) => {
                const style = getRankStyle(player.rank);
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    className={`grid grid-cols-12 gap-4 items-center px-5 py-3 transition-colors ${style.bg} ${style.border} ${isDark ? "hover:bg-gray-800/40" : "hover:bg-gray-50"}`}
                  >
                    <div className="col-span-1">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold ${style.badge}`}>
                        {player.rank}
                      </span>
                    </div>
                    <div className="col-span-6">
                      <div className="flex items-center gap-3">
                        <img src={player.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                        <div>
                          <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{player.team_name}</p>
                          <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>{player.user_name}</p>
                        </div>
                      </div>
                    </div>
                    <div className={`col-span-2 text-center text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {player.last_md_points}
                    </div>
                    <div className="col-span-2 text-center text-sm font-bold text-teal-600 dark:text-teal-400">
                      {player.points}
                    </div>
                    <div className="col-span-1 text-center">
                      {player.rank <= 3 && (
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">TBD</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {players.map((player, index) => {
                const style = getRankStyle(player.rank);
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={`p-4 ${style.bg} ${style.border}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold ${style.badge}`}>
                          {player.rank}
                        </span>
                        <img src={player.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                        <div>
                          <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{player.team_name}</p>
                          <p className={`text-[11px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>{player.user_name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className={isDark ? "text-gray-500" : "text-gray-400"}>
                        {t("table.lastMD")}: <span className={`font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>{player.last_md_points}</span>
                      </span>
                      <span className={isDark ? "text-gray-500" : "text-gray-400"}>
                        {t("table.total")}: <span className="font-bold text-teal-600 dark:text-teal-400">{player.points}</span>
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className={`text-center text-xs ${isDark ? "text-gray-600" : "text-gray-400"}`}
      >
        {t("table.updatedInfo")}
      </motion.p>
    </div>
  );
}
