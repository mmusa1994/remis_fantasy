import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        home: "Home",
        premierLeague: "Premier League",
        championsLeague: "Champions League",
        f1Fantasy: "F1 Fantasy",
      },
      // Hero Section
      hero: {
        title: "REMIS Fantasy",
        season: "Season 2025/26",
        subtitle:
          "Welcome to the most exciting fantasy leagues! Choose your league and show your sports knowledge.",
        openLeague: "Open League",
        liveFpl: "LIVE FPL",
        liveFplDescription:
          "Follow live Premier League matches with real-time updates, scores and fantasy points!",
        watchLive: "Watch Live",
      },
      // League Descriptions
      leagues: {
        premier: {
          name: "Premier League",
          description:
            "Create your dream team from Premier League players and compete with friends.",
        },
        champions: {
          name: "Champions League",
          description:
            "Experience the magic of European football with the best teams from across the continent.",
        },
        f1: {
          name: "F1 Fantasy",
          description:
            "Build your Formula 1 team and race for the championship with the world's best drivers.",
        },
      },
      // Stats
      stats: {
        totalPlayers: "Total Players",
        activeLeagues: "Active Leagues",
        prizesAwarded: "Prizes Awarded",
        liveMatches: "Live Matches",
      },
      // Navigation items
      navigation: {
        tables: "Tables",
        fplLive: "FPL Live",
        prizes: "Prizes",
        registration: "Registration",
        gallery: "Gallery",
      },
      // FPL Live page
      fplLive: {
        title: "FPL Live Dashboard",
        subtitle:
          "Real-time Fantasy Premier League tracking with live bonus predictions",
        howToUse: "How to use FPL Live",
        searchHelper: "Manager ID Search Helper",
        searchPlaceholder: "Search by Team Name",
        searchDescription:
          'Enter your team name (e.g., "FT Fantasy Team") to get personalized search suggestions',
        teamNamePlaceholder: "e.g., FT Warriors, My Team Name...",
        findTeam: "Find Team",
        currentManagerId: "Current Manager ID:",
        managerId: "Manager ID:",
        gameweek: "GW:",
        loadTeam: "Load Team",
        startLive: "Start Live",
        offline: "Offline — not polling",
        managerOverview: "Manager Overview",
        lastUpdated: "Last updated:",
        managerInfo: "Manager Info",
        name: "Name:",
        team: "Team:",
        changeName: "Change Name",
        overallPoints: "Overall Points:",
        overallRank: "Overall Rank:",
        gwPerformance: "GW{gw} Performance",
        activePoints: "Active Points:",
        benchPointsLong: "Bench Points:",
        finalBonus: "Final Bonus:",
        captainPointsLong: "Captain Points:",
        teamStats: "Team Stats",
        goals: "Goals",
        assists: "Assists",
        cleanSheets: "CS",
        yellowCards: "YC",
        redCards: "RC",
        saves: "Saves",
        bonusFinalized: "Bonus finalized",
        statusTitle: "Status of your Gameweek {gw}",
        loadTeamToSeeStatus: "Load team to see gameweek status",
        squadTitle: "Squad (XI + Bench)",
        showingFinalBonus: "Showing final bonus points",
        startingXI: "Starting XI",
        bench: "Bench",
        matchResults: "Match Results",
        live: "Live",
        finished: "Finished",
        finalBonus2: "Final bonus",
        settingsTitle: "FPL Settings",
        settingsExplanation: "Settings explanations",
        // Squad table columns
        squad: "Squad",
        loadTeamToSeeSquad: "Load a team to see squad details",
        position: "Pos",
        player: "Player",
        teamColumn: "Team",
        minutes: "Min",
        goalsShort: "G",
        assistsShort: "A",
        cleanSheetsShort: "CS",
        yellowCardsShort: "YC",
        redCardsShort: "RC",
        savesShort: "Saves",
        bpsShort: "BPS",
        bonusShort: "Bonus",
        totalShort: "Total",
        ictShort: "ICT",
        benchShort: "Bench",
        captain: "(C)",
        viceCaptain: "(VC)",
        tripleCaptain: "(TC)",
        // Advanced stats
        advancedStats: "Advanced Statistics",
        loadingAdvancedStats: "Loading advanced statistics...",
        loadTeamForAdvancedStats: "Load team to see advanced statistics",
        // League tables
        readyToGoLive: "Ready to Go Live!",
        selectLeagueAndStart:
          'Select your league above and click "Start Live" to begin tracking live standings with real-time bonus points and captain updates.',
        autoRefresh: "Auto-refresh every 30 seconds when active",
      },
      // Footer
      footer: {
        tagline:
          "For years we have been building tradition and trust in the fantasy football community.",
        subtitle:
          "Your passion, our experience - the perfect combination for an unforgettable season.",
        years: "Years",
        trust: "Trust",
        copyright: "© 2025 REMIS Fantasy by Muhamed Musa",
      },
      // Common
      common: {
        loading: "Loading...",
        error: "Error loading data",
        tryAgain: "Try Again",
        comingSoon: "Coming Soon",
        adminPanel: "Admin Panel",
      },
    },
  },
  bs: {
    translation: {
      // Navigation
      nav: {
        home: "Početna",
        premierLeague: "Premier Liga",
        championsLeague: "Liga Prvaka",
        f1Fantasy: "F1 Fantasy",
      },
      // Hero Section
      hero: {
        title: "REMIS Fantasy",
        season: "Sezona 2025/26",
        subtitle:
          "Dobrodošli u najuzbudljivije fantasy lige! Odaberite svoju ligu i pokažite svoje znanje sporta.",
        openLeague: "Otvori Ligu",
        liveFpl: "UŽIVO FPL",
        liveFplDescription:
          "Pratite uživo Premier Liga utakmice sa ažuriranjima u realnom vremenu, rezultatima i fantasy bodovima!",
        watchLive: "Gledaj Uživo",
      },
      // League Descriptions
      leagues: {
        premier: {
          name: "Premier Liga",
          description:
            "Kreirajte svoj tim iz snova od igrača Premier Lige i takmičite se sa prijateljima.",
        },
        champions: {
          name: "Liga Prvaka",
          description:
            "Doživite magiju evropskog fudbala sa najboljim timovima sa cijelog kontinenta.",
        },
        f1: {
          name: "F1 Fantasy",
          description:
            "Sastavite svoj Formula 1 tim i utrkujte se za prvenstvo sa najbolji vozačima svijeta.",
        },
      },
      // Stats
      stats: {
        totalPlayers: "Ukupno Igrača",
        activeLeagues: "Aktivne Lige",
        prizesAwarded: "Dodijeljene Nagrade",
        liveMatches: "Uživo Utakmice",
      },
      // Navigation items
      navigation: {
        tables: "Tabele",
        fplLive: "FPL Uživo",
        prizes: "Nagrade",
        registration: "Registracija",
        gallery: "Galerija",
      },
      // FPL Live page
      fplLive: {
        title: "FPL Live Dashboard",
        subtitle:
          "Real-time Fantasy Premier League praćenje sa live bonus predviđanjima",
        howToUse: "Kako koristiti FPL Live",
        searchHelper: "Pomoćnik za traženje Manager ID-ja",
        searchPlaceholder: "Pretraži po imenu tima",
        searchDescription:
          'Unesite ime vašeg tima (npr. "FT Fantasy Team") da dobijete personalizovane prijedloge',
        teamNamePlaceholder: "npr. FT Warriors, Moj Tim...",
        findTeam: "Pronađi Tim",
        currentManagerId: "Trenutni Manager ID:",
        managerId: "Manager ID:",
        gameweek: "GW:",
        loadTeam: "Učitaj Tim",
        startLive: "Pokreni Uživo",
        offline: "Offline — ne prati",
        managerOverview: "Pregled Menadžera",
        lastUpdated: "Poslednje ažurirano:",
        managerInfo: "Info Menadžera",
        name: "Ime:",
        team: "Tim:",
        changeName: "Promijeni Ime",
        overallPoints: "Ukupni Bodovi:",
        overallRank: "Ukupni Rang:",
        gwPerformance: "GW{gw} Performanse",
        activePoints: "Aktivni Bodovi:",
        benchPointsLong: "Bodovi Klupe:",
        finalBonus: "Finalni Bonus:",
        captainPointsLong: "Bodovi Kapitena:",
        teamStats: "Statistike Tima",
        goals: "Golovi",
        assists: "Asistencije",
        cleanSheets: "Čisti",
        yellowCards: "ŽK",
        redCards: "CK",
        saves: "Odbrane",
        bonusFinalized: "Bonus finalizovan",
        statusTitle: "Status vašeg Gameweek {gw}",
        loadTeamToSeeStatus: "Učitajte tim da vidite status gameweek-a",
        squadTitle: "Postava (XI + Klupa)",
        showingFinalBonus: "Prikazuje finalne bonus bodove",
        startingXI: "Početna postava",
        bench: "Klupa",
        matchResults: "Rezultati utakmica",
        live: "Uživo",
        finished: "Završeno",
        finalBonus2: "Finalni bonus",
        settingsTitle: "FPL Settings",
        settingsExplanation: "Settings objašnjenja",
        // Squad table columns
        squad: "Postava",
        loadTeamToSeeSquad: "Učitajte tim da vidite detalje postave",
        position: "Poz",
        player: "Igrač",
        teamColumn: "Tim",
        minutes: "Min",
        goalsShort: "G",
        assistsShort: "A",
        cleanSheetsShort: "ČM",
        yellowCardsShort: "ŽK",
        redCardsShort: "CK",
        savesShort: "Odbrane",
        bpsShort: "BPS",
        bonusShort: "Bonus",
        totalShort: "Ukupno",
        ictShort: "ICT",
        benchShort: "Klupa",
        captain: "(K)",
        viceCaptain: "(PK)",
        tripleCaptain: "(TK)",
        // Advanced stats
        advancedStats: "Napredne Statistike",
        loadingAdvancedStats: "Učitavam napredne statistike...",
        loadTeamForAdvancedStats: "Učitajte tim da vidite napredne statistike",
        // League tables
        readyToGoLive: "Spremni za Uživo!",
        selectLeagueAndStart:
          'Odaberite vašu ligu iznad i kliknite "Pokreni Uživo" da počnete praćenje uživo tabela sa bonus bodovima u realnom vremenu i ažuriranjima kapitena.',
        autoRefresh: "Auto-osvježavanje svakih 30 sekundi kada je aktivno",
      },
      // Footer
      footer: {
        tagline:
          "Godinama gradimo tradiciju i povjerenje u fantasy football zajednici.",
        subtitle:
          "Vaša strast, naše iskustvo - savršena kombinacija za nezaboravnu sezonu.",
        years: "Godina",
        trust: "Povjerenje",
        copyright: "© 2025 REMIS Fantasy by Muhamed Musa",
      },
      // Common
      common: {
        loading: "Učitavanje...",
        error: "Greška pri učitavanju podataka",
        tryAgain: "Pokušaj Ponovo",
        comingSoon: "Uskoro",
        adminPanel: "Admin Panel",
      },
    },
  },
  sr: {
    translation: {
      nav: {
        home: "Почетна",
        premierLeague: "Премијер Лига",
        championsLeague: "Лига Шампиона",
        f1Fantasy: "Ф1 Фантази",
      },
      hero: {
        title: "REMIS Fantasy",
        season: "Сезона 2025/26",
        subtitle:
          "Добродошли у најузбудљивије фантази лиге! Одаберите своју лигу и покажите своје знање спорта.",
        openLeague: "Отвори Лигу",
        liveFpl: "УЖИВО ФПЛ",
        liveFplDescription:
          "Пратите уживо Премијер лига утакмице са ажурирањима у реалном времену, резултатима и фантази бодовима!",
        watchLive: "Гледај Уживо",
      },
      common: {
        loading: "Учитавање...",
        error: "Грешка при учитавању података",
        tryAgain: "Покушај Поново",
        comingSoon: "Ускоро",
        adminPanel: "Админ Панел",
      },
    },
  },
  hr: {
    translation: {
      nav: {
        home: "Početna",
        premierLeague: "Premier Liga",
        championsLeague: "Liga Prvaka",
        f1Fantasy: "F1 Fantasy",
      },
      hero: {
        title: "REMIS Fantasy",
        season: "Sezona 2025/26",
        subtitle:
          "Dobrodošli u najuzbudljivije fantasy lige! Odaberite svoju ligu i pokažite svoje znanje sporta.",
        openLeague: "Otvori Ligu",
        liveFpl: "UŽIVO FPL",
        liveFplDescription:
          "Pratite uživo Premier Liga utakmice s ažuriranjima u stvarnom vremenu, rezultatima i fantasy bodovima!",
        watchLive: "Gledaj Uživo",
      },
      common: {
        loading: "Učitavanje...",
        error: "Greška pri učitavanju podataka",
        tryAgain: "Pokušaj Ponovno",
        comingSoon: "Uskoro",
        adminPanel: "Admin Panel",
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "bs", // Default to Bosnian
    lng: "bs", // Default language
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
