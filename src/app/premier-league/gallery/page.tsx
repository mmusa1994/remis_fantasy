"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import ChampionsWall, { Champion } from "@/components/shared/ChampionsWall";
import AwardsGallery, { GalleryPhoto } from "@/components/shared/AwardsGallery";

const ACCENT_COLOR = "#7c3aed";

export default function PremierLeagueGalleryPage() {
  const { theme } = useTheme();
  const { t } = useTranslation("fpl");
  const [champions, setChampions] = useState<Champion[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/wall-of-champions?league=pl").then((r) => r.json()),
      fetch("/api/gallery?league=pl").then((r) => r.json()),
    ])
      .then(([champs, gallery]) => {
        setChampions(
          Array.isArray(champs)
            ? champs.map((c: any) => ({
                season: c.season,
                name: c.name,
                teamName: c.team_name,
                image: c.image,
                achievement: c.achievement,
              }))
            : []
        );
        setPhotos(Array.isArray(gallery) ? gallery : []);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen pb-20 pt-10 px-4 bg-theme-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1
            className={`text-3xl md:text-5xl font-bold tracking-tight mb-4 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {t("gallery.title")}
          </h1>
          <div
            className="w-12 h-0.5 mx-auto rounded-full"
            style={{ backgroundColor: ACCENT_COLOR }}
          />
        </div>

        <ChampionsWall
          champions={champions}
          accentColor={ACCENT_COLOR}
          leagueName={t("gallery.title")}
          title={t("gallery.championsWall.title")}
          subtitle={t("gallery.championsWall.subtitle")}
          emptyMessage={t("gallery.emptyChampions")}
        />

        <AwardsGallery
          photos={photos}
          accentColor={ACCENT_COLOR}
          title={t("gallery.awards.title")}
          subtitle={t("gallery.awards.subtitle")}
          emptyMessage={t("gallery.emptyGallery")}
        />
      </div>
    </div>
  );
}
