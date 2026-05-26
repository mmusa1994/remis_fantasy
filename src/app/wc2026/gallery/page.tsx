"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import Image from "next/image";

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.4 },
  },
};

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const placeholderCards = [
  {
    height: "h-48 sm:h-56",
    borderColor: "border-[#002868]/20 dark:border-[#002868]/30",
    gradientFrom: "from-[#002868]/5",
    gradientTo: "to-transparent",
    shimmerColor: "via-[#002868]/[0.03]",
  },
  {
    height: "h-36 sm:h-44",
    borderColor: "border-[#006847]/20 dark:border-[#006847]/30",
    gradientFrom: "from-[#006847]/5",
    gradientTo: "to-transparent",
    shimmerColor: "via-[#006847]/[0.03]",
  },
  {
    height: "h-52 sm:h-60",
    borderColor: "border-[#BF0A30]/20 dark:border-[#BF0A30]/30",
    gradientFrom: "from-[#BF0A30]/5",
    gradientTo: "to-transparent",
    shimmerColor: "via-[#BF0A30]/[0.03]",
  },
  {
    height: "h-44 sm:h-52",
    borderColor: "border-[#006847]/20 dark:border-[#006847]/30",
    gradientFrom: "from-[#006847]/5",
    gradientTo: "to-transparent",
    shimmerColor: "via-[#006847]/[0.03]",
  },
  {
    height: "h-40 sm:h-48",
    borderColor: "border-[#BF0A30]/20 dark:border-[#BF0A30]/30",
    gradientFrom: "from-[#BF0A30]/5",
    gradientTo: "to-transparent",
    shimmerColor: "via-[#BF0A30]/[0.03]",
  },
  {
    height: "h-48 sm:h-56",
    borderColor: "border-[#002868]/20 dark:border-[#002868]/30",
    gradientFrom: "from-[#002868]/5",
    gradientTo: "to-transparent",
    shimmerColor: "via-[#002868]/[0.03]",
  },
];

export default function WC2026GalleryPage() {
  const { theme } = useTheme();
  const { t } = useTranslation("wc2026");
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen pb-20 pt-10 px-4 bg-theme-background">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
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

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent mb-2"
          >
            {t("gallery.title")}
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="w-12 h-[2px] mx-auto bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full mb-6"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            {t("gallery.noPhotos", "Photos will be shared during the tournament")}
          </motion.p>
        </div>

        {/* Masonry-like Placeholder Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="columns-2 md:columns-3 gap-4 space-y-4"
        >
          {placeholderCards.map((card, i) => (
            <motion.div
              key={i}
              variants={item}
              className={`relative break-inside-avoid rounded-xl border overflow-hidden ${card.height} ${card.borderColor} ${
                isDark ? "bg-gray-800/30" : "bg-gray-50/80"
              }`}
            >
              {/* Subtle gradient fill */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradientFrom} ${card.gradientTo}`} />

              {/* Shimmer animation */}
              <div className="absolute inset-0 overflow-hidden">
                <div
                  className={`absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent ${card.shimmerColor} to-transparent`}
                  style={{ animationDelay: `${i * 0.3}s` }}
                />
              </div>

              {/* Center indicator */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-8 h-8 rounded-lg ${isDark ? "bg-white/[0.03]" : "bg-black/[0.02]"} flex items-center justify-center`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className={`w-4 h-4 ${isDark ? "text-white/10" : "text-black/8"}`}>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className={`text-center text-xs mt-10 ${isDark ? "text-gray-600" : "text-gray-400"}`}
        >
          {t("gallery.comingSoon", "Gallery will be updated with photos from each match day")}
        </motion.p>
      </div>
    </div>
  );
}
