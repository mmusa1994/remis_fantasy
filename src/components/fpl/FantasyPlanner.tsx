"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { FaShare, FaExpand } from "react-icons/fa";
import { BiFootball } from "react-icons/bi";
import LoadingCard from "@/components/shared/LoadingCard";
import ManagerIdModal from "@/components/modals/ManagerIdModal";
import { getTeamColors } from "@/lib/team-colors";

interface FantasyPlannerProps {
  managerId: string | null;
}

interface PlayerData {
  id: number;
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  team_code: number;
  element_type: number;
  now_cost: number;
  total_points: number;
  selected_by_percent: string;
  form: string;
}

interface TeamData {
  manager?: any;
  team_with_stats: any[];
  team_totals: any;
  fixtures: any[];
  captain: any;
  vice_captain: any;
  active_chip?: string | null;
}

export default function FantasyPlanner({ managerId }: FantasyPlannerProps) {
  const { theme } = useTheme();
  const [currentGameweek] = useState(4);
  const [selectedPitch, setSelectedPitch] = useState("pitch");
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [allPlayers, setAllPlayers] = useState<PlayerData[]>([]);
  const [showManagerIdModal, setShowManagerIdModal] = useState(false);
  const [currentManagerId, setCurrentManagerId] = useState<string | null>(
    managerId
  );
  const [managerIdLoading, setManagerIdLoading] = useState(false);

  const fetchTeamData = useCallback(
    async (id: string, gameweek: number = currentGameweek) => {
      console.log(
        "🔍 Fetching team data for Manager ID:",
        id,
        "Gameweek:",
        gameweek
      );
      setLoading(true);

      try {
        // Fetch team data from our API
        const response = await fetch("/api/fpl/load-team", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            managerId: id,
            gameweek: gameweek,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            "❌ API Response Error:",
            response.status,
            response.statusText
          );
          console.error("❌ Error details:", errorText);

          // If current gameweek is not available, try the previous gameweek
          if (
            response.status === 404 &&
            errorText.includes("not available yet") &&
            gameweek > 1
          ) {
            console.log(
              "⬇️ Gameweek",
              gameweek,
              "not available, trying Gameweek",
              gameweek - 1
            );
            return await fetchTeamData(id, gameweek - 1);
          }

          throw new Error(
            `Failed to fetch team data: ${response.status} - ${errorText}`
          );
        }

        const data = await response.json();
        if (data.success) {
          setTeamData(data.data);
        }

        // Get bootstrap data from our API response (it should include player data)
        if (data.data && data.data.team_with_stats) {
          const playersFromResponse = data.data.team_with_stats
            .map((teamPlayer: any) => teamPlayer.player)
            .filter(Boolean);
          setAllPlayers(playersFromResponse);
        }
      } catch (error) {
        console.error("❌ Error fetching team data:", error);
        console.error("Manager ID:", id);
        console.error("Gameweek:", gameweek);
      } finally {
        setLoading(false);
      }
    },
    [currentGameweek]
  );

  // Save manager ID
  const saveManagerId = async (newManagerId: string) => {
    try {
      setManagerIdLoading(true);
      const response = await fetch("/api/user/manager-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ managerId: newManagerId }),
      });

      if (response.ok) {
        setCurrentManagerId(newManagerId);
        setShowManagerIdModal(false);
        // Now fetch the team data
        fetchTeamData(newManagerId);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to save manager ID");
      }
    } catch (error) {
      console.error("Failed to save manager ID:", error);
      alert("Greška pri spremanju Manager ID-a: " + (error as Error).message);
    } finally {
      setManagerIdLoading(false);
    }
  };

  // Check if we need to show manager ID modal or fetch data
  useEffect(() => {
    if (!currentManagerId) {
      setShowManagerIdModal(true);
    } else {
      fetchTeamData(currentManagerId);
    }
  }, [currentManagerId]);

  // Update currentManagerId when prop changes
  useEffect(() => {
    setCurrentManagerId(managerId);
  }, [managerId]);

  const getPlayerById = (id: number) => {
    return allPlayers.find((p) => p.id === id);
  };

  const getTeamColor = (teamId: number) => {
    return getTeamColors(teamId);
  };

  const getPlayerPosition = (elementType: number) => {
    const positions = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };
    return positions[elementType as keyof typeof positions] || "Unknown";
  };

  const getStartingLineup = () => {
    if (!teamData?.team_with_stats) return [];
    return teamData.team_with_stats
      .filter((player) => player.position <= 11)
      .sort((a, b) => a.position - b.position);
  };

  const getBench = () => {
    if (!teamData?.team_with_stats) return [];
    return teamData.team_with_stats
      .filter((player) => player.position > 11)
      .sort((a, b) => a.position - b.position);
  };

  const renderPlayer = (teamPlayer: any, isOnPitch = true) => {
    if (!teamPlayer) return null;

    const player = getPlayerById(teamPlayer.player_id);
    if (!player) return null;

    const isCaptain = teamPlayer.is_captain;
    const isViceCaptain = teamPlayer.is_vice_captain;
    const teamColor = getTeamColor(player.team);
    const points = teamPlayer.live_stats?.total_points || 0;

    return (
      <div key={teamPlayer.player_id} className="relative group cursor-pointer">
        <div
          className={`relative ${
            isOnPitch ? "w-16 h-20" : "w-12 h-16"
          } mx-2 mb-2 ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          } rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-2 ${
            isCaptain
              ? "border-yellow-400"
              : isViceCaptain
              ? "border-blue-400"
              : "border-gray-300"
          }`}
        >
          {/* Player Kit/Jersey */}
          <div
            className={`${
              isOnPitch ? "w-12 h-12" : "w-8 h-8"
            } mx-auto mt-1 rounded-full flex items-center justify-center shadow-inner`}
            style={{
              backgroundColor: teamColor.primary,
              border: `2px solid ${teamColor.secondary}`,
            }}
          >
            <BiFootball
              className={`${isOnPitch ? "text-xs" : "text-xs"} opacity-80`}
              style={{ color: teamColor.secondary }}
            />
          </div>

          {/* Captain/Vice-Captain Badge */}
          {(isCaptain || isViceCaptain) && (
            <div
              className={`absolute -top-1 -right-1 ${
                isOnPitch ? "w-5 h-5" : "w-4 h-4"
              } rounded-full flex items-center justify-center text-xs font-bold text-white ${
                isCaptain ? "bg-yellow-500" : "bg-blue-500"
              }`}
            >
              {isCaptain ? "C" : "V"}
            </div>
          )}

          {/* Multiplier for captain */}
          {teamPlayer.multiplier > 1 && (
            <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white">
              {teamPlayer.multiplier}x
            </div>
          )}

          {/* Player Name */}
          <div
            className={`${
              isOnPitch ? "text-xs" : "text-xs"
            } font-medium text-center px-1 truncate`}
          >
            {player.web_name}
          </div>

          {/* Points */}
          <div
            className={`${
              isOnPitch ? "text-xs" : "text-xs"
            } text-center font-bold`}
          >
            <span className="text-green-600">{points}pts</span>
          </div>
        </div>

        {/* Hover tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
          <div className="text-center">
            <div className="font-bold">
              {player.first_name} {player.second_name}
            </div>
            <div>
              {getTeamColor(player.team).name} -{" "}
              {getPlayerPosition(player.element_type)}
            </div>
            <div>
              £{(player.now_cost / 10).toFixed(1)}m | {points} pts
            </div>
            <div>
              Form: {player.form} | {player.selected_by_percent}% ownership
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen p-4 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-96">
          <LoadingCard
            title="Loading Team Data"
            description="Fetching your FPL team information and player statistics..."
            className="max-w-md"
          />
        </div>
      )}

      {/* Team Data Display */}
      {!loading && currentManagerId && teamData && (
        <>
          {/* Header */}
          <div
            className={`${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            } rounded-lg p-6 mb-6 shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">
                  {teamData.manager?.player_first_name}{" "}
                  {teamData.manager?.player_last_name}
                </h1>
                <p className="text-lg font-medium text-purple-600">
                  {teamData.manager?.name}
                </p>
                <p className="text-gray-500">
                  Plan future transfers, chips, subs etc.
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  ID {currentManagerId} - Click to change
                </p>
                <p className="text-xs text-gray-500">
                  Overall Rank: #
                  {teamData.manager?.summary_overall_rank?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Gameweek</p>
                <p className="font-bold text-lg">{currentGameweek}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">GW Points</p>
                <p className="font-bold text-lg text-green-600">
                  {teamData.team_totals?.total_points_final || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Points</p>
                <p className="font-bold text-lg">
                  {teamData.manager?.summary_overall_points?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Team Value</p>
                <p className="font-bold text-lg">
                  £{((teamData.manager?.value || 1000) / 10).toFixed(1)}m
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bank</p>
                <p className="font-bold text-lg">
                  £{((teamData.manager?.bank || 0) / 10).toFixed(1)}m
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Pitch Area */}
            <div className="lg:col-span-2">
              <div
                className={`${
                  theme === "dark" ? "bg-gray-800" : "bg-white"
                } rounded-lg p-6 shadow-lg`}
              >
                {/* Pitch Controls */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedPitch("pitch")}
                      className={`px-4 py-2 rounded ${
                        selectedPitch === "pitch"
                          ? "bg-green-600 text-white"
                          : theme === "dark"
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      Pitch
                    </button>
                    <button
                      onClick={() => setSelectedPitch("list")}
                      className={`px-4 py-2 rounded ${
                        selectedPitch === "list"
                          ? "bg-green-600 text-white"
                          : theme === "dark"
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      List
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                      <FaShare className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded bg-gray-600 text-white hover:bg-gray-700">
                      <FaExpand className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Vertical Football Pitch */}
                {selectedPitch === "pitch" && (
                  <div className="relative bg-gradient-to-b from-green-400 via-green-500 to-green-400 rounded-xl p-8 min-h-[700px] shadow-inner">
                    {/* Goal at top */}
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-24 h-6 border-2 border-white rounded-b-lg bg-white/20"></div>

                    {/* Goal area */}
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-40 h-16 border-2 border-white/60 rounded-b-lg"></div>

                    {/* Penalty area */}
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-56 h-28 border-2 border-white/60 rounded-b-lg"></div>

                    {/* Center circle */}
                    <div className="absolute left-1/2 top-1/2 w-24 h-24 border-2 border-white/60 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute left-1/2 top-1/2 w-2 h-2 bg-white/60 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

                    {/* Halfway line */}
                    <div className="absolute left-4 right-4 top-1/2 border-t-2 border-white/60 transform -translate-y-1/2"></div>

                    {/* Side boundaries */}
                    <div className="absolute left-4 top-4 bottom-4 border-l-2 border-white/60"></div>
                    <div className="absolute right-4 top-4 bottom-4 border-r-2 border-white/60"></div>
                    <div className="absolute left-4 right-4 top-4 border-t-2 border-white/60"></div>
                    <div className="absolute left-4 right-4 bottom-4 border-b-2 border-white/60"></div>

                    {/* Formation Layout - Vertical */}
                    <div className="relative h-full flex flex-col justify-between py-12">
                      {/* Forwards at top (attacking) */}
                      <div className="flex justify-center space-x-2">
                        {getStartingLineup()
                          .filter(
                            (player) =>
                              getPlayerById(player.player_id)?.element_type ===
                              4
                          )
                          .map((player) => renderPlayer(player, true))}
                      </div>

                      {/* Midfielders */}
                      <div className="flex justify-center space-x-1 flex-wrap">
                        {getStartingLineup()
                          .filter(
                            (player) =>
                              getPlayerById(player.player_id)?.element_type ===
                              3
                          )
                          .map((player) => renderPlayer(player, true))}
                      </div>

                      {/* Defenders */}
                      <div className="flex justify-center space-x-1 flex-wrap">
                        {getStartingLineup()
                          .filter(
                            (player) =>
                              getPlayerById(player.player_id)?.element_type ===
                              2
                          )
                          .map((player) => renderPlayer(player, true))}
                      </div>

                      {/* Goalkeeper at bottom */}
                      <div className="flex justify-center">
                        {getStartingLineup()
                          .filter(
                            (player) =>
                              getPlayerById(player.player_id)?.element_type ===
                              1
                          )
                          .map((player) => renderPlayer(player, true))}
                      </div>
                    </div>

                    {/* Corner arcs */}
                    <div className="absolute top-4 left-4 w-4 h-4 border-2 border-white/60 rounded-br-full border-l-0 border-t-0"></div>
                    <div className="absolute top-4 right-4 w-4 h-4 border-2 border-white/60 rounded-bl-full border-r-0 border-t-0"></div>
                    <div className="absolute bottom-4 left-4 w-4 h-4 border-2 border-white/60 rounded-tr-full border-l-0 border-b-0"></div>
                    <div className="absolute bottom-4 right-4 w-4 h-4 border-2 border-white/60 rounded-tl-full border-r-0 border-b-0"></div>
                  </div>
                )}

                {/* Bench */}
                <div className="mt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BiFootball className="text-gray-500" />
                    Bench
                  </h3>
                  <div className="flex space-x-2 justify-center">
                    {getBench().map((player) => renderPlayer(player, false))}
                  </div>
                </div>

                {/* Captain Info */}
                {teamData.captain.player_id && (
                  <div className="mt-6 pt-6 border-t border-gray-300">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-lg">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                          Captain
                        </h4>
                        <p className="font-bold">
                          {getPlayerById(teamData.captain.player_id)?.web_name}
                        </p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-300">
                          {teamData.captain.stats?.total_points || 0} pts (x2)
                        </p>
                      </div>
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                          Vice Captain
                        </h4>
                        <p className="font-bold">
                          {
                            getPlayerById(teamData.vice_captain.player_id)
                              ?.web_name
                          }
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-300">
                          {teamData.vice_captain.stats?.total_points || 0} pts
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Live Team Stats */}
              <div
                className={`${
                  theme === "dark" ? "bg-gray-800" : "bg-white"
                } rounded-lg p-6 shadow-lg`}
              >
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <BiFootball className="text-green-500" />
                  Live Stats
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-500">Goals</p>
                    <p className="font-bold text-lg">
                      {teamData.team_totals?.goals || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Assists</p>
                    <p className="font-bold text-lg">
                      {teamData.team_totals?.assists || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Clean Sheets</p>
                    <p className="font-bold text-lg">
                      {teamData.team_totals?.clean_sheets || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Bonus</p>
                    <p className="font-bold text-lg">
                      {teamData.team_totals?.final_bonus || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Chip */}
              {teamData.active_chip && (
                <div
                  className={`${
                    theme === "dark" ? "bg-purple-900/30" : "bg-purple-100"
                  } rounded-lg p-6 shadow-lg border-2 border-purple-500`}
                >
                  <h3 className="font-bold mb-2 text-purple-700 dark:text-purple-300">
                    Active Chip
                  </h3>
                  <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
                    {teamData.active_chip.replace("_", " ").toUpperCase()}
                  </p>
                </div>
              )}

              {/* Transfers */}
              <div
                className={`${
                  theme === "dark" ? "bg-gray-800" : "bg-white"
                } rounded-lg p-6 shadow-lg`}
              >
                <h3 className="font-bold mb-4">Transfer Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Free Transfers</span>
                    <span className="font-bold">
                      {teamData.manager?.free_transfers || 1}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transfer Cost</span>
                    <span className="font-bold text-red-500">-4 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Transfers</span>
                    <span className="font-bold">
                      {teamData.manager?.total_transfers || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Manager ID Modal */}
      <ManagerIdModal
        isOpen={showManagerIdModal}
        onClose={() => setShowManagerIdModal(false)}
        onSave={saveManagerId}
        isLoading={managerIdLoading}
      />
    </div>
  );
}
