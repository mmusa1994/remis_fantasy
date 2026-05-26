"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import Image from "next/image";

const statCards = [
  {
    key: "topScorers",
    titleKey: "statistics.topScorers",
    titleDefault: "Top Scorers",
    descKey: "statistics.topScorersDesc",
    descDefault: "Goals scored by players",
    accentFrom: "from-[#002868]",
    accentTo: "to-[#002868]/70",
    accentBorder: "border-[#002868]/20 dark:border-[#002868]/40",
    accentText: "text-[#002868] dark:text-blue-400",
    accentBg: "bg-[#002868]/5 dark:bg-[#002868]/15",
    accentGlow: "shadow-[#002868]/10",
    iconPath: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z" />
      </svg>
    ),
  },
  {
    key: "topAssists",
    titleKey: "statistics.topAssists",
    titleDefault: "Top Assists",
    descKey: "statistics.topAssistsDesc",
    descDefault: "Key passes leading to goals",
    accentFrom: "from-[#006847]",
    accentTo: "to-[#006847]/70",
    accentBorder: "border-[#006847]/20 dark:border-[#006847]/40",
    accentText: "text-[#006847] dark:text-emerald-400",
    accentBg: "bg-[#006847]/5 dark:bg-[#006847]/15",
    accentGlow: "shadow-[#006847]/10",
    iconPath: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M7 17l9.2-9.2M17 17V7H7" />
      </svg>
    ),
  },
  {
    key: "cleanSheets",
    titleKey: "statistics.cleanSheets",
    titleDefault: "Clean Sheets",
    descKey: "statistics.cleanSheetsDesc",
    descDefault: "Matches without conceding",
    accentFrom: "from-[#BF0A30]",
    accentTo: "to-[#BF0A30]/70",
    accentBorder: "border-[#BF0A30]/20 dark:border-[#BF0A30]/40",
    accentText: "text-[#BF0A30] dark:text-red-400",
    accentBg: "bg-[#BF0A30]/5 dark:bg-[#BF0A30]/15",
    accentGlow: "shadow-[#BF0A30]/10",
    iconPath: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function WC2026Statistics() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { t } = useTranslation("wc2026");

  return (
    <div className="space-y-6">
      {/* Main Coming Soon Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl"
      >
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 p-[1px]">
          <div className={`h-full w-full rounded-2xl ${isDark ? "bg-gray-900" : "bg-white"}`} />
        </div>

        <div className="relative z-10 p-8 md:p-12">
          {/* WC Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-6"
          >
            <Image
              src="/images/logos/wc-logo.png"
              alt="WC 2026"
              width={48}
              height={28}
              className="h-7 w-auto object-contain mx-auto opacity-60"
            />
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent mb-2"
          >
            {t("statistics.title", "Tournament Statistics")}
          </motion.h2>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="w-12 h-[2px] mx-auto bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full mb-8"
          />

          {/* Stat Preview Cards */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {statCards.map((card) => (
              <motion.div
                key={card.key}
                variants={item}
                className={`group relative rounded-xl border ${card.accentBorder} ${card.accentBg} p-5 transition-all duration-300 hover:shadow-lg ${card.accentGlow}`}
              >
                {/* Top accent line */}
                <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r ${card.accentFrom} ${card.accentTo} opacity-60`} />

                <div className="flex items-center gap-3 mb-4">
                  <div className={`${card.accentText} opacity-70`}>
                    {card.iconPath}
                  </div>
                  <h3 className={`text-sm font-semibold ${card.accentText}`}>
                    {t(card.titleKey, card.titleDefault)}
                  </h3>
                </div>

                {/* Placeholder value */}
                <div className="mb-2">
                  <span className={`text-3xl font-bold tracking-tight ${isDark ? "text-white/20" : "text-gray-900/15"}`}>
                    ---
                  </span>
                </div>

                <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  {t(card.descKey, card.descDefault)}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className={`text-center text-sm mt-8 ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            {t("statistics.noStats", "Statistics will be available after the tournament begins")}
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
