import { createClient } from "@supabase/supabase-js";
import { FPLBootstrapResponse, FPLPlayer, FPLTeam } from "./fpl-api";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface DBPlayer {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team: number;
  element_type: number;
  total_points: number;
  now_cost: number;
}

export interface DBTeam {
  id: number;
  name: string;
  short_name: string;
  code?: number;
}

class FPLDatabaseService {
  // Update players and teams data periodically
  async upsertBootstrapData(bootstrap: FPLBootstrapResponse): Promise<void> {
    try {
      await Promise.all([
        this.upsertPlayers(bootstrap.elements),
        this.upsertTeams(bootstrap.teams),
      ]);
    } catch (error) {
      console.error("Error upserting bootstrap data:", error);
      throw error;
    }
  }

  private async upsertPlayers(players: FPLPlayer[]): Promise<void> {
    const dbPlayers: DBPlayer[] = players.map((player) => ({
      id: player.id,
      web_name: player.web_name,
      first_name: player.first_name,
      second_name: player.second_name,
      team: player.team,
      element_type: player.element_type,
      total_points: player.total_points,
      now_cost: player.now_cost,
    }));

    const { error } = await supabaseAdmin
      .from("fpl_players")
      .upsert(dbPlayers, { onConflict: "id" });

    if (error) {
      throw new Error(`Error upserting players: ${error.message}`);
    }
  }

  private async upsertTeams(teams: FPLTeam[]): Promise<void> {
    const dbTeams: DBTeam[] = teams.map((team) => ({
      id: team.id,
      name: team.name,
      short_name: team.short_name,
      code: team.code,
    }));

    const { error } = await supabaseAdmin
      .from("fpl_teams")
      .upsert(dbTeams, { onConflict: "id" });

    if (error) {
      throw new Error(`Error upserting teams: ${error.message}`);
    }
  }

  // Get player data from database (for displaying names, teams, etc.)
  async getPlayersData(playerIds: number[]) {
    const { data, error } = await supabaseAdmin
      .from("fpl_players")
      .select("*")
      .in("id", playerIds);

    if (error) {
      throw new Error(`Error fetching players data: ${error.message}`);
    }

    return data || [];
  }

  // Get all players data
  async getAllPlayers() {
    const { data, error } = await supabaseAdmin.from("fpl_players").select("*");

    if (error) {
      throw new Error(`Error fetching all players data: ${error.message}`);
    }

    return data || [];
  }

  // Get teams data
  async getTeamsData() {
    const { data, error } = await supabaseAdmin.from("fpl_teams").select("*");

    if (error) {
      throw new Error(`Error fetching teams data: ${error.message}`);
    }

    return data || [];
  }

  // Settings management
  async getSettings() {
    const { data, error } = await supabaseAdmin
      .from("fpl_settings")
      .select("*")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Error fetching settings: ${error.message}`);
    }

    return data;
  }

  async updateSettings(
    settings: Partial<{
      fpl_proxy_url: string | null;
      cron_secret: string | null;
      default_gw: number;
      default_manager_id: number;
      premium_league_id: number | null;
      standard_league_id: number | null;
      h2h_league_id: number | null;
      h2h2_league_id: number | null;
    }>
  ) {
    const { error } = await supabaseAdmin
      .from("fpl_settings")
      .upsert([settings], { onConflict: "id" });

    if (error) {
      throw new Error(`Error updating settings: ${error.message}`);
    }
  }

  async updateLeagueStandings(standings: Array<{
    entry_id: number;
    entry_name: string;
    player_name: string;
    total: number;
    rank: number;
  }>, leagueType: "premium" | "standard" | "h2h" | "h2h2") {
    const updates = standings.map((standing, index) => ({
      fpl_manager_id: standing.entry_id,
      team_name: standing.entry_name,
      player_name: standing.player_name,
      points: standing.total,
      position: index + 1,
      league_type: leagueType === "h2h" || leagueType === "h2h2" ? null : leagueType,
      h2h_category: leagueType === "h2h" || leagueType === "h2h2" ? leagueType : null,
    }));

    for (const update of updates) {
      const { error } = await supabaseAdmin
        .from("premier_league_25_26")
        .upsert(update, {
          onConflict: "fpl_manager_id",
          ignoreDuplicates: false,
        });

      if (error) {
        console.error(`Error updating standing for manager ${update.fpl_manager_id}:`, error);
      }
    }
  }
}

export const fplDb = new FPLDatabaseService();
