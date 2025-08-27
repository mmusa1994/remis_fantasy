"use client";

import PrizesGallery from "@/components/shared/PrizesGallery";
import { useLeaguePrizes, usePageContent } from "@/hooks/useLeagueData";
import LoadingCard from "@/components/shared/LoadingCard";

export default function PremierLeagueNagradePage() {
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
          title="Loading Premier League Prizes"
          description="Please wait while we fetch the latest prize information"
          className="w-full max-w-md mx-auto"
        />
      </div>
    );
  }

  if (prizesError || contentError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Greška pri učitavanju podataka</p>
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
        title={content?.title || "Premier League Nagrade"}
        subtitle={
          content?.subtitle ||
          "Osvajaj nevjerovatne nagrade tokom cijele Premier League sezone!"
        }
      />
    </div>
  );
}
