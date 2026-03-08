"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import {
  MdRefresh,
  MdCompareArrows,
  MdAdd,
  MdRemove,
  MdClose,
} from "react-icons/md";

interface Player {
  web_name: string;
  element_type: number;
}

interface LiveStats {
  total_points: number;
}

interface TeamPick {
  player_id: number;
  player: Player;
  live_stats: LiveStats | null;
  multiplier: number;
  position: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

interface WhatIfSimulatorProps {
  managerId?: number;
  gameweek: number;
  managerData?: any;
}

type EventType =
  | "goal"
  | "assist"
  | "clean_sheet_lost"
  | "yellow_card"
  | "red_card"
  | "bonus_1"
  | "bonus_2"
  | "bonus_3";

interface HypotheticalEvent {
  id: string;
  playerId: number;
  type: EventType;
  points: number;
}

const POSITION_NAMES: Record<number, string> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

const getGoalPoints = (elementType: number): number => {
  switch (elementType) {
    case 1:
      return 6; // GK
    case 2:
      return 6; // DEF
    case 3:
      return 5; // MID
    case 4:
      return 4; // FWD
    default:
      return 4;
  }
};

const EVENT_CONFIG: Record<
  EventType,
  {
    labelKey: string;
    labelFallback: string;
    bgClass: string;
    textClass: string;
    dotClass: string;
  }
> = {
  goal: {
    labelKey: "whatIf.goal",
    labelFallback: "Goal",
    bgClass: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200",
    textClass: "text-green-600 dark:text-green-400",
    dotClass: "bg-green-500",
  },
  assist: {
    labelKey: "whatIf.assist",
    labelFallback: "Assist",
    bgClass: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200",
    textClass: "text-blue-600 dark:text-blue-400",
    dotClass: "bg-blue-500",
  },
  clean_sheet_lost: {
    labelKey: "whatIf.csLost",
    labelFallback: "CS Lost",
    bgClass: "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200",
    textClass: "text-orange-600 dark:text-orange-400",
    dotClass: "bg-orange-500",
  },
  yellow_card: {
    labelKey: "whatIf.yellow",
    labelFallback: "Yellow",
    bgClass: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200",
    textClass: "text-yellow-600 dark:text-yellow-400",
    dotClass: "bg-yellow-500",
  },
  red_card: {
    labelKey: "whatIf.red",
    labelFallback: "Red",
    bgClass: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200",
    textClass: "text-red-600 dark:text-red-400",
    dotClass: "bg-red-500",
  },
  bonus_1: {
    labelKey: "whatIf.bonus1",
    labelFallback: "+1 Bonus",
    bgClass: "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200",
    textClass: "text-purple-600 dark:text-purple-400",
    dotClass: "bg-purple-500",
  },
  bonus_2: {
    labelKey: "whatIf.bonus2",
    labelFallback: "+2 Bonus",
    bgClass: "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200",
    textClass: "text-purple-600 dark:text-purple-400",
    dotClass: "bg-purple-500",
  },
  bonus_3: {
    labelKey: "whatIf.bonus3",
    labelFallback: "+3 Bonus",
    bgClass: "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200",
    textClass: "text-purple-600 dark:text-purple-400",
    dotClass: "bg-purple-500",
  },
};

const getEventPoints = (type: EventType, elementType: number): number => {
  switch (type) {
    case "goal":
      return getGoalPoints(elementType);
    case "assist":
      return 3;
    case "clean_sheet_lost":
      return elementType <= 2 ? -1 : 0;
    case "yellow_card":
      return -1;
    case "red_card":
      return -3;
    case "bonus_1":
      return 1;
    case "bonus_2":
      return 2;
    case "bonus_3":
      return 3;
    default:
      return 0;
  }
};

const WhatIfSimulator = React.memo(function WhatIfSimulator({
  managerId,
  gameweek,
  managerData,
}: WhatIfSimulatorProps) {
  const { t } = useTranslation("fpl");
  const [events, setEvents] = React.useState<HypotheticalEvent[]>([]);
  const [captainOverride, setCaptainOverride] = React.useState<number | null>(
    null
  );
  const [openDropdown, setOpenDropdown] = React.useState<number | null>(null);

  const teamPicks: TeamPick[] = React.useMemo(() => {
    if (!managerData?.team_with_stats) return [];
    return managerData.team_with_stats;
  }, [managerData]);

  const starters = React.useMemo(
    () =>
      teamPicks
        .filter((p) => p.position <= 11)
        .sort((a, b) => a.position - b.position),
    [teamPicks]
  );

  const bench = React.useMemo(
    () =>
      teamPicks
        .filter((p) => p.position > 11)
        .sort((a, b) => a.position - b.position),
    [teamPicks]
  );

  const currentCaptainId = React.useMemo(() => {
    const captain = teamPicks.find((p) => p.is_captain);
    return captain?.player_id ?? null;
  }, [teamPicks]);

  const effectiveCaptainId = captainOverride ?? currentCaptainId;

  const currentTotalPoints = React.useMemo(() => {
    return starters.reduce((sum, pick) => {
      const pts = pick.live_stats?.total_points ?? 0;
      return sum + pts * pick.multiplier;
    }, 0);
  }, [starters]);

  const scenarioTotalPoints = React.useMemo(() => {
    return starters.reduce((sum, pick) => {
      const basePts = pick.live_stats?.total_points ?? 0;

      const playerEvents = events.filter(
        (e) => e.playerId === pick.player_id
      );
      const eventBonus = playerEvents.reduce((s, e) => s + e.points, 0);

      let multiplier = pick.multiplier;
      if (captainOverride !== null) {
        if (pick.player_id === captainOverride) {
          multiplier = pick.multiplier >= 3 ? 3 : 2;
        } else if (pick.is_captain) {
          multiplier = 1;
        }
      }

      return sum + (basePts + eventBonus) * multiplier;
    }, 0);
  }, [starters, events, captainOverride]);

  const diff = scenarioTotalPoints - currentTotalPoints;

  const getPlayerScenarioPoints = (pick: TeamPick): number => {
    const basePts = pick.live_stats?.total_points ?? 0;
    const playerEvents = events.filter((e) => e.playerId === pick.player_id);
    const eventBonus = playerEvents.reduce((s, e) => s + e.points, 0);

    let multiplier = pick.multiplier;
    if (captainOverride !== null && pick.position <= 11) {
      if (pick.player_id === captainOverride) {
        multiplier = pick.multiplier >= 3 ? 3 : 2;
      } else if (pick.is_captain) {
        multiplier = 1;
      }
    }

    return (basePts + eventBonus) * (pick.position <= 11 ? multiplier : 1);
  };

  const addEvent = (playerId: number, type: EventType) => {
    const pick = teamPicks.find((p) => p.player_id === playerId);
    if (!pick) return;

    const points = getEventPoints(type, pick.player.element_type);
    if (points === 0 && type === "clean_sheet_lost") return;

    const event: HypotheticalEvent = {
      id: `${playerId}-${type}-${Date.now()}`,
      playerId,
      type,
      points,
    };
    setEvents((prev) => [...prev, event]);
    setOpenDropdown(null);
  };

  const removeEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const resetAll = () => {
    setEvents([]);
    setCaptainOverride(null);
  };

  const getPlayerEvents = (playerId: number) =>
    events.filter((e) => e.playerId === playerId);

  const getAvailableEvents = (pick: TeamPick): EventType[] => {
    const available: EventType[] = ["goal", "assist", "yellow_card", "red_card"];
    if (pick.player.element_type <= 2) {
      available.push("clean_sheet_lost");
    }
    available.push("bonus_1", "bonus_2", "bonus_3");
    return available;
  };

  if (!teamPicks.length) {
    return (
      <div className="bg-theme-card border border-theme-border rounded-lg p-4 sm:p-6 theme-transition">
        <h3 className="text-lg font-semibold mb-4 text-theme-foreground theme-transition">
          {t("whatIf.title", "What-If Simulator")}
        </h3>
        <div className="text-center text-theme-text-secondary theme-transition py-8">
          {t(
            "whatIf.loadTeamToSimulate",
            "Load a team to start simulating scenarios"
          )}
        </div>
      </div>
    );
  }

  const PlayerRow = ({
    pick,
    isStarter,
  }: {
    pick: TeamPick;
    isStarter: boolean;
  }) => {
    const playerEvents = getPlayerEvents(pick.player_id);
    const currentPts = (pick.live_stats?.total_points ?? 0) * (isStarter ? pick.multiplier : 1);
    const scenarioPts = getPlayerScenarioPoints(pick);
    const playerDiff = scenarioPts - currentPts;
    const isEffectiveCaptain = pick.player_id === effectiveCaptainId;
    const available = getAvailableEvents(pick);
    const isDropdownOpen = openDropdown === pick.player_id;

    return (
      <div
        className={`flex flex-col gap-1.5 px-3 py-2.5 border-b border-theme-border last:border-b-0 ${
          !isStarter ? "bg-gray-50 dark:bg-gray-800/50" : ""
        } hover:bg-theme-card-secondary/30 transition-colors theme-transition`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                isEffectiveCaptain
                  ? "bg-yellow-500 text-white"
                  : "bg-theme-card-secondary text-theme-text-primary border border-theme-border"
              } theme-transition`}
            >
              {POSITION_NAMES[pick.player.element_type]}
            </span>
            <span className="text-sm font-semibold text-theme-foreground truncate theme-transition">
              {pick.player.web_name}
            </span>
            {isEffectiveCaptain && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 font-bold shrink-0 theme-transition">
                C
              </span>
            )}
            {pick.is_vice_captain &&
              pick.player_id !== effectiveCaptainId && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-bold shrink-0 theme-transition">
                  VC
                </span>
              )}
            {!isStarter && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium shrink-0 theme-transition">
                {t("whatIf.bench", "Bench").toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-sm font-bold text-theme-foreground theme-transition">
                {currentPts}
              </span>
              {playerDiff !== 0 && (
                <span
                  className={`text-xs font-bold ml-1.5 ${
                    playerDiff > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {playerDiff > 0 ? "+" : ""}
                  {playerDiff}
                </span>
              )}
            </div>

            {isStarter && (
              <div className="relative flex items-center gap-1">
                {playerEvents.length > 0 && (
                  <button
                    onClick={() => {
                      const last = playerEvents[playerEvents.length - 1];
                      if (last) removeEvent(last.id);
                    }}
                    className="p-1 rounded-md bg-theme-card-secondary text-theme-text-secondary hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40 dark:hover:text-red-400 transition-colors"
                    title="Remove last event"
                  >
                    <MdRemove size={16} />
                  </button>
                )}
                <button
                  onClick={() =>
                    setOpenDropdown(isDropdownOpen ? null : pick.player_id)
                  }
                  className="p-1 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors"
                  title="Add event"
                >
                  <MdAdd size={16} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-8 z-50 bg-theme-card border border-theme-border rounded-lg shadow-xl py-1 min-w-[160px] theme-transition">
                    {available.map((eventType) => {
                      const config = EVENT_CONFIG[eventType];
                      const pts = getEventPoints(
                        eventType,
                        pick.player.element_type
                      );
                      return (
                        <button
                          key={eventType}
                          onClick={() => addEvent(pick.player_id, eventType)}
                          className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-theme-foreground hover:bg-theme-card-secondary/50 transition-colors theme-transition"
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotClass}`} />
                          <span>{t(config.labelKey, config.labelFallback)}</span>
                          <span
                            className={`ml-auto text-xs font-bold ${
                              pts > 0
                                ? "text-green-600 dark:text-green-400"
                                : pts < 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-theme-text-secondary"
                            }`}
                          >
                            {pts > 0 ? "+" : ""}
                            {pts}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {playerEvents.length > 0 && (
          <div className="flex flex-wrap gap-1 pl-8">
            {playerEvents.map((event) => {
              const config = EVENT_CONFIG[event.type];
              return (
                <span
                  key={event.id}
                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded text-theme-foreground border border-theme-border font-medium`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
                  {t(config.labelKey, config.labelFallback)}
                  <span className="font-bold">
                    ({event.points > 0 ? "+" : ""}
                    {event.points})
                  </span>
                  <button
                    onClick={() => removeEvent(event.id)}
                    className="ml-0.5 hover:opacity-70 transition-opacity"
                  >
                    <MdClose size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-theme-card border border-theme-border rounded-lg overflow-hidden theme-transition">
      {/* Header */}
      <div className="px-4 py-4 border-b border-theme-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-theme-foreground">
              {t("whatIf.title", "What-If Simulator")}
            </h3>
            <p className="text-sm text-theme-text-secondary mt-0.5">
              {t(
                "whatIf.description",
                "Simulate hypothetical events and captain changes"
              )}
            </p>
          </div>
          {(events.length > 0 || captainOverride !== null) && (
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-theme-border text-theme-text-secondary hover:text-theme-foreground text-sm font-medium transition-colors"
            >
              <MdRefresh size={16} />
              {t("whatIf.reset", "Reset")}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Left Panel: Squad list */}
        <div className="flex-1 lg:border-r border-theme-border theme-transition">
          {/* Captain selector */}
          <div className="px-3 py-3 border-b border-theme-border bg-theme-card-secondary/30 theme-transition">
            <label className="text-sm font-medium text-theme-foreground theme-transition">
              {t("whatIf.changeCaptain", "Change Captain")}
            </label>
            <select
              value={effectiveCaptainId ?? ""}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCaptainOverride(
                  val === currentCaptainId ? null : val
                );
              }}
              className="mt-1.5 w-full text-sm rounded-md border border-theme-border bg-theme-card text-theme-foreground px-3 py-2 theme-transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {starters.map((pick) => (
                <option key={pick.player_id} value={pick.player_id}>
                  {pick.player.web_name} ({POSITION_NAMES[pick.player.element_type]})
                  {pick.player_id === currentCaptainId ? ` - ${t("whatIf.current", "Current")}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Starters */}
          <div>
            <div className="px-3 py-2 border-b border-theme-border text-xs font-bold uppercase tracking-wide text-theme-text-secondary">
              {t("whatIf.startingXI", "Starting XI")}
            </div>
            {starters.map((pick) => (
              <PlayerRow key={pick.player_id} pick={pick} isStarter={true} />
            ))}
          </div>

          {/* Bench */}
          {bench.length > 0 && (
            <div>
              <div className="px-3 py-2 border-b border-theme-border text-xs font-bold uppercase tracking-wide text-theme-text-secondary">
                {t("whatIf.bench", "Bench")}
              </div>
              {bench.map((pick) => (
                <PlayerRow key={pick.player_id} pick={pick} isStarter={false} />
              ))}
            </div>
          )}
        </div>

        {/* Right Panel: Summary */}
        <div className="w-full lg:w-72 xl:w-80 p-4 theme-transition">
          <h4 className="text-sm font-bold text-theme-foreground uppercase tracking-wide mb-4 theme-transition">
            {t("whatIf.scenarioSummary", "Scenario Summary")}
          </h4>

          <div className="space-y-3">
            {/* Current Points */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-theme-card-secondary/40 theme-transition">
              <span className="text-sm text-theme-text-secondary theme-transition">
                {t("whatIf.currentPoints", "Current Points")}
              </span>
              <span className="text-lg font-bold text-theme-foreground theme-transition">
                {currentTotalPoints}
              </span>
            </div>

            {/* Scenario Points */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-theme-card-secondary/40 theme-transition">
              <span className="text-sm text-theme-text-secondary theme-transition">
                {t("whatIf.scenarioPoints", "Scenario Points")}
              </span>
              <span className="text-lg font-bold text-theme-foreground theme-transition">
                {scenarioTotalPoints}
              </span>
            </div>

            {/* Diff */}
            <div
              className={`flex items-center justify-between px-3 py-3 rounded-lg font-bold ${
                diff > 0
                  ? "bg-green-100 dark:bg-green-900/30"
                  : diff < 0
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-theme-card-secondary/40"
              } theme-transition`}
            >
              <span
                className={`text-sm ${
                  diff > 0
                    ? "text-green-700 dark:text-green-300"
                    : diff < 0
                    ? "text-red-700 dark:text-red-300"
                    : "text-theme-text-secondary"
                }`}
              >
                {t("whatIf.difference", "Difference")}
              </span>
              <span
                className={`text-xl ${
                  diff > 0
                    ? "text-green-600 dark:text-green-400"
                    : diff < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-theme-text-secondary"
                }`}
              >
                {diff > 0 ? "+" : ""}
                {diff}
              </span>
            </div>
          </div>

          {/* Events breakdown */}
          {events.length > 0 && (
            <div className="mt-5">
              <h5 className="text-xs font-bold text-theme-text-secondary uppercase tracking-wide mb-2 theme-transition">
                {t("whatIf.appliedEvents", "Applied Events")} ({events.length})
              </h5>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {events.map((event) => {
                  const config = EVENT_CONFIG[event.type];
                  const pick = teamPicks.find(
                    (p) => p.player_id === event.playerId
                  );
                  return (
                    <div
                      key={event.id}
                      className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md bg-theme-card-secondary/30 theme-transition"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotClass}`} />
                        <span className="text-theme-foreground truncate font-medium theme-transition">
                          {pick?.player.web_name}
                        </span>
                        <span className="text-theme-text-secondary shrink-0 theme-transition">
                          {t(config.labelKey, config.labelFallback)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`font-bold ${
                            event.points > 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {event.points > 0 ? "+" : ""}
                          {event.points}
                        </span>
                        <button
                          onClick={() => removeEvent(event.id)}
                          className="text-theme-text-secondary hover:text-red-500 transition-colors"
                        >
                          <MdClose size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {captainOverride !== null && (
            <div className="mt-4 px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 theme-transition">
              <div className="flex items-center gap-1.5 text-xs text-yellow-700 dark:text-yellow-300">
                <span className="font-medium">
                  {t("whatIf.captainChanged", "Captain changed to")}{" "}
                  <strong>
                    {
                      teamPicks.find(
                        (p) => p.player_id === captainOverride
                      )?.player.web_name
                    }
                  </strong>
                </span>
              </div>
            </div>
          )}

          {events.length === 0 && captainOverride === null && (
            <div className="mt-6 text-center text-xs text-theme-text-secondary theme-transition py-4">
              {t(
                "whatIf.hint",
                "Use the + buttons to add hypothetical events to players"
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default WhatIfSimulator;
