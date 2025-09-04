"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle
} from 'lucide-react';
import { 
  FaTshirt, 
  FaRunning
} from 'react-icons/fa';
import { 
  GiGoalKeeper, 
  GiSoccerKick
} from 'react-icons/gi';
import { useTheme } from '@/contexts/ThemeContext';
import { getTeamColors } from '@/lib/team-colors';
import type { EnhancedPlayerData } from '@/types/fpl-enhanced';

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
  position?: 'GK' | 'DEF' | 'MID' | 'FWD';
  compact?: boolean;
}

// Function to get kit icon based on position
const getKitIcon = (position: 'GK' | 'DEF' | 'MID' | 'FWD' | undefined, elementType?: number) => {
  // Use position prop first, then fall back to element_type
  const pos = position || 
    (elementType === 1 ? 'GK' : 
     elementType === 2 ? 'DEF' : 
     elementType === 3 ? 'MID' : 
     elementType === 4 ? 'FWD' : 'MID');

  switch (pos) {
    case 'GK':
      return GiGoalKeeper;
    case 'DEF':
      return FaTshirt;
    case 'MID':
      return FaRunning;
    case 'FWD':
      return GiSoccerKick;
    default:
      return FaTshirt;
  }
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

  if (!player) return null;

  const teamColors = getTeamColors(player.team);
  const points = player.total_points || player.event_points || 0;
  const livePoints = player.live_stats?.total_points || player.points || 0;
  
  // Enhanced data (might not be available for all players)
  const priceChange = player.price_change_24h || player.cost_change_event || 0;
  const ownershipChange = player.ownership_change_24h || 0;
  const priceTrend = player.price_trend || (priceChange > 0 ? 'rising' : priceChange < 0 ? 'falling' : 'stable');
  const ownershipTrend = player.ownership_trend || (ownershipChange > 0 ? 'rising' : ownershipChange < 0 ? 'falling' : 'stable');
  
  // Player status and availability
  const availabilityStatus = player.availability_status || 
    (player.status === 'a' ? 'available' : 
     player.status === 'd' ? 'doubtful' : 
     player.status === 'i' ? 'injured' : 
     player.status === 's' ? 'suspended' : 'available');

  const cardSize = isOnPitch 
    ? (compact ? "w-16 h-18" : "w-18 lg:w-20 h-20 lg:h-24")
    : (compact ? "w-16 h-20" : "w-18 lg:w-20 h-22 lg:h-26");

  const kitSize = isOnPitch 
    ? (compact ? "w-10 h-10" : "w-12 lg:w-14 h-12 lg:h-14")
    : (compact ? "w-10 h-10" : "w-12 lg:w-14 h-12 lg:h-14");

  const textSize = isOnPitch 
    ? (compact ? "text-xs" : "text-sm lg:text-base")
    : (compact ? "text-sm" : "text-base lg:text-lg");

  // Status indicator colors
  const getStatusColor = () => {
    switch (availabilityStatus) {
      case 'injured': return 'bg-red-500';
      case 'doubtful': return 'bg-yellow-500';
      case 'suspended': return 'bg-orange-500';
      default: return null;
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
          priceChange > 0 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}
      >
        {priceChange > 0 ? '↗' : '↘'}
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
        className={`absolute -bottom-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center text-xs ${
          ownershipChange > 0 
            ? 'bg-blue-500 text-white' 
            : 'bg-purple-500 text-white'
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
        className={`absolute -top-1 -right-1 ${
          isOnPitch ? "w-5 h-5 lg:w-6 lg:h-6" : "w-4 h-4"
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
        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${statusColor}`}
      />
    );
  };

  // Advanced tooltip
  const renderAdvancedTooltip = () => {
    if (!showTooltip || !showAdvancedTooltip) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-black/95 text-white text-xs rounded-lg shadow-xl backdrop-blur-sm z-50 min-w-64"
      >
        {/* Player Info Header */}
        <div className="border-b border-white/20 pb-2 mb-2">
          <div className="font-bold text-sm">
            {player.first_name} {player.second_name}
          </div>
          <div className="text-gray-300 flex items-center gap-2">
            <span>{teamColors.name}</span>
            <span>•</span>
            <span>{position || 'Unknown'}</span>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div>
            <div className="text-gray-400">Price</div>
            <div className="font-bold text-green-400">
              £{((player.now_cost || 0) / 10).toFixed(1)}m
              {priceChange !== 0 && (
                <span className={`ml-1 text-xs ${priceChange > 0 ? 'text-green-300' : 'text-red-300'}`}>
                  ({priceChange > 0 ? '+' : ''}{(priceChange / 10).toFixed(1)})
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Ownership</div>
            <div className="font-bold text-blue-400">
              {parseFloat(player.selected_by_percent || '0').toFixed(1)}%
              {ownershipChange !== 0 && (
                <span className={`ml-1 text-xs ${ownershipChange > 0 ? 'text-blue-300' : 'text-purple-300'}`}>
                  ({ownershipChange > 0 ? '+' : ''}{ownershipChange.toFixed(1)}%)
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
              {parseFloat(player.form || '0').toFixed(1)}
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="flex items-center gap-2 mb-2 text-xs">
          {priceTrend === 'rising' && (
            <div className="flex items-center gap-1 text-green-400">
              <TrendingUp className="w-3 h-3" />
              <span>Price Rising</span>
            </div>
          )}
          {priceTrend === 'falling' && (
            <div className="flex items-center gap-1 text-red-400">
              <TrendingDown className="w-3 h-3" />
              <span>Price Falling</span>
            </div>
          )}
          {ownershipTrend === 'rising' && (
            <div className="flex items-center gap-1 text-blue-400">
              <Users className="w-3 h-3" />
              <span>Popular</span>
            </div>
          )}
        </div>

        {/* Injury/Availability Status */}
        {availabilityStatus !== 'available' && (
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

        {/* Enhanced metrics - always show captaincy appeal */}
        <div className="border-t border-white/20 pt-2 mt-2">
          <div className="text-gray-400 text-xs mb-1">Captaincy Appeal</div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(100, Math.max(0, player.captaincy_appeal || (player.total_points * 2) || 10))}%` }}
            />
          </div>
          <div className="text-xs text-yellow-400 mt-1">
            {Math.round(player.captaincy_appeal || (player.total_points * 2) || 10)}%
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative group">
      <motion.div
        whileHover={interactive ? { scale: 1.05 } : {}}
        whileTap={interactive ? { scale: 0.95 } : {}}
        className={`relative ${cardSize} mx-1 lg:mx-2 mb-2 ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        } rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-2 ${
          isSelected
            ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
            : isCaptain
            ? "border-yellow-400 ring-2 ring-yellow-200 dark:ring-yellow-800"
            : isViceCaptain
            ? "border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800"
            : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
        } ${interactive ? 'cursor-pointer' : ''} overflow-hidden`}
        onMouseEnter={() => showTooltip && setShowAdvancedTooltip(true)}
        onMouseLeave={() => setShowAdvancedTooltip(false)}
      >
        {/* Player Kit/Jersey */}
        <div
          className={`${kitSize} mx-auto mt-1 rounded-full flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 relative`}
          style={{
            backgroundColor: teamColors.primary,
            border: `2px solid ${teamColors.secondary}`,
          }}
        >
          {/* Kit icon based on position */}
          {(() => {
            const IconComponent = getKitIcon(position, player.element_type);
            return (
              <IconComponent
                className={`${isOnPitch ? (compact ? "w-4 h-4" : "w-5 h-5 lg:w-6 lg:h-6") : "w-3 h-3"} opacity-90`}
                style={{ color: teamColors.secondary }}
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
        <div className={`${textSize} font-medium text-center px-1 truncate mt-1`}>
          {player.web_name}
        </div>

        {/* Points Display */}
        <div className={`${textSize} text-center font-bold`}>
          {livePoints > 0 ? (
            <span className="text-green-600">{livePoints}pts</span>
          ) : (
            <span className="text-gray-500">{points}pts</span>
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
            className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white"
          >
            {player.multiplier}x
          </motion.div>
        )}

        {/* Quick stats overlay for hover */}
        {isHovered && showStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 rounded-lg flex flex-col justify-center items-center text-white text-xs"
          >
            <div className="text-center space-y-1">
              <div>£{((player.now_cost || 0) / 10).toFixed(1)}m</div>
              <div>{parseFloat(player.selected_by_percent || '0').toFixed(1)}%</div>
              <div>Form: {parseFloat(player.form || '0').toFixed(1)}</div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Enhanced Tooltip Only */}
      <AnimatePresence>
        {renderAdvancedTooltip()}
      </AnimatePresence>
    </div>
  );
}