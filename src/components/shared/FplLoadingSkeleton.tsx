"use client";

import React from "react";
import { motion } from "framer-motion";
import LoadingSpinner from "./LoadingSpinner";

interface FplLoadingSkeletonProps {
  variant?: "advanced-stats" | "league-table" | "card" | "grid";
  count?: number;
  className?: string;
  title?: string;
  description?: string;
}

// Simple, background-less loading state used across the FPL surface.
// Variant/count are kept for backwards compatibility but ignored — every
// loader now shows only a centered spinner + optional title + description.
const FplLoadingSkeleton = React.memo<FplLoadingSkeletonProps>(
  function FplLoadingSkeleton({ className = "", title, description }) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex flex-col items-center justify-center py-10 text-center ${className}`}
      >
        <LoadingSpinner size="md" />
        {title && (
          <h3 className="mt-3 text-base md:text-lg font-medium text-theme-foreground">
            {title}
          </h3>
        )}
        {description && (
          <p className="mt-1 text-xs md:text-sm text-theme-text-secondary max-w-md">
            {description}
          </p>
        )}
      </motion.div>
    );
  }
);

export default FplLoadingSkeleton;
