export interface FPLBootstrapResponse {
  elements: FPLPlayer[];
  teams: FPLTeam[];
  element_types: FPLElementType[];
  events: FPLGameweek[];
}

export interface FPLPlayer {
  id: number;
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  element_type: number;
  now_cost: number;
  total_points: number;
  status: string;
  photo: string;
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
  squad_min_select: number | null;
  squad_max_select: number | null;
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
  finished: boolean;
  data_checked: boolean;
  highest_scoring_entry: number | null;
  deadline_time_epoch: number;
  deadline_time_game_offset: number;
  highest_score: number | null;
  is_previous: boolean;
  is_current: boolean;
  is_next: boolean;
  cup_leagues_created: boolean;
  h2h_ko_matches_created: boolean;
  ranked_count: number;
  chip_plays: any[];
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
}

export interface FPLFixture {
  id: number;
  code: number;
  event: number;
  finished: boolean;
  finished_provisional: boolean;
  kickoff_time: string;
  minutes: number;
  provisional_start_time: boolean;
  started: boolean;
  team_a: number;
  team_a_score: number | null;
  team_h: number;
  team_h_score: number | null;
  stats: FPLFixtureStat[];
  pulse_id: number;
}

export interface FPLFixtureStat {
  identifier: string;
  a: { element: number; value: number }[];
  h: { element: number; value: number }[];
}

export interface FPLLiveResponse {
  elements: FPLLiveElement[];
}

export interface FPLLiveElement {
  id: number;
  stats: {
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
    total_points: number;
    in_dreamteam: boolean;
  };
  explain: Array<{
    fixture: number;
    stats: Array<{
      identifier: string;
      points: number;
      value: number;
    }>;
  }>;
}

export interface FPLEventStatus {
  status: Array<{
    bonus_added: boolean;
    date: string;
    event: number;
    points: string;
  }>;
}

export interface FPLManagerEntry {
  id: number;
  joined_time: string;
  started_event: number;
  favourite_team: number;
  player_first_name: string;
  player_last_name: string;
  player_region_name: string;
  player_region_id: number;
  player_region_short_iso: string;
  summary_overall_points: number;
  summary_overall_rank: number;
  summary_event_points: number;
  summary_event_rank: number;
  current_event: number;
  leagues: {
    classic: any[];
    h2h: any[];
  };
  name: string;
  kit: string | null;
  last_deadline_bank: number;
  last_deadline_value: number;
  last_deadline_total_transfers: number;
}

export interface FPLManagerPicks {
  active_chip: string | null;
  automatic_subs: Array<{
    element_in: number;
    element_out: number;
    event: number;
  }>;
  entry_history: {
    event: number;
    points: number;
    total_points: number;
    rank: number;
    rank_sort: number;
    overall_rank: number;
    bank: number;
    value: number;
    event_transfers: number;
    event_transfers_cost: number;
    points_on_bench: number;
  };
  picks: Array<{
    element: number;
    position: number;
    multiplier: number;
    is_captain: boolean;
    is_vice_captain: boolean;
  }>;
}

class FPLAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = "FPLAPIError";
  }
}

class FPLAPIService {
  private readonly baseUrl = "https://fantasy.premierleague.com/api";
  private readonly maxRetries = 3;
  private readonly baseDelay = 1000;

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async fetchWithRetry<T>(
    endpoint: string,
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 429 && retryCount < this.maxRetries) {
          const delay = this.baseDelay * Math.pow(2, retryCount);
          console.warn(
            `Rate limited on ${endpoint}, retrying in ${delay}ms...`
          );
          await this.sleep(delay);
          return this.fetchWithRetry(endpoint, retryCount + 1);
        }

        throw new FPLAPIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          endpoint
        );
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof FPLAPIError) {
        throw error;
      }

      if (retryCount < this.maxRetries) {
        const delay = this.baseDelay * Math.pow(2, retryCount);
        console.warn(
          `Network error on ${endpoint}, retrying in ${delay}ms...`,
          error
        );
        await this.sleep(delay);
        return this.fetchWithRetry(endpoint, retryCount + 1);
      }

      throw new FPLAPIError(
        `Network error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        undefined,
        endpoint
      );
    }
  }

  async getBootstrapStatic(): Promise<FPLBootstrapResponse> {
    return this.fetchWithRetry<FPLBootstrapResponse>("/bootstrap-static/");
  }

  async getFixtures(gameweek?: number): Promise<FPLFixture[]> {
    const endpoint = gameweek ? `/fixtures/?event=${gameweek}` : "/fixtures/";
    return this.fetchWithRetry<FPLFixture[]>(endpoint);
  }

  async getLiveData(gameweek: number): Promise<FPLLiveResponse> {
    return this.fetchWithRetry<FPLLiveResponse>(`/event/${gameweek}/live/`);
  }

  async getEventStatus(): Promise<FPLEventStatus> {
    return this.fetchWithRetry<FPLEventStatus>("/event-status/");
  }

  async getManagerEntry(managerId: number): Promise<FPLManagerEntry> {
    return this.fetchWithRetry<FPLManagerEntry>(`/entry/${managerId}/`);
  }

  async getManagerPicks(
    managerId: number,
    gameweek: number
  ): Promise<FPLManagerPicks> {
    return this.fetchWithRetry<FPLManagerPicks>(
      `/entry/${managerId}/event/${gameweek}/picks/`
    );
  }

  async getCurrentGameweek(): Promise<number> {
    const bootstrap = await this.getBootstrapStatic();
    const currentEvent = bootstrap.events.find((event) => event.is_current);
    return currentEvent?.id || 1;
  }

  async getActiveFixtures(gameweek: number): Promise<FPLFixture[]> {
    const fixtures = await this.getFixtures(gameweek);
    return fixtures.filter((fixture) => fixture.started && !fixture.finished);
  }

  async isGameweekFinished(gameweek: number): Promise<boolean> {
    const fixtures = await this.getFixtures(gameweek);
    return fixtures.every((fixture) => fixture.finished);
  }

  async getBonusAddedStatus(gameweek?: number): Promise<boolean> {
    const eventStatus = await this.getEventStatus();
    const currentGW = gameweek || (await this.getCurrentGameweek());
    const status = eventStatus.status.find((s) => s.event === currentGW);
    return status?.bonus_added || false;
  }

  async getLeagueStandings(leagueId: number): Promise<any> {
    return await this.fetchWithRetry(`/leagues-classic/${leagueId}/standings/`);
  }

  async getH2HLeague(leagueId: number): Promise<any> {
    return await this.fetchWithRetry(`/leagues-h2h/${leagueId}/standings/`);
  }
}

export const fplApi = new FPLAPIService();
export { FPLAPIError };
