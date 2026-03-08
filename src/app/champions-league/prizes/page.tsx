"use client";

import PrizesGallery from "@/components/shared/PrizesGallery";
import { useLeaguePrizes, usePageContent } from "@/hooks/useLeagueData";
import LoadingCard from "@/components/shared/LoadingCard";
import { useTranslation } from "react-i18next";

export default function ChampionsLeagueNagradePage() {
  const { t } = useTranslation("champions");
  const {
    data: prizes,
    loading: prizesLoading,
    error: prizesError,
  } = useLeaguePrizes("champions");
  const {
    data: content,
    loading: contentLoading,
    error: contentError,
  } = usePageContent("champions");

  if (prizesLoading || contentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingCard
          title={t("prizes.title", "Champions League Prizes")}
          description={t("prizes.subtitle", "Please wait while we fetch the latest prize information")}
          className="w-full max-w-md mx-auto"
        />
      </div>
    );
  }

  if (prizesError || contentError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{t("errors.general", "Error loading data")}</p>
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
        leagueFilter="champions"
        title={content?.title || t("prizes.title", "Champions League Prizes")}
        subtitle={
          content?.subtitle ||
          t("prizes.subtitle", "Win amazing prizes throughout the Champions League season")
        }
      />
    </div>
  );
}
