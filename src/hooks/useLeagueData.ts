import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaUser } from "react-icons/fa";
import { VscRunCoverage } from "react-icons/vsc";
import { BsCash } from "react-icons/bs";
import { GrGroup } from "react-icons/gr";

export const useLeagueData = (leagueType: string) => {
  const { t } = useTranslation();
  const [leagueData, setLeagueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create league configuration using translations
        const getLeagueConfig = () => {
          // Configure league based on type

          switch (leagueType) {
            case "premier-league":
            case "premier":
              return {
                id: "premier",
                name: t("common:home.leagues.premierLeague.title"),
                title: t("common:home.leagues.premierLeague.title"),
                subtitle: "Fantasy Liga",
                description: t("common:home.leagues.premierLeague.description"),
                logoPath: "/images/logos/pl-logo.png",
                basePath: "/premier-league",
                primaryColor: "purple",
                baseColor: "#8b5cf6",
              };
            case "champions-league":
            case "champions":
              return {
                id: "champions",
                name: t("common:home.leagues.championsLeague.title"),
                title: t("common:home.leagues.championsLeague.title"),
                subtitle: "Fantasy Liga",
                description: t(
                  "common:home.leagues.championsLeague.description"
                ),
                logoPath: "/images/logos/cl-logo.png",
                basePath: "/champions-league",
                primaryColor: "blue",
                baseColor: "#3b82f6",
              };
            case "f1-fantasy":
            case "f1":
              return {
                id: "f1",
                name: t("common:home.leagues.f1Fantasy.title"),
                title: t("common:home.leagues.f1Fantasy.title"),
                subtitle: "Fantasy Liga",
                description: t("common:home.leagues.f1Fantasy.description"),
                logoPath: "/images/logos/f1.png",
                basePath: "/f1-fantasy",
                primaryColor: "red",
                baseColor: "#ef4444",
              };
            default:
              return {
                id: "premier",
                name: t("common:home.leagues.premierLeague.title"),
                title: t("common:home.leagues.premierLeague.title"),
                subtitle: "Fantasy Liga",
                description: t("common:home.leagues.premierLeague.description"),
                logoPath: "/images/logos/pl-logo.png",
                basePath: "/premier-league",
                primaryColor: "purple",
                baseColor: "#8b5cf6",
              };
          }
        };

        const configData = getLeagueConfig();

        // Create stats using translations
        const stats = [
          {
            label: t("common:home.globalStats.totalPrize.label"),
            value: t("common:home.globalStats.totalPrize.value"),
            icon: "DollarSign",
          },
          {
            label: t("common:home.globalStats.availableLeagues.label"),
            value: t("common:home.globalStats.availableLeagues.value"),
            icon: "Trophy",
          },
          {
            label: t("common:home.globalStats.registeredPlayers.label"),
            value: t("common:home.globalStats.registeredPlayers.value"),
            icon: "Users",
          },
          {
            label: t("common:home.globalStats.yearsExperience.label"),
            value: t("common:home.globalStats.yearsExperience.value"),
            icon: "Calendar",
          },
        ];

        // Create navigation using translations
        const navigation = [
          {
            title: t("navigation.registration"),
            description: `${t("navigation.register")} ${configData.name}`,
            href: `${configData.basePath}/registration`,
            icon: "PenTool",
            color: configData.primaryColor,
          },
          {
            title: t("navigation.prizes"),
            description: t("navigation.viewPrizes"),
            href: `${configData.basePath}/prizes`,
            icon: "Trophy",
            color: "yellow",
          },
          {
            title: t("navigation.gallery"),
            description: t("navigation.viewGallery"),
            href: `${configData.basePath}/gallery`,
            icon: "Camera",
            color: "blue",
          },
          {
            title: t("navigation.tables"),
            description: t("navigation.viewTables"),
            href: `${configData.basePath}/tables`,
            icon: "BarChart3",
            color: "green",
          },
        ];

        // Transform into expected format for LeaguePage component
        const transformedData = {
          config: configData,
          pageContent: {
            hero: {
              title: configData.title,
              subtitle: configData.subtitle,
              description: configData.description,
              ctaButtons: {
                primary: {
                  text: t("navigation.registration"),
                  href: `${configData.basePath}/registration`,
                },
                secondary: {
                  text: t("navigation.prizes"),
                  href: `${configData.basePath}/prizes`,
                },
              },
            },
            sections: {
              navigation: {
                title: t("navigation.quickNavigation"),
              },
            },
          },
          logoPath: configData.logoPath,
          primaryColor: configData.baseColor,
          stats: stats,
          navigation: navigation,
          quickNavigation: navigation,
        };

        setLeagueData(transformedData);
      } catch (err) {
        console.error("Error loading league data:", err);
        setError(t("common.error"));
      } finally {
        setLoading(false);
      }
    };

    if (leagueType) {
      loadData();
    }
  }, [leagueType, t]);

  return {
    leagueData: leagueData,
    tableData: null, // Not used by LeaguePage component
    loading,
    error,
  };
};

export const useLeaguePrizes = (leagueType: string) => {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrizes = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load prizes from JSON file based on league type
        const loadPrizesFromFile = async () => {
          try {
            let prizesData: any[] = [];

            switch (leagueType) {
              case "premier-league":
              case "premier":
                // Import the Premier League prizes JSON file
                const premierPrizes = await import(
                  "@/data/premier-league/prizes.json"
                );
                prizesData = premierPrizes.default;
                break;
              case "champions-league":
              case "champions":
                // Import the Champions League prizes JSON file
                const championsPrizes = await import(
                  "@/data/champions-league/prizes.json"
                );
                prizesData = championsPrizes.default;
                break;
              case "f1-fantasy":
              case "f1":
                // For now, fallback to basic data - can add F1 JSON file later
                prizesData = [
                  {
                    id: 1,
                    title: t("prizes.firstPlace"),
                    subtitle: "F1 Fantasy Champion",
                    image: "/images/prizes/f1-first.png",
                    description: t("prizes.firstPlaceDesc"),
                    tier: "premium",
                    league: "f1",
                    price: "1000 KM",
                    features: ["Trophy", "Medal", "Certificate"],
                  },
                ];
                break;
              default:
                prizesData = [];
            }

            return prizesData;
          } catch (importError) {
            console.warn(
              "Failed to import prizes file, using fallback data:",
              importError
            );

            // Fallback data with proper structure
            return [
              {
                id: 1,
                title: t("prizes.firstPlace"),
                subtitle: "Liga Champion",
                image: "/images/new-season/premium.png",
                description: t("prizes.firstPlaceDesc"),
                tier: "premium",
                league: leagueType,
                price: "3000 KM",
                features: ["Trophy", "Medal", "Certificate"],
              },
              {
                id: 2,
                title: t("prizes.secondPlace"),
                subtitle: "Runner Up",
                image: "/images/new-season/standard.png",
                description: t("prizes.secondPlaceDesc"),
                tier: "standard",
                league: leagueType,
                price: "2000 KM",
                features: ["Medal", "Certificate"],
              },
              {
                id: 3,
                title: t("prizes.thirdPlace"),
                subtitle: "Third Place",
                image: "/images/new-season/free.png",
                description: t("prizes.thirdPlaceDesc"),
                tier: "h2h",
                league: leagueType,
                price: "1000 KM",
                features: ["Certificate"],
              },
            ];
          }
        };

        const prizesData = await loadPrizesFromFile();
        setData(prizesData);
      } catch (err) {
        console.error("Error loading prizes:", err);
        setError(t("common.error"));
      } finally {
        setLoading(false);
      }
    };

    loadPrizes();
  }, [leagueType, t]);

  return { data, loading, error };
};

export const usePageContent = (leagueType: string) => {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create content data using translations
        const getContentData = () => {
          switch (leagueType) {
            case "premier-league":
            case "premier":
              return {
                id: "premier",
                name: t("common:home.leagues.premierLeague.title"),
                title: t("common:home.leagues.premierLeague.title"),
                subtitle: "Fantasy Liga",
                description: t("common:home.leagues.premierLeague.description"),
                logoPath: "/images/logos/pl-logo.png",
                primaryColor: "purple",
              };
            case "champions-league":
            case "champions":
              return {
                id: "champions",
                name: t("common:home.leagues.championsLeague.title"),
                title: t("common:home.leagues.championsLeague.title"),
                subtitle: "Fantasy Liga",
                description: t(
                  "common:home.leagues.championsLeague.description"
                ),
                logoPath: "/images/logos/cl-logo.png",
                primaryColor: "blue",
              };
            case "f1-fantasy":
            case "f1":
              return {
                id: "f1",
                name: t("common:home.leagues.f1Fantasy.title"),
                title: t("common:home.leagues.f1Fantasy.title"),
                subtitle: "Fantasy Liga",
                description: t("common:home.leagues.f1Fantasy.description"),
                logoPath: "/images/logos/f1-logo.png",
                primaryColor: "red",
              };
            default:
              return {
                id: "premier",
                name: t("common:home.leagues.premierLeague.title"),
                title: t("common:home.leagues.premierLeague.title"),
                subtitle: "Fantasy Liga",
                description: t("common:home.leagues.premierLeague.description"),
                logoPath: "/images/logos/pl-logo.png",
                primaryColor: "purple",
              };
          }
        };

        setData(getContentData());
      } catch (err) {
        console.error("Error loading content:", err);
        setError(t("common.error"));
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [leagueType, t]);

  return { data, loading, error };
};

export const useHomepageData = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create leagues array for homepage cards using translations
        const leagues = [
          {
            id: "premier-league",
            name: "premier-league",
            title: t("common:home.leagues.premierLeague.title"),
            subtitle: "Premier League Fantasy",
            description: t("common:home.leagues.premierLeague.description"),
            href: "/premier-league",
            registrationOpen: true,
          },
          {
            id: "champions-league",
            name: "champions-league",
            title: t("common:home.leagues.championsLeague.title"),
            subtitle: "Champions League Fantasy",
            description: t("common:home.leagues.championsLeague.description"),
            href: "/champions-league",
            registrationOpen: true,
          },
          {
            id: "f1-fantasy",
            name: "f1-fantasy",
            title: t("common:home.leagues.f1Fantasy.title"),
            subtitle: "F1 Fantasy League",
            description: t("common:home.leagues.f1Fantasy.description"),
            href: "/f1-fantasy",
            registrationOpen: true,
          },
        ];

        // Create global stats using translations
        const globalStats = [
          {
            label: t("common:home.globalStats.registeredPlayers.label"),
            value: t("common:home.globalStats.registeredPlayers.value"),
            color: "text-black dark:text-white",
            icon: FaUser,
          },
          {
            label: t("common:home.globalStats.availableLeagues.label"),
            value: t("common:home.globalStats.availableLeagues.value"),
            color: "text-black dark:text-white",
            icon: VscRunCoverage,
          },
          {
            label: t("common:home.globalStats.totalPrize.label"),
            value: t("common:home.globalStats.totalPrize.value"),
            color: "text-black dark:text-white",
            icon: BsCash,
          },
          {
            label: t("common:home.globalStats.yearsExperience.label"),
            value: t("common:home.globalStats.yearsExperience.value"),
            color: "text-black dark:text-white",
            icon: GrGroup,
          },
        ];

        setData({
          leagues,
          globalStats,
        });
      } catch (err) {
        console.error("Error loading homepage data:", err);
        setError("Failed to load homepage data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [t]);

  return { data, loading, error };
};

export const useRegistrationConfig = (leagueType: string) => {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create registration config using translations
        const getRegistrationConfig = () => {
          const baseConfig = {
            enabled: true,
            maxParticipants: 150,
            deadline: "2025-08-15",
            paymentMethods: ["bank", "wise", "cash", "paypal"],
            leagues: [
              {
                id: "standard",
                name: t("leagues.standard.title"),
                description: t("leagues.standard.description"),
                price: 50,
                currency: "KM",
                maxParticipants: 40,
              },
              {
                id: "premium",
                name: t("leagues.premium.title"),
                description: t("leagues.premium.description"),
                price: 100,
                currency: "KM",
                maxParticipants: 30,
              },
              {
                id: "free",
                name: t("leagues.free.title"),
                description: t("leagues.free.description"),
                price: 0,
                currency: "KM",
                maxParticipants: 50,
              },
              {
                id: "h2h",
                name: t("leagues.h2h.title"),
                description: t("leagues.h2h.description"),
                price: 75,
                currency: "KM",
                maxParticipants: 25,
              },
            ],
          };

          switch (leagueType) {
            case "premier-league":
            case "premier":
              return {
                ...baseConfig,
                title: t("common:home.leagues.premierLeague.title"),
                description: t("common:home.leagues.premierLeague.description"),
              };
            case "champions-league":
            case "champions":
              return {
                ...baseConfig,
                title: t("common:home.leagues.championsLeague.title"),
                description: t(
                  "common:home.leagues.championsLeague.description"
                ),
              };
            case "f1-fantasy":
            case "f1":
              return {
                ...baseConfig,
                title: t("common:home.leagues.f1Fantasy.title"),
                description: t("common:home.leagues.f1Fantasy.description"),
              };
            default:
              return {
                ...baseConfig,
                title: t("common:home.leagues.premierLeague.title"),
                description: t("common:home.leagues.premierLeague.description"),
              };
          }
        };

        setData(getRegistrationConfig());
      } catch (err) {
        console.error("Error loading registration config:", err);
        setError(t("common.error"));
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [leagueType, t]);

  return { data, loading, error };
};
