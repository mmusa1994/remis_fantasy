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
  const [loadingLeagues, setLoadingLeagues] = useState<Set<string>>(new Set());
  const [totalEntries, setTotalEntries] = useState<{ [key: number]: number }>(
    {}
  );
  const maxPositions = 50; // Limit to top 50

  const fetchLeagueStandings = async (
    leagueId: number,
    isH2H: boolean = false
  ) => {
    const loadingKey = `${leagueId}_top50_${isH2H}`;
    if (loadingLeagues.has(loadingKey)) return;

    setLoadingLeagues((prev) => new Set([...prev, loadingKey]));

    try {
      const endpoint = isH2H ? "h2h" : "classic";
      const response = await fetch(
        `/api/fpl/leagues/${endpoint}?leagueId=${leagueId}&managerId=${managerId}&page=1&pageSize=${maxPositions}`
      );

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.data) {
          const standingsData = result.data.standings || [];

          // Check if user is found on this page
          const userFound = standingsData.some(
            (entry: any) => entry.entry === managerId
          );

          // Set league standings data (top 50 only)
          setLeagueStandings((prev) => ({
            ...prev,
            [leagueId]: {
              standings: standingsData,
              manager_position: result.data.manager_position,
              total_entries: result.data.total_entries || 0,
              user_found: userFound,
              has_data: true,
              error: null,
            },
          }));

          setTotalEntries((prev) => ({
            ...prev,
            [leagueId]: result.data.total_entries || 0,
          }));
        } else {
          setLeagueStandings((prev) => ({
            ...prev,
            [leagueId]: {
              error: result.error || "Failed to load standings",
              has_data: false,
              standings: [],
              total_entries: 0,
            },
          }));
        }
      } else {
        setLeagueStandings((prev) => ({
          ...prev,
          [leagueId]: {
            error: "Failed to fetch data",
            has_data: false,
            standings: [],
            total_entries: 0,
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching league standings:", error);
      setLeagueStandings((prev) => ({
        ...prev,
        [leagueId]: {
          error: "Network error",
          has_data: false,
          standings: [],
          total_entries: 0,
        },
      }));
    } finally {
      setLoadingLeagues((prev) => {
        const newSet = new Set(prev);
        newSet.delete(loadingKey);
        return newSet;
      });
    }
  };

  // Removed pagination search - now only loads top 50

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

      // Only fetch if we don't have any data for this league
      if (!leagueStandings[leagueId]) {
        fetchLeagueStandings(leagueId, isH2H);
      }
    }
  };

  // Removed pagination functions - showing top 50 only

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

  // Get leagues user actually participates in
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

      {/* Tab Navigation - Show tabs only when user has both types */}
      {hasClassic && hasH2H && (
        <div className="px-6 pt-4">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {hasClassic && (
              <button
                onClick={() => setActiveTab("classic")}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "classic"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <MdGroup className="inline mr-1" />
                Classic ({allClassicLeagues.length})
              </button>
            )}
            {hasH2H && (
              <button
                onClick={() => setActiveTab("h2h")}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "h2h"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <MdPerson className="inline mr-1" />
                Head-to-Head ({allH2HLeagues.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* League Type Header when only one type exists */}
      {hasClassic && !hasH2H && (
        <div className="px-6 pt-4">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <MdGroup className="inline mr-1" />
            Classic Leagues ({allClassicLeagues.length})
          </div>
        </div>
      )}
      {!hasClassic && hasH2H && (
        <div className="px-6 pt-4">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <MdPerson className="inline mr-1" />
            Head-to-Head Leagues ({allH2HLeagues.length})
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Classic Leagues */}
        {(activeTab === "classic" || !hasH2H) && hasClassic && (
          <div className="space-y-3">
            {allClassicLeagues.map((league: any) => {
              const isExpanded = expandedLeagues.has(league.id);
              const loadingKey = `${league.id}_top50_false`;
              const isLoading = loadingLeagues.has(loadingKey);
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
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100 dark:bg-gray-600">
                              <tr>
                                <th className="px-4 py-2 text-left">
                                  <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-4 animate-pulse"></div>
                                </th>
                                <th className="px-4 py-2 text-left">
                                  <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-16 animate-pulse"></div>
                                </th>
                                <th className="px-4 py-2 text-right">
                                  <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-12 animate-pulse ml-auto"></div>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from({ length: 10 }, (_, i) => (
                                <tr
                                  key={i}
                                  className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  <td className="px-4 py-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-6 animate-pulse"></div>
                                  </td>
                                  <td className="px-4 py-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-32 animate-pulse"></div>
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-12 animate-pulse ml-auto"></div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Simple footer skeleton */}
                          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
                            <div className="flex justify-center">
                              <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-32 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      ) : standings?.error ? (
                        <div className="p-4 text-sm text-red-500">
                          {standings.error}
                        </div>
                      ) : standings?.has_data &&
                        standings?.standings &&
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
                              {standings.standings.map((entry: any) => (
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

                          {/* Simple Footer */}
                          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
                            <div className="flex flex-col items-center space-y-3">
                              {/* Position indicator */}
                              {standings.has_data && (
                                <>
                                  {standings.user_found &&
                                  standings.manager_position ? (
                                    <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg">
                                      <MdPerson className="w-4 h-4" />
                                      <span className="font-medium">
                                        You are #{standings.manager_position}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="text-sm bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg">
                                      <span className="font-medium">
                                        You are not in top 50
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}

                              {/* Showing info */}
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Showing top {maxPositions} positions •{" "}
                                {totalEntries[league.id] || 0} total entries
                              </div>
                            </div>
                          </div>
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
              const loadingKey = `${league.id}_top50_true`;
              const isLoading = loadingLeagues.has(loadingKey);
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
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100 dark:bg-gray-600">
                              <tr>
                                <th className="px-4 py-2 text-left">
                                  <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-4 animate-pulse"></div>
                                </th>
                                <th className="px-4 py-2 text-left">
                                  <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-16 animate-pulse"></div>
                                </th>
                                <th className="px-4 py-2 text-right">
                                  <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-12 animate-pulse ml-auto"></div>
                                </th>
                                <th className="px-4 py-2 text-right">
                                  <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-12 animate-pulse ml-auto"></div>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from({ length: 10 }, (_, i) => (
                                <tr
                                  key={i}
                                  className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  <td className="px-4 py-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-6 animate-pulse"></div>
                                  </td>
                                  <td className="px-4 py-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-32 animate-pulse"></div>
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-16 animate-pulse ml-auto"></div>
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-12 animate-pulse ml-auto"></div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Simple H2H footer skeleton */}
                          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
                            <div className="flex justify-center">
                              <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-32 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      ) : standings?.error ? (
                        <div className="p-4 text-sm text-red-500">
                          {standings.error}
                        </div>
                      ) : standings?.has_data &&
                        standings?.standings &&
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
                              {standings.standings.map((entry: any) => (
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

                          {/* Simple H2H Footer */}
                          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
                            <div className="flex flex-col items-center space-y-3">
                              {/* Position indicator */}
                              {standings.has_data && (
                                <>
                                  {standings.user_found &&
                                  standings.manager_position ? (
                                    <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg">
                                      <MdPerson className="w-4 h-4" />
                                      <span className="font-medium">
                                        You are #{standings.manager_position}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="text-sm bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg">
                                      <span className="font-medium">
                                        You are not in top 50
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}

                              {/* Showing info */}
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Showing top {maxPositions} positions •{" "}
                                {totalEntries[league.id] || 0} total entries
                              </div>
                            </div>
                          </div>
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
