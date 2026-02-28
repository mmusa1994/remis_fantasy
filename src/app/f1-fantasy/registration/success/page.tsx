"use client";

import { CheckCircle, Zap } from "lucide-react";
import Link from "next/link";

export default function F1RegistrationSuccessPage() {
  return (
    <section className="relative w-full min-h-[60vh] bg-theme-background theme-transition flex items-center justify-center">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-900/20 via-red-800/10 to-red-800/20 rounded-lg blur-3xl animate-pulse-gentle gpu-accelerated"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-l from-red-900/20 via-red-900/10 to-red-800/20 rounded-lg blur-3xl animate-float-slow gpu-accelerated"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-2xl text-center py-12">
        <div className="animate-fade-in-up">
          {/* F1 Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shadow-2xl shadow-red-500/30">
              <Zap className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-md bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-2xl shadow-green-500/30 animate-scale-in">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-black mb-4 font-anta">
            <span className="bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent">
              Registracija Potvrdena!
            </span>
          </h1>

          <p className="text-theme-text-secondary text-base md:text-lg mb-8 max-w-lg mx-auto">
            Uspjesno ste se registrovali za F1 Fantasy ligu 2026. Placanje je
            primljeno i vasa registracija je aktivna.
          </p>

          <div className="bg-gradient-to-r from-red-500/10 via-red-500/10 to-red-500/10 rounded-lg p-6 mb-8 border border-red-500/30">
            <p className="text-theme-heading-primary font-bold mb-2">
              Sta dalje?
            </p>
            <p className="text-theme-text-secondary text-sm">
              Pratite tabele i rezultate na stranici F1 Fantasy lige. Sretno!
            </p>
          </div>

          <Link
            href="/f1-fantasy/tables"
            className="inline-block bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-700 hover:via-red-700 hover:to-red-800 text-white font-black py-3 px-8 rounded-lg text-base md:text-lg transition-all duration-500 shadow-2xl border-2 border-red-500/50 font-anta hover-scale hover-glow focus-ring"
          >
            Pogledaj tabele
          </Link>
        </div>
      </div>
    </section>
  );
}
