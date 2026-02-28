"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Users, AlertTriangle } from "lucide-react";
import { PiTShirtFill } from "react-icons/pi";

import { useTheme } from "@/contexts/ThemeContext";
import { getTeamColors } from "@/lib/team-colors";
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
}

// Function to get kit icon - now always returns team jersey
const getKitIcon = () => {
  return PiTShirtFill;
};

export default function EnhancedPlayerCard({
  player,
  isOnPitch = true,
  isCaptain = false,
  isViceCaptain = false,
  isSelected = false,
  isHovered = false,
  interactive = true,
  showStats = true,
  showTooltip = true,
  position,
  compact = false,
}: EnhancedPlayerCardProps) {
  const { theme } = useTheme();
  const [showAdvancedTooltip, setShowAdvancedTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<
    "left" | "right" | "center"
  >("center");
  const [isMobile, setIsMobile] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Screen size and positioning detection
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    const updateTooltipPosition = () => {
      if (!cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const tooltipWidth = isMobile ? 280 : 320; // Smaller on mobile

      // Check if tooltip would overflow on the right
      if (rect.left + tooltipWidth / 2 > screenWidth - 20) {
        setTooltipPosition("left");
      }
      // Check if tooltip would overflow on the left
      else if (rect.left - tooltipWidth / 2 < 20) {
        setTooltipPosition("right");
      } else {
        setTooltipPosition("center");
      }
    };

    checkScreenSize();
    updateTooltipPosition();

    window.addEventListener("resize", checkScreenSize);
    window.addEventListener("resize", updateTooltipPosition);
    window.addEventListener("scroll", updateTooltipPosition);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
      window.removeEventListener("resize", updateTooltipPosition);
      window.removeEventListener("scroll", updateTooltipPosition);
    };
  }, [isMobile, showAdvancedTooltip]);

  if (!player) return null;

  const teamColors = getTeamColors(player.team);
  const points = player.total_points || player.event_points || 0;
  const livePoints = player.live_stats?.total_points || player.points || 0;

  // Enhanced data (might not be available for all players)
  const priceChange = player.price_change_24h || player.cost_change_event || 0;
  const ownershipChange = player.ownership_change_24h || 0;
  const priceTrend =
    player.price_trend ||
    (priceChange > 0 ? "rising" : priceChange < 0 ? "falling" : "stable");
  const ownershipTrend =
    player.ownership_trend ||
    (ownershipChange > 0
      ? "rising"
      : ownershipChange < 0
      ? "falling"
      : "stable");

  // Player status and availability
  const availabilityStatus =
    player.availability_status ||
    (player.status === "a"
      ? "available"
      : player.status === "d"
      ? "doubtful"
      : player.status === "i"
      ? "injured"
      : player.status === "s"
      ? "suspended"
      : "available");

  const cardSize = isOnPitch
    ? compact
      ? "w-14 h-16"
      : "w-14 sm:w-16 lg:w-20 h-18 sm:h-18 lg:h-22" // Smaller on mobile
    : compact
    ? "w-16 h-20" // Bench cards larger
    : "w-14 sm:w-18 lg:w-20 h-18 sm:h-22 lg:h-24"; // Bench cards bigger

  const textSize = isOnPitch
    ? compact
      ? "text-xs"
      : "text-xs" // Smaller, cleaner text
    : compact
    ? "text-xs"
    : "text-xs";

  // Status indicator colors
  const getStatusColor = () => {
    switch (availabilityStatus) {
      case "injured":
        return "bg-red-500";
      case "doubtful":
        return "bg-yellow-500";
      case "suspended":
        return "bg-orange-500";
      default:
        return null;
    }
  };

  // Price change indicator
  const renderPriceIndicator = () => {
    if (!priceChange) return null;

    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center text-xs ${
          priceChange > 0 ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}
      >
        {priceChange > 0 ? "↗" : "↘"}
      </motion.div>
    );
  };

  // Ownership change indicator
  const renderOwnershipIndicator = () => {
    if (!ownershipChange || Math.abs(ownershipChange) < 0.1) return null;

    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`absolute -bottom-0 -left-0 w-4 h-4 rounded-full flex items-center justify-center text-xs ${
          ownershipChange > 0
            ? "bg-blue-500 text-white"
            : "bg-purple-500 text-white"
        }`}
      >
        <Users className="w-2 h-2" />
      </motion.div>
    );
  };

  // Captain/Vice-Captain badge
  const renderCaptainBadge = () => {
    if (!isCaptain && !isViceCaptain) return null;

    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`absolute -top-0 -right-0 ${
          isOnPitch ? "w-5 sm:w-5 lg:w-5 h-5 sm:h-5 lg:h-5" : "w-4 h-4"
        } rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ${
          isCaptain ? "bg-yellow-500" : "bg-blue-500"
        }`}
      >
        {isCaptain ? "C" : "V"}
      </motion.div>
    );
  };

  // Status badge (injury, suspension, etc.)
  const renderStatusBadge = () => {
    const statusColor = getStatusColor();
    if (!statusColor) return null;

    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`absolute -bottom-0 -right-0 w-3 h-3 rounded-full ${statusColor}`}
      />
    );
  };

  // Advanced responsive tooltip
  const renderAdvancedTooltip = () => {
    if (!showTooltip || !showAdvancedTooltip) return null;

    // Dynamic positioning classes
    const getPositionClasses = () => {
      switch (tooltipPosition) {
        case "left":
          return "bottom-full right-0 mb-2";
        case "right":
          return "bottom-full left-0 mb-2";
        default:
          return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
      }
    };

    // Dynamic transform style
    const getTransformStyle = () => {
      switch (tooltipPosition) {
        case "left":
          return "translateY(-100%)";
        case "right":
          return "translateY(-100%)";
        default:
          return "translate(-50%, -100%)";
      }
    };

    // Responsive size classes
    const sizeClasses = isMobile
      ? "px-3 py-2 text-2xs min-w-[260px] max-w-[280px]"
      : "px-4 py-3 text-xs min-w-64 max-w-72";

    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className={`absolute ${getPositionClasses()} ${sizeClasses} bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-xl z-[9999] border border-gray-700`}
        style={{
          position: "fixed",
          zIndex: 9999,
          transform: getTransformStyle(),
          marginBottom: isMobile ? "4px" : "8px",
        }}
      >
        {/* Player Info Header */}
        <div className="border-b border-white/20 pb-2 mb-2">
          <div className="font-bold text-sm">
            {player.first_name} {player.second_name}
          </div>
          <div className="text-gray-300 flex items-center gap-2">
            <span>{teamColors.name}</span>
            <span>•</span>
            <span>{position || "Unknown"}</span>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div>
            <div className="text-gray-400">Price</div>
            <div className="font-bold text-green-400">
              £{((player.now_cost || 0) / 10).toFixed(1)}m
              {priceChange !== 0 && (
                <span
                  className={`ml-1 text-xs ${
                    priceChange > 0 ? "text-green-300" : "text-red-300"
                  }`}
                >
                  ({priceChange > 0 ? "+" : ""}
                  {(priceChange / 10).toFixed(1)})
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Ownership</div>
            <div className="font-bold text-blue-400">
              {parseFloat(player.selected_by_percent || "0").toFixed(1)}%
              {ownershipChange !== 0 && (
                <span
                  className={`ml-1 text-xs ${
                    ownershipChange > 0 ? "text-blue-300" : "text-purple-300"
                  }`}
                >
                  ({ownershipChange > 0 ? "+" : ""}
                  {ownershipChange.toFixed(1)}%)
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Points</div>
            <div className="font-bold text-yellow-400">
              {points} ({livePoints} GW)
            </div>
          </div>
          <div>
            <div className="text-gray-400">Form</div>
            <div className="font-bold">
              {parseFloat(player.form || "0").toFixed(1)}
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="flex items-center gap-2 mb-2 text-xs">
          {priceTrend === "rising" && (
            <div className="flex items-center gap-1 text-green-400">
              <TrendingUp className="w-3 h-3" />
              <span>Price Rising</span>
            </div>
          )}
          {priceTrend === "falling" && (
            <div className="flex items-center gap-1 text-red-400">
              <TrendingDown className="w-3 h-3" />
              <span>Price Falling</span>
            </div>
          )}
          {ownershipTrend === "rising" && (
            <div className="flex items-center gap-1 text-blue-400">
              <Users className="w-3 h-3" />
              <span>Popular</span>
            </div>
          )}
        </div>

        {/* Injury/Availability Status */}
        {availabilityStatus !== "available" && (
          <div className="border-t border-white/20 pt-2">
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="w-3 h-3" />
              <span className="capitalize">{availabilityStatus}</span>
            </div>
            {player.news && (
              <div className="text-gray-300 text-xs mt-1 line-clamp-2">
                {player.news}
              </div>
            )}
          </div>
        )}

        {/* Enhanced metrics - captaincy appeal with elegant design */}
        <div className="border-t border-white/15 pt-3 mt-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></div>
              <span className="text-yellow-400 text-sm font-semibold">
                Captain Appeal
              </span>
            </div>
            <span className="text-yellow-300 text-sm font-bold bg-yellow-400/10 px-2 py-1 rounded-md">
              {Math.round(
                player.captaincy_appeal || player.total_points * 2 || 10
              )}
              %
            </span>
          </div>
          <div className="relative w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 h-2 rounded-full transition-all duration-700 ease-out shadow-sm"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    5,
                    player.captaincy_appeal || player.total_points * 2 || 10
                  )
                )}%`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full pointer-events-none"></div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative group">
      <motion.div
        ref={cardRef}
        whileHover={interactive ? { scale: 1.05 } : {}}
        whileTap={interactive ? { scale: 0.95 } : {}}
        className={`relative ${cardSize} mx-1 lg:mx-2 mb-2 ${
          theme === "dark" ? "bg-black/50" : "bg-white/50"
        } rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-2 ${
          isSelected
            ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
            : isCaptain
            ? "border-yellow-400 ring-2 ring-yellow-200 dark:ring-yellow-800"
            : isViceCaptain
            ? "border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800"
            : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
        } ${interactive ? "cursor-pointer" : ""} overflow-hidden`}
        onMouseEnter={() => {
          if (showTooltip) {
            setShowAdvancedTooltip(true);
            // Update position when tooltip shows
            if (cardRef.current) {
              const rect = cardRef.current.getBoundingClientRect();
              const screenWidth = window.innerWidth;
              const tooltipWidth = isMobile ? 280 : 320;

              if (rect.left + tooltipWidth / 2 > screenWidth - 20) {
                setTooltipPosition("left");
              } else if (rect.left - tooltipWidth / 2 < 20) {
                setTooltipPosition("right");
              } else {
                setTooltipPosition("center");
              }
            }
          }
        }}
        onMouseLeave={() => setShowAdvancedTooltip(false)}
      >
        {/* Player Kit/Jersey - Clean Team Colors Only */}
        <div
          className={`mx-auto mt-1 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 relative`}
        >
          {/* Kit icon based on position */}
          {(() => {
            const IconComponent = getKitIcon();
            return (
              <IconComponent
                className={`${
                  isOnPitch
                    ? compact
                      ? "w-10 h-10 lg:w-16 lg:h-20"
                      : "w-5 h-5 lg:h-10 lg:w-10" // Match !isOnPitch size - larger jerseys
                    : "w-5 h-5 lg:h-10 lg:w-10" // Match !isOnPitch size - larger jerseys
                } transition-colors duration-200`}
                style={
                  {
                    color: teamColors.primary,
                    "--pi-primary": teamColors.primary,
                    "--pi-secondary": teamColors.secondary || "#FFFFFF",
                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
                  } as React.CSSProperties
                }
              />
            );
          })()}

          {/* Live indicator for ongoing matches */}
          {player.is_playing && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
            />
          )}
        </div>

        {/* Player Name */}
        <div
          className={`${textSize} font-semibold text-center px-1 truncate mt-1 text-gray-800 dark:text-gray-100`}
          title={player.web_name}
        >
          {player.web_name}
        </div>

        {/* Points Display */}
        <div className={`${textSize} text-center font-bold mb-1`}>
          {livePoints > 0 ? (
            <span className="text-green-600 bg-green-100 dark:bg-green-900/30 px-1 py-0.5 rounded text-xs">
              {livePoints}pts
            </span>
          ) : (
            <span className="text-gray-600 dark:text-gray-400 text-xs">
              {points}pts
            </span>
          )}
        </div>

        {/* Enhanced Indicators */}
        {renderPriceIndicator()}
        {renderOwnershipIndicator()}
        {renderCaptainBadge()}
        {renderStatusBadge()}

        {/* Multiplier for captain */}
        {player.multiplier > 1 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0 left-0 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white"
          >
            {player.multiplier}x
          </motion.div>
        )}

        {/* Quick stats overlay for hover */}
        {isHovered && showStats && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-black/85 rounded-lg flex flex-col justify-center items-center text-white text-xs"
          >
            <div className="text-center space-y-1.5 p-1">
              <div>£{((player.now_cost || 0) / 10).toFixed(1)}m</div>
              <div>
                {parseFloat(player.selected_by_percent || "0").toFixed(1)}%
              </div>
              <div>Form: {parseFloat(player.form || "0").toFixed(1)}</div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Enhanced Tooltip Only */}
      <AnimatePresence>{renderAdvancedTooltip()}</AnimatePresence>
    </div>
  );
}
