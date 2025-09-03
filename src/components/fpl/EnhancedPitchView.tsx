"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
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
  const { theme } = useTheme();
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

  // Calculate formation layout (top is our goal, bottom is opponent's goal)
  // y% grows downward: small y near top, large y near bottom
  const formationLayout = useMemo((): FormationLayout => {
    // Helper to distribute players evenly across X axis
    const distributeX = (
      count: number,
      y: number
    ): Array<{ x: number; y: number }> => {
      if (count <= 0) return [];
      if (count === 1) return [{ x: 50, y }];
      // Keep symmetric margins inside the pitch lines
      const minX = 8; // was 10; slightly wider to appear more centered
      const maxX = 92; // was 90; mirror the left margin
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

    // Y lines for each line
    const GK_Y = 10; // near our goal at top
    const DEF_Y = 28;
    const MID_Y = 50;
    const FWD_Y = 82; // near opponent goal at bottom

    const positions = {
      goalkeepers: [{ x: 50, y: GK_Y }],
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
            x: 47,
            y: 90,
          };
          positionType = "GK";
          gkIndex++;
          break;
        case 2: // Defender
          position = formationLayout.positions.defenders[defIndex] || {
            x: 47,
            y: 75,
          };
          positionType = "DEF";
          defIndex++;
          break;
        case 3: // Midfielder
          position = formationLayout.positions.midfielders[midIndex] || {
            x: 47,
            y: 45,
          };
          positionType = "MID";
          midIndex++;
          break;
        case 4: // Forward
          position = formationLayout.positions.forwards[fwdIndex] || {
            x: 47,
            y: 15,
          };
          positionType = "FWD";
          fwdIndex++;
          break;
        default:
          position = { x: 47, y: 50 };
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

  const handleDragStart = useCallback(
    (player: any) => {
      if (!interactive) return;
      // Drag functionality can be implemented here if needed
    },
    [interactive]
  );

  const handleDragEnd = useCallback(() => {
    // Drag end functionality can be implemented here if needed
  }, []);

  return (
    <div className="relative">
      {/* Formation Selector */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-sm font-medium">Formation:</label>
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

      {/* Enhanced Football Pitch */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-gradient-to-b from-green-400 via-green-500 to-green-400 rounded-xl shadow-inner overflow-hidden"
        style={{
          minHeight: "500px",
          height: "min(80vh, 700px)", // Responsive height
          background:
            theme === "dark"
              ? "linear-gradient(to bottom, #059669, #10b981, #059669)"
              : "linear-gradient(to bottom, #10b981, #34d399, #10b981)",
        }}
      >
        {/* Pitch Markings */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Outer boundary */}
          <rect
            x="2"
            y="2"
            width="96"
            height="96"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="0.2"
          />

          {/* Goal areas (top - our goal) */}
          <rect
            x="42"
            y="2"
            width="16"
            height="8"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="0.3"
          />
          <rect
            x="44"
            y="2"
            width="12"
            height="5"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="0.3"
          />

          {/* Goal areas (bottom - opponent's goal) */}
          <rect
            x="42"
            y="90"
            width="16"
            height="8"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="0.3"
          />
          <rect
            x="44"
            y="93"
            width="12"
            height="5"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="0.3"
          />

          {/* Center circle */}
          <circle
            cx="50"
            cy="50"
            r="12"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="0.2"
          />
          <circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.6)" />

          {/* Center line */}
          <line
            x1="2"
            y1="50"
            x2="98"
            y2="50"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="0.2"
          />

          {/* Penalty areas */}
          <rect
            x="25"
            y="2"
            width="50"
            height="18"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="0.2"
          />
          <rect
            x="25"
            y="80"
            width="50"
            height="18"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="0.2"
          />

          {/* Penalty spots */}
          <circle cx="50" cy="12" r="0.5" fill="rgba(255,255,255,0.6)" />
          <circle cx="50" cy="88" r="0.5" fill="rgba(255,255,255,0.6)" />

          {/* Corner arcs */}
          <path
            d="M 2 2 A 3 3 0 0 1 5 2"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="0.2"
          />
          <path
            d="M 98 2 A 3 3 0 0 0 95 2"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="0.2"
          />
          <path
            d="M 2 98 A 3 3 0 0 0 5 98"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="0.2"
          />
          <path
            d="M 98 98 A 3 3 0 0 1 95 98"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="0.2"
          />
        </svg>

        {/* Players positioned on pitch */}
        <div className="absolute inset-0 p-4">
          <AnimatePresence>
            {startingLineup.map((positionedPlayer) => {
              const player = getEnhancedPlayer(positionedPlayer.player_id);
              if (!player) return null;

              const isSelected = selectedPlayers.includes(player.id);
              const isHovered = hoveredPlayer === player.id;
              // Slight global horizontal nudge to the left for perfect centering
              const horizontalOffsetPercent = -1.5; // tune if needed

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
                    left: `calc(${positionedPlayer.x}% + ${horizontalOffsetPercent}%)`,
                    top: `${positionedPlayer.y}%`,
                    transform: "translate(-50%, -50%)", // Center the player properly
                  }}
                  onMouseEnter={() => setHoveredPlayer(player.id)}
                  onMouseLeave={() => setHoveredPlayer(null)}
                  onClick={() => handlePlayerClick(player)}
                  onDragStart={() => handleDragStart(player)}
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
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white/80 text-sm font-bold tracking-wide">
            OUR GOAL
          </div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/80 text-sm font-bold tracking-wide">
            OPPONENTS GOAL
          </div>
          <div className="absolute bottom-1/4 left-4 transform -translate-y-1/2 rotate-90 text-white/60 text-xs font-medium">
            ATTACK
          </div>
          <div className="absolute top-1/4 right-4 transform -translate-y-1/2 -rotate-90 text-white/60 text-xs font-medium">
            DEFEND
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
          <div className="absolute -top-3 left-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
            ⚽ SUBSTITUTES BENCH
          </div>

          {/* Bench Indicator Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-blue-500 to-green-400 rounded-t-2xl"></div>

          {/* Bench Seating Visual */}
          <div className="flex items-center justify-center mb-4 pt-2">
            <div className="flex space-x-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-12 h-3 bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-full shadow-inner"
                ></div>
              ))}
            </div>
          </div>

          {/* Bench Players Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 justify-items-center">
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
                  className="cursor-pointer touch-manipulation transform hover:scale-105 transition-transform duration-200"
                >
                  {player && (
                    <div className="relative">
                      <EnhancedPlayerCard
                        player={player}
                        isOnPitch={false}
                        isCaptain={false}
                        isViceCaptain={false}
                        isSelected={selectedPlayers.includes(player.id)}
                        interactive={interactive}
                        showStats={showStats}
                      />
                      {/* Substitute Number Badge */}
                      <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                        {12 + index}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Bench Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  {benchPlayers.length} Substitutes
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="text-green-600 dark:text-green-400">●</span>
                  Available
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-blue-600 dark:text-blue-400">●</span>
                  Ready to play
                </span>
              </div>
            </div>
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
          <span>Formation: {formation}</span>
          <span>•</span>
          <span>{startingLineup.length} players</span>
        </div>
      </motion.div>
    </div>
  );
}
