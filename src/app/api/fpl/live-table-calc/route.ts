import { NextRequest, NextResponse } from 'next/server';

interface BootstrapElement {
  id: number;
  first_name: string;
  second_name: string;
  team: number;
  element_type: number;
  web_name: string;
}

interface BootstrapTeam {
  id: number;
  name: string;
  short_name: string;
}

interface BootstrapEvent {
  id: number;
  name: string;
  is_current: boolean;
  is_next: boolean;
  finished: boolean;
}

interface LiveElement {
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
    starts: number;
    expected_goals: string;
    expected_assists: string;
    expected_goal_involvements: string;
    expected_goals_conceded: string;
    total_points: number;
    in_dreamteam: boolean;
  };
}

interface FixtureStats {
  identifier: string;
  a: Array<{ value: number; element: number }>;
  h: Array<{ value: number; element: number }>;
}

interface Fixture {
  id: number;
  team_h: number;
  team_a: number;
  finished: boolean;
  finished_provisional: boolean;
  started: boolean;
  stats: FixtureStats[];
}

interface LeagueStanding {
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

interface ManagerPick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

interface ManagerData {
  active_chip?: string;
  picks: ManagerPick[];
  entry_history: {
    event: number;
    points: number;
    total_points: number;
    rank: number;
    overall_rank: number;
  };
}

interface ProcessedTeam {
  id: number;
  player_name: string;
  entry_name: string;
  rank: number;
  last_rank: number;
  rank_change: number;
  event_total: number;
  total: number;
  live_points: number;
  live_total: number;
  captain: {
    name: string;
    points: number;
  };
  players_to_play: number;
  active_chip?: string;
  picks: ManagerPick[];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const managerId = searchParams.get('managerId');
    const gameweek = parseInt(searchParams.get('gameweek') || '1', 10);
    const leagueId = searchParams.get('leagueId');

    if (!managerId || !leagueId) {
      return NextResponse.json(
        { success: false, error: 'Manager ID and League ID are required' },
        { status: 400 }
      );
    }

    // Fetch bootstrap static data
    console.log('🔄 Fetching bootstrap static data...');
    const bootstrapResponse = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
    if (!bootstrapResponse.ok) {
      throw new Error('Failed to fetch bootstrap static data');
    }
    const bootstrap = await bootstrapResponse.json();

    const elements: BootstrapElement[] = bootstrap.elements;
    const teams: BootstrapTeam[] = bootstrap.teams;
    const events: BootstrapEvent[] = bootstrap.events;

    // Find current event
    const currentEvent = events.find(e => e.is_current) || events[gameweek - 1];
    if (!currentEvent) {
      throw new Error('Current event not found');
    }

    // Fetch live data for current gameweek
    console.log('🔄 Fetching live event data...');
    const liveResponse = await fetch(`https://fantasy.premierleague.com/api/event/${currentEvent.id}/live/`);
    if (!liveResponse.ok) {
      throw new Error('Failed to fetch live event data');
    }
    const liveData = await liveResponse.json();
    const liveElements: LiveElement[] = liveData.elements;

    // Fetch fixtures for current gameweek
    console.log('🔄 Fetching fixtures data...');
    const fixturesResponse = await fetch(`https://fantasy.premierleague.com/api/fixtures/?event=${currentEvent.id}`);
    if (!fixturesResponse.ok) {
      throw new Error('Failed to fetch fixtures data');
    }
    const fixtures: Fixture[] = await fixturesResponse.json();

    // Fetch league standings
    console.log('🔄 Fetching league standings...');
    const leagueResponse = await fetch(`https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`);
    if (!leagueResponse.ok) {
      throw new Error('Failed to fetch league data');
    }
    const leagueData = await leagueResponse.json();
    const standings: LeagueStanding[] = leagueData.standings.results;

    // Calculate live bonus points from fixtures
    const liveBonusPoints: { [playerId: number]: number } = {};
    
    fixtures.forEach(fixture => {
      if (fixture.started && !fixture.finished) {
        // Game is live, calculate provisional bonus
        const bpsStats = fixture.stats.find(s => s.identifier === 'bps');
        if (bpsStats) {
          const allBps = [...bpsStats.a, ...bpsStats.h].sort((a, b) => b.value - a.value);
          
          // Award provisional bonus points
          let currentRank = 1;
          let prevValue = -1;
          let bonusPoints = 3;
          
          for (let i = 0; i < allBps.length && bonusPoints > 0; i++) {
            if (allBps[i].value !== prevValue) {
              currentRank = i + 1;
              if (currentRank > 3) break;
              
              if (currentRank === 1) bonusPoints = 3;
              else if (currentRank === 2) bonusPoints = 2;
              else if (currentRank === 3) bonusPoints = 1;
              
              prevValue = allBps[i].value;
            }
            
            liveBonusPoints[allBps[i].element] = bonusPoints;
          }
        }
      }
    });

    // Process each team in the league
    const processedTeams: ProcessedTeam[] = [];

    for (const standing of standings.slice(0, 50)) { // Limit to top 50 for performance
      try {
        // Fetch manager's picks for current gameweek
        const picksResponse = await fetch(`https://fantasy.premierleague.com/api/entry/${standing.entry}/event/${currentEvent.id}/picks/`);
        if (!picksResponse.ok) continue;
        
        const managerData: ManagerData = await picksResponse.json();
        
        let livePoints = 0;
        let playersToPlay = 0;
        let captain = { name: '', points: 0 };

        // Calculate live points for each pick
        managerData.picks.forEach(pick => {
          const element = elements.find(e => e.id === pick.element);
          const liveElement = liveElements.find(e => e.id === pick.element);
          
          if (!element || !liveElement) return;

          let playerPoints = liveElement.stats.total_points;
          
          // Add provisional bonus if game is live
          if (liveBonusPoints[pick.element]) {
            playerPoints += liveBonusPoints[pick.element];
          }

          // Track captain info BEFORE applying multiplier
          if (pick.is_captain) {
            captain = {
              name: element.web_name,
              points: playerPoints * pick.multiplier
            };
          }

          // Apply captain/vice-captain multiplier
          playerPoints *= pick.multiplier;

          livePoints += playerPoints;

          // Check if player still has games to play
          const hasPlayedAll = liveElement.stats.minutes > 0 || 
            fixtures.some(f => 
              (f.team_h === element.team || f.team_a === element.team) && 
              f.finished
            );
          
          if (!hasPlayedAll) {
            playersToPlay++;
          }
        });

        const rankChange = standing.last_rank - standing.rank;

        processedTeams.push({
          id: standing.entry,
          player_name: standing.player_name,
          entry_name: standing.entry_name,
          rank: standing.rank,
          last_rank: standing.last_rank,
          rank_change: rankChange,
          event_total: standing.event_total,
          total: standing.total,
          live_points: livePoints,
          live_total: standing.total - standing.event_total + livePoints,
          captain,
          players_to_play: playersToPlay,
          active_chip: managerData.active_chip,
          picks: managerData.picks
        });

      } catch (error) {
        console.error(`Error processing team ${standing.entry}:`, error);
        continue;
      }
    }

    // Sort by live total points
    processedTeams.sort((a, b) => b.live_total - a.live_total);

    // Update live ranks
    processedTeams.forEach((team, index) => {
      team.rank = index + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        league: {
          id: leagueId,
          name: leagueData.league.name
        },
        gameweek: currentEvent.id,
        teams: processedTeams,
        elements,
        fpl_teams: teams,
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Live table calculation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}