"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import Image from "next/image";

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.4 },
  },
};

const cardUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const prizes = [
  {
    place: "firstPlace",
    rank: "1",
    medalGradient: "from-yellow-300 via-amber-400 to-yellow-500",
    cardBorder: "border-yellow-400/30 dark:border-yellow-500/20",
    cardGlow: "hover:shadow-yellow-400/15 dark:hover:shadow-yellow-400/10",
    shimmer: "from-yellow-400/0 via-yellow-400/10 to-yellow-400/0",
    accentLine: "from-[#002868] via-[#006847] to-[#BF0A30]",
    rankBg: "bg-gradient-to-br from-yellow-300 to-amber-500",
    amountColor: "text-amber-600 dark:text-amber-400",
  },
  {
    place: "secondPlace",
    rank: "2",
    medalGradient: "from-gray-200 via-gray-300 to-slate-400",
    cardBorder: "border-gray-300/30 dark:border-gray-500/20",
    cardGlow: "hover:shadow-gray-400/10 dark:hover:shadow-gray-400/5",
    shimmer: "from-gray-300/0 via-gray-300/10 to-gray-300/0",
    accentLine: "from-[#002868] to-[#002868]/40",
    rankBg: "bg-gradient-to-br from-gray-200 to-slate-400",
    amountColor: "text-gray-600 dark:text-gray-300",
  },
  {
    place: "thirdPlace",
    rank: "3",
    medalGradient: "from-amber-500 via-orange-600 to-amber-700",
    cardBorder: "border-amber-500/30 dark:border-amber-600/20",
    cardGlow: "hover:shadow-amber-500/10 dark:hover:shadow-amber-500/5",
    shimmer: "from-amber-500/0 via-amber-500/10 to-amber-500/0",
    accentLine: "from-[#BF0A30] to-[#BF0A30]/40",
    rankBg: "bg-gradient-to-br from-amber-500 to-orange-700",
    amountColor: "text-amber-700 dark:text-amber-400",
  },
];

export default function WC2026PrizesPage() {
  const { theme } = useTheme();
  const { t } = useTranslation("wc2026");
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen pb-20 bg-theme-background">
      {/* Top Section */}
      <div className="pt-10 pb-4 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* WC Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
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
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent mb-2"
          >
            {t("prizes.title")}
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="w-12 h-[2px] mx-auto bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full mb-8"
          />
        </div>
      </div>

      {/* Prize Pool Banner */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl"
        >
          {/* Gradient border */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 p-[1px]">
            <div className={`h-full w-full rounded-2xl ${isDark ? "bg-gray-900" : "bg-gray-950"}`} />
          </div>

          <div className="relative z-10 py-10 px-6 text-center">
            {/* Subtle host-country accent dots */}
            <div className="absolute top-4 left-6 flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#002868]/60" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#006847]/60" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#BF0A30]/60" />
            </div>

            <p className="text-sm font-medium text-teal-400/80 uppercase tracking-widest mb-3">
              {t("prizes.prizePool", "Prize Pool")}
            </p>
            <p className="text-5xl sm:text-6xl font-black text-white/90 tracking-tight mb-2">
              TBD
            </p>
            <p className="text-sm text-gray-400">
              {t("prizes.prizePoolSub", "To be announced before tournament start")}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Prize Cards */}
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-3 gap-5"
        >
          {prizes.map((prize, i) => (
            <motion.div
              key={prize.place}
              variants={cardUp}
              className={`relative rounded-2xl border p-6 sm:p-7 text-center transition-all duration-300 hover:shadow-xl ${
                prize.cardBorder
              } ${prize.cardGlow} ${
                isDark ? "bg-gray-800/60" : "bg-white"
              } ${i === 0 ? "sm:-mt-2 sm:scale-[1.03]" : ""}`}
            >
              {/* Top accent line - host country colors */}
              <div className={`absolute top-0 left-6 right-6 h-[2px] rounded-full bg-gradient-to-r ${prize.accentLine} opacity-50`} />

              {/* Medal decoration */}
              <div className="relative mx-auto mb-5 w-14 h-14">
                {/* Outer ring */}
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${prize.medalGradient} opacity-20`} />
                {/* Inner circle with rank */}
                <div className={`absolute inset-1.5 rounded-full ${prize.rankBg} flex items-center justify-center shadow-lg`}>
                  <span className="text-white font-black text-lg drop-shadow-sm">
                    {prize.rank}
                  </span>
                </div>
              </div>

              <h3 className={`text-base font-bold mb-5 ${isDark ? "text-white" : "text-gray-800"}`}>
                {t(`prizes.${prize.place}`)}
              </h3>

              <div className="space-y-1.5">
                <p className={`text-2xl font-black tracking-tight ${prize.amountColor}`}>
                  TBD
                </p>
                <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  KM / EUR
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="max-w-4xl mx-auto px-4 mt-10"
      >
        <p className={`text-center text-sm ${isDark ? "text-gray-600" : "text-gray-400"}`}>
          {t("prizes.infoText", "Prize amounts will be announced before the tournament begins. All prizes will be distributed after the final match.")}
        </p>
      </motion.div>
    </div>
  );
}
