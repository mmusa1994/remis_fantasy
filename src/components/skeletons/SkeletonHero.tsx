import React from 'react';
import SkeletonBase from './SkeletonBase';

interface SkeletonHeroProps {
  /** Whether to show the logo skeleton */
  showLogo?: boolean;
  /** Whether to show subtitle skeleton */
  showSubtitle?: boolean;
  /** Whether to show description paragraph */
  showDescription?: boolean;
  /** Custom className for the container */
  className?: string;
}

/**
 * Skeleton component for hero sections
 * Matches the structure of HeroSection component
 */
export default function SkeletonHero({
  showLogo = true,
  showSubtitle = true,
  showDescription = true,
  className = '',
}: SkeletonHeroProps) {
  return (
    <section className={`relative overflow-hidden pb-20 px-4 pt-24 ${className}`}>
      <div className="max-w-6xl mx-auto text-center">
        {/* Logo Skeleton */}
        {showLogo && (
          <div 
            className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 mx-auto mb-8 flex items-center justify-center"
            aria-hidden="true"
            role="presentation"
          >
            <SkeletonBase
              width="100%"
              height="100%"
              rounded="none"
              className="border-2 border-amber-200 dark:border-gray-600"
            />
          </div>
        )}

        {/* Main Title Skeleton */}
        <div className="mb-6 md:mb-8 space-y-4">
          <SkeletonBase
            height="3rem"
            className="mx-auto max-w-lg md:max-w-2xl"
            rounded="lg"
          />
          
          {/* Subtitle Skeleton */}
          {showSubtitle && (
            <SkeletonBase
              height="2rem"
              className="mx-auto max-w-md md:max-w-lg"
              rounded="lg"
            />
          )}
        </div>

        {/* Description Skeleton */}
        {showDescription && (
          <div className="mb-12 md:mb-16 max-w-4xl mx-auto space-y-3">
            <SkeletonBase
              height="1.5rem"
              className="mx-auto max-w-3xl"
              rounded="md"
            />
            <SkeletonBase
              height="1.5rem"
              className="mx-auto max-w-2xl"
              rounded="md"
            />
          </div>
        )}
      </div>

      {/* Background decoration skeletons */}
      <div className="absolute top-20 left-10 w-72 h-72 opacity-30">
        <SkeletonBase
          width="100%"
          height="100%"
          rounded="full"
          animate={false}
          className="blur-3xl bg-gray-300/20 dark:bg-gray-600/20"
        />
      </div>
      <div className="absolute bottom-20 right-10 w-96 h-96 opacity-30">
        <SkeletonBase
          width="100%"
          height="100%"
          rounded="full"
          animate={false}
          className="blur-3xl bg-gray-300/20 dark:bg-gray-600/20"
        />
      </div>
    </section>
  );
}