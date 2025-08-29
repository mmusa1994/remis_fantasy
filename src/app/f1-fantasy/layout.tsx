"use client";

import SubNavigation from "@/components/shared/SubNavigation";
import { useTranslation } from "react-i18next";

export default function F1FantasyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  const f1FantasyNavItems = [
    { name: t("navigation.tables"), href: "/f1-fantasy/tabele" },
    { name: t("navigation.prizes"), href: "/f1-fantasy/nagrade" },
    { name: t("navigation.registration"), href: "/f1-fantasy/registracija" },
    { name: t("navigation.gallery"), href: "/f1-fantasy/galerija" },
  ];

  return (
    <div className="min-h-screen">
      <SubNavigation
        items={f1FantasyNavItems}
        baseColor="red"
      />
      <main className="relative pt-28 sm:pt-32 md:pt-36">{children}</main>
    </div>
  );
}
