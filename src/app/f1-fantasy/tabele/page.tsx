"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import {
  MdEmojiEvents,
  MdTrendingUp,
  MdTrendingDown,
  MdRemove,
} from "react-icons/md";
import { GiF1Car, GiTrophyCup } from "react-icons/gi";
import { FaCoins } from "react-icons/fa";
import LoadingCard from "@/components/shared/LoadingCard";

interface LeaderboardEntry {
  rank: number;
  entry_id: number;
  player_name: string;
  team_name: string;
  total_points: number;
  event_total: number;
  last_rank: number;
}

interface LeaderboardData {
  league: {
    name: string;
    code: string;
    lastUpdated: string;
    totalEntries: number;
  };
  standings: LeaderboardEntry[];
  prizes: {
    first: string;
    second: string;
    third: string;
  };
  currentGrandPrix: string;
  season: string;
}

export default function F1FantasyTabelePage() {
  const { t } = useTranslation(["f1", "common"]);
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get league ID from URL params or use default
  const leagueId = searchParams.get("league") || "7206907";

  const fetchLeaderboard = async (customLeagueId?: string) => {
    const currentLeagueId = customLeagueId || leagueId;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/f1/leaderboard?league=${currentLeagueId}`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch leaderboard");
      }

      setData(result.data);
    } catch (err) {
      console.error("Failed to fetch F1 leaderboard:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [leagueId]);

  const getRankStripeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "#F4CE2A"; // Gold
      case 2:
        return "#9AA6B2"; // Silver
      case 3:
        return "#B47B36"; // Bronze
      default:
        return theme === "dark" ? "#2C3E55" : "#E5E7EB"; // Theme-aware neutral
    }
  };

  const getRankMovement = (rank: number, lastRank: number) => {
    if (rank < lastRank) {
      return { type: "up", change: lastRank - rank };
    } else if (rank > lastRank) {
      return { type: "down", change: rank - lastRank };
    }
    return { type: "same", change: 0 };
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-theme-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <LoadingCard title={t("f1:leaderboard.loading")} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-background">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">
            {t("f1:leaderboard.error")}
          </p>
          <p className="text-theme-text-secondary mb-4">{error}</p>
          <button
            onClick={() => fetchLeaderboard()}
            className="px-4 py-2 bg-theme-primary text-theme-primary-foreground rounded-md font-russo uppercase tracking-wide hover:bg-theme-primary/90 transition-colors"
          >
            {t("f1:leaderboard.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="font-russo uppercase tracking-tight text-4xl md:text-5xl text-[#782e2e]">
              Remis Fantasy F1 League
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <div className="flex flex-col items-center gap-2">
              <p className="text-theme-text-primary font-russo text-lg">
                Next: Zandvoort • Last: Hungaroring
              </p>
              <p className="text-theme-text-secondary text-sm">
                Season {data?.season}
              </p>
            </div>
          </div>

          {/* Prize Pool */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-theme-card border border-theme-border">
              <GiTrophyCup className="text-[#F4CE2A] text-xl" />
              <div className="text-center">
                <div className="text-[#F4CE2A] font-russo text-lg">1st</div>
                <div className="text-theme-text-primary font-russo text-sm flex items-center gap-1">
                  <FaCoins className="text-[#F4CE2A]" />
                  {data?.prizes.first}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-theme-card border border-theme-border">
              <MdEmojiEvents className="text-[#9AA6B2] text-xl" />
              <div className="text-center">
                <div className="text-[#9AA6B2] font-russo text-lg">2nd</div>
                <div className="text-theme-text-primary font-russo text-sm flex items-center gap-1">
                  <FaCoins className="text-[#F4CE2A]" />
                  {data?.prizes.second}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-theme-card border border-theme-border">
              <MdEmojiEvents className="text-[#B47B36] text-xl" />
              <div className="text-center">
                <div className="text-[#B47B36] font-russo text-lg">3rd</div>
                <div className="text-theme-text-primary font-russo text-sm flex items-center gap-1">
                  <FaCoins className="text-[#F4CE2A]" />
                  {data?.prizes.third}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="rounded-xl overflow-hidden bg-theme-card border border-theme-border">
          {data?.standings.map((entry, index) => {
            const movement = getRankMovement(entry.rank, entry.last_rank);
            const isTopThree = entry.rank <= 3;

            return (
              <div
                key={entry.entry_id}
                className={`relative flex items-center h-[68px] px-4 md:px-6 transition-all duration-200 hover:bg-theme-accent/10 ${
                  index > 0 ? "border-t border-theme-border" : ""
                } ${
                  isTopThree
                    ? "bg-gradient-to-r from-theme-accent/5 to-transparent"
                    : ""
                }`}
                style={{
                  boxShadow:
                    entry.rank === 1
                      ? "0 0 20px rgba(244, 206, 42, 0.25)"
                      : undefined,
                }}
              >
                {/* Rank Stripe */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: getRankStripeColor(entry.rank) }}
                />

                {/* Rank Badge */}
                <div
                  className="flex items-center justify-center w-7 h-7 rounded mr-4 font-russo text-sm"
                  style={{
                    backgroundColor:
                      entry.rank <= 3
                        ? getRankStripeColor(entry.rank)
                        : theme === "dark"
                        ? "#374151"
                        : "#F3F4F6",
                    color:
                      entry.rank <= 3
                        ? "#0C1622"
                        : theme === "dark"
                        ? "#E5E7EB"
                        : "#374151",
                  }}
                >
                  {entry.rank}
                </div>

                {/* Movement Indicator */}
                <div className="flex items-center mr-3">
                  {movement.type === "up" && (
                    <div className="flex items-center text-green-400">
                      <MdTrendingUp className="w-4 h-4" />
                      <span className="text-xs font-russo">
                        +{movement.change}
                      </span>
                    </div>
                  )}
                  {movement.type === "down" && (
                    <div className="flex items-center text-red-400">
                      <MdTrendingDown className="w-4 h-4" />
                      <span className="text-xs font-russo">
                        -{movement.change}
                      </span>
                    </div>
                  )}
                  {movement.type === "same" && (
                    <div className="flex items-center text-theme-text-secondary">
                      <MdRemove className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Player Name */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-russo text-theme-text-primary text-lg tracking-wide truncate">
                    {entry.player_name}
                  </h3>
                </div>

                {/* Team Name */}
                <div className="flex-1 text-right mr-4 min-w-0">
                  <p className="font-russo text-theme-text-secondary text-sm uppercase tracking-wide opacity-80 truncate">
                    {entry.team_name}
                  </p>
                </div>

                {/* Points */}
                <div className="px-3 py-2 rounded-md font-russo text-theme-text-primary text-lg bg-theme-secondary border border-theme-border">
                  {entry.total_points.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Last Updated */}
        <div className="text-center mt-6">
          <p className="text-theme-text-secondary text-sm">
            {t("f1:leaderboard.lastUpdated")}{" "}
            {data?.league.lastUpdated
              ? new Date(data.league.lastUpdated).toLocaleString("sr-RS")
              : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
