import { fplApi, FPLFixture, FPLLiveResponse, FPLFixtureStat } from "./fpl-api";
import { fplDb } from "./fpl-db";

export interface MatchResultPlayer {
  id: number;
  web_name: string;
  team_id: number;
  ownership_top10k?: number;
  ownership_overall?: number;
  points: number;
}

export interface MatchGoal {
  player: MatchResultPlayer;
  minute: number;
  own_goal: boolean;
  penalty: boolean;
}

export interface MatchAssist {
  player: MatchResultPlayer;
  minute: number;
  goal_player_id: number;
}

export interface MatchResult {
  fixture_id: number;
  gameweek: number;
  home_team: {
    id: number;
    name: string;
    short_name: string;
  };
  away_team: {
    id: number;
    name: string;
    short_name: string;
  };
  home_score: number;
  away_score: number;
  status: "LIVE" | "FT" | "SCHEDULED";
  kickoff_time: string;
  minutes: number;
  home_goals: MatchGoal[];
  away_goals: MatchGoal[];
  home_assists: MatchAssist[];
  away_assists: MatchAssist[];
  top_performers: {
    home: MatchResultPlayer[];
    away: MatchResultPlayer[];
  };
  home_ownership: number;
  away_ownership: number;
}

export interface Top10kData {
  player_id: number;
  ownership_percentage: number;
  effective_ownership: number;
  captain_percentage: number;
  points: number;
}

class MatchResultsService {
  private top10kData: Map<number, Top10kData> = new Map();
  private playersCache: Map<number, any> = new Map();
  private teamsCache: Map<number, any> = new Map();

  async fetchTop10kData(_gameweek: number): Promise<void> {
    try {
      // This would ideally come from a service that aggregates top 10k data
      // For now, we'll simulate with realistic ownership data
      const allPlayers = await fplDb.getAllPlayers();
      
      this.top10kData.clear();
      allPlayers.forEach(player => {
        const selectedByPercent = parseFloat(player.selected_by_percent || "0");
        // Simulate top 10k ownership being different from overall
        const top10kMultiplier = this.getTop10kMultiplier(player.total_points, selectedByPercent);
        
        this.top10kData.set(player.id, {
          player_id: player.id,
          ownership_percentage: selectedByPercent,
          effective_ownership: selectedByPercent * top10kMultiplier,
          captain_percentage: this.calculateCaptainPercentage(player),
          points: player.total_points
        });
      });
    } catch (error) {
      console.warn("Failed to fetch top 10k data:", error);
    }
  }

  private getTop10kMultiplier(points: number, overallOwnership: number): number {
    // Higher scoring players tend to have higher top 10k ownership
    if (points > 100) return Math.min(2.5, 1 + (points / 200));
    if (points > 50) return Math.min(2.0, 1 + (points / 150));
    if (overallOwnership > 30) return Math.min(1.8, 1 + (overallOwnership / 50));
    return Math.max(0.3, 1 - (overallOwnership / 100));
  }

  private calculateCaptainPercentage(player: any): number {
    const points = player.total_points || 0;
    const ownership = parseFloat(player.selected_by_percent || "0");
    
    // Players like Haaland, Salah tend to have high captain %
    if (points > 120 && ownership > 40) return Math.min(35, ownership * 0.8);
    if (points > 80 && ownership > 20) return Math.min(25, ownership * 0.6);
    if (points > 50 && ownership > 10) return Math.min(15, ownership * 0.4);
    return Math.min(5, ownership * 0.2);
  }

  async initializeCaches(): Promise<void> {
    const [allPlayers, allTeams] = await Promise.all([
      fplDb.getAllPlayers(),
      fplDb.getTeamsData()
    ]);

    this.playersCache.clear();
    this.teamsCache.clear();

    allPlayers.forEach(player => {
      this.playersCache.set(player.id, player);
    });

    allTeams.forEach(team => {
      this.teamsCache.set(team.id, team);
    });
  }

  private processFixtureStats(fixture: FPLFixture, liveData: FPLLiveResponse): {
    goals: { home: MatchGoal[], away: MatchGoal[] },
    assists: { home: MatchAssist[], away: MatchAssist[] }
  } {
    const goals = { home: [] as MatchGoal[], away: [] as MatchGoal[] };
    const assists = { home: [] as MatchAssist[], away: [] as MatchAssist[] };

    // Process fixture stats for goals and assists
    fixture.stats?.forEach((stat: FPLFixtureStat) => {
      if (stat.identifier === 'goals_scored') {
        // Home goals - process each goal occurrence
        stat.h?.forEach(goalStat => {
          const player = this.playersCache.get(goalStat.element);
          const top10kData = this.top10kData.get(goalStat.element);
          
          if (player) {
            // Add one goal entry for each goal scored by this player (value = number of goals)
            for (let i = 0; i < goalStat.value; i++) {
              goals.home.push({
                player: {
                  id: player.id,
                  web_name: player.web_name,
                  team_id: player.team,
                  ownership_top10k: top10kData?.effective_ownership || 0,
                  ownership_overall: parseFloat(player.selected_by_percent || "0"),
                  points: this.getPlayerLivePoints(goalStat.element, liveData)
                },
                minute: this.estimateMinute(fixture.minutes) + (i * 5), // Slightly different minutes
                own_goal: false,
                penalty: this.isPenalty(stat, goalStat.element)
              });
            }
          }
        });

        // Away goals - process each goal occurrence
        stat.a?.forEach(goalStat => {
          const player = this.playersCache.get(goalStat.element);
          const top10kData = this.top10kData.get(goalStat.element);
          
          if (player) {
            // Add one goal entry for each goal scored by this player (value = number of goals)
            for (let i = 0; i < goalStat.value; i++) {
              goals.away.push({
                player: {
                  id: player.id,
                  web_name: player.web_name,
                  team_id: player.team,
                  ownership_top10k: top10kData?.effective_ownership || 0,
                  ownership_overall: parseFloat(player.selected_by_percent || "0"),
                  points: this.getPlayerLivePoints(goalStat.element, liveData)
                },
                minute: this.estimateMinute(fixture.minutes) + (i * 5), // Slightly different minutes
                own_goal: false,
                penalty: this.isPenalty(stat, goalStat.element)
              });
            }
          }
        });
      }

      if (stat.identifier === 'assists') {
        // Home assists - process each assist occurrence
        stat.h?.forEach(assistStat => {
          const player = this.playersCache.get(assistStat.element);
          const top10kData = this.top10kData.get(assistStat.element);
          
          if (player) {
            // Add one assist entry for each assist by this player (value = number of assists)
            for (let i = 0; i < assistStat.value; i++) {
              assists.home.push({
                player: {
                  id: player.id,
                  web_name: player.web_name,
                  team_id: player.team,
                  ownership_top10k: top10kData?.effective_ownership || 0,
                  ownership_overall: parseFloat(player.selected_by_percent || "0"),
                  points: this.getPlayerLivePoints(assistStat.element, liveData)
                },
                minute: this.estimateMinute(fixture.minutes) + (i * 5), // Slightly different minutes
                goal_player_id: this.findGoalPlayerId(fixture.stats, 'H', assistStat.element)
              });
            }
          }
        });

        // Away assists - process each assist occurrence
        stat.a?.forEach(assistStat => {
          const player = this.playersCache.get(assistStat.element);
          const top10kData = this.top10kData.get(assistStat.element);
          
          if (player) {
            // Add one assist entry for each assist by this player (value = number of assists)
            for (let i = 0; i < assistStat.value; i++) {
              assists.away.push({
                player: {
                  id: player.id,
                  web_name: player.web_name,
                  team_id: player.team,
                  ownership_top10k: top10kData?.effective_ownership || 0,
                  ownership_overall: parseFloat(player.selected_by_percent || "0"),
                  points: this.getPlayerLivePoints(assistStat.element, liveData)
                },
                minute: this.estimateMinute(fixture.minutes) + (i * 5), // Slightly different minutes
                goal_player_id: this.findGoalPlayerId(fixture.stats, 'A', assistStat.element)
              });
            }
          }
        });
      }
    });

    return { goals, assists };
  }

  private getPlayerLivePoints(playerId: number, liveData: FPLLiveResponse): number {
    const livePlayer = liveData.elements.find(el => el.id === playerId);
    return livePlayer?.stats?.total_points || 0;
  }

  private estimateMinute(fixtureMinutes: number): number {
    // Estimate goal/assist minute based on match time
    return Math.min(90, Math.max(1, fixtureMinutes - Math.floor(Math.random() * 10)));
  }

  private isPenalty(_stat: FPLFixtureStat, _playerId: number): boolean {
    // Check if there's a penalty stat for this player
    return false; // Would need additional penalty data from FPL API
  }

  private findGoalPlayerId(_stats: FPLFixtureStat[], _side: 'H' | 'A', _assistPlayerId: number): number {
    // Try to match assist with corresponding goal - simplified logic
    return 0; // Would need more sophisticated matching
  }

  private getTopPerformers(
    teamId: number, 
    liveData: FPLLiveResponse, 
    count: number = 3
  ): MatchResultPlayer[] {
    const teamPlayers = Array.from(this.playersCache.values())
      .filter(player => player.team === teamId)
      .map(player => {
        const liveStats = liveData.elements.find(el => el.id === player.id);
        const top10kData = this.top10kData.get(player.id);
        
        return {
          id: player.id,
          web_name: player.web_name,
          team_id: player.team,
          ownership_top10k: top10kData?.effective_ownership || 0,
          ownership_overall: parseFloat(player.selected_by_percent || "0"),
          points: liveStats?.stats?.total_points || 0
        };
      })
      .sort((a, b) => {
        // Sort by points first, then by ownership for tie-breaking
        if (b.points !== a.points) return b.points - a.points;
        return (b.ownership_top10k || 0) - (a.ownership_top10k || 0);
      })
      .slice(0, count);

    return teamPlayers;
  }

  private calculateTeamOwnership(teamId: number): number {
    const teamPlayers = Array.from(this.playersCache.values())
      .filter(player => player.team === teamId);
    
    const totalOwnership = teamPlayers.reduce((sum, player) => {
      const top10kData = this.top10kData.get(player.id);
      return sum + (top10kData?.effective_ownership || 0);
    }, 0);

    return totalOwnership;
  }

  async getMatchResults(gameweek: number): Promise<MatchResult[]> {
    try {
      // Initialize all required data
      await Promise.all([
        this.initializeCaches(),
        this.fetchTop10kData(gameweek)
      ]);

      const [fixtures, liveData] = await Promise.all([
        fplApi.getFixtures(gameweek),
        fplApi.getLiveData(gameweek)
      ]);

      const matchResults: MatchResult[] = fixtures.map(fixture => {
        const homeTeam = this.teamsCache.get(fixture.team_h);
        const awayTeam = this.teamsCache.get(fixture.team_a);

        // Process goals and assists
        const { goals, assists } = this.processFixtureStats(fixture, liveData);

        // Determine match status
        let status: "LIVE" | "FT" | "SCHEDULED" = "SCHEDULED";
        if (fixture.finished) {
          status = "FT";
        } else if (fixture.started) {
          status = "LIVE";
        }

        return {
          fixture_id: fixture.id,
          gameweek,
          home_team: {
            id: homeTeam?.id || fixture.team_h,
            name: homeTeam?.name || `Team ${fixture.team_h}`,
            short_name: homeTeam?.short_name || `T${fixture.team_h}`
          },
          away_team: {
            id: awayTeam?.id || fixture.team_a,
            name: awayTeam?.name || `Team ${fixture.team_a}`,
            short_name: awayTeam?.short_name || `T${fixture.team_a}`
          },
          home_score: fixture.team_h_score || 0,
          away_score: fixture.team_a_score || 0,
          status,
          kickoff_time: fixture.kickoff_time,
          minutes: fixture.minutes,
          home_goals: goals.home,
          away_goals: goals.away,
          home_assists: assists.home,
          away_assists: assists.away,
          top_performers: {
            home: this.getTopPerformers(fixture.team_h, liveData),
            away: this.getTopPerformers(fixture.team_a, liveData)
          },
          home_ownership: this.calculateTeamOwnership(fixture.team_h),
          away_ownership: this.calculateTeamOwnership(fixture.team_a)
        };
      });

      return matchResults.sort((a, b) => {
        // Sort by status (LIVE first, then FT, then SCHEDULED)
        const statusOrder = { LIVE: 0, FT: 1, SCHEDULED: 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        // Then by kickoff time
        return new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime();
      });

    } catch (error) {
      console.error("Error fetching match results:", error);
      throw error;
    }
  }

  // Get live updates for a specific match
  async getLiveMatchUpdate(fixtureId: number, gameweek: number): Promise<MatchResult | null> {
    try {
      const allResults = await this.getMatchResults(gameweek);
      return allResults.find(result => result.fixture_id === fixtureId) || null;
    } catch (error) {
      console.error("Error fetching live match update:", error);
      return null;
    }
  }

  // Get key statistics for a gameweek
  async getGameweekStats(gameweek: number): Promise<{
    totalGoals: number;
    totalAssists: number;
    highestScorer: MatchResultPlayer | null;
    mostOwned: MatchResultPlayer | null;
    biggestDifferential: MatchResultPlayer | null;
  }> {
    try {
      const matchResults = await this.getMatchResults(gameweek);
      
      let totalGoals = 0;
      let totalAssists = 0;
      const allPerformers: MatchResultPlayer[] = [];

      matchResults.forEach(match => {
        totalGoals += match.home_goals.length + match.away_goals.length;
        totalAssists += match.home_assists.length + match.away_assists.length;
        allPerformers.push(...match.top_performers.home, ...match.top_performers.away);
      });

      // Remove duplicates and sort
      const uniquePerformers = Array.from(
        new Map(allPerformers.map(p => [p.id, p])).values()
      );

      const highestScorer = uniquePerformers.reduce((max, player) => 
        (player.points > (max?.points || 0)) ? player : max, null as MatchResultPlayer | null);

      const mostOwned = uniquePerformers.reduce((max, player) => 
        ((player.ownership_top10k || 0) > (max?.ownership_top10k || 0)) ? player : max, null as MatchResultPlayer | null);

      // Biggest differential - high points with low ownership
      const biggestDifferential = uniquePerformers
        .filter(p => p.points > 5) // Only players who scored
        .reduce((max, player) => {
          const differential = player.points / Math.max(player.ownership_top10k || 1, 1);
          const maxDifferential = max ? (max.points / Math.max(max.ownership_top10k || 1, 1)) : 0;
          return differential > maxDifferential ? player : max;
        }, null as MatchResultPlayer | null);

      return {
        totalGoals,
        totalAssists,
        highestScorer,
        mostOwned,
        biggestDifferential
      };
    } catch (error) {
      console.error("Error calculating gameweek stats:", error);
      return {
        totalGoals: 0,
        totalAssists: 0,
        highestScorer: null,
        mostOwned: null,
        biggestDifferential: null
      };
    }
  }
}

export const matchResultsService = new MatchResultsService();