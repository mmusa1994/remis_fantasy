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
        liveEvents: "LIVE BPS Tracker",
        noEventsYet: "No events yet",
        startLivePolling: "Start live polling to see real-time updates",
        howToFindManagerId: "How to find Manager ID",
        yourManagerIdIs: "Your Manager ID is:",
        enterManagerId: "Enter Manager ID",
        pleaseEnterManagerId: "Please enter a Manager ID first",
        searchPlaceholder: "Search by Team Name",
        searchDescription:
          'Enter your team name (e.g., "FT Fantasy Team") to get personalized search suggestions',
        teamNamePlaceholder: "e.g., FT Warriors, My Team Name...",
        findTeam: "Find Team",
        searching: "Searching...",
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
        gwPerformance: "GW{{gw}} Performance",
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
        statusTitle: "Status of your Gameweek {{gw}}",
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
        // Settings Card
        settingsCardTitle: "FPL Settings",
        settingsCardManagerId: "Manager ID",
        settingsCardGameweek: "Gameweek",
        settingsCardProxyUrl: "Proxy URL",
        settingsCardCronSecret: "CRON Secret",
        settingsCardSaveSettings: "Save Settings",
        settingsCardSaving: "Saving...",
        // Live Events
        eventGoal: "Goal",
        eventAssist: "Assist",
        eventYellowCard: "Yellow Card",
        eventRedCard: "Red Card",
        eventPenaltyMissed: "Penalty Missed",
        eventPenaltySaved: "Penalty Saved",
        eventOwnGoal: "Own Goal",
        eventSave: "Save",
        eventCleanSheet: "Clean Sheet",
        eventGoalConceded: "Goal Conceded",
        eventBonusPoints: "Bonus Points",
        eventTackle: "Tackle",
        eventInterception: "Interception",
        eventClearance: "Clearance",
        // Live Tracker
        liveTrackerTitle: "LIVE BPS Tracker",
        liveTrackerLivePolling: "Live — polling",
        liveTrackerOfflinePolling: "Offline — not polling",
        liveTrackerJustNow: "Just now",
        liveTrackerMinAgo: "min ago",
        liveTrackerMinsAgo: "mins ago",
        liveTrackerHourAgo: "hour ago",
        liveTrackerHoursAgo: "hours ago",
        // League Tables
        premiumLeague: "Premium Liga",
        standardLeague: "Standard Liga",
        h2hLeague: "H2H Liga",
        h2h2League: "H2H2 Liga",
        freeLeague: "Free Liga",
        leagueTableErrorLoading: "Failed to load tables",
        detailedSteps: "Detailed usage steps",
        howToFindManagerIdDetailed: "How to find Manager ID",
        openWebBrowser: "Open web browser (Chrome, Firefox, Safari)",
        goToFPLWebsite: "Go to fantasy.premierleague.com",
        loginToAccount: "Log in with your Fantasy Premier League account",
        clickPointsTab: 'Click on "Points" tab in main navigation',
        copyNumbersFromURL: "Copy numbers from URL (e.g. entry/133444/event/1)",
        exampleURL: "Example URL:",
        yourManagerIdIs2: "Your Manager ID is",
        browserURLExample:
          'This is how the URL looks in browser when you click "Points"',
        detailedUsageSteps: "Detailed usage steps",
        enterManagerIdStep:
          "Enter Manager ID (e.g. 133444) and select current Gameweek",
        clickLoadTeamStep:
          'Click "Load Team" to load your team and basic statistics',
        fetchNowOrStartLive:
          '"Fetch Now" for manual refresh or "Start Live" for automatic tracking',
        followLiveBPS:
          "Follow LIVE BPS Tracker for goals, assists and cards in real-time",
        bonusPointsPredicted:
          "Bonus points are predicted in real-time until they become final post-match",
        quickLoadByManagerId: "Quick Load by Manager ID",
        additionalHelp: "Additional Help & Methods",
        moreTraditionalMethods:
          "More traditional methods if team name search doesn't work",
        traditionalMethods: "Traditional Methods:",
        emergencyMethods: "Emergency Methods",
        quickTips: "Quick Tips",
        managerIdIsNumber: "Manager ID is a number (e.g., 133444)",
        findInProfileURL: "You can find it in your FPL profile URL",
        visibleInLeagueStandings:
          "It's visible in league standings when you click your team",
        teamWillBeSaved:
          "Once loaded, your team will be saved for quick access",
        fplProxyURL: "FPL Proxy URL:",
        fplProxyDescription:
          "Optional field to bypass CORS issues. Use only if you have problems accessing FPL API.",
        cronSecret: "CRON Secret:",
        cronSecretDescription:
          "Security key for server-side automation and scheduled tasks. Required for backend operations.",
        liveBonus: "Live Bonus:",
        liveBonusDescription:
          "YES! Bonus points are calculated live during matches based on BPS (Bonus Points System) statistics.",
        pointsSystem: "Points System:",
        pointsSystemDescription:
          "Active = starting team (positions 1-11), Bench = substitutes (positions 12-15)",
        livePollingActive: "Live polling active - updating every 15 seconds",
        loadTeamFirst: "Load a team first",
        // Advanced Statistics
        cloneAnalysis: "Clone Analysis",
        updatingData: "Updating data...",
        foundExactly: "We found exactly",
        clonesOfYourTeam: "clones of your team in top 1 million!",
        literallyOneInMillion: "You are literally one in a million!",
        uniqueTeam: "Unique team",
        creativeSelection: "Creative selection",
        originalApproach: "Original approach",
        averageClonesPerManager: "Average clones per manager:",
        mostDuplicatedTeam: "Most duplicated team:",
        sharesPlayersWithActiveManagers: "Shares players with active managers:",
        cloneRating: "Clone rating:",
        rankDetails: "Rank Details",
        gameweekPoints: "Gameweek points",
        rankImprovement: "Rank improvement",
        topPercentile: "Top percentile",
        currentRank: "Current rank",
        pointsGained: "Points gained",
        benchPoints: "Bench points",
        averageResultInGW: "Average result in GW",
        playerPerformanceAnalysis: "Player Performance Analysis",
        stars: "Stars",
        flops: "Flops",
        killers: "Killers",
        points: "points",
        teamComparison: "Comparison with Top 10k, Overall and Elite managers",
        statistics: "Statistics",
        yourTeam: "Your Team",
        top10k: "Top 10k",
        overall: "Overall",
        elite: "Elite",
        finalResult: "Final result",
        captainPoints: "Captain points",
        detailedCaptainAnalysis: "Detailed Captain Analysis",
        finishedWith: "finished with",
        pointsHigher: "points higher",
        thanAverageEliteCaptain: "than average elite captain",
        excellentCaptainChoice: "Excellent captain choice for this gameweek!",
        eliteCaptainPerformance: "Elite captain performance",
        // Gameweek Status
        gameweekStatusTitle: "Status of your Gameweek {{gw}}",
        loadingGameweekStatus: "Loading gameweek status...",
        loadTeamToSeeGameweekStatus: "Load a team to see gameweek status",
        youAreOn: "You are on",
        greenArrow: "Green Arrow",
        redArrow: "Red Arrow",
        noChange: "No Change",
        greenArrowWithMargin: "Green arrow with margin of {{points}} points 👏",
        redArrowWithMargin: "Red arrow with margin of {{points}} points 😔",
        noRankChangeThisGameweek: "No rank change this gameweek",
        gameweekPointsStatus: "Gameweek Points",
        averageResult: "Average result: {{points}} points",
        performance: "Performance",
        above: "Above",
        below: "Below",
        safetyThreshold: "Safety threshold",
        differentials: "Differentials",
        differentialsExplanation:
          "% represents impact. Example impact: +80% means for every 1 point, you get 0.8 points",
        statusPoints: "points",
        playersNotMakingDifference: "Players not making difference",
        statusCaptain: "Captain",
        statusFinishedWith: "finished with",
        pointsAboveAverage:
          "{{points}} points {{direction}} than average elite captain",
        higher: "higher",
        lower: "lower",
        yourClonesInTop1Million: "Your clones in Top 1 million",
        hideClonesInfo: "Hide clones info",
        statusPlayers: "Players",
        // Scoreboard Grid
        scoreboard: "Scoreboard",
        noFixturesToDisplay: "No fixtures to display",
        scoreboardMatchResults: "Match Results",
        matches: "matches",
        match: "match",
        scoreboardLive: "LIVE",
        scoreboardFinished: "Finished",
        scoreboardFinalBonus: "Final bonus",
        predictedBonus: "Predicted bonus",
        // League Tables
        leaguesTables: "Leagues",
        liveLeagueTracking: "Live League Tracking",
        noLeagueDataAvailable:
          "No league data available. Load a team first to see leagues.",
        exitLive: "Exit Live",
        leaguesStartLive: "Start Live",
        exit: "Exit",
        leaguesLive: "Live",
        liveTrackingControls: "Live Tracking Controls",
        leagueSelection: "League Selection",
        liveActions: "Live Actions",
        stopLive: "Stop Live",
        refresh: "Refresh",
        leaguesPlayers: "Players",
        leaguesLiveEvents: "Live Events",
        leaguesGameweek: "Gameweek",
        lastUpdate: "Last Update",
        liveLeagueStandings: "Live League Standings",
        liveStandings: "Live Standings",
        rank: "Rank",
        leaguesManager: "Manager",
        leaguesOverall: "Overall",
        bonus: "Bonus",
        leaguesCaptain: "Captain",
        you: "YOU",
        liveDataUpdatingEvery30Seconds: "Live data updating every 30 seconds",
        leaguesTotalPlayers: "Total Players",
        leaguesLastUpdated: "Last Updated",
        loadingLiveData: "Loading Live Data...",
        readyToGoLive: "Ready to Go Live!",
        selectLeagueAndClickStartLive:
          'Select your league above and click "Start Live" to begin tracking live standings with real-time bonus points and captain updates.',
        autoRefreshEvery30Seconds: "Auto-refresh every 30 seconds when active",
        classic: "Classic",
        headToHead: "Head-to-Head",
        loadingLeagueStandings: "Loading League Standings...",
        fetchingTop50Positions: "Fetching top 50 positions",
        loadingH2HLeague: "Loading H2H League...",
        fetchingHeadToHeadStandings: "Fetching head-to-head standings",
        leaguesPoints: "Points",
        wdl: "W-D-L",
        youAreNumber: "You are #",
        youAreNotInTop: "You are not in top",
        showingTop: "Showing top",
        positions: "positions",
        totalEntries: "total entries",
        noStandingsAvailable: "No standings available",
        noH2HStandingsAvailable: "No H2H standings available",
        // Team Search Helper
        teamSearchHelper: "Team Search Helper",
        teamSearchPlaceholder: "Search by Team Name",
        teamSearchDescription:
          'Enter your team name (e.g., "FT Fantasy Team") to get personalized search suggestions',
        teamSearchNamePlaceholder: "e.g., FT Warriors, My Team Name...",
        teamSearching: "Searching...",
        findTeamHelper: "Find Team",
        helperCurrentManagerId: "Current Manager ID:",
        helperQuickLoadByManagerId: "Quick Load by Manager ID",
        helperLoadTeam: "Load Team",
        helperAdditionalHelp: "Additional Help",
        helperMoreTraditionalMethods:
          "If team name search doesn't work, try these more traditional methods:",
        helperTraditionalMethods: "Traditional Methods",
        helperQuickTips: "Quick Tips",
        helperManagerIdIsNumber: "Manager ID is a number (usually 6-8 digits)",
        helperFindInProfileURL: "Find it in your FPL profile URL",
        helperVisibleInLeagueStandings:
          "Visible in league standings next to your team",
        helperTeamWillBeSaved: "Your team will be saved for quick access",
        helperTryTheseSearchMethods: "Try These Search Methods:",
        helperSearchNow: "Search Now",
        helperTipsFor: "Tips for",
        // Controls Bar
        controlsManagerId: "Manager ID:",
        controlsStopLive: "Stop Live",
        controlsOffline: "Offline — not polling",
        controlsLivePollingActive: "Live polling started (15s interval)",
        livePollingStarted: "Live polling started (15s interval)",
        livePollingStopped: "Live polling stopped",
        managerInfoLoaded: "Manager info loaded",
        fullTeamDataLoaded: "Full team data loaded",
        restoredCachedData: "Restored cached team data",
        settingsSavedSuccessfully: "Settings saved successfully",
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
        squadCaptain: "(C)",
        captain: "(C)",
        viceCaptain: "(VC)",
        tripleCaptain: "(TC)",
        captainLong: "Captain",
        // Advanced stats
        advancedStats: "Advanced Statistics",
        loadingAdvancedStats: "Loading advanced statistics...",
        loadTeamForAdvancedStats: "Load team to see advanced statistics",
        // League tables
        tablesReadyToGoLive: "Ready to Go Live!",
        tablesSelectLeagueAndStart:
          'Select your league above and click "Start Live" to begin tracking live standings with real-time bonus points and captain updates.',
        autoRefresh: "Auto-refresh every 30 seconds when active",
        gameweekPoints: "Gameweek Points",
        players: "Players",
        totalPlayers: "Total Players",
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
        liveEvents: "UŽIVO BPS Tracker",
        noEventsYet: "Još nema događaja",
        startLivePolling:
          "Pokrenite uživo praćenje da vidite ažuriranja u realnom vremenu",
        howToFindManagerId: "Kako pronaći Manager ID",
        yourManagerIdIs: "Vaš Manager ID je:",
        enterManagerId: "Unesite Manager ID",
        pleaseEnterManagerId: "Molimo unesite Manager ID prvo",
        searchPlaceholder: "Pretraži po imenu tima",
        searchDescription:
          'Unesite ime vašeg tima (npr. "FT Fantasy Team") da dobijete personalizovane prijedloge',
        teamNamePlaceholder: "npr. FT Warriors, Moj Tim...",
        findTeam: "Pronađi Tim",
        searching: "Pretražujem...",
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
        gwPerformance: "GW{{gw}} Performanse",
        activePoints: "Aktivni Bodovi:",
        benchPointsLong: "Bodovi Klupe:",
        finalBonus: "Finalni Bonus:",
        captainPointsLong: "Bodovi Kapitena:",
        teamStats: "Statistike Tima",
        goals: "Golovi",
        assists: "Asistencije",
        cleanSheets: "Čista mreža",
        yellowCards: "Žut karton",
        redCards: "Crveni karton",
        saves: "Odbrane",
        bonusFinalized: "Bonus finalizovan",
        statusTitle: "Status vašeg Gameweek {{gw}}",
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
        // Settings Card
        settingsCardTitle: "FPL Postavke",
        settingsCardManagerId: "Manager ID",
        settingsCardGameweek: "Gameweek",
        settingsCardProxyUrl: "Proxy URL",
        settingsCardCronSecret: "CRON Secret",
        settingsCardSaveSettings: "Sačuvaj Postavke",
        settingsCardSaving: "Čuva...",
        // Live Events
        eventGoal: "Gol",
        eventAssist: "Asistencija",
        eventYellowCard: "Žuti karton",
        eventRedCard: "Crveni karton",
        eventPenaltyMissed: "Promašen penal",
        eventPenaltySaved: "Odbranjen penal",
        eventOwnGoal: "Autogol",
        eventSave: "Odbrana",
        eventCleanSheet: "Čista mreža",
        eventGoalConceded: "Primljen gol",
        eventBonusPoints: "Bonus bodovi",
        eventTackle: "Klizenje",
        eventInterception: "Presretanje",
        eventClearance: "Izbijanje",
        // Live Tracker
        liveTrackerTitle: "UŽIVO BPS Tracker",
        liveTrackerLivePolling: "Uživo — prati",
        liveTrackerOfflinePolling: "Offline — ne prati",
        liveTrackerJustNow: "Upravo sada",
        liveTrackerMinAgo: "min ranije",
        liveTrackerMinsAgo: "min ranije",
        liveTrackerHourAgo: "sat ranije",
        liveTrackerHoursAgo: "sata ranije",
        // League Tables
        leaguesTables: "Lige",
        liveLeagueTracking: "Uživo praćenje liga",
        noLeagueDataAvailable:
          "Nema podataka o ligama. Prvo učitajte tim da vidite lige.",
        premiumLeague: "Premium Liga",
        standardLeague: "Standard Liga",
        h2hLeague: "H2H Liga",
        h2h2League: "H2H2 Liga",
        freeLeague: "Free Liga",
        leagueTableErrorLoading: "Greška pri učitavanju tabela",
        exitLive: "Izađi iz uživo",
        leaguesStartLive: "Pokreni uživo",
        exit: "Izađi",
        leaguesLive: "Uživo",
        liveTrackingControls: "Kontrole uživo praćenja",
        leagueSelection: "Izbor lige",
        liveActions: "Uživo akcije",
        stopLive: "Zaustavi uživo",
        refresh: "Osvježi",
        leaguesPlayers: "Igrači",
        leaguesLiveEvents: "Uživo događaji",
        leaguesGameweek: "Gameweek",
        lastUpdate: "Poslednje ažuriranje",
        liveLeagueStandings: "Uživo tabele liga",
        liveStandings: "Uživo tabele",
        rank: "Rang",
        leaguesManager: "Menadžer",
        leaguesOverall: "Ukupno",
        bonus: "Bonus",
        leaguesCaptain: "Kapiten",
        you: "TI",
        liveDataUpdatingEvery30Seconds:
          "Uživo podaci se ažuriraju svakih 30 sekundi",
        leaguesTotalPlayers: "Ukupno igrača",
        leaguesLastUpdated: "Poslednje ažurirano",
        loadingLiveData: "Učitava uživo podatke...",
        readyToGoLive: "Spremno za uživo!",
        selectLeagueAndClickStartLive:
          'Odaberite ligu iznad i kliknite "Pokreni uživo" da počnete praćenje uživo tabela sa bonus bodovima u realnom vremenu i ažuriranjima kapitena.',
        autoRefreshEvery30Seconds:
          "Auto-osvježavanje svakih 30 sekundi kada je aktivno",
        classic: "Klasična",
        headToHead: "Head to Head",
        loadingLeagueStandings: "Učitava tabele liga...",
        fetchingTop50Positions: "Uzima top 50 pozicija",
        loadingH2HLeague: "Učitava H2H ligu...",
        fetchingHeadToHeadStandings: "Uzima head to Head tabele",
        leaguesPoints: "Bodovi",
        wdl: "P-N-G",
        youAreNumber: "Ti si #",
        youAreNotInTop: "Nisi u top",
        showingTop: "Prikazuje top",
        positions: "pozicije",
        totalEntries: "ukupno prijava",
        noStandingsAvailable: "Nema dostupnih tabela",
        noH2HStandingsAvailable: "Nema dostupnih H2H tabela",
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
        captainLong: "Kapiten",
        captain: "(K)",
        viceCaptain: "(PK)",
        tripleCaptain: "(TK)",
        // Advanced stats
        advancedStats: "Napredne Statistike",
        loadingAdvancedStats: "Učitavam napredne statistike...",
        loadTeamForAdvancedStats: "Učitajte tim da vidite napredne statistike",
        cloneAnalysis: "Analiza Klonova",
        updatingData: "Ažuriram podatke...",
        foundExactly: "Našli smo tačno",
        clonesOfYourTeam: "klonova vašeg tima u top 1 milion!",
        literallyOneInMillion: "Vi ste bukvalno jedan u milion!",
        uniqueTeam: "Jedinstven tim",
        creativeSelection: "Kreativna selekcija",
        originalApproach: "Originalan pristup",
        averageClonesPerManager: "Prosječno klonova po menadžeru:",
        mostDuplicatedTeam: "Najviše duplicirani tim:",
        sharesPlayersWithActiveManagers:
          "Dijeli igrače sa aktivnim menadžerima:",
        cloneRating: "Rejting klona:",
        rankDetails: "Detalji ranga",
        gameweekPointsStats: "Gameweek bodovi",
        rankImprovement: "Poboljšanje ranga",
        topPercentile: "Top percentil",
        currentRank: "Trenutni rang",
        pointsGained: "Dobijeni bodovi",
        benchPoints: "Bodovi klupe",
        averageResultInGW: "Prosječan rezultat u GW",
        playerPerformanceAnalysis: "Analiza performansi igrača",
        stars: "Zvjezde",
        flops: "Promašaji",
        killers: "Ubice",
        pointsStats: "bodovi",
        teamComparison: "Poređenje sa Top 10k, Ukupno i Elite menadžerima",
        statistics: "Statistike",
        yourTeam: "Vaš Tim",
        top10k: "Top 10k",
        overall: "Ukupno",
        elite: "Elite",
        finalResult: "Finalni rezultat",
        captainPoints: "Bodovi kapitena",
        detailedCaptainAnalysis: "Detaljna Analiza Kapitena",
        finishedWith: "završio sa",
        pointsHigher: "bodova više",
        thanAverageEliteCaptain: "nego prosječni elite kapiten",
        excellentCaptainChoice: "Odličan izbor kapitena za ovaj gameweek!",
        eliteCaptainPerformance: "Elite performanse kapitena",
        // Gameweek Status
        gameweekStatusTitle: "Status vašeg Gameweek {{gw}}",
        loadingGameweekStatus: "Učitavam status gameweek-a...",
        loadTeamToSeeGameweekStatus: "Učitajte tim da vidite status gameweek-a",
        youAreOn: "Vi ste na",
        greenArrow: "Zelena Strelica",
        redArrow: "Crvena Strelica",
        noChange: "Bez Promene",
        greenArrowWithMargin:
          "Zelena strelica sa marginom od {{points}} bodova 👏",
        redArrowWithMargin:
          "Crvena strelica sa marginom od {{points}} bodova 😔",
        noRankChangeThisGameweek: "Nema promene ranga ovaj gameweek",
        averageResult: "Prosječan rezultat: {{points}} bodova",
        performance: "Performanse",
        above: "Iznad",
        below: "Ispod",
        safetyThreshold: "Sigurnosni prag",
        differentials: "Diferencijali",
        differentialsExplanation:
          "% predstavlja uticaj. Primjer uticaja: +80% znači da za svaki 1 bod, dobijate 0.8 bodova",
        playersNotMakingDifference: "Igrači koji ne prave razliku",
        pointsAboveAverage:
          "{{points}} bodova {{direction}} nego prosječni elite kapiten",
        higher: "više",
        lower: "manje",
        yourClonesInTop1Million: "Vaši klonovi u Top 1 milion",
        hideClonesInfo: "Sakrij info o klonovima",
        // Scoreboard Grid
        scoreboard: "Tabla rezultata",
        noFixturesToDisplay: "Nema utakmica za prikaz",
        scoreboardMatchResults: "Rezultati utakmica",
        matches: "utakmica",
        match: "utakmica",
        scoreboardLive: "UŽIVO",
        scoreboardFinished: "Završeno",
        scoreboardFinalBonus: "Finalni bonus",
        predictedBonus: "Predviđeni bonus",
        // League tables
        selectLeagueAndStart:
          'Odaberite vašu ligu iznad i kliknite "Pokreni Uživo" da počnete praćenje uživo tabela sa bonus bodovima u realnom vremenu i ažuriranjima kapitena.',
        autoRefresh: "Auto-osvježavanje svakih 30 sekundi kada je aktivno",
        gameweekPoints: "Gameweek bodovi",
        players: "Igrači",
        totalPlayers: "Ukupno igrača",
        points: "poena",
        loadTeamToSeeManagerOverview:
          "Učitajte tim da vidite pregled menadžera",
        provisional: "privremeno",
        bonusPredicted: "Bonus predviđen",
        finalBonusShort: "Finalni Bonus",
        predictedBonusShort: "Predviđeni Bonus",
        loadingLiveData: "Učitavanje uživo podataka...",
        loadingLeagueStandings: "Učitavanje tabele lige...",
        loadingH2HLeague: "Učitavanje H2H lige...",
        noStandingsAvailable: "Nema dostupnih tabela",
        noH2HStandingsAvailable: "Nema dostupnih H2H tabela",
        wdl: "P-N-I",
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

// Custom language detector with IP-based detection
const customLanguageDetector = {
  name: "customDetector",
  lookup: async () => {
    // First check localStorage
    const storedLang = localStorage.getItem("i18nextLng");
    if (storedLang) return storedLang;

    // Try IP-based detection
    try {
      const response = await fetch("/api/detect-country");
      const data = await response.json();
      if (data.success && data.data.language) {
        return data.data.language;
      }
    } catch (error) {
      console.warn("IP-based language detection failed:", error);
    }

    // Fallback to browser language
    const browserLang = navigator.language.split("-")[0];
    const supportedLangs = ["bs", "sr", "hr", "en"];
    return supportedLangs.includes(browserLang) ? browserLang : "en";
  },
  cacheUserLanguage: (lng: string) => {
    localStorage.setItem("i18nextLng", lng);
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en", // Changed to English as universal fallback
    lng: undefined, // Let detector decide
    detection: {
      order: ["localStorage", "customDetector", "navigator", "htmlTag"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

// Add custom detector
i18n.services.languageDetector.addDetector(customLanguageDetector);

export default i18n;

// Helper function for correct plural form in Serbian/Bosnian/Croatian
export function getPointsText(count: number): string {
  if (count === 1) {
    return `${count} poen`;
  } else {
    return `${count} poena`;
  }
}

// Helper function that works with the t function
export function formatPoints(count: number): string {
  const currentLng = i18n.language;
  if (currentLng === "bs" || currentLng === "sr" || currentLng === "hr") {
    return getPointsText(count);
  } else {
    return `${count} ${count === 1 ? "point" : "points"}`;
  }
}
