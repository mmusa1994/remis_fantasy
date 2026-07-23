"use client";

import { Suspense } from "react";
import { CheckCircle, MailWarning } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

function PLRegistrationSuccessContent() {
  const { t } = useTranslation("common");
  const searchParams = useSearchParams();
  const isCash = searchParams.get("method") === "cash";

  return (
    <section className="relative w-full min-h-[60vh] bg-theme-background theme-transition flex items-center justify-center">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-900/20 via-purple-800/10 to-purple-800/20 rounded-lg blur-3xl animate-pulse-gentle gpu-accelerated"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-l from-purple-900/20 via-purple-900/10 to-purple-800/20 rounded-lg blur-3xl animate-float-slow gpu-accelerated"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-2xl text-center py-12">
        <div className="animate-fade-in-up">
          {/* PL Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center shadow-2xl shadow-purple-500/30">
              <Image
                src="/images/logos/pl-logo.png"
                alt="Premier League"
                width={56}
                height={56}
                unoptimized
                className="w-14 h-14 object-contain"
              />
            </div>
          </div>

          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-md bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-2xl shadow-green-500/30 animate-scale-in">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-black mb-4 font-anta">
            <span className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-700 bg-clip-text text-transparent">
              {t("plSuccess.title")}
            </span>
          </h1>

          <p className="text-theme-text-secondary text-base md:text-lg mb-8 max-w-lg mx-auto">
            {isCash ? t("plSuccess.messageCash") : t("plSuccess.message")}
          </p>

          {/* Spam check notice */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/10 to-amber-500/10 rounded-lg p-5 mb-6 border border-amber-500/40 flex items-start gap-3 text-left">
            <MailWarning className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-theme-heading-primary font-bold mb-1">
                {t("plSuccess.emailNoteTitle")}
              </p>
              <p className="text-theme-text-secondary text-sm">
                {t("plSuccess.emailNote")}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500/10 via-purple-500/10 to-purple-500/10 rounded-lg p-6 mb-8 border border-purple-500/30">
            <p className="text-theme-heading-primary font-bold mb-2">
              {t("plSuccess.whatsNext")}
            </p>
            <p className="text-theme-text-secondary text-sm">
              {t("plSuccess.whatsNextDescription")}
            </p>
          </div>

          <Link
            href="/premier-league/tables"
            className="inline-block bg-gradient-to-r from-purple-600 via-purple-600 to-purple-700 hover:from-purple-700 hover:via-purple-700 hover:to-purple-800 text-white font-black py-3 px-8 rounded-lg text-base md:text-lg transition-all duration-500 shadow-2xl border-2 border-purple-500/50 font-anta hover-scale hover-glow focus-ring"
          >
            {t("plSuccess.viewTables")}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function PLRegistrationSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PLRegistrationSuccessContent />
    </Suspense>
  );
}
