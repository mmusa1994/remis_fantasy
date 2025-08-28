// Mock data for testing match results when FPL API is unavailable

export const mockMatchResults = [
  {
    fixture_id: 1,
    gameweek: 1,
    home_team: {
      id: 1,
      name: "Arsenal",
      short_name: "ARS",
    },
    away_team: {
      id: 2,
      name: "Chelsea", 
      short_name: "CHE",
    },
    home_score: 2,
    away_score: 1,
    status: "FT",
    kickoff_time: "2024-08-10T16:30:00Z",
    minutes: 90,
    home_goals: [
      {
        player: {
          id: 123,
          web_name: "Saka",
          team_id: 1,
          ownership_top10k: 45.2,
          points: 8
        },
        minute: 25,
        own_goal: false,
        penalty: false
      },
      {
        player: {
          id: 124,
          web_name: "Martinelli",
          team_id: 1,
          ownership_top10k: 32.1,
          points: 6
        },
        minute: 67,
        own_goal: false,
        penalty: false
      }
    ],
    away_goals: [
      {
        player: {
          id: 225,
          web_name: "Jackson",
          team_id: 2,
          ownership_top10k: 28.4,
          points: 5
        },
        minute: 82,
        own_goal: false,
        penalty: false
      }
    ],
    home_assists: [
      {
        player: {
          id: 125,
          web_name: "Ødegaard",
          team_id: 1,
          ownership_top10k: 52.3,
          points: 7
        },
        minute: 25,
        goal_player_id: 123
      }
    ],
    away_assists: [],
    top_performers: {
      home: [
        {
          id: 123,
          web_name: "Saka",
          team_id: 1,
          ownership_top10k: 45.2,
          points: 8
        },
        {
          id: 125,
          web_name: "Ødegaard", 
          team_id: 1,
          ownership_top10k: 52.3,
          points: 7
        }
      ],
      away: [
        {
          id: 225,
          web_name: "Jackson",
          team_id: 2,
          ownership_top10k: 28.4,
          points: 5
        }
      ]
    },
    home_ownership: 42.8,
    away_ownership: 35.6,
  },
  {
    fixture_id: 2,
    gameweek: 1,
    home_team: {
      id: 3,
      name: "Manchester City",
      short_name: "MCI",
    },
    away_team: {
      id: 4,
      name: "Liverpool",
      short_name: "LIV",
    },
    home_score: 1,
    away_score: 3,
    status: "FT",
    kickoff_time: "2024-08-10T19:00:00Z",
    minutes: 90,
    home_goals: [
      {
        player: {
          id: 301,
          web_name: "Haaland",
          team_id: 3,
          ownership_top10k: 78.9,
          points: 5
        },
        minute: 15,
        own_goal: false,
        penalty: true
      }
    ],
    away_goals: [
      {
        player: {
          id: 401,
          web_name: "Salah",
          team_id: 4,
          ownership_top10k: 65.4,
          points: 12
        },
        minute: 35,
        own_goal: false,
        penalty: false
      },
      {
        player: {
          id: 401,
          web_name: "Salah",
          team_id: 4,
          ownership_top10k: 65.4,
          points: 12
        },
        minute: 58,
        own_goal: false,
        penalty: false
      },
      {
        player: {
          id: 402,
          web_name: "Núñez",
          team_id: 4,
          ownership_top10k: 22.1,
          points: 8
        },
        minute: 71,
        own_goal: false,
        penalty: false
      }
    ],
    home_assists: [],
    away_assists: [
      {
        player: {
          id: 403,
          web_name: "Alexander-Arnold",
          team_id: 4,
          ownership_top10k: 38.7,
          points: 6
        },
        minute: 35,
        goal_player_id: 401
      },
      {
        player: {
          id: 404,
          web_name: "Robertson",
          team_id: 4,
          ownership_top10k: 29.3,
          points: 5
        },
        minute: 71,
        goal_player_id: 402
      }
    ],
    top_performers: {
      home: [
        {
          id: 301,
          web_name: "Haaland",
          team_id: 3,
          ownership_top10k: 78.9,
          points: 5
        }
      ],
      away: [
        {
          id: 401,
          web_name: "Salah",
          team_id: 4,
          ownership_top10k: 65.4,
          points: 12
        },
        {
          id: 402,
          web_name: "Núñez",
          team_id: 4,
          ownership_top10k: 22.1,
          points: 8
        },
        {
          id: 403,
          web_name: "Alexander-Arnold",
          team_id: 4,
          ownership_top10k: 38.7,
          points: 6
        }
      ]
    },
    home_ownership: 58.2,
    away_ownership: 51.3,
  }
];

export const mockStats = {
  totalGoals: 6,
  totalAssists: 3,
  highestScorer: {
    id: 401,
    web_name: "Salah",
    team_id: 4,
    ownership_top10k: 65.4,
    points: 12
  },
  mostOwned: null,
  biggestDifferential: null,
  gameweek: 1,
  timestamp: new Date().toISOString(),
};