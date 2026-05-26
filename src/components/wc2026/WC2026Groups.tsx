"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import LoadingCard from "@/components/shared/LoadingCard";
import Image from "next/image";

interface WC2026GroupTeam {
  id: number;
  group_name: string;
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export default function WC2026Groups() {
  const [teams, setTeams] = useState<WC2026GroupTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const { t } = useTranslation("wc2026");

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/wc2026/groups");
      if (!response.ok) {
        throw new Error("Failed to fetch group data");
      }
      const data = await response.json();
      setTeams(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const groupedData = useMemo(() => {
    const groups: Record<string, WC2026GroupTeam[]> = {};
    teams.forEach((team) => {
      const groupName = team.group_name;
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(team);
    });
    // Sort teams within each group by points (desc), then goal difference (desc)
    Object.keys(groups).forEach((group) => {
      groups[group].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference)
          return b.goal_difference - a.goal_difference;
        return b.goals_for - a.goals_for;
      });
    });
    return groups;
  }, [teams]);

  const sortedGroupNames = useMemo(() => {
    return Object.keys(groupedData).sort();
  }, [groupedData]);

  const getRowHighlight = (index: number) => {
    if (index < 2) {
      return "bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500";
    }
    if (index === 2) {
      return "bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-500";
    }
    return "";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingCard
          title={t("groups.loading", "Loading group standings...")}
        />
      </div>
    );
  }

  const isDark = theme === "dark";

  const placeholderGroups = [
    { name: "A", borderColor: "border-t-[#002868]" },
    { name: "B", borderColor: "border-t-[#006847]" },
    { name: "C", borderColor: "border-t-[#BF0A30]" },
  ];

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">
              {t("groups.error", "Error loading groups")}
            </h3>
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (sortedGroupNames.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header Card */}
        <div className={`relative overflow-hidden rounded-2xl border ${isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white border-gray-200/80"}`}>
          <div className="p-8 text-center">
            <Image
              src="/images/logos/wc-logo.png"
              alt="WC 2026"
              width={48}
              height={28}
              className="h-6 w-auto object-contain mx-auto opacity-50 mb-4"
            />
            <h3 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent mb-2">
              {t("groups.noData", "No group data available")}
            </h3>
            <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              {t("groups.noDataDescription", "Group standings will appear once the tournament begins.")}
            </p>
          </div>
        </div>

        {/* Placeholder Group Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {placeholderGroups.map((group, i) => (
            <motion.div
              key={group.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
              className={`rounded-xl border-t-2 border overflow-hidden ${group.borderColor} ${
                isDark ? "bg-gray-800/30 border-gray-700/40" : "bg-white border-gray-200/60"
              }`}
            >
              <div className="px-4 py-3">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {t("groups.group", "Group")} {group.name}
                </h4>
              </div>
              <div className="px-4 pb-3">
                <div className={`flex text-[10px] font-semibold uppercase tracking-wide mb-2 ${isDark ? "text-gray-600" : "text-gray-300"}`}>
                  <span className="flex-1">{t("groups.team", "Team")}</span>
                  <span className="w-6 text-center">P</span>
                  <span className="w-6 text-center">W</span>
                  <span className="w-6 text-center">D</span>
                  <span className="w-6 text-center">L</span>
                  <span className="w-8 text-center">Pts</span>
                </div>
                {[0, 1, 2, 3].map((row) => (
                  <div key={row} className={`flex items-center py-1.5 text-xs ${isDark ? "text-gray-700" : "text-gray-200"}`}>
                    <span className="flex-1">
                      <span className={`inline-block w-16 h-2 rounded-full ${isDark ? "bg-gray-700/50" : "bg-gray-100"}`} />
                    </span>
                    <span className="w-6 text-center">-</span>
                    <span className="w-6 text-center">-</span>
                    <span className="w-6 text-center">-</span>
                    <span className="w-6 text-center">-</span>
                    <span className="w-8 text-center">-</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <motion.div
        className="bg-theme-card rounded-xl border border-theme-border p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-theme-text-secondary">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span>
              {t("groups.qualifies", "Qualifies for knockout stage")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-amber-500" />
            <span>
              {t("groups.possibleQualify", "Possible qualification")}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedGroupNames.map((groupName, groupIndex) => (
          <motion.div
            key={groupName}
            className="bg-theme-card rounded-xl border border-theme-border overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: groupIndex * 0.05 }}
            whileHover={{ scale: 1.01 }}
          >
            {/* Group Header */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-3">
              <h3 className="text-white font-bold text-sm">
                {t("groups.group", "Group")} {groupName}
              </h3>
            </div>

            {/* Mini Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-theme-card-secondary border-b border-theme-border">
                    <th className="text-left px-3 py-2 font-bold text-theme-text-secondary">
                      {t("groups.team", "Team")}
                    </th>
                    <th className="px-1.5 py-2 font-bold text-theme-text-secondary text-center">
                      P
                    </th>
                    <th className="px-1.5 py-2 font-bold text-theme-text-secondary text-center">
                      W
                    </th>
                    <th className="px-1.5 py-2 font-bold text-theme-text-secondary text-center">
                      D
                    </th>
                    <th className="px-1.5 py-2 font-bold text-theme-text-secondary text-center">
                      L
                    </th>
                    <th className="px-1.5 py-2 font-bold text-theme-text-secondary text-center">
                      GF
                    </th>
                    <th className="px-1.5 py-2 font-bold text-theme-text-secondary text-center">
                      GA
                    </th>
                    <th className="px-1.5 py-2 font-bold text-theme-text-secondary text-center">
                      GD
                    </th>
                    <th className="px-1.5 py-2 font-bold text-theme-text-secondary text-center">
                      Pts
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border">
                  {groupedData[groupName].map((team, index) => (
                    <tr
                      key={team.id}
                      className={`transition-colors duration-150 hover:bg-theme-card-secondary/50 ${getRowHighlight(
                        index
                      )}`}
                    >
                      <td className="px-3 py-2 font-semibold text-theme-foreground whitespace-nowrap">
                        {team.team_name}
                      </td>
                      <td className="px-1.5 py-2 text-center text-theme-text-secondary">
                        {team.played}
                      </td>
                      <td className="px-1.5 py-2 text-center text-theme-text-secondary">
                        {team.won}
                      </td>
                      <td className="px-1.5 py-2 text-center text-theme-text-secondary">
                        {team.drawn}
                      </td>
                      <td className="px-1.5 py-2 text-center text-theme-text-secondary">
                        {team.lost}
                      </td>
                      <td className="px-1.5 py-2 text-center text-theme-text-secondary">
                        {team.goals_for}
                      </td>
                      <td className="px-1.5 py-2 text-center text-theme-text-secondary">
                        {team.goals_against}
                      </td>
                      <td className="px-1.5 py-2 text-center font-semibold text-theme-foreground">
                        {team.goal_difference > 0
                          ? `+${team.goal_difference}`
                          : team.goal_difference}
                      </td>
                      <td className="px-1.5 py-2 text-center font-bold text-teal-600 dark:text-teal-400">
                        {team.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
