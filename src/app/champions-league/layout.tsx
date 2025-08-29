"use client";

import SubNavigation from "@/components/shared/SubNavigation";
import { useTranslation } from "react-i18next";

export default function ChampionsLeagueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  const championsLeagueNavItems = [
    { name: t("navigation.tables"), href: "/champions-league/tabele" },
    { name: t("navigation.prizes"), href: "/champions-league/nagrade" },
    {
      name: t("navigation.registration"),
      href: "/champions-league/registracija",
    },
    { name: t("navigation.gallery"), href: "/champions-league/galerija" },
  ];

  return (
    <div className="min-h-screen">
      <SubNavigation
        items={championsLeagueNavItems}
        baseColor="blue"
      />
      <main className="relative pt-28 sm:pt-32 md:pt-36">{children}</main>
    </div>
  );
}
