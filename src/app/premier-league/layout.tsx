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
      name: t("home"),
      href: "/premier-league",
      icon: "TbHome2",
      showOnMobile: true
    },
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
      name: t("prices"),
      href: "/premier-league/cijene",
      icon: "DollarSign",
      showOnMobile: true
    },
    {
      name: t("diamond"),
      href: "/premier-league/diamond",
      icon: "GrDiamond",
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
        leagueBasePath="/premier-league"
      />
      <main className="relative pt-28 sm:pt-32 md:pt-36">{children}</main>
    </div>
  );
}
