"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";

import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import {
  FaExchangeAlt,
  FaRobot,
  FaTimes,
  FaPaperPlane,
  FaListAlt,
} from "react-icons/fa";
import {
  Target,
  BarChart3,
  Maximize2,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Star,
  Edit3,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import FplLoadingSkeleton from "@/components/shared/FplLoadingSkeleton";
import ManagerIdModal from "@/components/modals/ManagerIdModal";
import { getTeamColors } from "@/lib/team-colors";
import { ErrorType, ValidationStatus } from "@/types/validation";
import FplStatusBanner from "@/components/shared/FplStatusBanner";

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
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation("fpl");
  const [currentGameweek, setCurrentGameweek] = useState(4);
  const [currentView, setCurrentView] = useState<ViewMode>("pitch");
  const [userTeamData, setUserTeamData] = useState<UserTeamData | null>(null);
  const [originalTeamData, setOriginalTeamData] = useState<UserTeamData | null>(
    null
  ); // Save original state
  const [currentTeam, setCurrentTeam] = useState<any[]>([]); // Current working team for transfers
  const [loading, setLoading] = useState(false);
  const [allPlayers, setAllPlayers] = useState<EnhancedPlayerData[]>([]);
  const [allTeams, setAllTeams] = useState<TeamData[]>([]);
  const [allFixtures, setAllFixtures] = useState<FixtureData[]>([]);
  const [showManagerIdModal, setShowManagerIdModal] = useState(false);
  const [currentManagerId, setCurrentManagerId] = useState<string | null>(
    managerId
  );
  const [isCheckingManagerId, setIsCheckingManagerId] = useState(false);
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
  const [fplApiError, setFplApiError] = useState<string | null>(null);

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

  // Transfer Planning State
  const [transferMode, setTransferMode] = useState(false);
  const [pendingTransfers, setPendingTransfers] = useState<{
    transfersOut: number[];
    transfersIn: number[];
  }>({
    transfersOut: [],
    transfersIn: [],
  });
  const [availableBudget, setAvailableBudget] = useState(0);
  const [freeTransfers, setFreeTransfers] = useState(1);
  const [transferCost, setTransferCost] = useState(0);

  // AI Chat Widget State
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [canUseAI, setCanUseAI] = useState(true);
  const [lastAIUsage, setLastAIUsage] = useState<string | null>(null);

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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
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
  const fixturesCacheRef = useRef<{
    gameweek: number;
    data: any[];
    timestamp: number;
  } | null>(null);
  const fetchFixtures = useCallback(
    async (
      gameweek: number = currentGameweek,
      forceRefresh: boolean = false
    ) => {
      // Check cache first (5 minute cache)
      if (!forceRefresh && fixturesCacheRef.current) {
        const {
          gameweek: cachedGW,
          data,
          timestamp,
        } = fixturesCacheRef.current;
        const isStale = Date.now() - timestamp > 300000; // 5 minutes
        if (cachedGW === gameweek && !isStale) {
          setAllFixtures(data);
          return;
        }
      }

      try {
        const response = await fetch(`/api/fpl/fixtures?event=${gameweek}`);

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const fixtures = result.data || [];
            setAllFixtures(fixtures);
            setFplApiError(null);

            // Cache the result
            fixturesCacheRef.current = {
              gameweek,
              data: fixtures,
              timestamp: Date.now(),
            };

            return; // Successfully fetched data
          }
        }

        // Handle 404 or other errors - immediately try fallback
        if (gameweek > 3) {
          return fetchFixtures(gameweek - 1, forceRefresh);
        } else {
          console.warn(
            `❌ No fixture data available for GW${gameweek} or earlier`
          );
          setAllFixtures([]);
          setFplApiError(
            "FPL API is currently unavailable or returned no fixtures. Please try again later."
          );
        }
      } catch (error) {
        console.error("Failed to fetch fixtures:", error);
        // Try fallback on any error if possible
        if (gameweek > 3) {
          return fetchFixtures(gameweek - 1, forceRefresh);
        } else {
          setAllFixtures([]);
          setFplApiError(
            "FPL API is currently unavailable. Fixtures could not be loaded."
          );
        }
      }
    },
    []
  ); // Remove currentGameweek from dependencies

  // Enhanced bootstrap data fetching
  const fetchBootstrapData = useCallback(async () => {
    try {
      setBootstrapLoading(true);
      const response = await fetch("/api/fpl/bootstrap-static");

      if (!response.ok) {
        setFplApiError(
          "FPL API is currently unavailable. Base data could not be loaded."
        );
        return; // Avoid throwing to keep flow stable
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
        setFplApiError(null);
      }
    } catch (error) {
      console.error("Failed to fetch bootstrap data:", error);
      setFplApiError(
        "FPL API is currently unavailable. Some data may be missing."
      );
    } finally {
      setBootstrapLoading(false);
    }
  }, []); // Remove processEnhancedPlayerData dependency to prevent loops

  // Team data cache and rate limiting
  const teamDataCacheRef = useRef<{
    managerId: string;
    gameweek: number;
    data: any;
    timestamp: number;
  } | null>(null);
  const teamDataRequestRef = useRef<string | null>(null);

  const fetchTeamData = useCallback(
    async (id: string, gameweek?: number, forceRefresh: boolean = false) => {
      const targetGameweek = gameweek || currentGameweek;
      const requestKey = `${id}-${targetGameweek}`;

      // Prevent duplicate requests
      if (teamDataRequestRef.current === requestKey && !forceRefresh) {
        return;
      }

      // Check cache first (5 minute cache)
      if (!forceRefresh && teamDataCacheRef.current) {
        const {
          managerId,
          gameweek: cachedGW,
          data,
          timestamp,
        } = teamDataCacheRef.current;
        const isStale = Date.now() - timestamp > 300000; // 5 minutes
        if (managerId === id && cachedGW === targetGameweek && !isStale) {
          setUserTeamData(data);
          return;
        }
      }

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
          console.error(
            `❌ API Response Error: ${response.status} ${response.statusText}`
          );
          console.error("❌ Error details:", errorText);

          // Immediately try fallback for any error if possible
          if (targetGameweek > 3) {
            teamDataRequestRef.current = null; // Clear request lock
            return await fetchTeamData(id, targetGameweek - 1, forceRefresh);
          }

          setFplApiError(
            "FPL API is currently unavailable. Team data could not be loaded."
          );
          return; // Avoid throwing to keep flow stable
        }

        const data = await response.json();
        if (data.success && data.data) {
          setUserTeamData(data.data);
          setOriginalTeamData(data.data); // Save original data for transfer planning
          setCurrentTeam(data.data.team_with_stats || []); // Initialize current team

          // Initialize budget from team data
          const bankAmount = data.data.entry_history?.bank || 0;
          setAvailableBudget(bankAmount);
          setFreeTransfers(data.data.entry_history?.event_transfers || 1);

          // Cache the result
          teamDataCacheRef.current = {
            managerId: id,
            gameweek: targetGameweek,
            data: data.data,
            timestamp: Date.now(),
          };

          // Get bootstrap data from API response if available
          if (data.data.team_with_stats) {
            const playersFromResponse = data.data.team_with_stats
              .map((teamPlayer: any) => teamPlayer.player)
              .filter(Boolean);

            if (playersFromResponse.length > 0) {
              setAllPlayers((prev) =>
                prev.length === 0 ? playersFromResponse : prev
              );
            }
          }
          setFplApiError(null);
        }
      } catch (error) {
        console.error("❌ Error fetching team data:", error);

        // Try fallback on any error if possible
        if (targetGameweek > 3) {
          teamDataRequestRef.current = null; // Clear request lock
          return await fetchTeamData(id, targetGameweek - 1, forceRefresh);
        }
        setFplApiError(
          "FPL API is currently unavailable. Team data could not be loaded."
        );
      } finally {
        setLoading(false);
        teamDataRequestRef.current = null; // Clear request lock
      }
    },
    [] // Remove currentGameweek from dependencies
  );

  // Fetch manager ID from database
  const fetchManagerId = async () => {
    try {
      if (!session?.user) return;

      setIsCheckingManagerId(true);
      const response = await fetch("/api/user/manager-id");
      if (response.ok) {
        const data = await response.json();
        if (data.managerId) {
          setCurrentManagerId(data.managerId);
        } else {
          // No manager ID found in database - now we can show the modal
          setTimeout(() => {
            if (!currentManagerId) {
              setShowManagerIdModal(true);
            }
          }, 300); // Small delay for UX
        }
      }
    } catch (error) {
      console.error("❌ Failed to fetch manager ID:", error);
      // On error, show modal after delay as fallback
      setTimeout(() => {
        if (!currentManagerId) {
          setShowManagerIdModal(true);
        }
      }, 1000);
    } finally {
      setIsCheckingManagerId(false);
    }
  };

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

        // Refresh manager ID from database to get the latest saved value
        await fetchManagerId();

        // Fetch team data
        fetchTeamData(newManagerId, currentGameweek);
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

  // Fetch manager ID when user is authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user && !managerId) {
      fetchManagerId();
    }
  }, [status, session, managerId]);

  // Fetch fixtures when gameweek changes (no function dependency)
  useEffect(() => {
    if (currentGameweek) {
      fetchFixtures(currentGameweek);
    }
  }, [currentGameweek]);

  // Check if we need to show manager ID modal or fetch data (no function dependency)
  useEffect(() => {
    // Only fetch data if we have manager ID
    if (currentManagerId) {
      fetchTeamData(currentManagerId, currentGameweek);
    }
    // Modal display is now handled in fetchManagerId function
  }, [currentManagerId, currentGameweek]);

  // Update currentManagerId when prop changes
  useEffect(() => {
    setCurrentManagerId(managerId);
  }, [managerId]);

  // Unified loading state management
  useEffect(() => {
    const hasAnyLoading = loading || bootstrapLoading || managerIdLoading;
    const hasRequiredData =
      currentManagerId && allPlayers.length > 0 && allTeams.length > 0;

    if (hasAnyLoading) {
      setIsInitialLoading(true);
    } else if (hasRequiredData) {
      setIsInitialLoading(false);
    } else if (!currentManagerId && status !== "loading") {
      // Show content even without manager ID so user can see the modal
      setIsInitialLoading(false);
    }
  }, [
    loading,
    bootstrapLoading,
    managerIdLoading,
    currentManagerId,
    allPlayers.length,
    allTeams.length,
    status,
  ]);

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

  // Transfer Planning Functions
  const calculateTransferCost = useCallback(
    (transfersCount: number, freeTransfersAvailable: number) => {
      const extraTransfers = Math.max(
        0,
        transfersCount - freeTransfersAvailable
      );
      return extraTransfers * 4; // 4 points per extra transfer
    },
    []
  );

  const calculateBudgetAfterTransfers = useCallback(() => {
    if (!originalTeamData) return 0;

    let budget = originalTeamData.entry_history?.bank || 0;

    // Add money from players being transferred out
    pendingTransfers.transfersOut.forEach((playerId) => {
      const player = getPlayerById(playerId);
      if (player) {
        budget += player.now_cost;
      }
    });

    // Subtract money for players being transferred in
    pendingTransfers.transfersIn.forEach((playerId) => {
      const player = getPlayerById(playerId);
      if (player) {
        budget -= player.now_cost;
      }
    });

    return budget;
  }, [originalTeamData, pendingTransfers, getPlayerById]);

  const addPlayerOut = useCallback((playerId: number) => {
    setPendingTransfers((prev) => ({
      ...prev,
      transfersOut: prev.transfersOut.includes(playerId)
        ? prev.transfersOut
        : [...prev.transfersOut, playerId],
    }));
  }, []);

  const removePlayerOut = useCallback((playerId: number) => {
    setPendingTransfers((prev) => ({
      ...prev,
      transfersOut: prev.transfersOut.filter((id) => id !== playerId),
    }));
  }, []);

  const addPlayerIn = useCallback(
    (playerId: number) => {
      // Only add if we have corresponding transfer out and position match
      setPendingTransfers((prev) => {
        // Check if player is already in transfers in
        if (prev.transfersIn.includes(playerId)) {
          return prev;
        }

        // Find next available transfer out slot
        const availableOutIndex = prev.transfersOut.findIndex(
          (_, index) => !prev.transfersIn[index]
        );

        if (availableOutIndex === -1) {
          // No available slots
          return prev;
        }

        // Validate position compatibility
        const outPlayer = getPlayerById(prev.transfersOut[availableOutIndex]);
        const inPlayer = getPlayerById(playerId);

        if (
          !outPlayer ||
          !inPlayer ||
          outPlayer.element_type !== inPlayer.element_type
        ) {
          // Position mismatch - can't make this transfer
          return prev;
        }

        // Create new transfers in array with player at specific index
        const newTransfersIn = [...prev.transfersIn];
        newTransfersIn[availableOutIndex] = playerId;

        return {
          ...prev,
          transfersIn: newTransfersIn,
        };
      });
    },
    [getPlayerById]
  );

  const removePlayerIn = useCallback((playerId: number) => {
    setPendingTransfers((prev) => {
      const playerIndex = prev.transfersIn.findIndex((id) => id === playerId);
      if (playerIndex === -1) return prev;

      const newTransfersIn = [...prev.transfersIn];
      newTransfersIn[playerIndex] = undefined as any; // Remove but keep array structure

      return {
        ...prev,
        transfersIn: newTransfersIn,
      };
    });
  }, []);

  const resetTransfers = useCallback(() => {
    setPendingTransfers({ transfersOut: [], transfersIn: [] });
    setCurrentTeam(originalTeamData?.team_with_stats || []);
    setTransferMode(false);
  }, [originalTeamData]);

  const enterTransferMode = useCallback(() => {
    setTransferMode(true);
    setShowTransferPanel(true);
  }, []);

  const canAffordPlayer = useCallback(
    (playerId: number) => {
      const player = getPlayerById(playerId);
      if (!player) return false;

      const budgetAfterTransfers = calculateBudgetAfterTransfers();
      return budgetAfterTransfers >= player.now_cost;
    },
    [getPlayerById, calculateBudgetAfterTransfers]
  );

  const validateSquad = useCallback(() => {
    if (!originalTeamData) return { isValid: false, errors: [] };

    // Start with original squad
    const finalSquad = [...(originalTeamData.team_with_stats || [])];

    // Apply replacements (same logic as currentTeamForDisplay but locally)
    pendingTransfers.transfersOut.forEach((outPlayerId, index) => {
      const transferInPlayerId = pendingTransfers.transfersIn[index];
      if (transferInPlayerId) {
        const outPlayerIndex = finalSquad.findIndex(
          (tp) => tp.player_id === outPlayerId
        );
        const newPlayer = getPlayerById(transferInPlayerId);

        if (outPlayerIndex >= 0 && newPlayer) {
          // Replace at same position
          finalSquad[outPlayerIndex] = {
            player_id: transferInPlayerId,
            position: finalSquad[outPlayerIndex].position,
            total_points: newPlayer.total_points,
            event_points: newPlayer.event_points,
            player: newPlayer,
          };
        }
      }
    });

    const errors: string[] = [];

    // Count players by position
    const positionCounts = { 1: 0, 2: 0, 3: 0, 4: 0 }; // GK, DEF, MID, FWD
    finalSquad.forEach((tp) => {
      const player = tp.player || getPlayerById(tp.player_id);
      if (player) {
        positionCounts[player.element_type as keyof typeof positionCounts]++;
      }
    });

    // Validate squad size
    if (finalSquad.length !== 15) {
      errors.push(
        `Squad must have 15 players (currently ${finalSquad.length})`
      );
    }

    // Validate position requirements
    if (positionCounts[1] !== 2)
      errors.push(`Must have 2 goalkeepers (currently ${positionCounts[1]})`);
    if (positionCounts[2] !== 5)
      errors.push(`Must have 5 defenders (currently ${positionCounts[2]})`);
    if (positionCounts[3] !== 5)
      errors.push(`Must have 5 midfielders (currently ${positionCounts[3]})`);
    if (positionCounts[4] !== 3)
      errors.push(`Must have 3 forwards (currently ${positionCounts[4]})`);

    // Validate budget
    const budgetAfterTransfers = calculateBudgetAfterTransfers();
    if (budgetAfterTransfers < 0) {
      errors.push(
        `Over budget by £${Math.abs(budgetAfterTransfers / 10).toFixed(1)}m`
      );
    }

    // Validate team distribution (max 3 players from same team)
    const teamCounts: Record<number, number> = {};
    finalSquad.forEach((tp) => {
      const player = tp.player || getPlayerById(tp.player_id);
      if (player) {
        teamCounts[player.team] = (teamCounts[player.team] || 0) + 1;
      }
    });

    Object.entries(teamCounts).forEach(([teamId, count]) => {
      if (count > 3) {
        const team = getTeamById(Number(teamId));
        errors.push(
          `Too many players from ${
            team?.name || "team"
          } (max 3, currently ${count})`
        );
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      positionCounts,
      budgetRemaining: budgetAfterTransfers,
    };
  }, [
    originalTeamData,
    pendingTransfers,
    getPlayerById,
    calculateBudgetAfterTransfers,
    getTeamById,
  ]);

  const confirmTransfers = useCallback(() => {
    if (!originalTeamData) return;

    const validation = validateSquad();
    if (!validation.isValid) return;

    // Apply transfers to userTeamData
    const newTeamData = { ...originalTeamData };
    const newTeamWithStats = [...(originalTeamData.team_with_stats || [])];

    // Replace transferred out players with transferred in players at same positions
    pendingTransfers.transfersOut.forEach((outPlayerId, index) => {
      const transferInPlayerId = pendingTransfers.transfersIn[index];
      if (transferInPlayerId) {
        const outPlayerIndex = newTeamWithStats.findIndex(
          (tp) => tp.player_id === outPlayerId
        );
        const newPlayer = getPlayerById(transferInPlayerId);

        if (outPlayerIndex >= 0 && newPlayer) {
          // Replace at exact same position
          newTeamWithStats[outPlayerIndex] = {
            player_id: transferInPlayerId,
            position: newTeamWithStats[outPlayerIndex].position, // Keep original position
            total_points: newPlayer.total_points,
            event_points: newPlayer.event_points,
            stats: {
              total_points: newPlayer.total_points,
              event_points: newPlayer.event_points,
            },
            live_stats: {
              total_points: newPlayer.total_points,
              event_points: newPlayer.event_points,
            },
            player: newPlayer,
          };
        }
      }
    });

    // Update bank balance
    const finalBudget = calculateBudgetAfterTransfers();

    newTeamData.team_with_stats = newTeamWithStats;
    newTeamData.entry_history = {
      ...originalTeamData.entry_history!,
      bank: finalBudget,
      event_transfers:
        (originalTeamData.entry_history?.event_transfers || 0) +
        pendingTransfers.transfersOut.length,
      event_transfers_cost: transferCost,
    };

    // Update states
    setUserTeamData(newTeamData);
    setOriginalTeamData(newTeamData); // New baseline for future transfers
    setCurrentTeam(newTeamWithStats);
    setPendingTransfers({ transfersOut: [], transfersIn: [] });
    setTransferMode(false);
  }, [
    originalTeamData,
    validateSquad,
    pendingTransfers,
    getPlayerById,
    calculateBudgetAfterTransfers,
    transferCost,
  ]);

  // Update transfer cost when transfers change
  useEffect(() => {
    const totalTransfers = pendingTransfers.transfersOut.length;
    const cost = calculateTransferCost(totalTransfers, freeTransfers);
    setTransferCost(cost);
    setAvailableBudget(calculateBudgetAfterTransfers());
  }, [
    pendingTransfers,
    freeTransfers,
    calculateTransferCost,
    calculateBudgetAfterTransfers,
  ]);

  // AI Team Analysis Functions
  const checkAIUsageLimit = useCallback(async () => {
    if (!session?.user?.id) return false;

    try {
      const response = await fetch("/api/user/ai-usage");
      if (response.ok) {
        const data = await response.json();
        const lastUsage = data.lastAITeamAnalysis;

        if (lastUsage) {
          const lastUsageDate = new Date(lastUsage);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);

          if (lastUsageDate > weekAgo) {
            setCanUseAI(false);
            setLastAIUsage(lastUsage);
            return false;
          }
        }

        setCanUseAI(true);
        return true;
      }
    } catch (error) {
      console.error("Failed to check AI usage:", error);
    }
    return false;
  }, [session?.user?.id]);

  const requestAIAnalysis = useCallback(async () => {
    if (!session?.user?.id || !userTeamData || aiChatLoading) return;

    setAiChatLoading(true);
    setAiAnalysis(null);

    try {
      // Use i18n from the hook that's already called at component level
      const isBosnian = i18n.language === "bs";

      const analysisPrompt = isBosnian
        ? "Analiziraj moj FPL tim i predloži poboljšanja za iduće gameweek-ove. Fokusiraj se na transfere, kapetana, formacije i strategiju. Budi konkretan sa preporučenim igračima i objasni zašto."
        : "Analyze my FPL team and suggest improvements for upcoming gameweeks. Focus on transfers, captain choices, formations, and strategy. Be specific with recommended players and explain why.";

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: analysisPrompt,
          chatHistory: [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiAnalysis(data.response);

        // Update AI usage tracking
        await fetch("/api/user/ai-usage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "team_analysis",
          }),
        });

        setCanUseAI(false);
        setLastAIUsage(new Date().toISOString());
      } else {
        throw new Error("Failed to get AI analysis");
      }
    } catch (error) {
      console.error("AI Analysis failed:", error);
      setAiAnalysis(
        "Došlo je do greške prilikom analize. Pokušajte ponovo później."
      );
    } finally {
      setAiChatLoading(false);
    }
  }, [session?.user?.id, userTeamData, aiChatLoading, i18n.language]);

  // Check AI usage on mount
  useEffect(() => {
    if (session?.user?.id) {
      checkAIUsageLimit();
    }
  }, [session?.user?.id, checkAIUsageLimit]);

  // Calculate current team state with pending transfers applied
  const currentTeamForDisplay = useMemo(() => {
    if (!userTeamData?.team_with_stats) {
      return [];
    }

    if (!transferMode) {
      return userTeamData.team_with_stats;
    }

    // Start with original team - keep all players visible
    const teamWithTransfers = [...userTeamData.team_with_stats];

    // Replace transferred out players with transferred in players at same positions
    pendingTransfers.transfersOut.forEach((outPlayerId, index) => {
      const transferInPlayerId = pendingTransfers.transfersIn[index];
      if (transferInPlayerId) {
        const outPlayerIndex = teamWithTransfers.findIndex(
          (tp) => tp.player_id === outPlayerId
        );
        const newPlayer = getPlayerById(transferInPlayerId);

        if (outPlayerIndex >= 0 && newPlayer) {
          // Replace at same position - set points to 0 to hide them for new transfers
          teamWithTransfers[outPlayerIndex] = {
            player_id: transferInPlayerId,
            position: teamWithTransfers[outPlayerIndex].position,
            total_points: 0, // Hide points for transferred in players
            event_points: 0, // Hide points for transferred in players
            stats: {
              total_points: 0,
              event_points: 0,
            },
            live_stats: {
              total_points: 0,
              event_points: 0,
            },
            player: newPlayer,
            isTransferIn: true, // Mark as transfer in to identify later
          };
        }
      }
    });

    return teamWithTransfers;
  }, [
    userTeamData?.team_with_stats,
    transferMode,
    pendingTransfers,
    getPlayerById,
  ]);

  return (
    <div
      className={`min-h-screen p-4 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Loading State */}
      {isInitialLoading && (
        <FplLoadingSkeleton
          variant="grid"
          count={6}
          title="Loading Team Data"
          description="Fetching your FPL team information and player statistics..."
        />
      )}

      {/* Global FPL API status */}
      {fplApiError && (
        <div className="mb-4">
          <FplStatusBanner message={fplApiError} />
        </div>
      )}

      {/* Team Data Display */}
      {!isInitialLoading && currentManagerId && userTeamData && (
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
                <p className="text-gray-500">{t("teamPlanner.subtitle")}</p>
                {/* Inline Manager ID with edit option */}
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span
                    className={
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }
                  >
                    {t("teamPlanner.managerId")} {currentManagerId}
                  </span>
                  <button
                    onClick={() => setShowManagerIdModal(true)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={t("teamPlanner.clickToChange") || "Click to change"}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t("teamPlanner.clickToChange")}</span>
                  </button>
                  {currentManagerId && (
                    <a
                      href={`https://fantasy.premierleague.com/entry/${currentManagerId}/event/${currentGameweek}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Open on fantasy.premierleague.com"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open on FPL</span>
                    </a>
                  )}
                </div>
              </div>
              <div className="text-right">
                {/* Overall rank and meta */}
                <p className="text-xs text-gray-500">
                  {t("teamPlanner.overallRank")}: #
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
                <p className="text-sm text-gray-500">
                  {t("teamPlanner.gameweek")}
                </p>
                <p className="font-bold text-lg">{currentGameweek}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                <p className="text-sm text-gray-500">
                  {t("teamPlanner.gwPoints")}
                </p>
                <p className="font-bold text-lg text-green-600">
                  {userTeamData.team_totals?.total_points_final || 0}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
                <p className="text-sm text-gray-500">
                  {t("teamPlanner.totalPoints")}
                </p>
                <p className="font-bold text-lg">
                  {userTeamData.manager?.summary_overall_points?.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
                <p className="text-sm text-gray-500">
                  {t("teamPlanner.teamValue")}
                </p>
                <p className="font-bold text-lg">
                  £
                  {((userTeamData.entry_history?.value || 1000) / 10).toFixed(
                    1
                  )}
                  m
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-3">
                <p className="text-sm text-gray-500">{t("teamPlanner.bank")}</p>
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
                } rounded-lg shadow-lg  border border-gray-200 dark:border-gray-700`}
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
                        <span className="text-xs sm:text-sm">
                          {t("teamPlanner.tabs.pitch")}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentView("list");
                          setUIState((prev) => ({
                            ...prev,
                            currentView: "list",
                          }));
                        }}
                        className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md transition-all duration-200 flex-1 sm:flex-none text-sm ${
                          currentView === "list"
                            ? "bg-green-600 text-white shadow-sm"
                            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <FaListAlt className="w-4 h-4" />
                        <span className="text-xs sm:text-sm">
                          {t("teamPlanner.tabs.list")}
                        </span>
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
                        <span className="text-xs sm:text-sm">
                          {t("teamPlanner.tabs.analytics")}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons - Mobile optimized */}
                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() =>
                        transferMode ? resetTransfers() : enterTransferMode()
                      }
                      className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                        transferMode
                          ? "bg-red-600 text-white hover:bg-red-700 shadow-sm"
                          : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      }`}
                    >
                      <FaExchangeAlt className="w-4 h-4" />
                      <span>
                        {transferMode
                          ? t("teamPlanner.transfers.exitTransfers")
                          : t("teamPlanner.tabs.transfers")}
                      </span>
                      {transferMode &&
                        pendingTransfers.transfersOut.length > 0 && (
                          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">
                            {pendingTransfers.transfersOut.length}
                          </span>
                        )}
                    </button>

                    {/* AI Team Analysis Button */}
                    {session?.user && (
                      <button
                        onClick={() => setShowAIChat(true)}
                        disabled={!canUseAI}
                        className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                          canUseAI
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-sm"
                            : "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                        }`}
                        title={
                          canUseAI
                            ? t("teamPlanner.tabs.aiAnalyser") + " (1x weekly)"
                            : t("teamPlanner.tabs.aiAnalyser") + " used this week"
                        }
                      >
                        <FaRobot className="w-4 h-4" />
                        <span className="hidden sm:inline">
                          {t("teamPlanner.tabs.aiAnalyser")}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Enhanced Pitch View */}
                {currentView === "pitch" && (
                  <>
                    <div className="p-4 lg:p-6">
                      <EnhancedPitchView
                        teamPlayers={currentTeamForDisplay}
                        allPlayers={allPlayers}
                        onPlayerClick={(player) => {
                          if (transferMode) {
                            // In transfer mode, toggle selection for transfer out
                            if (
                              pendingTransfers.transfersOut.includes(player.id)
                            ) {
                              // Already selected for transfer out, deselect
                              removePlayerOut(player.id);
                            } else {
                              // Not selected, mark for transfer out
                              addPlayerOut(player.id);
                            }
                          } else {
                            setSelectedPlayer(player);
                          }
                        }}
                        onPlayerSelect={(player) => {
                          if (transferMode) {
                            // Toggle selection for transfer out
                            if (
                              pendingTransfers.transfersOut.includes(player.id)
                            ) {
                              removePlayerOut(player.id);
                            } else {
                              addPlayerOut(player.id);
                            }
                          } else if (uiState.compareMode) {
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
                        selectedPlayers={
                          transferMode
                            ? pendingTransfers.transfersOut
                            : uiState.comparedPlayers
                        }
                        compareMode={transferMode ? true : uiState.compareMode}
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
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Captain
                                </p>
                                <p className="text-sm font-medium">
                                  {
                                    getPlayerById(
                                      userTeamData.captain.player_id
                                    )?.web_name
                                  }
                                </p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                  {userTeamData.captain.stats?.total_points ||
                                    0}{" "}
                                  pts (x2)
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
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Vice Captain
                                  </p>
                                  <p className="text-sm font-medium">
                                    {
                                      getPlayerById(
                                        userTeamData.vice_captain.player_id
                                      )?.web_name
                                    }
                                  </p>
                                  <p className="text-xs text-blue-600 dark:text-blue-400">
                                    {userTeamData.vice_captain.stats
                                      ?.total_points || 0}{" "}
                                    pts
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Enhanced List View */}
                {currentView === "list" && (
                  <div className="p-4 lg:p-6">
                    {/* Squad Overview */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-green-500" />
                        {t("teamPlanner.list.startingXI")} ({formation})
                      </h3>

                      {/* Starting XI Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {currentTeamForDisplay
                          .filter((tp) => tp.position <= 11)
                          .sort((a, b) => a.position - b.position)
                          .map((teamPlayer) => {
                            const player =
                              teamPlayer.player ||
                              getPlayerById(teamPlayer.player_id);
                            const team = getTeamById(player?.team || 0);
                            const teamColor = getTeamColor(player?.team || 0);

                            if (!player) return null;

                            return (
                              <motion.div
                                key={teamPlayer.player_id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`${
                                  theme === "dark" ? "bg-gray-700" : "bg-white"
                                } rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200 cursor-pointer`}
                                onClick={() => {
                                  if (transferMode) {
                                    if (
                                      pendingTransfers.transfersOut.includes(
                                        player.id
                                      )
                                    ) {
                                      removePlayerOut(player.id);
                                    } else {
                                      addPlayerOut(player.id);
                                    }
                                  }
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Player Avatar with Team Color */}
                                  <div className="relative">
                                    <div
                                      className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm"
                                      style={{
                                        backgroundColor: teamColor.primary,
                                      }}
                                    >
                                      {player.web_name
                                        .split(" ")
                                        .map((n: string) => n[0])
                                        .join("")
                                        .slice(0, 2)}
                                    </div>

                                    {/* Position Badge */}
                                    <div
                                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                        player.element_type === 1
                                          ? "bg-yellow-500 text-white"
                                          : player.element_type === 2
                                          ? "bg-blue-500 text-white"
                                          : player.element_type === 3
                                          ? "bg-green-500 text-white"
                                          : "bg-red-500 text-white"
                                      }`}
                                    >
                                      {
                                        getPlayerPosition(
                                          player.element_type
                                        )[0]
                                      }
                                    </div>

                                    {/* Transfer Status Indicator */}
                                    {transferMode &&
                                      pendingTransfers.transfersOut.includes(
                                        player.id
                                      ) && (
                                        <div className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                          <span className="text-white text-xs">
                                            -
                                          </span>
                                        </div>
                                      )}
                                  </div>

                                  {/* Player Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-sm truncate">
                                        {player.web_name}
                                      </h4>
                                      {teamPlayer.player_id ===
                                        userTeamData?.captain?.player_id && (
                                        <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                                          <span className="text-white text-xs font-bold">
                                            C
                                          </span>
                                        </div>
                                      )}
                                      {teamPlayer.player_id ===
                                        userTeamData?.vice_captain
                                          ?.player_id && (
                                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                          <span className="text-white text-xs font-bold">
                                            V
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                      {team?.name} • £
                                      {(player.now_cost / 10).toFixed(1)}m
                                    </p>

                                    {/* Stats Row */}
                                    <div className="flex items-center gap-4 text-xs">
                                      <div className="flex items-center gap-1">
                                        <span className="font-medium text-green-600 dark:text-green-400">
                                          {teamPlayer.isTransferIn
                                            ? 0
                                            : teamPlayer.total_points ||
                                              player.total_points}
                                        </span>
                                        <span className="text-gray-400">
                                          pts
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="font-medium">
                                          {parseFloat(player.form).toFixed(1)}
                                        </span>
                                        <span className="text-gray-400">
                                          form
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="font-medium text-purple-600 dark:text-purple-400">
                                          {parseFloat(
                                            player.selected_by_percent
                                          ).toFixed(1)}
                                          %
                                        </span>
                                        <span className="text-gray-400">
                                          own
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Substitutes Bench */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <div className="w-5 h-5 bg-gray-400 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            S
                          </span>
                        </div>
                        {t("teamPlanner.list.substitutes")}
                      </h3>

                      {/* Substitutes Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {currentTeamForDisplay
                          .filter((tp) => tp.position > 11)
                          .sort((a, b) => a.position - b.position)
                          .map((teamPlayer) => {
                            const player =
                              teamPlayer.player ||
                              getPlayerById(teamPlayer.player_id);
                            const team = getTeamById(player?.team || 0);
                            const teamColor = getTeamColor(player?.team || 0);

                            if (!player) return null;

                            return (
                              <motion.div
                                key={teamPlayer.player_id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className={`${
                                  theme === "dark"
                                    ? "bg-gray-700/50"
                                    : "bg-gray-50"
                                } rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-600 opacity-75 hover:opacity-100 transition-all duration-200 cursor-pointer`}
                                onClick={() => {
                                  if (transferMode) {
                                    if (
                                      pendingTransfers.transfersOut.includes(
                                        player.id
                                      )
                                    ) {
                                      removePlayerOut(player.id);
                                    } else {
                                      addPlayerOut(player.id);
                                    }
                                  }
                                }}
                              >
                                <div className="flex items-start gap-2">
                                  {/* Player Avatar with Team Color */}
                                  <div className="relative">
                                    <div
                                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm"
                                      style={{
                                        backgroundColor: teamColor.primary,
                                      }}
                                    >
                                      {player.web_name
                                        .split(" ")
                                        .map((n: string) => n[0])
                                        .join("")
                                        .slice(0, 2)}
                                    </div>

                                    {/* Position Badge */}
                                    <div
                                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                                        player.element_type === 1
                                          ? "bg-yellow-500 text-white"
                                          : player.element_type === 2
                                          ? "bg-blue-500 text-white"
                                          : player.element_type === 3
                                          ? "bg-green-500 text-white"
                                          : "bg-red-500 text-white"
                                      }`}
                                    >
                                      {
                                        getPlayerPosition(
                                          player.element_type
                                        )[0]
                                      }
                                    </div>

                                    {/* Transfer Status Indicator */}
                                    {transferMode &&
                                      pendingTransfers.transfersOut.includes(
                                        player.id
                                      ) && (
                                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                          <span className="text-white text-xs">
                                            -
                                          </span>
                                        </div>
                                      )}
                                  </div>

                                  {/* Player Info */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm truncate">
                                      {player.web_name}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                      {team?.short_name} • £
                                      {(player.now_cost / 10).toFixed(1)}m
                                    </p>

                                    {/* Stats Row */}
                                    <div className="flex items-center gap-3 text-xs">
                                      <span className="font-medium text-green-600 dark:text-green-400">
                                        {teamPlayer.isTransferIn
                                          ? 0
                                          : teamPlayer.total_points ||
                                            player.total_points}{" "}
                                        pts
                                      </span>
                                      <span className="text-gray-400">
                                        {parseFloat(player.form).toFixed(1)}{" "}
                                        form
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
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
                          {t("teamPlanner.analytics.teamAnalytics")}
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {t("teamPlanner.analytics.averagePointsPlayer")}
                            </span>
                            <span className="font-bold">
                              {userTeamData?.team_with_stats &&
                              userTeamData.team_with_stats.length > 0
                                ? (
                                    userTeamData.team_with_stats
                                      .filter((p) => p.position <= 11) // Only starting XI
                                      .reduce((sum, p) => {
                                        const livePoints =
                                          p.live_stats?.total_points || 0;
                                        const staticPoints =
                                          p.total_points || 0;
                                        return (
                                          sum +
                                          Math.max(livePoints, staticPoints)
                                        );
                                      }, 0) / 11
                                  ).toFixed(1)
                                : "0.0"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {t("teamPlanner.analytics.teamValue")}
                            </span>
                            <span className="font-bold text-green-600">
                              £
                              {userTeamData?.entry_history?.value
                                ? (
                                    userTeamData.entry_history.value / 10
                                  ).toFixed(1)
                                : userTeamData?.team_with_stats
                                ? (
                                    userTeamData.team_with_stats.reduce(
                                      (sum, p) => {
                                        const player = getPlayerById(
                                          p.player_id
                                        );
                                        return sum + (player?.now_cost || 0);
                                      },
                                      0
                                    ) / 10
                                  ).toFixed(1)
                                : "100.0"}
                              m
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {t("teamPlanner.analytics.weeklyRank")}
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
                          {t("teamPlanner.analytics.formationAnalysis")}
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {t("teamPlanner.analytics.currentFormation")}
                            </span>
                            <span className="font-bold">{formation}</span>
                          </div>
                          <div className="space-y-2">
                            {["GK", "DEF", "MID", "FWD"].map((pos, idx) => {
                              const positionPlayers =
                                userTeamData?.team_with_stats?.filter((tp) => {
                                  const player = getPlayerById(tp.player_id);
                                  return player?.element_type === idx + 1;
                                }) || [];

                              // Calculate average points for starting XI only
                              const startingPlayers = positionPlayers.filter(
                                (tp) => tp.position <= 11
                              );
                              const totalPoints = startingPlayers.reduce(
                                (sum, tp) => {
                                  const livePoints =
                                    tp.live_stats?.total_points || 0;
                                  const staticPoints = tp.total_points || 0;
                                  return (
                                    sum + Math.max(livePoints, staticPoints)
                                  );
                                },
                                0
                              );

                              const avgPoints =
                                startingPlayers.length > 0
                                  ? totalPoints / startingPlayers.length
                                  : 0;

                              // Calculate bench points for this position
                              const benchPlayers =
                                userTeamData?.team_with_stats?.filter((tp) => {
                                  const player = getPlayerById(tp.player_id);
                                  return (
                                    player?.element_type === idx + 1 &&
                                    tp.position > 11
                                  );
                                }) || [];

                              const benchCount = benchPlayers.length;

                              return (
                                <div
                                  key={pos}
                                  className="flex justify-between items-center text-sm"
                                >
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {pos} {t("teamPlanner.analytics.avgPoints")}
                                  </span>
                                  <span className="font-medium">
                                    {avgPoints.toFixed(1)} pts
                                    {benchCount > 0 && (
                                      <span className="text-xs text-gray-500 ml-1">
                                        ({benchCount}{" "}
                                        {t("teamPlanner.analytics.benchCount")})
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

                {/* Transfer Status Panel - Full Width */}
                {transferMode && (
                  <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="text-center sm:text-left">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t("teamPlanner.transfers.transfersOut")}
                          </p>
                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {pendingTransfers.transfersOut.length}
                          </p>
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t("teamPlanner.transfers.transfersIn")}
                          </p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {pendingTransfers.transfersIn.length}
                          </p>
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t("teamPlanner.transfers.availableBudget")}
                          </p>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            £{(availableBudget / 10).toFixed(1)}m
                          </p>
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t("teamPlanner.transfers.transferCost")}
                          </p>
                          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {transferCost} pts
                          </p>
                        </div>
                      </div>

                      {pendingTransfers.transfersOut.length > 0 && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={resetTransfers}
                            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                          >
                            {t("teamPlanner.transfers.reset")}
                          </button>
                          <button
                            disabled={
                              pendingTransfers.transfersOut.length !==
                                pendingTransfers.transfersIn.length ||
                              !validateSquad().isValid
                            }
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                            onClick={confirmTransfers}
                          >
                            {t("teamPlanner.transfers.confirmTransfers")}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Squad Validation */}
                    {transferMode &&
                      pendingTransfers.transfersOut.length > 0 && (
                        <div className="mt-4">
                          {(() => {
                            const validation = validateSquad();
                            return (
                              <div
                                className={`p-3 rounded-lg border ${
                                  validation.isValid
                                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                }`}
                              >
                                <h4
                                  className={`font-semibold text-sm mb-2 ${
                                    validation.isValid
                                      ? "text-green-800 dark:text-green-200"
                                      : "text-red-800 dark:text-red-200"
                                  }`}
                                >
                                  {t("teamPlanner.transfers.squadValidation")}{" "}
                                  {validation.isValid ? "✅" : "❌"}
                                </h4>
                                {!validation.isValid &&
                                  validation.errors.length > 0 && (
                                    <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                                      {validation.errors.map((error, idx) => (
                                        <li key={idx}>• {error}</li>
                                      ))}
                                    </ul>
                                  )}
                                {validation.isValid && (
                                  <p className="text-xs text-green-700 dark:text-green-300">
                                    {t("teamPlanner.transfers.squadValid")}
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                    {/* Pending Transfers List */}
                    {(pendingTransfers.transfersOut.length > 0 ||
                      pendingTransfers.transfersIn.length > 0) && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Players Out */}
                        {pendingTransfers.transfersOut.length > 0 && (
                          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                            <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                              {t("teamPlanner.transfers.playersOut")}
                            </h4>
                            <div className="space-y-2">
                              {pendingTransfers.transfersOut.map((playerId) => {
                                const player = getPlayerById(playerId);
                                const team = getTeamById(player?.team || 0);
                                return player ? (
                                  <div
                                    key={playerId}
                                    className="flex items-center justify-between bg-white dark:bg-gray-800 rounded p-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">
                                        {player.web_name}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        ({team?.short_name})
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">
                                        £{(player.now_cost / 10).toFixed(1)}m
                                      </span>
                                      <button
                                        onClick={() =>
                                          removePlayerOut(playerId)
                                        }
                                        className="w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}

                        {/* Players In */}
                        {pendingTransfers.transfersIn.length > 0 && (
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                              {t("teamPlanner.transfers.playersIn")}
                            </h4>
                            <div className="space-y-2">
                              {pendingTransfers.transfersIn.map(
                                (playerId, index) => {
                                  if (!playerId) return null; // Skip empty slots
                                  const player = getPlayerById(playerId);
                                  const team = getTeamById(player?.team || 0);
                                  const outPlayer = getPlayerById(
                                    pendingTransfers.transfersOut[index]
                                  );
                                  return player ? (
                                    <div
                                      key={`${playerId}-${index}`}
                                      className="flex items-center justify-between bg-white dark:bg-gray-800 rounded p-2"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">
                                          {player.web_name}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          ({team?.short_name})
                                        </span>
                                        {outPlayer && (
                                          <span className="text-xs text-blue-600 dark:text-blue-400">
                                            →{" "}
                                            {t(
                                              "teamPlanner.transfers.replaces"
                                            )}{" "}
                                            {outPlayer.web_name}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                          £{(player.now_cost / 10).toFixed(1)}m
                                        </span>
                                        <button
                                          onClick={() =>
                                            removePlayerIn(playerId)
                                          }
                                          className="w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    </div>
                                  ) : null;
                                }
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Player List below pitch */}
                <div className="mt-2 bg-theme-card border-t border-gray-200 dark:border-gray-700">
                  <div className="p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
                      <h3 className="text-lg font-semibold">
                        {transferMode
                          ? "Select Players to Buy"
                          : t("teamPlanner.transferMarket.title")}
                      </h3>
                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder={t("teamPlanner.transferMarket.search")}
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
                          <span className="hidden sm:inline">
                            {t("teamPlanner.transferMarket.filters")}
                          </span>
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
                      } bg-white dark:bg-gray-800 rounded-lg  border border-gray-200 dark:border-gray-700`}
                    >
                      {/* Table Header */}
                      <div className="bg-gray-50 dark:bg-gray-700 px-2 sm:px-4 py-2 sm:py-3 border-b border-gray-200 dark:border-gray-600">
                        {/* Desktop Header */}
                        <div className="hidden sm:grid sm:grid-cols-9 sm:gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <div className="col-span-3">
                            {t("teamPlanner.transferMarket.player")}
                          </div>
                          <div className="col-span-1">
                            {t("teamPlanner.transferMarket.pos")}
                          </div>
                          <div className="col-span-1">
                            {t("teamPlanner.transferMarket.price")}
                          </div>
                          <div className="col-span-1">
                            {t("teamPlanner.transferMarket.points")}
                          </div>
                          <div className="col-span-1">
                            {t("teamPlanner.transferMarket.form")}
                          </div>
                          <div className="col-span-1">
                            {t("teamPlanner.transferMarket.ownership")}
                          </div>
                          <div className="col-span-1">
                            {t("teamPlanner.transferMarket.status")}
                          </div>
                        </div>
                        {/* Mobile Header - More compact */}
                        <div className="flex sm:hidden justify-between text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight px-1">
                          <div className="flex-1 text-left">
                            {t("teamPlanner.transferMarket.player")}
                          </div>
                          <div className="w-12 text-center">Pts</div>
                          <div className="w-12 text-center">£</div>
                          <div className="w-8 text-center">%</div>
                        </div>
                      </div>

                      {/* Table Body */}
                      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                        {filteredPlayers.slice(0, 100).map((player) => {
                          const team = getTeamById(player.team);
                          const teamColor = getTeamColor(player.team);
                          const isSelected = transferMode
                            ? pendingTransfers.transfersIn.includes(
                                player.id
                              ) ||
                              pendingTransfers.transfersOut.includes(player.id)
                            : uiState.comparedPlayers.includes(player.id);
                          const isInMyTeam =
                            userTeamData?.team_with_stats?.some(
                              (tp) => tp.player_id === player.id
                            );
                          const canAfford = transferMode
                            ? canAffordPlayer(player.id)
                            : true;
                          const isTransferOut =
                            transferMode &&
                            pendingTransfers.transfersOut.includes(player.id);
                          const isTransferIn =
                            transferMode &&
                            pendingTransfers.transfersIn.includes(player.id);

                          return (
                            <motion.div
                              key={player.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className={`transition-colors relative ${
                                transferMode
                                  ? canAfford
                                    ? "hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer"
                                    : "opacity-60 cursor-not-allowed"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                              } ${
                                isSelected || isTransferIn
                                  ? "bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500"
                                  : isTransferOut
                                  ? "bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500"
                                  : isInMyTeam && transferMode
                                  ? "bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500"
                                  : ""
                              }`}
                              onClick={() => {
                                if (transferMode) {
                                  if (isInMyTeam && !isTransferOut) {
                                    // Player is in my team, mark for transfer out
                                    addPlayerOut(player.id);
                                  } else if (!isInMyTeam && !isTransferIn) {
                                    // Player not in my team, try to add them
                                    if (canAffordPlayer(player.id)) {
                                      // Check if we have transfer out slot for this position
                                      const hasCompatibleOut =
                                        pendingTransfers.transfersOut.some(
                                          (outId, index) => {
                                            if (
                                              pendingTransfers.transfersIn[
                                                index
                                              ]
                                            )
                                              return false; // Slot already filled
                                            const outPlayer =
                                              getPlayerById(outId);
                                            return (
                                              outPlayer &&
                                              outPlayer.element_type ===
                                                player.element_type
                                            );
                                          }
                                        );

                                      if (hasCompatibleOut) {
                                        addPlayerIn(player.id);
                                      } else {
                                        alert(
                                          `No ${getPlayerPosition(
                                            player.element_type
                                          )} selected for transfer out!`
                                        );
                                      }
                                    } else {
                                      alert(
                                        "Not enough budget for this player!"
                                      );
                                    }
                                  } else if (isTransferOut) {
                                    // Already marked for transfer out, remove from transfer out
                                    removePlayerOut(player.id);
                                  } else if (isTransferIn) {
                                    // Already marked for transfer in, remove from transfer in
                                    removePlayerIn(player.id);
                                  }
                                } else if (uiState.compareMode) {
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
                              {/* Desktop Layout */}
                              <div className="hidden sm:grid sm:grid-cols-9 sm:gap-2 px-4 py-3">
                                {/* Player Info */}
                                <div className="col-span-3 flex items-center space-x-2">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white relative"
                                    style={{
                                      backgroundColor: teamColor.primary,
                                    }}
                                  >
                                    {player.web_name.charAt(0)}
                                    {/* Transfer Status Indicators */}
                                    {transferMode && (
                                      <>
                                        {isTransferOut && (
                                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs">
                                              -
                                            </span>
                                          </div>
                                        )}
                                        {isTransferIn && (
                                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs">
                                              +
                                            </span>
                                          </div>
                                        )}
                                        {isInMyTeam &&
                                          !isTransferOut &&
                                          !isTransferIn && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                              <span className="text-white text-xs">
                                                ★
                                              </span>
                                            </div>
                                          )}
                                      </>
                                    )}
                                    {/* Enhanced indicators - only show if not in transfer mode */}
                                    {!transferMode &&
                                      player.price_trend === "rising" && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                                          <TrendingUp className="w-1.5 h-1.5 text-white" />
                                        </div>
                                      )}
                                    {!transferMode &&
                                      player.price_trend === "falling" && (
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
                                        {player.cost_change_event > 0
                                          ? "+"
                                          : ""}
                                        {(
                                          player.cost_change_event / 10
                                        ).toFixed(1)}
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
                                        ↗{" "}
                                        {t("teamPlanner.transferMarket.rising")}
                                      </span>
                                    )}
                                    {player.ownership_trend === "falling" && (
                                      <span className="text-xs text-purple-500">
                                        ↘{" "}
                                        {t(
                                          "teamPlanner.transferMarket.falling"
                                        )}
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
                                    {player.availability_status ===
                                      "injured" && (
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
                              </div>

                              {/* Mobile Layout - Compact */}
                              <div className="flex sm:hidden items-center justify-between px-2 py-2">
                                {/* Player Info - Left side */}
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white relative flex-shrink-0"
                                    style={{
                                      backgroundColor: teamColor.primary,
                                    }}
                                  >
                                    {player.web_name.charAt(0)}
                                    {/* Mobile Transfer Status Indicators */}
                                    {transferMode && (
                                      <>
                                        {isTransferOut && (
                                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs">
                                              -
                                            </span>
                                          </div>
                                        )}
                                        {isTransferIn && (
                                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs">
                                              +
                                            </span>
                                          </div>
                                        )}
                                        {isInMyTeam &&
                                          !isTransferOut &&
                                          !isTransferIn && (
                                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                                              <span className="text-white text-xs">
                                                ★
                                              </span>
                                            </div>
                                          )}
                                      </>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1">
                                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                        {player.web_name}
                                      </p>
                                      <span
                                        className={`inline-flex items-center px-1 rounded text-xs font-medium ${
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
                                      {/* Status indicator */}
                                      {player.availability_status ===
                                        "available" && (
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                      )}
                                      {player.availability_status ===
                                        "doubtful" && (
                                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                                      )}
                                      {player.availability_status ===
                                        "injured" && (
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {team?.short_name}
                                      </p>
                                      <span className="text-xs text-gray-400">
                                        F:{parseFloat(player.form).toFixed(1)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Stats - Right side */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  {/* Points */}
                                  <div className="text-center w-12">
                                    <div className="text-xs font-bold text-green-600">
                                      {player.total_points}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {player.event_points}
                                    </div>
                                  </div>

                                  {/* Price */}
                                  <div className="text-center w-12">
                                    <div className="text-xs font-medium">
                                      {(player.now_cost / 10).toFixed(1)}
                                    </div>
                                    {player.cost_change_event !== 0 && (
                                      <div
                                        className={`text-xs ${
                                          player.cost_change_event > 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        {player.cost_change_event > 0
                                          ? "+"
                                          : ""}
                                        {(
                                          player.cost_change_event / 10
                                        ).toFixed(1)}
                                      </div>
                                    )}
                                  </div>

                                  {/* Ownership */}
                                  <div className="text-center w-8">
                                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                      {parseFloat(
                                        player.selected_by_percent
                                      ).toFixed(0)}
                                      %
                                    </div>
                                    {player.ownership_trend === "rising" && (
                                      <div className="text-xs text-blue-500">
                                        ↗
                                      </div>
                                    )}
                                    {player.ownership_trend === "falling" && (
                                      <div className="text-xs text-purple-500">
                                        ↘
                                      </div>
                                    )}
                                  </div>
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
                            {t("teamPlanner.transferMarket.showingPlayers", {
                              current: Math.min(100, filteredPlayers.length),
                              total: filteredPlayers.length,
                            })}
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
                  {t("teamPlanner.widgets.liveInsights")}
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
                    {t("teamPlanner.widgets.compare")}
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

      {/* Loading overlay while checking manager ID */}
      {isCheckingManagerId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">
                Checking your account...
              </span>
            </div>
          </div>
        </div>
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

      {/* AI Team Analysis Modal */}
      {showAIChat && session?.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <FaRobot className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold">
                  {i18n.language === "bs"
                    ? "AI Analiza Tima"
                    : "AI Team Analysis"}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    {i18n.language === "bs" ? "(1x sedmično)" : "(1x weekly)"}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setShowAIChat(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {!aiAnalysis && !aiChatLoading && canUseAI && (
                <div className="text-center py-8">
                  <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg p-6 mb-4">
                    <FaRobot className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold mb-2">
                      {i18n.language === "bs"
                        ? "AI Analiza Tima"
                        : "AI Team Analysis"}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {i18n.language === "bs"
                        ? "Dobijte personalizovanu analizu vašeg FPL tima sa preporukama za poboljšanja."
                        : "Get personalized analysis of your FPL team with improvement recommendations."}
                    </p>
                    <button
                      onClick={requestAIAnalysis}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
                    >
                      <FaPaperPlane className="w-4 h-4 inline mr-2" />
                      {i18n.language === "bs"
                        ? "Analiziraj Moj Tim"
                        : "Analyze My Team"}
                    </button>
                  </div>
                </div>
              )}

              {aiChatLoading && (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {i18n.language === "bs"
                      ? "Analiziram vaš tim..."
                      : "Analyzing your team..."}
                  </p>
                </div>
              )}

              {aiAnalysis && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FaRobot className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-green-800 dark:text-green-200">
                        {i18n.language === "bs"
                          ? "AI Preporuke"
                          : "AI Recommendations"}
                      </h4>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div
                        className="whitespace-pre-wrap font-sans text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: aiAnalysis?.replace(
                            /\*\*(.*?)\*\*/g,
                            '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>'
                          ),
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {!canUseAI && lastAIUsage && (
                <div className="text-center py-8">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                    <div className="text-yellow-600 dark:text-yellow-400 mb-4">
                      <FaRobot className="w-8 h-8 mx-auto mb-2" />
                      <h4 className="font-semibold">
                        {i18n.language === "bs"
                          ? "Sedmični Limit Dostignut"
                          : "Weekly Limit Reached"}
                      </h4>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {i18n.language === "bs"
                        ? `Koristili ste AI analizu ove sedmice. Sledeca analiza dostupna ${new Date(
                            new Date(lastAIUsage).getTime() +
                              7 * 24 * 60 * 60 * 1000
                          ).toLocaleDateString()}.`
                        : `You've used AI analysis this week. Next analysis available ${new Date(
                            new Date(lastAIUsage).getTime() +
                              7 * 24 * 60 * 60 * 1000
                          ).toLocaleDateString()}.`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
