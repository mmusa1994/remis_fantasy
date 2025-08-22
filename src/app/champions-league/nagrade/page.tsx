"use client";

import PrizesGallery from "@/components/shared/PrizesGallery";
import { useLeaguePrizes, usePageContent } from "@/hooks/useLeagueData";
import { SkeletonPage } from "@/components/skeletons";

export default function ChampionsLeagueNagradePage() {
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
    return <SkeletonPage variant="league" />;
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
        leagueFilter="champions"
        title={content?.title || "Champions League Nagrade"}
        subtitle={
          content?.subtitle ||
          "Osvajaj prestižne nagrade u najjačem evropskom takmičenju!"
        }
      />
    </div>
  );
}
