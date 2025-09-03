/**
 * Enhanced FPL Types for the Fantasy Planner component
 * Extends base FPL types with additional functionality for price tracking,
 * ownership changes, transfer analytics, and chip strategies
 */

import { FPLPlayer, FPLTeam, FPLGameweek } from './fpl';

// ====================================
// ENHANCED PLAYER DATA
// ====================================

export interface EnhancedPlayerData extends FPLPlayer {
  // Price tracking enhancements
  price_change_1h?: number;
  price_change_24h?: number;
  price_change_week?: number;
  price_trend: 'rising' | 'falling' | 'stable';
  predicted_price_change?: number;
  
  // Ownership tracking
  ownership_change_1h?: number;
  ownership_change_24h?: number;
  ownership_change_week?: number;
  ownership_trend: 'rising' | 'falling' | 'stable';
  ownership_rank?: number;
  
  // Transfer data
  transfers_in_1h?: number;
  transfers_out_1h?: number;
  net_transfers_1h?: number;
  transfers_in_24h?: number;
  transfers_out_24h?: number;
  net_transfers_24h?: number;
  transfer_momentum: 'high_in' | 'high_out' | 'stable' | 'volatile';
  
  // Performance metrics (additions only; do not override FPLPlayer fields)
  value_rank?: number;
  differential_score?: number; // Low ownership + high points
  
  // Injury/availability enhancements
  availability_status: 'available' | 'doubtful' | 'injured' | 'suspended' | 'unknown';
  injury_severity?: 'minor' | 'moderate' | 'major';
  return_date?: string;
  injury_update_time?: string;
  
  // Fixture analysis
  next_fixture_difficulty?: number;
  next_5_fixtures_difficulty?: number;
  fixture_count_next_5?: number;
  home_away_bias?: 'home' | 'away' | 'neutral';
  
  // Advanced stats
  captaincy_appeal?: number; // 0-100 score
  rotation_risk?: 'low' | 'medium' | 'high';
  fixture_ticker?: string; // "AVL(H) CHE(A) NEW(H)"
}

// ====================================
// PRICE CHANGE TRACKING
// ====================================

export interface PriceChange {
  player_id: number;
  web_name: string;
  team_name: string;
  position: string;
  old_price: number;
  new_price: number;
  change_amount: number;
  change_time: string;
  change_type: 'rise' | 'fall';
  predicted: boolean;
}

export interface PriceChangesResponse {
  risers: PriceChange[];
  fallers: PriceChange[];
  predicted_changes: PriceChange[];
  last_update: string;
  next_update_estimated: string;
}

// ====================================
// OWNERSHIP ANALYTICS
// ====================================

export interface OwnershipChange {
  player_id: number;
  web_name: string;
  team_name: string;
  position: string;
  current_ownership: number;
  ownership_change_1h: number;
  ownership_change_24h: number;
  ownership_trend: 'rising' | 'falling' | 'stable';
  momentum_score: number; // Rate of change
}

export interface OwnershipAnalytics {
  top_risers: OwnershipChange[];
  top_fallers: OwnershipChange[];
  trending_differentials: OwnershipChange[]; // Low ownership but rising
  ownership_analysis: {
    total_active_managers: number;
    average_ownership_change: number;
    volatile_players: number; // Players with high ownership swings
  };
  last_update: string;
}

// ====================================
// TRANSFER ANALYTICS
// ====================================

export interface TransferTrend {
  player_in_id: number;
  player_out_id: number;
  player_in_name: string;
  player_out_name: string;
  transfer_count: number;
  percentage_of_transfers: number;
  gameweek: number;
  trend_type: 'current' | 'planned';
}

export interface PlayerTransferData {
  player_id: number;
  web_name: string;
  team_name: string;
  position: string;
  transfers_in_count: number;
  transfers_out_count: number;
  net_transfers: number;
  transfer_momentum: 'accelerating' | 'steady' | 'slowing';
}

export interface TransferAnalytics {
  current_week: {
    top_transfers_in: PlayerTransferData[];
    top_transfers_out: PlayerTransferData[];
    popular_swaps: TransferTrend[];
  };
  future_weeks: {
    [week: number]: {
      planned_transfers: TransferTrend[];
      target_players: PlayerTransferData[];
    };
  };
  transfer_trends: {
    total_transfers_made: number;
    most_active_positions: string[];
    popular_price_ranges: Array<{
      range: string;
      transfer_count: number;
    }>;
  };
  last_update: string;
}

// ====================================
// CHIP STRATEGIES
// ====================================

export interface ChipUsageData {
  chip_type: 'wildcard' | 'freehit' | 'benchboost' | 'triplecaptain';
  gameweek: number;
  usage_count: number;
  percentage_of_active_managers: number;
  success_rate?: number; // Average points gained
  optimal_conditions?: string[];
}

export interface ChipStrategy {
  chip_type: 'wildcard' | 'freehit' | 'benchboost' | 'triplecaptain';
  recommended_weeks: number[];
  usage_pattern: 'early' | 'mid' | 'late';
  success_factors: string[];
  current_season_trends: ChipUsageData[];
}

export interface ChipAnalytics {
  strategies: ChipStrategy[];
  historical_data: {
    [chip: string]: ChipUsageData[];
  };
  personalized_recommendations?: {
    next_optimal_chip: string;
    recommended_week: number;
    reasoning: string[];
  };
  last_update: string;
}

// ====================================
// ENHANCED FILTERING
// ====================================

export interface EnhancedFilterState {
  // Basic filters (existing)
  position: number[];
  teams: number[];
  priceRange: [number, number];
  formRating: number;
  availability: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search: string;
  
  // Enhanced price filters
  priceChangeMin?: number;
  priceChangeMax?: number;
  priceChangePeriod: '1h' | '24h' | 'week';
  
  // Ownership filters
  ownershipMin?: number;
  ownershipMax?: number;
  ownershipTrend: ('rising' | 'falling' | 'stable')[];
  ownershipChangePeriod: '1h' | '24h' | 'week';
  
  // Transfer filters
  transfersInMin?: number;
  transfersOutMin?: number;
  netTransfersMin?: number;
  transferMomentum: string[];
  
  // Performance filters
  formMin?: number;
  valueMin?: number;
  differentialMin?: number; // For differential players
  
  // Fixture difficulty
  nextFixtureDifficulty: number[];
  fixtureCount: number;
  fixtureHorizon: 3 | 5 | 8; // Next X gameweeks
  
  // Advanced filters
  rotationRisk: ('low' | 'medium' | 'high')[];
  injuryStatus: ('available' | 'doubtful' | 'injured')[];
  captaincyAppealMin?: number;
  
  // Search mode
  searchMode: 'basic' | 'advanced';
  includeInjured: boolean;
  includeSuspended: boolean;
}

// ====================================
// TRANSFER PLANNING
// ====================================

export interface TransferPlan {
  id: string;
  name: string;
  gameweek: number;
  transfers: Array<{
    player_out_id: number;
    player_in_id: number;
    player_out_name: string;
    player_in_name: string;
    cost: number; // In points if using paid transfer
    reasoning: string[];
  }>;
  total_cost: number; // Total points cost
  free_transfers_used: number;
  paid_transfers: number;
  expected_points_gain: number;
  risk_level: 'low' | 'medium' | 'high';
  confidence_score: number; // 0-100
  created_at: string;
  executed: boolean;
}

export interface TransferPlanningState {
  current_plan?: TransferPlan;
  saved_plans: TransferPlan[];
  planning_horizon: number; // Number of weeks to plan ahead
  transfer_budget: {
    free_transfers: number;
    points_budget: number; // How many points willing to spend
    weeks_until_wildcard?: number;
  };
}

// ====================================
// MATCH ANALYTICS
// ====================================

export interface LiveMatchData {
  fixture_id: number;
  team_h_id: number;
  team_a_id: number;
  kickoff_time: string;
  started: boolean;
  finished: boolean;
  team_h_score?: number;
  team_a_score?: number;
  minutes: number;
  provisional_start_time: boolean;
  stats: Array<{
    identifier: string;
    a: Array<{ element: number; value: number }>;
    h: Array<{ element: number; value: number }>;
  }>;
}

// ====================================
// ENHANCED UI STATE
// ====================================

export interface EnhancedUIState {
  currentView: 'pitch' | 'list' | 'analytics';
  sidebarCollapsed: boolean;
  activeWidget: 'price_changes' | 'ownership' | 'transfers' | 'chips' | 'none';
  selectedPlayer?: EnhancedPlayerData;
  compareMode: boolean;
  comparedPlayers: number[];
  filtersVisible: boolean;
  transferPanelOpen: boolean;
  
  // Mobile optimizations
  touchMode: boolean;
  swipeEnabled: boolean;
  compactView: boolean;
}

// ====================================
// API RESPONSE WRAPPERS
// ====================================

export interface EnhancedFPLResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  cache_hit: boolean;
  metadata?: {
    total_count?: number;
    page?: number;
    per_page?: number;
    has_more?: boolean;
  };
}

// ====================================
// WIDGET DATA INTERFACES
// ====================================

export interface PriceChangesWidgetData {
  risers: Array<{
    player_id: number;
    web_name: string;
    team_name: string;
    old_price: number;
    new_price: number;
    change: number;
    team_colors: { primary: string; secondary: string };
  }>;
  fallers: Array<{
    player_id: number;
    web_name: string;
    team_name: string;
    old_price: number;
    new_price: number;
    change: number;
    team_colors: { primary: string; secondary: string };
  }>;
  user_team_impact?: {
    affected_players: number;
    total_value_change: number;
  };
}

export interface OwnershipChangesWidgetData {
  risers: Array<{
    player_id: number;
    web_name: string;
    team_name: string;
    ownership: number;
    change: number;
    team_colors: { primary: string; secondary: string };
  }>;
  fallers: Array<{
    player_id: number;
    web_name: string;
    team_name: string;
    ownership: number;
    change: number;
    team_colors: { primary: string; secondary: string };
  }>;
  timeframe: '1h' | '24h' | 'week';
}

export interface TransferTrendsWidgetData {
  current_transfers: Array<{
    player_in: {
      id: number;
      name: string;
      team: string;
    };
    player_out: {
      id: number;
      name: string;
      team: string;
    };
    count: number;
  }>;
  top_players_in: Array<{
    player_id: number;
    web_name: string;
    team_name: string;
    transfers_count: number;
    team_colors: { primary: string; secondary: string };
  }>;
  top_players_out: Array<{
    player_id: number;
    web_name: string;
    team_name: string;
    transfers_count: number;
    team_colors: { primary: string; secondary: string };
  }>;
  future_transfers?: {
    [week: number]: Array<{
      player_in: { id: number; name: string; team: string };
      player_out: { id: number; name: string; team: string };
      count: number;
    }>;
  };
}

export interface ChipStrategiesWidgetData {
  chips: Array<{
    type: 'wildcard' | 'freehit' | 'benchboost' | 'triplecaptain';
    optimal_weeks: Array<{
      week: number;
      usage_count: number;
      success_rate?: number;
    }>;
    current_season_trend: 'early' | 'mid' | 'late' | 'distributed';
  }>;
  recommendations?: {
    next_chip: string;
    recommended_week: number;
    confidence: number;
  };
}

// ====================================
// FORMATION AND PITCH LAYOUT
// ====================================

export interface FormationLayout {
  formation: string; // e.g., "3-4-3", "4-3-3"
  positions: {
    goalkeepers: Array<{ x: number; y: number }>;
    defenders: Array<{ x: number; y: number }>;
    midfielders: Array<{ x: number; y: number }>;
    forwards: Array<{ x: number; y: number }>;
  };
  pitch_dimensions: {
    width: number;
    height: number;
  };
}

export interface PitchPlayerPosition {
  player_id: number;
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from bottom (0-100)
  position_type: 'GK' | 'DEF' | 'MID' | 'FWD';
  is_captain: boolean;
  is_vice_captain: boolean;
}
