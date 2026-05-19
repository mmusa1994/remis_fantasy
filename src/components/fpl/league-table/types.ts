import type {
  FPLActiveChip,
  FPLAutoSubApplied,
  FPLCaptainPromotion,
  FPLChipEffects,
  FPLPlayerScoreDetail,
} from "@/types/fpl";

export interface ProcessedTeamPlayerDetail extends FPLPlayerScoreDetail {
  points: number;
  live_points: number;
  multiplier: number;
  position: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  opponent?: string;
  is_home?: boolean;
}

export interface ProcessedTeam {
  id: number;
  player_name: string;
  entry_name: string;
  rank: number;
  last_rank: number;
  rank_change: number;
  event_total: number;
  total: number;
  live_points: number;
  live_points_gross: number;
  live_points_net: number;
  live_total: number;
  captain: { name: string; points: number };
  players_to_play: number;
  active_chip: FPLActiveChip;
  chip_effects: FPLChipEffects;
  auto_subs_applied: FPLAutoSubApplied[];
  captain_promoted: FPLCaptainPromotion | null;
  picks: Array<{
    element: number;
    position: number;
    multiplier: number;
    is_captain: boolean;
    is_vice_captain: boolean;
  }>;
  event_transfers: number;
  event_transfers_cost: number;
  team_value: number;
  bank: number;
  player_details: ProcessedTeamPlayerDetail[];
}

export interface LeagueElementSummary {
  id: number;
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  element_type: number;
}

export interface FplTeamSummary {
  id: number;
  name: string;
  short_name: string;
}

export interface LeagueTableData {
  league: { id: string; name: string };
  gameweek: number;
  bonus_added: boolean;
  auto_subs_enabled: boolean;
  teams: ProcessedTeam[];
  elements: LeagueElementSummary[];
  fpl_teams: FplTeamSummary[];
  last_updated: string;
}

export type SortKey =
  | "live_total"
  | "live_points_gross"
  | "live_points_net"
  | "players_to_play"
  | "rank"
  | "transfers"
  | "team_value"
  | "active_chip";

export type SortDirection = "asc" | "desc";

export type ViewMode = "compact" | "detailed";

export interface FilterState {
  playerId: number | null;
  playerQuery: string;
  scope: "startingXI" | "own";
}
