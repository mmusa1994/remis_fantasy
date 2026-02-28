"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import ChampionsWall, { Champion } from "@/components/shared/ChampionsWall";
import AwardsGallery, { GalleryPhoto } from "@/components/shared/AwardsGallery";

// Add champion data here as seasons are completed
const CL_CHAMPIONS: Champion[] = [
  // Example:
  // {
  //   season: "2024/25",
  //   name: "Jane Smith",
  //   teamName: "European Dreams FC",
  //   image: "/images/gallery/champions-league/champions/jane-smith.jpg",
  //   achievement: "1st Place",
  // },
];

// Add award ceremony photos here
const CL_AWARDS_PHOTOS: GalleryPhoto[] = [
  // Example:
  // {
  //   src: "/images/gallery/champions-league/awards/ceremony-2024.jpg",
  //   alt: "2024 Award Ceremony",
  //   caption: "Champions League Fantasy Awards 2024",
  // },
];

const ACCENT_COLOR = "#2563eb";

export default function ChampionsLeagueGalleryPage() {
  const { theme } = useTheme();
  const { t } = useTranslation("champions");

  return (
    <div className="min-h-screen pb-20 pt-10 px-4 bg-theme-background">
      <div className="max-w-6xl mx-auto">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <h1
            className={`text-3xl md:text-4xl font-bold mb-3 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {t("gallery.title")}
          </h1>
          <div
            className="w-20 h-1 mx-auto rounded-full"
            style={{ backgroundColor: ACCENT_COLOR }}
          />
        </div>

        {/* Wall of Champions */}
        <ChampionsWall
          champions={CL_CHAMPIONS}
          accentColor={ACCENT_COLOR}
          leagueName={t("gallery.title")}
          title={t("gallery.championsWall.title")}
          subtitle={t("gallery.championsWall.subtitle")}
          emptyMessage={t("gallery.emptyChampions")}
        />

        {/* Awards Gallery */}
        <AwardsGallery
          photos={CL_AWARDS_PHOTOS}
          accentColor={ACCENT_COLOR}
          title={t("gallery.awards.title")}
          subtitle={t("gallery.awards.subtitle")}
          emptyMessage={t("gallery.emptyGallery")}
        />
      </div>
    </div>
  );
}
