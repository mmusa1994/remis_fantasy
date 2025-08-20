"use client";

import PrizesGallery from "@/components/shared/PrizesGallery";
import { useLeaguePrizes, usePageContent } from "@/hooks/useLeagueData";

export const metadata = {
  title: "F1 Fantasy — Nagrade",
  description:
    "Otkrijte F1 Fantasy Nagrade — nagrade, pravila i kako učestvovati u najbržoj racing ligi na svijetu.",
};

export default function F1FantasyNagradePage() {
  const {
    data: prizes,
    loading: prizesLoading,
    error: prizesError,
  } = useLeaguePrizes("f1");
  const {
    data: content,
    loading: contentLoading,
    error: contentError,
  } = usePageContent("f1");

  if (prizesLoading || contentLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-theme-text-secondary">Učitava se...</p>
        </div>
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
        leagueFilter="f1"
        title={content?.title || "F1 Fantasy Nagrade"}
        subtitle={
          content?.subtitle ||
          "Osvojite brzinske nagrade u najuzbudljivijoj racing ligi!"
        }
      />
    </div>
  );
}
