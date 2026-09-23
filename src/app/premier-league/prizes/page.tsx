"use client";

import { useState } from "react";
import PrizesGallery from "@/components/shared/PrizesGallery";
import PrizeCards2627 from "@/components/premier-league/PrizeCards2627";
import { useLeaguePrizes, usePageContent } from "@/hooks/useLeagueData";
import LoadingCard from "@/components/shared/LoadingCard";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

type Season = "25_26" | "26_27";

export default function PremierLeagueNagradePage() {
  const { t } = useTranslation("fpl");
  const { theme } = useTheme();
  const [season, setSeason] = useState<Season>("26_27");
  const {
    data: prizes,
    loading: prizesLoading,
    error: prizesError,
  } = useLeaguePrizes("premier");
  const {
    data: content,
    loading: contentLoading,
    error: contentError,
  } = usePageContent("premier");

  if ((prizesLoading || contentLoading) && season === "25_26") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingCard
          title={t("fplLive.prizes.loadingTitle", "Loading Premier League Prizes")}
          description={t("fplLive.prizes.loadingDesc", "Please wait while we fetch the latest prize information")}
          className="w-full max-w-md mx-auto"
        />
      </div>
    );
  }

  if ((prizesError || contentError) && season === "25_26") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{t("fplLive.prizes.error", "Error loading data")}</p>
          <p className="text-theme-text-secondary">
            {prizesError || contentError}
          </p>
        </div>
      </div>
    );
  }

  const seasonSwitcher = (
    <div className="flex justify-center gap-8 pt-10 -mb-4">
      {(["25_26", "26_27"] as Season[]).map((s) => {
        const isActive = season === s;
        const label = s === "26_27" ? "2026/27" : "2025/26";
        return (
          <button
            key={s}
            onClick={() => setSeason(s)}
            className="relative pb-1.5 font-bold text-base md:text-lg transition-colors duration-300"
            style={{
              color: isActive
                ? theme === "dark"
                  ? "#a78bfa"
                  : "#7c3aed"
                : theme === "dark"
                  ? "rgba(255,255,255,0.45)"
                  : "rgba(0,0,0,0.45)",
            }}
          >
            {label}
            {s === "25_26" && !isActive && (
              <span className="ml-1 text-[10px] font-medium opacity-60">
                ({t("fplLive.prizes.completedSuffix", "Završena")})
              </span>
            )}
            <span
              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-300"
              style={{
                backgroundColor: isActive
                  ? theme === "dark"
                    ? "#a78bfa"
                    : "#7c3aed"
                  : "transparent",
              }}
            />
          </button>
        );
      })}
    </div>
  );

  if (season === "26_27") {
    return (
      <div className="min-h-screen">
        {seasonSwitcher}
        <PrizeCards2627 />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {seasonSwitcher}
      <PrizesGallery
        prizes={prizes}
        leagueFilter="premier"
        title={content?.title || t("fplLive.prizes.plTitle", "Premier League Prizes")}
        subtitle={t("fplLive.prizes.historySubtitle", "Sezona 2025/26 — završena")}
      />
    </div>
  );
}
