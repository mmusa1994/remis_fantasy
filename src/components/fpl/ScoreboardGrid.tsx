'use client';

interface Team {
  id: number;
  name: string;
  short_name: string;
}

interface Fixture {
  id: number;
  gw: number;
  team_h: number;
  team_a: number;
  team_h_score?: number;
  team_a_score?: number;
  started: boolean;
  finished: boolean;
  minutes?: number;
  kickoff_time?: string;
  team_h_data?: Team;
  team_a_data?: Team;
}

interface BonusResult {
  player_id: number;
  predicted_bonus: number;
  bps: number;
  rank: number;
  web_name: string;
}

interface FixtureBonus {
  fixture_id: number;
  bonuses: BonusResult[];
  team_h_id: number;
  team_a_id: number;
}

interface ScoreboardGridProps {
  fixtures: Fixture[];
  predictedBonuses: FixtureBonus[];
  bonusAdded: boolean;
}

export default function ScoreboardGrid({ fixtures, predictedBonuses, bonusAdded }: ScoreboardGridProps) {
  if (!fixtures || fixtures.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Scoreboard</h3>
        <div className="text-center text-gray-500 dark:text-gray-400">
          No fixtures to display
        </div>
      </div>
    );
  }

  const getFixtureBonus = (fixtureId: number) => {
    return predictedBonuses.find(fb => fb.fixture_id === fixtureId);
  };

  const getMatchStatus = (fixture: Fixture) => {
    if (fixture.finished) return 'FT';
    if (fixture.started) return `${fixture.minutes || 0}'`;
    if (fixture.kickoff_time) {
      return new Date(fixture.kickoff_time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    return 'TBC';
  };

  const getScoreDisplay = (fixture: Fixture) => {
    if (fixture.team_h_score !== null && fixture.team_a_score !== null) {
      return `${fixture.team_h_score} - ${fixture.team_a_score}`;
    }
    return 'v';
  };

  const FixtureCard = ({ fixture }: { fixture: Fixture }) => {
    const fixtureBonus = getFixtureBonus(fixture.id);
    const homeTeam = fixture.team_h_data?.short_name || `Team ${fixture.team_h}`;
    const awayTeam = fixture.team_a_data?.short_name || `Team ${fixture.team_a}`;

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="text-center">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {homeTeam}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {getMatchStatus(fixture)}
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {awayTeam}
            </div>
          </div>

          <div className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            {getScoreDisplay(fixture)}
          </div>

          {fixture.started && !fixture.finished && (
            <div className="flex items-center justify-center space-x-1 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                LIVE
              </span>
            </div>
          )}

          {fixtureBonus && fixtureBonus.bonuses.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {bonusAdded ? 'Final Bonus' : 'Predicted Bonus'}
              </div>
              <div className="space-y-1">
                {fixtureBonus.bonuses
                  .filter(bonus => bonus.predicted_bonus > 0)
                  .sort((a, b) => b.predicted_bonus - a.predicted_bonus)
                  .slice(0, 3)
                  .map((bonus, index) => (
                    <div key={bonus.player_id} className="flex justify-between items-center text-xs">
                      <span className="text-gray-700 dark:text-gray-300 truncate mr-2">
                        {bonus.web_name}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          bonusAdded 
                            ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200'
                            : 'bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200'
                        }`}>
                          +{bonus.predicted_bonus}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          ({bonus.bps})
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Scoreboard
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {fixtures.length} fixture{fixtures.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {fixtures.map((fixture) => (
          <FixtureCard key={fixture.id} fixture={fixture} />
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
            <span>Live Match</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
            <span>Finished</span>
          </div>
          {!bonusAdded && (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
              <span>Predicted Bonus</span>
            </div>
          )}
          {bonusAdded && (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              <span>Final Bonus</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}