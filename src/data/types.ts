import * as LucideIcons from "lucide-react";

export type IconName = keyof typeof LucideIcons;

export interface Prize {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  description: string;
  tier:
    | "intro"
    | "free"
    | "standard"
    | "premium"
    | "h2h"
    | "arsenal"
    | "champions"
    | "f1";
  league?: "premier" | "champions" | "f1";
  price?: string;
  features: string[];
}

export interface LeagueStats {
  label: string;
  value: string;
  icon: IconName;
}

export interface NavigationItem {
  name: string;
  title: string;
  description: string;
  href: string;
  icon: IconName;
  color: "purple" | "yellow" | "blue" | "green" | "red";
}

export interface SimpleNavigationItem {
  name: string;
  href: string;
}

export interface LeagueConfig {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  description: string;
  logo: string;
  baseColor: string;
  basePath: string;
  available: boolean;
  stats: LeagueStats[];
  navigation: SimpleNavigationItem[];
  quickNavigation: NavigationItem[];
}

export interface TierColorConfig {
  primary?: string;
  secondary?: string;
  gradient: string;
  accent: string;
  bg: string;
  border: string;
  icon: string;
  glow: string;
}

export interface HomeLeague {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: IconName;
  gradient: string;
  available: boolean;
}

export interface GlobalStat {
  label: string;
  value: string;
  icon: IconName;
}

export interface AppConfig {
  siteName: string;
  currentSeason: string;
  homeLeagues: HomeLeague[];
  globalStats: GlobalStat[];
}

export interface MainNavigationItem {
  name: string;
  href: string;
}

export interface LeagueOptionColors {
  border: string;
  bg: string;
  hover: string;
  text: string;
  badge: string;
  badgeRing: string;
}

export interface LeagueOption {
  id: string;
  name: string;
  price: string;
  image: string;
  description: string;
  colors: LeagueOptionColors;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: IconName;
  color: string;
}

export interface PaymentInstructionDetails {
  email?: string;
  username?: string;
  note?: string;
}

export interface PaymentInstruction {
  title: string;
  description: string;
  details: PaymentInstructionDetails;
  note?: string;
}

export interface RegistrationFormConfig {
  leagueOptions: LeagueOption[];
  h2hOption: LeagueOption;
  paymentMethods: PaymentMethod[];
  paymentInstructions: {
    wise: PaymentInstruction;
    paypal: PaymentInstruction;
  };
}

export interface GlobalConfig {
  leagues: {
    premier: LeagueConfig;
    champions: LeagueConfig;
    f1: LeagueConfig;
  };
  mainNavigation: MainNavigationItem[];
}
