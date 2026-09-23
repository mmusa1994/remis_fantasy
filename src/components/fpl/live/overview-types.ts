import type { FPLGameweekStatus } from "@/types/fpl";

/** FPL `entry` summary as returned by /api/fpl/load-team (`data.manager`). */
export interface OverviewManager {
  id: number;
  player_first_name: string;
  player_last_name: string;
  name: string;
  summary_overall_points: number;
  summary_overall_rank: number;
  summary_event_points: number;
  summary_event_rank: number;
  player_region_iso_code_short?: string;
  player_region_iso_code_long?: string;
  player_region_name?: string;
  current_event?: number;
  last_deadline_bank?: number;
  last_deadline_total_transfers?: number;
  last_deadline_value?: number;
  years_active?: number;
}

export interface OverviewAutoSub {
  outId: number;
  inId: number;
  reason?: string;
}

export interface OverviewTeamTotals {
  goals: number;
  assists: number;
  clean_sheets: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  predicted_bonus: number;
  final_bonus: number;
  active_points_final?: number;
  bench_points_final?: number;
  with_autosubs?: {
    live_points_gross: number;
    live_points_net: number;
    live_total: number;
    auto_subs_applied?: OverviewAutoSub[];
    captain_promoted?: { fromId: number; toId: number } | null;
  };
}

/** One squad entry from /api/fpl/load-team (`data.team_with_stats`). */
export interface OverviewSquadPlayer {
  player_id: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  player: {
    id: number;
    web_name: string;
    team: number;
    team_code?: number;
    element_type: number;
  } | null;
  live_stats: {
    minutes: number;
    total_points: number;
    bonus: number;
  } | null;
}

/** `entry_history` of the picks response for the loaded gameweek. */
export interface OverviewEntryHistory {
  event: number;
  points: number;
  total_points: number;
  rank: number | null;
  overall_rank: number | null;
  percentile_rank?: number | null;
  bank: number;
  value: number;
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
}

interface KitFields {
  team: number;
  team_code?: number | null;
  element_type?: number | null;
}

export type OverviewDifferential = FPLGameweekStatus["differentials"][number] &
  Partial<KitFields> & { base_points?: number; multiplier?: number };

export interface OverviewTemplateCaptain extends KitFields {
  player_id: number;
  web_name: string;
  base_points: number;
  points: number;
}

export type OverviewCaptainAnalysis = NonNullable<FPLGameweekStatus["captain_analysis"]> &
  Partial<KitFields> & {
    base_points?: number;
    multiplier?: number;
    template_captain?: OverviewTemplateCaptain | null;
    points_vs_template?: number | null;
  };

/** /api/fpl/gameweek-status payload, including the newer optional fields. */
export interface OverviewGameweekStatus
  extends Omit<FPLGameweekStatus, "differentials" | "threats" | "captain_analysis"> {
  differentials: OverviewDifferential[];
  threats: OverviewDifferential[];
  captain_analysis: OverviewCaptainAnalysis | null;
  overall_rank?: number | null;
  previous_overall_rank?: number | null;
  gameweek_rank?: number | null;
  total_points?: number | null;
  percentile_rank?: number | null;
  average_score?: number | null;
  highest_score?: number | null;
  points_on_bench?: number | null;
  event_transfers?: number | null;
  event_transfers_cost?: number | null;
  bank?: number | null;
  value?: number | null;
  active_chip?: string | null;
  chips_played?: Array<{ name: string; event: number }>;
  rank_history?: Array<{
    event: number;
    points: number;
    total_points: number;
    rank: number;
    overall_rank: number;
  }>;
  event_finished?: boolean;
  event_data_checked?: boolean;
  event_is_current?: boolean;
}

/** FPL chip ids → short tag used in tables. */
export const CHIP_SHORT: Record<string, string> = {
  wildcard: "WC",
  freehit: "FH",
  bboost: "BB",
  "3xc": "TC",
  manager: "AM",
};
