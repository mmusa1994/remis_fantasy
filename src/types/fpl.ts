/**
 * Comprehensive TypeScript interfaces for all FPL API responses
 * Based on official Fantasy Premier League API structure
 */

// ====================================
// BOOTSTRAP STATIC DATA INTERFACES
// ====================================

export interface FPLBootstrapResponse {
  elements: FPLPlayer[];
  teams: FPLTeam[];
  element_types: FPLElementType[];
  events: FPLGameweek[];
  game_settings: FPLGameSettings;
  phases: FPLPhase[];
  total_players: number;
}

export interface FPLPlayer {
  id: number;
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  team_code: number;
  element_type: number;
  now_cost: number;
  total_points: number;
  status: 'a' | 'd' | 'i' | 'n' | 's' | 'u'; // Available, Doubtful, Injured, Not available, Suspended, Unavailable
  photo: string;
  selected_by_percent: string;
  ep_this: string | null; // Expected points this gameweek
  ep_next: string | null; // Expected points next gameweek
  form: string;
  points_per_game: string;
  news: string;
  news_added: string | null;
  chance_of_playing_this_round: number | null;
  chance_of_playing_next_round: number | null;
  value_form: string;
  value_season: string;
  cost_change_event: number;
  cost_change_event_fall: number;
  cost_change_start: number;
  cost_change_start_fall: number;
  dreamteam_count: number;
  event_points: number;
  in_dreamteam: boolean;
  transfers_in: number;
  transfers_out: number;
  transfers_in_event: number;
  transfers_out_event: number;
  loans_in: number;
  loans_out: number;
  loaned_in: number;
  loaned_out: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  starts: number;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
  influence_rank: number;
  influence_rank_type: number;
  creativity_rank: number;
  creativity_rank_type: number;
  threat_rank: number;
  threat_rank_type: number;
  ict_index_rank: number;
  ict_index_rank_type: number;
  corners_and_indirect_freekicks_order: number | null;
  corners_and_indirect_freekicks_text: string;
  direct_freekicks_order: number | null;
  direct_freekicks_text: string;
  penalties_order: number | null;
  penalties_text: string;
  expected_goals_per_90: number;
  saves_per_90: number;
  expected_assists_per_90: number;
  expected_goal_involvements_per_90: number;
  expected_goals_conceded_per_90: number;
  goals_conceded_per_90: number;
  now_cost_rank: number;
  now_cost_rank_type: number;
  form_rank: number;
  form_rank_type: number;
  points_per_game_rank: number;
  points_per_game_rank_type: number;
  selected_rank: number;
  selected_rank_type: number;
  starts_per_90: number;
  clean_sheets_per_90: number;
}

export interface FPLTeam {
  id: number;
  name: string;
  short_name: string;
  code: number;
  draw: number;
  form: string | null;
  loss: number;
  played: number;
  points: number;
  position: number;
  strength: number;
  team_division: number | null;
  unavailable: boolean;
  win: number;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
  pulse_id: number;
}

export interface FPLElementType {
  id: number;
  plural_name: string;
  plural_name_short: string;
  singular_name: string;
  singular_name_short: string;
  squad_select: number;
  squad_min_select: number;
  squad_max_select: number;
  squad_min_play: number;
  squad_max_play: number;
  ui_shirt_specific: boolean;
  sub_positions_locked: number[];
  element_count: number;
}

export interface FPLGameweek {
  id: number;
  name: string;
  deadline_time: string;
  deadline_time_epoch: number;
  deadline_time_game_offset: number;
  finished: boolean;
  data_checked: boolean;
  highest_scoring_entry: number | null;
  highest_score: number | null;
  is_previous: boolean;
  is_current: boolean;
  is_next: boolean;
  cup_leagues_created: boolean;
  h2h_ko_matches_created: boolean;
  ranked_count: number;
  chip_plays: FPLChipPlay[];
  most_selected: number | null;
  most_transferred_in: number | null;
  top_element: number | null;
  top_element_info: {
    id: number;
    points: number;
  } | null;
  transfers_made: number;
  most_captained: number | null;
  most_vice_captained: number | null;
  average_entry_score: number;
}

export interface FPLChipPlay {
  chip_name: string;
  num_played: number;
}

export interface FPLGameSettings {
  league_join_private_max: number;
  league_join_public_max: number;
  league_max_size_public_classic: number;
  league_max_size_public_h2h: number;
  league_max_size_private_h2h: number;
  league_max_ko_rounds_private_h2h: number;
  league_prefix_public: string;
  league_points_h2h_win: number;
  league_points_h2h_lose: number;
  league_points_h2h_draw: number;
  league_ko_first_instead_of_random: boolean;
  cup_start_event_id: number;
  cup_stop_event_id: number;
  cup_qualifying_method: string;
  cup_type: string;
  squad_squadplay: number;
  squad_squadsize: number;
  squad_team_limit: number;
  squad_total_spend: number;
  ui_currency_multiplier: number;
  ui_use_special_shirts: boolean;
  ui_special_shirt_exclusions: number[];
  stats_form_days: number;
  sys_vice_captain_enabled: boolean;
  transfers_cap: number;
  transfers_sell_on_fee: number;
  league_h2h_tiebreak_stats: string[];
  timezone: string;
}

export interface FPLPhase {
  id: number;
  name: string;
  start_event: number;
  stop_event: number;
}

// ====================================
// PLAYER SPECIFIC DATA INTERFACES
// ====================================

export interface FPLPlayerSummaryResponse {
  fixtures: FPLPlayerFixture[];
  history: FPLPlayerGameweekHistory[];
  history_past: FPLPlayerSeasonHistory[];
}

export interface FPLPlayerFixture {
  id: number;
  code: number;
  team_h: number;
  team_h_score: number | null;
  team_a: number;
  team_a_score: number | null;
  event: number;
  finished: boolean;
  minutes: number;
  provisional_start_time: boolean;
  kickoff_time: string;
  event_name: string;
  is_home: boolean;
  difficulty: number;
}

export interface FPLPlayerGameweekHistory {
  element: number;
  fixture: number;
  opponent_team: number;
  total_points: number;
  was_home: boolean;
  kickoff_time: string;
  team_h_score: number;
  team_a_score: number;
  round: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  starts: number;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
  value: number;
  transfers_balance: number;
  selected: number;
  transfers_in: number;
  transfers_out: number;
}

export interface FPLPlayerSeasonHistory {
  season_name: string;
  element_code: number;
  start_cost: number;
  end_cost: number;
  total_points: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  starts: number;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
}

// ====================================
// TEAM/MANAGER SPECIFIC INTERFACES
// ====================================

export interface FPLManagerEntry {
  id: number;
  joined_time: string;
  started_event: number;
  favourite_team: number | null;
  player_first_name: string;
  player_last_name: string;
  player_region_name: string;
  player_region_id: number;
  player_region_short_iso: string;
  summary_overall_points: number;
  summary_overall_rank: number;
  summary_event_points: number;
  summary_event_rank: number | null;
  current_event: number;
  leagues: {
    classic: FPLManagerLeague[];
    h2h: FPLManagerLeague[];
    cup: FPLManagerCup;
    cup_matches: any[];
  };
  name: string;
  name_change_blocked: boolean;
  entered_events: number[];
  kit: string | null;
  last_deadline_bank: number;
  last_deadline_value: number;
  last_deadline_total_transfers: number;
}

export interface FPLManagerLeague {
  id: number;
  name: string;
  short_name: string | null;
  created: string;
  closed: boolean;
  rank: number | null;
  max_entries: number | null;
  league_type: string;
  scoring: string;
  admin_entry: number | null;
  start_event: number;
  entry_can_leave: boolean;
  entry_can_admin: boolean;
  entry_can_invite: boolean;
  has_cup: boolean;
  cup_league: number | null;
  cup_qualified: boolean | null;
  entry_rank: number;
  entry_last_rank: number;
}

export interface FPLManagerCup {
  matches: any[];
  status: {
    qualification_event: number | null;
    qualification_numbers: number | null;
    qualification_rank: number | null;
    qualification_state: string | null;
  };
  cup_league: number | null;
}

export interface FPLManagerPicks {
  active_chip: string | null;
  automatic_subs: FPLAutomaticSub[];
  entry_history: FPLManagerGameweekHistory;
  picks: FPLManagerPick[];
}

export interface FPLAutomaticSub {
  element_in: number;
  element_out: number;
  event: number;
}

export interface FPLManagerGameweekHistory {
  event: number;
  points: number;
  total_points: number;
  rank: number;
  rank_sort: number;
  overall_rank: number;
  percentile_rank: number;
  bank: number;
  value: number;
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
}

export interface FPLManagerPick {
  element: number;
  position: number;
  selling_price: number;
  multiplier: number;
  purchase_price: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

export interface FPLManagerHistory {
  current: FPLManagerSeasonEntry[];
  past: FPLManagerPastSeason[];
  chips: FPLManagerChip[];
}

export interface FPLManagerSeasonEntry {
  event: number;
  points: number;
  total_points: number;
  rank: number;
  rank_sort: number;
  overall_rank: number;
  percentile_rank: number;
  bank: number;
  value: number;
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
}

export interface FPLManagerPastSeason {
  season_name: string;
  total_points: number;
  rank: number;
}

export interface FPLManagerChip {
  name: string;
  time: string;
  event: number;
}

export interface FPLTransferHistory {
  element_in: number;
  element_in_cost: number;
  element_out: number;
  element_out_cost: number;
  entry: number;
  event: number;
  time: string;
}

// ====================================
// LEAGUE INTERFACES
// ====================================

export interface FPLClassicLeagueResponse {
  new_entries: {
    has_next: boolean;
    page: number;
    results: FPLLeagueNewEntry[];
  };
  last_updated_data: string;
  league: FPLLeagueInfo;
  standings: {
    has_next: boolean;
    page: number;
    results: FPLClassicLeagueEntry[];
  };
}

export interface FPLH2HLeagueResponse {
  new_entries: {
    has_next: boolean;
    page: number;
    results: FPLLeagueNewEntry[];
  };
  last_updated_data: string;
  league: FPLLeagueInfo;
  standings: {
    has_next: boolean;
    page: number;
    results: FPLH2HLeagueEntry[];
  };
}

export interface FPLLeagueInfo {
  id: number;
  name: string;
  created: string;
  closed: boolean;
  max_entries: number | null;
  league_type: string;
  scoring: string;
  admin_entry: number | null;
  start_event: number;
  code_privacy: string;
  has_cup: boolean;
  cup_league: number | null;
  rank: number | null;
  size: number;
  league_entry_request: string | null;
  cup_qualified: boolean | null;
}

export interface FPLLeagueNewEntry {
  id: number;
  joined_time: string;
  player_first_name: string;
  player_last_name: string;
  entry: number;
  entry_name: string;
}

export interface FPLClassicLeagueEntry {
  id: number;
  event_total: number;
  player_name: string;
  rank: number;
  last_rank: number;
  rank_sort: number;
  total: number;
  entry: number;
  entry_name: string;
}

export interface FPLH2HLeagueEntry {
  id: number;
  player_name: string;
  rank: number;
  last_rank: number;
  rank_sort: number;
  total: number;
  entry: number;
  entry_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points_for: number;
  points_against: number;
}

export interface FPLH2HMatches {
  has_next: boolean;
  page: number;
  results: FPLH2HMatch[];
}

export interface FPLH2HMatch {
  id: number;
  entry_1_entry: number;
  entry_1_name: string;
  entry_1_player_name: string;
  entry_1_points: number;
  entry_1_win: number;
  entry_1_draw: number;
  entry_1_loss: number;
  entry_1_total: number;
  entry_2_entry: number;
  entry_2_name: string;
  entry_2_player_name: string;
  entry_2_points: number;
  entry_2_win: number;
  entry_2_draw: number;
  entry_2_loss: number;
  entry_2_total: number;
  is_knockout: boolean;
  league: number;
  winner: number | null;
  seed_value: number | null;
  event: number;
  tiebreak: number | null;
  is_bye: boolean;
  knockout_name: string;
}

// ====================================
// FIXTURES AND LIVE DATA INTERFACES
// ====================================

export interface FPLFixture {
  code: number;
  event: number;
  finished: boolean;
  finished_provisional: boolean;
  id: number;
  kickoff_time: string;
  minutes: number;
  provisional_start_time: boolean;
  started: boolean;
  team_a: number;
  team_a_score: number | null;
  team_h: number;
  team_h_score: number | null;
  stats: FPLFixtureStat[];
  team_h_difficulty: number;
  team_a_difficulty: number;
  pulse_id: number;
}

export interface FPLFixtureStat {
  identifier: string;
  a: FPLFixtureStatElement[];
  h: FPLFixtureStatElement[];
}

export interface FPLFixtureStatElement {
  value: number;
  element: number;
}

export interface FPLLiveResponse {
  elements: FPLLiveElement[];
}

export interface FPLLiveElement {
  id: number;
  stats: FPLLiveElementStats;
  explain: FPLLiveExplain[];
}

export interface FPLLiveElementStats {
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  starts: number;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
  total_points: number;
  in_dreamteam: boolean;
}

export interface FPLLiveExplain {
  fixture: number;
  stats: FPLLiveExplainStat[];
}

export interface FPLLiveExplainStat {
  identifier: string;
  points: number;
  value: number;
}

// ====================================
// STATS AND MARKET DATA INTERFACES
// ====================================

export interface FPLEventStatus {
  status: FPLEventStatusEntry[];
}

export interface FPLEventStatusEntry {
  bonus_added: boolean;
  date: string;
  event: number;
  points: string;
}

export interface FPLDreamTeam {
  team: FPLDreamTeamEntry[];
  top_player: FPLDreamTeamTopPlayer;
}

export interface FPLDreamTeamEntry {
  id: number;
  points: number;
  position: number;
}

export interface FPLDreamTeamTopPlayer {
  id: number;
  points: number;
}

// ====================================
// ENHANCED ANALYSIS INTERFACES
// ====================================

export interface FPLDifferentialPlayer {
  player_id: number;
  web_name: string;
  points: number;
  ownership_percentage: number;
  impact_percentage: number;
  is_positive: boolean;
  team: number;
}

export interface FPLCaptainAnalysis {
  player_id: number;
  web_name: string;
  points: number;
  average_captain_points: number;
  points_above_average: number;
  is_above_average: boolean;
}

export interface FPLGameweekStatus {
  arrow_direction: 'green' | 'red' | 'neutral';
  rank_change: number;
  gameweek_points: number;
  safety_score: number;
  differentials: FPLDifferentialPlayer[];
  threats: FPLDifferentialPlayer[];
  captain_analysis: FPLCaptainAnalysis | null;
  clone_count: number;
}

// ====================================
// SERVICE RESPONSE INTERFACES
// ====================================

export interface FPLServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  cache_hit?: boolean;
}

export interface FPLPaginatedResponse<T> extends FPLServiceResponse<T> {
  pagination?: {
    current_page: number;
    total_pages: number;
    page_size: number;
    total_count: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

// ====================================
// CACHE AND CONFIGURATION INTERFACES
// ====================================

export interface FPLCacheConfig {
  ttl: number; // Time to live in milliseconds
  key: string;
  stale_while_revalidate?: number;
}

export interface FPLServiceConfig {
  base_url: string;
  timeout: number;
  max_retries: number;
  retry_delay: number;
  rate_limit: {
    requests_per_second: number;
    burst_limit: number;
  };
  cache: {
    default_ttl: number;
    bootstrap_ttl: number;
    live_data_ttl: number;
    static_data_ttl: number;
  };
}