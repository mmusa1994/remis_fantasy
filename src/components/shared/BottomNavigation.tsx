"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import { Home, User, LogIn, Menu } from "lucide-react";
import { SiPremierleague } from "react-icons/si";
import { GiF1Car } from "react-icons/gi";
import { PiSoccerBall } from "react-icons/pi";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface BottomNavProps {
  onMenuToggle: () => void;
}

const BottomNavigation = ({ onMenuToggle }: BottomNavProps) => {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { data: session } = useSession();
  const { t } = useTranslation("navigation");

  const navItems = [
    {
      name: t("home", "Home"),
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
      name: t("championsLeague", "Champions League"),
      href: "/champions-league/tables",
      icon: PiSoccerBall,
      id: "champions",
    },
    {
      name: t("f1Fantasy", "F1 Fantasy"),
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
                      ? "text-red-400 bg-red-500/10"
                      : "text-red-600 bg-red-50"
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
                      theme === "dark" ? "bg-red-400" : "bg-red-600"
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
            <span className="text-xs font-medium">Menu</span>
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};

export default BottomNavigation;
