"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { getPlayerTeamColors } from "@/lib/team-colors";
import TeamJersey from "./TeamJersey";
import type { EnhancedPlayerData } from "@/types/fpl-enhanced";

interface EnhancedPlayerCardProps {
  player: EnhancedPlayerData | any; // Support both enhanced and regular player data
  isOnPitch?: boolean;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
  interactive?: boolean;
  showStats?: boolean;
  showTooltip?: boolean;
  position?: "GK" | "DEF" | "MID" | "FWD";
  compact?: boolean;
  /** Replaces the points plate content (e.g. live points or "ARS (H)"). */
  pointsLabel?: ReactNode;
  /** Price-change arrow on the shirt; off for live views. Default true. */
  showPriceChange?: boolean;
  /** Small marker at the shirt's bottom-right (e.g. auto-sub arrow). */
  cornerBadge?: ReactNode;
}

/**
 * FPL-style pitch token: club shirt on top, name plate and points plate below.
 * Fixed width so five players fit across a phone-width pitch.
 */
export default function EnhancedPlayerCard({
  player,
  isOnPitch = true,
  isCaptain = false,
  isViceCaptain = false,
  isSelected = false,
  interactive = true,
  position,
  pointsLabel,
  showPriceChange = true,
  cornerBadge,
}: EnhancedPlayerCardProps) {
  const { t } = useTranslation("fpl");
  if (!player) return null;

  const teamColors = getPlayerTeamColors(player);
  const isGoalkeeper = player.element_type === 1 || position === "GK";
  // Last gameweek points (event_points), live points when the GW is running
  const points = player.event_points ?? 0;
  const livePoints = player.live_stats?.total_points ?? player.points ?? 0;
  const shownPoints = livePoints > 0 ? livePoints : points;

  const priceChange = player.price_change_24h || player.cost_change_event || 0;

  // FPL marks doubtful players amber and unavailable ones red
  const status: "available" | "doubtful" | "out" =
    player.status === "d"
      ? "doubtful"
      : player.status === "i" || player.status === "s" || player.status === "u"
      ? "out"
      : "available";

  const namePlate =
    status === "doubtful"
      ? "bg-amber-400 text-slate-950"
      : status === "out"
      ? "bg-rose-600 text-white"
      : "bg-slate-950/85 text-white";

  const width = isOnPitch
    ? "w-[62px] sm:w-[76px] lg:w-[88px]"
    : "w-[62px] sm:w-[72px] lg:w-[80px]";
  const shirt = isOnPitch
    ? "w-10 h-10 sm:w-12 sm:h-12 lg:w-[52px] lg:h-[52px]"
    : "w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11";

  return (
    <motion.div
      whileHover={interactive ? { y: -2 } : undefined}
      whileTap={interactive ? { scale: 0.94 } : undefined}
      className={`relative flex flex-col items-center ${width} select-none ${
        interactive ? "cursor-pointer" : ""
      }`}
      title={`${player.web_name} · ${teamColors.name}`}
    >
      {/* Shirt + badges */}
      <div className="relative">
        {isSelected && (
          <span className="absolute -inset-1.5 rounded-full bg-sky-400/30 ring-2 ring-sky-300 animate-pulse" />
        )}
        <TeamJersey
          kit={teamColors}
          isGoalkeeper={isGoalkeeper}
          className={`relative ${shirt} drop-shadow-[0_3px_4px_rgba(0,0,0,0.35)]`}
        />

        {(isCaptain || isViceCaptain) && (
          <span
            className={`absolute -top-0.5 -right-2 sm:-right-2.5 w-[18px] h-[18px] sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-extrabold ring-2 ring-white/90 dark:ring-slate-950 shadow ${
              isCaptain ? "bg-yellow-400 text-slate-950" : "bg-sky-600 text-white"
            }`}
          >
            {isCaptain ? "C" : "V"}
          </span>
        )}

        {status !== "available" && (
          <span
            className={`absolute -top-0.5 -left-2 sm:-left-2.5 w-[18px] h-[18px] sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ring-2 ring-white/90 dark:ring-slate-950 shadow ${
              status === "doubtful" ? "bg-amber-400 text-slate-950" : "bg-rose-600 text-white"
            }`}
            title={player.news || undefined}
          >
            !
          </span>
        )}

        {showPriceChange && priceChange !== 0 && (
          <span
            className={`absolute bottom-0 -left-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow ${
              priceChange > 0 ? "bg-emerald-500" : "bg-rose-500"
            }`}
          >
            {priceChange > 0 ? "▲" : "▼"}
          </span>
        )}

        {cornerBadge ? (
          <span className="absolute bottom-0 -right-1.5">{cornerBadge}</span>
        ) : (
          player.isTransferIn && (
            <span className="absolute bottom-0 -right-1.5 px-1 rounded bg-emerald-500 text-[8px] font-bold text-white shadow">
              {t("teamPlanner.pitch.inBadge")}
            </span>
          )
        )}
      </div>

      {/* Name + points plates */}
      <div
        className={`mt-0.5 w-full overflow-hidden rounded-md shadow-[0_2px_6px_rgba(0,0,0,0.25)] ${
          isSelected ? "ring-2 ring-sky-300" : ""
        }`}
      >
        <div
          className={`px-1 py-[3px] text-center text-[10px] sm:text-[11px] font-semibold leading-tight truncate ${namePlate}`}
        >
          {player.web_name}
        </div>
        <div className="py-[2px] text-center text-[10px] sm:text-[11px] font-bold leading-tight tabular-nums bg-white/95 text-slate-900">
          {pointsLabel ?? shownPoints}
        </div>
      </div>
    </motion.div>
  );
}
