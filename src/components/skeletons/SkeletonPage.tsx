import React from 'react';
import SkeletonHero from './SkeletonHero';
import SkeletonStatsGrid from './SkeletonStatsGrid';
import SkeletonCards from './SkeletonCards';

interface SkeletonPageProps {
  /** Page variant to determine layout */
  variant?: 'homepage' | 'league' | 'simple';
  /** Custom className for the container */
  className?: string;
  /** Whether to show hero section */
  showHero?: boolean;
  /** Whether to show stats section */
  showStats?: boolean;
  /** Whether to show cards section */
  showCards?: boolean;
  /** Number of cards to show */
  cardCount?: number;
}

/**
 * Complete page skeleton for different page types
 * Combines multiple skeleton components to create full page layouts
 */
export default function SkeletonPage({
  variant = 'homepage',
  className = '',
  showHero = true,
  showStats = true,
  showCards = true,
  cardCount = 3,
}: SkeletonPageProps) {
  const getPageConfig = () => {
    switch (variant) {
      case 'homepage':
        return {
          hero: { showLogo: true, showSubtitle: true, showDescription: true },
          stats: { count: 4 },
          cards: { count: 3, variant: 'league' as const, showImages: false },
        };
      case 'league':
        return {
          hero: { showLogo: false, showSubtitle: false, showDescription: true },
          stats: { count: 4 },
          cards: { count: 4, variant: 'navigation' as const, showImages: false },
        };
      case 'simple':
        return {
          hero: { showLogo: false, showSubtitle: false, showDescription: false },
          stats: { count: 2 },
          cards: { count: 2, variant: 'compact' as const, showImages: false },
        };
      default:
        return {
          hero: { showLogo: true, showSubtitle: true, showDescription: true },
          stats: { count: 4 },
          cards: { count: cardCount, variant: 'default' as const, showImages: false },
        };
    }
  };

  const config = getPageConfig();

  return (
    <main className={`w-full min-h-screen overflow-x-hidden bg-theme-background ${className}`}>
      {/* Hero Section */}
      {showHero && (
        <SkeletonHero
          showLogo={config.hero.showLogo}
          showSubtitle={config.hero.showSubtitle}
          showDescription={config.hero.showDescription}
        />
      )}

      {/* Stats Section */}
      {showStats && (
        <section className="py-8 md:py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <SkeletonStatsGrid
              count={config.stats.count}
              className="max-w-4xl mx-auto"
            />
          </div>
        </section>
      )}

      {/* Cards Section */}
      {showCards && (
        <section className="py-8 md:py-16 px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            {/* Section Title */}
            <div className="text-center mb-8 md:mb-12">
              <div className="flex justify-center">
                <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg h-8 w-64 md:h-10 md:w-80"></div>
              </div>
            </div>

            <SkeletonCards
              count={config.cards.count}
              variant={config.cards.variant}
              showImages={config.cards.showImages}
              className="max-w-5xl mx-auto"
            />
          </div>
        </section>
      )}
    </main>
  );
}