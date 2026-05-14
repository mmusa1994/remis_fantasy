"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import { Home, Menu } from "lucide-react";
import { SiPremierleague } from "react-icons/si";
import { GiF1Car } from "react-icons/gi";
import { PiSoccerBall } from "react-icons/pi";
import { FaFutbol, FaQuestion } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface BottomNavProps {
  onMenuToggle: () => void;
}

const BottomNavigation = ({ onMenuToggle }: BottomNavProps) => {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { t } = useTranslation("navigation");

  const PredictorIcon = ({ className }: { className?: string }) => (
    <span className={`relative inline-block ${className ?? ""}`}>
      <FaFutbol className="w-full h-full" />
      <span
        className={`absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 flex items-center justify-center shadow-sm ring-2 ${
          theme === "dark" ? "ring-gray-900" : "ring-white"
        }`}
      >
        <FaQuestion className="w-[6px] h-[6px] text-black" />
      </span>
    </span>
  );

  const navItems = [
    {
      name: t("home", "Početna"),
      href: "/",
      icon: Home,
      id: "home",
    },
    {
      name: t("premierLeague", "Premier League"),
      href: "/premier-league/tables",
      icon: SiPremierleague,
      id: "premier",
    },
    {
      name: t("championsLeague", "Liga Prvaka"),
      href: "/champions-league/tables",
      icon: PiSoccerBall,
      id: "champions",
    },
    {
      name: t("predictor", "Predictor"),
      href: "/predictor",
      icon: PredictorIcon,
      id: "predictor",
    },
    {
      name: t("f1Fantasy", "F1"),
      href: "/f1-fantasy/tables",
      icon: GiF1Car,
      id: "f1",
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
    >
      <div className="flex items-center justify-around pb-2 px-1 safe-area-pb">
        {navItems.map((item) => {
          const isActive = isActiveLink(item.href);
          const IconComponent = item.icon;

          return (
            <Link key={item.id} href={item.href} className="flex-1">
              <motion.div
                className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 ${
                  isActive
                    ? theme === "dark"
                      ? "text-white bg-gray-700/50"
                      : "text-gray-900 bg-gray-100"
                    : theme === "dark"
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <IconComponent className="w-5 h-5 mb-1" />
                </motion.div>
                <span className="text-xs font-medium truncate max-w-[60px]">
                  {item.name}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className={`absolute -top-0.5 left-0 right-0 h-0.5 rounded-full ${
                      theme === "dark" ? "bg-white" : "bg-gray-900"
                    }`}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}

        {/* User/Menu Button */}
        <div className="flex-1">
          <motion.button
            onClick={onMenuToggle}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg w-full transition-all duration-200 ${
              theme === "dark"
                ? "text-gray-400 hover:text-gray-200"
                : "text-gray-600 hover:text-gray-900"
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">{t('menu')}</span>
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};

export default BottomNavigation;
