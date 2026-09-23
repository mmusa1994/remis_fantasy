"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

const ThemeToggle = React.memo(function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation("common");

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-2 rounded-md bg-theme-secondary border border-theme-border text-theme-foreground hover:bg-theme-accent transition-all duration-300"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={
        theme === "dark" ? t("themeToggle.toLight") : t("themeToggle.toDark")
      }
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === "dark" ? 0 : 180 }}
        transition={{ duration: 0.3 }}
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </motion.div>
    </motion.button>
  );
});

export default ThemeToggle;
