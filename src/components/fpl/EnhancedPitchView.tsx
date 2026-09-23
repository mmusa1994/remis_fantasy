"use client";

import { useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import EnhancedPlayerCard from "./EnhancedPlayerCard";
import type { EnhancedPlayerData } from "@/types/fpl-enhanced";

interface EnhancedPitchViewProps {
  teamPlayers: any[];
  allPlayers: EnhancedPlayerData[];
  onPlayerClick?: (player: any) => void;
  onPlayerSelect?: (player: any) => void;
  selectedPlayers?: number[];
  compareMode?: boolean;
  formation?: string;
  onFormationChange?: (formation: string) => void;
  showStats?: boolean;
  interactive?: boolean;
  teamData?: {
    bank: number;
    value: number;
    total_transfers: number;
    points: number;
  };
}

export default function EnhancedPitchView({
  teamPlayers,
  allPlayers,
  onPlayerClick,
  onPlayerSelect,
  selectedPlayers = [],
  compareMode = false,
  formation = "3-4-3",
  onFormationChange,
  showStats = true,
  interactive = true,
}: EnhancedPitchViewProps) {
  const { t } = useTranslation("fpl");

  // Merge bootstrap player data with the squad entry (captaincy, position...)
  const getEnhancedPlayer = useCallback(
    (playerId: number) => {
      const basePlayer = allPlayers.find((p) => p.id === playerId);
      const teamPlayer = teamPlayers.find((tp) => tp.player_id === playerId);

      if (!basePlayer || !teamPlayer) return null;

      return {
        ...basePlayer,
        ...teamPlayer,
        is_captain: teamPlayer.is_captain,
        is_vice_captain: teamPlayer.is_vice_captain,
        multiplier: teamPlayer.multiplier,
        position: teamPlayer.position,
      };
    },
    [allPlayers, teamPlayers],
  );

  // Starting XI grouped into lines by actual position — the pitch always
  // mirrors the real XI, so a line never has more players than slots.
  const lines = useMemo(() => {
    const byType: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
    teamPlayers
      .filter((tp) => tp.position <= 11)
      .sort((a, b) => a.position - b.position)
      .forEach((tp) => {
        const player = getEnhancedPlayer(tp.player_id);
        if (player && byType[player.element_type]) {
          byType[player.element_type].push(player);
        }
      });
    return [
      { key: "GK" as const, players: byType[1] },
      { key: "DEF" as const, players: byType[2] },
      { key: "MID" as const, players: byType[3] },
      { key: "FWD" as const, players: byType[4] },
    ];
  }, [teamPlayers, getEnhancedPlayer]);

  const actualFormation = useMemo(() => {
    const [, def, mid, fwd] = lines.map((l) => l.players.length);
    return def + mid + fwd === 10 ? `${def}-${mid}-${fwd}` : formation;
  }, [lines, formation]);

  // Keep the parent's formation (used by the list view) in sync with the XI
  useEffect(() => {
    if (onFormationChange && actualFormation !== formation) {
      onFormationChange(actualFormation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualFormation]);

  const benchPlayers = useMemo(() => {
    return teamPlayers
      .filter((tp) => tp.position > 11)
      .sort((a, b) => a.position - b.position)
      .map((tp) => getEnhancedPlayer(tp.player_id))
      .filter(Boolean);
  }, [teamPlayers, getEnhancedPlayer]);

  const handlePlayerClick = useCallback(
    (player: any) => {
      if (!interactive) return;

      if (compareMode && onPlayerSelect) {
        onPlayerSelect(player);
      } else if (onPlayerClick) {
        onPlayerClick(player);
      }
    },
    [interactive, compareMode, onPlayerClick, onPlayerSelect],
  );

  const renderToken = (player: any, onPitch: boolean) => (
    <button
      type="button"
      onClick={() => handlePlayerClick(player)}
      className="touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 rounded-lg"
      aria-label={player.web_name}
    >
      <EnhancedPlayerCard
        player={player}
        isOnPitch={onPitch}
        isCaptain={onPitch && player.is_captain}
        isViceCaptain={onPitch && player.is_vice_captain}
        isSelected={selectedPlayers.includes(player.id)}
        interactive={interactive}
        showStats={showStats}
        position={
          player.element_type === 1
            ? "GK"
            : player.element_type === 2
            ? "DEF"
            : player.element_type === 3
            ? "MID"
            : "FWD"
        }
      />
    </button>
  );

  // FPL bench order: keeper first, then outfield subs 1-3
  const benchLabels = useMemo(() => {
    let n = 0;
    return benchPlayers.map((p: any) => (p?.element_type === 1 ? "GK" : String(++n)));
  }, [benchPlayers]);

  return (
    <div className="relative">
      {/* Pitch */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl sm:rounded-2xl ring-1 ring-black/10 dark:ring-white/10 shadow-[inset_0_0_60px_rgba(0,0,0,0.25)]"
        style={{
          background:
            "repeating-linear-gradient(180deg, #13854f 0px, #13854f 44px, #0f7746 44px, #0f7746 88px)",
        }}
      >
        {/* Markings — plain boxes so nothing distorts at any aspect ratio */}
        <div className="pointer-events-none absolute inset-2 sm:inset-3 rounded-sm border border-white/35">
          {/* Penalty area */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[56%] sm:w-[44%] h-[17%] border border-t-0 border-white/35" />
          {/* Six-yard box */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[26%] sm:w-[20%] h-[7%] border border-t-0 border-white/35" />
          {/* Penalty arc */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[17%] w-16 h-16 sm:w-24 sm:h-24 -translate-y-1/2 rounded-full border border-white/35 [clip-path:inset(50%_0_0_0)]" />
          {/* Halfway line + centre circle */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-28 h-28 sm:w-40 sm:h-40 rounded-full border border-white/35" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/50" />
        </div>

        {/* Formation chip */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 px-2 py-0.5 rounded-md bg-black/30 backdrop-blur-sm text-[10px] sm:text-xs font-semibold tracking-wide text-white/90 tabular-nums">
          {actualFormation}
        </div>
        {compareMode && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 px-2 py-0.5 rounded-md bg-sky-500/80 text-[10px] sm:text-xs font-semibold text-white tabular-nums">
            {selectedPlayers.length}/2
          </div>
        )}

        {/* Lines */}
        <div className="relative z-10 flex flex-col justify-between gap-2 px-1 sm:px-4 pt-4 pb-5 sm:pt-6 sm:pb-8 min-h-[400px] sm:min-h-[500px] lg:min-h-[560px]">
          {lines.map((line) => (
            <div
              key={line.key}
              className="flex items-start justify-evenly"
            >
              <AnimatePresence>
                {line.players.map((player) => (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ type: "spring", damping: 22, stiffness: 300 }}
                  >
                    {renderToken(player, true)}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Bench */}
      {benchPlayers.length > 0 && (
        <div className="mt-2 sm:mt-3 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800/60 ring-1 ring-black/5 dark:ring-white/10 px-1 sm:px-4 pt-2 pb-3">
          <div className="mb-1.5 px-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("bench", "Bench")}
          </div>
          <div className="grid grid-cols-4 place-items-center">
            {benchPlayers.map((player: any, index) => (
              <div key={player.id} className="flex flex-col items-center gap-1">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                  {benchLabels[index]}
                </span>
                {renderToken(player, false)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
