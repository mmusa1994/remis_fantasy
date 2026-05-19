"use client";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import { MdExpandLess, MdExpandMore, MdRemove } from "react-icons/md";
import LeagueChipPill from "./LeagueChipPill";
import type { ProcessedTeam } from "./types";

interface LeagueTableRowProps {
  variant: "tablet" | "desktop";
  team: ProcessedTeam;
  rankDisplay: number;
  isCurrentUser: boolean;
  isHighlighted: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  showGwNet: boolean;
}

function renderRankChange(change: number) {
  if (change > 0)
    return <FaArrowUp className="w-3 h-3 text-green-500" />;
  if (change < 0)
    return <FaArrowDown className="w-3 h-3 text-red-500" />;
  return <MdRemove className="w-3 h-3 text-gray-400" />;
}

export default function LeagueTableRow({
  variant,
  team,
  rankDisplay,
  isCurrentUser,
  isHighlighted,
  isExpanded,
  onToggleExpand,
  showGwNet,
}: LeagueTableRowProps) {
  const gwDisplay = showGwNet ? team.live_points_net : team.live_points_gross;
  const teamValue = (team.team_value / 10).toFixed(1);
  const baseRowClasses = `cursor-pointer transition-all duration-300 ${
    isCurrentUser
      ? "bg-gradient-to-r from-purple-100/80 to-violet-100/80 dark:from-purple-900/30 dark:to-violet-900/30 border-l-4 border-purple-500"
      : "hover:bg-theme-card-secondary"
  } ${
    isHighlighted ? "ring-2 ring-blue-400/70 bg-blue-50/40 dark:bg-blue-900/10" : ""
  }`;

  if (variant === "tablet") {
    return (
      <div
        className={`px-3 py-2 ${baseRowClasses}`}
        onClick={onToggleExpand}
        role="button"
        tabIndex={0}
      >
        <div className="grid grid-cols-[40px_minmax(0,_1fr)_40px_60px_70px_50px_30px] gap-2 items-center text-sm">
          <div className="flex items-center gap-1">
            <span className="font-bold">{rankDisplay}</span>
            {renderRankChange(team.rank_change)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              {isCurrentUser && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500 text-white">
                  YOU
                </span>
              )}
              <p className="font-semibold text-theme-foreground truncate">
                {team.entry_name || "N/A"}
              </p>
            </div>
            <p className="text-xs text-theme-text-secondary truncate">
              {team.player_name}
              {team.captain.name && (
                <span className="ml-1">
                  · (C) {team.captain.name} {team.captain.points}
                </span>
              )}
            </p>
          </div>
          <div className="text-center text-sm font-medium">
            {team.players_to_play}
          </div>
          <div className="text-center font-bold text-green-600 dark:text-green-400">
            {gwDisplay}
            {team.event_transfers_cost > 0 && (
              <span className="ml-1 text-[10px] text-red-500">
                -{team.event_transfers_cost}
              </span>
            )}
          </div>
          <div className="text-center font-bold text-theme-foreground">
            {team.live_total}
          </div>
          <div className="flex justify-center">
            <LeagueChipPill chip={team.active_chip} />
          </div>
          <div className="flex justify-end">
            {isExpanded ? (
              <MdExpandLess className="w-5 h-5 text-theme-text-secondary" />
            ) : (
              <MdExpandMore className="w-5 h-5 text-theme-text-secondary" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`px-4 py-3 ${baseRowClasses}`}
      onClick={onToggleExpand}
      role="button"
      tabIndex={0}
    >
      <div className="grid grid-cols-[60px_minmax(0,_1.4fr)_minmax(0,_1.2fr)_40px_minmax(0,_1fr)_70px_70px_80px_50px_70px_60px_50px_30px] gap-2 items-center text-sm">
        <div className="flex items-center gap-1">
          <span className="font-bold">{rankDisplay}</span>
          {renderRankChange(team.rank_change)}
        </div>
        <div className="min-w-0 flex items-center gap-2">
          {isCurrentUser && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-500 text-white">
              YOU
            </span>
          )}
          <p className="font-medium text-theme-foreground truncate">
            {team.player_name}
          </p>
        </div>
        <p className="font-semibold text-theme-foreground truncate">
          {team.entry_name || "—"}
        </p>
        <div className="text-center font-medium">{team.players_to_play}</div>
        <div className="text-xs text-theme-foreground truncate">
          {team.captain.name ? (
            <>
              {team.captain.name}
              <span className="ml-1 text-theme-text-secondary">
                ({team.captain.points})
              </span>
            </>
          ) : (
            "—"
          )}
        </div>
        <div className="text-center font-bold text-theme-foreground">
          {team.live_points_gross}
        </div>
        <div className="text-center font-bold text-green-600 dark:text-green-400">
          {team.live_points_net}
          {team.event_transfers_cost > 0 && (
            <div className="text-[10px] text-red-500">
              -{team.event_transfers_cost}
            </div>
          )}
        </div>
        <div className="text-center font-bold text-theme-foreground">
          {team.live_total}
        </div>
        <div className="text-center text-sm">{team.event_transfers}</div>
        <div className="text-center text-sm">£{teamValue}</div>
        <div className="flex justify-center">
          <LeagueChipPill chip={team.active_chip} />
        </div>
        <div className="text-center text-xs text-theme-text-secondary">
          {11 - team.players_to_play}/11
        </div>
        <div className="flex justify-end">
          {isExpanded ? (
            <MdExpandLess className="w-5 h-5 text-theme-text-secondary" />
          ) : (
            <MdExpandMore className="w-5 h-5 text-theme-text-secondary" />
          )}
        </div>
      </div>
    </div>
  );
}
