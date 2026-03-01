import { AppConfig, MainNavigationItem, TierColorConfig } from "./types";

// Main navigation items
export const mainNavigation: MainNavigationItem[] = [
  { name: "Početna", href: "/" },
  { name: "Premier League", href: "/premier-league" },
  { name: "Champions League", href: "/champions-league" },
  { name: "F1 Fantasy", href: "/f1-fantasy" },
];

// Global app configuration
export const appConfig: AppConfig = {
  siteName: "REMIS Fantasy",
  currentSeason: "2025/26",
  homeLeagues: [
    {
      id: "premier-league",
      title: "Premier League",
      description: "Najpopularnija fantasy liga sa 4 različite kategorije",
      href: "/premier-league",
      icon: "GamepadIcon",
      gradient: "from-purple-600 to-purple-800",
      available: true,
    },
    {
      id: "champions-league",
      title: "Champions League",
      description: "Evropska elita fantasy fudbala",
      href: "/champions-league",
      icon: "Trophy",
      gradient: "from-blue-600 to-blue-800",
      available: true,
    },
    {
      id: "f1-fantasy",
      title: "F1 Fantasy",
      description: "Brzina, strategija i adrenalin na stazi",
      href: "/f1-fantasy",
      icon: "ZapIcon",
      gradient: "from-red-600 to-red-800",
      available: true,
    },
  ],
  globalStats: [
    { label: "Ukupan nagradni fond", value: "8000 KM", icon: "DollarSign" },
    { label: "Dostupne lige", value: "5", icon: "Trophy" },
    { label: "Registrovanih igrača", value: "160+", icon: "Users" },
    { label: "Godina iskustva", value: "10+", icon: "Calendar" },
  ],
};

// Prize tier color configurations
export const tierColors: Record<string, TierColorConfig> = {
  intro: {
    primary: "#F5D056",
    secondary: "#28D5E5",
    gradient: "from-[#F5D056] via-[#28D5E5] to-black",
    accent: "text-[#F5D056]",
    bg: "from-[#F5D056]/10 via-[#28D5E5]/5 to-black/20",
    border: "border-[#F5D056]/30",
    icon: "text-[#F5D056]",
    glow: "shadow-[#F5D056]/20",
  },
  free: {
    primary: "#B114D9",
    gradient: "from-[#B114D9] via-gray-700 to-black",
    accent: "text-[#B114D9]",
    bg: "from-[#B114D9]/10 via-gray-500/5 to-black/20",
    border: "border-[#B114D9]/40",
    icon: "text-[#B114D9]",
    glow: "shadow-[#B114D9]/25",
  },
  standard: {
    primary: "#28D5E5",
    gradient: "from-[#28D5E5] via-gray-600 to-black",
    accent: "text-[#28D5E5]",
    bg: "from-[#28D5E5]/10 via-gray-500/5 to-black/20",
    border: "border-[#28D5E5]/40",
    icon: "text-[#28D5E5]",
    glow: "shadow-[#28D5E5]/25",
  },
  premium: {
    primary: "#F5D056",
    gradient: "from-[#F5D056] via-gray-500 to-black",
    accent: "text-[#F5D056]",
    bg: "from-[#F5D056]/10 via-gray-400/5 to-black/20",
    border: "border-[#F5D056]/40",
    icon: "text-[#F5D056]",
    glow: "shadow-[#F5D056]/25",
  },
  h2h: {
    primary: "#901E1B",
    gradient: "from-[#901E1B] via-gray-700 to-black",
    accent: "text-[#901E1B]",
    bg: "from-[#901E1B]/10 via-gray-600/5 to-black/20",
    border: "border-[#901E1B]/40",
    icon: "text-[#901E1B]",
    glow: "shadow-[#901E1B]/25",
  },
  arsenal: {
    primary: "#DC143C",
    secondary: "#FFFFFF",
    gradient: "from-[#DC143C] via-[#FFFFFF] to-black",
    accent: "text-[#DC143C]",
    bg: "from-[#DC143C]/10 via-[#FFFFFF]/5 to-black/20",
    border: "border-[#DC143C]/40",
    icon: "text-[#DC143C]",
    glow: "shadow-[#DC143C]/25",
  },
  champions: {
    primary: "#003366",
    gradient: "from-[#003366] via-gray-600 to-black",
    accent: "text-[#003366]",
    bg: "from-[#003366]/10 via-gray-500/5 to-black/20",
    border: "border-[#003366]/40",
    icon: "text-[#003366]",
    glow: "shadow-[#003366]/25",
  },
  f1: {
    primary: "#E10600",
    gradient: "from-[#E10600] via-gray-600 to-black",
    accent: "text-[#E10600]",
    bg: "from-[#E10600]/10 via-gray-500/5 to-black/20",
    border: "border-[#E10600]/40",
    icon: "text-[#E10600]",
    glow: "shadow-[#E10600]/25",
  },
};
