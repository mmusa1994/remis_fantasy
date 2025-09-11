"use client";

import React from "react";
import { motion } from "framer-motion";

interface FplLoadingSkeletonProps {
  variant?: "advanced-stats" | "league-table" | "card" | "grid";
  count?: number;
  className?: string;
  title?: string;
  description?: string;
}

const FplLoadingSkeleton = React.memo<FplLoadingSkeletonProps>(function FplLoadingSkeleton({
  variant = "card",
  count = 1,
  className = "",
  title,
  description,
}) {
  const renderAdvancedStatsSkeleton = () => (
    <div className="space-y-6">
      {/* Player Performance Section */}
      <div className="bg-theme-card rounded-md p-4 lg:p-6 border-theme-border theme-transition">
        <div className="animate-pulse">
          <div className="h-6 bg-theme-text-secondary/20 rounded w-48 mb-4 theme-transition"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-theme-text-secondary/20 rounded w-20 theme-transition"></div>
                {Array.from({ length: 3 }, (_, j) => (
                  <div key={j} className="p-3 bg-theme-card-secondary rounded-lg">
                    <div className="h-4 bg-theme-text-secondary/15 rounded w-24 mb-2 theme-transition"></div>
                    <div className="h-3 bg-theme-text-secondary/10 rounded w-16 theme-transition"></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {Array.from({ length: 12 }, (_, index) => (
          <div
            key={index}
            className="bg-theme-card rounded-md p-4 lg:p-6 border-theme-border theme-transition"
          >
            <div className="animate-pulse">
              <div className="h-6 bg-theme-text-secondary/20 rounded w-32 mb-4 theme-transition"></div>
              <div className="h-48 bg-theme-text-secondary/10 rounded theme-transition"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLeagueTableSkeleton = () => (
    <div className="bg-theme-card rounded-lg border border-theme-border overflow-hidden">
      <div className="animate-pulse">
        {/* Header */}
        <div className="bg-theme-card-secondary border-b border-theme-border p-4">
          <div className="h-6 bg-theme-text-secondary/20 rounded w-48 mb-2 theme-transition"></div>
          <div className="h-4 bg-theme-text-secondary/15 rounded w-32 theme-transition"></div>
        </div>

        {/* Table Headers */}
        <div className="bg-theme-card-secondary border-b-2 border-theme-border p-4">
          <div className="grid grid-cols-8 gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-4 bg-theme-text-secondary/15 rounded theme-transition"></div>
            ))}
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-theme-border">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="p-4">
              <div className="grid grid-cols-8 gap-4 items-center mb-3">
                {Array.from({ length: 8 }, (_, j) => (
                  <div key={j} className="h-4 bg-theme-text-secondary/10 rounded theme-transition"></div>
                ))}
              </div>
              <div className="pt-3 border-t border-theme-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <div className="h-3 bg-theme-text-secondary/10 rounded w-16 theme-transition"></div>
                    <div className="h-3 bg-theme-text-secondary/10 rounded w-20 theme-transition"></div>
                    <div className="h-3 bg-theme-text-secondary/10 rounded w-16 theme-transition"></div>
                  </div>
                  <div className="h-3 bg-theme-text-secondary/10 rounded w-20 theme-transition"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCardSkeleton = () => (
    <div className="bg-theme-card rounded-md p-4 lg:p-6 border-theme-border theme-transition">
      <div className="animate-pulse">
        <div className="h-6 bg-theme-text-secondary/20 rounded w-32 mb-4 theme-transition"></div>
        <div className="space-y-3">
          <div className="h-4 bg-theme-text-secondary/15 rounded theme-transition"></div>
          <div className="h-4 bg-theme-text-secondary/15 rounded w-3/4 theme-transition"></div>
          <div className="h-4 bg-theme-text-secondary/15 rounded w-1/2 theme-transition"></div>
        </div>
      </div>
    </div>
  );

  const renderGridSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="bg-theme-card rounded-md p-4 lg:p-6 border-theme-border theme-transition"
        >
          <div className="animate-pulse">
            <div className="h-6 bg-theme-text-secondary/20 rounded w-32 mb-4 theme-transition"></div>
            <div className="h-48 bg-theme-text-secondary/10 rounded theme-transition"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    switch (variant) {
      case "advanced-stats":
        return renderAdvancedStatsSkeleton();
      case "league-table":
        return renderLeagueTableSkeleton();
      case "grid":
        return renderGridSkeleton();
      case "card":
      default:
        return renderCardSkeleton();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-theme-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-theme-text-secondary mt-1">{description}</p>
          )}
        </div>
      )}
      {renderContent()}
    </motion.div>
  );
});

export default FplLoadingSkeleton;