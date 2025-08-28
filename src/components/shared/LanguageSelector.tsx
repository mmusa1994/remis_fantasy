"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ChevronDown, Globe } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import CountryFlag from "@/components/shared/CountryFlag";

const languages = [
  { code: "en", name: "English", flagCode: "gb" },
  { code: "bs", name: "Bosanski", flagCode: "ba" },
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
            ? "bg-black hover:bg-gray-900 text-white border border-white"
            : "bg-white hover:bg-gray-50 text-black border border-black"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Globe className="w-4 h-4" />
        <span className={`fi fi-${currentLanguage.flagCode} text-lg`}></span>
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
                ? "bg-black border-white"
                : "bg-white border-black"
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
                        ? "bg-white/20 text-white"
                        : "bg-black/10 text-black"
                      : theme === "dark"
                      ? "hover:bg-white/10 text-white hover:text-white"
                      : "hover:bg-black/5 text-black hover:text-black"
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4 }}
                >
                  <CountryFlag country={language.flagCode} size="xl" />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{language.name}</span>
                    <span className="text-xs opacity-70">
                      {language.code.toUpperCase()}
                    </span>
                  </div>
                  {i18n.language === language.code && (
                    <motion.div
                      className={`ml-auto w-2 h-2 rounded-full ${
                        theme === "dark" ? "bg-white" : "bg-black"
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
