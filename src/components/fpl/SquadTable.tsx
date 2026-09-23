"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoFootball } from "react-icons/io5";
import { Users } from "lucide-react";

import EnhancedPitchView from "./EnhancedPitchView";
import PlayerPointsSheet from "./live/PlayerPointsSheet";
import {
  Chip,
  EmptyState,
  ListRow,
  LiveDot,
  Panel,
  PlayerCell,
  RoleBadge,
  SectionLabel,
  StatTile,
  cx,
  POSITION_SHORT,
} from "./live/ui";
import {
  fixtureState,
  teamFixtures,
  type LiveFixture,
  type LivePick,
} from "./live/playerPoints";
import { getPlayerTeamColors } from "@/lib/team-colors";

interface PredictedBonus {
  player_id: number;
  /** Shape returned by /api/fpl/load-team. */
  bonus?: number;
  /** Legacy shape. */
  predicted_bonus?: number;
}

interface AutoSub {
  outId: number;
  inId: number;
}

interface SquadTableProps {
  teamData: LivePick[];
  predictedBonuses: PredictedBonus[];
  bonusAdded: boolean;
  /** `data.fixtures` — this GW's fixtures, for opponent / live / DNP status. */
  fixtures?: LiveFixture[];
  /** `data.team_totals` — used for live auto-subs and captain promotion. */
  teamTotals?: {
    with_autosubs?: {
      live_points_gross?: number;
      auto_subs_applied?: AutoSub[];
      captain_promoted?: { fromId: number; toId: number } | null;
    };
  } | null;
  /** `data.active_chip` */
  activeChip?: string | null;
  /** `data.entry_history` — for the transfer hit. */
  entryHistory?: { event_transfers_cost?: number } | null;
  gameweek?: number;
}

const CHIP_LABEL: Record<string, string> = {
  "3xc": "Triple Captain",
  bboost: "Bench Boost",
  freehit: "Free Hit",
  wildcard: "Wildcard",
};

const SquadTable = React.memo(function SquadTable({
  teamData,
  predictedBonuses,
  bonusAdded,
  fixtures,
  teamTotals,
  activeChip,
  entryHistory,
  gameweek,
}: SquadTableProps) {
  const { t } = useTranslation("fpl");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const picks = useMemo(
    () =>
      (teamData || [])
        .filter((pick) => pick.player)
        .sort((a, b) => a.position - b.position),
    [teamData]
  );
  const byId = useMemo(() => new Map(picks.map((p) => [p.player_id, p])), [picks]);
  const allPlayers = useMemo(() => picks.map((p) => p.player!), [picks]);

  const predictedMap = useMemo(
    () =>
      new Map(
        (predictedBonuses || []).map((b) => [b.player_id, b.bonus ?? b.predicted_bonus ?? 0])
      ),
    [predictedBonuses]
  );

  /** Provisional bonus still to come — none once FPL has handed bonus out. */
  const pendingBonus = useCallback(
    (pick: LivePick) =>
      bonusAdded || (pick.live_stats?.bonus ?? 0) > 0 ? 0 : predictedMap.get(pick.player_id) ?? 0,
    [bonusAdded, predictedMap]
  );
  const rawPoints = useCallback(
    (pick: LivePick) => (pick.live_stats?.total_points ?? 0) + pendingBonus(pick),
    [pendingBonus]
  );
  /** Points as FPL counts them: × multiplier for playing picks, raw on the bench. */
  const shownPoints = useCallback(
    (pick: LivePick) => (pick.multiplier > 0 ? rawPoints(pick) * pick.multiplier : rawPoints(pick)),
    [rawPoints]
  );

  const hasFixtureData = Array.isArray(fixtures);
  const statusOf = useCallback(
    (pick: LivePick) => {
      const infos = teamFixtures(fixtures, pick.player?.team);
      return { infos, state: fixtureState(infos, hasFixtureData) };
    },
    [fixtures, hasFixtureData]
  );

  const starters = picks.filter((p) => p.position <= 11);
  const bench = picks.filter((p) => p.position > 11);

  const xiTotal = picks.reduce((sum, p) => sum + rawPoints(p) * p.multiplier, 0);
  const benchTotal = bench.reduce((sum, p) => sum + rawPoints(p), 0);
  const bonusTotal = picks
    .filter((p) => p.multiplier > 0)
    .reduce((sum, p) => sum + ((p.live_stats?.bonus ?? 0) + pendingBonus(p)) * p.multiplier, 0);
  const hasPendingBonus = picks.some((p) => p.multiplier > 0 && pendingBonus(p) > 0);

  const subs = teamTotals?.with_autosubs?.auto_subs_applied ?? [];
  const promoted = teamTotals?.with_autosubs?.captain_promoted ?? null;
  const serviceTotal = teamTotals?.with_autosubs?.live_points_gross;
  const headline =
    (subs.length > 0 || promoted) && typeof serviceTotal === "number" ? serviceTotal : xiTotal;
  const hit = entryHistory?.event_transfers_cost ?? 0;
  const chipKey = activeChip ? activeChip.toLowerCase() : null;
  const chipLabel = chipKey ? CHIP_LABEL[chipKey] ?? activeChip : null;
  const gw = gameweek ?? picks[0]?.gw;

  const subbedIn = new Set(subs.map((s) => s.inId));
  const subbedOut = new Set(subs.map((s) => s.outId));

  if (picks.length === 0) {
    return (
      <Panel>
        <EmptyState
          icon={<Users />}
          title={t("fplLive.squad", "Squad")}
          text={t("fplLive.loadTeamToSeeSquad", "Load your team to see squad details")}
        />
      </Panel>
    );
  }

  const roleOf = (pick: LivePick) =>
    pick.is_captain ? (pick.multiplier === 3 ? "TC" : "C") : pick.is_vice_captain ? "V" : null;

  /** Plate under each shirt on the pitch: points, or the opponent before kick-off. */
  const pointsLabel = (playerId: number): React.ReactNode => {
    const pick = byId.get(playerId);
    if (!pick) return null;
    const { infos, state } = statusOf(pick);
    const minutes = pick.live_stats?.minutes ?? 0;
    if (state === "none") return <span className="text-slate-400">–</span>;
    if (state === "upcoming" && minutes === 0 && infos[0]) {
      return (
        <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500">
          {infos[0].opponentShort} (
          {infos[0].isHome
            ? t("fplLive.ui.squad.homeShort", "H")
            : t("fplLive.ui.squad.awayShort", "A")}
          )
        </span>
      );
    }
    return shownPoints(pick);
  };

  const cornerBadge = (playerId: number): React.ReactNode => {
    if (subbedIn.has(playerId)) {
      return (
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white shadow">
          ↑
        </span>
      );
    }
    if (subbedOut.has(playerId)) {
      return (
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white shadow">
          ↓
        </span>
      );
    }
    return null;
  };

  const statusNode = (pick: LivePick) => {
    const { infos, state } = statusOf(pick);
    const minutes = pick.live_stats?.minutes ?? 0;
    if (state === "none") return <span>{t("fplLive.ui.squad.noFixtureShort", "No game")}</span>;
    if (state === "upcoming" && minutes === 0 && infos[0]) {
      return (
        <span>
          {infos[0].opponentShort} (
          {infos[0].isHome
            ? t("fplLive.ui.squad.homeShort", "H")
            : t("fplLive.ui.squad.awayShort", "A")}
          )
        </span>
      );
    }
    if (state === "finished" && minutes === 0) {
      return <span>{t("fplLive.ui.squad.dnp", "Did not play")}</span>;
    }
    if (state === "live") {
      return (
        <span className="inline-flex items-center gap-1">
          <LiveDot className="scale-75" />
          {minutes}′
        </span>
      );
    }
    return <span className="tabular-nums">{minutes}′</span>;
  };

  const eventChips = (pick: LivePick) => {
    const s = pick.live_stats ?? {};
    const type = pick.player?.element_type ?? 3;
    const goals = s.goals_scored ?? 0;
    const assists = s.assists ?? 0;
    const confirmedBonus = s.bonus ?? 0;
    const pending = pendingBonus(pick);
    const chips: React.ReactNode[] = [];
    if (goals > 0) {
      chips.push(
        <Chip key="g" className="gap-0.5">
          <IoFootball className="h-2.5 w-2.5" />
          {goals > 1 ? `×${goals}` : null}
        </Chip>
      );
    }
    if (assists > 0) chips.push(<Chip key="a">A{assists > 1 ? `×${assists}` : ""}</Chip>);
    if ((s.clean_sheets ?? 0) > 0 && type !== 4) chips.push(<Chip key="cs">CS</Chip>);
    if ((s.own_goals ?? 0) > 0) chips.push(<Chip key="og" tone="negative">OG</Chip>);
    if ((s.yellow_cards ?? 0) > 0) {
      chips.push(<span key="yc" aria-label={t("fplLive.ui.squad.stat.yellow_cards", "Yellow card")} className="inline-block h-3 w-2 shrink-0 rounded-[2px] bg-amber-400" />);
    }
    if ((s.red_cards ?? 0) > 0) {
      chips.push(<span key="rc" aria-label={t("fplLive.ui.squad.stat.red_cards", "Red card")} className="inline-block h-3 w-2 shrink-0 rounded-[2px] bg-rose-600" />);
    }
    if (confirmedBonus > 0) {
      chips.push(<Chip key="b" tone="accent">B{confirmedBonus}</Chip>);
    } else if (pending > 0) {
      chips.push(
        <Chip key="b" className="border border-dashed border-theme-border-strong">
          B+{pending}
        </Chip>
      );
    }
    return chips;
  };

  const renderRow = (pick: LivePick) => {
    const player = pick.player!;
    const role = roleOf(pick);
    const counts = pick.multiplier > 0;
    const { state } = statusOf(pick);
    const minutes = pick.live_stats?.minutes ?? 0;
    const notStarted = state === "upcoming" && minutes === 0;
    return (
      <ListRow key={pick.player_id} onClick={() => setSelectedId(pick.player_id)}>
        <PlayerCell
          player={player}
          name={player.web_name}
          size="sm"
          badges={
            <>
              {role && <RoleBadge role={role} />}
              {subbedIn.has(pick.player_id) && <span className="text-[10px] font-bold text-emerald-500">↑</span>}
              {subbedOut.has(pick.player_id) && <span className="text-[10px] font-bold text-rose-500">↓</span>}
            </>
          }
          meta={
            <>
              <span>{getPlayerTeamColors(player).shortName}</span>
              <span aria-hidden>·</span>
              <span>{POSITION_SHORT[player.element_type]}</span>
              <span aria-hidden>·</span>
              {statusNode(pick)}
              {eventChips(pick)}
            </>
          }
        />
        <div className="w-10 shrink-0 text-right">
          <div
            className={cx(
              "text-base font-semibold leading-none tabular-nums",
              counts ? "text-theme-heading-primary" : "text-theme-text-muted"
            )}
          >
            {notStarted ? "–" : shownPoints(pick)}
          </div>
          {pick.multiplier > 1 && (
            <div className="mt-1 text-[10px] leading-none tabular-nums text-theme-text-muted">
              ×{pick.multiplier}
            </div>
          )}
        </div>
      </ListRow>
    );
  };

  const nameOf = (id: number) => byId.get(id)?.player?.web_name ?? "—";
  const selected = selectedId !== null ? byId.get(selectedId) ?? null : null;
  const pts = t("fplLive.ui.squad.ptsShort", "pts");

  return (
    <div className="space-y-3 sm:space-y-4">
      <Panel
        title={t("fplLive.ui.squad.title", "Live squad")}
        subtitle={[
          gw ? `GW${gw}` : null,
          bonusAdded
            ? t("fplLive.ui.squad.subtitleConfirmed", "Bonus points confirmed")
            : hasPendingBonus
            ? t("fplLive.ui.squad.subtitlePredicted", "Includes predicted bonus")
            : t("fplLive.ui.squad.subtitleLive", "Live points"),
        ]
          .filter(Boolean)
          .join(" · ")}
        action={chipLabel ? <Chip tone="accent">{chipLabel}</Chip> : undefined}
      >
        <div className="grid grid-cols-3 gap-2">
          <StatTile
            label={t("fplLive.ui.squad.points", "Points")}
            value={headline}
            hint={
              hit > 0
                ? t("fplLive.ui.squad.net", "net {{net}}", { net: headline - hit })
                : subs.length > 0 || promoted
                ? t("fplLive.ui.squad.withAutoSubs", "with auto-subs")
                : undefined
            }
          />
          <StatTile
            label={t("fplLive.bench", "Bench")}
            value={benchTotal}
            hint={chipKey === "bboost" ? t("fplLive.ui.squad.benchCounts", "counts (BB)") : undefined}
          />
          <StatTile
            label={t("fplLive.ui.squad.bonus", "Bonus")}
            value={`+${bonusTotal}`}
            hint={
              bonusTotal > 0
                ? bonusAdded
                  ? t("fplLive.ui.squad.bonusConfirmedShort", "confirmed")
                  : t("fplLive.ui.squad.bonusPredictedShort", "predicted")
                : undefined
            }
          />
        </div>

        {(subs.length > 0 || promoted || hit > 0) && (
          <ul className="mt-3 space-y-1 text-xs text-theme-text-muted">
            {subs.map((s) => (
              <li key={`${s.outId}-${s.inId}`}>
                {t("fplLive.ui.squad.autoSub", "Auto-sub: {{out}} → {{in}}", {
                  out: nameOf(s.outId),
                  in: nameOf(s.inId),
                })}
              </li>
            ))}
            {promoted && (
              <li>
                {t("fplLive.ui.squad.captainPromoted", "Armband moved to {{name}} — captain didn't play", {
                  name: nameOf(promoted.toId),
                })}
              </li>
            )}
            {hit > 0 && (
              <li>{t("fplLive.ui.squad.hit", "Transfer hit: −{{cost}}", { cost: hit })}</li>
            )}
          </ul>
        )}

        <div className="-mx-2 mt-3 sm:mx-0">
          <EnhancedPitchView
            teamPlayers={picks}
            allPlayers={allPlayers as any}
            onPlayerClick={(player) => setSelectedId(player.id)}
            getPointsLabel={(player) => pointsLabel(player.id)}
            getCornerBadge={(player) => cornerBadge(player.id)}
            showPriceChange={false}
            benchExtra={
              <span className="normal-case tracking-normal tabular-nums">
                {benchTotal} {pts}
              </span>
            }
          />
        </div>
      </Panel>

      <Panel flush>
        <SectionLabel
          action={
            <span className="text-[11px] tabular-nums text-theme-text-muted">
              {xiTotal} {pts}
            </span>
          }
        >
          {t("fplLive.startingXI", "Starting XI")}
        </SectionLabel>
        <div className="divide-y divide-theme-border">{starters.map(renderRow)}</div>

        {bench.length > 0 && (
          <>
            <SectionLabel
              className="border-t border-theme-border"
              action={
                <span className="text-[11px] tabular-nums text-theme-text-muted">
                  {benchTotal} {pts}
                </span>
              }
            >
              {t("fplLive.bench", "Bench")}
            </SectionLabel>
            <div className="divide-y divide-theme-border">{bench.map(renderRow)}</div>
          </>
        )}

        <p className="border-t border-theme-border px-4 py-2.5 text-[11px] text-theme-text-muted sm:px-5">
          {t("fplLive.ui.squad.tapHint", "Tap a player for the points breakdown")}
        </p>
      </Panel>

      <PlayerPointsSheet
        pick={selected}
        onClose={() => setSelectedId(null)}
        predictedBonus={selected ? pendingBonus(selected) : 0}
        fixtures={fixtures}
        gameweek={gw}
      />
    </div>
  );
});

export default SquadTable;
