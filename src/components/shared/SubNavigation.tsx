"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";

interface NavItem {
  name: string;
  href: string;
}

interface SubNavigationProps {
  items: NavItem[];
  baseColor?: "orange" | "blue" | "red";
  leagueBasePath?: string; // e.g., "/premier-league", "/champions-league", "/f1-fantasy"
}

export default function SubNavigation({
  items,
  baseColor = "orange",
  leagueBasePath,
}: SubNavigationProps) {
  const pathname = usePathname();
  const { theme } = useTheme();

  // Add "Početna" item at the beginning if leagueBasePath is provided
  const allItems = leagueBasePath 
    ? [{ name: "Početna", href: leagueBasePath }, ...items]
    : items;

  const colorConfig = {
    orange: {
      active: {
        light: "text-orange-600 bg-orange-100 shadow-lg shadow-orange-200",
        dark: "text-orange-400 bg-orange-500/20 shadow-lg shadow-orange-500/20",
      },
      hover: {
        light: "text-orange-600 hover:bg-orange-50",
        dark: "text-gray-300 hover:text-orange-400 hover:bg-gray-800/50",
      },
      indicator: {
        light: "bg-orange-500",
        dark: "bg-orange-400",
      },
      border: {
        light: "border-orange-200",
        dark: "border-gray-700",
      },
    },
    blue: {
      active: {
        light: "text-blue-600 bg-blue-100 shadow-lg shadow-blue-200",
        dark: "text-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20",
      },
      hover: {
        light: "text-blue-600 hover:bg-blue-50",
        dark: "text-gray-300 hover:text-blue-400 hover:bg-gray-800/50",
      },
      indicator: {
        light: "bg-blue-500",
        dark: "bg-blue-400",
      },
      border: {
        light: "border-blue-200",
        dark: "border-gray-700",
      },
    },
    red: {
      active: {
        light: "text-red-600 bg-red-100 shadow-lg shadow-red-200",
        dark: "text-red-400 bg-red-500/20 shadow-lg shadow-red-500/20",
      },
      hover: {
        light: "text-red-600 hover:bg-red-50",
        dark: "text-gray-300 hover:text-red-400 hover:bg-gray-800/50",
      },
      indicator: {
        light: "bg-red-500",
        dark: "bg-red-400",
      },
      border: {
        light: "border-red-200",
        dark: "border-gray-700",
      },
    },
  };

  const colors = colorConfig[baseColor];

  return (
    <nav
      className={`sticky top-16 md:top-20 z-40 backdrop-blur-lg border-b -mt-px ${
        theme === "dark"
          ? `bg-black/90 ${colors.border.dark}`
          : `bg-white/90 ${colors.border.light}`
      } transition-all duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start md:justify-center space-x-2 sm:space-x-4 md:space-x-8 py-3 md:py-4 overflow-x-auto scrollbar-none">
          {allItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative px-2 sm:px-3 md:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                  isActive
                    ? theme === "dark"
                      ? colors.active.dark
                      : colors.active.light
                    : theme === "dark"
                    ? colors.hover.dark
                    : `text-gray-600 ${colors.hover.light}`
                }`}
              >
                {item.name}
                {isActive && (
                  <div
                    className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 rounded-full ${
                      theme === "dark"
                        ? colors.indicator.dark
                        : colors.indicator.light
                    }`}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
