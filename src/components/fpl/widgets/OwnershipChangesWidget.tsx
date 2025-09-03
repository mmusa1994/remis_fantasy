"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, TrendingDown, RefreshCw, Clock } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getTeamColors } from '@/lib/team-colors';
import type { OwnershipChangesWidgetData } from '@/types/fpl-enhanced';

// Widget-level cache interface
interface OwnershipCache {
  data: OwnershipChangesWidgetData;
  timestamp: number;
  timeframe: string;
  playerIds: string;
}

// Request deduplication map
const pendingOwnershipRequests = new Map<string, Promise<any>>();

interface OwnershipChangesWidgetProps {
  userTeamPlayerIds?: number[];
  refreshInterval?: number;
  maxItems?: number;
  timeframe?: '1h' | '24h' | 'week';
}

const OwnershipChangesWidget = React.memo<OwnershipChangesWidgetProps>(function OwnershipChangesWidget({
  userTeamPlayerIds = [],
  refreshInterval = 300000, // 5 minutes
  maxItems = 5,
  timeframe = '1h',
}: OwnershipChangesWidgetProps) {
  const { theme } = useTheme();
  const [data, setData] = useState<OwnershipChangesWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTimeframe, setCurrentTimeframe] = useState<'1h' | '24h' | 'week'>(timeframe);
  
  // Component-level cache
  const cacheRef = useRef<OwnershipCache | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Cache configuration
  const CACHE_TTL = 300000; // 5 minutes
  const MIN_REFRESH_INTERVAL = 180000; // 3 minutes minimum between requests

  /**
   * Generate cache key for request deduplication
   */
  const getCacheKey = useCallback((): string => {
    const playerIdsKey = userTeamPlayerIds.sort().join(',');
    return `ownership_changes_${currentTimeframe}_${playerIdsKey}`;
  }, [currentTimeframe, userTeamPlayerIds]);

  /**
   * Check if cached data is still fresh
   */
  const isCacheValid = useCallback((cache: OwnershipCache | null): boolean => {
    if (!cache) return false;
    
    const now = Date.now();
    const isDataFresh = (now - cache.timestamp) < CACHE_TTL;
    const isTimeframeSame = cache.timeframe === currentTimeframe;
    const isPlayerIdsSame = cache.playerIds === userTeamPlayerIds.sort().join(',');
    
    return isDataFresh && isTimeframeSame && isPlayerIdsSame;
  }, [currentTimeframe, userTeamPlayerIds, CACHE_TTL]);

  /**
   * Optimized fetch function with request deduplication and caching
   */
  const fetchOwnershipChanges = useCallback(async (forceRefresh: boolean = false) => {
    // Check cache first
    if (!forceRefresh && isCacheValid(cacheRef.current)) {
      setData(cacheRef.current!.data);
      setLastUpdate(new Date(cacheRef.current!.timestamp));
      setLoading(false);
      return;
    }

    // Prevent too frequent requests
    if (cacheRef.current && !forceRefresh) {
      const timeSinceLastFetch = Date.now() - cacheRef.current.timestamp;
      if (timeSinceLastFetch < MIN_REFRESH_INTERVAL) {
        console.log(`[OwnershipChangesWidget] Rate limited: ${Math.round((MIN_REFRESH_INTERVAL - timeSinceLastFetch) / 1000)}s remaining`);
        setLoading(false);
        return;
      }
    }

    const cacheKey = getCacheKey();
    
    // Check if request is already pending (request deduplication)
    if (pendingOwnershipRequests.has(cacheKey)) {
      try {
        const result = await pendingOwnershipRequests.get(cacheKey);
        handleSuccessfulResponse(result);
      } catch (err) {
        handleErrorResponse(err);
      }
      return;
    }

    try {
      setError(null);
      if (forceRefresh) {
        setLoading(true);
      }

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const params = new URLSearchParams({
        timeframe: currentTimeframe,
      });

      if (userTeamPlayerIds.length > 0) {
        params.append('playerIds', userTeamPlayerIds.join(','));
      }
      
      // Create and cache the request promise
      const requestPromise = fetch(`/api/fpl/ownership-analytics?${params}`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache',
        }
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      });
      
      pendingOwnershipRequests.set(cacheKey, requestPromise);
      
      const result = await requestPromise;
      handleSuccessfulResponse(result);
      
    } catch (err) {
      // Only handle error if request wasn't aborted
      if (err instanceof Error && err.name !== 'AbortError') {
        handleErrorResponse(err);
      }
    } finally {
      pendingOwnershipRequests.delete(cacheKey);
      setLoading(false);
    }
  }, [currentTimeframe, userTeamPlayerIds, isCacheValid, getCacheKey, maxItems, MIN_REFRESH_INTERVAL]);

  /**
   * Handle successful API response
   */
  const handleSuccessfulResponse = useCallback((result: any) => {
    if (result.success) {
      // Transform API data to widget format
      const widgetData: OwnershipChangesWidgetData = {
        risers: result.data.top_risers.slice(0, maxItems).map((player: any) => ({
          player_id: player.player_id,
          web_name: player.web_name,
          team_name: player.team_name,
          ownership: player.current_ownership,
          change: currentTimeframe === '1h' ? player.ownership_change_1h : player.ownership_change_24h,
          team_colors: getTeamColors(player.team_id || 1),
        })),
        fallers: result.data.top_fallers.slice(0, maxItems).map((player: any) => ({
          player_id: player.player_id,
          web_name: player.web_name,
          team_name: player.team_name,
          ownership: player.current_ownership,
          change: Math.abs(currentTimeframe === '1h' ? player.ownership_change_1h : player.ownership_change_24h),
          team_colors: getTeamColors(player.team_id || 1),
        })),
        timeframe: currentTimeframe,
      };
      
      // Update cache
      const now = Date.now();
      cacheRef.current = {
        data: widgetData,
        timestamp: now,
        timeframe: currentTimeframe,
        playerIds: userTeamPlayerIds.sort().join(','),
      };
      
      setData(widgetData);
      setLastUpdate(new Date(now));
    } else {
      throw new Error(result.error || 'API returned unsuccessful response');
    }
  }, [maxItems, currentTimeframe, userTeamPlayerIds]);

  /**
   * Handle API error response
   */
  const handleErrorResponse = useCallback((err: any) => {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
    console.error('[OwnershipChangesWidget] Fetch error:', errorMessage);
    setError(errorMessage);
  }, []);

  /**
   * Manual refresh function for user-triggered updates
   */
  const handleManualRefresh = useCallback(() => {
    fetchOwnershipChanges(true);
  }, [fetchOwnershipChanges]);

  // Auto-refresh effect with intelligent caching
  useEffect(() => {
    fetchOwnershipChanges();
    
    // Set up interval for automatic refresh
    const interval = setInterval(() => {
      fetchOwnershipChanges();
    }, Math.max(refreshInterval, MIN_REFRESH_INTERVAL));
    
    return () => {
      clearInterval(interval);
      // Cancel any pending request when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchOwnershipChanges, refreshInterval, MIN_REFRESH_INTERVAL]);

  // Cleanup on dependency change
  useEffect(() => {
    // Clear cache when dependencies change
    if (cacheRef.current && !isCacheValid(cacheRef.current)) {
      cacheRef.current = null;
      setData(null);
      setLoading(true);
      fetchOwnershipChanges();
    }
  }, [currentTimeframe, userTeamPlayerIds, fetchOwnershipChanges, isCacheValid]);

  const formatOwnership = (ownership: number) => {
    return `${ownership.toFixed(1)}%`;
  };

  const formatOwnershipChange = (change: number) => {
    const formatted = Math.abs(change).toFixed(1);
    return change > 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  const getTimeframeLabel = (tf: string) => {
    switch (tf) {
      case '1h': return '1h';
      case '24h': return '24h';
      case 'week': return '1w';
      default: return '1h';
    }
  };

  if (loading) {
    return (
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Users className="text-blue-500 w-5 h-5" />
            Ownership Changes
          </h3>
          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
        </div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Users className="text-blue-500 w-5 h-5" />
            Ownership Changes
          </h3>
          <button
            onClick={handleManualRefresh}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="text-red-500 text-sm text-center py-4">
          {error}
          <br />
          <button
            onClick={handleManualRefresh}
            className="text-blue-500 hover:text-blue-600 underline mt-2"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Try again'}
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2">
          <Users className="text-blue-500 w-5 h-5" />
          Ownership Changes
        </h3>
        <div className="flex items-center gap-2">
          {/* Timeframe Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-1">
            {(['1h', '24h', 'week'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setCurrentTimeframe(tf)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  currentTimeframe === tf
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {getTimeframeLabel(tf)}
              </button>
            ))}
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 ${
              loading ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
            title="Refresh ownership changes"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Risers */}
        {data.risers.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              Risers ({getTimeframeLabel(data.timeframe)})
            </h4>
            <div className="space-y-2">
              <AnimatePresence>
                {data.risers.map((player, index) => (
                  <motion.div
                    key={player.player_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: player.team_colors.primary }}
                      >
                        {player.web_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{player.web_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {player.team_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">
                        {formatOwnership(player.ownership)}
                      </div>
                      <div className="text-xs text-green-500">
                        {formatOwnershipChange(player.change)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Fallers */}
        {data.fallers.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1 text-red-600">
              <TrendingDown className="w-4 h-4" />
              Fallers ({getTimeframeLabel(data.timeframe)})
            </h4>
            <div className="space-y-2">
              <AnimatePresence>
                {data.fallers.map((player, index) => (
                  <motion.div
                    key={player.player_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: player.team_colors.primary }}
                      >
                        {player.web_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{player.web_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {player.team_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">
                        {formatOwnership(player.ownership)}
                      </div>
                      <div className="text-xs text-red-500">
                        -{formatOwnershipChange(player.change)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Last Update */}
        {lastUpdate && (
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            {cacheRef.current && isCacheValid(cacheRef.current) && (
              <span className="text-green-500" title="Data from cache">
                (cached)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default OwnershipChangesWidget;