"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

interface FeatureGateWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  isFeatureEnabled: boolean;
  upgradeButtonText?: string;
  onUpgradeClick?: () => void;
  className?: string;
}

const FeatureGateWrapper = React.memo<FeatureGateWrapperProps>(function FeatureGateWrapper({
  children,
  title,
  description,
  isFeatureEnabled,
  upgradeButtonText,
  onUpgradeClick,
  className = "",
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (isFeatureEnabled) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>

      {/* Overlay with upgrade prompt */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`absolute inset-0 flex items-center justify-center ${
          theme === "dark"
            ? "bg-black/80 backdrop-blur-sm"
            : "bg-white/80 backdrop-blur-sm"
        }`}
      >
        <div
          className={`p-6 md:p-8 rounded-xl border max-w-md mx-4 text-center ${
            theme === "dark"
              ? "bg-black/90 border-white/20 text-white"
              : "bg-white/90 border-black/20 text-black"
          }`}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg md:text-xl font-semibold mb-3">
              {title || t("common:featureGate.premiumFeature")}
            </h3>
            <p
              className={`text-sm md:text-base mb-6 ${
                theme === "dark" ? "text-white/80" : "text-black/80"
              }`}
            >
              {description || t("common:featureGate.unlockFeature")}
            </p>
            {onUpgradeClick && (
              <motion.button
                onClick={onUpgradeClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  theme === "dark"
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-black text-white hover:bg-black/90"
                }`}
              >
                {upgradeButtonText || t("common:featureGate.upgrade")}
              </motion.button>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
});

export default FeatureGateWrapper;