// =============================================================
// Remis Predictor — Domain Types
// Mirrors db/sql/predictor-setup.sql
// =============================================================

export type TournamentStatus =
  | "draft"
  | "published"
  | "locked"
  | "finished";

export type TournamentVisibility = "public" | "private";

export type AccentColor =
  | "amber"
  | "purple"
  | "blue"
  | "red"
  | "green"
  | "gold";

export type CategoryType =
  | "single_choice"
  | "multiple_choice"
  | "ranked_top_n"
  | "team_selection"
  | "player_selection"
  | "exact_score"
  | "numeric"
  | "free_text";

export type CategoryVisibility = "public" | "private";

export type RuleKind =
  | "rule"
  | "bonus"
  | "info"
  | "deadline"
  | "eligibility";

export type PrizeType =
  | "cash"
  | "physical"
  | "voucher"
  | "vip"
  | "sponsor"
  | "fantasy_points"
  | "other";

export interface Tournament {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  long_description: string | null;
  banner_image_url: string | null;
  hero_image_url: string | null;
  logo_url: string | null;
  accent_color: AccentColor;
  status: TournamentStatus;
  visibility: TournamentVisibility;
  starts_at: string | null;
  ends_at: string | null;
  registration_lock_at: string | null;
  rules_md: string | null;
  point_system_md: string | null;
  eligibility_md: string | null;
  prize_pool_amount: number | null;
  prize_pool_currency: string | null;
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  sponsor_url: string | null;
  is_featured: boolean;
  sort_order: number;
  require_approval: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type MemberStatus = "pending" | "approved" | "rejected" | "banned";

export interface TournamentMember {
  id: string;
  tournament_id: string;
  user_id: string;
  user_email: string | null;
  user_display_name: string | null;
  status: MemberStatus;
  requested_at: string;
  approved_at: string | null;
  approved_by: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PredictionCategory {
  id: string;
  tournament_id: string;
  slug: string;
  name: string;
  description: string | null;
  rules_md: string | null;
  icon: string | null;
  category_type: CategoryType;
  max_selections: number;
  points_correct: number;
  points_partial: number;
  points_ranked_bonus: number;
  visibility: CategoryVisibility;
  lock_at: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PredictionOption {
  id: string;
  category_id: string;
  label: string;
  value: string | null;
  image_url: string | null;
  group_label: string | null;
  metadata: Record<string, unknown>;
  sort_order: number;
  is_correct: boolean;
  correct_rank: number | null;
  created_at: string;
}

export interface UserPrediction {
  id: string;
  tournament_id: string;
  category_id: string;
  user_id: string;
  user_email: string | null;
  user_display_name: string | null;
  selected_option_ids: string[];
  text_value: string | null;
  numeric_value: number | null;
  score_home: number | null;
  score_away: number | null;
  points_awarded: number;
  is_scored: boolean;
  locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface TournamentRule {
  id: string;
  tournament_id: string;
  kind: RuleKind;
  title: string;
  body_md: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TournamentReward {
  id: string;
  tournament_id: string;
  rank_position: number | null;
  title: string;
  description: string | null;
  prize_type: PrizeType;
  prize_value: number | null;
  prize_currency: string | null;
  image_url: string | null;
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  sponsor_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Aggregated tournament detail for public consumption
export interface TournamentDetail extends Tournament {
  categories: Array<PredictionCategory & { options: PredictionOption[] }>;
  rules: TournamentRule[];
  rewards: TournamentReward[];
}

// Standings row — kombinovani poeni iz kategorija + match prediction-a
export interface StandingsRow {
  user_id: string;
  user_display_name: string | null;
  user_email: string | null;
  total_points: number;
  category_points: number;
  match_points: number;
  predictions_count: number;
  correct_count: number;
  match_predictions_count: number;
  match_correct_count: number;
  rank: number;
}

// =============================================================
// Match-by-match predictions (UEFA UCL Predictor style)
// =============================================================

export type MatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled";

export type MatchStage =
  | "group"
  | "group_a"
  | "group_b"
  | "group_c"
  | "group_d"
  | "group_e"
  | "group_f"
  | "group_g"
  | "group_h"
  | "group_i"
  | "group_j"
  | "group_k"
  | "group_l"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final"
  | "other";

export interface Match {
  id: string;
  tournament_id: string;
  stage: string;
  stage_label: string | null;
  match_label: string | null;
  home_team: string;
  away_team: string;
  home_logo_url: string | null;
  away_logo_url: string | null;
  home_team_code: string | null;
  away_team_code: string | null;
  venue: string | null;
  kickoff_at: string | null;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  points_exact: number;
  points_diff: number;
  points_winner: number;
  sort_order: number;
  force_unlocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface MatchPrediction {
  id: string;
  match_id: string;
  tournament_id: string;
  user_id: string;
  user_email: string | null;
  user_display_name: string | null;
  home_score: number;
  away_score: number;
  points_awarded: number;
  is_scored: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubmitMatchPredictionItem {
  match_id: string;
  home_score: number;
  away_score: number;
}

// Submit prediction payload (one item per category)
export interface SubmitPredictionItem {
  category_id: string;
  selected_option_ids?: string[];
  text_value?: string;
  numeric_value?: number;
  score_home?: number;
  score_away?: number;
}

export interface SubmitPredictionsPayload {
  items: SubmitPredictionItem[];
}
