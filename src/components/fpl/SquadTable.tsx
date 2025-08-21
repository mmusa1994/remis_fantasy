'use client';

interface Player {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team: number;
  element_type: number;
}

interface LiveStats {
  player_id: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  total_points: number;
  influence: number;
  creativity: number;
  threat: number;
  ict_index: number;
}

interface TeamPick {
  player_id: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  player: Player;
  live_stats: LiveStats | null;
}

interface PredictedBonus {
  player_id: number;
  predicted_bonus: number;
}

interface SquadTableProps {
  teamData: TeamPick[];
  predictedBonuses: PredictedBonus[];
  bonusAdded: boolean;
}

const POSITION_NAMES = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

const TEAM_NAMES: { [key: number]: string } = {
  1: 'ARS', 2: 'AVL', 3: 'BOU', 4: 'BRE', 5: 'BHA', 6: 'CHE', 7: 'CRY', 8: 'EVE',
  9: 'FUL', 10: 'IPS', 11: 'LEI', 12: 'LIV', 13: 'MCI', 14: 'MUN', 15: 'NEW',
  16: 'NFO', 17: 'SOU', 18: 'TOT', 19: 'WHU', 20: 'WOL'
};

export default function SquadTable({ teamData, predictedBonuses, bonusAdded }: SquadTableProps) {
  if (!teamData || teamData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Squad</h3>
        <div className="text-center text-gray-500 dark:text-gray-400">
          Load a team to see squad details
        </div>
      </div>
    );
  }

  const starters = teamData.filter(pick => pick.position <= 11).sort((a, b) => a.position - b.position);
  const bench = teamData.filter(pick => pick.position > 11).sort((a, b) => a.position - b.position);

  const getPredictedBonus = (playerId: number) => {
    const bonus = predictedBonuses.find(b => b.player_id === playerId);
    return bonus ? bonus.predicted_bonus : 0;
  };

  const formatICT = (value: number) => {
    return value ? value.toFixed(1) : '0.0';
  };

  const getMultiplierDisplay = (pick: TeamPick) => {
    if (pick.is_captain) return '(C)';
    if (pick.is_vice_captain) return '(VC)';
    if (pick.multiplier === 3) return '(TC)';
    return pick.multiplier > 1 ? `x${pick.multiplier}` : '';
  };

  const PlayerRow = ({ pick, isStarter }: { pick: TeamPick; isStarter: boolean }) => {
    const stats = pick.live_stats;
    const predictedBonus = getPredictedBonus(pick.player_id);
    const displayBonus = bonusAdded ? (stats?.bonus || 0) : predictedBonus;
    const totalPoints = stats?.total_points || 0;
    const adjustedPoints = totalPoints * pick.multiplier;

    return (
      <tr className={`${!isStarter ? 'bg-gray-50 dark:bg-gray-700' : ''} hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors`}>
        <td className="px-3 py-2 text-sm">
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded ${pick.is_captain || pick.is_vice_captain ? 'bg-yellow-200 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
              {POSITION_NAMES[pick.player.element_type as keyof typeof POSITION_NAMES]}
            </span>
            {!isStarter && <span className="text-xs text-gray-500">(BENCH)</span>}
          </div>
        </td>
        <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
          <div>
            {pick.player.web_name} {getMultiplierDisplay(pick)}
          </div>
        </td>
        <td className="px-3 py-2 text-sm text-center">
          <span className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
            {TEAM_NAMES[pick.player.team] || `T${pick.player.team}`}
          </span>
        </td>
        <td className="px-3 py-2 text-sm text-center">{stats?.minutes || 0}</td>
        <td className="px-3 py-2 text-sm text-center">{stats?.goals_scored || 0}</td>
        <td className="px-3 py-2 text-sm text-center">{stats?.assists || 0}</td>
        <td className="px-3 py-2 text-sm text-center">{stats?.clean_sheets || 0}</td>
        <td className="px-3 py-2 text-sm text-center text-yellow-600">{stats?.yellow_cards || 0}</td>
        <td className="px-3 py-2 text-sm text-center text-red-600">{stats?.red_cards || 0}</td>
        <td className="px-3 py-2 text-sm text-center">{stats?.saves || 0}</td>
        <td className="px-3 py-2 text-sm text-center">{stats?.bps || 0}</td>
        <td className={`px-3 py-2 text-sm text-center ${bonusAdded ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
          {displayBonus > 0 ? `+${displayBonus}` : '0'}
        </td>
        <td className="px-3 py-2 text-sm text-center font-bold text-green-600 dark:text-green-400">
          {adjustedPoints}
        </td>
        <td className="px-3 py-2 text-sm text-center">{formatICT(stats?.ict_index || 0)}</td>
      </tr>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Squad (XI + Bench)</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {bonusAdded ? 'Showing final bonus points' : 'Showing predicted bonus points'}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pos</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Player</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Team</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Min</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">G</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">A</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">CS</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">YC</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">RC</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Saves</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">BPS</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bonus</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ICT</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {starters.map((pick) => (
              <PlayerRow key={pick.player_id} pick={pick} isStarter={true} />
            ))}
            {bench.length > 0 && (
              <>
                <tr className="bg-gray-100 dark:bg-gray-600">
                  <td colSpan={14} className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                    Bench
                  </td>
                </tr>
                {bench.map((pick) => (
                  <PlayerRow key={pick.player_id} pick={pick} isStarter={false} />
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex justify-between items-center">
          <div>
            (C) = Captain • (VC) = Vice Captain • (TC) = Triple Captain
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              <span>Starting XI</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
              <span>Bench</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}