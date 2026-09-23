"use client";

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3 } from "lucide-react";

import { getPlayerTeamColors } from "@/lib/team-colors";
import {
  Bar,
  Chip,
  EmptyState,
  ListRow,
  Panel,
  PlayerCell,
  PlayerJersey,
  RoleBadge,
  SectionLabel,
  StatTile,
  POSITION_SHORT,
  cx,
} from "./live/ui";

interface RankGainsProps {
  managerId?: number;
  gameweek: number;
  managerData?: any;
}

interface PlayerPick {
  player_id: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  player: {
    id: number;
    web_name: string;
    first_name: string;
    second_name: string;
    team: number;
    team_code?: number;
    element_type: number;
  } | null;
  live_stats: {
    player_id: number;
    minutes: number;
    total_points: number;
  } | null;
}

interface GwFixture {
  team_h: number;
  team_a: number;
  started?: boolean | null;
  finished?: boolean;
  finished_provisional?: boolean;
}

type PlayerStatus = "played" | "playing" | "to_play" | "didnt_play" | "no_fixture";

interface Contribution {
  pick: PlayerPick;
  points: number;
  status: PlayerStatus;
}

/**
 * Status from the gameweek's fixtures, not from minutes alone: a player
 * subbed off after 80' has finished, a DGW player with one game left has not.
 */
const getPlayerStatus = (pick: PlayerPick, fixtures: GwFixture[]): PlayerStatus => {
  const minutes = pick.live_stats?.minutes ?? 0;
  const team = pick.player?.team;

  if (!fixtures.length || !team) {
    return minutes > 0 ? "played" : "to_play";
  }

  const teamFixtures = fixtures.filter((f) => f.team_h === team || f.team_a === team);
  if (!teamFixtures.length) return "no_fixture";

  const isDone = (f: GwFixture) => Boolean(f.finished || f.finished_provisional);
  if (teamFixtures.some((f) => f.started && !isDone(f))) return "playing";
  if (teamFixtures.some((f) => !f.started && !isDone(f))) return "to_play";
  return minutes > 0 ? "played" : "didnt_play";
};

function StatusChip({ status }: { status: PlayerStatus }) {
  const { t } = useTranslation("fpl");
  const config: Record<PlayerStatus, { label: string; dot: string }> = {
    played: {
      label: t("fplLive.ui.gains.status.played", "Played"),
      dot: "bg-emerald-500",
    },
    playing: {
      label: t("fplLive.ui.gains.status.playing", "Playing"),
      dot: "bg-emerald-500 animate-pulse",
    },
    to_play: {
      label: t("fplLive.ui.gains.status.toPlay", "To play"),
      dot: "bg-theme-text-muted",
    },
    didnt_play: {
      label: t("fplLive.ui.gains.status.didntPlay", "Didn't play"),
      dot: "bg-rose-500",
    },
    no_fixture: {
      label: t("fplLive.ui.gains.status.noFixture", "No fixture"),
      dot: "bg-theme-text-muted",
    },
  };
  const { label, dot } = config[status];
  return (
    <Chip tone={status === "playing" ? "positive" : "neutral"}>
      <span className={cx("h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </Chip>
  );
}

/** StatTile look-alike that leads with the player's shirt. */
function PlayerTile({
  label,
  contribution,
  emptyLabel,
}: {
  label: string;
  contribution: Contribution | null;
  emptyLabel: string;
}) {
  const { t } = useTranslation("fpl");
  return (
    <div className="min-w-0 rounded-xl border border-theme-border bg-theme-card-secondary px-3 py-2.5">
      <div className="truncate text-[10px] font-medium uppercase tracking-wider text-theme-text-muted">
        {label}
      </div>
      {contribution?.pick.player ? (
        <>
          <div className="mt-1 flex min-w-0 items-center gap-1.5">
            <PlayerJersey player={contribution.pick.player} size="xs" />
            <span className="truncate text-sm font-semibold leading-tight text-theme-heading-primary">
              {contribution.pick.player.web_name}
            </span>
          </div>
          <div className="mt-1 truncate text-[11px] tabular-nums text-theme-text-muted">
            {t("fplLive.ui.gains.pointsShort", "{{pts}} pts", {
              pts: contribution.points,
            })}
          </div>
        </>
      ) : (
        <div className="mt-1 text-sm text-theme-text-muted">{emptyLabel}</div>
      )}
    </div>
  );
}

const RankGains = React.memo(function RankGains({ gameweek, managerData }: RankGainsProps) {
  const { t } = useTranslation("fpl");

  const teamData: PlayerPick[] = useMemo(
    () => (managerData?.team_with_stats ?? []).filter((p: PlayerPick) => p.player),
    [managerData?.team_with_stats]
  );
  const fixtures: GwFixture[] = useMemo(
    () => managerData?.fixtures ?? [],
    [managerData?.fixtures]
  );

  const summary = useMemo(() => {
    const starters: Contribution[] = teamData
      .filter((p) => p.position <= 11)
      .map((pick) => ({
        pick,
        points: (pick.live_stats?.total_points ?? 0) * (pick.multiplier || 1),
        status: getPlayerStatus(pick, fixtures),
      }))
      .sort((a, b) => b.points - a.points || a.pick.position - b.pick.position);

    const bench: Contribution[] = teamData
      .filter((p) => p.position > 11)
      .sort((a, b) => a.position - b.position)
      .map((pick) => ({
        pick,
        points: pick.live_stats?.total_points ?? 0,
        status: getPlayerStatus(pick, fixtures),
      }));

    const total = starters.reduce((sum, c) => sum + c.points, 0);
    const benchTotal = bench.reduce((sum, c) => sum + c.points, 0);
    const appeared = starters.filter((c) => (c.pick.live_stats?.minutes ?? 0) > 0);
    const best = appeared.length ? appeared[0] : null;
    const worst = appeared.length > 1 ? appeared[appeared.length - 1] : null;
    const captain = starters.find((c) => c.pick.is_captain) ?? null;
    const done = starters.filter(
      (c) => c.status === "played" || c.status === "didnt_play" || c.status === "no_fixture"
    ).length;
    const live = starters.filter((c) => c.status === "playing").length;
    const maxPoints = Math.max(
      1,
      ...starters.map((c) => Math.abs(c.points)),
      ...bench.map((c) => Math.abs(c.points))
    );

    return { starters, bench, total, benchTotal, best, worst, captain, done, live, maxPoints };
  }, [teamData, fixtures]);

  const title = t("fplLive.ui.gains.title", "Player contributions");

  if (!teamData.length) {
    return (
      <Panel title={title}>
        <EmptyState
          icon={<BarChart3 />}
          title={t("gains.loadTeamToSeeSquad", "Load your team to see player contributions")}
        />
      </Panel>
    );
  }

  const { starters, bench, total, benchTotal, best, worst, captain, done, live, maxPoints } =
    summary;

  const renderRow = (contribution: Contribution, isBench: boolean) => {
    const { pick, points, status } = contribution;
    const player = pick.player!;
    const club = getPlayerTeamColors(player).shortName;
    const raw = pick.live_stats?.total_points ?? 0;
    const multiplied = !isBench && pick.multiplier > 1;

    return (
      <ListRow key={pick.player_id} className={cx(isBench && "opacity-70")}>
        <PlayerCell
          player={player}
          name={player.web_name}
          badges={
            <>
              {pick.is_captain && <RoleBadge role={pick.multiplier === 3 ? "TC" : "C"} />}
              {pick.is_vice_captain && <RoleBadge role="V" />}
            </>
          }
          meta={
            <>
              <span className="shrink-0">{club}</span>
              <span className="shrink-0 text-theme-border-strong">·</span>
              <span className="shrink-0">{POSITION_SHORT[player.element_type]}</span>
              <StatusChip status={status} />
            </>
          }
        />
        <div className="flex w-[4.5rem] shrink-0 flex-col items-end gap-1.5 sm:w-32">
          <div className="flex items-baseline gap-1">
            {multiplied && (
              <span className="text-[10px] tabular-nums text-theme-text-muted">
                {raw}×{pick.multiplier}
              </span>
            )}
            <span
              className={cx(
                "text-base font-semibold leading-none tabular-nums",
                points < 0 ? "text-rose-500" : "text-theme-heading-primary"
              )}
            >
              {points}
            </span>
          </div>
          <Bar
            value={(Math.abs(points) / maxPoints) * 100}
            tone={points < 0 ? "negative" : isBench ? "neutral" : "accent"}
          />
        </div>
      </ListRow>
    );
  };

  const captainShare = captain && total > 0 ? Math.round((captain.points / total) * 100) : 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      <Panel
        title={title}
        subtitle={t(
          "fplLive.ui.gains.subtitle",
          "How much each player added to your GW{{gw}} score",
          { gw: gameweek }
        )}
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <StatTile
            label={t("fplLive.ui.gains.total", "XI points")}
            value={total}
            hint={
              live > 0
                ? t("fplLive.ui.gains.progressLive", "{{done}}/11 done · {{live}} playing", {
                    done,
                    live,
                  })
                : t("fplLive.ui.gains.progress", "{{done}}/11 done", { done })
            }
          />
          <StatTile
            label={t("fplLive.ui.gains.captain", "Captain")}
            value={captain ? captain.points : "—"}
            hint={
              captain?.pick.player
                ? t("fplLive.ui.gains.captainShare", "{{name}} · {{share}}% of total", {
                    name: captain.pick.player.web_name,
                    share: captainShare,
                  })
                : undefined
            }
          />
          <PlayerTile
            label={t("fplLive.ui.gains.best", "Best")}
            contribution={best}
            emptyLabel="—"
          />
          <PlayerTile
            label={t("fplLive.ui.gains.worst", "Weakest")}
            contribution={worst}
            emptyLabel="—"
          />
        </div>
      </Panel>

      <Panel flush>
        <SectionLabel
          className="pt-4"
          action={
            <span className="text-[11px] tabular-nums text-theme-text-muted">
              {t("fplLive.ui.gains.pointsShort", "{{pts}} pts", { pts: total })}
            </span>
          }
        >
          {t("fplLive.ui.gains.startingXI", "Starting XI")}
        </SectionLabel>
        <div className="divide-y divide-theme-border">
          {starters.map((c) => renderRow(c, false))}
        </div>

        {bench.length > 0 && (
          <>
            <SectionLabel
              className="border-t border-theme-border pt-3"
              action={
                <span className="text-[11px] tabular-nums text-theme-text-muted">
                  {t("fplLive.ui.gains.pointsShort", "{{pts}} pts", { pts: benchTotal })}
                </span>
              }
            >
              {t("fplLive.ui.gains.bench", "Bench")}
            </SectionLabel>
            <div className="divide-y divide-theme-border pb-1">
              {bench.map((c) => renderRow(c, true))}
            </div>
          </>
        )}
      </Panel>
    </div>
  );
});

export default RankGains;
