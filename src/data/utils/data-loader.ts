// Data loading utilities for dynamic content rendering

// Import all league configurations
import premierConfig from "../premier-league/config.json";
import championsConfig from "../champions-league/config.json";
import f1Config from "../f1-fantasy/config.json";

// Import prize data
import premierPrizes from "../premier-league/prizes.json";
import championsPrizes from "../champions-league/prizes.json";
import f1Prizes from "../f1-fantasy/prizes.json";

export interface LeagueConfig {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  logoPath: string;
  primaryColor: string;
  secondaryColor: string;
  stats: Array<{
    label: string;
    value: string;
    icon: string;
  }>;
  navigation: Array<{
    title: string;
    description: string;
    href: string;
    icon: string;
    color: string;
  }>;
  pageContent: {
    hero: {
      title: string;
      subtitle: string;
      description: string;
      ctaButtons: {
        primary: { text: string; href: string };
        secondary: { text: string; href: string };
      };
    };
    sections: {
      navigation: { title: string };
      prizes: { title: string; subtitle: string };
      gallery: { title: string; description: string };
      tables: { title: string; description: string };
    };
  };
}

export interface Prize {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  description: string;
  tier:
    | "premium"
    | "standard"
    | "intro"
    | "free"
    | "h2h"
    | "arsenal"
    | "champions"
    | "f1";
  league?: "premier" | "champions" | "f1";
  price?: string;
  features: string[];
}

// League configurations registry
const leagueConfigs: Record<string, LeagueConfig> = {
  premier: premierConfig as LeagueConfig,
  champions: championsConfig as LeagueConfig,
  f1: f1Config as LeagueConfig,
};

// Prize data registry
const prizesData: Record<string, Prize[]> = {
  premier: premierPrizes as Prize[],
  champions: championsPrizes as Prize[],
  f1: f1Prizes as Prize[],
};

/**
 * Load league configuration by ID
 */
export const loadLeagueConfig = (leagueId: string): LeagueConfig | null => {
  return leagueConfigs[leagueId] || null;
};

/**
 * Load all league configurations
 */
export const loadAllLeagueConfigs = (): LeagueConfig[] => {
  return Object.values(leagueConfigs);
};

/**
 * Load prizes for a specific league
 */
export const loadLeaguePrizes = (leagueId: string): Prize[] => {
  return prizesData[leagueId] || [];
};

/**
 * Load all prizes
 */
export const loadAllPrizes = (): Prize[] => {
  return Object.values(prizesData).flat();
};

/**
 * Get global app statistics (aggregated from all leagues)
 */
export const getGlobalStats = () => {
  const allConfigs = loadAllLeagueConfigs();

  // Calculate total prize fund
  const totalPrizeFund = allConfigs.reduce((total, config) => {
    const fundStat = config.stats.find((stat) =>
      stat.label.includes("nagradni fond")
    );
    if (fundStat) {
      // Extract number from value like "6.400 KM"
      const match = fundStat.value.match(/[\d.,]+/);
      if (match) {
        const number = parseFloat(match[0].replace(",", ""));
        return total + number;
      }
    }
    return total;
  }, 0);

  // Calculate total leagues
  const totalLeagues = allConfigs.reduce((total, config) => {
    const leagueStat = config.stats.find((stat) => stat.label.includes("liga"));
    if (leagueStat) {
      const number = parseInt(leagueStat.value);
      return total + number;
    }
    return total;
  }, 0);

  return [
    {
      label: "Ukupan nagradni fond",
      value: `${totalPrizeFund.toLocaleString()} KM`,
      icon: "DollarSign",
    },
    {
      label: "Dostupne lige",
      value: totalLeagues.toString(),
      icon: "Trophy",
    },
    {
      label: "Registrovanih igrača",
      value: "200+",
      icon: "Users",
    },
    {
      label: "Godina iskustva",
      value: "9+",
      icon: "Calendar",
    },
  ];
};

/**
 * Get homepage league cards data
 */
export const getHomepageLeagues = () => {
  return loadAllLeagueConfigs().map((config) => ({
    id: config.id,
    name: config.name,
    subtitle: config.subtitle,
    description: config.description,
    href: `/${
      config.id === "premier"
        ? "premier-league"
        : config.id === "champions"
        ? "champions-league"
        : "f1-fantasy"
    }`,
    logoPath: config.logoPath,
    primaryColor: config.primaryColor,
    stats: config.stats,
  }));
};

/**
 * Validate data integrity
 */
export const validateLeagueData = (
  leagueId: string
): { isValid: boolean; errors: string[] } => {
  const config = loadLeagueConfig(leagueId);
  const prizes = loadLeaguePrizes(leagueId);
  const errors: string[] = [];

  if (!config) {
    errors.push(`League configuration not found for ${leagueId}`);
    return { isValid: false, errors };
  }

  // Validate required fields
  if (!config.name) errors.push("League name is required");
  if (!config.description) errors.push("League description is required");
  if (!config.logoPath) errors.push("League logo path is required");
  if (!config.primaryColor) errors.push("Primary color is required");
  if (!config.stats || config.stats.length === 0)
    errors.push("League stats are required");
  if (!config.navigation || config.navigation.length === 0)
    errors.push("Navigation items are required");

  // Validate prizes exist
  if (!prizes || prizes.length === 0) {
    errors.push(`No prizes found for league ${leagueId}`);
  }

  return { isValid: errors.length === 0, errors };
};
