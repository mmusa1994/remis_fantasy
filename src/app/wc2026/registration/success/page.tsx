"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { CheckCircle, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function WC2026RegistrationSuccessPage() {
  const { theme } = useTheme();
  const { t } = useTranslation("wc2026");
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-theme-background">
      <motion.div
        className={`rounded-2xl border p-8 md:p-12 text-center max-w-lg w-full ${
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
        }`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <motion.div
          className="flex justify-center mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Image
            src="/images/logos/wc-logo.png"
            alt="FIFA World Cup 2026"
            width={60}
            height={36}
            className="h-9 w-auto object-contain"
          />
        </motion.div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-teal-600 dark:text-teal-400" />
          </div>
        </motion.div>

        <motion.h2
          className={`text-2xl md:text-3xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {t("registration.successTitle")}
        </motion.h2>

        <motion.p
          className={`text-sm md:text-base mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {t("registration.successMessage")}
        </motion.p>

        <motion.div
          className={`flex items-start gap-2.5 text-left rounded-xl border px-4 py-3 mb-8 ${
            isDark
              ? "border-teal-500/20 bg-teal-500/[0.06]"
              : "border-teal-500/30 bg-teal-50/60"
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Info
            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
              isDark ? "text-teal-400" : "text-teal-600"
            }`}
          />
          <p
            className={`text-xs md:text-sm leading-relaxed ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            {t("registration.spamNotice")}
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link
            href="/wc2026/tables"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-semibold text-sm hover:from-teal-500 hover:to-emerald-400 transition-all shadow-md"
          >
            {t("hero.viewTables")}
          </Link>
          <Link
            href="/wc2026"
            className={`px-6 py-2.5 rounded-xl border font-semibold text-sm transition-all ${
              isDark
                ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {t("shortTitle")}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
