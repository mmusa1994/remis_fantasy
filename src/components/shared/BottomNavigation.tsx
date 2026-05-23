"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import { Home, Menu, Search, BarChart3 } from "lucide-react";
import { SiPremierleague } from "react-icons/si";
import { GiF1Car } from "react-icons/gi";
import { PiSoccerBall } from "react-icons/pi";
import { useTranslation } from "react-i18next";

interface BottomNavProps {
  onMenuToggle: () => void;
}

type BrandKey = "neutral" | "premier" | "champions" | "f1" | "predictor";

const BRAND_STYLES: Record<
  BrandKey,
  {
    activeText: string;
    activeBg: string;
    indicator: string;
    iconTint: string;
  }
> = {
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
      icon: Home,
      id: "home",
      brand: "neutral",
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

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden border-t backdrop-blur-lg ${
        theme === "dark"
          ? "bg-gray-900/95 border-gray-700"
          : "bg-white/95 border-gray-200"
      }`}
      aria-label="Glavna mobilna navigacija"
    >
      <div className="flex items-stretch justify-around px-0.5 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] safe-area-pb">
        {navItems.map((item) => {
          const isActive = isActiveLink(item.href);
          const IconComponent = item.icon;
          const brand = BRAND_STYLES[item.brand];

          const inactiveText =
            theme === "dark"
              ? "text-gray-400"
              : "text-gray-600";

          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex-1 min-w-0"
              aria-label={item.name}
              aria-current={isActive ? "page" : undefined}
            >
              <motion.div
                className={`relative flex flex-col items-center justify-center gap-1 px-1 rounded-xl transition-all duration-200 min-h-[52px] ${
                  isActive
                    ? `${brand.activeText} ${brand.activeBg}`
                    : `${inactiveText} hover:text-gray-900 dark:hover:text-gray-200 active:bg-gray-100 dark:active:bg-gray-700/40`
                }`}
                whileTap={{ scale: 0.94 }}
              >
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ duration: 0.2 }}
                  className={isActive ? brand.iconTint : ""}
                >
                  <IconComponent className="w-[22px] h-[22px]" />
                </motion.div>
                <span className="text-[11px] leading-none font-medium truncate max-w-full px-0.5">
                  <span className="hidden xs:inline">{item.name}</span>
                  <span className="xs:hidden">{item.shortName}</span>
                </span>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className={`absolute top-0 left-3 right-3 h-[3px] rounded-b-full ${brand.indicator}`}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}

        <div className="flex-1 min-w-0">
          <motion.button
            onClick={onMenuToggle}
            className={`relative flex flex-col items-center justify-center gap-1 px-1 rounded-xl w-full min-h-[52px] transition-all duration-200 ${
              theme === "dark"
                ? "text-gray-400 hover:text-gray-200 active:bg-gray-700/40"
                : "text-gray-600 hover:text-gray-900 active:bg-gray-100"
            }`}
            whileTap={{ scale: 0.94 }}
            aria-label={t("menu", "Meni")}
          >
            <Menu className="w-[22px] h-[22px]" />
            <span className="text-[11px] leading-none font-medium truncate max-w-full px-0.5">
              {t("menu")}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};

export default BottomNavigation;
