'use client';

interface ManagerSummaryProps {
  manager?: {
    id: number;
    player_first_name: string;
    player_last_name: string;
    name: string;
    summary_overall_points: number;
    summary_overall_rank: number;
    summary_event_points: number;
    summary_event_rank: number;
  };
  teamTotals?: {
    goals: number;
    assists: number;
    clean_sheets: number;
    yellow_cards: number;
    red_cards: number;
    saves: number;
    total_points_no_bonus: number;
    total_points_final: number;
    predicted_bonus: number;
    final_bonus: number;
  };
  captain?: {
    player_id?: number;
    stats?: any;
  };
  viceCaptain?: {
    player_id?: number;
    stats?: any;
  };
  bonusAdded: boolean;
  gameweek: number;
  lastUpdated?: string;
}

export default function ManagerSummary({
  manager,
  teamTotals,
  captain,
  viceCaptain,
  bonusAdded,
  gameweek,
  lastUpdated,
}: ManagerSummaryProps) {
  if (!manager || !teamTotals) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Manager Overview</h3>
        <div className="text-center text-gray-500 dark:text-gray-400">
          Load a team to see manager overview
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => num.toLocaleString();
  const formatRank = (rank: number) => {
    if (rank === 0) return 'N/A';
    return `#${formatNumber(rank)}`;
  };

  const currentPoints = bonusAdded ? teamTotals.total_points_final : teamTotals.total_points_no_bonus;
  const bonusPoints = bonusAdded ? teamTotals.final_bonus : teamTotals.predicted_bonus;
  const bonusLabel = bonusAdded ? 'Final Bonus' : 'Predicted Bonus';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Manager Overview - GW{gameweek}
        </h3>
        {lastUpdated && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Manager Info</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Name:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {manager.player_first_name} {manager.player_last_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Team:</span>
              <span className="font-medium text-gray-900 dark:text-white">{manager.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Overall Points:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(manager.summary_overall_points)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Overall Rank:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatRank(manager.summary_overall_rank)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">GW{gameweek} Performance</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Team Points:</span>
              <div className="text-right">
                <span className="font-bold text-lg text-green-600 dark:text-green-400">
                  {currentPoints}
                </span>
                {!bonusAdded && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">
                    (provisional)
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{bonusLabel}:</span>
              <span className={`font-medium ${bonusAdded ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                +{bonusPoints}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Captain Points:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {captain?.stats?.total_points ? captain.stats.total_points * 2 : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Team Stats</h4>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {teamTotals.goals}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Goals</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {teamTotals.assists}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Assists</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {teamTotals.clean_sheets}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">CS</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {teamTotals.yellow_cards}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">YC</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {teamTotals.red_cards}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">RC</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {teamTotals.saves}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Saves</div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${bonusAdded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          {bonusAdded ? 'Bonus finalized' : 'Bonus predicted'}
        </div>
        <div>Manager ID: {manager.id}</div>
      </div>
    </div>
  );
}