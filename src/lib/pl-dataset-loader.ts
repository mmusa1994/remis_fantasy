interface PlayerStats {
  player_name: string;
  nationality: string;
  preferred_foot: string;
  date_of_birth: string;
  appearances: number;
  sub_appearances: number;
  minutes_played: number;
  goals: number;
  assists: number;
  xg: number;
  xa: number;
  shots_on_target_inside_box: number;
  shots_on_target_outside_box: number;
  passes: number;
  pass_accuracy: number;
  duels_won: number;
  total_tackles: number;
  interceptions: number;
  blocks: number;
  yellow_cards: number;
  red_cards: number;
  touches_opposition_box: number;
  aerial_duels_won: number;
  dribble_attempts: number;
  dribble_accuracy: number;
  cross_attempts: number;
  cross_accuracy: number;
  fouls: number;
  hit_woodwork: number;
  offsides: number;
  corners_taken: number;
  penalties_taken: number;
  penalties_scored: number;
  clean_sheets: number;
  saves_made: number;
  goals_conceded: number;
}

interface PlayerInfo {
  player_image_url: string;
  player_name: string;
  player_country: string;
  player_club: string;
  player_position: string;
  player_stats_url: string;
}

interface ClubStats {
  club_name: string;
  club_url: string;
  season: string;
  games_played: number;
  goals: number;
  goals_conceded: number;
  xg: number;
  shots: number;
  shots_on_target: number;
  passes: number;
  pass_accuracy: number;
  corners_taken: number;
  yellow_cards: number;
  red_cards: number;
  clean_sheets?: number;
  position?: number;
  points?: number;
}

class PLDatasetLoader {
  private playerStatsCache: PlayerStats[] | null = null;
  private playerInfoCache: PlayerInfo[] | null = null;
  private clubStatsCache: Map<string, ClubStats[]> = new Map();
  private cacheExpiry = 30 * 60 * 1000; // 30 minutes
  private lastCacheTime = 0;

  private parseCSV(csvContent: string): any[] {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map(line => {
      const values = this.parseCSVLine(line);
      const row: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index]?.trim().replace(/"/g, '') || '';
        
        // Convert numeric fields
        if (this.isNumericField(header)) {
          row[this.normalizeFieldName(header)] = value === '' ? 0 : parseFloat(value) || 0;
        } else {
          row[this.normalizeFieldName(header)] = value;
        }
      });
      
      return row;
    });
  }

  private parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  private normalizeFieldName(field: string): string {
    return field
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private isNumericField(field: string): boolean {
    const numericFields = [
      'appearances', 'sub_appearances', 'minutes_played', 'goals', 'assists', 
      'xg', 'xa', 'shots', 'passes', 'pass_accuracy', 'duels_won', 'tackles',
      'interceptions', 'blocks', 'yellow_cards', 'red_cards', 'games_played',
      'goals_conceded', 'corners_taken', 'dribble_attempts', 'cross_attempts',
      'fouls', 'hit_woodwork', 'offsides', 'penalties', 'clean_sheets', 'saves'
    ];
    
    const normalized = this.normalizeFieldName(field);
    return numericFields.some(nf => normalized.includes(nf));
  }

  private shouldRefreshCache(): boolean {
    return Date.now() - this.lastCacheTime > this.cacheExpiry;
  }

  async loadCurrentSeasonPlayerStats(): Promise<PlayerStats[]> {
    if (this.playerStatsCache && !this.shouldRefreshCache()) {
      return this.playerStatsCache;
    }

    try {
      const response = await fetch('/pl-datasets/player_stats_2024_2025_season.csv');
      if (!response.ok) throw new Error('Failed to load player stats');
      
      const csvContent = await response.text();
      this.playerStatsCache = this.parseCSV(csvContent) as PlayerStats[];
      this.lastCacheTime = Date.now();
      
      return this.playerStatsCache;
    } catch (error) {
      console.error('Error loading player stats:', error);
      return [];
    }
  }

  async loadPlayerInfo(): Promise<PlayerInfo[]> {
    if (this.playerInfoCache && !this.shouldRefreshCache()) {
      return this.playerInfoCache;
    }

    try {
      const response = await fetch('/pl-datasets/premier_player_info.csv');
      if (!response.ok) throw new Error('Failed to load player info');
      
      const csvContent = await response.text();
      this.playerInfoCache = this.parseCSV(csvContent) as PlayerInfo[];
      this.lastCacheTime = Date.now();
      
      return this.playerInfoCache;
    } catch (error) {
      console.error('Error loading player info:', error);
      return [];
    }
  }

  async loadClubStats(season?: string): Promise<ClubStats[]> {
    const targetSeason = season || '2024';
    const cacheKey = `club_stats_${targetSeason}`;
    
    if (this.clubStatsCache.has(cacheKey) && !this.shouldRefreshCache()) {
      return this.clubStatsCache.get(cacheKey) || [];
    }

    try {
      const response = await fetch(`/pl-datasets/club_stats/${targetSeason}_season_club_stats.csv`);
      if (!response.ok) throw new Error(`Failed to load club stats for ${targetSeason}`);
      
      const csvContent = await response.text();
      const clubStats = this.parseCSV(csvContent) as ClubStats[];
      
      this.clubStatsCache.set(cacheKey, clubStats);
      this.lastCacheTime = Date.now();
      
      return clubStats;
    } catch (error) {
      console.error(`Error loading club stats for ${targetSeason}:`, error);
      return [];
    }
  }

  async getPlayerByName(playerName: string): Promise<{ stats: PlayerStats | null, info: PlayerInfo | null }> {
    const [playerStats, playerInfo] = await Promise.all([
      this.loadCurrentSeasonPlayerStats(),
      this.loadPlayerInfo()
    ]);

    const stats = playerStats.find(p => 
      p.player_name?.toLowerCase().includes(playerName.toLowerCase()) ||
      playerName.toLowerCase().includes(p.player_name?.toLowerCase() || '')
    ) || null;

    const info = playerInfo.find(p => 
      p.player_name?.toLowerCase().includes(playerName.toLowerCase()) ||
      playerName.toLowerCase().includes(p.player_name?.toLowerCase() || '')
    ) || null;

    return { stats, info };
  }

  async getPlayersByClub(clubName: string): Promise<PlayerInfo[]> {
    const playerInfo = await this.loadPlayerInfo();
    
    return playerInfo.filter(p => 
      p.player_club?.toLowerCase().includes(clubName.toLowerCase()) ||
      clubName.toLowerCase().includes(p.player_club?.toLowerCase() || '')
    );
  }

  async getTopPerformers(stat: keyof PlayerStats, limit = 10): Promise<PlayerStats[]> {
    const playerStats = await this.loadCurrentSeasonPlayerStats();
    
    return playerStats
      .filter(p => p[stat] !== undefined && p[stat] > 0)
      .sort((a, b) => (b[stat] as number) - (a[stat] as number))
      .slice(0, limit);
  }

  async getHistoricalClubPerformance(clubName: string): Promise<ClubStats[]> {
    const seasons = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];
    const historicalData: ClubStats[] = [];

    for (const season of seasons) {
      try {
        const clubStats = await this.loadClubStats(season);
        const clubData = clubStats.find(c => 
          c.club_name?.toLowerCase().includes(clubName.toLowerCase()) ||
          clubName.toLowerCase().includes(c.club_name?.toLowerCase() || '')
        );
        
        if (clubData) {
          historicalData.push(clubData);
        }
      } catch (error) {
        console.warn(`Could not load ${season} data for ${clubName}`);
      }
    }

    return historicalData;
  }

  async searchPlayers(query: string, filters?: {
    position?: string;
    club?: string;
    minGoals?: number;
    minAssists?: number;
    minAppearances?: number;
  }): Promise<{ stats: PlayerStats, info: PlayerInfo }[]> {
    const [playerStats, playerInfo] = await Promise.all([
      this.loadCurrentSeasonPlayerStats(),
      this.loadPlayerInfo()
    ]);

    let filteredStats = playerStats.filter(p => 
      p.player_name?.toLowerCase().includes(query.toLowerCase()) ||
      p.nationality?.toLowerCase().includes(query.toLowerCase())
    );

    // Apply filters
    if (filters) {
      if (filters.minGoals) {
        filteredStats = filteredStats.filter(p => p.goals >= filters.minGoals!);
      }
      if (filters.minAssists) {
        filteredStats = filteredStats.filter(p => p.assists >= filters.minAssists!);
      }
      if (filters.minAppearances) {
        filteredStats = filteredStats.filter(p => p.appearances >= filters.minAppearances!);
      }
    }

    // Match with player info
    const results: { stats: PlayerStats, info: PlayerInfo }[] = [];
    
    for (const stats of filteredStats) {
      const info = playerInfo.find(p => p.player_name === stats.player_name);
      if (info) {
        // Apply position and club filters on info
        if (filters?.position && !info.player_position.toLowerCase().includes(filters.position.toLowerCase())) {
          continue;
        }
        if (filters?.club && !info.player_club.toLowerCase().includes(filters.club.toLowerCase())) {
          continue;
        }
        
        results.push({ stats, info });
      }
    }

    return results.slice(0, 20); // Limit results
  }

  async getDetailedPlayerAnalysis(playerName: string): Promise<string> {
    const { stats, info } = await this.getPlayerByName(playerName);
    
    if (!stats || !info) {
      return `Player "${playerName}" not found in current season data.`;
    }

    const analysis = [
      `DETAILED ANALYSIS: ${info.player_name} (${info.player_club})`,
      `Position: ${info.player_position} | Nationality: ${info.player_country}`,
      ``,
      `CURRENT SEASON PERFORMANCE:`,
      `• Appearances: ${stats.appearances} (${stats.sub_appearances} sub appearances)`,
      `• Minutes: ${stats.minutes_played}`,
      `• Goals: ${stats.goals} (xG: ${stats.xg})`,
      `• Assists: ${stats.assists} (xA: ${stats.xa})`,
      `• Goal Contributions: ${stats.goals + stats.assists}`,
      ``,
      `ATTACKING STATS:`,
      `• Shots on Target (Inside Box): ${stats.shots_on_target_inside_box}`,
      `• Shots on Target (Outside Box): ${stats.shots_on_target_outside_box}`,
      `• Touches in Opposition Box: ${stats.touches_opposition_box}`,
      `• Penalties Taken: ${stats.penalties_taken} (Scored: ${stats.penalties_scored})`,
      ``,
      `PASSING & CREATIVITY:`,
      `• Total Passes: ${stats.passes} (Accuracy: ${stats.pass_accuracy}%)`,
      `• Crosses: ${stats.cross_attempts} (Accuracy: ${stats.cross_accuracy}%)`,
      `• Corners Taken: ${stats.corners_taken}`,
      ``,
      `DEFENSIVE CONTRIBUTION:`,
      `• Tackles: ${stats.total_tackles}`,
      `• Interceptions: ${stats.interceptions}`,
      `• Blocks: ${stats.blocks}`,
      `• Duels Won: ${stats.duels_won}`,
      `• Aerial Duels Won: ${stats.aerial_duels_won}`,
      ``,
      `DISCIPLINE:`,
      `• Yellow Cards: ${stats.yellow_cards}`,
      `• Red Cards: ${stats.red_cards}`,
      `• Fouls: ${stats.fouls}`,
      ``,
      `GOALKEEPER STATS:`,
      `• Clean Sheets: ${stats.clean_sheets}`,
      `• Saves: ${stats.saves_made}`,
      `• Goals Conceded: ${stats.goals_conceded}`,
    ].join('\n');

    return analysis;
  }
}

export const plDataLoader = new PLDatasetLoader();
export type { PlayerStats, PlayerInfo, ClubStats };