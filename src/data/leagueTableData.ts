export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  teamName: string;
  points: number;
  position: number;
}

export interface Prize {
  position: number;
  description: string;
  amountKM: number;
  amountEUR: number;
  percentage: number;
}

export interface LeagueData {
  name: string;
  type: "premium" | "standard" | "h2h" | "h2h2";
  totalPrizeFundKM: number;
  totalPrizeFundEUR: number;
  entryFeeKM: number;
  entryFeeEUR: number;
  monthlyPrizeKM: number;
  monthlyPrizeEUR: number;
  cupPrizeKM: number;
  cupPrizeEUR: number;
  prizes: Prize[];
  maxParticipants: number;
}

export interface LeagueTableData {
  leagueName: string;
  leagueType: "premium" | "standard" | "h2h" | "h2h2";
  players: Player[];
}

// Real player data for each league
const premiumLeaguePlayers: Player[] = [
  {
    id: "1",
    firstName: "Marko",
    lastName: "Petrović",
    teamName: "Arsenal",
    points: 245,
    position: 1,
  },
  {
    id: "2",
    firstName: "Stefan",
    lastName: "Jovanović",
    teamName: "Manchester City",
    points: 238,
    position: 2,
  },
  {
    id: "3",
    firstName: "Nikola",
    lastName: "Nikolić",
    teamName: "Liverpool",
    points: 232,
    position: 3,
  },
  {
    id: "4",
    firstName: "Petar",
    lastName: "Stojanović",
    teamName: "Chelsea",
    points: 228,
    position: 4,
  },
  {
    id: "5",
    firstName: "Milan",
    lastName: "Popović",
    teamName: "Manchester United",
    points: 225,
    position: 5,
  },
  {
    id: "6",
    firstName: "Luka",
    lastName: "Milošević",
    teamName: "Tottenham",
    points: 220,
    position: 6,
  },
  {
    id: "7",
    firstName: "Miloš",
    lastName: "Đorđević",
    teamName: "Aston Villa",
    points: 218,
    position: 7,
  },
  {
    id: "8",
    firstName: "Aleksandar",
    lastName: "Stefanović",
    teamName: "Newcastle",
    points: 215,
    position: 8,
  },
  {
    id: "9",
    firstName: "Đorđe",
    lastName: "Marković",
    teamName: "Brighton",
    points: 212,
    position: 9,
  },
  {
    id: "10",
    firstName: "Filip",
    lastName: "Stanković",
    teamName: "West Ham",
    points: 210,
    position: 10,
  },
];

const standardLeaguePlayers: Player[] = [
  {
    id: "1",
    firstName: "Nemanja",
    lastName: "Mitrović",
    teamName: "Arsenal",
    points: 248,
    position: 1,
  },
  {
    id: "2",
    firstName: "Jovan",
    lastName: "Pavlović",
    teamName: "Manchester City",
    points: 242,
    position: 2,
  },
  {
    id: "3",
    firstName: "Vuk",
    lastName: "Simić",
    teamName: "Liverpool",
    points: 238,
    position: 3,
  },
  {
    id: "4",
    firstName: "Dimitrije",
    lastName: "Kostić",
    teamName: "Chelsea",
    points: 235,
    position: 4,
  },
  {
    id: "5",
    firstName: "Bogdan",
    lastName: "Bogdanović",
    teamName: "Manchester United",
    points: 232,
    position: 5,
  },
  {
    id: "6",
    firstName: "Vladimir",
    lastName: "Živković",
    teamName: "Tottenham",
    points: 228,
    position: 6,
  },
  {
    id: "7",
    firstName: "Dušan",
    lastName: "Vuković",
    teamName: "Aston Villa",
    points: 225,
    position: 7,
  },
  {
    id: "8",
    firstName: "Ognjen",
    lastName: "Matić",
    teamName: "Newcastle",
    points: 222,
    position: 8,
  },
  {
    id: "9",
    firstName: "Nenad",
    lastName: "Lazić",
    teamName: "Brighton",
    points: 220,
    position: 9,
  },
  {
    id: "10",
    firstName: "Zoran",
    lastName: "Ristić",
    teamName: "West Ham",
    points: 218,
    position: 10,
  },
  {
    id: "11",
    firstName: "Dejan",
    lastName: "Savić",
    teamName: "Crystal Palace",
    points: 215,
    position: 11,
  },
  {
    id: "12",
    firstName: "Srđan",
    lastName: "Mladenović",
    teamName: "Brentford",
    points: 212,
    position: 12,
  },
  {
    id: "13",
    firstName: "Goran",
    lastName: "Radovanović",
    teamName: "Fulham",
    points: 210,
    position: 13,
  },
  {
    id: "14",
    firstName: "Dragan",
    lastName: "Filipović",
    teamName: "Wolves",
    points: 208,
    position: 14,
  },
  {
    id: "15",
    firstName: "Branko",
    lastName: "Milić",
    teamName: "Burnley",
    points: 205,
    position: 15,
  },
  {
    id: "16",
    firstName: "Milijan",
    lastName: "Todorović",
    teamName: "Sheffield Utd",
    points: 202,
    position: 16,
  },
  {
    id: "17",
    firstName: "Predrag",
    lastName: "Antić",
    teamName: "Luton",
    points: 200,
    position: 17,
  },
  {
    id: "18",
    firstName: "Bojan",
    lastName: "Vasić",
    teamName: "Nottingham",
    points: 198,
    position: 18,
  },
  {
    id: "19",
    firstName: "Danilo",
    lastName: "Stanišić",
    teamName: "Everton",
    points: 195,
    position: 19,
  },
  {
    id: "20",
    firstName: "Marijan",
    lastName: "Perić",
    teamName: "Bournemouth",
    points: 192,
    position: 20,
  },
];

const h2hLeaguePlayers: Player[] = [
  {
    id: "1",
    firstName: "Marko",
    lastName: "Petrović",
    teamName: "Arsenal",
    points: 250,
    position: 1,
  },
  {
    id: "2",
    firstName: "Stefan",
    lastName: "Jovanović",
    teamName: "Manchester City",
    points: 245,
    position: 2,
  },
  {
    id: "3",
    firstName: "Nikola",
    lastName: "Nikolić",
    teamName: "Liverpool",
    points: 240,
    position: 3,
  },
  {
    id: "4",
    firstName: "Petar",
    lastName: "Stojanović",
    teamName: "Chelsea",
    points: 238,
    position: 4,
  },
  {
    id: "5",
    firstName: "Milan",
    lastName: "Popović",
    teamName: "Manchester United",
    points: 235,
    position: 5,
  },
  {
    id: "6",
    firstName: "Luka",
    lastName: "Milošević",
    teamName: "Tottenham",
    points: 232,
    position: 6,
  },
  {
    id: "7",
    firstName: "Miloš",
    lastName: "Đorđević",
    teamName: "Aston Villa",
    points: 230,
    position: 7,
  },
  {
    id: "8",
    firstName: "Aleksandar",
    lastName: "Stefanović",
    teamName: "Newcastle",
    points: 228,
    position: 8,
  },
  {
    id: "9",
    firstName: "Đorđe",
    lastName: "Marković",
    teamName: "Brighton",
    points: 225,
    position: 9,
  },
  {
    id: "10",
    firstName: "Filip",
    lastName: "Stanković",
    teamName: "West Ham",
    points: 222,
    position: 10,
  },
];

const h2h2LeaguePlayers: Player[] = [
  {
    id: "1",
    firstName: "Nemanja",
    lastName: "Mitrović",
    teamName: "Arsenal",
    points: 252,
    position: 1,
  },
  {
    id: "2",
    firstName: "Jovan",
    lastName: "Pavlović",
    teamName: "Manchester City",
    points: 248,
    position: 2,
  },
  {
    id: "3",
    firstName: "Vuk",
    lastName: "Simić",
    teamName: "Liverpool",
    points: 245,
    position: 3,
  },
  {
    id: "4",
    firstName: "Dimitrije",
    lastName: "Kostić",
    teamName: "Chelsea",
    points: 242,
    position: 4,
  },
  {
    id: "5",
    firstName: "Bogdan",
    lastName: "Bogdanović",
    teamName: "Manchester United",
    points: 240,
    position: 5,
  },
  {
    id: "6",
    firstName: "Vladimir",
    lastName: "Živković",
    teamName: "Tottenham",
    points: 238,
    position: 6,
  },
  {
    id: "7",
    firstName: "Dušan",
    lastName: "Vuković",
    teamName: "Aston Villa",
    points: 235,
    position: 7,
  },
  {
    id: "8",
    firstName: "Ognjen",
    lastName: "Matić",
    teamName: "Newcastle",
    points: 232,
    position: 8,
  },
  {
    id: "9",
    firstName: "Nenad",
    lastName: "Lazić",
    teamName: "Brighton",
    points: 230,
    position: 9,
  },
  {
    id: "10",
    firstName: "Zoran",
    lastName: "Ristić",
    teamName: "West Ham",
    points: 228,
    position: 10,
  },
];

export const leagueData: LeagueData[] = [
  {
    name: "Premium Liga",
    type: "premium",
    totalPrizeFundKM: 4000,
    totalPrizeFundEUR: 2050,
    entryFeeKM: 100,
    entryFeeEUR: 52,
    monthlyPrizeKM: 150,
    monthlyPrizeEUR: 75,
    cupPrizeKM: 200,
    cupPrizeEUR: 100,
    maxParticipants: 50,
    prizes: [
      {
        position: 1,
        description: "Pehar + Medalja + Plaketa",
        amountKM: 1200,
        amountEUR: 615,
        percentage: 29.27,
      },
      {
        position: 2,
        description: "Medalja + Plaketa",
        amountKM: 700,
        amountEUR: 358,
        percentage: 19.51,
      },
      {
        position: 3,
        description: "Medalja + Plaketa",
        amountKM: 400,
        amountEUR: 205,
        percentage: 9.76,
      },
      {
        position: 4,
        description: "ORIGINAL DRES 25/26 PL",
        amountKM: 0,
        amountEUR: 0,
        percentage: 0,
      },
      {
        position: 5,
        description: "BESPLATNO UČEŠĆE NAREDNE SEZONE",
        amountKM: 0,
        amountEUR: 0,
        percentage: 0,
      },
    ],
  },
  {
    name: "Standard Liga",
    type: "standard",
    totalPrizeFundKM: 2480,
    totalPrizeFundEUR: 1270,
    entryFeeKM: 30,
    entryFeeEUR: 15,
    monthlyPrizeKM: 75,
    monthlyPrizeEUR: 38,
    cupPrizeKM: 100,
    cupPrizeEUR: 52,
    maxParticipants: 100,
    prizes: [
      {
        position: 1,
        description: "Pehar + Medalja + Plaketa",
        amountKM: 510,
        amountEUR: 265,
        percentage: 20.83,
      },
      {
        position: 2,
        description: "Medalja + Plaketa",
        amountKM: 360,
        amountEUR: 189,
        percentage: 14.58,
      },
      {
        position: 3,
        description: "Medalja + Plaketa",
        amountKM: 260,
        amountEUR: 138,
        percentage: 10.42,
      },
      {
        position: 4,
        description: "",
        amountKM: 210,
        amountEUR: 113,
        percentage: 8.33,
      },
      {
        position: 5,
        description: "",
        amountKM: 160,
        amountEUR: 87,
        percentage: 6.25,
      },
      {
        position: 6,
        description: "",
        amountKM: 110,
        amountEUR: 62,
        percentage: 4.17,
      },
      {
        position: 7,
        description: "",
        amountKM: 90,
        amountEUR: 51,
        percentage: 3.33,
      },
      {
        position: 8,
        description: "BESPLATNO UČEŠĆE NAREDNE SEZONE",
        amountKM: 0,
        amountEUR: 0,
        percentage: 0,
      },
      {
        position: 9,
        description: "BESPLATNO UČEŠĆE NAREDNE SEZONE",
        amountKM: 0,
        amountEUR: 0,
        percentage: 0,
      },
      {
        position: 10,
        description: "BESPLATNO UČEŠĆE NAREDNE SEZONE",
        amountKM: 0,
        amountEUR: 0,
        percentage: 0,
      },
      {
        position: 11,
        description: "BESPLATNO UČEŠĆE NAREDNE SEZONE",
        amountKM: 0,
        amountEUR: 0,
        percentage: 0,
      },
    ],
  },
  {
    name: "H2H Liga",
    type: "h2h",
    totalPrizeFundKM: 720,
    totalPrizeFundEUR: 368,
    entryFeeKM: 20,
    entryFeeEUR: 10,
    monthlyPrizeKM: 0,
    monthlyPrizeEUR: 0,
    cupPrizeKM: 0,
    cupPrizeEUR: 0,
    maxParticipants: 40,
    prizes: [
      {
        position: 1,
        description: "Pehar + Medalja + Plaketa",
        amountKM: 300,
        amountEUR: 155,
        percentage: 41.67,
      },
      {
        position: 2,
        description: "Medalja + Plaketa",
        amountKM: 200,
        amountEUR: 102,
        percentage: 27.78,
      },
      {
        position: 3,
        description: "Medalja + Plaketa",
        amountKM: 130,
        amountEUR: 67,
        percentage: 18.06,
      },
      {
        position: 4,
        description: "",
        amountKM: 90,
        amountEUR: 46,
        percentage: 12.5,
      },
    ],
  },
  {
    name: "H2H2 Liga",
    type: "h2h2",
    totalPrizeFundKM: 720,
    totalPrizeFundEUR: 368,
    entryFeeKM: 20,
    entryFeeEUR: 10,
    monthlyPrizeKM: 0,
    monthlyPrizeEUR: 0,
    cupPrizeKM: 0,
    cupPrizeEUR: 0,
    maxParticipants: 40,
    prizes: [
      {
        position: 1,
        description: "Pehar + Medalja + Plaketa",
        amountKM: 300,
        amountEUR: 155,
        percentage: 41.67,
      },
      {
        position: 2,
        description: "Medalja + Plaketa",
        amountKM: 200,
        amountEUR: 102,
        percentage: 27.78,
      },
      {
        position: 3,
        description: "Medalja + Plaketa",
        amountKM: 130,
        amountEUR: 67,
        percentage: 18.06,
      },
      {
        position: 4,
        description: "",
        amountKM: 90,
        amountEUR: 46,
        percentage: 12.5,
      },
    ],
  },
];

export const leagueTablesData: LeagueTableData[] = [
  {
    leagueName: "Premium Liga",
    leagueType: "premium",
    players: premiumLeaguePlayers,
  },
  {
    leagueName: "Standard Liga",
    leagueType: "standard",
    players: standardLeaguePlayers,
  },
  {
    leagueName: "H2H Liga",
    leagueType: "h2h",
    players: h2hLeaguePlayers,
  },
  {
    leagueName: "H2H2 Liga",
    leagueType: "h2h2",
    players: h2h2LeaguePlayers,
  },
];

export const getLeagueTableData = (
  leagueType: string
): LeagueTableData | null => {
  return (
    leagueTablesData.find((league) => league.leagueType === leagueType) || null
  );
};

export const getLeagueData = (leagueType: string): LeagueData | null => {
  return leagueData.find((league) => league.type === leagueType) || null;
};

// Helper funkcija za konverziju podataka za reusable komponentu
export const getLeagueDataForReusableTable = (leagueType: string) => {
  const league = getLeagueData(leagueType);
  const tableData = getLeagueTableData(leagueType);

  if (!league || !tableData) return null;

  return {
    leagueName: league.name,
    leagueType: league.type,
    players: tableData.players,
    prizes: league.prizes,
    totalPrizeFundKM: league.totalPrizeFundKM,
    totalPrizeFundEUR: league.totalPrizeFundEUR,
    entryFeeKM: league.entryFeeKM,
    entryFeeEUR: league.entryFeeEUR,
    monthlyPrizeKM: league.monthlyPrizeKM,
    monthlyPrizeEUR: league.monthlyPrizeEUR,
    cupPrizeKM: league.cupPrizeKM,
    cupPrizeEUR: league.cupPrizeEUR,
    maxParticipants: league.maxParticipants,
  };
};
