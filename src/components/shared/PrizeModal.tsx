"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Award, Trophy, Medal, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

interface Prize {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  description: string;
  tier:
    | "intro"
    | "free"
    | "standard"
    | "premium"
    | "h2h"
    | "arsenal"
    | "champions"
    | "f1";
  league?: "premier" | "champions" | "f1";
  price?: string;
  features: string[];
}

interface PrizeModalProps {
  prize: Prize | null;
  isOpen: boolean;
  onClose: () => void;
}

const tierColors = {
  intro: {
    primary: "#F5D056",
    secondary: "#28D5E5",
    gradient: "from-[#F5D056] via-[#28D5E5] to-black",
    accent: "text-[#F5D056]",
    bg: "from-[#F5D056]/10 via-[#28D5E5]/5 to-black/20",
    border: "border-[#F5D056]/30",
    icon: "text-[#F5D056]",
    glow: "shadow-[#F5D056]/20",
  },
  free: {
    primary: "#B114D9",
    gradient: "from-[#B114D9] via-gray-700 to-black",
    accent: "text-[#B114D9]",
    bg: "from-[#B114D9]/10 via-gray-500/5 to-black/20",
    border: "border-[#B114D9]/40",
    icon: "text-[#B114D9]",
    glow: "shadow-[#B114D9]/25",
  },
  standard: {
    primary: "#28D5E5",
    gradient: "from-[#28D5E5] via-gray-600 to-black",
    accent: "text-[#28D5E5]",
    bg: "from-[#28D5E5]/10 via-gray-500/5 to-black/20",
    border: "border-[#28D5E5]/40",
    icon: "text-[#28D5E5]",
    glow: "shadow-[#28D5E5]/25",
  },
  premium: {
    primary: "#F5D056",
    gradient: "from-[#F5D056] via-gray-500 to-black",
    accent: "text-[#F5D056]",
    bg: "from-[#F5D056]/10 via-gray-400/5 to-black/20",
    border: "border-[#F5D056]/40",
    icon: "text-[#F5D056]",
    glow: "shadow-[#F5D056]/25",
  },
  h2h: {
    primary: "#901E1B",
    gradient: "from-[#901E1B] via-gray-700 to-black",
    accent: "text-[#901E1B]",
    bg: "from-[#901E1B]/10 via-gray-600/5 to-black/20",
    border: "border-[#901E1B]/40",
    icon: "text-[#901E1B]",
    glow: "shadow-[#901E1B]/25",
  },
  arsenal: {
    primary: "#DC143C",
    secondary: "#FFFFFF",
    gradient: "from-[#DC143C] via-[#FFFFFF] to-black",
    accent: "text-[#DC143C]",
    bg: "from-[#DC143C]/10 via-[#FFFFFF]/5 to-black/20",
    border: "border-[#DC143C]/40",
    icon: "text-[#DC143C]",
    glow: "shadow-[#DC143C]/25",
  },
  champions: {
    primary: "#003366",
    gradient: "from-[#003366] via-gray-600 to-black",
    accent: "text-[#003366]",
    bg: "from-[#003366]/10 via-gray-500/5 to-black/20",
    border: "border-[#003366]/40",
    icon: "text-[#003366]",
    glow: "shadow-[#003366]/25",
  },
  f1: {
    primary: "#E10600",
    gradient: "from-[#E10600] via-gray-600 to-black",
    accent: "text-[#E10600]",
    bg: "from-[#E10600]/10 via-gray-500/5 to-black/20",
    border: "border-[#E10600]/40",
    icon: "text-[#E10600]",
    glow: "shadow-[#E10600]/25",
  },
};

export default function PrizeModal({
  prize,
  isOpen,
  onClose,
}: PrizeModalProps) {
  const { theme } = useTheme();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClose();
    }
  };

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!prize || !mounted) return null;

  const colors = tierColors[prize.tier];

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center p-2 sm:p-4"
          style={{
            zIndex: 999999,
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            margin: 0,
            padding: 0,
            transform: "none",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
            onClick={handleBackdropClick}
            onKeyDown={handleBackdropKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Close prize modal"
            style={{ zIndex: 1 }}
          />

          {/* Modal Content */}
          <motion.div
            className="relative w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] max-w-4xl h-[95vh] sm:h-[90vh] md:h-[85vh] max-h-[800px] overflow-hidden"
            style={{ zIndex: 10 }}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {/* Modal Container */}
            <div
              className="relative w-full h-full rounded-lg sm:rounded-lg overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}10, transparent)`,
                border: `1px solid ${colors.primary}30`,
              }}
            >
              {/* Inner Modal Container */}
              <div
                className={`${
                  theme === "light" ? "bg-theme-background" : "bg-black"
                } rounded-lg sm:rounded-lg overflow-hidden relative w-full h-full theme-transition`}
                onKeyDown={handleModalKeyDown}
                tabIndex={-1}
              >
                {/* Background Effects */}
                <div className="absolute inset-0">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-5`}
                  />
                  <div
                    className={`absolute top-10 left-10 w-32 h-32 bg-gradient-to-r ${colors.gradient} rounded-full blur-3xl opacity-20 animate-pulse-gentle gpu-accelerated`}
                  />
                  <div
                    className={`absolute bottom-10 right-10 w-24 h-24 bg-gradient-to-l ${colors.gradient} rounded-full blur-3xl opacity-15 animate-float-slow gpu-accelerated`}
                  />
                </div>

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className={`absolute top-3 right-3 sm:top-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 backdrop-blur-xl rounded-md flex items-center justify-center transition-all duration-300 theme-transition hover-scale focus-ring ${
                    theme === "light"
                      ? "bg-theme-secondary/70 hover:bg-theme-accent text-theme-foreground border border-theme-border"
                      : "bg-black/70 hover:bg-black/80 text-white border border-white/10"
                  }`}
                  style={{ zIndex: 50 }}
                >
                  <X className="w-4 h-4 sm:w-6 sm:h-6" />
                </button>

                {/* Modal Content */}
                <div
                  className="relative w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
                  style={{ zIndex: 20 }}
                >
                  {/* Header Section */}
                  <div className="relative p-4 sm:p-8 pb-3 sm:pb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 items-center">
                      {/* Image */}
                      <motion.div
                        className="relative h-48 sm:h-64 lg:h-80 overflow-hidden rounded-lg sm:rounded-lg"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                      >
                        <Image
                          src={prize.image}
                          alt={prize.title}
                          fill
                          className="object-contain"
                          priority
                          quality={100}
                        />
                        <div
                          className={`absolute inset-0 bg-gradient-to-t ${colors.bg} opacity-30 rounded-lg sm:rounded-lg`}
                        />
                      </motion.div>

                      {/* Title and Info */}
                      <motion.div
                        className="space-y-3 sm:space-y-4"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                      >
                        {/* Price Badge */}
                        {prize.price && (
                          <motion.div
                            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-lg text-white font-bold text-sm sm:text-base shadow-lg border"
                            style={{
                              background: `linear-gradient(135deg, ${colors.primary}90, ${colors.primary}60, #00000080)`,
                              borderColor: `${colors.primary}40`,
                              boxShadow: `0 4px 14px 0 ${colors.primary}25`,
                            }}
                            whileHover={{
                              boxShadow: `0 6px 20px 0 ${colors.primary}35`,
                              scale: 1.05,
                            }}
                          >
                            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                            {prize.price}
                          </motion.div>
                        )}

                        <h2
                          className={`text-xl sm:text-2xl lg:text-4xl font-black leading-tight theme-transition ${
                            theme === "light"
                              ? "text-theme-heading-primary"
                              : "text-white"
                          }`}
                        >
                          {prize.title}
                        </h2>

                        <h3
                          className={`text-base sm:text-lg lg:text-2xl ${colors.accent} font-semibold`}
                        >
                          {prize.subtitle}
                        </h3>

                        <p
                          className={`text-sm sm:text-base lg:text-lg leading-relaxed theme-transition ${
                            theme === "light"
                              ? "text-theme-text-secondary"
                              : "text-gray-300"
                          }`}
                        >
                          {prize.description}
                        </p>

                        {/* Stats */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 pt-2">
                          <div
                            className={`flex items-center gap-2 theme-transition ${
                              theme === "light"
                                ? "text-theme-text-muted"
                                : "text-gray-400"
                            }`}
                          >
                            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">
                              {prize.tier === "h2h"
                                ? "40 učesnika"
                                : prize.tier === "premium"
                                ? "50 učesnika"
                                : prize.tier === "standard"
                                ? "100 učesnika"
                                : prize.tier === "arsenal"
                                ? "Specijalna nagrada"
                                : "Bez limita"}
                            </span>
                          </div>
                          <div
                            className={`flex items-center gap-2 theme-transition ${
                              theme === "light"
                                ? "text-theme-text-muted"
                                : "text-gray-400"
                            }`}
                          >
                            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">
                              {prize.features.length} nagrada
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Features Section */}
                  <div className="px-4 sm:px-8 pb-4 sm:pb-8">
                    <motion.h4
                      className={`text-lg sm:text-xl lg:text-2xl font-black mb-4 sm:mb-6 flex items-center gap-2 theme-transition ${
                        theme === "light"
                          ? "text-theme-heading-primary"
                          : "text-white"
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      <Medal
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.icon}`}
                      />
                      Nagrade i Benefiti
                    </motion.h4>

                    <motion.div
                      className="grid grid-cols-1 gap-3 sm:gap-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                    >
                      {prize.features.map((feature, index) => (
                        <motion.div
                          key={index}
                          className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-lg backdrop-blur-sm transition-all duration-300 theme-transition ${
                            theme === "light"
                              ? "bg-theme-secondary/30 border border-theme-border hover:border-theme-border-strong"
                              : "bg-white/5 border border-white/10 hover:border-white/20"
                          }`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.4,
                            delay: 0.6 + index * 0.1,
                          }}
                          whileHover={{
                            scale: 1.02,
                            backgroundColor: "rgba(255, 255, 255, 0.08)",
                          }}
                        >
                          <div
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"
                            style={{ backgroundColor: colors.primary }}
                          />
                          <span
                            className={`font-medium leading-relaxed text-sm sm:text-base theme-transition ${
                              theme === "light"
                                ? "text-theme-text-secondary"
                                : "text-gray-200"
                            }`}
                          >
                            {feature}
                          </span>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 sm:px-8 pb-4 sm:pb-8">
                    <motion.div
                      className={`p-4 sm:p-6 rounded-lg sm:rounded-lg theme-transition ${
                        theme === "light"
                          ? "bg-gradient-to-r from-theme-secondary/50 to-transparent border border-theme-border"
                          : "bg-gradient-to-r from-white/5 to-transparent border border-white/10"
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.7 }}
                    >
                      <p
                        className={`text-xs sm:text-sm leading-relaxed text-center theme-transition ${
                          theme === "light"
                            ? "text-theme-text-muted"
                            : "text-gray-400"
                        }`}
                      >
                        Sve nagrade se dodeljuju na kraju sezone. Mesečne
                        nagrade se dodeljuju svakog meseca.
                        <br className="hidden sm:block" />
                        <span
                          className={`${colors.icon} font-medium block sm:inline mt-2 sm:mt-0`}
                        >
                          Registruj se sada i osiguraj svoje mesto u{" "}
                          {prize.title}!
                        </span>
                      </p>
                    </motion.div>
                  </div>
                </div>

                {/* Decorative corner elements */}
                <div
                  className="absolute top-0 left-0 w-20 h-20 opacity-20 rounded-br-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}30, transparent)`,
                  }}
                />
                <div
                  className="absolute bottom-0 right-0 w-20 h-20 opacity-20 rounded-tl-2xl"
                  style={{
                    background: `linear-gradient(315deg, ${colors.primary}30, transparent)`,
                  }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
