export interface Prize {
  position: number;
  description: string;
  amountKM: number;
  amountEUR: number;
  percentage: number;
}

export interface LeagueData {
  name: string;
  type: "premium" | "standard" | "h2h" | "h2h2" | "free";
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
  leagueType: "premium" | "standard" | "h2h" | "h2h2" | "free";
}

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
  {
    name: "Free Liga",
    type: "free",
    totalPrizeFundKM: 0,
    totalPrizeFundEUR: 0,
    entryFeeKM: 0,
    entryFeeEUR: 0,
    monthlyPrizeKM: 0,
    monthlyPrizeEUR: 0,
    cupPrizeKM: 0,
    cupPrizeEUR: 0,
    maxParticipants: 1,
    prizes: [
      {
        position: 1,
        description: "ORIGINAL DRES Premier Liga 25/26",
        amountKM: 0,
        amountEUR: 0,
        percentage: 0,
      },
    ],
  },
];

export const getLeagueDataForReusableTable = (leagueType: string) => {
  return leagueData.find((league) => league.type === leagueType);
};
