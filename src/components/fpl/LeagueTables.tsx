"use client";

import { useState } from "react";
import { MdPerson, MdGroup, MdExpandMore, MdExpandLess } from "react-icons/md";
import { GiTrophy } from "react-icons/gi";

interface LeagueTablesProps {
  leagueData: any;
  managerId: number;
}

export default function LeagueTables({
  leagueData,
  managerId,
}: LeagueTablesProps) {
  const [activeTab, setActiveTab] = useState<"classic" | "h2h">("classic");
  const [expandedLeagues, setExpandedLeagues] = useState<Set<number>>(
    new Set()
  );
  const [leagueStandings, setLeagueStandings] = useState<{
    [key: number]: any;
  }>({});
  const [loadingLeagues, setLoadingLeagues] = useState<Set<number>>(new Set());

  const fetchLeagueStandings = async (
    leagueId: number,
    isH2H: boolean = false
  ) => {
    if (leagueStandings[leagueId] || loadingLeagues.has(leagueId)) return;

    setLoadingLeagues((prev) => new Set([...prev, leagueId]));

    try {
      const endpoint = isH2H ? "h2h" : "classic";
      const response = await fetch(
        `/api/fpl/leagues/${endpoint}?leagueId=${leagueId}&managerId=${managerId}`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setLeagueStandings((prev) => ({
            ...prev,
            [leagueId]: result.data,
          }));
        } else {
          setLeagueStandings((prev) => ({
            ...prev,
            [leagueId]: { error: result.error || "Failed to load standings" },
          }));
        }
      } else {
        setLeagueStandings((prev) => ({
          ...prev,
          [leagueId]: { error: "Failed to fetch data" },
        }));
      }
    } catch (error) {
      console.error("Error fetching league standings:", error);
      setLeagueStandings((prev) => ({
        ...prev,
        [leagueId]: { error: "Network error" },
      }));
    } finally {
      setLoadingLeagues((prev) => {
        const newSet = new Set(prev);
        newSet.delete(leagueId);
        return newSet;
      });
    }
  };

  const toggleLeague = (leagueId: number, isH2H: boolean = false) => {
    const isExpanded = expandedLeagues.has(leagueId);

    if (isExpanded) {
      setExpandedLeagues((prev) => {
        const newSet = new Set(prev);
        newSet.delete(leagueId);
        return newSet;
      });
    } else {
      setExpandedLeagues((prev) => new Set([...prev, leagueId]));
      fetchLeagueStandings(leagueId, isH2H);
    }
  };

  if (!leagueData || (!leagueData.classic?.length && !leagueData.h2h?.length)) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
          <GiTrophy className="mr-2 text-yellow-500" />
          Leagues
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No league data available. Load a team first to see leagues.
        </p>
      </div>
    );
  }

  // Get all leagues (not limited to first 5/3)
  const allClassicLeagues = leagueData.classic || [];
  const allH2HLeagues = leagueData.h2h || [];
  const hasClassic = allClassicLeagues.length > 0;
  const hasH2H = allH2HLeagues.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <GiTrophy className="mr-2 text-yellow-500" />
          Leagues
        </h3>
      </div>

      {/* Tab Navigation */}
      {hasClassic && hasH2H && (
        <div className="px-6 pt-4">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("classic")}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "classic"
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <MdGroup className="inline mr-1" />
              Classic
            </button>
            <button
              onClick={() => setActiveTab("h2h")}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "h2h"
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <MdPerson className="inline mr-1" />
              Head-to-Head
            </button>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Classic Leagues */}
        {(activeTab === "classic" || !hasH2H) && hasClassic && (
          <div className="space-y-3">
            {allClassicLeagues.map((league: any) => {
              const isExpanded = expandedLeagues.has(league.id);
              const isLoading = loadingLeagues.has(league.id);
              const standings = leagueStandings[league.id];

              return (
                <div
                  key={league.id}
                  className="border dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleLeague(league.id)}
                    className="w-full bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-left">
                        {league.name}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {allClassicLeagues.length} liga
                          {allClassicLeagues.length !== 1 ? "e" : ""}
                        </span>
                        {isExpanded ? (
                          <MdExpandLess className="text-gray-500" />
                        ) : (
                          <MdExpandMore className="text-gray-500" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div>
                      {isLoading ? (
                        <div className="p-6 text-center">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Loading standings...
                          </p>
                        </div>
                      ) : standings?.error ? (
                        <div className="p-4 text-sm text-red-500">
                          {standings.error}
                        </div>
                      ) : standings?.standings &&
                        standings.standings.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100 dark:bg-gray-600">
                              <tr>
                                <th className="px-4 py-2 text-left">#</th>
                                <th className="px-4 py-2 text-left">Manager</th>
                                <th className="px-4 py-2 text-right">Points</th>
                              </tr>
                            </thead>
                            <tbody>
                              {standings.standings
                                .slice(0, 20)
                                .map((entry: any) => (
                                  <tr
                                    key={entry.id}
                                    className={`border-b dark:border-gray-700 ${
                                      entry.entry === managerId
                                        ? "bg-blue-50 dark:bg-blue-900"
                                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                                  >
                                    <td className="px-4 py-2 font-medium">
                                      {entry.rank}
                                      {entry.entry === managerId && (
                                        <span className="ml-1 text-blue-500">
                                          ←
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2">
                                      {entry.player_name || entry.entry_name}
                                      {entry.entry === managerId && (
                                        <span className="ml-1 text-xs text-blue-500 font-medium">
                                          You
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2 text-right font-medium">
                                      {entry.total.toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                          {standings.manager_position && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900 text-sm text-blue-700 dark:text-blue-200">
                              Your position: #{standings.manager_position}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                          No standings available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* H2H Leagues */}
        {activeTab === "h2h" && hasH2H && (
          <div className="space-y-3">
            {allH2HLeagues.map((league: any) => {
              const isExpanded = expandedLeagues.has(league.id);
              const isLoading = loadingLeagues.has(league.id);
              const standings = leagueStandings[league.id];

              return (
                <div
                  key={league.id}
                  className="border dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleLeague(league.id, true)}
                    className="w-full bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-left">
                        {league.name}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          H2H
                        </span>
                        {isExpanded ? (
                          <MdExpandLess className="text-gray-500" />
                        ) : (
                          <MdExpandMore className="text-gray-500" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div>
                      {isLoading ? (
                        <div className="p-6 text-center">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Loading H2H standings...
                          </p>
                        </div>
                      ) : standings?.error ? (
                        <div className="p-4 text-sm text-red-500">
                          {standings.error}
                        </div>
                      ) : standings?.standings &&
                        standings.standings.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100 dark:bg-gray-600">
                              <tr>
                                <th className="px-4 py-2 text-left">#</th>
                                <th className="px-4 py-2 text-left">Manager</th>
                                <th className="px-4 py-2 text-right">W-D-L</th>
                                <th className="px-4 py-2 text-right">Points</th>
                              </tr>
                            </thead>
                            <tbody>
                              {standings.standings
                                .slice(0, 15)
                                .map((entry: any) => (
                                  <tr
                                    key={entry.id}
                                    className={`border-b dark:border-gray-700 ${
                                      entry.entry === managerId
                                        ? "bg-blue-50 dark:bg-blue-900"
                                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                                  >
                                    <td className="px-4 py-2 font-medium">
                                      {entry.rank}
                                      {entry.entry === managerId && (
                                        <span className="ml-1 text-blue-500">
                                          ←
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2">
                                      {entry.player_name || entry.entry_name}
                                      {entry.entry === managerId && (
                                        <span className="ml-1 text-xs text-blue-500 font-medium">
                                          You
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2 text-right text-xs">
                                      {entry.matches_won}-{entry.matches_drawn}-
                                      {entry.matches_lost}
                                    </td>
                                    <td className="px-4 py-2 text-right font-medium">
                                      {entry.total}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                          {standings.manager_position && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900 text-sm text-blue-700 dark:text-blue-200">
                              Your position: #{standings.manager_position}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                          No H2H standings available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* No leagues message */}
        {!hasClassic && !hasH2H && (
          <div className="text-center py-8">
            <GiTrophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No leagues found for this manager.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
