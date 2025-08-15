"use client";

import { useTheme } from "@/contexts/ThemeContext";
import Link from "next/link";
import {
  DollarSign,
  Trophy,
  Calendar,
  Medal,
  PenTool,
  Trophy as TrophyAlt,
  Camera,
  BarChart3,
} from "lucide-react";
import Image from "next/image";

export default function ChampionsLeaguePage() {
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen relative ${
        theme === "dark"
          ? "league-background champions-league-bg"
          : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      }`}
      style={{
        maxWidth: "100vw",
        maxHeight: "100vh",
      }}
    >
      {/* Enhanced Background Effects */}
      {theme === "dark" && (
        <>
          {/* Purple glowing overlay */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
            <div
              className="absolute top-32 right-32 w-80 h-80 bg-blue-500/15 rounded-full blur-2xl animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
            <div
              className="absolute top-40 right-40 w-64 h-64 bg-indigo-500/10 rounded-full blur-xl animate-pulse"
              style={{ animationDelay: "2s" }}
            ></div>
          </div>
          {/* Enhanced overlay for better readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/70 z-[1]"></div>
        </>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden subnav-page-spacing pb-20 px-4 content-overlay z-[10]">
        <div className="max-w-7xl mx-auto text-center">
          {/* Champions League Logo */}
          <div className="w-32 h-32 mx-auto mb-8 relative">
            <div
              className={`absolute inset-0 rounded-full blur-lg ${
                theme === "dark" ? "bg-blue-500/30" : "bg-blue-300/30"
              }`}
            ></div>
            <Image
              src="/images/logos/cl-logo.png"
              alt="Champions League Logo"
              width={128}
              height={128}
              className="rounded-full shadow-2xl relative z-10 object-cover"
            />
          </div>

          <h1
            className={`text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-none ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            Champions League
            <span
              className={`block text-2xl md:text-4xl lg:text-5xl mt-2 ${
                theme === "dark" ? "text-blue-400" : "text-blue-600"
              }`}
            >
              Fantasy Liga
            </span>
          </h1>

          <p
            className={`text-lg md:text-xl leading-relaxed mb-12 max-w-3xl mx-auto ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Dobrodošli u najprestižniju Champions League fantasy ligu!
            Registrujte se, kreirajte svoj evropski tim i takmičite se za
            fantastične nagrade u najjačem takmičenju.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="/champions-league/registracija"
              className={`inline-flex items-center px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl ${
                theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-300/50"
              }`}
            >
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Registruj se sada
            </Link>

            <Link
              href="/champions-league/nagrade"
              className={`inline-flex items-center px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 border-2 ${
                theme === "dark"
                  ? "border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-gray-900"
                  : "border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              }`}
            >
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3l14 9-14 9V3z"
                />
              </svg>
              Pogledaj nagrade
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
            {[
              {
                label: "Ukupan nagradni fond",
                value: "5.200 KM",
                icon: DollarSign,
              },
              { label: "Broj liga", value: "3", icon: Trophy },
              { label: "Mjesečne nagrade", value: "9x", icon: Calendar },
              { label: "Finalne nagrade", value: "4x", icon: Medal },
            ].map((stat, index) => (
              <div
                key={index}
                className={`p-4 md:p-6 rounded-2xl backdrop-blur-lg border transition-all duration-300 hover:scale-105 ${
                  theme === "dark"
                    ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800/70"
                    : "bg-white/60 border-blue-200 hover:bg-white/80"
                }`}
              >
                <div className="mb-2 flex justify-center">
                  <stat.icon
                    className={`w-8 h-8 ${
                      theme === "dark" ? "text-blue-400" : "text-blue-600"
                    }`}
                  />
                </div>
                <div
                  className={`text-2xl font-bold mb-1 ${
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

        {/* Background decorations - Enhanced purple glow */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 left-20 w-80 h-80 bg-blue-500/12 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "0.5s" }}
        ></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </section>

      {/* Quick Navigation Section */}
      <section className="py-16 px-4 content-overlay z-[10] relative">
        <div className="max-w-6xl mx-auto">
          <h2
            className={`text-3xl md:text-4xl font-bold text-center mb-12 ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            Istraži Champions League Fantasy
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                title: "Registracija",
                description: "Registruj se za Champions League",
                href: "/champions-league/registracija",
                icon: PenTool,
                color: "blue",
              },
              {
                title: "Nagrade",
                description: "Pogledaj sve dostupne nagrade",
                href: "/champions-league/nagrade",
                icon: TrophyAlt,
                color: "yellow",
              },
              {
                title: "Galerija",
                description: "Slike i memorije prethodnih sezona",
                href: "/champions-league/galerija",
                icon: Camera,
                color: "purple",
              },
              {
                title: "Tabele",
                description: "Trenutni rezultati i tabele",
                href: "/champions-league/tabele",
                icon: BarChart3,
                color: "green",
              },
            ].map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`group p-4 md:p-6 rounded-2xl backdrop-blur-lg border transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                  theme === "dark"
                    ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800/70"
                    : "bg-white/60 border-blue-200 hover:bg-white/80"
                }`}
              >
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                  <item.icon
                    className={`w-12 h-12 ${
                      item.color === "blue"
                        ? "text-blue-500"
                        : item.color === "yellow"
                        ? "text-yellow-500"
                        : item.color === "purple"
                        ? "text-purple-500"
                        : "text-green-500"
                    }`}
                  />
                </div>
                <h3
                  className={`text-xl font-bold mb-2 ${
                    theme === "dark" ? "text-white" : "text-gray-800"
                  }`}
                >
                  {item.title}
                </h3>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {item.description}
                </p>
                <div
                  className={`mt-4 inline-flex items-center text-sm font-semibold ${
                    item.color === "blue"
                      ? "text-blue-500"
                      : item.color === "yellow"
                      ? "text-yellow-500"
                      : item.color === "purple"
                      ? "text-purple-500"
                      : "text-green-500"
                  } group-hover:translate-x-1 transition-transform duration-300`}
                >
                  Saznaj više
                  <svg
                    className="w-4 h-4 ml-1"
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
