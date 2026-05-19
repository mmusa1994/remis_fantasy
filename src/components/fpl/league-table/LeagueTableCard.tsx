"use client";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import { MdExpandLess, MdExpandMore, MdRemove } from "react-icons/md";
import LeagueChipPill from "./LeagueChipPill";
import type { ProcessedTeam } from "./types";

interface LeagueTableCardProps {
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

export default function LeagueTableCard({
  team,
  rankDisplay,
  isCurrentUser,
  isHighlighted,
  isExpanded,
  onToggleExpand,
  showGwNet,
}: LeagueTableCardProps) {
  const gwDisplay = showGwNet ? team.live_points_net : team.live_points_gross;
  const playedCount = 11 - team.players_to_play;
  const baseClasses = `rounded-lg border p-3 cursor-pointer transition-all duration-200 ${
    isCurrentUser
      ? "bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-300 dark:border-purple-700 ring-1 ring-purple-400"
      : "bg-theme-card border-theme-border hover:border-purple-200 dark:hover:border-purple-700"
  } ${
    isHighlighted ? "ring-2 ring-blue-400" : ""
  }`;

  return (
    <div
      className={baseClasses}
      onClick={onToggleExpand}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="font-bold text-base text-theme-foreground">
              #{rankDisplay}
            </span>
            {renderRankChange(team.rank_change)}
          </div>
          {isCurrentUser && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-500 text-white shrink-0">
              YOU
            </span>
          )}
          <p className="font-semibold text-theme-foreground truncate min-w-0">
            {team.entry_name || "N/A"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <LeagueChipPill chip={team.active_chip} />
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
            {gwDisplay}
          </span>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-theme-text-secondary">
        <span className="truncate">{team.player_name}</span>
        <span className="font-bold text-theme-foreground shrink-0">
          {team.live_total}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px] text-theme-text-secondary">
        {team.captain.name && (
          <span>
            (C) {team.captain.name}{" "}
            <span className="font-bold text-theme-foreground">
              {team.captain.points}
            </span>
          </span>
        )}
        <span>• Yet {team.players_to_play}</span>
        <span>• FT {team.event_transfers}</span>
        {team.event_transfers_cost > 0 && (
          <span className="text-red-500">−{team.event_transfers_cost}</span>
        )}
      </div>
      <div className="mt-2 pt-2 border-t border-theme-border/60 flex items-center justify-between text-[11px] text-theme-text-secondary">
        <span>
          Played {playedCount}/11
        </span>
        <span className="flex items-center gap-1">
          {isExpanded ? (
            <>Hide <MdExpandLess className="w-4 h-4" /></>
          ) : (
            <>Details <MdExpandMore className="w-4 h-4" /></>
          )}
        </span>
      </div>
    </div>
  );
}
