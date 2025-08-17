"use client";

import PrizesGallery from '@/components/shared/PrizesGallery';
import { useLeaguePrizes, usePageContent } from '@/data/hooks/useLeagueData';

export default function PremierLeagueNagradePage() {
  const { data: prizes, loading: prizesLoading, error: prizesError } = useLeaguePrizes('premier');
  const { data: content, loading: contentLoading, error: contentError } = usePageContent('premier', 'prizes');

  if (prizesLoading || contentLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
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
          <p className="text-theme-text-secondary">{prizesError || contentError}</p>
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
        subtitle={content?.subtitle || "Osvajaj nevjerovatne nagrade tokom cijele Premier League sezone!"}
      />
    </div>
  );
}