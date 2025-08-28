"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
// Using inline SVG instead of heroicons to avoid dependency
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m19.5 8.25-7.5 7.5-7.5-7.5"
    />
  </svg>
);

interface NavItem {
  name: string;
  href: string;
  badge?: {
    color: "red" | "green" | "blue" | "orange" | "purple";
    pulse?: boolean;
  };
}

interface SubNavigationProps {
  items: NavItem[];
  baseColor?: "orange" | "purple" | "blue" | "red";
  leagueBasePath?: string; // e.g., "/premier-league", "/champions-league", "/f1-fantasy"
}

export default function SubNavigation({
  items,
  baseColor = "orange",
  leagueBasePath,
}: SubNavigationProps) {
  const { t } = useTranslation("navigation");
  const pathname = usePathname();
  const { theme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add "Početna" item at the beginning if leagueBasePath is provided
  const allItems = leagueBasePath
    ? [{ name: t("home"), href: leagueBasePath }, ...items]
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
    purple: {
      active: {
        light: "text-purple-600 bg-purple-100 shadow-lg shadow-purple-200",
        dark: "text-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/20",
      },
      hover: {
        light: "text-purple-600 hover:bg-purple-50",
        dark: "text-gray-300 hover:text-purple-400 hover:bg-gray-800/50",
      },
      indicator: {
        light: "bg-purple-500",
        dark: "bg-purple-400",
      },
      border: {
        light: "border-purple-200",
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

  const colors = colorConfig[baseColor] || colorConfig["purple"];

  // Filter visible items for desktop (first 3)
  const visibleItems = allItems.slice(0, 3);
  const dropdownItems = allItems.slice(3);
  const hasDropdownItems = dropdownItems.length > 0;

  return (
    <nav
      className={`fixed top-20 md:top-24 left-0 right-0 z-30 backdrop-blur-lg border-b w-full ${
        theme === "dark"
          ? `bg-black/90 ${colors.border.dark}`
          : `bg-white/90 ${colors.border.light}`
      } transition-all duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start md:justify-center space-x-2 sm:space-x-4 md:space-x-8 py-3 md:py-4">
          {/* Desktop: Show all items in horizontal layout */}
          <div className="hidden sm:flex items-center space-x-2 sm:space-x-4 md:space-x-8 overflow-x-auto scrollbar-none">
            {allItems.map((item) => {
              const isActive = pathname === item.href;

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
                  <div className="flex items-center space-x-1">
                    <span>{item.name}</span>
                    {item.badge && (
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          item.badge.color === "red"
                            ? "bg-red-500"
                            : item.badge.color === "green"
                            ? "bg-green-500"
                            : item.badge.color === "blue"
                            ? "bg-blue-500"
                            : item.badge.color === "orange"
                            ? "bg-orange-500"
                            : "bg-purple-500"
                        } ${item.badge.pulse ? "animate-pulse" : ""}`}
                      />
                    )}
                  </div>
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

          {/* Mobile: Show first 4 items + dropdown for rest */}
          <div className="flex sm:hidden items-center w-full">
            <div className="flex items-center space-x-2 flex-1 overflow-x-auto scrollbar-none">
              {visibleItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative px-2 py-2 rounded-lg font-semibold text-xs whitespace-nowrap transition-all duration-300 ${
                      isActive
                        ? theme === "dark"
                          ? colors.active.dark
                          : colors.active.light
                        : theme === "dark"
                        ? colors.hover.dark
                        : `text-gray-600 ${colors.hover.light}`
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{item.name}</span>
                      {item.badge && (
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            item.badge.color === "red"
                              ? "bg-red-500"
                              : item.badge.color === "green"
                              ? "bg-green-500"
                              : item.badge.color === "blue"
                              ? "bg-blue-500"
                              : item.badge.color === "orange"
                              ? "bg-orange-500"
                              : "bg-purple-500"
                          } ${item.badge.pulse ? "animate-pulse" : ""}`}
                        />
                      )}
                    </div>
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

            {/* Dropdown for additional items */}
            {hasDropdownItems && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center px-2 py-2 rounded-lg font-semibold text-xs transition-all duration-300 ${
                    theme === "dark"
                      ? colors.hover.dark
                      : `text-gray-600 ${colors.hover.light}`
                  }`}
                >
                  More
                  <ChevronDownIcon
                    className={`ml-1 h-3 w-3 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div
                    className={`absolute right-0 top-full mt-1 min-w-[120px] rounded-lg shadow-lg border z-50 ${
                      theme === "dark"
                        ? `bg-gray-800 ${colors.border.dark}`
                        : `bg-white ${colors.border.light}`
                    }`}
                  >
                    {dropdownItems.map((item) => {
                      const isActive = pathname === item.href;

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsDropdownOpen(false)}
                          className={`block px-3 py-2 text-xs font-semibold transition-all duration-300 first:rounded-t-lg last:rounded-b-lg ${
                            isActive
                              ? theme === "dark"
                                ? colors.active.dark
                                : colors.active.light
                              : theme === "dark"
                              ? colors.hover.dark
                              : `text-gray-600 ${colors.hover.light}`
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{item.name}</span>
                            {item.badge && (
                              <span
                                className={`inline-block w-2 h-2 rounded-full ${
                                  item.badge.color === "red"
                                    ? "bg-red-500"
                                    : item.badge.color === "green"
                                    ? "bg-green-500"
                                    : item.badge.color === "blue"
                                    ? "bg-blue-500"
                                    : item.badge.color === "orange"
                                    ? "bg-orange-500"
                                    : "bg-purple-500"
                                } ${item.badge.pulse ? "animate-pulse" : ""}`}
                              />
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
