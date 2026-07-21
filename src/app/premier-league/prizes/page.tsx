"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import PrizesGallery from "@/components/shared/PrizesGallery";
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

  if (prizesLoading || contentLoading) {
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

  if (prizesError || contentError) {
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
        <div className="flex items-center justify-center px-4 py-20">
          <div
            className={`text-center max-w-xl w-full rounded-2xl border p-10 md:p-14 ${
              theme === "dark"
                ? "border-purple-500/30 bg-purple-500/5"
                : "border-purple-300 bg-purple-50/50"
            }`}
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Trophy className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1
              className={`text-2xl md:text-3xl font-black mb-3 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {t("fplLive.prizes.tbdTitle", "Nagrade za sezonu 2026/27")}
            </h1>
            <p
              className={`text-lg font-semibold mb-2 ${
                theme === "dark" ? "text-purple-300" : "text-purple-700"
              }`}
            >
              {t("fplLive.prizes.tbdMessage", "Nagrade će biti objavljene naknadno.")}
            </p>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {t(
                "fplLive.prizes.tbdNote",
                "Uskoro objavljujemo kompletan nagradni fond i nagrade za novu sezonu. Pratite nas!"
              )}
            </p>
          </div>
        </div>
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
