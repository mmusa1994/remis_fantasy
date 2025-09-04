"use client";

import SubNavigation from "@/components/shared/SubNavigation";
import { useTranslation } from "react-i18next";

export default function PremierLeagueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation("navigation");

  const premierLeagueNavItems = [
    { 
      name: t("tables"), 
      subtitle: t("miniLeagues"),
      href: "/premier-league/tabele",
      icon: "BarChart3",
      showOnMobile: true 
    },
    {
      name: t("fplLive"),
      href: "/premier-league/fpl-live",
      badge: { color: "red" as const, pulse: true },
      icon: "Activity",
      showOnMobile: true
    },
    {
      name: t("fantasyCommand"),
      href: "/premier-league/team-planner",
      icon: "TbPresentationAnalytics",
      showOnMobile: true
    },
    {
      name: t("aiTeamAnalysis"),
      href: "/premier-league/ai-team-analysis",
      icon: "FaMagic",
      showOnMobile: true
    },
    {
      name: t("prices"),
      href: "/premier-league/cijene",
      icon: "DollarSign",
      showOnMobile: true
    },
    {
      name: t("bestDifferentials"),
      href: "/premier-league/best-differentials", 
      icon: "TrendingUp",
      showOnMobile: false
    },
    {
      name: t("teamNews"),
      href: "/premier-league/team-news",
      icon: "Newspaper", 
      showOnMobile: false
    },
    { 
      name: t("prizes"), 
      href: "/premier-league/nagrade",
      icon: "Trophy",
      showOnMobile: false 
    },
    {
      name: t("registration"),
      href: "/premier-league/registracija",
      icon: "UserPlus",
      showOnMobile: false
    },
    { 
      name: t("gallery"), 
      href: "/premier-league/galerija",
      icon: "Camera",
      showOnMobile: false 
    },
  ];

  return (
    <div className="w-full">
      <SubNavigation
        items={premierLeagueNavItems}
        baseColor="purple"
      />
      <main className="relative pt-28 sm:pt-32 md:pt-36">{children}</main>
    </div>
  );
}
