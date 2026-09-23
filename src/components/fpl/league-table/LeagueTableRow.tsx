"use client";

import { useTranslation } from "react-i18next";
import { Chip, cx, formatNumber, formatPrice, PlayerJersey } from "@/components/fpl/live/ui";
import LeagueChipPill from "./LeagueChipPill";
import { LEAGUE_ROW_GRID } from "./LeagueTableHeader";
import Movement from "./Movement";
import type { LeagueElementSummary, ProcessedTeam } from "./types";

interface LeagueTableRowProps {
  team: ProcessedTeam;
  elementMap: Map<number, LeagueElementSummary>;
  isCurrentUser: boolean;
  /** A player filter is active and this team does not match it. */
  isDimmed: boolean;
  showGwNet: boolean;
  onOpen: () => void;
}

/**
 * One manager in the live standings. Two lines on phones (team + manager /
 * captain), extra columns from `lg`. Tapping opens the squad sheet.
 */
export default function LeagueTableRow({
  team,
  elementMap,
  isCurrentUser,
  isDimmed,
  showGwNet,
  onOpen,
}: LeagueTableRowProps) {
  const { t } = useTranslation("fpl");
  const gwPoints = showGwNet ? team.live_points_net : team.live_points_gross;
  // `rank` is the live position (API re-sorts by live total); `last_rank` is
  // where the manager finished last gameweek.
  const movement = team.last_rank > 0 ? team.last_rank - team.rank : 0;
  const hit = team.event_transfers_cost;

  const captainId =
    team.captain_promoted?.toId ?? team.picks.find((p) => p.is_captain)?.element;
  const captain = captainId ? elementMap.get(captainId) : undefined;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cx(
        LEAGUE_ROW_GRID,
        "w-full px-4 py-2.5 text-left transition-[background-color,opacity] hover:bg-theme-card-secondary active:bg-theme-card-secondary sm:px-5",
        isCurrentUser && "bg-violet-500/[0.07]",
        isDimmed && "opacity-40"
      )}
    >
      {/* Live rank + movement since last GW */}
      <div className="flex flex-col items-start gap-1">
        <span className="text-sm font-semibold leading-none tabular-nums text-theme-heading-primary">
          {team.rank}
        </span>
        <Movement value={movement} />
      </div>

      {/* Team / manager (+ captain on small screens) */}
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-medium text-theme-heading-primary">
            {team.entry_name || "—"}
          </span>
          {isCurrentUser && (
            <Chip tone="accent" className="shrink-0">
              {t("fplLive.ui.leagues.you", "You")}
            </Chip>
          )}
          <span className="shrink-0 lg:hidden">
            <LeagueChipPill chip={team.active_chip} showEmpty={false} />
          </span>
        </div>
        <div className="mt-0.5 flex min-w-0 items-center gap-2 text-[11px] text-theme-text-muted">
          <span className="min-w-0 truncate">{team.player_name}</span>
          {team.captain.name && (
            <span className="flex shrink-0 items-center gap-1 lg:hidden">
              {captain && <PlayerJersey player={captain} size="xs" className="!h-3.5 !w-3.5" />}
              <span className="max-w-[5.5rem] truncate text-theme-text-secondary">
                {team.captain.name}
              </span>
              <span className="font-semibold tabular-nums text-theme-text-secondary">
                {team.captain.points}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Captain (desktop) */}
      <div className="hidden min-w-0 items-center gap-1.5 lg:flex">
        {team.captain.name ? (
          <>
            {captain && <PlayerJersey player={captain} size="xs" />}
            <span className="truncate text-xs text-theme-text-secondary">{team.captain.name}</span>
            <span className="text-xs font-semibold tabular-nums text-theme-heading-primary">
              {team.captain.points}
            </span>
          </>
        ) : (
          <span className="text-xs text-theme-text-muted">—</span>
        )}
      </div>

      {/* Yet to play (desktop) */}
      <div className="hidden text-center text-xs tabular-nums text-theme-text-secondary lg:block">
        {team.players_to_play}
      </div>

      {/* GW points */}
      <div className="text-right">
        <div className="text-sm font-semibold leading-none tabular-nums text-theme-heading-primary">
          {gwPoints}
        </div>
        {(hit > 0 || team.players_to_play > 0) && (
          <div className="mt-1 flex justify-end gap-1 text-[10px] leading-none tabular-nums">
            {hit > 0 && <span className="text-rose-500">−{hit}</span>}
            {team.players_to_play > 0 && (
              <span className="whitespace-nowrap text-theme-text-muted lg:hidden">
                {t("fplLive.ui.leagues.yetCount", "{{count}} left", {
                  count: team.players_to_play,
                })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Live total */}
      <div className="text-right text-sm font-semibold tabular-nums text-theme-heading-primary">
        {formatNumber(team.live_total)}
      </div>

      {/* Transfers, value, chip (desktop) */}
      <div className="hidden text-center text-xs tabular-nums text-theme-text-secondary lg:block">
        {team.event_transfers}
      </div>
      <div className="hidden text-right text-xs tabular-nums text-theme-text-secondary lg:block">
        {formatPrice(team.team_value)}
      </div>
      <div className="hidden justify-center lg:flex">
        <LeagueChipPill chip={team.active_chip} />
      </div>
    </button>
  );
}
