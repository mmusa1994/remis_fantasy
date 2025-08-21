"use client";

import { useState } from "react";
import {
  MdPerson,
  MdGroup,
  MdExpandMore,
  MdExpandLess,
  MdNavigateNext,
  MdNavigateBefore,
  MdFirstPage,
  MdLastPage,
} from "react-icons/md";
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
  const [currentPages, setCurrentPages] = useState<{ [key: number]: number }>(
    {}
  );
  const [totalPages, setTotalPages] = useState<{ [key: number]: number }>({});
  const itemsPerPage = 10;

  const fetchLeagueStandings = async (
    leagueId: number,
    isH2H: boolean = false,
    page: number = 1
  ) => {
    const loadingKey = `${leagueId}_${page}_${isH2H}`;
    if (loadingLeagues.has(loadingKey)) return;

    setLoadingLeagues((prev) => new Set([...prev, loadingKey]));

    try {
      const endpoint = isH2H ? "h2h" : "classic";
      const response = await fetch(
        `/api/fpl/leagues/${endpoint}?leagueId=${leagueId}&managerId=${managerId}&page=${page}&pageSize=${itemsPerPage}`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setLeagueStandings((prev) => ({
            ...prev,
            [leagueId]: {
              ...prev[leagueId],
              standings: result.data.standings,
              manager_position: result.data.manager_position,
              total_entries: result.data.total_entries,
              current_page: page,
            },
          }));

          const totalPagesCount = Math.ceil(
            result.data.total_entries / itemsPerPage
          );
          setTotalPages((prev) => ({
            ...prev,
            [leagueId]: totalPagesCount,
          }));

          setCurrentPages((prev) => ({
            ...prev,
            [leagueId]: page,
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
        newSet.delete(loadingKey);
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
      if (!leagueStandings[leagueId]) {
        fetchLeagueStandings(leagueId, isH2H, 1);
      }
    }
  };

  const changePage = (
    leagueId: number,
    newPage: number,
    isH2H: boolean = false
  ) => {
    fetchLeagueStandings(leagueId, isH2H, newPage);
  };

  const goToUserPage = async (leagueId: number, isH2H: boolean = false) => {
    const standings = leagueStandings[leagueId];
    if (!standings?.manager_position) return;

    const userPage = Math.ceil(standings.manager_position / itemsPerPage);
    await fetchLeagueStandings(leagueId, isH2H, userPage);
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
              Classic ({allClassicLeagues.length})
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
              Head-to-Head ({allH2HLeagues.length})
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
              const currentPage = currentPages[league.id] || 1;
              const loadingKey = `${league.id}_${currentPage}_false`;
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

                          {/* Pagination skeleton */}
                          <div className="p-3 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                <div className="h-6 bg-gray-200 dark:bg-gray-500 rounded w-24 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-20 animate-pulse"></div>
                              </div>
                              <div className="flex items-center space-x-1">
                                {Array.from({ length: 4 }, (_, i) => (
                                  <div
                                    key={i}
                                    className="h-6 w-6 bg-gray-200 dark:bg-gray-500 rounded animate-pulse"
                                  ></div>
                                ))}
                              </div>
                            </div>
                          </div>
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

                          {/* Pagination and User Position */}
                          <div className="p-3 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                {standings.manager_position && (
                                  <button
                                    onClick={() => goToUserPage(league.id)}
                                    className="flex items-center gap-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md font-medium transition-colors shadow-sm"
                                  >
                                    <MdPerson className="w-3 h-3" />
                                    Find Me (#{standings.manager_position})
                                  </button>
                                )}
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  First 50 places
                                </span>
                              </div>

                              {totalPages[league.id] > 1 && (
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => changePage(league.id, 1)}
                                    disabled={currentPages[league.id] === 1}
                                    className="p-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 dark:disabled:bg-gray-700 rounded"
                                  >
                                    <MdFirstPage />
                                  </button>
                                  <button
                                    onClick={() =>
                                      changePage(
                                        league.id,
                                        Math.max(1, currentPages[league.id] - 1)
                                      )
                                    }
                                    disabled={currentPages[league.id] === 1}
                                    className="p-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 dark:disabled:bg-gray-700 rounded"
                                  >
                                    <MdNavigateBefore />
                                  </button>
                                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">
                                    {currentPages[league.id] || 1} /{" "}
                                    {totalPages[league.id]}
                                  </span>
                                  <button
                                    onClick={() =>
                                      changePage(
                                        league.id,
                                        Math.min(
                                          totalPages[league.id],
                                          currentPages[league.id] + 1
                                        )
                                      )
                                    }
                                    disabled={
                                      currentPages[league.id] ===
                                      totalPages[league.id]
                                    }
                                    className="p-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 dark:disabled:bg-gray-700 rounded"
                                  >
                                    <MdNavigateNext />
                                  </button>
                                  <button
                                    onClick={() =>
                                      changePage(
                                        league.id,
                                        totalPages[league.id]
                                      )
                                    }
                                    disabled={
                                      currentPages[league.id] ===
                                      totalPages[league.id]
                                    }
                                    className="p-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 dark:disabled:bg-gray-700 rounded"
                                  >
                                    <MdLastPage />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* User Position Indicator when not visible */}
                            {standings.manager_position &&
                              !standings.standings.some(
                                (entry: any) => entry.entry === managerId
                              ) && (
                                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded">
                                  <div className="flex items-center justify-center">
                                    <span className="text-xs font-medium text-red-700 dark:text-red-300">
                                      You are out of first 50 places (#
                                      {standings.manager_position})
                                    </span>
                                  </div>
                                </div>
                              )}
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
              const currentPage = currentPages[league.id] || 1;
              const loadingKey = `${league.id}_${currentPage}_true`;
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

                          {/* H2H Pagination skeleton */}
                          <div className="p-3 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                <div className="h-6 bg-gray-200 dark:bg-gray-500 rounded w-24 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-20 animate-pulse"></div>
                              </div>
                              <div className="flex items-center space-x-1">
                                {Array.from({ length: 4 }, (_, i) => (
                                  <div
                                    key={i}
                                    className="h-6 w-6 bg-gray-200 dark:bg-gray-500 rounded animate-pulse"
                                  ></div>
                                ))}
                              </div>
                            </div>
                          </div>
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

                          {/* H2H Pagination and User Position */}
                          <div className="p-3 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                {standings.manager_position && (
                                  <button
                                    onClick={() =>
                                      goToUserPage(league.id, true)
                                    }
                                    className="flex items-center gap-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md font-medium transition-colors shadow-sm"
                                  >
                                    <MdPerson className="w-3 h-3" />
                                    Find Me (#{standings.manager_position})
                                  </button>
                                )}
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  First 50 places
                                </span>
                              </div>

                              {totalPages[league.id] > 1 && (
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() =>
                                      changePage(league.id, 1, true)
                                    }
                                    disabled={currentPages[league.id] === 1}
                                    className="p-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 dark:disabled:bg-gray-700 rounded"
                                  >
                                    <MdFirstPage />
                                  </button>
                                  <button
                                    onClick={() =>
                                      changePage(
                                        league.id,
                                        Math.max(
                                          1,
                                          currentPages[league.id] - 1
                                        ),
                                        true
                                      )
                                    }
                                    disabled={currentPages[league.id] === 1}
                                    className="p-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 dark:disabled:bg-gray-700 rounded"
                                  >
                                    <MdNavigateBefore />
                                  </button>
                                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">
                                    {currentPages[league.id] || 1} /{" "}
                                    {totalPages[league.id]}
                                  </span>
                                  <button
                                    onClick={() =>
                                      changePage(
                                        league.id,
                                        Math.min(
                                          totalPages[league.id],
                                          currentPages[league.id] + 1
                                        ),
                                        true
                                      )
                                    }
                                    disabled={
                                      currentPages[league.id] ===
                                      totalPages[league.id]
                                    }
                                    className="p-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 dark:disabled:bg-gray-700 rounded"
                                  >
                                    <MdNavigateNext />
                                  </button>
                                  <button
                                    onClick={() =>
                                      changePage(
                                        league.id,
                                        totalPages[league.id],
                                        true
                                      )
                                    }
                                    disabled={
                                      currentPages[league.id] ===
                                      totalPages[league.id]
                                    }
                                    className="p-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 dark:disabled:bg-gray-700 rounded"
                                  >
                                    <MdLastPage />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* User Position Indicator when not visible in H2H */}
                            {standings.manager_position &&
                              !standings.standings.some(
                                (entry: any) => entry.entry === managerId
                              ) && (
                                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded">
                                  <div className="flex items-center justify-center">
                                    <span className="text-xs font-medium text-red-700 dark:text-red-300">
                                      You are out of first 50 places (#
                                      {standings.manager_position})
                                    </span>
                                  </div>
                                </div>
                              )}
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
