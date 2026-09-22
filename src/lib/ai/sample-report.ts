// Uzorak stvarnog AI izvještaja (gpt-4.1-mini, GW6 2026/27) — koristi se za mock mod i vizuelni pregled.
// Nikad se ne prikazuje korisnicima u produkciji.

import type { FplTeamAnalysisReport } from "@/lib/ai/fpl-analysis-prompt";

export const SAMPLE_TEAM_ANALYSIS_REPORT: FplTeamAnalysisReport = {
  "verdict": {
    "headline": "Tim solidan, ali treba poboljšati napad i rotacije defanzivaca",
    "grade": 65,
    "gradeLabel": "Solidan",
    "summary": "Imaš dobar balans minuta i forme, ali napadači osim Haalanda podbacuju u bodovima u odnosu na podlogu. Odbrana je stabilna, ali sa tri igrača iz NFO i LEE treba paziti na rotacije. Nema hitnih povreda, ali raspored nije idealan za neke igrače."
  },
  "strengths": [
    {
      "title": "Dobar minutni učinak ključnih igrača",
      "detail": "Haaland (450 min), B.Fernandes (450 min) i Saka (416 min) igraju svih 5 kola i donose stabilne bodove."
    },
    {
      "title": "Dobar raspored za NFO i MUN u narednih 5 kola",
      "detail": "NFO ima prosječan FDR 3.2, a MUN 3.2, oba sa relativno lakim utakmicama u GW6 i GW7."
    },
    {
      "title": "Visoka forma i xGI90 kod Haalanda i Gibbs-Whitea",
      "detail": "Haaland ima formu 7.8 i xGI90 0.99, Gibbs-White formu 6.5 i xGI90 0.59, što ukazuje na napadački potencijal."
    }
  ],
  "weaknesses": [
    {
      "title": "Napad slabiji od očekivanja osim Haalanda",
      "detail": "Calvert-Lewin ima PPG 4.4 sa xGI90 0.66, Barry PPG 4.0 sa xGI90 0.79, što je ispod optimalnog za njihove cijene.",
      "severity": "medium"
    },
    {
      "title": "Defanzivci iz NFO i LEE imaju visok rizik rotacije",
      "detail": "Muñoz ima samo 257 minuta i 3 starts, a N.Williams i Muharemović su jedini sa punih 450 min, ali NFO i LEE imaju prosjek FDR 3.2 i 3.6 što može donijeti neizvjesnost.",
      "severity": "medium"
    },
    {
      "title": "Nema banke za hitne transfere",
      "detail": "Banka je 0.0m što ograničava fleksibilnost za brze izmjene i kupovinu boljih igrača.",
      "severity": "high"
    }
  ],
  "urgent": [],
  "transferPlan": {
    "recommendation": "two_transfers",
    "rationale": "Potrebno je poboljšati napad i smanjiti rizik rotacije u odbrani. Banka je prazna, ali imaš 5 slobodnih transfera, pa možeš iskoristiti dva za kvalitetne promjene bez gubitka bodova.",
    "transfersUsed": 0,
    "hitCost": 0,
    "bankAfter": 0,
    "moves": [
      {
        "priority": 1,
        "netSpend": -0.6,
        "confidence": 75,
        "out": {
          "name": "Calvert-Lewin",
          "team": "LEE",
          "position": "FWD",
          "price": 6,
          "reason": "Slab učinak i podloga u napadu"
        },
        "in": {
          "name": "Isak",
          "team": "LIV",
          "position": "FWD",
          "price": 9.1,
          "reason": "Bolja forma (6.6) i xGI90 (0.79), te bolji raspored"
        }
      },
      {
        "priority": 2,
        "netSpend": 0,
        "confidence": 70,
        "out": {
          "name": "Muñoz",
          "team": "NFO",
          "position": "DEF",
          "price": 5.4,
          "reason": "Niska minutaža i rotacija"
        },
        "in": {
          "name": "De Cuyper",
          "team": "BHA",
          "position": "DEF",
          "price": 4.9,
          "reason": "Bolja forma (7.6), više minuta (423) i solidan raspored"
        }
      }
    ],
    "alternatives": [
      {
        "title": "Čuvati transfere",
        "detail": "Možeš sačekati još jedno kolo jer nema hitnih povreda i raspored nije katastrofalan."
      },
      {
        "title": "Zamijeniti Barryja za diferencijalnog napadača",
        "detail": "Barry ima nisku formu i podlogu, ali nema idealnog zamjenskog igrača ispod 6.0m u podacima."
      }
    ]
  },
  "captaincy": [
    {
      "rank": 1,
      "player": "Haaland",
      "team": "MCI",
      "fixture": "LIV(A,4)",
      "reason": "Najbolja forma (7.8), visok xGI90 (0.99) i sigurnost minuta (450)",
      "confidence": 90,
      "isDifferential": false
    },
    {
      "rank": 2,
      "player": "B.Fernandes",
      "team": "MUN",
      "fixture": "TOT(H,3)",
      "reason": "Dobra forma (7.2) i xGI90 (0.77), sigurnost minuta (450)",
      "confidence": 75,
      "isDifferential": false
    },
    {
      "rank": 3,
      "player": "Saka",
      "team": "ARS",
      "fixture": "LEE(H,2)",
      "reason": "Solidna forma (5.8), visok xGI90 (0.91) i dobar raspored",
      "confidence": 70,
      "isDifferential": false
    }
  ],
  "lineup": {
    "formation": "3-5-2",
    "startingChanges": [
      "Isak",
      "De Cuyper"
    ],
    "benchOrder": [
      {
        "order": 1,
        "player": "Maitland-Niles",
        "reason": "Niska minutaža i rotacija, klupa je sigurna"
      },
      {
        "order": 2,
        "player": "Barry",
        "reason": "Slab učinak i podloga, rezervni napadač"
      },
      {
        "order": 3,
        "player": "Forster",
        "reason": "Nema minuta, rezerva golmana"
      },
      {
        "order": 4,
        "player": "Greaves",
        "reason": "Nema minuta, rezerva defanzivac"
      }
    ],
    "note": "Zadrži Haalanda kao kapiten, ubaci Isaka i De Cuypera u startnu postavu za bolji učinak."
  },
  "chipPlan": {
    "chip": "triple_captain",
    "targetGW": "6",
    "rationale": "Iskoristi Triple Captain na Haalanda u GW6 zbog lakšeg rasporeda i njegove forme."
  },
  "fixtureOutlook": [
    {
      "team": "LEE",
      "run": "ARS(A,5), MUN(H,4), SUN(A,3), BOU(A,3), TOT(H,3)",
      "verdict": "Težak raspored sa FDR 3.6",
      "sentiment": "bad"
    },
    {
      "team": "NFO",
      "run": "CRY(A,3), ARS(H,4), IPS(A,2), BRE(A,3), MCI(H,4)",
      "verdict": "Srednje težak raspored, FDR 3.2",
      "sentiment": "neutral"
    },
    {
      "team": "MUN",
      "run": "TOT(H,3), LEE(A,3), BOU(H,3), CHE(A,4), AVL(H,3)",
      "verdict": "Relativno dobar raspored, FDR 3.2",
      "sentiment": "good"
    },
    {
      "team": "NEW",
      "run": "COV(A,2), AVL(H,3), CRY(A,3), EVE(H,3), FUL(A,3)",
      "verdict": "Lagan raspored, FDR 2.8",
      "sentiment": "good"
    },
    {
      "team": "MCI",
      "run": "LIV(A,4), IPS(H,2), AVL(A,4), BHA(H,2), NFO(A,3)",
      "verdict": "Srednje težak raspored, FDR 3.0",
      "sentiment": "neutral"
    }
  ],
  "watchlist": [
    {
      "player": "Isak",
      "team": "LIV",
      "price": 9.1,
      "reason": "Bolja forma i xGI90 od trenutnih napadača",
      "timing": "Sada"
    },
    {
      "player": "De Cuyper",
      "team": "BHA",
      "price": 4.9,
      "reason": "Stabilan defanzivac sa dobrom formom i minutama",
      "timing": "Sada"
    },
    {
      "player": "João Pedro",
      "team": "CHE",
      "price": 7.7,
      "reason": "Povreda, rizik od neigranja u GW6",
      "timing": "Prati"
    },
    {
      "player": "Palmer",
      "team": "CHE",
      "price": 9.7,
      "reason": "Povreda, 75% šanse za igru, rizik",
      "timing": "Prati"
    }
  ],
  "risks": [
    "Nema banke za hitne transfere",
    "Rotacija u odbrani NFO i LEE",
    "Povrede CHE igrača sa 75% šanse za igru"
  ],
  "actionPlan": [
    "Zameni Calvert-Lewina Isakom za bolji napad",
    "Zameni Muñoza De Cuyperom za sigurniju odbranu",
    "Postavi Haalanda kao kapiten i iskoristi Triple Captain chip u GW6",
    "Prati stanje povreda CHE igrača i reaguj ako ne budu igrali",
    "Drži Maitland-Niles i Barryja na klupi zbog rotacije i slabije forme"
  ]
};
