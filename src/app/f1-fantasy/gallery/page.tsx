"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import ChampionsWall, { Champion } from "@/components/shared/ChampionsWall";
import AwardsGallery, { GalleryPhoto } from "@/components/shared/AwardsGallery";

// Add champion data here as seasons are completed
const F1_CHAMPIONS: Champion[] = [
  // Example:
  // {
  //   season: "2025",
  //   name: "Max Racer",
  //   teamName: "Speed Demons",
  //   image: "/images/gallery/f1-fantasy/champions/max-racer.jpg",
  //   achievement: "1st Place",
  // },
];

// Add award ceremony photos here
const F1_AWARDS_PHOTOS: GalleryPhoto[] = [
  // Example:
  // {
  //   src: "/images/gallery/f1-fantasy/awards/ceremony-2025.jpg",
  //   alt: "2025 Award Ceremony",
  //   caption: "F1 Fantasy Awards 2025",
  // },
];

const ACCENT_COLOR = "#dc2626";

export default function F1FantasyGalleryPage() {
  const { theme } = useTheme();
  const { t } = useTranslation("f1");

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
          champions={F1_CHAMPIONS}
          accentColor={ACCENT_COLOR}
          leagueName={t("gallery.title")}
          title={t("gallery.championsWall.title")}
          subtitle={t("gallery.championsWall.subtitle")}
          emptyMessage={t("gallery.emptyChampions")}
        />

        {/* Awards Gallery */}
        <AwardsGallery
          photos={F1_AWARDS_PHOTOS}
          accentColor={ACCENT_COLOR}
          title={t("gallery.awards.title")}
          subtitle={t("gallery.awards.subtitle")}
          emptyMessage={t("gallery.emptyGallery")}
        />
      </div>
    </div>
  );
}
