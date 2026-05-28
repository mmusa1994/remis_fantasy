"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import { Menu, Search, BarChart3 } from "lucide-react";
import { SiPremierleague } from "react-icons/si";
import { GiF1Car } from "react-icons/gi";
import { PiSoccerBall } from "react-icons/pi";
import { useTranslation } from "react-i18next";

interface BottomNavProps {
  onMenuToggle: () => void;
}

type BrandKey = "neutral" | "premier" | "champions" | "f1" | "wc2026" | "predictor";

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
  wc2026: {
    activeText: "text-teal-600 dark:text-teal-400",
    activeBg: "bg-teal-100/80 dark:bg-teal-500/15",
    indicator: "bg-teal-500 dark:bg-teal-400",
    iconTint: "",
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

  const WCIcon = ({ isActive }: { isActive: boolean }) => (
    <Image
      src="/images/logos/wc-logo.png"
      alt="WC"
      width={22}
      height={22}
      className={`w-[22px] h-[22px] object-contain transition-all duration-200 ${
        isActive
          ? "opacity-100"
          : theme === "dark"
            ? "opacity-40 grayscale brightness-150"
            : "opacity-40 grayscale"
      }`}
    />
  );

  const navItems: Array<{
    name: string;
    shortName: string;
    href: string;
    icon: any;
    id: string;
    brand: BrandKey;
    customIcon?: boolean;
  }> = [
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
      name: "WC 2026",
      shortName: "WC",
      href: "/wc2026",
      icon: null,
      id: "wc2026",
      brand: "wc2026" as BrandKey,
      customIcon: true,
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

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden transform-gpu"
      style={{ willChange: "transform", WebkitBackfaceVisibility: "hidden" }}
      aria-label="Glavna mobilna navigacija"
    >
      {/* Bar surface — fully solid (no transparency / blur) for a clean, jank-free dock */}
      <div
        className={`relative border-t shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.35)] ${
          dark
            ? "bg-gray-950 border-white/10"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="mx-auto flex max-w-screen-sm items-stretch justify-around gap-0.5 px-1.5 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
                aria-current={isActive ? "page" : undefined}
              >
                <motion.div
                  className={`group relative flex flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-1.5 min-h-[56px] transition-colors duration-200 ${
                    isActive ? brand.activeText : inactiveText
                  }`}
                  whileTap={{ scale: 0.9 }}
                >
                  {/* Pill highlight behind the active item */}
                  {isActive && (
                    <motion.span
                      layoutId="bottomNavPill"
                      transition={{ type: "spring", damping: 26, stiffness: 340 }}
                      className={`absolute inset-x-1 inset-y-0.5 -z-10 rounded-2xl ${brand.activeBg}`}
                    />
                  )}
                  <motion.div
                    animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
                    transition={{ type: "spring", damping: 18, stiffness: 320 }}
                    className={isActive && !item.customIcon ? brand.iconTint : ""}
                  >
                    {item.customIcon ? (
                      <WCIcon isActive={isActive} />
                    ) : (
                      <IconComponent className="w-[22px] h-[22px]" />
                    )}
                  </motion.div>
                  <span
                    className={`text-[10.5px] leading-none tracking-tight truncate max-w-full px-0.5 transition-all ${
                      isActive ? "font-semibold" : "font-medium"
                    }`}
                  >
                    <span className="hidden xs:inline">{item.name}</span>
                    <span className="xs:hidden">{item.shortName}</span>
                  </span>
                </motion.div>
              </Link>
            );
          })}

          <div className="flex-1 min-w-0">
            <motion.button
              onClick={onMenuToggle}
              className={`group relative flex w-full flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-1.5 min-h-[56px] transition-colors duration-200 ${inactiveText} hover:text-gray-900 dark:hover:text-gray-200`}
              whileTap={{ scale: 0.9 }}
              aria-label={t("menu", "Meni")}
            >
              <Menu className="w-[22px] h-[22px]" />
              <span className="text-[10.5px] leading-none font-medium tracking-tight truncate max-w-full px-0.5">
                {t("menu")}
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default BottomNavigation;
