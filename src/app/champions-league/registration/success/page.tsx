"use client";

import { CheckCircle, Trophy } from "lucide-react";
import Link from "next/link";

export default function CLRegistrationSuccessPage() {
  return (
    <section className="relative w-full min-h-[60vh] bg-theme-background theme-transition flex items-center justify-center">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-900/20 via-blue-800/10 to-blue-800/20 rounded-lg blur-3xl animate-pulse-gentle gpu-accelerated"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-l from-blue-900/20 via-blue-900/10 to-blue-800/20 rounded-lg blur-3xl animate-float-slow gpu-accelerated"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-2xl text-center py-12">
        <div className="animate-fade-in-up">
          {/* CL Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-700 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <Trophy className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-md bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-2xl shadow-green-500/30 animate-scale-in">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-black mb-4 font-anta">
            <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 bg-clip-text text-transparent">
              Registracija Potvrdena!
            </span>
          </h1>

          <p className="text-theme-text-secondary text-base md:text-lg mb-8 max-w-lg mx-auto">
            Uspjesno ste se registrovali za Champions League Fantasy ligu 2026/27. Placanje je
            primljeno i vasa registracija je aktivna.
          </p>

          <div className="bg-gradient-to-r from-blue-500/10 via-blue-500/10 to-blue-500/10 rounded-lg p-6 mb-8 border border-blue-500/30">
            <p className="text-theme-heading-primary font-bold mb-2">
              Sta dalje?
            </p>
            <p className="text-theme-text-secondary text-sm">
              Pratite tabele i rezultate na stranici Champions League Fantasy lige. Sretno!
            </p>
          </div>

          <Link
            href="/champions-league/tables"
            className="inline-block bg-gradient-to-r from-blue-700 via-blue-700 to-blue-800 hover:from-blue-800 hover:via-blue-800 hover:to-blue-900 text-white font-black py-3 px-8 rounded-lg text-base md:text-lg transition-all duration-500 shadow-2xl border-2 border-blue-500/50 font-anta hover-scale hover-glow focus-ring"
          >
            Pogledaj tabele
          </Link>
        </div>
      </div>
    </section>
  );
}
