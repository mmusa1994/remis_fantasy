"use client";

import SubNavigation from "@/components/shared/SubNavigation";
import { useTranslation } from "react-i18next";

export default function PremierLeagueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  const premierLeagueNavItems = [
    { name: t("navigation.tables"), href: "/premier-league/tabele" },
    {
      name: t("navigation.fplLive"),
      href: "/premier-league/fpl-live",
      badge: { color: "red" as const, pulse: true },
    },
    { name: t("navigation.prizes"), href: "/premier-league/nagrade" },
    {
      name: t("navigation.registration"),
      href: "/premier-league/registracija",
    },
    { name: t("navigation.gallery"), href: "/premier-league/galerija" },
  ];

  return (
    <div className="w-full">
      <SubNavigation
        items={premierLeagueNavItems}
        baseColor="purple"
        leagueBasePath="/premier-league"
      />
      <main className="relative pt-14 md:pt-16">{children}</main>
    </div>
  );
}
