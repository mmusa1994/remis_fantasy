"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import { useLeagueData } from "@/hooks/useLeagueData";
import HeroSection from "./HeroSection";
import StatsGrid from "./StatsGrid";
import {
  PenTool,
  Trophy,
  Camera,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { SkeletonPage } from "@/components/skeletons";
import { useTranslation } from "react-i18next";

// Icon mapping for navigation cards
const iconMap: Record<string, LucideIcon> = {
  PenTool,
  Trophy,
  Camera,
  BarChart3,
};

interface LeaguePageProps {
  leagueId: string;
}

export default function LeaguePage({ leagueId }: LeaguePageProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { leagueData: data, loading, error } = useLeagueData(leagueId);

  if (loading) {
    return <SkeletonPage variant="league" />;
  }

  if (error || !data.config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{t("common.error")}</p>
          <p className="text-theme-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  const config = data;

  const getColorClasses = (color: string) => {
    switch (color) {
      case "purple":
        return {
          bg: theme === "dark" ? "bg-purple-500/10" : "bg-purple-50",
          border:
            theme === "dark" ? "border-purple-500/20" : "border-purple-200",
          text: theme === "dark" ? "text-purple-400" : "text-purple-600",
          hover:
            theme === "dark" ? "hover:bg-purple-500/20" : "hover:bg-purple-100",
        };
      case "yellow":
        return {
          bg: theme === "dark" ? "bg-yellow-500/10" : "bg-yellow-50",
          border:
            theme === "dark" ? "border-yellow-500/20" : "border-yellow-200",
          text: theme === "dark" ? "text-yellow-400" : "text-yellow-600",
          hover:
            theme === "dark" ? "hover:bg-yellow-500/20" : "hover:bg-yellow-100",
        };
      case "blue":
        return {
          bg: theme === "dark" ? "bg-blue-500/10" : "bg-blue-50",
          border: theme === "dark" ? "border-blue-500/20" : "border-blue-200",
          text: theme === "dark" ? "text-blue-400" : "text-blue-600",
          hover:
            theme === "dark" ? "hover:bg-blue-500/20" : "hover:bg-blue-100",
        };
      case "green":
        return {
          bg: theme === "dark" ? "bg-green-500/10" : "bg-green-50",
          border: theme === "dark" ? "border-green-500/20" : "border-green-200",
          text: theme === "dark" ? "text-green-400" : "text-green-600",
          hover:
            theme === "dark" ? "hover:bg-green-500/20" : "hover:bg-green-100",
        };
      case "red":
        return {
          bg: theme === "dark" ? "bg-red-500/10" : "bg-red-50",
          border: theme === "dark" ? "border-red-500/20" : "border-red-200",
          text: theme === "dark" ? "text-red-400" : "text-red-600",
          hover: theme === "dark" ? "hover:bg-red-500/20" : "hover:bg-red-100",
        };
      default:
        return {
          bg: theme === "dark" ? "bg-gray-500/10" : "bg-gray-50",
          border: theme === "dark" ? "border-gray-500/20" : "border-gray-200",
          text: theme === "dark" ? "text-gray-400" : "text-gray-600",
          hover:
            theme === "dark" ? "hover:bg-gray-500/20" : "hover:bg-gray-100",
        };
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection
        content={config.pageContent.hero}
        logoPath={config.logoPath}
        primaryColor={config.primaryColor}
        className=""
      />

      {/* Stats Section */}
      <section className="py-8 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <StatsGrid
            stats={config.stats}
            theme={config.primaryColor}
            className="max-w-4xl mx-auto"
          />
        </div>
      </section>

      {/* Navigation Cards Section */}
      <section className="py-8 md:py-16 px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-center text-theme-foreground mb-8 md:mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {config.pageContent.sections.navigation.title}
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {config?.navigation?.map((item: any, index: number) => {
              const IconComponent = iconMap[item.icon] || PenTool;
              const colorClasses = getColorClasses(item.color);

              return (
                <Link key={item.title} href={item.href}>
                  <motion.div
                    className={`group p-4 sm:p-6 md:p-8 rounded-2xl border transition-all duration-300 hover:scale-105 cursor-pointer ${colorClasses.bg} ${colorClasses.border} ${colorClasses.hover} backdrop-blur-sm shadow-lg hover:shadow-xl`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{
                      scale: 1.05,
                      transition: { duration: 0.2 },
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-center">
                      <motion.div
                        className={`inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-xl mb-4 md:mb-6 ${colorClasses.bg} ${colorClasses.border} border-2`}
                        whileHover={{
                          scale: 1.1,
                          rotate: 5,
                          transition: { duration: 0.2 },
                        }}
                      >
                        <IconComponent
                          className={`w-6 h-6 md:w-8 md:h-8 ${colorClasses.text}`}
                        />
                      </motion.div>

                      <h3
                        className={`text-lg md:text-xl font-bold mb-3 md:mb-4 text-theme-foreground group-hover:${colorClasses.text.replace(
                          "text-",
                          "text-"
                        )} transition-colors duration-300`}
                      >
                        {item.title}
                      </h3>

                      <p className="text-sm md:text-base text-theme-text-secondary leading-relaxed mb-4 md:mb-6">
                        {item.description}
                      </p>

                      <motion.div
                        className={`inline-flex items-center text-sm font-semibold ${colorClasses.text} group-hover:translate-x-1 transition-transform duration-300`}
                        whileHover={{ x: 4 }}
                      >
                        {t("hero.openLeague")}
                        <svg
                          className="w-4 h-4 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </motion.div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
