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
    { name: t("navigation.tables"), href: "/champions-league/tables" },
    { name: t("navigation.prizes"), href: "/champions-league/prizes" },
    {
      name: t("navigation.registration"),
      href: "/champions-league/registration",
    },
    { name: t("navigation.gallery"), href: "/champions-league/gallery" },
  ];

  return (
    <div className="min-h-screen">
      <SubNavigation
        items={championsLeagueNavItems}
        baseColor="blue"
      />
      <main className="relative pt-0 sm:pt-32 md:pt-36">{children}</main>
    </div>
  );
}
