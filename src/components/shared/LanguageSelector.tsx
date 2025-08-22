"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ChevronDown, Globe } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const languages = [
  { code: "bs", name: "Bosanski", flag: "🇧🇦" },
  { code: "sr", name: "Српски", flag: "🇷🇸" },
  { code: "hr", name: "Hrvatski", flag: "🇭🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
];

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
    // Save to localStorage
    localStorage.setItem("i18nextLng", languageCode);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
          theme === "dark"
            ? "bg-gray-800/50 hover:bg-gray-700/70 text-white border border-gray-700"
            : "bg-white/60 hover:bg-white/80 text-gray-800 border border-gray-200"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Globe className="w-4 h-4" />
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-sm font-medium hidden sm:block">
          {currentLanguage.code.toUpperCase()}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full left-0 mt-2 w-48 rounded-xl shadow-2xl border backdrop-blur-xl z-50 ${
              theme === "dark"
                ? "bg-gray-900/95 border-gray-700"
                : "bg-white/95 border-gray-200"
            }`}
          >
            <div className="py-2">
              {languages.map((language, index) => (
                <motion.button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ${
                    i18n.language === language.code
                      ? theme === "dark"
                        ? "bg-red-900/30 text-red-400"
                        : "bg-blue-100/70 text-blue-700"
                      : theme === "dark"
                      ? "hover:bg-gray-800/70 text-gray-300 hover:text-white"
                      : "hover:bg-gray-100/70 text-gray-700 hover:text-gray-900"
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4 }}
                >
                  <span className="text-xl">{language.flag}</span>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{language.name}</span>
                    <span className="text-xs opacity-70">
                      {language.code.toUpperCase()}
                    </span>
                  </div>
                  {i18n.language === language.code && (
                    <motion.div
                      className={`ml-auto w-2 h-2 rounded-full ${
                        theme === "dark" ? "bg-red-400" : "bg-blue-600"
                      }`}
                      layoutId="activeLanguage"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
