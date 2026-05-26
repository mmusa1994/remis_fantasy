"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import WC2026Table from "@/components/wc2026/WC2026Table";

export default function WC2026TablesPage() {
  const { theme } = useTheme();
  const { t } = useTranslation("wc2026");

  return (
    <div className="min-h-screen pb-20 pt-10 px-4 bg-theme-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <Image src="/images/logos/wc-logo.png" alt="WC 2026" width={48} height={28} className="h-7 w-auto object-contain mx-auto opacity-60 mb-4" />
          </motion.div>
          <motion.h1
            className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            {t("tables.title")}
          </motion.h1>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3, duration: 0.6 }} className="w-12 h-[2px] mx-auto bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full" />
        </div>
        <WC2026Table />
      </div>
    </div>
  );
}
