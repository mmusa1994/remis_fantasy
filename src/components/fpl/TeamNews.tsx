"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { TbActivityHeartbeat } from "react-icons/tb";
import { PiTShirtFill } from "react-icons/pi";
import { getTeamColors } from "@/lib/team-colors";
import LoadingCard from "@/components/shared/LoadingCard";

interface InjuredPlayer {
  id: number;
  web_name: string;
  team: number;
  element_type: number;
  chance_of_playing_this_round: number | null;
  chance_of_playing_next_round: number | null;
  news: string;
  status: string;
}

interface TeamNews {
  [teamId: number]: {
    injured: InjuredPlayer[];
    doubtful: InjuredPlayer[];
  };
}

export default function TeamNews() {
  const { t } = useTranslation("fpl");
  const [loading, setLoading] = useState(false);
  const [teamNews, setTeamNews] = useState<TeamNews>({});
  const [error, setError] = useState<string | null>(null);

  const fetchTeamNewsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/fpl/bootstrap-static");
      if (!response.ok) {
        throw new Error("Failed to fetch FPL data");
      }

      const data = await response.json();
      if (data.success && data.data) {
        const players = data.data.elements || [];

        // Organize team news
        const news = organizeTeamNews(players);
        setTeamNews(news);
      }
    } catch (error) {
      console.error("Error fetching team news data:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamNewsData();
  }, [fetchTeamNewsData]);

  const organizeTeamNews = (players: any[]): TeamNews => {
    const news: TeamNews = {};

    // Initialize all teams
    for (let i = 1; i <= 20; i++) {
      news[i] = { injured: [], doubtful: [] };
    }

    players.forEach((player: any) => {
      const chanceOfPlaying = player.chance_of_playing_this_round;
      const chanceOfPlayingNext = player.chance_of_playing_next_round;
      const hasNews = player.news && player.news.trim() !== "";

      // Include players with news, injury status, or playing chance issues
      if (
        hasNews ||
        chanceOfPlaying !== null ||
        chanceOfPlayingNext !== null ||
        player.status !== "a"
      ) {
        const playerData = {
          id: player.id,
          web_name: player.web_name,
          team: player.team,
          element_type: player.element_type,
          chance_of_playing_this_round: chanceOfPlaying,
          chance_of_playing_next_round: chanceOfPlayingNext,
          news: player.news || "",
          status: player.status,
        };

        // Injured: 0% chance or injured status or unavailable
        if (
          chanceOfPlaying === 0 ||
          chanceOfPlayingNext === 0 ||
          player.status === "i" ||
          player.status === "u"
        ) {
          news[player.team].injured.push(playerData);
        }
        // Doubtful: Any chance less than 100% but greater than 0% or doubtful/suspended status
        else if (
          (chanceOfPlaying !== null &&
            chanceOfPlaying < 100 &&
            chanceOfPlaying > 0) ||
          (chanceOfPlayingNext !== null &&
            chanceOfPlayingNext < 100 &&
            chanceOfPlayingNext > 0) ||
          player.status === "d" ||
          player.status === "s"
        ) {
          news[player.team].doubtful.push(playerData);
        }
      }
    });

    return news;
  };

  const getPositionName = (elementType: number) => {
    switch (elementType) {
      case 1:
        return "GKP";
      case 2:
        return "DEF";
      case 3:
        return "MID";
      case 4:
        return "FWD";
      default:
        return "UNK";
    }
  };

  const getPositionColor = (elementType: number) => {
    switch (elementType) {
      case 1:
        return "bg-yellow-500";
      case 2:
        return "bg-green-500";
      case 3:
        return "bg-blue-500";
      case 4:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <LoadingCard title={t("diamond.loading")} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">
              {t("common.error")}
            </h3>
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/90 to-blue-600/90 rounded-lg shadow-lg p-6 border border-purple-300/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <TbActivityHeartbeat className="text-3xl text-white" />
          <div>
            <h2 className="text-xl font-bold text-white">
              {t("diamond.teamNews")}
            </h2>
            <p className="text-purple-100 text-sm">{t("diamond.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t("diamond.teamNews")}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("diamond.teamNewsDescription")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(teamNews).map(([teamId, news]) => {
            const team = getTeamColors(parseInt(teamId));
            const hasNews = news.injured.length > 0 || news.doubtful.length > 0;

            if (!hasNews) return null;

            return (
              <div
                key={teamId}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-2 mb-4">
                  <PiTShirtFill
                    className="w-6 h-6"
                    style={{ color: team.primary }}
                  />
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                    {team.shortName}
                  </h4>
                </div>

                {/* Doubtful Players */}
                {news.doubtful.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-2">
                      {t("diamond.doubtful")}
                    </h5>
                    <div className="space-y-1">
                      {news.doubtful.map((player: InjuredPlayer) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-1">
                            <span
                              className={`px-1 py-0.5 rounded text-white ${getPositionColor(
                                player.element_type
                              )}`}
                            >
                              {getPositionName(player.element_type)}
                            </span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {player.web_name}
                            </span>
                          </div>
                          <span className="text-orange-600 dark:text-orange-400 font-medium">
                            {player.chance_of_playing_this_round ||
                              player.chance_of_playing_next_round ||
                              0}
                            %
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Injured Players */}
                {news.injured.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">
                      {t("diamond.injured")}
                    </h5>
                    <div className="space-y-1">
                      {news.injured.map((player: InjuredPlayer) => (
                        <div
                          key={player.id}
                          className="flex items-center gap-1 text-xs"
                        >
                          <span
                            className={`px-1 py-0.5 rounded text-white ${getPositionColor(
                              player.element_type
                            )}`}
                          >
                            {getPositionName(player.element_type)}
                          </span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {player.web_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
