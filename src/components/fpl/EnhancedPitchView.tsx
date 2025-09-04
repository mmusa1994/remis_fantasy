"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import EnhancedPlayerCard from "./EnhancedPlayerCard";
import type {
  EnhancedPlayerData,
  FormationLayout,
  PitchPlayerPosition,
} from "@/types/fpl-enhanced";

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
  teamData,
}: EnhancedPitchViewProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [hoveredPlayer, setHoveredPlayer] = useState<number | null>(null);

  // Get player data with enhanced information
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
    [allPlayers, teamPlayers]
  );

  // Calculate formation layout for half-court (our half only)
  // y% grows downward: goalkeeper at top, forwards at bottom (attacking upward)
  const formationLayout = useMemo((): FormationLayout => {
    // Helper to distribute players evenly across X axis with better spacing
    const distributeX = (
      count: number,
      y: number
    ): Array<{ x: number; y: number }> => {
      if (count <= 0) return [];
      if (count === 1) return [{ x: 45, y }];

      // Better spacing for different player counts - more compact on mobile
      const getSpacing = (playerCount: number) => {
        // Check if mobile screen (rough approximation)
        const isMobile =
          typeof window !== "undefined" && window.innerWidth < 640;

        if (isMobile) {
          // Tighter spacing on mobile to accommodate larger cards
          switch (playerCount) {
            case 2:
              return { minX: 25, maxX: 70 };
            case 3:
              return { minX: 3, maxX: 65 };
            case 4:
              return { minX: 3, maxX: 65 };
            case 5:
              return { minX: 3, maxX: 72 };
            default:
              return { minX: 3, maxX: 72 };
          }
        } else {
          // Original desktop spacing
          switch (playerCount) {
            case 2:
              return { minX: 25, maxX: 70 };
            case 3:
              return { minX: 8, maxX: 80 };
            case 4:
              return { minX: 8, maxX: 80 };
            case 5:
              return { minX: 8, maxX: 80 };
            default:
              return { minX: 7, maxX: 80 };
          }
        }
      };

      const { minX, maxX } = getSpacing(count);
      const step = (maxX - minX) / (count - 1);

      return Array.from({ length: count }, (_, i) => ({
        x: Math.round(minX + i * step),
        y,
      }));
    };

    // Parse formation string like "3-4-3"
    const [defStr, midStr, fwdStr] = formation.split("-");
    const defCount = Math.max(0, parseInt(defStr || "0", 10) || 0);
    const midCount = Math.max(0, parseInt(midStr || "0", 10) || 0);
    const fwdCount = Math.max(0, parseInt(fwdStr || "0", 10) || 0);

    // Y positions for half-court layout (our defensive half)
    const GK_Y = 8; // Goalkeeper near our goal
    const DEF_Y = 30; // Defenders
    const MID_Y = 55; // Midfielders
    const FWD_Y = 78; // Forwards (attacking toward center/opponent goal)

    const positions = {
      goalkeepers: [{ x: 44, y: GK_Y }],
      defenders: distributeX(defCount, DEF_Y),
      midfielders: distributeX(midCount, MID_Y),
      forwards: distributeX(fwdCount, FWD_Y),
    };

    return {
      formation,
      positions,
      pitch_dimensions: { width: 100, height: 100 },
    };
  }, [formation]);

  // Get starting lineup with positions
  const startingLineup = useMemo(() => {
    const lineup = teamPlayers
      .filter((tp) => tp.position <= 11)
      .sort((a, b) => a.position - b.position);

    const positionedPlayers: PitchPlayerPosition[] = [];
    let gkIndex = 0,
      defIndex = 0,
      midIndex = 0,
      fwdIndex = 0;

    lineup.forEach((teamPlayer) => {
      const player = getEnhancedPlayer(teamPlayer.player_id);
      if (!player) return;

      let position: { x: number; y: number };
      let positionType: "GK" | "DEF" | "MID" | "FWD";

      switch (player.element_type) {
        case 1: // Goalkeeper
          position = formationLayout.positions.goalkeepers[gkIndex] || {
            x: 45,
            y: 10,
          };
          positionType = "GK";
          gkIndex++;
          break;
        case 2: // Defender
          position = formationLayout.positions.defenders[defIndex] || {
            x: 45,
            y: 30,
          };
          positionType = "DEF";
          defIndex++;
          break;
        case 3: // Midfielder
          position = formationLayout.positions.midfielders[midIndex] || {
            x: 45,
            y: 55,
          };
          positionType = "MID";
          midIndex++;
          break;
        case 4: // Forward
          position = formationLayout.positions.forwards[fwdIndex] || {
            x: 45,
            y: 75,
          };
          positionType = "FWD";
          fwdIndex++;
          break;
        default:
          position = { x: 45, y: 55 };
          positionType = "MID";
      }

      positionedPlayers.push({
        player_id: player.id,
        x: position.x,
        y: position.y,
        position_type: positionType,
        is_captain: player.is_captain,
        is_vice_captain: player.is_vice_captain,
      });
    });

    return positionedPlayers;
  }, [teamPlayers, formationLayout, getEnhancedPlayer]);

  // Get bench players
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
    [interactive, compareMode, onPlayerClick, onPlayerSelect]
  );

  const handleDragStart = useCallback(() => {
    if (!interactive) return;
    // Drag functionality can be implemented here if needed
  }, [interactive]);

  const handleDragEnd = useCallback(() => {
    // Drag end functionality can be implemented here if needed
  }, []);

  return (
    <div className="relative overflow-visible" style={{ zIndex: 1 }}>
      {/* Team Stats Header */}
      {teamData && (
        <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 sm:gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  Bank:
                </span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  £{(teamData.bank / 10).toFixed(1)}m
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  Team Value:
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  £{(teamData.value / 10).toFixed(1)}m
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  Total Points:
                </span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {teamData.points}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-sm">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  Transfers:
                </span>
                <span className="font-bold text-orange-600 dark:text-orange-400">
                  {teamData.total_transfers}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formation Selector */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-sm font-medium">
            {t("pitch.formation", "Formation")}:
          </label>
          <select
            value={formation}
            onChange={(e) => {
              if (onFormationChange) {
                onFormationChange(e.target.value);
              }
            }}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 flex-1 sm:flex-none"
          >
            <option value="3-4-3">3-4-3</option>
            <option value="3-5-2">3-5-2</option>
            <option value="4-3-3">4-3-3</option>
            <option value="4-4-2">4-4-2</option>
            <option value="4-5-1">4-5-1</option>
            <option value="5-3-2">5-3-2</option>
          </select>
        </div>

        {compareMode && (
          <div className="text-sm text-gray-600 dark:text-gray-400 w-full sm:w-auto text-left sm:text-right">
            Selected: {selectedPlayers.length}/2 players
          </div>
        )}
      </div>

      {/* Enhanced Football Pitch - Half Court */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-gradient-to-b from-green-400 via-green-500 to-green-400 rounded-xl shadow-inner"
        style={{
          minHeight: "500px",
          height: "min(70vh, 600px)", // Optimized for mobile - smaller height
          background:
            theme === "dark"
              ? "linear-gradient(to bottom, #059669, #10b981, #059669)"
              : "linear-gradient(to bottom, #10b981, #34d399, #10b981)",
        }}
      >
        {/* Pitch Markings - Half Court Layout */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Outer boundary */}
          <rect
            x="5"
            y="5"
            width="90"
            height="90"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.3"
          />

          {/* Our Goal (top) */}
          <rect
            x="42"
            y="5"
            width="16"
            height="6"
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="0.4"
          />
          <rect
            x="46"
            y="5"
            width="8"
            height="3"
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="0.4"
          />

          {/* Penalty Area (our goal) */}
          <rect
            x="25"
            y="5"
            width="50"
            height="18"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.3"
          />

          {/* Goal Area (our goal) */}
          <rect
            x="40"
            y="5"
            width="20"
            height="8"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.3"
          />

          {/* Penalty Spot */}
          <circle cx="50" cy="14" r="0.8" fill="rgba(255,255,255,0.8)" />

          {/* Half-way line at bottom */}
          <line
            x1="5"
            y1="95"
            x2="95"
            y2="95"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="0.4"
          />

          {/* Center circle (partial) */}
          <path
            d="M 30 95 A 20 20 0 0 1 70 95"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.3"
          />
          <circle cx="50" cy="95" r="1" fill="rgba(255,255,255,0.7)" />

          {/* Corner arcs */}
          <path
            d="M 5 5 A 3 3 0 0 1 8 5"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.3"
          />
          <path
            d="M 95 5 A 3 3 0 0 0 92 5"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.3"
          />

          {/* Side lines */}
          <line
            x1="5"
            y1="5"
            x2="5"
            y2="95"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.3"
          />
          <line
            x1="95"
            y1="5"
            x2="95"
            y2="95"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.3"
          />
        </svg>

        {/* Players positioned on pitch */}
        <div
          className="absolute inset-0 p-2 sm:p-1 lg:p-2"
          style={{ overflow: "visible", zIndex: 10 }}
        >
          <AnimatePresence>
            {startingLineup.map((positionedPlayer) => {
              const player = getEnhancedPlayer(positionedPlayer.player_id);
              if (!player) return null;

              const isSelected = selectedPlayers.includes(player.id);
              const isHovered = hoveredPlayer === player.id;

              return (
                <motion.div
                  key={positionedPlayer.player_id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: isHovered ? 1.1 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="absolute cursor-pointer z-10 touch-manipulation"
                  style={{
                    left: `${positionedPlayer.x}%`,
                    top: `${positionedPlayer.y}%`,
                    transform: "translate(-50%, -50%)", // Center the player properly
                  }}
                  onMouseEnter={() => setHoveredPlayer(player.id)}
                  onMouseLeave={() => setHoveredPlayer(null)}
                  onClick={() => handlePlayerClick(player)}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  draggable={interactive}
                >
                  <EnhancedPlayerCard
                    player={player}
                    isOnPitch={true}
                    isCaptain={positionedPlayer.is_captain}
                    isViceCaptain={positionedPlayer.is_vice_captain}
                    isSelected={isSelected}
                    isHovered={isHovered}
                    interactive={interactive}
                    showStats={showStats}
                    position={positionedPlayer.position_type}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Position Labels */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-white/90 text-sm font-bold tracking-wide bg-black/30 px-2 py-1 rounded w-full text-center">
            {t("pitch.ourGoal", "OUR GOAL")}
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-white/90 text-sm font-bold tracking-wide bg-black/30 px-2 py-1 rounded w-full text-center">
            {t("pitch.attackingDirection", "ATTACKING DIRECTION")}
          </div>
        </div>
      </motion.div>

      {/* Enhanced Professional Bench */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8"
      >
        {/* Professional Bench Container */}
        <div className="relative bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-2xl p-6 shadow-lg border-2 border-gray-200 dark:border-gray-600">
          {/* Bench Label Badge */}
          <div className="absolute -top-3 left-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md z-10">
            {t("pitch.substitutesBench", "SUBSTITUTES BENCH")}
          </div>

          {/* Bench Indicator Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-blue-500 to-green-400 rounded-t-2xl"></div>

          {/* Bench Stats Summary */}
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {benchPlayers.length}{" "}
              {t("pitch.substitutesAvailable", "Substitutes Available")}
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="text-green-500">●</span>
                {t("pitch.ready", "Ready")}
              </span>
            </div>
          </div>

          {/* Bench Players Grid - Mobile optimized */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-4 sm:gap-3 md:gap-4">
            <AnimatePresence>
              {benchPlayers.map((player, index) => (
                <motion.div
                  key={player?.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{
                    delay: 0.6 + index * 0.1,
                    type: "spring",
                    damping: 15,
                    stiffness: 200,
                  }}
                  onClick={() => player && handlePlayerClick(player)}
                  className="cursor-pointer touch-manipulation transform hover:scale-105 transition-transform duration-200 relative"
                >
                  {player && (
                    <>
                      <EnhancedPlayerCard
                        player={player}
                        isOnPitch={false}
                        isCaptain={false}
                        isViceCaptain={false}
                        isSelected={selectedPlayers.includes(player.id)}
                        interactive={interactive}
                        showStats={showStats}
                        compact={false}
                      />
                      {/* Substitute Number Badge */}
                      <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white">
                        {12 + index}
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Formation Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-4 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-gray-400">
          <span>
            {t("pitch.formation", "Formation")}: {formation}
          </span>
          <span>•</span>
          <span>
            {startingLineup.length} {t("pitch.players", "players")}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
