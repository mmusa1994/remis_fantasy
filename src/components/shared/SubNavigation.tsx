"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useRef, useEffect } from "react";
// import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Activity,
  Trophy,
  UserPlus,
  Camera,
  DollarSign,
  TrendingUp,
  Newspaper,
} from "lucide-react";
import { TbHome2, TbPresentationAnalytics } from "react-icons/tb";
import { GrDiamond } from "react-icons/gr";
import { FaMagic } from "react-icons/fa";
// Unused - commenting out to avoid ESLint warning
// const ChevronDownIcon = ({ className }: { className?: string }) => (
//   <svg
//     className={className}
//     fill="none"
//     viewBox="0 0 24 24"
//     strokeWidth={1.5}
//     stroke="currentColor"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       d="m19.5 8.25-7.5 7.5-7.5-7.5"
//     />
//   </svg>
// );

interface NavItem {
  name: string;
  href: string;
  icon?: string;
  subtitle?: string;
  showOnMobile?: boolean;
  badge?: {
    color: "red" | "green" | "blue" | "orange" | "purple";
    pulse?: boolean;
  };
}

interface SubNavigationProps {
  items: NavItem[];
  baseColor?: "orange" | "purple" | "blue" | "red";
}

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } =
  {
    TbHome2,
    BarChart3,
    Activity,
    TbPresentationAnalytics,
    GrDiamond,
    Trophy,
    UserPlus,
    Camera,
    DollarSign,
    FaMagic,
    TrendingUp,
    Newspaper,
  };

const getIcon = (iconName?: string) => {
  if (!iconName) return null;
  const IconComponent = iconMap[iconName];
  return IconComponent ? IconComponent : null;
};

export default function SubNavigation({
  items,
  baseColor = "orange",
}: SubNavigationProps) {
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

  // Use items as provided (home button is already included with empty name)
  const allItems = items;

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
        light: "text-black hover:text-purple-600 hover:bg-purple-50",
        dark: "text-white hover:text-purple-400 hover:bg-gray-800/50",
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

  // Filter visible items for mobile
  // If we have 4 or fewer items total, show all on mobile
  // Otherwise, use the showOnMobile logic, but limit to 3 items if there are dropdown items
  const shouldShowAllOnMobile = allItems.length <= 4;
  const allMobileItems = shouldShowAllOnMobile
    ? allItems
    : allItems.filter((item) => item.showOnMobile);
  const desktopItems = allItems;
  const dropdownItems = shouldShowAllOnMobile
    ? []
    : allItems.filter((item) => !item.showOnMobile);
  
  // Show all mobile items (4 items) - we'll handle the "More..." button separately
  const mobileItems = allMobileItems;
  
  // Only non-mobile items go to dropdown
  const finalDropdownItems = dropdownItems;

  return (
    <nav
      className={`hidden sm:block fixed top-20 md:top-24 left-0 right-0 z-30 backdrop-blur-lg border-b w-full ${
        theme === "dark"
          ? `bg-black/90 ${colors.border.dark}`
          : `bg-white/90 ${colors.border.light}`
      } transition-all duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start md:justify-center space-x-2 sm:space-x-4 md:space-x-8 py-3 md:py-4">
          {/* Desktop: Show all items in horizontal layout */}
          <div className="hidden sm:flex items-center space-x-2 sm:space-x-4 md:space-x-8 overflow-x-auto scrollbar-none">
            {desktopItems.map((item) => {
              const isActive = pathname === item.href;
              const IconComponent = getIcon(item.icon);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-2 sm:px-3 md:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                    isActive
                      ? theme === "dark"
                        ? colors.active.dark
                        : colors.active.light
                      : theme === "dark"
                      ? baseColor === "purple"
                        ? colors.hover.dark
                        : colors.hover.dark
                      : baseColor === "purple" 
                        ? colors.hover.light
                        : `text-gray-600 ${colors.hover.light}`
                  }`}
                >
                  <div className="flex flex-col items-center space-y-0.5">
                    <div className="flex items-center space-x-2">
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                      {item.name && <span>{item.name}</span>}
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
                    {item.subtitle && <span>{item.subtitle}</span>}
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

          {/* Mobile: Show only showOnMobile items + dropdown for rest */}
          <div className="flex sm:hidden items-center w-full">
            <div className="flex gap-1 w-full">
              {mobileItems.map((item) => {
                const isActive = pathname === item.href;
                const IconComponent = getIcon(item.icon);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-1 py-2 rounded-lg font-semibold text-xs transition-all duration-300 flex flex-col items-center flex-1 ${
                      isActive
                        ? theme === "dark"
                          ? colors.active.dark
                          : colors.active.light
                        : theme === "dark"
                        ? baseColor === "purple"
                          ? colors.hover.dark
                          : colors.hover.dark
                        : baseColor === "purple"
                          ? colors.hover.light
                          : `text-gray-600 ${colors.hover.light}`
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1 text-center">
                      <div className="relative">
                        {IconComponent && <IconComponent className="w-4 h-4" />}
                        {item.badge && (
                          <span
                            className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
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
                      <div className="flex flex-col items-center leading-tight">
                        {item.name && (
                          <span className="text-xs font-medium">
                            {item.name}
                          </span>
                        )}
                        {item.subtitle && (
                          <span className=" text-xs opacity-75">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                    {isActive && (
                      <div
                        className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 rounded-full ${
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

            {/* More button for remaining items */}
            {finalDropdownItems.length > 0 && (
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex flex-col items-center px-1 py-2 rounded-lg font-semibold text-xs transition-all duration-300 ${
                  theme === "dark"
                    ? colors.hover.dark
                    : `text-gray-600 ${colors.hover.light}`
                }`}
              >
                <svg
                  className="w-4 h-4 mb-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
                <span className="text-xs">More</span>
              </button>
            )}

            {/* Dropdown for additional items */}
            {finalDropdownItems.length > 0 && isDropdownOpen && (
              <div
                ref={dropdownRef}
                className={`absolute right-4 top-full mt-1 min-w-[140px] rounded-lg shadow-lg border z-50 ${
                  theme === "dark"
                    ? `bg-gray-800 ${colors.border.dark}`
                    : `bg-white ${colors.border.light}`
                }`}
              >
                {finalDropdownItems.map((item) => {
                  const isActive = pathname === item.href;
                  const IconComponent = getIcon(item.icon);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsDropdownOpen(false)}
                      className={`block px-3 py-2 text-xs font-semibold transition-all duration-300 first:rounded-t-lg last:rounded-b-lg ${
                        isActive
                          ? theme === "dark"
                            ? colors.active.dark
                            : colors.active.light
                          : theme === "dark"
                          ? baseColor === "purple"
                            ? colors.hover.dark
                            : colors.hover.dark
                          : baseColor === "purple"
                            ? colors.hover.light
                            : `text-gray-600 ${colors.hover.light}`
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {IconComponent && <IconComponent className="w-4 h-4" />}
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
        </div>
      </div>
    </nav>
  );
}
