"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import CountryFlag from "@/components/shared/CountryFlag";

const languages = [
  { code: "en", name: "English", flagCode: "gb" },
  { code: "bs", name: "Bosanski", flagCode: "ba" },
];

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [justSwitched, setJustSwitched] = useState(false);
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];
  const otherLanguage =
    languages.find((lang) => lang.code !== i18n.language) || languages[1];

  const handleToggle = useCallback(() => {
    // Simple two-language toggle — no dropdown needed, just swap
    const next = otherLanguage.code;
    i18n.changeLanguage(next);
    localStorage.setItem("i18nextLng", next);
    setJustSwitched(true);
    setTimeout(() => setJustSwitched(false), 600);
  }, [i18n, otherLanguage.code]);

  // Close dropdown on outside click (kept for mobile long-press menu)
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
      {/* Main toggle — minimal pill */}
      <motion.button
        onClick={handleToggle}
        onContextMenu={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        whileTap={{ scale: 0.92 }}
        className={`
          group relative flex items-center gap-1.5 h-9 px-2.5 rounded-full
          transition-all duration-300 cursor-pointer select-none
          ${
            isDark
              ? "bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08]"
              : "bg-black/[0.04] hover:bg-black/[0.08] border border-black/[0.06]"
          }
        `}
        title={`Switch to ${otherLanguage.name}`}
      >
        {/* Active flag */}
        <motion.div
          key={currentLanguage.code}
          initial={justSwitched ? { rotateY: 90, opacity: 0 } : false}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative"
        >
          <span
            className={`fi fi-${currentLanguage.flagCode} text-base rounded-[3px] block`}
            style={{ lineHeight: 1 }}
          />
        </motion.div>

        {/* Language code */}
        <motion.span
          key={`label-${currentLanguage.code}`}
          initial={justSwitched ? { y: 8, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className={`text-[11px] font-semibold tracking-wider uppercase leading-none ${
            isDark ? "text-white/60" : "text-black/50"
          }`}
        >
          {currentLanguage.code}
        </motion.span>

        {/* Subtle separator + target hint */}
        <div
          className={`w-px h-3.5 ${
            isDark ? "bg-white/[0.1]" : "bg-black/[0.08]"
          }`}
        />
        <span
          className={`fi fi-${otherLanguage.flagCode} text-xs rounded-[2px] block opacity-30 group-hover:opacity-60 transition-opacity duration-300`}
          style={{ lineHeight: 1 }}
        />
      </motion.button>

      {/* Dropdown — accessible via right-click, for completeness */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute top-full right-0 mt-2 w-44 rounded-xl overflow-hidden shadow-xl z-50 backdrop-blur-xl ${
              isDark
                ? "bg-gray-900/95 border border-white/[0.08] shadow-black/40"
                : "bg-white/95 border border-black/[0.06] shadow-black/10"
            }`}
          >
            <div className="py-1.5">
              {languages.map((language) => {
                const isActive = i18n.language === language.code;
                return (
                  <button
                    key={language.code}
                    onClick={() => {
                      i18n.changeLanguage(language.code);
                      localStorage.setItem("i18nextLng", language.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-200 ${
                      isActive
                        ? isDark
                          ? "bg-white/[0.08]"
                          : "bg-black/[0.04]"
                        : isDark
                        ? "hover:bg-white/[0.05]"
                        : "hover:bg-black/[0.03]"
                    }`}
                  >
                    <span
                      className={`fi fi-${language.flagCode} text-lg rounded-[3px]`}
                      style={{ lineHeight: 1 }}
                    />
                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-medium leading-tight ${
                          isDark ? "text-white/90" : "text-black/80"
                        }`}
                      >
                        {language.name}
                      </span>
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="lang-active-dot"
                        className={`ml-auto w-1.5 h-1.5 rounded-full ${
                          isDark ? "bg-white/50" : "bg-black/30"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
