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

export default function PremierLeaguePage() {
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "league-background premier-league-bg"
          : "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50"
      }`}
    >
      {/* Background Image with Blurred Edges */}
      <div className="absolute top-0 left-0 right-0 h-96 overflow-hidden">
        <div className="relative w-full h-full">
          {/* Main background image */}
          <Image
            src="/images/logos/fant-pl.jpg"
            alt="Premier League Fantasy Background"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Gradient overlay for blurred edges - adapts to theme */}
          <div
            className={`absolute inset-0 ${
              theme === "dark"
                ? "bg-gradient-to-r from-black/70 via-black/20 to-black/70"
                : "bg-gradient-to-r from-black/50 via-black/10 to-black/50"
            }`}
          ></div>
          <div
            className={`absolute inset-0 ${
              theme === "dark"
                ? "bg-gradient-to-t from-black/90 via-black/30 to-black/70"
                : "bg-gradient-to-t from-black/70 via-black/20 to-black/50"
            }`}
          ></div>
          <div
            className={`absolute inset-0 ${
              theme === "dark"
                ? "bg-gradient-to-b from-black/70 via-black/20 to-black/90"
                : "bg-gradient-to-b from-black/50 via-black/10 to-black/70"
            }`}
          ></div>
          {/* Additional blur effect on edges */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-black to-transparent"></div>
            <div className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l from-black to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden subnav-page-spacing pb-20 px-4 content-overlay z-10">
        <div className="max-w-7xl mx-auto text-center">
          {/* Content backdrop */}
          <div className="absolute inset-0 backdrop-blur-sm bg-black/10 rounded-3xl -m-8"></div>
          <div className="relative z-10">
            {/* Premier League Logo */}
            <div className="w-32 h-32 mx-auto mb-8 relative">
              <div
                className={`absolute inset-0 rounded-full blur-lg ${
                  theme === "dark" ? "bg-purple-500/30" : "bg-purple-300/30"
                }`}
              ></div>
              <Image
                src="/images/logos/pl-logo.png"
                alt="Premier League Logo"
                width={128}
                height={128}
                className="rounded-full shadow-2xl relative z-10 object-cover"
              />
            </div>

            <h1
              className={`text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-none drop-shadow-2xl ${
                theme === "dark" ? "text-white" : "text-white"
              }`}
              style={{
                textShadow:
                  theme === "dark"
                    ? "2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)"
                    : "2px 2px 8px rgba(0,0,0,0.6), 0 0 15px rgba(0,0,0,0.3)",
              }}
            >
              Premier League
              <span
                className={`block text-2xl md:text-4xl lg:text-5xl mt-2 ${
                  theme === "dark" ? "text-purple-300" : "text-purple-200"
                }`}
                style={{
                  textShadow:
                    theme === "dark"
                      ? "2px 2px 6px rgba(0,0,0,0.8), 0 0 15px rgba(0,0,0,0.5)"
                      : "2px 2px 6px rgba(0,0,0,0.6), 0 0 12px rgba(0,0,0,0.3)",
                }}
              >
                Fantasy Liga
              </span>
            </h1>

            <p
              className={`text-lg md:text-xl leading-relaxed mb-12 max-w-3xl mx-auto drop-shadow-lg ${
                theme === "dark" ? "text-gray-200" : "text-gray-100"
              }`}
              style={{
                textShadow:
                  theme === "dark"
                    ? "1px 1px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)"
                    : "1px 1px 4px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.3)",
              }}
            >
              Dobrodošli u najuzbudljiviju Premier League fantasy ligu!
              Registrujte se, osvojite nevjerovatne nagrade i pokažite svoje
              znanje fudbala.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href="/premier-league/registracija"
                className={`inline-flex items-center px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl ${
                  theme === "dark"
                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/30"
                    : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-300/50"
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
                href="/premier-league/nagrade"
                className={`inline-flex items-center px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 border-2 ${
                  theme === "dark"
                    ? "border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-gray-900"
                    : "border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
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
                  value: "6.400 KM",
                  icon: DollarSign,
                },
                { label: "Broj liga", value: "4", icon: Trophy },
                { label: "Mjesečne nagrade", value: "10x", icon: Calendar },
                { label: "Kup nagrade", value: "3x", icon: Medal },
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
                        theme === "dark" ? "text-purple-400" : "text-purple-600"
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
        </div>

        {/* Enhanced Background decorations */}
        <div className="absolute top-32 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-transparent via-black/20 to-transparent pointer-events-none"></div>
      </section>

      {/* Quick Navigation Section */}
      <section className="py-16 px-4 content-overlay">
        <div className="max-w-6xl mx-auto">
          <h2
            className={`text-3xl md:text-4xl font-bold text-center mb-12 ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            Istraži Premier League Fantasy
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                title: "Registracija",
                description: "Registruj se za sve dostupne lige",
                href: "/premier-league/registracija",
                icon: PenTool,
                color: "purple",
              },
              {
                title: "Nagrade",
                description: "Pogledaj sve dostupne nagrade",
                href: "/premier-league/nagrade",
                icon: TrophyAlt,
                color: "yellow",
              },
              {
                title: "Galerija",
                description: "Slike i memorije prethodnih sezona",
                href: "/premier-league/galerija",
                icon: Camera,
                color: "blue",
              },
              {
                title: "Tabele",
                description: "Trenutni rezultati i tabele",
                href: "/premier-league/tabele",
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
                    : "bg-white/60 border-orange-200 hover:bg-white/80"
                }`}
              >
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                  <item.icon
                    className={`w-12 h-12 ${
                      item.color === "purple"
                        ? "text-purple-500"
                        : item.color === "yellow"
                        ? "text-yellow-500"
                        : item.color === "blue"
                        ? "text-blue-500"
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
                    item.color === "purple"
                      ? "text-purple-500"
                      : item.color === "yellow"
                      ? "text-yellow-500"
                      : item.color === "blue"
                      ? "text-blue-500"
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
