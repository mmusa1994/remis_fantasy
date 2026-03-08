"use client";

import PrizesGallery from "@/components/shared/PrizesGallery";
import { useLeaguePrizes, usePageContent } from "@/hooks/useLeagueData";
import LoadingCard from "@/components/shared/LoadingCard";
import { useTranslation } from "react-i18next";

export default function PremierLeagueNagradePage() {
  const { t } = useTranslation("fpl");
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

  return (
    <div className="min-h-screen">
      <PrizesGallery
        prizes={prizes}
        leagueFilter="premier"
        title={content?.title || t("fplLive.prizes.plTitle", "Premier League Prizes")}
        subtitle={
          content?.subtitle ||
          t("fplLive.prizes.plSubtitle", "Win amazing prizes throughout the Premier League season!")
        }
      />
    </div>
  );
}
