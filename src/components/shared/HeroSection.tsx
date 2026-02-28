"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

interface HeroSectionProps {
  backgroundImage?: string;
  logoPath?: string;
  primaryColor?: string;
  className?: string;
  primaryHref?: string;
  secondaryHref?: string;
  leagueType?: string;
}

export default function HeroSection({
  backgroundImage,
  logoPath,
  primaryColor = "purple",
  className = "",
  primaryHref = "/leagues",
  secondaryHref = "/live",
  leagueType,
}: HeroSectionProps) {
  const { theme } = useTheme();
  const { t, ready } = useTranslation();

  // Get league-specific text keys and ensure correct primaryColor
  const getLeagueKey = (baseKey: string) => {
    if (
      leagueType &&
      (leagueType === "premier-league" || leagueType === "premier")
    ) {
      return `hero.premier.${baseKey}`;
    }
    if (
      leagueType &&
      (leagueType === "champions-league" || leagueType === "champions")
    ) {
      return `hero.champions.${baseKey}`;
    }
    if (leagueType && (leagueType === "f1-fantasy" || leagueType === "f1")) {
      return `hero.f1.${baseKey}`;
    }
    return `hero.${baseKey}`;
  };

  // Force correct primaryColor based on leagueType
  let resolvedPrimaryColor = "gray"; // default fallback

  if (leagueType === "premier-league" || leagueType === "premier") {
    resolvedPrimaryColor = "purple";
  } else if (leagueType === "champions-league" || leagueType === "champions") {
    resolvedPrimaryColor = "blue";
  } else if (leagueType === "f1-fantasy" || leagueType === "f1") {
    resolvedPrimaryColor = "red";
  } else if (primaryColor) {
    // Use passed primaryColor only if leagueType doesn't match
    resolvedPrimaryColor = primaryColor;
  }

  // Wait for i18n to be ready
  if (!ready) {
    return (
      <div
        className={`relative min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden py-8 md:py-12 ${className}`}
      >
        <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-pulse">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-6 md:mb-8"></div>
            <div className="w-3/4 h-12 md:h-16 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-4"></div>
            <div className="w-1/2 h-8 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-6"></div>
            <div className="w-full max-w-2xl h-6 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-8"></div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="w-32 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-32 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getThemeColors = (color: string) => {
    // Force colors based on exact matching
    if (
      color === "purple" ||
      leagueType === "premier-league" ||
      leagueType === "premier"
    ) {
      return {
        light: {
          primary:
            "bg-purple-600 hover:bg-purple-700 border-purple-600 hover:border-purple-700",
          secondary:
            "bg-transparent hover:bg-purple-50 border-purple-600 text-purple-600 hover:text-purple-700",
          accent: "text-purple-600",
          gradient: "from-purple-500/20 via-transparent to-purple-500/20",
          shadow: "bg-purple-100/10 border-2 border-purple-500/30",
          shadowStyle: {
            background: "rgba(139, 92, 246, 0.1)",
            boxShadow: "0 20px 40px rgba(139, 92, 246, 0.4)",
          },
        },
        dark: {
          primary:
            "bg-purple-500 hover:bg-purple-600 border-purple-500 hover:border-purple-600",
          secondary:
            "bg-transparent hover:bg-purple-500/10 border-purple-400 text-purple-400 hover:text-purple-300",
          accent: "text-purple-400",
          gradient: "from-purple-500/30 via-transparent to-purple-500/30",
          shadow: "bg-purple-900/10 border-2 border-purple-400/30",
          shadowStyle: {
            background: "rgba(196, 181, 253, 0.1)",
            boxShadow: "0 20px 40px rgba(196, 181, 253, 0.5)",
          },
        },
      };
    }

    if (
      color === "blue" ||
      leagueType === "champions-league" ||
      leagueType === "champions"
    ) {
      return {
        light: {
          primary:
            "bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700",
          secondary:
            "bg-transparent hover:bg-blue-50 border-blue-600 text-blue-600 hover:text-blue-700",
          accent: "text-blue-600",
          gradient: "from-blue-500/20 via-transparent to-blue-500/20",
          shadow: "bg-blue-100/10 border-2 border-blue-500/30",
          shadowStyle: {
            background: "rgba(59, 130, 246, 0.1)",
            boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)",
          },
        },
        dark: {
          primary:
            "bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600",
          secondary:
            "bg-transparent hover:bg-blue-500/10 border-blue-400 text-blue-400 hover:text-blue-300",
          accent: "text-blue-400",
          gradient: "from-blue-500/30 via-transparent to-blue-500/30",
          shadow: "bg-blue-900/10 border-2 border-blue-400/30",
          shadowStyle: {
            background: "rgba(147, 197, 253, 0.1)",
            boxShadow: "0 20px 40px rgba(147, 197, 253, 0.5)",
          },
        },
      };
    }

    if (color === "red" || leagueType === "f1-fantasy" || leagueType === "f1") {
      return {
        light: {
          primary:
            "bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700",
          secondary:
            "bg-transparent hover:bg-red-50 border-red-600 text-red-600 hover:text-red-700",
          accent: "text-red-600",
          gradient: "from-red-500/20 via-transparent to-red-500/20",
          shadow: "bg-red-100/10 border-2 border-red-500/30",
          shadowStyle: {
            background: "rgba(239, 68, 68, 0.1)",
            boxShadow: "0 20px 40px rgba(239, 68, 68, 0.4)",
          },
        },
        dark: {
          primary:
            "bg-red-500 hover:bg-red-600 border-red-500 hover:border-red-600",
          secondary:
            "bg-transparent hover:bg-red-500/10 border-red-400 text-red-400 hover:text-red-300",
          accent: "text-red-400",
          gradient: "from-red-500/30 via-transparent to-red-500/30",
          shadow: "bg-red-900/10 border-2 border-red-400/30",
          shadowStyle: {
            background: "rgba(252, 165, 165, 0.1)",
            boxShadow: "0 20px 40px rgba(252, 165, 165, 0.5)",
          },
        },
      };
    }

    // Default fallback
    return {
      light: {
        primary:
          "bg-gray-600 hover:bg-gray-700 border-gray-600 hover:border-gray-700",
        secondary:
          "bg-transparent hover:bg-gray-50 border-gray-600 text-gray-600 hover:text-gray-700",
        accent: "text-gray-600",
        gradient: "from-gray-500/20 via-transparent to-gray-500/20",
        shadow: "bg-gray-100/10 border-2 border-gray-500/30",
        shadowStyle: {
          background: "rgba(107, 114, 128, 0.1)",
          boxShadow: "0 20px 40px rgba(107, 114, 128, 0.4)",
        },
      },
      dark: {
        primary:
          "bg-gray-500 hover:bg-gray-600 border-gray-500 hover:border-gray-600",
        secondary:
          "bg-transparent hover:bg-gray-500/10 border-gray-400 text-gray-400 hover:text-gray-300",
        accent: "text-gray-400",
        gradient: "from-gray-500/30 via-transparent to-gray-500/30",
        shadow: "bg-gray-900/10 border-2 border-gray-400/30",
        shadowStyle: {
          background: "rgba(156, 163, 175, 0.1)",
          boxShadow: "0 20px 40px rgba(156, 163, 175, 0.5)",
        },
      },
    };
  };

  const colors = getThemeColors(resolvedPrimaryColor);
  const themeColors = theme === "dark" ? colors.dark : colors.light;

  return (
    <div
      className={`relative min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden py-8 md:py-12 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${themeColors.shadowStyle.background}, transparent, ${themeColors.shadowStyle.background})`,
        boxShadow: `inset ${themeColors.shadowStyle.boxShadow}`,
      }}
    >
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={backgroundImage}
            alt="Hero background"
            fill
            className="object-cover opacity-20 "
            priority
          />
        </div>
      )}

      {/* Gradient Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${themeColors.gradient} z-10`}
      />

      {/* Content */}
      <div
        className={`relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center`}
      >
        {/* Logo */}
        {logoPath && (
          <motion.div
            className="mb-6 md:mb-8 flex justify-center "
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative w-20 h-20 md:w-24 md:h-24">
              <Image
                src={logoPath}
                alt={`${t("title", "REMIS Fantasy")} logo`}
                fill
                className={`object-contain ${
                  theme === "dark" ? "" : "bg-black"
                }`}
                priority
              />
            </div>
          </motion.div>
        )}

        {/* Title */}
        <motion.h1
          className={`text-2xl md:text-3xl lg:text-4xl font-bold text-theme-foreground mb-2 md:mb-4`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {t(getLeagueKey("title"), "REMIS Fantasy")}
        </motion.h1>

        {/* Subtitle */}
        <motion.h2
          className={`text-lg md:text-xl lg:text-2xl font-semibold ${themeColors.accent} mb-4 md:mb-6`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {t(getLeagueKey("season"), "Season 2025/26")}
        </motion.h2>

        {/* Description */}
        <motion.p
          className="text-sm md:text-base lg:text-lg text-theme-text-secondary max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {t(
            getLeagueKey("subtitle"),
            "Welcome to the most exciting fantasy leagues!"
          )}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Link href={primaryHref}>
            <motion.button
              className={`px-6 md:px-8 py-3 md:py-4 rounded-md font-semibold text-white border-2 transition-all duration-300 shadow-sm hover:shadow-md text-sm md:text-base ${themeColors.primary}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t(getLeagueKey("primaryButton"), "Open League")}
            </motion.button>
          </Link>

          <Link href={secondaryHref}>
            <motion.button
              className={`px-6 md:px-8 py-3 md:py-4 rounded-md font-semibold border-2 transition-all duration-300 shadow-sm hover:shadow-md text-sm md:text-base ${themeColors.secondary}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t(getLeagueKey("secondaryButton"), "Watch Live")}
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
