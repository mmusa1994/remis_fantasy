"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  AutoSubsPanel,
  OverviewHero,
  OverviewHeroSkeleton,
  OverviewKpis,
  TeamStatsPanel,
  deriveOverviewNumbers,
} from "@/components/fpl/ManagerSummary";
import {
  CaptaincyPanel,
  DifferentialsPanel,
  FieldComparisonPanel,
  GameweekStatusSkeleton,
  RankTrendPanel,
  TemplatePlayersPanel,
} from "@/components/fpl/GameweekStatus";
import type { FPLGameweekStatus } from "@/types/fpl";
import { Panel, cx } from "./ui";
import type {
  OverviewEntryHistory,
  OverviewGameweekStatus,
  OverviewManager,
  OverviewSquadPlayer,
  OverviewTeamTotals,
} from "./overview-types";

export interface LiveOverviewProps {
  manager?: OverviewManager | null;
  teamTotals?: OverviewTeamTotals | null;
  teamWithStats?: OverviewSquadPlayer[];
  entryHistory?: OverviewEntryHistory | null;
  activeChip?: string | null;
  bonusAdded: boolean;
  gameweek: number;
  managerId?: number;
  lastUpdated?: string;
  /** Team data (re)loading — previous numbers stay on screen, dimmed. */
  loading?: boolean;
  gameweekStatus?: OverviewGameweekStatus | FPLGameweekStatus | null;
  gameweekStatusLoading?: boolean;
}

interface Snapshot {
  managerId?: number;
  manager: OverviewManager;
  teamTotals: OverviewTeamTotals;
  teamWithStats?: OverviewSquadPlayer[];
  entryHistory?: OverviewEntryHistory | null;
}

/**
 * The whole Overview tab: headline numbers, how the gameweek went against the
 * field, captaincy, rank trend and the players that moved the rank.
 */
export default function LiveOverview({
  manager,
  teamTotals,
  teamWithStats,
  entryHistory,
  activeChip,
  bonusAdded,
  gameweek,
  managerId,
  loading = false,
  gameweekStatus,
  gameweekStatusLoading = false,
}: LiveOverviewProps) {
  const { t } = useTranslation("fpl");

  // A refresh briefly clears team data (skeleton response first). Keep the
  // last complete render for the same manager on screen, dimmed, instead of
  // flashing a skeleton — but only while a load is actually in flight.
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  if (
    manager &&
    teamTotals &&
    // Keyed on the state objects only — callers may pass fresh `?? []` arrays
    (snapshot?.manager !== manager ||
      snapshot.teamTotals !== teamTotals ||
      snapshot.managerId !== managerId)
  ) {
    // Derived-state update during render (React's "previous props" pattern)
    setSnapshot({ managerId, manager, teamTotals, teamWithStats, entryHistory });
  }
  const held =
    !(manager && teamTotals) && loading && snapshot?.managerId === managerId ? snapshot : null;

  const view = held ?? (manager && teamTotals ? { manager, teamTotals, teamWithStats, entryHistory } : null);
  const status = (gameweekStatus ?? null) as OverviewGameweekStatus | null;
  const refreshing = !!held || (loading && !!view);

  const numbers = view
    ? deriveOverviewNumbers({
        manager: view.manager,
        teamTotals: view.teamTotals,
        entryHistory: view.entryHistory,
        gameweekStatus: status,
        bonusAdded,
        activeChip,
      })
    : null;

  const squad = view?.teamWithStats ?? teamWithStats;

  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-4">
      {/* Left column: the headline */}
      <div className="space-y-3 sm:space-y-4">
        {view && numbers ? (
          <div
            className={cx("space-y-2 transition-opacity sm:space-y-3", refreshing && "opacity-60")}
            aria-busy={refreshing || undefined}
          >
            <OverviewHero
              manager={view.manager}
              numbers={numbers}
              gameweek={gameweek}
              bonusAdded={bonusAdded}
              gameweekStatus={status}
            />
            <OverviewKpis numbers={numbers} />
          </div>
        ) : loading ? (
          <OverviewHeroSkeleton />
        ) : (
          <Panel>
            <p className="py-6 text-center text-sm text-theme-text-muted">
              {t("fplLive.ui.overview.empty", "Load a team to see the overview")}
            </p>
          </Panel>
        )}

        {status ? (
          <div
            className={cx("space-y-3 transition-opacity sm:space-y-4", gameweekStatusLoading && "opacity-60")}
            aria-busy={gameweekStatusLoading || undefined}
          >
            <FieldComparisonPanel
              yourPoints={numbers?.heroPoints ?? status.gameweek_points}
              average={status.average_score || null}
              highest={status.highest_score || null}
              gameweek={gameweek}
            />
            <CaptaincyPanel
              analysis={status.captain_analysis}
              teamWithStats={squad}
              teamTotals={view?.teamTotals ?? teamTotals}
            />
          </div>
        ) : gameweekStatusLoading ? (
          <GameweekStatusSkeleton />
        ) : null}
      </div>

      {/* Right column: how the rank moved */}
      <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4 lg:mt-0">
        {status && (
          <div
            className={cx("space-y-3 transition-opacity sm:space-y-4", gameweekStatusLoading && "opacity-60")}
          >
            {status.rank_history && status.rank_history.length > 0 && (
              <RankTrendPanel history={status.rank_history} chipsPlayed={status.chips_played} />
            )}
            <DifferentialsPanel items={status.differentials} />
            <TemplatePlayersPanel items={status.threats} />
          </div>
        )}
        {view && (
          <div className={cx("space-y-3 transition-opacity sm:space-y-4", refreshing && "opacity-60")}>
            <AutoSubsPanel teamTotals={view.teamTotals} teamWithStats={squad} />
            <TeamStatsPanel teamTotals={view.teamTotals} />
          </div>
        )}
      </div>
    </div>
  );
}
