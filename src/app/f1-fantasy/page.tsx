"use client";

import { useTheme } from "@/contexts/ThemeContext";
import Link from "next/link";
import { DollarSign, Trophy, Calendar, Medal, PenTool, Trophy as TrophyAlt, Camera, BarChart3 } from "lucide-react";
import Image from "next/image";

export default function F1FantasyPage() {
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "league-background f1-fantasy-bg"
          : "bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50"
      }`}
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden subnav-page-spacing pb-20 px-4 content-overlay">
        <div className="max-w-7xl mx-auto text-center">
          {/* F1 Logo */}
          <div className="w-32 h-32 mx-auto mb-8 relative">
            <div className={`absolute inset-0 rounded-full blur-lg ${
              theme === "dark" 
                ? "bg-red-500/30" 
                : "bg-red-300/30"
            }`}></div>
            <Image
              src="/images/logos/f1.png"
              alt="F1 Logo"
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
            F1 Fantasy
            <span
              className={`block text-2xl md:text-4xl lg:text-5xl mt-2 ${
                theme === "dark" ? "text-red-400" : "text-red-600"
              }`}
            >
              Racing Liga
            </span>
          </h1>

          <p
            className={`text-lg md:text-xl leading-relaxed mb-12 max-w-3xl mx-auto ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Dobrodošli u najuzbudljiviju F1 Fantasy ligu! Registrujte se, 
            kreirajte svoj tim i osvojite fantastične nagrade kroz sezonu 
            Formule 1.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="/f1-fantasy/registracija"
              className={`inline-flex items-center px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl ${
                theme === "dark"
                  ? "bg-red-600 hover:bg-red-700 text-white shadow-red-500/30"
                  : "bg-red-600 hover:bg-red-700 text-white shadow-red-300/50"
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
              href="/f1-fantasy/nagrade"
              className={`inline-flex items-center px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 border-2 ${
                theme === "dark"
                  ? "border-red-400 text-red-400 hover:bg-red-400 hover:text-gray-900"
                  : "border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
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
              { label: "Ukupan nagradni fond", value: "4.800 KM", icon: DollarSign },
              { label: "Broj liga", value: "3", icon: Trophy },
              { label: "Mjesečne nagrade", value: "8x", icon: Calendar },
              { label: "Sezonske nagrade", value: "5x", icon: Medal },
            ].map((stat, index) => (
              <div
                key={index}
                className={`p-4 md:p-6 rounded-2xl backdrop-blur-lg border transition-all duration-300 hover:scale-105 ${
                  theme === "dark"
                    ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800/70"
                    : "bg-white/60 border-red-200 hover:bg-white/80"
                }`}
              >
                <div className="mb-2 flex justify-center">
                  <stat.icon className={`w-8 h-8 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
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

        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </section>

      {/* Quick Navigation Section */}
      <section className="py-16 px-4 content-overlay">
        <div className="max-w-6xl mx-auto">
          <h2
            className={`text-3xl md:text-4xl font-bold text-center mb-12 ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            Istraži F1 Fantasy
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                title: "Registracija",
                description: "Registruj se za F1 Fantasy ligu",
                href: "/f1-fantasy/registracija",
                icon: PenTool,
                color: "red",
              },
              {
                title: "Nagrade",
                description: "Pogledaj sve dostupne nagrade",
                href: "/f1-fantasy/nagrade",
                icon: TrophyAlt,
                color: "yellow",
              },
              {
                title: "Galerija",
                description: "Slike i memorije prethodnih sezona",
                href: "/f1-fantasy/galerija",
                icon: Camera,
                color: "blue",
              },
              {
                title: "Tabele",
                description: "Trenutni rezultati i tabele",
                href: "/f1-fantasy/tabele",
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
                    : "bg-white/60 border-red-200 hover:bg-white/80"
                }`}
              >
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                  <item.icon className={`w-12 h-12 ${
                    item.color === "red" ? "text-red-500" :
                    item.color === "yellow" ? "text-yellow-500" :
                    item.color === "blue" ? "text-blue-500" : "text-green-500"
                  }`} />
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
                    item.color === "red"
                      ? "text-red-500"
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