"use client";

import React from "react";
import { PiTShirtLight, PiTShirtFill } from "react-icons/pi";
import { getTeamColors } from "@/lib/team-colors";

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

const ScoreboardGrid = React.memo(function ScoreboardGrid({
  fixtures,
  predictedBonuses,
  bonusAdded,
}: ScoreboardGridProps) {
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
    return predictedBonuses.find((fb) => fb.fixture_id === fixtureId);
  };

  const getMatchStatus = (fixture: Fixture) => {
    if (fixture.finished) return "FT";
    if (fixture.started) return `${fixture.minutes || 0}'`;
    if (fixture.kickoff_time) {
      return new Date(fixture.kickoff_time).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    return "TBC";
  };

  const getScoreDisplay = (fixture: Fixture) => {
    // If match is started or finished, show scores (treat null as 0)
    if (fixture.started || fixture.finished) {
      const homeScore = fixture.team_h_score ?? 0;
      const awayScore = fixture.team_a_score ?? 0;
      return `${homeScore} - ${awayScore}`;
    }
    return "v";
  };

  const TeamDisplay = ({ teamId }: { teamId: number }) => {
    const teamColors = getTeamColors(teamId);
    const hasSecondaryColor = teamColors.primary !== teamColors.secondary;

    return (
      <div className="flex flex-col items-center space-y-1 min-w-0">
        <div style={{ color: teamColors.primary }} className="flex-shrink-0">
          {hasSecondaryColor ? (
            <PiTShirtFill size={24} />
          ) : (
            <PiTShirtLight size={24} />
          )}
        </div>
        <span className="text-xs font-bold text-gray-900 dark:text-white text-center">
          {teamColors.shortName}
        </span>
      </div>
    );
  };

  const FixtureCard = ({ fixture }: { fixture: Fixture }) => {
    const fixtureBonus = getFixtureBonus(fixture.id);

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-xl transition-all duration-300 w-full max-w-sm mx-auto hover:border-blue-300 dark:hover:border-blue-600">
        <div className="text-center">
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                {getMatchStatus(fixture)}
              </div>
            </div>
            <div className="flex items-center justify-between px-2">
              <div className="flex-1 flex justify-center">
                <TeamDisplay teamId={fixture.team_h} />
              </div>
              <div className="px-4">
                <div className="text-lg font-bold text-gray-400 dark:text-gray-500">
                  VS
                </div>
              </div>
              <div className="flex-1 flex justify-center">
                <TeamDisplay teamId={fixture.team_a} />
              </div>
            </div>
          </div>

          <div className="text-3xl font-black text-gray-900 dark:text-white mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {getScoreDisplay(fixture)}
          </div>

          {fixture.started && !fixture.finished && (
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 dark:text-green-400 font-bold">
                UŽIVO
              </span>
            </div>
          )}

          {fixtureBonus && fixtureBonus.bonuses.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
                {bonusAdded ? "Finalni bonus" : "Predviđeni bonus"}
              </div>
              <div className="space-y-2">
                {fixtureBonus.bonuses
                  .filter((bonus) => bonus.predicted_bonus > 0)
                  .sort((a, b) => b.predicted_bonus - a.predicted_bonus)
                  .slice(0, 3)
                  .map((bonus) => (
                    <div
                      key={bonus.player_id}
                      className="flex justify-between items-center text-xs"
                    >
                      <span className="text-gray-700 dark:text-gray-300 truncate mr-2 font-medium">
                        {bonus.web_name}
                      </span>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            bonusAdded
                              ? "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200"
                              : "bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200"
                          }`}
                        >
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
          Rezultati utakmica
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {fixtures.length} utakmica{fixtures.length !== 1 ? "a" : ""}
        </div>
      </div>

      {/* Responsive grid with max 2 cards per row */}
      <div className="w-full overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-6 justify-items-center px-2 grid-cols-1 md:grid-cols-2">
            {fixtures.map((fixture) => (
              <FixtureCard key={fixture.id} fixture={fixture} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-6 text-xs text-gray-500 dark:text-gray-400 justify-center sm:justify-start">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span>Uživo</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
            <span>Završeno</span>
          </div>
          {!bonusAdded && (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              <span>Predviđeni bonus</span>
            </div>
          )}
          {bonusAdded && (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Finalni bonus</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ScoreboardGrid;
