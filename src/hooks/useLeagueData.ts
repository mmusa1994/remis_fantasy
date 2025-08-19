import { useState, useEffect } from "react";
// Import league-specific data
import {
  premierLeagueConfig,
  premierLeaguePrizes,
} from "@/data/premier-league";
import {
  championsLeagueConfig,
  championsLeaguePrizes,
} from "@/data/champions-league";
import { f1FantasyConfig, f1FantasyPrizes } from "@/data/f1-fantasy";
import { FaUser } from "react-icons/fa";
import { VscRunCoverage } from "react-icons/vsc";
import { BsCash } from "react-icons/bs";
import { GrGroup } from "react-icons/gr";

export const useLeagueData = (leagueType: string) => {
  const [leagueData, setLeagueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        let configData;
        switch (leagueType) {
          case "premier-league":
          case "premier":
            configData = premierLeagueConfig;
            break;
          case "champions-league":
          case "champions":
            configData = championsLeagueConfig;
            break;
          case "f1-fantasy":
          case "f1":
            configData = f1FantasyConfig;
            break;
          default:
            configData = premierLeagueConfig;
        }

        // Transform static config into the format expected by LeaguePage component
        const transformedData = {
          config: configData,
          pageContent: {
            hero: {
              title: configData.title,
              subtitle: configData.subtitle,
              description: configData.description,
              ctaButtons: {
                primary: {
                  text: "Registracija",
                  href: `${configData.basePath}/registracija`,
                },
                secondary: {
                  text: "Nagrade",
                  href: `${configData.basePath}/nagrade`,
                },
              },
            },
            sections: {
              navigation: {
                title: "Brza navigacija",
              },
            },
          },
          logoPath: configData.logo,
          primaryColor: configData.baseColor,
          stats: configData.stats,
          navigation: configData.quickNavigation,
        };

        setLeagueData(transformedData);
      } catch (err) {
        console.error("Error loading league data:", err);
        setError("Failed to load league data");
      } finally {
        setLoading(false);
      }
    };

    if (leagueType) {
      loadData();
    }
  }, [leagueType]);

  return {
    leagueData: leagueData,
    tableData: null, // Not used by LeaguePage component
    loading,
    error,
  };
};

export const useLeaguePrizes = (leagueType: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrizes = async () => {
      try {
        setLoading(true);
        setError(null);

        switch (leagueType) {
          case "premier-league":
          case "premier":
            setData(premierLeaguePrizes);
            break;
          case "champions-league":
          case "champions":
            setData(championsLeaguePrizes);
            break;
          case "f1-fantasy":
          case "f1":
            setData(f1FantasyPrizes);
            break;
          default:
            setData(premierLeaguePrizes);
        }
      } catch (err) {
        console.error("Error loading prizes:", err);
        setError("Failed to load prizes");
      } finally {
        setLoading(false);
      }
    };

    loadPrizes();
  }, [leagueType]);

  return { data, loading, error };
};

export const usePageContent = (leagueType: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);

        switch (leagueType) {
          case "premier-league":
          case "premier":
            setData(premierLeagueConfig);
            break;
          case "champions-league":
          case "champions":
            setData(championsLeagueConfig);
            break;
          case "f1-fantasy":
          case "f1":
            setData(f1FantasyConfig);
            break;
          default:
            setData(premierLeagueConfig);
        }
      } catch (err) {
        console.error("Error loading content:", err);
        setError("Failed to load content");
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [leagueType]);

  return { data, loading, error };
};

export const useHomepageData = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create leagues array for homepage cards
        const leagues = [
          {
            id: premierLeagueConfig.id,
            name: premierLeagueConfig.name,
            title: premierLeagueConfig.title,
            subtitle: premierLeagueConfig.subtitle,
            description: premierLeagueConfig.description,
            href: "/premier-league",
            registrationOpen: true,
          },
          {
            id: championsLeagueConfig.id,
            name: championsLeagueConfig.name,
            title: championsLeagueConfig.title,
            subtitle: championsLeagueConfig.subtitle,
            description: championsLeagueConfig.description,
            href: "/champions-league",
            registrationOpen: true,
          },
          {
            id: f1FantasyConfig.id,
            name: f1FantasyConfig.name,
            title: f1FantasyConfig.title,
            subtitle: f1FantasyConfig.subtitle,
            description: f1FantasyConfig.description,
            href: "/f1-fantasy",
            registrationOpen: true,
          },
        ];

        // Create global stats (static for now)
        const globalStats = [
          {
            label: "Ukupno igrača",
            value: "160+",
            color: "text-orange-500",
            icon: FaUser,
          },
          {
            label: "Aktivne lige",
            value: "5",
            color: "text-blue-500",
            icon: VscRunCoverage,
          },
          {
            label: "Nagradni fond",
            value: "8.OOO+ KM / 4.200+ €",
            color: "text-green-500",
            icon: BsCash,
          },
          {
            label: "Zadovoljnih igrača",
            value: "100%",
            color: "text-purple-500",
            icon: GrGroup,
          },
        ];

        setData({
          leagues,
          globalStats,
          premierLeague: premierLeagueConfig,
          championsLeague: championsLeagueConfig,
          f1Fantasy: f1FantasyConfig,
        });
      } catch (err) {
        console.error("Error loading homepage data:", err);
        setError("Failed to load homepage data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { data, loading, error };
};

export const useRegistrationConfig = (leagueType: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);

        switch (leagueType) {
          case "premier-league":
          case "premier":
            // Import dynamically to avoid circular dependencies
            const { premierLeagueRegistrationConfig } = await import(
              "@/data/premier-league"
            );
            setData(premierLeagueRegistrationConfig);
            break;
          case "champions-league":
          case "champions":
            // For now, use Premier League config as placeholder
            const { premierLeagueRegistrationConfig: clConfig } = await import(
              "@/data/premier-league"
            );
            setData(clConfig);
            break;
          case "f1-fantasy":
          case "f1":
            // For now, use Premier League config as placeholder
            const { premierLeagueRegistrationConfig: f1Config } = await import(
              "@/data/premier-league"
            );
            setData(f1Config);
            break;
          default:
            const { premierLeagueRegistrationConfig: defaultConfig } =
              await import("@/data/premier-league");
            setData(defaultConfig);
        }
      } catch (err) {
        console.error("Error loading registration config:", err);
        setError("Failed to load registration config");
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [leagueType]);

  return { data, loading, error };
};
