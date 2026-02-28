"use client";

import { CheckCircle, Mail, Clock } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function F1RegistrationSuccessPage() {
  const { t } = useTranslation("f1");

  return (
    <section className="relative w-full min-h-[60vh] bg-theme-background theme-transition flex items-center justify-center">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-900/20 via-red-800/10 to-red-800/20 rounded-lg blur-3xl animate-pulse-gentle gpu-accelerated"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-l from-red-900/20 via-red-900/10 to-red-800/20 rounded-lg blur-3xl animate-float-slow gpu-accelerated"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-2xl text-center py-12">
        <div className="animate-fade-in-up">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-md bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-2xl shadow-green-500/30 animate-scale-in">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-black mb-4 font-anta">
            <span className="bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">
              {t("success.title")}
            </span>
          </h1>

          <p className="text-theme-text-secondary text-base md:text-lg mb-8 max-w-lg mx-auto">
            {t("success.message")}
          </p>

          {/* Email instructions */}
          <div className="bg-gradient-to-r from-red-500/10 via-red-500/10 to-red-500/10 rounded-lg p-6 mb-8 border border-red-500/30 text-left space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-theme-heading-primary font-bold">
                {t("success.checkEmail")}
              </p>
            </div>
            <p
              className="text-theme-text-secondary text-sm leading-relaxed [&_strong]:text-theme-heading-primary"
              dangerouslySetInnerHTML={{ __html: t("success.emailInstructions") }}
            />
            <div className="flex items-start gap-2.5 p-3 rounded-md bg-amber-500/5 border border-amber-500/15">
              <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p
                className="text-xs text-theme-text-secondary leading-relaxed [&_strong]:text-theme-heading-primary"
                dangerouslySetInnerHTML={{ __html: t("success.emailTiming") }}
              />
            </div>
          </div>

          <Link
            href="/f1-fantasy/tables"
            className="inline-block bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-700 hover:via-red-700 hover:to-red-800 text-white font-black py-3 px-8 rounded-lg text-base md:text-lg transition-all duration-500 shadow-2xl border-2 border-red-500/50 font-anta hover-scale hover-glow focus-ring"
          >
            {t("success.viewTables")}
          </Link>
        </div>
      </div>
    </section>
  );
}
