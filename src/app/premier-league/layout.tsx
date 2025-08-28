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
    { name: t("tables"), href: "/premier-league/tabele" },
    {
      name: t("fplLive"),
      href: "/premier-league/fpl-live",
      badge: { color: "red" as const, pulse: true },
    },
    { name: t("prizes"), href: "/premier-league/nagrade" },
    {
      name: t("registration"),
      href: "/premier-league/registracija",
    },
    { name: t("gallery"), href: "/premier-league/galerija" },
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
