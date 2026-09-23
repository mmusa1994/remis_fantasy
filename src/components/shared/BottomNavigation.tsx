"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import { Menu, Search, BarChart3, House } from "lucide-react";
import { SiPremierleague } from "react-icons/si";
import { GiF1Car } from "react-icons/gi";
import { PiSoccerBall } from "react-icons/pi";
import { useTranslation } from "react-i18next";

interface BottomNavProps {
  onMenuToggle: () => void;
}

type BrandKey = "neutral" | "home" | "premier" | "champions" | "f1" | "predictor";

const BRAND_STYLES: Record<
  BrandKey,
  {
    activeText: string;
    activeBg: string;
    indicator: string;
    iconTint: string;
  }
> = {
  home: {
    activeText: "text-gray-900 dark:text-white",
    activeBg: "bg-gray-900/[0.06] dark:bg-white/10",
    indicator: "bg-gray-900 dark:bg-white",
    iconTint: "text-gray-900 dark:text-white",
  },
  neutral: {
    activeText: "text-gray-900 dark:text-white",
    activeBg: "bg-gray-100 dark:bg-gray-700/60",
    indicator: "bg-gray-900 dark:bg-white",
    iconTint: "",
  },
  premier: {
    activeText: "text-purple-600 dark:text-purple-400",
    activeBg: "bg-purple-100/80 dark:bg-purple-500/15",
    indicator: "bg-purple-500 dark:bg-purple-400",
    iconTint: "text-purple-600 dark:text-purple-400",
  },
  champions: {
    activeText: "text-blue-600 dark:text-blue-400",
    activeBg: "bg-blue-100/80 dark:bg-blue-500/15",
    indicator: "bg-blue-500 dark:bg-blue-400",
    iconTint: "text-blue-600 dark:text-blue-400",
  },
  f1: {
    activeText: "text-red-600 dark:text-red-400",
    activeBg: "bg-red-100/80 dark:bg-red-500/15",
    indicator: "bg-red-500 dark:bg-red-400",
    iconTint: "text-red-600 dark:text-red-400",
  },
  predictor: {
    activeText: "text-amber-600 dark:text-amber-400",
    activeBg: "bg-amber-100/80 dark:bg-amber-500/15",
    indicator: "bg-amber-500 dark:bg-amber-400",
    iconTint: "text-amber-600 dark:text-amber-400",
  },
};

const BottomNavigation = ({ onMenuToggle }: BottomNavProps) => {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { t } = useTranslation("navigation");

  const PredictorIcon = ({ className }: { className?: string }) => (
    <span
      className={`relative inline-flex items-center justify-center ${className ?? ""}`}
    >
      <BarChart3 className="w-[85%] h-[85%]" strokeWidth={2.2} />
      <Search
        className="absolute bottom-0 right-0 w-[44%] h-[44%]"
        strokeWidth={2.6}
        style={
          {
            color: theme === "dark" ? "#fbbf24" : "#d97706",
          } as React.CSSProperties
        }
      />
    </span>
  );

  const navItems: Array<{
    name: string;
    shortName: string;
    href: string;
    icon: any;
    id: string;
    brand: BrandKey;
  }> = [
    {
      name: t("home", "Početna"),
      shortName: t("home", "Početna"),
      href: "/",
      icon: House,
      id: "home",
      brand: "home",
    },
    {
      name: t("premierLeague", "Premier League"),
      shortName: "PL",
      href: "/premier-league/tables",
      icon: SiPremierleague,
      id: "premier",
      brand: "premier",
    },
    {
      name: t("championsLeague", "Liga Prvaka"),
      shortName: "UCL",
      href: "/champions-league/tables",
      icon: PiSoccerBall,
      id: "champions",
      brand: "champions",
    },
    {
      name: t("f1Fantasy", "F1"),
      shortName: "F1",
      href: "/f1-fantasy/tables",
      icon: GiF1Car,
      id: "f1",
      brand: "f1",
    },
    {
      name: t("predictor", "Predictor"),
      shortName: t("predictor", "Predictor"),
      href: "/predictor",
      icon: PredictorIcon,
      id: "predictor",
      brand: "predictor",
    },
  ];

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const dark = theme === "dark";
  const inactiveText = dark ? "text-gray-400" : "text-gray-500";

  // Icon-only floating dock. Labels live in aria-label for screen readers.
  return (
    <motion.nav
      initial={{ y: 110, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 26, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden transform-gpu pointer-events-none"
      style={{ willChange: "transform", WebkitBackfaceVisibility: "hidden" }}
      aria-label={t("mobileNavLabel")}
    >
      <div
        className={`pointer-events-auto relative mx-auto max-w-sm overflow-hidden rounded-[26px] border ${
          dark
            ? "bg-[#0b0b12] border-white/[0.08] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)]"
            : "bg-white border-black/[0.06] shadow-[0_18px_40px_-14px_rgba(15,23,42,0.35)]"
        }`}
      >
        {/* hairline highlight along the top edge */}
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-x-6 top-0 h-px ${
            dark
              ? "bg-gradient-to-r from-transparent via-white/25 to-transparent"
              : "bg-gradient-to-r from-transparent via-black/10 to-transparent"
          }`}
        />
        <div className="flex items-center justify-between px-2 py-2">
          {navItems.map((item) => {
            const isActive = isActiveLink(item.href);
            const IconComponent = item.icon;
            const brand = BRAND_STYLES[item.brand];

            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex-1 min-w-0"
                aria-label={item.name}
                title={item.name}
                aria-current={isActive ? "page" : undefined}
              >
                <motion.div
                  className={`relative mx-auto flex h-12 w-12 flex-col items-center justify-center rounded-2xl transition-colors duration-200 ${
                    isActive ? brand.activeText : inactiveText
                  }`}
                  whileTap={{ scale: 0.86 }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="bottomNavPill"
                      transition={{ type: "spring", damping: 26, stiffness: 360 }}
                      className={`absolute inset-0 -z-10 rounded-2xl ${brand.activeBg}`}
                    />
                  )}
                  <motion.div
                    animate={{ y: isActive ? -2 : 0, scale: isActive ? 1.08 : 1 }}
                    transition={{ type: "spring", damping: 18, stiffness: 320 }}
                    className={isActive ? brand.iconTint : ""}
                  >
                    <IconComponent className="w-[22px] h-[22px]" />
                  </motion.div>
                  {isActive && (
                    <motion.span
                      layoutId="bottomNavDot"
                      transition={{ type: "spring", damping: 26, stiffness: 360 }}
                      className={`absolute bottom-[7px] h-1 w-1 rounded-full ${brand.indicator}`}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}

          <span aria-hidden className={`mx-0.5 h-6 w-px shrink-0 ${dark ? "bg-white/10" : "bg-black/10"}`} />

          <div className="flex-1 min-w-0">
            <motion.button
              onClick={onMenuToggle}
              className={`relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-200 ${inactiveText} ${
                dark ? "hover:text-white" : "hover:text-gray-900"
              }`}
              whileTap={{ scale: 0.86 }}
              aria-label={t("menu", "Meni")}
              title={t("menu", "Meni")}
            >
              <Menu className="w-[22px] h-[22px]" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default BottomNavigation;
