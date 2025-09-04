"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

import { useTheme } from "@/contexts/ThemeContext";
import { FaShare, FaExpand, FaList, FaExchangeAlt } from "react-icons/fa";
import { BiFootball } from "react-icons/bi";
import {
  Target,
  BarChart3,
  Maximize2,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";
import LoadingCard from "@/components/shared/LoadingCard";
import ManagerIdModal from "@/components/modals/ManagerIdModal";
import { getTeamColors } from "@/lib/team-colors";
import { ErrorType, ValidationStatus } from "@/types/validation";

// Enhanced Components
import EnhancedPitchView from "./EnhancedPitchView";
import AdvancedFilterPanel from "./AdvancedFilterPanel";
import PriceChangesWidget from "./widgets/PriceChangesWidget";
import OwnershipChangesWidget from "./widgets/OwnershipChangesWidget";
import TransferTrendsWidget from "./widgets/TransferTrendsWidget";
import ChipStrategiesWidget from "./widgets/ChipStrategiesWidget";

// Enhanced Types
import type {
  EnhancedFilterState,
  EnhancedPlayerData,
  EnhancedUIState,
  TransferPlanningState,
} from "@/types/fpl-enhanced";

interface FantasyPlannerProps {
  managerId: string | null;
}

interface PlayerData {
  id: number;
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  team_code: number;
  element_type: number;
  now_cost: number;
  total_points: number;
  selected_by_percent: string;
  form: string;
  event_points: number;
  points_per_game: string;
  value_form: string;
  value_season: string;
  cost_change_event: number;
  cost_change_start: number;
  transfers_in: number;
  transfers_out: number;
  transfers_in_event: number;
  transfers_out_event: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  saves: number;
  yellow_cards: number;
  red_cards: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  chance_of_playing_this_round: number | null;
  chance_of_playing_next_round: number | null;
  news: string;
  photo: string;
  status: "a" | "d" | "i" | "n" | "s" | "u";
}

interface TeamData {
  id: number;
  name: string;
  short_name: string;
  code: number;
  strength: number;
  position: number;
  played: number;
  win: number;
  draw: number;
  loss: number;
  points: number;
  form: string | null;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
}

interface FixtureData {
  id: number;
  event: number;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  kickoff_time: string;
  finished: boolean;
  started: boolean;
  team_h_score?: number;
  team_a_score?: number;
}

type ViewMode = "pitch" | "list" | "analytics";

interface UserTeamData {
  manager?: any;
  team_with_stats: any[];
  team_totals: any;
  fixtures: any[];
  captain: any;
  vice_captain: any;
  active_chip?: string | null;
  entry_history?: {
    value: number;
    bank: number;
    points: number;
    total_points: number;
    event_transfers: number;
    event_transfers_cost: number;
    points_on_bench: number;
  };
}

export default function FantasyPlanner({ managerId }: FantasyPlannerProps) {
  const { theme } = useTheme();
  const [currentGameweek, setCurrentGameweek] = useState(4);
  const [currentView, setCurrentView] = useState<ViewMode>("pitch");
  const [userTeamData, setUserTeamData] = useState<UserTeamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [allPlayers, setAllPlayers] = useState<EnhancedPlayerData[]>([]);
  const [allTeams, setAllTeams] = useState<TeamData[]>([]);
  const [allFixtures, setAllFixtures] = useState<FixtureData[]>([]);
  const [showManagerIdModal, setShowManagerIdModal] = useState(false);
  const [currentManagerId, setCurrentManagerId] = useState<string | null>(
    managerId
  );
  const [managerIdLoading, setManagerIdLoading] = useState(false);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>({
    isValidating: false,
    isRetrying: false,
    retryCount: 0,
    errorDetails: null,
    showRetryOption: false,
    showFallbackOption: false,
  });
  const [managerIdVerified, setManagerIdVerified] = useState<boolean | null>(
    null
  );
  const [verificationWarning, setVerificationWarning] = useState<string | null>(
    null
  );

  // Enhanced state for filtering and transfer planning
  const [filters, setFilters] = useState<EnhancedFilterState>({
    position: [],
    teams: [],
    priceRange: [40, 150], // £4.0m to £15.0m in tenths
    formRating: 0,
    availability: ["a"], // Available players by default
    sortBy: "total_points",
    sortOrder: "desc",
    search: "",
    priceChangePeriod: "24h",
    ownershipChangePeriod: "24h",
    transferMomentum: [],
    nextFixtureDifficulty: [],
    fixtureCount: 3,
    fixtureHorizon: 5,
    rotationRisk: [],
    injuryStatus: ["available"],
    searchMode: "basic",
    includeInjured: false,
    includeSuspended: false,
    ownershipTrend: [],
  });

  const [transferPlanningState] = useState<TransferPlanningState>({
    saved_plans: [],
    planning_horizon: 5,
    transfer_budget: {
      free_transfers: 1,
      points_budget: 8,
    },
  });

  // Enhanced UI State
  const [uiState, setUIState] = useState<EnhancedUIState>({
    currentView: "pitch",
    sidebarCollapsed: false,
    activeWidget: "none",
    compareMode: false,
    comparedPlayers: [],
    filtersVisible: false,
    transferPanelOpen: false,
    touchMode: false,
    swipeEnabled: true,
    compactView: false,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showTransferPanel, setShowTransferPanel] = useState(false);
  const [, setSelectedPlayer] = useState<EnhancedPlayerData | null>(null);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [formation, setFormation] = useState("3-4-3");
  const handleFormationChange = useCallback((newFormation: string) => {
    setFormation(newFormation);
  }, []);

  // Enhanced player data processing
  const processEnhancedPlayerData = useCallback(
    (players: any[]): EnhancedPlayerData[] => {
      return players.map((player) => ({
        ...player,
        // Mock enhanced data - in real implementation this would come from APIs
        price_trend:
          player.cost_change_event > 0
            ? "rising"
            : player.cost_change_event < 0
            ? "falling"
            : "stable",
        ownership_trend:
          player.transfers_in_event > player.transfers_out_event
            ? "rising"
            : player.transfers_in_event < player.transfers_out_event
            ? "falling"
            : "stable",
        availability_status:
          player.status === "a"
            ? "available"
            : player.status === "d"
            ? "doubtful"
            : player.status === "i"
            ? "injured"
            : player.status === "s"
            ? "suspended"
            : "available",
        transfer_momentum:
          player.transfers_in_event + player.transfers_out_event > 50000
            ? "high_in"
            : "stable",
        rotation_risk:
          Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low",
        captaincy_appeal: Math.min(
          100,
          player.total_points / 2 + parseFloat(player.form) * 8
        ),
        differential_score:
          player.total_points > 0 && parseFloat(player.selected_by_percent) < 10
            ? (player.total_points /
                Math.max(1, parseFloat(player.selected_by_percent))) *
              2
            : 0,
      }));
    },
    []
  );

  // Fetch fixtures data with caching and rate limiting
  const fixturesCacheRef = useRef<{ gameweek: number; data: any[]; timestamp: number } | null>(null);
  const fetchFixtures = useCallback(async (gameweek: number = currentGameweek, forceRefresh: boolean = false) => {
    // Check cache first (5 minute cache)
    if (!forceRefresh && fixturesCacheRef.current) {
      const { gameweek: cachedGW, data, timestamp } = fixturesCacheRef.current;
      const isStale = Date.now() - timestamp > 300000; // 5 minutes
      if (cachedGW === gameweek && !isStale) {
        console.log(`📦 Using cached fixtures for GW${gameweek}`);
        setAllFixtures(data);
        return;
      }
    }

    try {
      console.log(`🏟️ Fetching fixtures for GW${gameweek}`);
      const response = await fetch(`/api/fpl/fixtures?event=${gameweek}`);
              
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const fixtures = result.data || [];
          setAllFixtures(fixtures);
          
          // Cache the result
          fixturesCacheRef.current = {
            gameweek,
            data: fixtures,
            timestamp: Date.now()
          };
                  
          // Handle fallback gameweek notification
          if (result.fallback) {
            console.log("ℹ️ Showing fixtures for Gameweek", result.gameweek, "as fallback for", gameweek);
          }
          return; // Successfully fetched data
        }
      }
      
      // Handle 404 or other errors - immediately try fallback
      if (gameweek > 3) {
        console.log(`⬇️ GW${gameweek} fixtures failed, immediately trying GW${gameweek - 1}`);
        return fetchFixtures(gameweek - 1, forceRefresh);
      } else {
        console.warn(`❌ No fixture data available for GW${gameweek} or earlier`);
        setAllFixtures([]);
      }
    } catch (error) {
      console.error("Failed to fetch fixtures:", error);
      // Try fallback on any error if possible
      if (gameweek > 3) {
        console.log(`🔄 Error occurred, trying fallback GW${gameweek - 1}`);
        return fetchFixtures(gameweek - 1, forceRefresh);
      } else {
        setAllFixtures([]);
      }
    }
  }, []); // Remove currentGameweek from dependencies

  // Enhanced bootstrap data fetching
  const fetchBootstrapData = useCallback(async () => {
    try {
      setBootstrapLoading(true);
      const response = await fetch("/api/fpl/bootstrap-static");

      if (!response.ok) {
        throw new Error("Failed to fetch bootstrap data");
      }

      const result = await response.json();
      if (result.success) {
        // Process players with enhanced data
        const enhancedPlayers = processEnhancedPlayerData(
          result.data.elements || []
        );
        setAllPlayers(enhancedPlayers);
        setAllTeams(result.data.teams || []);

        // Set current gameweek from events
        const currentEvent = result.data.events?.find(
          (event: any) => event.is_current
        );
        if (currentEvent) {
          setCurrentGameweek(currentEvent.id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch bootstrap data:", error);
    } finally {
      setBootstrapLoading(false);
    }
  }, []); // Remove processEnhancedPlayerData dependency to prevent loops

  // Team data cache and rate limiting
  const teamDataCacheRef = useRef<{ managerId: string; gameweek: number; data: any; timestamp: number } | null>(null);
  const teamDataRequestRef = useRef<string | null>(null);
  
  const fetchTeamData = useCallback(
    async (id: string, gameweek?: number, forceRefresh: boolean = false) => {
      const targetGameweek = gameweek || currentGameweek;
      const requestKey = `${id}-${targetGameweek}`;
      
      // Prevent duplicate requests
      if (teamDataRequestRef.current === requestKey && !forceRefresh) {
        console.log(`⏳ Team data request already in progress for ${requestKey}`);
        return;
      }
      
      // Check cache first (5 minute cache)
      if (!forceRefresh && teamDataCacheRef.current) {
        const { managerId, gameweek: cachedGW, data, timestamp } = teamDataCacheRef.current;
        const isStale = Date.now() - timestamp > 300000; // 5 minutes
        if (managerId === id && cachedGW === targetGameweek && !isStale) {
          console.log(`📦 Using cached team data for Manager ${id}, GW${targetGameweek}`);
          setUserTeamData(data);
          return;
        }
      }

      console.log(`👤 Fetching team data for Manager ID: ${id}, Gameweek: ${targetGameweek}`);
      setLoading(true);
      teamDataRequestRef.current = requestKey;

      try {
        const response = await fetch("/api/fpl/load-team", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            managerId: id,
            gameweek: targetGameweek,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ API Response Error: ${response.status} ${response.statusText}`);
          console.error("❌ Error details:", errorText);

          // Immediately try fallback for any error if possible
          if (targetGameweek > 3) {
            console.log(`⬇️ GW${targetGameweek} failed, immediately trying GW${targetGameweek - 1}`);
            teamDataRequestRef.current = null; // Clear request lock
            return await fetchTeamData(id, targetGameweek - 1, forceRefresh);
          }

          throw new Error(`Failed to fetch team data: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        if (data.success && data.data) {
          setUserTeamData(data.data);
          
          // Cache the result
          teamDataCacheRef.current = {
            managerId: id,
            gameweek: targetGameweek,
            data: data.data,
            timestamp: Date.now()
          };

          // Get bootstrap data from API response if available
          if (data.data.team_with_stats) {
            const playersFromResponse = data.data.team_with_stats
              .map((teamPlayer: any) => teamPlayer.player)
              .filter(Boolean);

            if (playersFromResponse.length > 0) {
              setAllPlayers((prev) => prev.length === 0 ? playersFromResponse : prev);
            }
          }
        }
      } catch (error) {
        console.error("❌ Error fetching team data:", error);
        
        // Try fallback on any error if possible
        if (targetGameweek > 3) {
          console.log(`🔄 Error occurred, trying fallback GW${targetGameweek - 1}`);
          teamDataRequestRef.current = null; // Clear request lock
          return await fetchTeamData(id, targetGameweek - 1, forceRefresh);
        }
      } finally {
        setLoading(false);
        teamDataRequestRef.current = null; // Clear request lock
      }
    },
    [] // Remove currentGameweek from dependencies
  );

  // Save manager ID with enhanced error handling
  const saveManagerId = async (
    newManagerId: string,
    allowUnverified = false
  ) => {
    try {
      setManagerIdLoading(true);
      setValidationStatus({
        isValidating: true,
        isRetrying: false,
        retryCount: 0,
        errorDetails: null,
        showRetryOption: false,
        showFallbackOption: false,
      });

      const response = await fetch("/api/user/manager-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          managerId: newManagerId,
          allowUnverified,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - either verified or unverified but saved
        setCurrentManagerId(newManagerId);
        setManagerIdVerified(data.isVerified || false);
        setVerificationWarning(data.warningMessage || null);
        setShowManagerIdModal(false);
        setValidationStatus({
          isValidating: false,
          isRetrying: false,
          retryCount: 0,
          errorDetails: null,
          showRetryOption: false,
          showFallbackOption: false,
        });

        // Fetch team data
        fetchTeamData(newManagerId, currentGameweek);

        // Show success message
        if (data.isVerified) {
          // Could add toast notification here
          console.log("Manager ID verified and saved successfully");
        } else {
          // Could add toast notification here
          console.log("Manager ID saved (unverified):", data.warningMessage);
        }
      } else if (response.status === 202) {
        // Requires confirmation for unverified save
        setValidationStatus({
          isValidating: false,
          isRetrying: false,
          retryCount: 0,
          errorDetails: {
            type: data.errorType || ErrorType.UNKNOWN,
            message: data.error,
            userMessage: data.error,
            canRetry: data.canRetry || false,
            fallbackAvailable: data.fallbackAvailable || false,
            actionText: "Save Anyway",
          },
          showRetryOption: data.canRetry || false,
          showFallbackOption: data.fallbackAvailable || false,
        });
      } else {
        // Handle different error types
        const errorType = data.errorType || ErrorType.UNKNOWN;

        setValidationStatus({
          isValidating: false,
          isRetrying: false,
          retryCount: 0,
          errorDetails: {
            type: errorType,
            message: data.error || "Failed to save manager ID",
            userMessage: data.error || "Failed to save manager ID",
            canRetry: data.canRetry || false,
            fallbackAvailable: data.fallbackAvailable || false,
            actionText: data.canRetry
              ? "Retry"
              : data.fallbackAvailable
              ? "Save Anyway"
              : "Try Again",
          },
          showRetryOption: data.canRetry || false,
          showFallbackOption: data.fallbackAvailable || false,
        });
      }
    } catch (error) {
      console.error("Failed to save manager ID:", error);

      setValidationStatus({
        isValidating: false,
        isRetrying: false,
        retryCount: 0,
        errorDetails: {
          type: ErrorType.NETWORK_ERROR,
          message: (error as Error).message,
          userMessage:
            "Network error. Please check your connection and try again.",
          canRetry: true,
          fallbackAvailable: true,
          actionText: "Retry",
        },
        showRetryOption: true,
        showFallbackOption: true,
      });
    } finally {
      setManagerIdLoading(false);
    }
  };

  // Retry saving manager ID
  const retryManagerIdSave = (managerId: string) => {
    saveManagerId(managerId, false);
  };

  // Save manager ID as unverified (fallback)
  const saveUnverifiedManagerId = (managerId: string) => {
    saveManagerId(managerId, true);
  };

  // Initialize data on component mount (no function dependency)
  useEffect(() => {
    fetchBootstrapData();
  }, []); // Run only on mount

  // Fetch fixtures when gameweek changes (no function dependency)
  useEffect(() => {
    if (currentGameweek) {
      fetchFixtures(currentGameweek);
    }
  }, [currentGameweek]);

  // Check if we need to show manager ID modal or fetch data (no function dependency)
  useEffect(() => {
    if (!currentManagerId) {
      setShowManagerIdModal(true);
    } else {
      fetchTeamData(currentManagerId, currentGameweek);
    }
  }, [currentManagerId, currentGameweek]);

  // Update currentManagerId when prop changes
  useEffect(() => {
    setCurrentManagerId(managerId);
  }, [managerId]);

  // Filtered and sorted players for list view
  const filteredPlayers = useMemo(() => {
    const filtered = allPlayers.filter((player) => {
      // Position filter
      if (
        filters.position.length > 0 &&
        !filters.position.includes(player.element_type)
      ) {
        return false;
      }

      // Team filter
      if (filters.teams.length > 0 && !filters.teams.includes(player.team)) {
        return false;
      }

      // Price range filter
      if (
        player.now_cost < filters.priceRange[0] ||
        player.now_cost > filters.priceRange[1]
      ) {
        return false;
      }

      // Form rating filter
      if (
        filters.formRating > 0 &&
        parseFloat(player.form) < filters.formRating
      ) {
        return false;
      }

      // Availability filter
      if (
        filters.availability.length > 0 &&
        !filters.availability.includes(player.status)
      ) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const fullName =
          `${player.first_name} ${player.second_name}`.toLowerCase();
        const webName = player.web_name.toLowerCase();
        const teamName =
          allTeams
            .find((t) => t.id === player.team)
            ?.short_name.toLowerCase() || "";

        if (
          !fullName.includes(searchTerm) &&
          !webName.includes(searchTerm) &&
          !teamName.includes(searchTerm)
        ) {
          return false;
        }
      }

      return true;
    });

    // Sort players
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof PlayerData];
      let bValue: any = b[filters.sortBy as keyof PlayerData];

      // Handle numeric values
      if (typeof aValue === "string" && !isNaN(parseFloat(aValue))) {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (filters.sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [allPlayers, allTeams, filters]);

  const getPlayerById = useCallback(
    (id: number) => {
      return allPlayers.find((p) => p.id === id);
    },
    [allPlayers]
  );

  const getTeamById = useCallback(
    (id: number) => {
      return allTeams.find((t) => t.id === id);
    },
    [allTeams]
  );

  const getTeamColor = useCallback((teamId: number) => {
    return getTeamColors(teamId);
  }, []);

  const getPlayerPosition = useCallback((elementType: number) => {
    const positions = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };
    return positions[elementType as keyof typeof positions] || "Unknown";
  }, []);

  const getPositionName = useCallback((elementType: number) => {
    const positions = {
      1: "Goalkeeper",
      2: "Defender",
      3: "Midfielder",
      4: "Forward",
    };
    return positions[elementType as keyof typeof positions] || "Unknown";
  }, []);

  const getStartingLineup = useCallback(() => {
    if (!userTeamData?.team_with_stats) return [];
    return userTeamData.team_with_stats
      .filter((player) => player.position <= 11)
      .sort((a, b) => a.position - b.position);
  }, [userTeamData]);

  const getBench = useCallback(() => {
    if (!userTeamData?.team_with_stats) return [];
    return userTeamData.team_with_stats
      .filter((player) => player.position > 11)
      .sort((a, b) => a.position - b.position);
  }, [userTeamData]);

  // Enhanced player rendering function
  const renderEnhancedPlayer = useCallback(
    (teamPlayer: any, isOnPitch = true, position = "PLAYER") => {
      if (!teamPlayer) return null;

      const player = getPlayerById(teamPlayer.player_id);
      if (!player) return null;

      const isCaptain = teamPlayer.is_captain;
      const isViceCaptain = teamPlayer.is_vice_captain;
      const teamColor = getTeamColor(player.team);
      const points = teamPlayer.live_stats?.total_points || 0;

      return (
        <motion.div
          key={teamPlayer.player_id}
          className="relative group cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            className={`relative ${
              isOnPitch ? "w-14 lg:w-16 h-16 lg:h-20" : "w-12 h-14"
            } mx-1 lg:mx-2 mb-2 ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            } rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-2 ${
              isCaptain
                ? "border-yellow-400 ring-2 ring-yellow-200"
                : isViceCaptain
                ? "border-blue-400 ring-2 ring-blue-200"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            {/* Player Kit/Jersey */}
            <div
              className={`${
                isOnPitch ? "w-10 lg:w-12 h-10 lg:h-12" : "w-8 h-8"
              } mx-auto mt-1 rounded-full flex items-center justify-center shadow-inner transition-transform group-hover:scale-110`}
              style={{
                backgroundColor: teamColor.primary,
                border: `2px solid ${teamColor.secondary}`,
              }}
            >
              <BiFootball
                className={`${
                  isOnPitch ? "text-xs lg:text-sm" : "text-xs"
                } opacity-80`}
                style={{ color: teamColor.secondary }}
              />
            </div>

            {/* Captain/Vice-Captain Badge */}
            {(isCaptain || isViceCaptain) && (
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
            )}

            {/* Player Name */}
            <div
              className={`${
                isOnPitch ? "text-xs lg:text-sm" : "text-xs"
              } font-medium text-center px-1 truncate mt-1`}
            >
              {player.web_name}
            </div>

            {/* Points */}
            <div
              className={`${
                isOnPitch ? "text-xs" : "text-xs"
              } text-center font-bold`}
            >
              <span className="text-green-600">{points}pts</span>
            </div>
          </div>

          {/* Enhanced Hover tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 backdrop-blur-sm">
            <div className="text-center space-y-1">
              <div className="font-bold">
                {player.first_name} {player.second_name}
              </div>
              <div className="text-gray-300">
                {getTeamColor(player.team).name} -{" "}
                {getPlayerPosition(player.element_type)}
              </div>
              <div className="text-green-400">
                £{(player.now_cost / 10).toFixed(1)}m | {points} pts
              </div>
              <div className="text-blue-400">
                Form: {player.form} | {player.selected_by_percent}% owned
              </div>
            </div>
          </div>
        </motion.div>
      );
    },
    [getPlayerById, getTeamColor, getPlayerPosition, theme]
  );

  const renderPlayer = (teamPlayer: any, isOnPitch = true) => {
    if (!teamPlayer) return null;

    const player = getPlayerById(teamPlayer.player_id);
    if (!player) return null;

    const isCaptain = teamPlayer.is_captain;
    const isViceCaptain = teamPlayer.is_vice_captain;
    const teamColor = getTeamColor(player.team);
    const points = teamPlayer.live_stats?.total_points || 0;

    return (
      <div key={teamPlayer.player_id} className="relative group cursor-pointer">
        <div
          className={`relative ${
            isOnPitch ? "w-16 h-20" : "w-12 h-16"
          } mx-2 mb-2 ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          } rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-2 ${
            isCaptain
              ? "border-yellow-400"
              : isViceCaptain
              ? "border-blue-400"
              : "border-gray-300"
          }`}
        >
          {/* Player Kit/Jersey */}
          <div
            className={`${
              isOnPitch ? "w-12 h-12" : "w-8 h-8"
            } mx-auto mt-1 rounded-full flex items-center justify-center shadow-inner`}
            style={{
              backgroundColor: teamColor.primary,
              border: `2px solid ${teamColor.secondary}`,
            }}
          >
            <BiFootball
              className={`${isOnPitch ? "text-xs" : "text-xs"} opacity-80`}
              style={{ color: teamColor.secondary }}
            />
          </div>

          {/* Captain/Vice-Captain Badge */}
          {(isCaptain || isViceCaptain) && (
            <div
              className={`absolute -top-1 -right-1 ${
                isOnPitch ? "w-5 h-5" : "w-4 h-4"
              } rounded-full flex items-center justify-center text-xs font-bold text-white ${
                isCaptain ? "bg-yellow-500" : "bg-blue-500"
              }`}
            >
              {isCaptain ? "C" : "V"}
            </div>
          )}

          {/* Multiplier for captain */}
          {teamPlayer.multiplier > 1 && (
            <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white">
              {teamPlayer.multiplier}x
            </div>
          )}

          {/* Player Name */}
          <div
            className={`${
              isOnPitch ? "text-xs" : "text-xs"
            } font-medium text-center px-1 truncate`}
          >
            {player.web_name}
          </div>

          {/* Points */}
          <div
            className={`${
              isOnPitch ? "text-xs" : "text-xs"
            } text-center font-bold`}
          >
            <span className="text-green-600">{points}pts</span>
          </div>
        </div>

        {/* Hover tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
          <div className="text-center">
            <div className="font-bold">
              {player.first_name} {player.second_name}
            </div>
            <div>
              {getTeamColor(player.team).name} -{" "}
              {getPlayerPosition(player.element_type)}
            </div>
            <div>
              £{(player.now_cost / 10).toFixed(1)}m | {points} pts
            </div>
            <div>
              Form: {player.form} | {player.selected_by_percent}% ownership
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen p-4 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Loading State */}
      {(loading || bootstrapLoading) && (
        <div className="flex items-center justify-center min-h-96">
          <LoadingCard
            title="Loading Team Data"
            description="Fetching your FPL team information and player statistics..."
            className="max-w-md"
          />
        </div>
      )}

      {/* Team Data Display */}
      {!loading && !bootstrapLoading && currentManagerId && userTeamData && (
        <>
          {/* Enhanced Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            } rounded-lg p-6 mb-6 shadow-lg border border-gray-200 dark:border-gray-700`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">
                  {userTeamData.manager?.player_first_name}{" "}
                  {userTeamData.manager?.player_last_name}
                </h1>
                <p className="text-lg font-medium text-purple-600">
                  {userTeamData.manager?.name}
                  {managerIdVerified === false && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                      Unverified
                    </span>
                  )}
                </p>
                <p className="text-gray-500">
                  Plan future transfers, chips, subs etc.
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  } cursor-pointer hover:text-blue-500"`}
                  onClick={() => setShowManagerIdModal(true)}
                >
                  ID {currentManagerId} - Click to change
                  {managerIdVerified === false && (
                    <span className="block text-xs text-yellow-600 dark:text-yellow-400">
                      (Unverified - click to retry)
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  Overall Rank: #
                  {userTeamData.manager?.summary_overall_rank?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Verification Warning */}
            {verificationWarning && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <span className="font-medium">Verification Notice:</span>{" "}
                      {verificationWarning}
                    </p>
                    <button
                      onClick={() => setShowManagerIdModal(true)}
                      className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 underline"
                    >
                      Click here to retry verification
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Team Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-500">Gameweek</p>
                <p className="font-bold text-lg">{currentGameweek}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                <p className="text-sm text-gray-500">GW Points</p>
                <p className="font-bold text-lg text-green-600">
                  {userTeamData.team_totals?.total_points_final || 0}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
                <p className="text-sm text-gray-500">Total Points</p>
                <p className="font-bold text-lg">
                  {userTeamData.manager?.summary_overall_points?.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
                <p className="text-sm text-gray-500">Team Value</p>
                <p className="font-bold text-lg">
                  £{((userTeamData.entry_history?.value || 1000) / 10).toFixed(1)}m
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-3">
                <p className="text-sm text-gray-500">Bank</p>
                <p className="font-bold text-lg">
                  £{((userTeamData.entry_history?.bank || 0) / 10).toFixed(1)}m
                </p>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Main Content Layout */}
          <div className="flex flex-col xl:flex-row gap-4 lg:gap-6">
            {/* Main Pitch/List/Analytics Area */}
            <motion.div
              className="flex-1 xl:flex-[2] order-2 xl:order-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div
                className={`${
                  theme === "dark" ? "bg-gray-800" : "bg-white"
                } rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700`}
              >
                {/* Enhanced View Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 lg:p-4 border-b border-gray-200 dark:border-gray-700 space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    {/* View Toggle */}
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setCurrentView("pitch");
                          setUIState((prev) => ({
                            ...prev,
                            currentView: "pitch",
                          }));
                        }}
                        className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md transition-all duration-200 flex-1 sm:flex-none text-sm ${
                          currentView === "pitch"
                            ? "bg-green-600 text-white shadow-sm"
                            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <Target className="w-4 h-4" />
                        <span className="text-xs sm:text-sm">Pitch</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentView("analytics");
                          setUIState((prev) => ({
                            ...prev,
                            currentView: "analytics",
                          }));
                        }}
                        className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md transition-all duration-200 flex-1 sm:flex-none text-sm ${
                          currentView === "analytics"
                            ? "bg-green-600 text-white shadow-sm"
                            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-xs sm:text-sm">Analytics</span>
                      </button>
                    </div>

                  </div>

                  {/* Action Buttons - Mobile optimized */}
                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => setShowTransferPanel(!showTransferPanel)}
                      className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm ${
                        showTransferPanel
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <FaExchangeAlt className="w-4 h-4" />
                      <span className="hidden sm:inline">Transfers</span>
                    </button>
                    <button className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <FaShare className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <FaExpand className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Enhanced Pitch View */}
                {currentView === "pitch" && (
                  <>
                    <div className="p-4 lg:p-6">
                      <EnhancedPitchView
                        teamPlayers={userTeamData?.team_with_stats || []}
                        allPlayers={allPlayers}
                        onPlayerClick={(player) => setSelectedPlayer(player)}
                        onPlayerSelect={(player) => {
                          if (uiState.compareMode) {
                            setUIState((prev) => ({
                              ...prev,
                              comparedPlayers: prev.comparedPlayers.includes(
                                player.id
                              )
                                ? prev.comparedPlayers.filter(
                                    (id) => id !== player.id
                                  )
                                : prev.comparedPlayers.length < 2
                                ? [...prev.comparedPlayers, player.id]
                                : [prev.comparedPlayers[1], player.id],
                            }));
                          }
                        }}
                        selectedPlayers={uiState.comparedPlayers}
                        compareMode={uiState.compareMode}
                        formation={formation}
                        onFormationChange={handleFormationChange}
                        showStats={true}
                        interactive={true}
                      />
                    </div>

                    {/* Captain Info - Subtle design above Transfer Market */}
                    {userTeamData?.captain?.player_id && (
                      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                        <div className="px-4 py-3">
                          <div className="flex items-center justify-center gap-8">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-bold text-white">
                                  C
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Captain</p>
                                <p className="text-sm font-medium">
                                  {getPlayerById(userTeamData.captain.player_id)?.web_name}
                                </p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                  {userTeamData.captain.stats?.total_points || 0} pts (x2)
                                </p>
                              </div>
                            </div>
                            
                            {userTeamData?.vice_captain?.player_id && (
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                                    V
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Vice Captain</p>
                                  <p className="text-sm font-medium">
                                    {getPlayerById(userTeamData.vice_captain.player_id)?.web_name}
                                  </p>
                                  <p className="text-xs text-blue-600 dark:text-blue-400">
                                    {userTeamData.vice_captain.stats?.total_points || 0} pts
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Player List below pitch */}
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <div className="p-4 lg:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
                          <h3 className="text-lg font-semibold">Transfer Market</h3>
                          <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-none">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <input
                                type="text"
                                placeholder="Search..."
                                value={filters.search}
                                onChange={(e) =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    search: e.target.value,
                                  }))
                                }
                                className="w-full sm:w-auto pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </div>
                            <button
                              onClick={() => setShowFilters(!showFilters)}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors shrink-0 ${
                                showFilters
                                  ? "bg-green-600 text-white border-green-600"
                                  : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              }`}
                            >
                              <Filter className="w-4 h-4" />
                              <span className="hidden sm:inline">Filters</span>
                            </button>
                          </div>
                        </div>

                        {/* Advanced Filter Panel */}
                        <AdvancedFilterPanel
                          filters={filters}
                          onFiltersChange={setFilters}
                          allPlayers={allPlayers}
                          allTeams={allTeams}
                          isVisible={showFilters}
                          onToggle={() => setShowFilters(!showFilters)}
                        />

                        {/* Player List Table */}
                        <div
                          className={`${
                            showFilters ? "mt-6" : ""
                          } bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700`}
                        >
                          {/* Table Header */}
                          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                            <div className="grid grid-cols-9 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              <div className="col-span-3">Player</div>
                              <div className="col-span-1">Pos</div>
                              <div className="col-span-1">Price</div>
                              <div className="col-span-1">Points</div>
                              <div className="col-span-1">Form</div>
                              <div className="col-span-1">Own%</div>
                              <div className="col-span-1">Status</div>
                            </div>
                          </div>

                          {/* Table Body */}
                          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                            {filteredPlayers.slice(0, 100).map((player) => {
                              const team = getTeamById(player.team);
                              const teamColor = getTeamColor(player.team);
                              const isSelected = uiState.comparedPlayers.includes(
                                player.id
                              );
                              return (
                                <motion.div
                                  key={player.id}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className={`grid grid-cols-9 gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                                    isSelected
                                      ? "bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500"
                                      : ""
                                  }`}
                                  onClick={() => {
                                    if (uiState.compareMode) {
                                      setUIState((prev) => ({
                                        ...prev,
                                        comparedPlayers:
                                          prev.comparedPlayers.includes(player.id)
                                            ? prev.comparedPlayers.filter(
                                                (id) => id !== player.id
                                              )
                                            : prev.comparedPlayers.length < 2
                                            ? [...prev.comparedPlayers, player.id]
                                            : [prev.comparedPlayers[1], player.id],
                                      }));
                                    } else {
                                      setSelectedPlayer(player);
                                    }
                                  }}
                                >
                                  {/* Player Info */}
                                  <div className="col-span-3 flex items-center space-x-2">
                                    <div
                                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white relative"
                                      style={{ backgroundColor: teamColor.primary }}
                                    >
                                      {player.web_name.charAt(0)}
                                      {/* Enhanced indicators */}
                                      {player.price_trend === "rising" && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                                          <TrendingUp className="w-1.5 h-1.5 text-white" />
                                        </div>
                                      )}
                                      {player.price_trend === "falling" && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                          <TrendingDown className="w-1.5 h-1.5 text-white" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {player.web_name}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {team?.short_name}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Position */}
                                  <div className="col-span-1 flex items-center">
                                    <span
                                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        player.element_type === 1
                                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                                          : player.element_type === 2
                                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                                          : player.element_type === 3
                                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                                      }`}
                                    >
                                      {getPlayerPosition(player.element_type)}
                                    </span>
                                  </div>

                                  {/* Price */}
                                  <div className="col-span-1 flex items-center">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium">
                                        £{(player.now_cost / 10).toFixed(1)}
                                      </span>
                                      {player.cost_change_event !== 0 && (
                                        <span
                                          className={`text-xs ${
                                            player.cost_change_event > 0
                                              ? "text-green-600"
                                              : "text-red-600"
                                          }`}
                                        >
                                          {player.cost_change_event > 0 ? "+" : ""}
                                          {(player.cost_change_event / 10).toFixed(
                                            1
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Points */}
                                  <div className="col-span-1 flex items-center">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-green-600">
                                        {player.total_points}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {player.event_points} GW
                                      </span>
                                    </div>
                                  </div>

                                  {/* Form */}
                                  <div className="col-span-1 flex items-center">
                                    <span className="text-sm font-medium">
                                      {parseFloat(player.form).toFixed(1)}
                                    </span>
                                  </div>

                                  {/* Ownership */}
                                  <div className="col-span-1 flex items-center">
                                    <div className="flex flex-col">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {parseFloat(
                                          player.selected_by_percent
                                        ).toFixed(1)}
                                        %
                                      </span>
                                      {player.ownership_trend === "rising" && (
                                        <span className="text-xs text-blue-500">
                                          ↗ Rising
                                        </span>
                                      )}
                                      {player.ownership_trend === "falling" && (
                                        <span className="text-xs text-purple-500">
                                          ↘ Falling
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Status */}
                                  <div className="col-span-1 flex items-center">
                                    <div className="flex items-center gap-1">
                                      {player.availability_status ===
                                        "available" && (
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                      )}
                                      {player.availability_status ===
                                        "doubtful" && (
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                                      )}
                                      {player.availability_status === "injured" && (
                                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                                      )}
                                      {player.availability_status ===
                                        "suspended" && (
                                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                      )}
                                      {/* Differential badge */}
                                      {player.differential_score &&
                                        player.differential_score > 20 && (
                                          <Star className="w-3 h-3 text-yellow-500" />
                                        )}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>

                          {/* Results info */}
                          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Showing {Math.min(100, filteredPlayers.length)} of{" "}
                                {filteredPlayers.length} players
                              </span>
                              {uiState.compareMode && (
                                <span className="text-sm text-blue-600 dark:text-blue-400">
                                  {uiState.comparedPlayers.length}/2 players
                                  selected for comparison
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Enhanced Analytics View */}
                {currentView === "analytics" && (
                  <div className="p-4 lg:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Team Performance Analytics */}
                      <div
                        className={`${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                        } rounded-lg p-4`}
                      >
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-blue-500" />
                          Team Analytics
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Average Points/Player
                            </span>
                            <span className="font-bold">
                              {userTeamData?.team_with_stats
                                ? (
                                    userTeamData.team_with_stats.reduce(
                                      (sum, p) => sum + (p.total_points || 0),
                                      0
                                    ) / userTeamData.team_with_stats.length
                                  ).toFixed(1)
                                : "0"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Team Value
                            </span>
                            <span className="font-bold text-green-600">
                              £
                              {(
                                (userTeamData?.entry_history?.value || 1000) / 10
                              ).toFixed(1)}
                              m
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Weekly Rank
                            </span>
                            <span className="font-bold">
                              #
                              {userTeamData?.manager?.summary_event_rank?.toLocaleString() ||
                                "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Formation Analysis */}
                      <div
                        className={`${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                        } rounded-lg p-4`}
                      >
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <Target className="w-5 h-5 text-purple-500" />
                          Formation Analysis
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Current Formation
                            </span>
                            <span className="font-bold">{formation}</span>
                          </div>
                          <div className="space-y-2">
                            {["GK", "DEF", "MID", "FWD"].map((pos, idx) => {
                              const positionPlayers =
                                userTeamData?.team_with_stats?.filter(
                                  (tp) => {
                                    const player = getPlayerById(tp.player_id);
                                    return player?.element_type === idx + 1;
                                  }
                                ) || [];
                              
                              // Calculate average points from live stats if available, otherwise use total_points
                              const totalPoints = positionPlayers.reduce((sum, tp) => {
                                const livePoints = tp.live_stats?.total_points || 0;
                                const staticPoints = tp.total_points || 0;
                                return sum + Math.max(livePoints, staticPoints);
                              }, 0);
                              
                              const avgPoints = positionPlayers.length > 0 ? totalPoints / positionPlayers.length : 0;
                              
                              // Calculate bench points for this position
                              const benchPlayers = userTeamData?.team_with_stats?.filter(
                                (tp) => {
                                  const player = getPlayerById(tp.player_id);
                                  return player?.element_type === idx + 1 && tp.position > 11;
                                }
                              ) || [];
                              
                              const benchPoints = benchPlayers.reduce((sum, tp) => {
                                const livePoints = tp.live_stats?.total_points || 0;
                                const staticPoints = tp.total_points || 0;
                                return sum + Math.max(livePoints, staticPoints);
                              }, 0);
                              
                              return (
                                <div
                                  key={pos}
                                  className="flex justify-between items-center text-sm"
                                >
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {pos} Avg
                                  </span>
                                  <span className="font-medium">
                                    {avgPoints.toFixed(1)} pts
                                    {benchPoints > 0 && (
                                      <span className="text-xs text-gray-500 ml-1">
                                        ({benchPoints} bench)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}


              </div>
            </motion.div>

            {/* Enhanced Sidebar with Widgets - Mobile optimized */}
            <motion.div
              className={`xl:flex-1 space-y-4 lg:space-y-6 order-1 xl:order-2 ${
                uiState.sidebarCollapsed ? "hidden xl:block" : ""
              }`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <h2 className="text-base lg:text-lg font-semibold">
                  Live Insights
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setUIState((prev) => ({
                        ...prev,
                        compareMode: !prev.compareMode,
                      }))
                    }
                    className={`px-2 lg:px-3 py-1 text-xs lg:text-sm rounded-lg transition-colors ${
                      uiState.compareMode
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    Compare
                  </button>
                  <button
                    onClick={() =>
                      setUIState((prev) => ({
                        ...prev,
                        sidebarCollapsed: !prev.sidebarCollapsed,
                      }))
                    }
                    className="xl:hidden p-1 lg:p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    <Maximize2 className="w-3 h-3 lg:w-4 lg:h-4" />
                  </button>
                </div>
              </div>

              {/* Widgets Container - Mobile responsive grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 lg:gap-6">
                {/* Price Changes Widget */}
                <PriceChangesWidget
                  userTeamPlayerIds={
                    userTeamData?.team_with_stats?.map((tp) => tp.player_id) ||
                    []
                  }
                  refreshInterval={60000}
                  maxItems={5}
                />

                {/* Ownership Changes Widget */}
                <OwnershipChangesWidget
                  userTeamPlayerIds={
                    userTeamData?.team_with_stats?.map((tp) => tp.player_id) ||
                    []
                  }
                  refreshInterval={300000}
                  maxItems={5}
                  timeframe="1h"
                />

                {/* Transfer Trends Widget */}
                <TransferTrendsWidget
                  currentGameweek={currentGameweek}
                  refreshInterval={900000}
                  maxItems={5}
                  showFutureWeeks={true}
                />

                {/* Chip Strategies Widget */}
                <ChipStrategiesWidget
                  refreshInterval={1800000}
                  showRecommendations={true}
                  maxWeeksShown={5}
                />
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Manager ID Modal */}
      <ManagerIdModal
        isOpen={showManagerIdModal}
        onClose={() => {
          setShowManagerIdModal(false);
          setValidationStatus({
            isValidating: false,
            isRetrying: false,
            retryCount: 0,
            errorDetails: null,
            showRetryOption: false,
            showFallbackOption: false,
          });
        }}
        onSave={saveManagerId}
        onRetry={retryManagerIdSave}
        onSaveUnverified={saveUnverifiedManagerId}
        isLoading={managerIdLoading}
        validationStatus={validationStatus}
      />
    </div>
  );
}
