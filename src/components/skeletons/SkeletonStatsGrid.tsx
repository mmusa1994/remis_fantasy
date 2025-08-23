import React from "react";
import SkeletonBase from "./SkeletonBase";

interface SkeletonStatsGridProps {
  /** Number of stat cards to show */
  count?: number;
  /** Custom className for the container */
  className?: string;
  /** Whether to show icons in stats */
  showIcons?: boolean;
}

/**
 * Skeleton component for stats grid sections
 * Matches the StatsGrid component structure
 */
export default function SkeletonStatsGrid({
  count = 4,
  className = "",
  showIcons = true,
}: SkeletonStatsGridProps) {
  return (
    <div
      className={`grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 ${className}`}
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="text-center p-4 md:p-6 bg-gradient-to-br from-amber-50 via-orange-25 to-amber-75 dark:bg-gray-900 rounded-lg shadow-sm border border-amber-300 dark:border-gray-800"
        >
          {/* Icon Skeleton */}
          {showIcons && (
            <div className="flex justify-center mb-3">
              <SkeletonBase
                width="2.5rem"
                height="2.5rem"
                rounded="md"
                className="md:w-12 md:h-12"
              />
            </div>
          )}

          {/* Value Skeleton */}
          <SkeletonBase
            height="2rem"
            className="mb-2 mx-auto max-w-[4rem] md:max-w-[5rem]"
            rounded="md"
          />

          {/* Label Skeleton */}
          <SkeletonBase
            height="1rem"
            className="mx-auto max-w-[5rem] md:max-w-[6rem]"
            rounded="sm"
          />
        </div>
      ))}
    </div>
  );
}
