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
    { name: t("navigation.tables"), href: "/f1-fantasy/tables" },
    { name: t("navigation.prizes"), href: "/f1-fantasy/prizes" },
    { name: t("navigation.registration"), href: "/f1-fantasy/registration" },
    { name: t("navigation.gallery"), href: "/f1-fantasy/gallery" },
  ];

  return (
    <div className="min-h-screen">
      <SubNavigation
        items={f1FantasyNavItems}
        baseColor="red"
      />
      <main className="relative pt-0 sm:pt-32 md:pt-36">{children}</main>
    </div>
  );
}
