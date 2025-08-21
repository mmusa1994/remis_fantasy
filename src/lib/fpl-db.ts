import { createClient } from '@supabase/supabase-js';
import { 
  FPLBootstrapResponse, 
  FPLPlayer, 
  FPLTeam, 
  FPLElementType, 
  FPLFixture, 
  FPLLiveElement,
  FPLManagerPicks
} from './fpl-api';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
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
  draw?: number;
  form?: string | null;
  loss?: number;
  played?: number;
  points?: number;
  position?: number;
  strength?: number;
  team_division?: number | null;
  unavailable?: boolean;
  win?: number;
  strength_overall_home?: number;
  strength_overall_away?: number;
  strength_attack_home?: number;
  strength_attack_away?: number;
  strength_defence_home?: number;
  strength_defence_away?: number;
  pulse_id?: number;
}

export interface DBFixture {
  id: number;
  gw: number;
  team_h: number;
  team_a: number;
  team_h_score?: number;
  team_a_score?: number;
  started: boolean;
  finished: boolean;
  minutes?: number;
  kickoff_time?: string;
}

export interface DBLivePlayer {
  gw: number;
  player_id: number;
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
  influence: number;
  creativity: number;
  threat: number;
  ict_index: number;
  total_points: number;
  in_dreamteam: boolean;
}

export interface DBManagerMetrics {
  gw: number;
  manager_id: number;
  team_points_no_bonus: number;
  team_points_final: number;
  active_points_no_bonus: number;
  active_points_final: number;
  bench_points_no_bonus: number;
  bench_points_final: number;
  captain_id?: number;
  captain_points: number;
  vice_captain_id?: number;
  goals: number;
  assists: number;
  clean_sheets: number;
  cards_yellow: number;
  cards_red: number;
  saves: number;
  predicted_bonus: number;
  final_bonus: number;
}

export interface DBManagerPick {
  gw: number;
  manager_id: number;
  player_id: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

export interface DBEvent {
  id: number;
  gw: number;
  fixture_id: number;
  event_type: string;
  player_id: number;
  delta_value: number;
  side: 'H' | 'A';
}

class FPLDatabaseService {
  async upsertBootstrapData(bootstrap: FPLBootstrapResponse): Promise<void> {
    try {
      await Promise.all([
        this.upsertPlayers(bootstrap.elements),
        this.upsertTeams(bootstrap.teams),
        this.upsertElementTypes(bootstrap.element_types),
      ]);
    } catch (error) {
      console.error('Error upserting bootstrap data:', error);
      throw error;
    }
  }

  private async upsertPlayers(players: FPLPlayer[]): Promise<void> {
    const dbPlayers: DBPlayer[] = players.map(player => ({
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
      .from('fpl_players')
      .upsert(dbPlayers, { onConflict: 'id' });

    if (error) {
      throw new Error(`Error upserting players: ${error.message}`);
    }
  }

  private async upsertTeams(teams: FPLTeam[]): Promise<void> {
    const dbTeams = teams.map(team => ({
      id: team.id,
      name: team.name,
      short_name: team.short_name,
      code: team.code,
      draw: team.draw,
      form: team.form,
      loss: team.loss,
      played: team.played,
      points: team.points,
      position: team.position,
      strength: team.strength,
      team_division: team.team_division,
      unavailable: team.unavailable,
      win: team.win,
      strength_overall_home: team.strength_overall_home,
      strength_overall_away: team.strength_overall_away,
      strength_attack_home: team.strength_attack_home,
      strength_attack_away: team.strength_attack_away,
      strength_defence_home: team.strength_defence_home,
      strength_defence_away: team.strength_defence_away,
      pulse_id: team.pulse_id,
    }));

    const { error } = await supabaseAdmin
      .from('fpl_teams')
      .upsert(dbTeams, { onConflict: 'id' });

    if (error) {
      throw new Error(`Error upserting teams: ${error.message}`);
    }
  }

  private async upsertElementTypes(elementTypes: FPLElementType[]): Promise<void> {
    const dbElementTypes = elementTypes.map(type => ({
      id: type.id,
      plural_name: type.plural_name,
      plural_name_short: type.plural_name_short,
      singular_name: type.singular_name,
      singular_name_short: type.singular_name_short,
      squad_select: type.squad_select,
      squad_min_select: type.squad_min_select,
      squad_max_select: type.squad_max_select,
      squad_min_play: type.squad_min_play,
      squad_max_play: type.squad_max_play,
      ui_shirt_specific: type.ui_shirt_specific,
      sub_positions_locked: type.sub_positions_locked,
      element_count: type.element_count,
    }));

    const { error } = await supabaseAdmin
      .from('fpl_element_types')
      .upsert(dbElementTypes, { onConflict: 'id' });

    if (error) {
      throw new Error(`Error upserting element types: ${error.message}`);
    }
  }

  async upsertFixtures(fixtures: FPLFixture[]): Promise<void> {
    const dbFixtures: DBFixture[] = fixtures.map(fixture => ({
      id: fixture.id,
      gw: fixture.event,
      team_h: fixture.team_h,
      team_a: fixture.team_a,
      team_h_score: fixture.team_h_score || undefined,
      team_a_score: fixture.team_a_score || undefined,
      started: fixture.started,
      finished: fixture.finished,
      minutes: fixture.minutes,
      kickoff_time: fixture.kickoff_time,
    }));

    const { error } = await supabaseAdmin
      .from('fpl_fixtures')
      .upsert(dbFixtures, { onConflict: 'id' });

    if (error) {
      throw new Error(`Error upserting fixtures: ${error.message}`);
    }
  }

  async upsertFixtureStats(fixtures: FPLFixture[]): Promise<void> {
    const fixtureStats: any[] = [];

    fixtures.forEach(fixture => {
      fixture.stats.forEach(stat => {
        stat.h.forEach(player => {
          fixtureStats.push({
            fixture_id: fixture.id,
            identifier: stat.identifier,
            side: 'H',
            player_id: player.element,
            value: player.value,
          });
        });

        stat.a.forEach(player => {
          fixtureStats.push({
            fixture_id: fixture.id,
            identifier: stat.identifier,
            side: 'A',
            player_id: player.element,
            value: player.value,
          });
        });
      });
    });

    if (fixtureStats.length === 0) return;

    const { error } = await supabaseAdmin
      .from('fpl_fixture_stats')
      .upsert(fixtureStats, { onConflict: 'fixture_id,identifier,side,player_id' });

    if (error) {
      throw new Error(`Error upserting fixture stats: ${error.message}`);
    }
  }

  async upsertLivePlayers(gw: number, liveElements: FPLLiveElement[]): Promise<void> {
    const dbLivePlayers: DBLivePlayer[] = liveElements.map(element => ({
      gw,
      player_id: element.id,
      minutes: element.stats.minutes,
      goals_scored: element.stats.goals_scored,
      assists: element.stats.assists,
      clean_sheets: element.stats.clean_sheets,
      goals_conceded: element.stats.goals_conceded,
      own_goals: element.stats.own_goals,
      penalties_saved: element.stats.penalties_saved,
      penalties_missed: element.stats.penalties_missed,
      yellow_cards: element.stats.yellow_cards,
      red_cards: element.stats.red_cards,
      saves: element.stats.saves,
      bonus: element.stats.bonus,
      bps: element.stats.bps,
      influence: parseFloat(element.stats.influence),
      creativity: parseFloat(element.stats.creativity),
      threat: parseFloat(element.stats.threat),
      ict_index: parseFloat(element.stats.ict_index),
      total_points: element.stats.total_points,
      in_dreamteam: element.stats.in_dreamteam,
    }));

    const { error } = await supabaseAdmin
      .from('fpl_live_players')
      .upsert(dbLivePlayers, { onConflict: 'gw,player_id' });

    if (error) {
      throw new Error(`Error upserting live players: ${error.message}`);
    }
  }

  async upsertManagerPicks(gw: number, managerId: number, picks: FPLManagerPicks): Promise<void> {
    const dbPicks: DBManagerPick[] = picks.picks.map(pick => ({
      gw,
      manager_id: managerId,
      player_id: pick.element,
      position: pick.position,
      multiplier: pick.multiplier,
      is_captain: pick.is_captain,
      is_vice_captain: pick.is_vice_captain,
    }));

    const { error } = await supabaseAdmin
      .from('fpl_manager_picks')
      .upsert(dbPicks, { onConflict: 'gw,manager_id,player_id' });

    if (error) {
      throw new Error(`Error upserting manager picks: ${error.message}`);
    }
  }

  async upsertManagerMetrics(metrics: DBManagerMetrics): Promise<void> {
    const { error } = await supabaseAdmin
      .from('fpl_manager_metrics')
      .upsert([metrics], { onConflict: 'gw,manager_id' });

    if (error) {
      throw new Error(`Error upserting manager metrics: ${error.message}`);
    }
  }

  async addEvent(event: Omit<DBEvent, 'id'>): Promise<void> {
    const { error } = await supabaseAdmin
      .from('fpl_events_stream')
      .insert([{
        gw: event.gw,
        fixture_id: event.fixture_id,
        event_type: event.event_type,
        player_id: event.player_id,
        delta_value: event.delta_value,
        side: event.side,
      }]);

    if (error) {
      throw new Error(`Error adding event: ${error.message}`);
    }
  }

  async getManagerTeam(gw: number, managerId: number) {
    const { data: picks, error: picksError } = await supabaseAdmin
      .from('fpl_manager_picks')
      .select(`
        *,
        player:fpl_players (
          id,
          web_name,
          first_name,
          second_name,
          team,
          element_type
        )
      `)
      .eq('gw', gw)
      .eq('manager_id', managerId)
      .order('position');

    if (picksError) {
      throw new Error(`Error fetching manager picks: ${picksError.message}`);
    }

    return picks;
  }

  async getLivePlayerStats(gw: number, playerIds: number[]) {
    const { data, error } = await supabaseAdmin
      .from('fpl_live_players')
      .select('*')
      .eq('gw', gw)
      .in('player_id', playerIds);

    if (error) {
      throw new Error(`Error fetching live player stats: ${error.message}`);
    }

    return data;
  }

  async getFixturesForGameweek(gw: number) {
    const { data, error } = await supabaseAdmin
      .from('fpl_fixtures')
      .select('*')
      .eq('gw', gw)
      .order('kickoff_time');

    if (error) {
      throw new Error(`Error fetching fixtures: ${error.message}`);
    }

    return data;
  }

  async getFixtureStats(fixtureIds: number[]) {
    const { data, error } = await supabaseAdmin
      .from('fpl_fixture_stats')
      .select(`
        *,
        player:fpl_players (
          id,
          web_name,
          first_name,
          second_name
        )
      `)
      .in('fixture_id', fixtureIds);

    if (error) {
      throw new Error(`Error fetching fixture stats: ${error.message}`);
    }

    return data;
  }

  async setGameweekStatus(gw: number, bonusAdded: boolean, dataChecked: boolean): Promise<void> {
    const { error } = await supabaseAdmin
      .from('fpl_gameweek_status')
      .upsert([{
        gw,
        bonus_added: bonusAdded,
        data_checked: dataChecked,
        finished: bonusAdded && dataChecked,
      }], { onConflict: 'gw' });

    if (error) {
      throw new Error(`Error setting gameweek status: ${error.message}`);
    }
  }

  async getGameweekStatus(gw: number) {
    const { data, error } = await supabaseAdmin
      .from('fpl_gameweek_status')
      .select('*')
      .eq('gw', gw)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error fetching gameweek status: ${error.message}`);
    }

    return data;
  }

  async getSettings() {
    const { data, error } = await supabaseAdmin
      .from('fpl_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error fetching settings: ${error.message}`);
    }

    return data;
  }

  async updateSettings(settings: Partial<{
    fpl_proxy_url: string | null;
    cron_secret: string | null;
    default_gw: number;
    default_manager_id: number;
  }>) {
    const { error } = await supabaseAdmin
      .from('fpl_settings')
      .upsert([settings], { onConflict: 'id' });

    if (error) {
      throw new Error(`Error updating settings: ${error.message}`);
    }
  }

  async getRecentEvents(gw: number, limit: number = 50) {
    const { data, error } = await supabaseAdmin
      .from('fpl_events_stream')
      .select(`
        *,
        player:fpl_players!fpl_events_stream_player_id_fkey (
          web_name,
          first_name,
          second_name
        ),
        fixture:fpl_fixtures!fpl_events_stream_fixture_id_fkey (
          team_h_data:fpl_teams!fpl_fixtures_team_h_fkey (
            short_name
          ),
          team_a_data:fpl_teams!fpl_fixtures_team_a_fkey (
            short_name
          )
        )
      `)
      .eq('gw', gw)
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Error fetching recent events: ${error.message}`);
    }

    return data || [];
  }
}

export const fplDb = new FPLDatabaseService();