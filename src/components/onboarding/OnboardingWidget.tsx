"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { HelpCircle, Sparkles, X } from "lucide-react";
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

        {/* Main Button */}
        <motion.button
          onClick={() => setShowModal(true)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`relative group w-14 h-14 rounded-md shadow-lg transition-all duration-300 ${
            theme === "dark"
              ? "bg-gradient-to-br from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white"
              : "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white"
          } hover:scale-110 hover:shadow-xl`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 1,
          }}
        >
          {/* Subtle pulsing background */}
          <motion.div
            className="absolute inset-0 rounded-md bg-red-400 opacity-30"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Icon */}
          <div className="relative flex items-center justify-center w-full h-full">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <HelpCircle className="w-6 h-6" />
            </motion.div>

            {/* Sparkle effect */}
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{
                scale: [0.8, 1.2, 0.8],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Sparkles className="w-3 h-3 text-yellow-300" />
            </motion.div>
          </div>

          {/* Hover glow effect */}
          <div className="absolute inset-0 rounded-md bg-gradient-to-br from-red-400/0 via-red-300/0 to-red-500/0 group-hover:from-red-400/20 group-hover:via-red-300/10 group-hover:to-red-500/20 transition-all duration-300" />
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
