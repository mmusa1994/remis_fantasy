"use client";

import { useTheme } from "@/contexts/ThemeContext";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import {
  Gamepad2,
  Trophy,
  Zap,
  DollarSign,
  Calendar,
  Users,
} from "lucide-react";

export default function Home() {
  const { theme } = useTheme();

  return (
    <main
      className={`w-full min-h-screen overflow-x-hidden ${
        theme === "dark"
          ? "bg-black"
          : "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50"
      }`}
    >
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden mobile-nav-adjust pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Logo */}
          <div
            className={`w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 mx-auto mb-8 md:mb-12 rounded-full flex items-center justify-center ${
              theme === "dark"
                ? "bg-gradient-to-br from-orange-600 to-red-800 shadow-2xl shadow-orange-500/20"
                : "bg-gradient-to-br from-orange-500 to-red-700 shadow-2xl shadow-orange-300/30"
            }`}
          >
            <svg
              className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L13.09 8.26L22 9L13.09 10.74L12 17L10.91 10.74L2 9L10.91 8.26L12 2Z" />
            </svg>
          </div>

          <h1
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-black mb-6 md:mb-8 leading-none ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            REMIS Fantasy
            <span
              className={`block text-lg sm:text-xl md:text-2xl lg:text-4xl xl:text-5xl mt-2 md:mt-4 font-normal ${
                theme === "dark" ? "text-orange-400" : "text-orange-600"
              }`}
            >
              Sezona 2025/26
            </span>
          </h1>

          <p
            className={`text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed mb-12 md:mb-16 max-w-4xl mx-auto ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Dobrodošli u najuzbudljivije fantasy lige! Odaberite svoju ligu i
            pokažite svoje znanje sporta.
          </p>

          {/* League Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Premier League",
                description:
                  "Najpopularnija fantasy liga sa 4 različite kategorije",
                href: "/premier-league",
                icon: Gamepad2,
                gradient: "from-purple-600 to-purple-800",
                available: true,
              },
              {
                title: "Champions League",
                description: "Evropska elita fantasy fudbala",
                href: "/champions-league",
                icon: Trophy,
                gradient: "from-blue-600 to-blue-800",
                available: true,
              },
              {
                title: "F1 Fantasy",
                description: "Brzina, strategija i adrenalin na stazi",
                href: "/f1-fantasy",
                icon: Zap,
                gradient: "from-red-600 to-red-800",
                available: true,
              },
            ].map((league, index) => (
              <div
                key={index}
                className={`group relative p-6 md:p-8 rounded-2xl md:rounded-3xl backdrop-blur-lg border transition-all duration-500 hover:scale-105 ${
                  league.available
                    ? theme === "dark"
                      ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 cursor-pointer"
                      : "bg-white/60 border-orange-200 hover:bg-white/80 cursor-pointer"
                    : theme === "dark"
                    ? "bg-gray-800/30 border-gray-700/50 opacity-60"
                    : "bg-white/40 border-orange-200/50 opacity-60"
                } hover:shadow-2xl`}
              >
                {league.available ? (
                  <Link href={league.href} className="block">
                    <div className="mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                      <league.icon className="w-12 h-12 md:w-16 md:h-16 text-white" />
                    </div>
                    <h3
                      className={`text-2xl font-bold mb-4 ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {league.title}
                    </h3>
                    <p
                      className={`text-base leading-relaxed mb-6 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {league.description}
                    </p>
                    <div
                      className={`inline-flex items-center text-sm font-semibold ${
                        league.title === "Premier League"
                          ? "text-purple-500"
                          : league.title === "Champions League"
                          ? "text-blue-500"
                          : "text-red-500"
                      } group-hover:translate-x-1 transition-transform duration-300`}
                    >
                      Otvori ligu
                      <svg
                        className="w-4 h-4 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Link>
                ) : (
                  <div>
                    <div className="mb-6 opacity-50 flex justify-center">
                      <league.icon className="w-16 h-16 text-gray-500" />
                    </div>
                    <h3
                      className={`text-2xl font-bold mb-4 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {league.title}
                    </h3>
                    <p
                      className={`text-base leading-relaxed mb-6 ${
                        theme === "dark" ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {league.description}
                    </p>
                    <div
                      className={`inline-flex items-center text-sm font-semibold ${
                        theme === "dark" ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      Uskoro dostupno
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="mt-12 md:mt-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
            {[
              {
                label: "Ukupan nagradni fond",
                value: "6.400 KM",
                icon: DollarSign,
              },
              { label: "Dostupne lige", value: "3", icon: Trophy },
              { label: "Registrovanih igrača", value: "150+", icon: Users },
              { label: "Godina iskustva", value: "2+", icon: Calendar },
            ].map((stat, index) => (
              <div
                key={index}
                className={`p-4 md:p-6 rounded-2xl backdrop-blur-lg border transition-all duration-300 hover:scale-105 ${
                  theme === "dark"
                    ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800/70"
                    : "bg-white/60 border-orange-200 hover:bg-white/80"
                }`}
              >
                <div className="mb-2 flex justify-center">
                  <stat.icon
                    className={`w-8 h-8 ${
                      theme === "dark" ? "text-orange-400" : "text-orange-600"
                    }`}
                  />
                </div>
                <div
                  className={`text-xl font-bold mb-1 ${
                    theme === "dark" ? "text-white" : "text-gray-800"
                  }`}
                >
                  {stat.value}
                </div>
                <div
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </section>

      <Footer />
    </main>
  );
}
