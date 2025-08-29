"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { GrDiamond } from "react-icons/gr";
import { MdTrendingUp, MdInfo } from "react-icons/md";
import { PiTShirtFill } from "react-icons/pi";
import { TbActivityHeartbeat } from "react-icons/tb";
import { getTeamColors } from "@/lib/team-colors";
import LoadingCard from "@/components/shared/LoadingCard";

interface Player {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team: number;
  element_type: number;
  now_cost: number;
  selected_by_percent: number;
  event_points: number;
  total_points: number;
  form: number;
}

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

export default function Diamond() {
  const { t } = useTranslation("fpl");
  const [activeTab, setActiveTab] = useState<"differentials" | "team-news">("differentials");
  const [loading, setLoading] = useState(false);
  const [topDifferentials, setTopDifferentials] = useState<Player[]>([]);
  const [teamNews, setTeamNews] = useState<TeamNews>({});
  const [error, setError] = useState<string | null>(null);

  const fetchDiamondData = useCallback(async () => {
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
        
        // Find best differentials
        const differentials = findBestDifferentials(players);
        setTopDifferentials(differentials);

        // Organize team news
        const news = organizeTeamNews(players);
        setTeamNews(news);
      }
    } catch (error) {
      console.error("Error fetching diamond data:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiamondData();
  }, [fetchDiamondData]);

  const findBestDifferentials = (players: any[]): Player[] => {
    return players
      .filter(player => 
        player.selected_by_percent < 15 && // Increased to catch Timber/Calafiori (under 15%)
        parseFloat(player.form) >= 5.0 && // Lowered to catch more quality players
        player.total_points >= 12 && // Lowered to catch more options
        player.minutes >= 60 // Lowered minute requirement
      )
      .sort((a, b) => {
        // Enhanced scoring: prioritize form and total points, penalize high ownership
        const scoreA = (parseFloat(a.form) * 3 + a.total_points * 0.8) / Math.max(1, a.selected_by_percent / 5);
        const scoreB = (parseFloat(b.form) * 3 + b.total_points * 0.8) / Math.max(1, b.selected_by_percent / 5);
        
        return scoreB - scoreA;
      })
      .slice(0, 5);
  };

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
      if (hasNews || chanceOfPlaying !== null || chanceOfPlayingNext !== null || 
          player.status !== "a") {
        const playerData = {
          id: player.id,
          web_name: player.web_name,
          team: player.team,
          element_type: player.element_type,
          chance_of_playing_this_round: chanceOfPlaying,
          chance_of_playing_next_round: chanceOfPlayingNext,
          news: player.news || "",
          status: player.status
        };

        // Injured: 0% chance or injured status or unavailable
        if (chanceOfPlaying === 0 || chanceOfPlayingNext === 0 || 
            player.status === "i" || player.status === "u") {
          news[player.team].injured.push(playerData);
        } 
        // Doubtful: Any chance less than 100% but greater than 0% or doubtful/suspended status
        else if (((chanceOfPlaying !== null && chanceOfPlaying < 100 && chanceOfPlaying > 0) || 
                  (chanceOfPlayingNext !== null && chanceOfPlayingNext < 100 && chanceOfPlayingNext > 0)) ||
                 player.status === "d" || player.status === "s") {
          news[player.team].doubtful.push(playerData);
        }
      }
    });

    return news;
  };

  const getPositionName = (elementType: number) => {
    switch (elementType) {
      case 1: return "GKP";
      case 2: return "DEF";
      case 3: return "MID";
      case 4: return "FWD";
      default: return "UNK";
    }
  };

  const getPositionColor = (elementType: number) => {
    switch (elementType) {
      case 1: return "bg-yellow-500";
      case 2: return "bg-green-500";
      case 3: return "bg-blue-500";
      case 4: return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <LoadingCard title={t("diamond.loading")} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/90 to-blue-600/90 rounded-xl shadow-lg p-6 border border-purple-300/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <GrDiamond className="text-3xl text-white" />
          <div>
            <h2 className="text-xl font-bold text-white">
              {t("diamond.title")}
            </h2>
            <p className="text-purple-100 text-sm">
              {t("diamond.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setActiveTab("differentials")}
            className={`flex-1 py-4 px-6 font-medium text-sm transition-colors ${
              activeTab === "differentials"
                ? "bg-purple-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <MdTrendingUp className="inline mr-2" />
            {t("diamond.bestDifferentials")}
          </button>
          <button
            onClick={() => setActiveTab("team-news")}
            className={`flex-1 py-4 px-6 font-medium text-sm transition-colors ${
              activeTab === "team-news"
                ? "bg-purple-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <TbActivityHeartbeat className="inline mr-2" />
            {t("diamond.teamNews")}
          </button>
        </div>

        <div className="p-6">
          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <MdInfo className="text-red-600 dark:text-red-400 text-xl" />
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-300">
                    {t("common.error")}
                  </h3>
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "differentials" && (
                <DifferentialsSection 
                  differentials={topDifferentials} 
                  getPositionName={getPositionName}
                  getPositionColor={getPositionColor}
                />
              )}
              
              {activeTab === "team-news" && (
                <TeamNewsSection 
                  teamNews={teamNews}
                  getPositionName={getPositionName}
                  getPositionColor={getPositionColor}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Differentials Section Component
function DifferentialsSection({ 
  differentials, 
  getPositionName, 
  getPositionColor 
}: { 
  differentials: Player[];
  getPositionName: (type: number) => string;
  getPositionColor: (type: number) => string;
}) {
  const { t } = useTranslation("fpl");

  if (differentials.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {t("diamond.noDifferentials")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t("diamond.bestDifferentials")}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("diamond.differentialsDescription")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {differentials.map((player, index) => (
          <div
            key={player.id}
            className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 shadow-md hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getPositionColor(player.element_type)}`}>
                  {getPositionName(player.element_type)}
                </span>
                <PiTShirtFill 
                  className="w-5 h-5" 
                  style={{ color: getTeamColors(player.team).primary }}
                />
              </div>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                #{index + 1}
              </span>
            </div>
            
            <h4 className="font-bold text-gray-900 dark:text-white mb-1">
              {player.web_name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {getTeamColors(player.team).shortName}
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t("diamond.ownership")}:</span>
                <span className="font-medium text-gray-900 dark:text-white ml-1">
                  {player.selected_by_percent}%
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t("diamond.form")}:</span>
                <span className="font-medium text-green-600 dark:text-green-400 ml-1">
                  {player.form}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t("diamond.price")}:</span>
                <span className="font-medium text-gray-900 dark:text-white ml-1">
                  £{(player.now_cost / 10).toFixed(1)}m
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t("diamond.points")}:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400 ml-1">
                  {player.total_points}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Team News Section Component
function TeamNewsSection({ 
  teamNews, 
  getPositionName, 
  getPositionColor 
}: { 
  teamNews: TeamNews;
  getPositionName: (type: number) => string;
  getPositionColor: (type: number) => string;
}) {
  const { t } = useTranslation("fpl");

  return (
    <div className="space-y-6">
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
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow"
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
                      <div key={player.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <span className={`px-1 py-0.5 rounded text-white ${getPositionColor(player.element_type)}`}>
                            {getPositionName(player.element_type)}
                          </span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {player.web_name}
                          </span>
                        </div>
                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                          {player.chance_of_playing_this_round || player.chance_of_playing_next_round || 0}%
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
                      <div key={player.id} className="flex items-center gap-1 text-xs">
                        <span className={`px-1 py-0.5 rounded text-white ${getPositionColor(player.element_type)}`}>
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
  );
}