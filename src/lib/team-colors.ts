// Premier League Team Colors 2024/25 Season - Prema DATABASE ID-jevima

export const TEAM_COLORS = {
  1: { // Arsenal
    primary: '#DC143C',
    secondary: '#FFFFFF',
    name: 'Arsenal',
    shortName: 'ARS'
  },
  2: { // Aston Villa
    primary: '#95BFE5',
    secondary: '#7A003C',
    name: 'Aston Villa',
    shortName: 'AVL'
  },
  3: { // Burnley
    primary: '#6C1D45',
    secondary: '#99D6EA',
    name: 'Burnley',
    shortName: 'BUR'
  },
  4: { // Bournemouth
    primary: '#DA020E',
    secondary: '#000000',
    name: 'Bournemouth',
    shortName: 'BOU'
  },
  5: { // Brentford
    primary: '#E30613',
    secondary: '#FFFFFF',
    name: 'Brentford',
    shortName: 'BRE'
  },
  6: { // Brighton
    primary: '#0057B8',
    secondary: '#FFCD00',
    name: 'Brighton',
    shortName: 'BHA'
  },
  7: { // Chelsea
    primary: '#034694',
    secondary: '#FFFFFF',
    name: 'Chelsea',
    shortName: 'CHE'
  },
  8: { // Crystal Palace
    primary: '#1B458F',
    secondary: '#C4122E',
    name: 'Crystal Palace',
    shortName: 'CRY'
  },
  9: { // Everton
    primary: '#003399',
    secondary: '#FFFFFF',
    name: 'Everton',
    shortName: 'EVE'
  },
  10: { // Fulham
    primary: '#000000',
    secondary: '#FFFFFF',
    name: 'Fulham',
    shortName: 'FUL'
  },
  11: { // Leeds
    primary: '#FFCD00',
    secondary: '#FFFFFF',
    name: 'Leeds',
    shortName: 'LEE'
  },
  12: { // Liverpool
    primary: '#C8102E',
    secondary: '#F6EB61',
    name: 'Liverpool',
    shortName: 'LIV'
  },
  13: { // Manchester City
    primary: '#6CABDD',
    secondary: '#FFFFFF',
    name: 'Man City',
    shortName: 'MCI'
  },
  14: { // Manchester United
    primary: '#DA020E',
    secondary: '#FFE500',
    name: 'Man Utd',
    shortName: 'MUN'
  },
  15: { // Newcastle
    primary: '#241F20',
    secondary: '#FFFFFF',
    name: 'Newcastle',
    shortName: 'NEW'
  },
  16: { // Nottingham Forest
    primary: '#DD0000',
    secondary: '#FFFFFF',
    name: 'Nott\'m Forest',
    shortName: 'NFO'
  },
  17: { // Sunderland
    primary: '#EB172B',
    secondary: '#FFFFFF',
    name: 'Sunderland',
    shortName: 'SUN'
  },
  18: { // Tottenham (Spurs)
    primary: '#132257',
    secondary: '#FFFFFF',
    name: 'Spurs',
    shortName: 'TOT'
  },
  19: { // West Ham
    primary: '#7A263A',
    secondary: '#1BB1E7',
    name: 'West Ham',
    shortName: 'WHU'
  },
  20: { // Wolves
    primary: '#FDB913',
    secondary: '#231F20',
    name: 'Wolves',
    shortName: 'WOL'
  }
} as const;

export const getTeamColors = (teamId: number) => {
  return TEAM_COLORS[teamId as keyof typeof TEAM_COLORS] || {
    primary: '#808080',
    secondary: '#FFFFFF',
    name: `Team ${teamId}`,
    shortName: `T${teamId}`
  };
};
