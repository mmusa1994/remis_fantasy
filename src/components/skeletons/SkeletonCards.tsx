import React from 'react';
import SkeletonBase from './SkeletonBase';

interface SkeletonCardsProps {
  /** Number of cards to show */
  count?: number;
  /** Grid layout configuration */
  gridCols?: 'auto' | 1 | 2 | 3 | 4;
  /** Whether to show card images */
  showImages?: boolean;
  /** Whether to show icons in cards */
  showIcons?: boolean;
  /** Height of card images */
  imageHeight?: string;
  /** Custom className for the container */
  className?: string;
  /** Card variant */
  variant?: 'default' | 'league' | 'navigation' | 'compact';
}

/**
 * Skeleton component for card grids (league cards, navigation cards, etc.)
 */
export default function SkeletonCards({
  count = 3,
  gridCols = 'auto',
  showImages = false,
  showIcons = true,
  imageHeight = '12rem',
  className = '',
  variant = 'default',
}: SkeletonCardsProps) {
  const getGridClass = () => {
    if (gridCols === 'auto') {
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
    return `grid grid-cols-1 md:grid-cols-${gridCols}`;
  };

  const getCardPadding = () => {
    switch (variant) {
      case 'compact':
        return 'p-3 md:p-4';
      case 'league':
      case 'navigation':
        return 'p-6 md:p-8';
      default:
        return 'p-4 md:p-6';
    }
  };

  return (
    <div className={`${getGridClass()} gap-4 sm:gap-6 md:gap-8 ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={`bg-gradient-to-br from-amber-50 via-orange-25 to-amber-75 dark:bg-gray-900 rounded-2xl border border-amber-300 dark:border-gray-800 overflow-hidden shadow-sm ${getCardPadding()}`}
        >
          {/* Card Image Skeleton */}
          {showImages && (
            <div className="mb-4 md:mb-6 -mx-6 -mt-6 md:-mx-8 md:-mt-8">
              <SkeletonBase
                height={imageHeight}
                rounded="none"
                className="w-full"
              />
            </div>
          )}

          {/* Icon Skeleton */}
          {showIcons && !showImages && (
            <div className="flex justify-center mb-4 md:mb-6">
              <SkeletonBase
                width="3rem"
                height="3rem"
                rounded="xl"
                className="md:w-16 md:h-16"
              />
            </div>
          )}

          {/* Title Skeleton */}
          <SkeletonBase
            height="1.5rem"
            className="mb-4 mx-auto max-w-32 md:max-w-40"
            rounded="md"
          />

          {/* Description Skeleton */}
          <div className="space-y-2 mb-6">
            <SkeletonBase
              height="1rem"
              rounded="sm"
            />
            <SkeletonBase
              height="1rem"
              className="max-w-4/5"
              rounded="sm"
            />
            {variant === 'league' && (
              <SkeletonBase
                height="1rem"
                className="max-w-3/5"
                rounded="sm"
              />
            )}
          </div>

          {/* Action/Link Skeleton */}
          <div className="flex justify-center">
            <SkeletonBase
              width="6rem"
              height="1.25rem"
              rounded="sm"
            />
          </div>
        </div>
      ))}
    </div>
  );
}