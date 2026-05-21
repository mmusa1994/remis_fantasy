"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdRefresh } from "react-icons/md";
import { PiTShirtFill } from "react-icons/pi";
import LoadingCard from "@/components/shared/LoadingCard";
import { getTeamColors } from "@/lib/team-colors";

interface BpsPlayer {
  element: number;
  web_name: string;
  team: number;
  position: number;
  minutes: number;
  bps: number;
  predicted_bonus: number;
  current_bonus: number;
}

interface BpsFixture {
  fixture_id: number;
  kickoff_time: string;
  started: boolean;
  finished: boolean;
  finished_provisional: boolean;
  minutes: number;
  team_h: string;
  team_a: string;
  team_h_id: number;
  team_a_id: number;
  team_h_score: number | null;
  team_a_score: number | null;
  bps_leaderboard: BpsPlayer[];
}

const POSITION_LABEL: Record<number, string> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

export default function BpsLivePanel() {
  const { t } = useTranslation("fpl");
  const [gameweek, setGameweek] = useState<number | null>(null);
  const [fixtures, setFixtures] = useState<BpsFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detectGameweek = useCallback(async () => {
    try {
      const res = await fetch("/api/fpl/bootstrap-static");
      const data = await res.json();
      if (data?.success && data.data?.events) {
        const events = data.data.events as Array<{
          id: number;
          is_current: boolean;
          is_next: boolean;
        }>;
        const current = events.find((e) => e.is_current) || events.find((e) => e.is_next);
        if (current) {
          setGameweek(current.id);
          return current.id;
        }
      }
    } catch {
      // fallthrough
    }
    return null;
  }, []);

  const fetchLeaderboard = useCallback(
    async (gw: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/fpl/bps-leaderboard?gw=${gw}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to load");
        setFixtures(json.data.fixtures || []);
        setLastUpdated(json.data.last_updated || new Date().toISOString());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    (async () => {
      const detected = await detectGameweek();
      if (detected) await fetchLeaderboard(detected);
      else setLoading(false);
    })();
  }, [detectGameweek, fetchLeaderboard]);

  return (
    <div className="space-y-4 p-4">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-theme-foreground">
            {t("bps.title", "BPS Live Leaderboard")}
          </h2>
          {gameweek && (
            <p className="text-sm text-theme-text-secondary">
              Gameweek {gameweek}
              {lastUpdated && (
                <span className="ml-2">
                  · {t("leagueTables.updated", "Updated")}:{" "}
                  {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </p>
          )}
        </div>
        {gameweek && (
          <button
            onClick={() => fetchLeaderboard(gameweek)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-md disabled:opacity-50"
          >
            <MdRefresh className="w-4 h-4" />
            {t("leagueTables.refresh", "Refresh")}
          </button>
        )}
      </header>

      {error && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && fixtures.length === 0 && <LoadingCard title="" description="" />}

      {!loading && fixtures.length === 0 && !error && (
        <div className="p-4 rounded-md bg-theme-card border border-theme-border text-sm text-theme-text-secondary">
          {t("bps.noFixtures", "No fixtures available for this gameweek yet.")}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {fixtures.map((fixture) => (
          <div
            key={fixture.fixture_id}
            className="bg-theme-card border border-theme-border rounded-lg overflow-hidden"
          >
            <div className="px-3 py-2 bg-theme-card-secondary border-b border-theme-border flex items-center justify-between text-sm">
              <span className="font-semibold text-theme-foreground">
                {fixture.team_h} vs {fixture.team_a}
                {fixture.team_h_score !== null &&
                  fixture.team_a_score !== null && (
                    <span className="ml-2 text-theme-text-secondary">
                      {fixture.team_h_score} - {fixture.team_a_score}
                    </span>
                  )}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-md ${
                  fixture.finished
                    ? "bg-gray-200 dark:bg-gray-700 text-theme-text-secondary"
                    : fixture.started
                      ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                      : "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                }`}
              >
                {fixture.finished
                  ? t("bps.fixtureFinished", "Finished")
                  : fixture.started
                    ? `🔴 ${fixture.minutes}'`
                    : "Upcoming"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-theme-card-secondary/60 text-theme-text-secondary uppercase">
                  <tr>
                    <th className="px-2 py-1 text-left">Player</th>
                    <th className="px-2 py-1 text-center">Pos</th>
                    <th className="px-2 py-1 text-center">Min</th>
                    <th className="px-2 py-1 text-center">BPS</th>
                    <th className="px-2 py-1 text-center">Pred.</th>
                    <th className="px-2 py-1 text-center">Bonus</th>
                  </tr>
                </thead>
                <tbody>
                  {fixture.bps_leaderboard.slice(0, 15).map((player) => {
                    const colors = getTeamColors(player.team || 1);
                    return (
                    <tr
                      key={player.element}
                      className="border-t border-theme-border"
                    >
                      <td className="px-2 py-1 font-medium text-theme-foreground max-w-[160px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="flex items-center justify-center w-6 h-6 rounded-md shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${colors.primary}1a 0%, ${colors.primary}0d 100%)`,
                            }}
                          >
                            <PiTShirtFill
                              className="w-3.5 h-3.5"
                              style={{
                                color: colors.primary,
                                filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))",
                              } as React.CSSProperties}
                            />
                          </div>
                          <span className="truncate">{player.web_name}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1 text-center text-theme-text-secondary">
                        {POSITION_LABEL[player.position] || ""}
                      </td>
                      <td className="px-2 py-1 text-center">{player.minutes}</td>
                      <td className="px-2 py-1 text-center font-bold">
                        {player.bps}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {player.predicted_bonus > 0 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                            {player.predicted_bonus}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-2 py-1 text-center font-medium">
                        {player.current_bonus > 0 ? player.current_bonus : "—"}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
