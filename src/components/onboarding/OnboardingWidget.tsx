"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { HelpCircle } from "lucide-react";
import OnboardingModal from "./OnboardingModal";

const OnboardingWidget = () => {
  const { theme } = useTheme();
  const { t } = useTranslation("onboarding");
  const [showModal, setShowModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleComplete = () => {
    setShowModal(false);
  };

  return (
    <>
      {/* Floating Widget */}
      <div className="fixed bottom-20 right-3 z-40 flex flex-col items-end gap-2">
        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className={`relative px-3 py-2 rounded-lg shadow-lg text-xs font-medium whitespace-nowrap ${
                theme === "dark"
                  ? "bg-gray-800 text-white border border-gray-700"
                  : "bg-white text-gray-900 border border-gray-200"
              }`}
            >
              {t("navigation.skip")
                ? "Need help? Take the tour!"
                : "Need help? Take the tour!"}
              {/* Arrow */}
              <div
                className={`absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-2 h-2 ${
                  theme === "dark"
                    ? "bg-gray-800 border-r border-b border-gray-700"
                    : "bg-white border-r border-b border-gray-200"
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Button — subtle, discreet */}
        <motion.button
          onClick={() => setShowModal(true)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`relative group w-10 h-10 rounded-full shadow-md transition-all duration-300 border ${
            theme === "dark"
              ? "bg-slate-800/80 hover:bg-slate-700/90 border-slate-700/60 text-slate-200 backdrop-blur-md"
              : "bg-white/85 hover:bg-white border-slate-200 text-slate-700 backdrop-blur-md"
          } hover:scale-105`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 18,
            delay: 1,
          }}
          aria-label="Help"
        >
          <div className="relative flex items-center justify-center w-full h-full">
            <HelpCircle className="w-4 h-4 opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.button>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onComplete={handleComplete}
      />
    </>
  );
};

export default OnboardingWidget;
