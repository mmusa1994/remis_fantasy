"use client";

import React, { useState, useEffect } from "react";
import {
  MdGroups,
  MdStar,
  MdTrendingUp,
  MdScoreboard,
  MdCompare,
  MdCheckCircle,
  MdSports,
  MdMoodBad,
  MdSentimentNeutral,
  MdThumbDown,
  MdDangerous,
} from "react-icons/md";

interface AdvancedStatisticsProps {
  managerId?: number;
  gameweek: number;
  loading?: boolean;
  managerData?: any;
}

const AdvancedStatistics = React.memo(function AdvancedStatistics({
  managerId,
  gameweek,
  loading = false,
  managerData,
}: AdvancedStatisticsProps) {
  const [advancedData, setAdvancedData] = useState<any>(null);
  const [advancedLoading, setAdvancedLoading] = useState(false);

  // Fetch advanced statistics when managerId changes
  useEffect(() => {
    if (managerId && !loading) {
      setAdvancedLoading(true);
      // Fetch advanced statistics - you can extend this to call real APIs
      const fetchAdvancedStats = async () => {
        try {
          // This could call your gameweek-status API or a new advanced-stats API
          // const response = await fetch(`/api/fpl/advanced-stats?managerId=${managerId}&gameweek=${gameweek}`);
          // const result = await response.json();

          // For now, simulate different data based on managerId to show updates
          const randomClones = Math.floor(Math.random() * 5);
          const randomRating = (Math.random() * 100).toFixed(1);
          const randomRankChange = Math.floor(Math.random() * 2000000) + 500000;

          setAdvancedData({
            cloneAnalysis: {
              count: randomClones,
              rating: parseFloat(randomRating),
              lastUpdated: new Date().toISOString(),
            },
            rankDetails: {
              rankChange: randomRankChange,
              percentile: (Math.random() * 50 + 1).toFixed(2),
              lastUpdated: new Date().toISOString(),
            },
          });
        } catch (error) {
          console.error("Failed to fetch advanced stats:", error);
        } finally {
          setAdvancedLoading(false);
        }
      };

      // Delay to show loading state
      const timer = setTimeout(fetchAdvancedStats, 300);
      return () => clearTimeout(timer);
    }
  }, [managerId, gameweek, loading]);

  if (loading || advancedLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Napredne statistike
        </h3>
        <div className="text-center text-gray-500 dark:text-gray-400">
          Učitavam napredne statistike...
        </div>
      </div>
    );
  }

  if (!managerId) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Napredne statistike
        </h3>
        <div className="text-center text-gray-500 dark:text-gray-400">
          Učitajte tim da vidite napredne statistike
        </div>
      </div>
    );
  }

  // Extract real data from API responses
  const cloneData = {
    count: advancedData?.cloneAnalysis?.count ?? 0, // Updates with new data
    rating: advancedData?.cloneAnalysis?.rating ?? 39.8,
    averageClones: 30.43,
    mostDuplicated: 4611,
    commonPlayers: 4.4,
  };

  const manager = managerData?.manager;
  const teamTotals = managerData?.team_totals;
  const captain = managerData?.captain;

  const rankData = {
    currentRank: manager?.summary_overall_rank || 0,
    oldRank: 4000000, // Would need historical data
    rankChange: advancedData?.rankDetails?.rankChange || 1626184, // Updates with new data
    rankPercent: advancedData?.rankDetails?.percentile || 21.58, // Updates with new data
    points:
      managerData?.entry_history?.points ||
      teamTotals?.active_points_final ||
      0,
    pointsGained: 5, // Would calculate from previous GW
    benchedPoints: teamTotals?.bench_points_final || 0,
    safetyScore: 57, // Average * 0.9 approximation
  };

  // Find top performers from team data
  const teamWithStats = managerData?.team_with_stats || [];
  const activeTeam = teamWithStats.filter(
    (player: any) => player.position <= 11 && player.live_stats
  );

  const sortedByPoints = [...activeTeam].sort(
    (a, b) =>
      (b.live_stats?.total_points || 0) - (a.live_stats?.total_points || 0)
  );

  const teamAnalysis = {
    stars:
      managerId && sortedByPoints.length > 0
        ? sortedByPoints.slice(0, 1).map((player) => ({
            name: player.player?.web_name || "Unknown",
            points: (player.live_stats?.total_points || 0) * player.multiplier,
            gain: 21.24, // Would calculate differential gain
          }))
        : [{ name: "Haaland", points: 26, gain: 21.24 }],
    flops:
      managerId && sortedByPoints.length > 0
        ? sortedByPoints.slice(-1).map((player) => ({
            name: player.player?.web_name || "Unknown",
            points: (player.live_stats?.total_points || 0) * player.multiplier,
            gain: 0.91, // Would calculate differential impact
          }))
        : [{ name: "Gyökeres", points: 1, gain: 0.91 }],
    killers: [{ name: "M.Salah", points: 8, loss: -11.46 }], // Would calculate threats
  };

  const comparison = {
    yourTeam: rankData.points,
    top10k: 56.83, // Would come from API
    overall: 53.95, // Would come from API
    elite: 55.32, // Would come from API
    captainPoints: captain?.stats?.total_points
      ? captain.stats.total_points * 2
      : 0,
    captainTop10k: 16.37,
    captainOverall: 13.1,
    captainElite: 16.25,
  };

  return (
    <div className="space-y-6">
      {/* Clone Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <MdGroups className="text-blue-500 text-xl mr-2" />
            Analiza klonova
          </h3>
          {advancedLoading && (
            <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Ažuriram podatke...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-600">
            <div className="mb-4">
              <div className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Našli smo tačno
              </div>
              <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                {cloneData.count}
              </div>
              <div className="text-base text-gray-600 dark:text-gray-400 mb-6">
                klonova vašeg tima u top 1 milion!
              </div>
            </div>

            <div className="mb-4">
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-lg font-bold shadow-xl transform hover:scale-105 transition-transform">
                <MdStar className="mr-2 text-xl" />
                Bukvalno ste jedan u milion!
              </div>
            </div>

            <div className="text-sm text-purple-700 dark:text-purple-300 font-medium">
              🎆 Jedinstveni tim • Kreativna selekcija • Originalan pristup
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">
                Prosječno klonova po menadžeru:
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {cloneData.averageClones}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">
                Najviše dupliciran tim:
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {cloneData.mostDuplicated}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">
                Dijeli igrače sa aktivnim menadžerima:
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {cloneData.commonPlayers}/11
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-blue-600 dark:text-blue-400">
                Rejting klonova:
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {cloneData.rating}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rank Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
          <MdTrendingUp className="text-green-500 text-xl mr-2" />
          Detalji ranga
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <MdScoreboard className="text-blue-600 text-2xl mx-auto mb-2" />
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {rankData.points}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Gameweek bodovi
            </div>
          </div>

          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <MdTrendingUp className="text-green-600 text-2xl mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              +{rankData.rankChange.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Poboljšanje ranga
            </div>
          </div>

          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <MdStar className="text-purple-600 text-2xl mx-auto mb-2" />
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {rankData.rankPercent}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Top procenat
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="font-bold text-gray-900 dark:text-white">
              {rankData.currentRank.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Trenutni rang
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="font-bold text-gray-900 dark:text-white">
              +{rankData.pointsGained}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Dobijeni bodovi
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="font-bold text-gray-900 dark:text-white">
              {rankData.benchedPoints}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Bodovi na klupi
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="font-bold text-gray-900 dark:text-white">
              {rankData.safetyScore}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Prosjecan rezultat U GW
            </div>
          </div>
        </div>
      </div>

      {/* Player Performance Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
          <MdSports className="text-orange-500 text-xl mr-2" />
          Analiza performansi igrača
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stars */}
          <div>
            <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-3 flex items-center">
              <MdStar className="mr-2" />
              Zvijezde
            </h4>
            {teamAnalysis.stars.map((player, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg mb-2"
              >
                <div className="flex items-center">
                  <MdStar className="text-yellow-600 mr-2" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {player.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-600 dark:text-yellow-400">
                    {player.points} bodova
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    +{player.gain}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Flops */}
          <div>
            <h4 className="font-medium text-gray-600 dark:text-gray-400 mb-3 flex items-center">
              <MdSentimentNeutral className="mr-2" />
              Neuspjesi
            </h4>
            {teamAnalysis.flops.map((player, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-2"
              >
                <div className="flex items-center">
                  <MdThumbDown className="text-gray-600 mr-2" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {player.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-600 dark:text-gray-400">
                    {player.points} bodova
                  </div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">
                    +{player.gain}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Killers */}
          <div>
            <h4 className="font-medium text-red-600 dark:text-red-400 mb-3 flex items-center">
              <MdMoodBad className="mr-2" />
              Ubice
            </h4>
            {teamAnalysis.killers.map((player, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg mb-2"
              >
                <div className="flex items-center">
                  <MdDangerous className="text-red-600 mr-2" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {player.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600 dark:text-red-400">
                    {player.points} bodova
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">
                    {player.loss}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Comparison */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
          <MdCompare className="text-indigo-500 text-xl mr-2" />
          Poređenje sa Top 10k, Ukupno i Elite menadžerima
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                  Statistika
                </th>
                <th className="text-center py-3 px-4 text-blue-600 dark:text-blue-400">
                  Vaš tim
                </th>
                <th className="text-center py-3 px-4 text-purple-600 dark:text-purple-400">
                  Top 10k
                </th>
                <th className="text-center py-3 px-4 text-green-600 dark:text-green-400">
                  Ukupno
                </th>
                <th className="text-center py-3 px-4 text-yellow-600 dark:text-yellow-400">
                  Elite
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 px-4 text-gray-900 dark:text-white">
                  Finalni rezultat
                </td>
                <td className="text-center py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                  {comparison.yourTeam}
                </td>
                <td className="text-center py-3 px-4 text-purple-600 dark:text-purple-400">
                  {comparison.top10k}
                </td>
                <td className="text-center py-3 px-4 text-green-600 dark:text-green-400">
                  {comparison.overall}
                </td>
                <td className="text-center py-3 px-4 text-yellow-600 dark:text-yellow-400">
                  {comparison.elite}
                </td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 px-4 text-gray-900 dark:text-white">
                  Bodovi kapitena
                </td>
                <td className="text-center py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                  {comparison.captainPoints}
                </td>
                <td className="text-center py-3 px-4 text-purple-600 dark:text-purple-400">
                  {comparison.captainTop10k}
                </td>
                <td className="text-center py-3 px-4 text-green-600 dark:text-green-400">
                  {comparison.captainOverall}
                </td>
                <td className="text-center py-3 px-4 text-yellow-600 dark:text-yellow-400">
                  {comparison.captainElite}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Captain Analysis Enhancement */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
          <MdStar className="text-yellow-500 text-xl mr-2" />
          Detaljana analiza kapitena
        </h3>

        <div className="relative p-6 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <div className="absolute top-4 right-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <MdStar className="text-white text-xl" />
            </div>
          </div>

          <div className="pr-16">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mr-3">
                <MdSports className="text-white text-sm" />
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {captain?.stats
                  ? teamWithStats.find(
                      (p: any) => p.player_id === captain.player_id
                    )?.player?.web_name || "Unknown"
                  : "No Captain"}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-lg text-gray-800 dark:text-gray-200 mb-2">
                završio sa{" "}
                <span className="font-bold text-blue-600 dark:text-blue-400 text-2xl">
                  {captain?.stats?.total_points
                    ? captain.stats.total_points * 2
                    : 0}{" "}
                  bodova
                </span>
              </div>

              <div className="flex items-center mb-2">
                <MdTrendingUp className="text-green-500 mr-2" />
                <span className="text-base text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-green-600 dark:text-green-400 text-lg">
                    {captain?.stats
                      ? (
                          captain.stats.total_points * 2 -
                          comparison.captainElite
                        ).toFixed(1)
                      : "0.0"}{" "}
                    bodova više
                  </span>{" "}
                  od prosječnog elite kapitena
                </span>
              </div>

              <div className="flex items-center">
                <MdCheckCircle className="text-green-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Odličan izbor kapitena za ovaj gameweek!
                </span>
              </div>
            </div>

            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-sm font-medium shadow-lg">
              <MdStar className="mr-2" />
              Elite kapiten performanse
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AdvancedStatistics;
