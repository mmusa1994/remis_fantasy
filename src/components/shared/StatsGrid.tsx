"use client";

import { motion } from "framer-motion";
import {
  DollarSign,
  Trophy,
  Users,
  Calendar,
  Medal,
  BarChart3,
  PenTool,
  Camera,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { ComponentType } from "react";
import type { IconName } from "@/data/types";

// Icon mapping for dynamic icon rendering
const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  Trophy,
  Users,
  Calendar,
  Medal,
  BarChart3,
  PenTool,
  Camera,
};

interface Stat {
  label: string;
  value: string;
  icon: IconName | ComponentType<any>;
  color?: string;
}

interface StatsGridProps {
  stats: Stat[];
  theme?: string;
  className?: string;
}

export default function StatsGrid({
  stats,
  theme: customTheme,
  className = "",
}: StatsGridProps) {
  const { theme } = useTheme();

  const getIconComponent = (icon: IconName | ComponentType<any>) => {
    if (typeof icon === "string") {
      return iconMap[icon] || DollarSign;
    }
    return icon;
  };

  const getDynamicColors = (colorClass?: string) => {
    if (!colorClass) return null;

    // Parse Tailwind color classes like "text-orange-500"
    const colorMatch = colorClass.match(/text-(\w+)-(\d+)/);
    if (!colorMatch) return null;

    const [, colorName] = colorMatch;

    return {
      light: {
        bg: `bg-${colorName}-50`,
        border: `border-${colorName}-200`,
        icon: `text-${colorName}-600`,
        value: `text-${colorName}-800`,
        label: `text-${colorName}-600`,
        shadow: `shadow-${colorName}-100`,
      },
      dark: {
        bg: `bg-${colorName}-500/10`,
        border: `border-${colorName}-500/20`,
        icon: `text-${colorName}-400`,
        value: `text-${colorName}-300`,
        label: `text-${colorName}-400`,
        shadow: `shadow-${colorName}-500/10`,
      },
    };
  };

  const getThemeColors = (statTheme?: string) => {
    const currentTheme = statTheme || customTheme;

    switch (currentTheme) {
      case "purple":
        return {
          light: {
            bg: "bg-purple-50",
            border: "border-purple-200",
            icon: "text-purple-600",
            value: "text-purple-800",
            label: "text-purple-600",
            shadow: "shadow-purple-100",
          },
          dark: {
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
            icon: "text-purple-400",
            value: "text-purple-300",
            label: "text-purple-400",
            shadow: "shadow-purple-500/10",
          },
        };
      case "blue":
        return {
          light: {
            bg: "bg-blue-50",
            border: "border-blue-200",
            icon: "text-blue-600",
            value: "text-blue-800",
            label: "text-blue-600",
            shadow: "shadow-blue-100",
          },
          dark: {
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            icon: "text-blue-400",
            value: "text-blue-300",
            label: "text-blue-400",
            shadow: "shadow-blue-500/10",
          },
        };
      case "red":
        return {
          light: {
            bg: "bg-red-50",
            border: "border-red-200",
            icon: "text-red-600",
            value: "text-red-800",
            label: "text-red-600",
            shadow: "shadow-red-100",
          },
          dark: {
            bg: "bg-red-500/10",
            border: "border-red-500/20",
            icon: "text-red-400",
            value: "text-red-300",
            label: "text-red-400",
            shadow: "shadow-red-500/10",
          },
        };
      default:
        return {
          light: {
            bg: "bg-gray-50",
            border: "border-gray-200",
            icon: "text-gray-600",
            value: "text-gray-800",
            label: "text-gray-600",
            shadow: "shadow-gray-100",
          },
          dark: {
            bg: "bg-gray-500/10",
            border: "border-gray-500/20",
            icon: "text-gray-400",
            value: "text-gray-300",
            label: "text-gray-400",
            shadow: "shadow-gray-500/10",
          },
        };
    }
  };

  const colors = getThemeColors();
  const defaultThemeColors = theme === "dark" ? colors.dark : colors.light;

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 ${className}`}
    >
      {stats.map((stat, index) => {
        const IconComponent = getIconComponent(stat.icon);
        const dynamicColors = getDynamicColors(stat.color);
        const themeColors = dynamicColors
          ? theme === "dark"
            ? dynamicColors.dark
            : dynamicColors.light
          : defaultThemeColors;

        return (
          <motion.div
            key={`${stat.label}-${index}`}
            className={`p-6 lg:p-8 rounded-2xl border ${themeColors.bg} ${themeColors.border} ${themeColors.shadow} shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.2 },
            }}
          >
            {/* Desktop Layout: Centered vertical */}
            <div className="hidden lg:flex flex-col items-center text-center space-y-4">
              <motion.div
                className={`p-4 rounded-xl ${themeColors.bg} border ${themeColors.border} border-2`}
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{
                  delay: index * 0.1 + 0.4,
                  type: "spring",
                  stiffness: 200,
                }}
                whileHover={{
                  rotate: 5,
                  scale: 1.1,
                  transition: { duration: 0.2 },
                }}
              >
                <IconComponent className={`w-8 h-8 ${themeColors.icon}`} />
              </motion.div>

              <div className="space-y-2">
                <motion.p
                  className={`text-lg xl:text-xl font-bold ${themeColors.value} leading-none`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  {stat.value}
                </motion.p>
                <motion.p
                  className={`text-xs xl:text-sm font-medium ${themeColors.label} leading-tight`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  {stat.label}
                </motion.p>
              </div>
            </div>

            {/* Mobile & Tablet Layout: Horizontal */}
            <div className="flex lg:hidden items-center justify-between">
              <div className="flex-1">
                <motion.p
                  className={`text-xs sm:text-sm font-medium ${themeColors.label} mb-1`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  {stat.label}
                </motion.p>
                <motion.p
                  className={`text-lg sm:text-xl md:text-2xl font-bold ${themeColors.value}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  {stat.value}
                </motion.p>
              </div>
              <motion.div
                className={`ml-3 p-2 md:p-3 rounded-lg ${themeColors.bg} border ${themeColors.border}`}
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{
                  delay: index * 0.1 + 0.4,
                  type: "spring",
                  stiffness: 200,
                }}
                whileHover={{
                  rotate: 5,
                  scale: 1.1,
                  transition: { duration: 0.2 },
                }}
              >
                <IconComponent
                  className={`w-5 h-5 md:w-6 md:h-6 ${themeColors.icon}`}
                />
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
