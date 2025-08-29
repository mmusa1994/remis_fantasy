"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "./LoadingSpinner";

interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
}

const LoadingCard = React.memo<LoadingCardProps>(function LoadingCard({
  title,
  description,
  className = "",
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 md:p-6 rounded-lg border max-w-sm mx-auto ${
        theme === "dark"
          ? "bg-black border-white text-white"
          : "bg-white border-black text-black"
      } ${className}`}
    >
      <div className="flex flex-col items-center justify-center space-y-3 mb-4">
        <LoadingSpinner size="md" />
        <h3 className="text-base md:text-lg font-medium text-center">{title || t("common:loading")}</h3>
      </div>
      <p
        className={`text-center text-xs md:text-sm ${
          theme === "dark" ? "text-white/70" : "text-black/70"
        }`}
      >
        {description || "Please wait while we fetch the data"}
      </p>
    </motion.div>
  );
});

export default LoadingCard;
