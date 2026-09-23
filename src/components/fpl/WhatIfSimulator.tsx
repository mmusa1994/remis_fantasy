"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Minus, Plus, RotateCcw, X, FlaskConical } from "lucide-react";

import {
  Delta,
  EmptyState,
  GhostButton,
  Panel,
  PlayerCell,
  RoleBadge,
  SectionLabel,
  Sheet,
  StatTile,
  cx,
  POSITION_SHORT,
} from "./live/ui";
import {
  CLEAN_SHEET_POINTS,
  GOAL_POINTS,
  concedesPoints,
  type LivePick,
} from "./live/playerPoints";
import { getPlayerTeamColors } from "@/lib/team-colors";

interface WhatIfSimulatorProps {
  managerId?: number;
  gameweek: number;
  managerData?: any;
}

type EventType =
  | "goal"
  | "assist"
  | "goal_conceded"
  | "saves"
  | "penalty_saved"
  | "penalty_missed"
  | "own_goal"
  | "defcon"
  | "yellow_card"
  | "red_card"
  | "bonus_1"
  | "bonus_2"
  | "bonus_3";

interface HypotheticalEvent {
  id: string;
  playerId: number;
  type: EventType;
}

const EVENT_LABEL: Record<EventType, { key: string; fallback: string }> = {
  goal: { key: "fplLive.ui.whatIf.event.goal", fallback: "Goal" },
  assist: { key: "fplLive.ui.whatIf.event.assist", fallback: "Assist" },
  goal_conceded: { key: "fplLive.ui.whatIf.event.goalConceded", fallback: "Goal conceded" },
  saves: { key: "fplLive.ui.whatIf.event.saves", fallback: "3 saves" },
  penalty_saved: { key: "fplLive.ui.whatIf.event.penaltySaved", fallback: "Penalty saved" },
  penalty_missed: { key: "fplLive.ui.whatIf.event.penaltyMissed", fallback: "Penalty missed" },
  own_goal: { key: "fplLive.ui.whatIf.event.ownGoal", fallback: "Own goal" },
  defcon: { key: "fplLive.ui.whatIf.event.defcon", fallback: "Defensive contribution" },
  yellow_card: { key: "fplLive.ui.whatIf.event.yellowCard", fallback: "Yellow card" },
  red_card: { key: "fplLive.ui.whatIf.event.redCard", fallback: "Red card" },
  bonus_1: { key: "fplLive.ui.whatIf.event.bonus1", fallback: "Bonus +1" },
  bonus_2: { key: "fplLive.ui.whatIf.event.bonus2", fallback: "Bonus +2" },
  bonus_3: { key: "fplLive.ui.whatIf.event.bonus3", fallback: "Bonus +3" },
};

const FIXED_POINTS: Partial<Record<EventType, number>> = {
  assist: 3,
  saves: 1,
  penalty_saved: 5,
  penalty_missed: -2,
  own_goal: -2,
  defcon: 2,
  yellow_card: -1,
  red_card: -3,
  bonus_1: 1,
  bonus_2: 2,
  bonus_3: 3,
};

/** Events that make sense for a position (no saves for strikers...). */
function availableEvents(pick: LivePick): EventType[] {
  const type = pick.player?.element_type ?? 3;
  const hasCleanSheet = (pick.live_stats?.clean_sheets ?? 0) > 0;
  const list: EventType[] = ["goal", "assist"];
  if (concedesPoints(type) || (type === 3 && hasCleanSheet)) list.push("goal_conceded");
  if (type === 1) list.push("saves", "penalty_saved");
  if (type !== 1) list.push("defcon", "penalty_missed");
  list.push("own_goal", "yellow_card", "red_card", "bonus_1", "bonus_2", "bonus_3");
  return list;
}

/**
 * Points each simulated "goal conceded" is worth, in order: the first one
 * costs the clean sheet, then GK/DEF lose a point for every second goal.
 */
function concededDeltas(pick: LivePick, count: number): number[] {
  const type = pick.player?.element_type ?? 3;
  const stats = pick.live_stats ?? {};
  const hasCleanSheet = (stats.clean_sheets ?? 0) > 0;
  const conceded = stats.goals_conceded ?? 0;
  const penalty = (goals: number) => (concedesPoints(type) ? -Math.floor(goals / 2) : 0);
  const total = (k: number) =>
    (hasCleanSheet && k === 0 ? CLEAN_SHEET_POINTS[type] ?? 0 : 0) + penalty(conceded + k);
  return Array.from({ length: count }, (_, i) => total(i + 1) - total(i));
}

const WhatIfSimulator = React.memo(function WhatIfSimulator({ managerData }: WhatIfSimulatorProps) {
  const { t } = useTranslation("fpl");
  const [events, setEvents] = React.useState<HypotheticalEvent[]>([]);
  const [captainOverride, setCaptainOverride] = React.useState<number | null>(null);
  const [pickerFor, setPickerFor] = React.useState<number | null>(null);

  const teamPicks: LivePick[] = React.useMemo(
    () => ((managerData?.team_with_stats as LivePick[]) || []).filter((p) => p.player),
    [managerData]
  );
  const byId = React.useMemo(() => new Map(teamPicks.map((p) => [p.player_id, p])), [teamPicks]);

  const starters = React.useMemo(
    () => teamPicks.filter((p) => p.position <= 11).sort((a, b) => a.position - b.position),
    [teamPicks]
  );
  const bench = React.useMemo(
    () => teamPicks.filter((p) => p.position > 11).sort((a, b) => a.position - b.position),
    [teamPicks]
  );

  const originalCaptain = React.useMemo(() => teamPicks.find((p) => p.is_captain) ?? null, [teamPicks]);
  const currentCaptainId = originalCaptain?.player_id ?? null;
  const captainMultiplier = originalCaptain && originalCaptain.multiplier >= 3 ? 3 : 2;
  const effectiveCaptainId = captainOverride ?? currentCaptainId;

  /** Multiplier after a captain swap: the new captain inherits C (or TC). */
  const multiplierOf = React.useCallback(
    (pick: LivePick) => {
      if (captainOverride !== null && currentCaptainId !== null) {
        if (pick.player_id === captainOverride) return captainMultiplier;
        if (pick.player_id === currentCaptainId) return 1;
      }
      return pick.multiplier;
    },
    [captainOverride, currentCaptainId, captainMultiplier]
  );

  /** Points of each simulated event for a player, in the order they were added. */
  const eventPoints = React.useCallback(
    (pick: LivePick, playerEvents: HypotheticalEvent[]) => {
      const conceded = concededDeltas(
        pick,
        playerEvents.filter((e) => e.type === "goal_conceded").length
      );
      let concededIndex = 0;
      return playerEvents.map((e) => {
        if (e.type === "goal") return GOAL_POINTS[pick.player?.element_type ?? 4] ?? 4;
        if (e.type === "goal_conceded") return conceded[concededIndex++] ?? 0;
        return FIXED_POINTS[e.type] ?? 0;
      });
    },
    []
  );

  const eventsOf = React.useCallback(
    (playerId: number) => events.filter((e) => e.playerId === playerId),
    [events]
  );

  const basePoints = (pick: LivePick) => pick.live_stats?.total_points ?? 0;
  const currentPoints = (pick: LivePick) => basePoints(pick) * (pick.multiplier > 0 ? pick.multiplier : 1);
  const scenarioPoints = (pick: LivePick) => {
    const extra = eventPoints(pick, eventsOf(pick.player_id)).reduce((s, p) => s + p, 0);
    const mult = multiplierOf(pick);
    return (basePoints(pick) + extra) * (mult > 0 ? mult : 1);
  };

  const currentTotal = teamPicks.reduce((s, p) => s + basePoints(p) * p.multiplier, 0);
  const scenarioTotal = teamPicks.reduce((s, p) => {
    const mult = multiplierOf(p);
    if (mult <= 0) return s;
    const extra = eventPoints(p, eventsOf(p.player_id)).reduce((a, b) => a + b, 0);
    return s + (basePoints(p) + extra) * mult;
  }, 0);
  const diff = scenarioTotal - currentTotal;
  const changed = events.length > 0 || captainOverride !== null;

  const addEvent = (playerId: number, type: EventType) => {
    setEvents((prev) => [...prev, { id: `${playerId}-${type}-${Date.now()}`, playerId, type }]);
    setPickerFor(null);
  };
  const removeEvent = (eventId: string) => setEvents((prev) => prev.filter((e) => e.id !== eventId));
  const removeLast = (playerId: number) =>
    setEvents((prev) => {
      const index = prev.map((e) => e.playerId).lastIndexOf(playerId);
      return index === -1 ? prev : prev.filter((_, i) => i !== index);
    });
  const resetAll = () => {
    setEvents([]);
    setCaptainOverride(null);
  };

  if (!teamPicks.length) {
    return (
      <Panel>
        <EmptyState
          icon={<FlaskConical />}
          title={t("whatIf.title", "What-If Simulator")}
          text={t("whatIf.loadTeamToSimulate", "Load your team to use the simulator")}
        />
      </Panel>
    );
  }

  const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");
  const pts = t("fplLive.ui.squad.ptsShort", "pts");

  const renderRow = (pick: LivePick) => {
    const player = pick.player!;
    const counts = multiplierOf(pick) > 0;
    const playerEvents = eventsOf(pick.player_id);
    const points = eventPoints(pick, playerEvents);
    const now = currentPoints(pick);
    const next = scenarioPoints(pick);
    const isCaptain = pick.player_id === effectiveCaptainId;
    const role = isCaptain
      ? captainMultiplier === 3
        ? "TC"
        : "C"
      : pick.is_vice_captain
      ? "V"
      : null;

    return (
      <div key={pick.player_id} className="px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-3">
          <PlayerCell
            player={player}
            name={player.web_name}
            size="sm"
            badges={role && <RoleBadge role={role} />}
            meta={
              <>
                <span>{getPlayerTeamColors(player).shortName}</span>
                <span aria-hidden>·</span>
                <span>{POSITION_SHORT[player.element_type]}</span>
              </>
            }
          />
          <div className="w-11 shrink-0 text-right">
            <div
              className={cx(
                "text-base font-semibold leading-none tabular-nums",
                counts ? "text-theme-heading-primary" : "text-theme-text-muted"
              )}
            >
              {next}
            </div>
            {next !== now && <Delta value={next - now} className="mt-1 text-[10px] leading-none" />}
          </div>
          {counts ? (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => removeLast(pick.player_id)}
                disabled={playerEvents.length === 0}
                aria-label={t("fplLive.ui.whatIf.undo", "Remove last event")}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-theme-border text-theme-text-secondary transition-colors hover:bg-theme-card-secondary disabled:opacity-30"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPickerFor(pick.player_id)}
                aria-label={t("whatIf.addEvent", "Add Event")}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 transition-colors hover:bg-violet-500/20 dark:text-violet-300"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="w-[76px] shrink-0" aria-hidden />
          )}
        </div>

        {playerEvents.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1 pl-[38px]">
            {playerEvents.map((event, i) => (
              <span
                key={event.id}
                className="inline-flex items-center gap-1 rounded-md bg-theme-card-secondary py-0.5 pl-2 pr-1 text-[11px] font-medium text-theme-text-secondary"
              >
                {t(EVENT_LABEL[event.type].key, EVENT_LABEL[event.type].fallback)}
                <span
                  className={cx(
                    "font-semibold tabular-nums",
                    points[i] > 0 ? "text-emerald-500" : points[i] < 0 ? "text-rose-500" : ""
                  )}
                >
                  {signed(points[i])}
                </span>
                <button
                  type="button"
                  onClick={() => removeEvent(event.id)}
                  aria-label={t("fplLive.ui.whatIf.remove", "Remove")}
                  className="flex h-5 w-5 items-center justify-center rounded text-theme-text-muted hover:text-theme-heading-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const pickerPick = pickerFor !== null ? byId.get(pickerFor) ?? null : null;
  const pickerPoints = (type: EventType) => {
    if (!pickerPick) return 0;
    const withNew = eventPoints(pickerPick, [
      ...eventsOf(pickerPick.player_id),
      { id: "preview", playerId: pickerPick.player_id, type },
    ]);
    return withNew[withNew.length - 1] ?? 0;
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <Panel
        title={t("whatIf.title", "What-If Simulator")}
        subtitle={t("fplLive.ui.whatIf.subtitle", "Add goals, cards or bonus and swap the captain to see the effect")}
        action={
          changed ? (
            <GhostButton onClick={resetAll}>
              <RotateCcw />
              {t("whatIf.reset", "Reset")}
            </GhostButton>
          ) : undefined
        }
      >
        <div className="grid grid-cols-3 gap-2">
          <StatTile label={t("fplLive.ui.whatIf.now", "Now")} value={currentTotal} hint={pts} />
          <StatTile label={t("fplLive.ui.whatIf.scenario", "Scenario")} value={scenarioTotal} hint={pts} />
          <StatTile
            label={t("whatIf.difference", "Difference")}
            value={
              diff === 0 ? (
                <span className="text-theme-text-muted">0</span>
              ) : (
                <Delta value={diff} className="text-lg" />
              )
            }
            hint={
              events.length > 0
                ? t("fplLive.ui.whatIf.eventsCount", "Events: {{n}}", { n: events.length })
                : undefined
            }
          />
        </div>

        <label className="mt-3 block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-text-muted">
            {t("fplLive.ui.whatIf.captain", "Captain")}
          </span>
          <select
            value={effectiveCaptainId ?? ""}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCaptainOverride(val === currentCaptainId ? null : val);
            }}
            className="mt-1.5 w-full rounded-xl border border-theme-border bg-theme-card-secondary px-3 py-2.5 text-sm font-medium text-theme-heading-primary focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          >
            {starters.map((pick) => (
              <option key={pick.player_id} value={pick.player_id}>
                {pick.player!.web_name} ({POSITION_SHORT[pick.player!.element_type]})
                {pick.player_id === currentCaptainId ? ` · ${t("whatIf.current", "Current")}` : ""}
              </option>
            ))}
          </select>
        </label>
      </Panel>

      <Panel flush>
        <SectionLabel>{t("fplLive.startingXI", "Starting XI")}</SectionLabel>
        <div className="divide-y divide-theme-border">{starters.map(renderRow)}</div>
        {bench.length > 0 && (
          <>
            <SectionLabel className="border-t border-theme-border">{t("fplLive.bench", "Bench")}</SectionLabel>
            <div className="divide-y divide-theme-border">{bench.map(renderRow)}</div>
          </>
        )}
        <p className="border-t border-theme-border px-4 py-2.5 text-[11px] text-theme-text-muted sm:px-5">
          {t("fplLive.ui.whatIf.hint", "Tap + next to a player to add an event")}
        </p>
      </Panel>

      <Sheet
        open={!!pickerPick}
        onClose={() => setPickerFor(null)}
        title={t("whatIf.addEvent", "Add Event")}
        subtitle={pickerPick?.player?.web_name}
      >
        {pickerPick && (
          <div className="grid grid-cols-2 gap-2">
            {availableEvents(pickerPick).map((type) => {
              const value = pickerPoints(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => addEvent(pickerPick.player_id, type)}
                  className="flex min-h-[48px] items-center justify-between gap-2 rounded-xl border border-theme-border bg-theme-card px-3 py-2.5 text-left text-sm font-medium text-theme-heading-primary transition-colors hover:bg-theme-card-secondary active:bg-theme-card-secondary"
                >
                  <span className="min-w-0 leading-tight">
                    {t(EVENT_LABEL[type].key, EVENT_LABEL[type].fallback)}
                  </span>
                  <span
                    className={cx(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      value > 0 ? "text-emerald-500" : value < 0 ? "text-rose-500" : "text-theme-text-muted"
                    )}
                  >
                    {signed(value)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Sheet>
    </div>
  );
});

export default WhatIfSimulator;
