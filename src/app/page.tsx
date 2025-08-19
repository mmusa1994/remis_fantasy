"use client";

import { useTheme } from "@/contexts/ThemeContext";
import Link from "next/link";
import StatsGrid from "@/components/shared/StatsGrid";
import { useHomepageData } from "@/hooks/useLeagueData";
import { SiPremierleague } from "react-icons/si";
import { GiF1Car } from "react-icons/gi";
import { PiSoccerBall } from "react-icons/pi";
import { IconType } from "react-icons";
import Image from "next/image";

// Icon mapping for league cards
const iconMap: Record<string, IconType> = {
  premier: SiPremierleague,
  champions: PiSoccerBall,
  f1: GiF1Car,
};

export default function Home() {
  const { theme } = useTheme();
  const { data, loading, error } = useHomepageData();

  if (loading) {
    return (
      <main
        className={`w-full min-h-screen overflow-x-hidden ${
          theme === "dark"
            ? "bg-black"
            : "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50"
        }`}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-theme-text-secondary">Učitava se...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main
        className={`w-full min-h-screen overflow-x-hidden ${
          theme === "dark"
            ? "bg-black"
            : "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50"
        }`}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-500 mb-4">Greška pri učitavanju podataka</p>
            <p className="text-theme-text-secondary">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  const { leagues, globalStats } = data;

  const getLeagueTextColor = (leagueId: string) => {
    switch (leagueId) {
      case "premier":
        return "text-purple-500";
      case "champions":
        return "text-blue-500";
      case "f1":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <main
      className={`w-full min-h-screen overflow-x-hidden ${
        theme === "dark"
          ? "bg-black"
          : "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50"
      }`}
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden pb-20 px-4 pt-24">
        <div className="max-w-6xl mx-auto text-center">
          {/* Logo */}
          <div
            className={`w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 mx-auto mb-8 flex items-center justify-center bg-[#800020] shadow-2xl border-2 border-white`}
          >
            <Image
              src="/images/rf-logo.svg"
              alt="REMIS Fantasy Logo"
              width={1000}
              height={1000}
              className="object-cover"
            />
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

          {/* Dynamic League Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {leagues.map((league: any) => {
              const IconComponent = iconMap[league.id] || SiPremierleague;

              return (
                <div
                  key={league.id}
                  className={`group relative p-6 md:p-8 rounded-2xl md:rounded-3xl backdrop-blur-lg border transition-all duration-500 hover:scale-105 ${
                    theme === "dark"
                      ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 cursor-pointer"
                      : "bg-white/60 border-orange-200 hover:bg-white/80 cursor-pointer"
                  } hover:shadow-2xl`}
                >
                  <Link href={league.href} className="block">
                    <div className="mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                      <IconComponent className="w-12 h-12 md:w-16 md:h-16 text-white" />
                    </div>
                    <h3
                      className={`text-2xl font-bold mb-4 ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {league.name}
                    </h3>
                    <p
                      className={`text-base leading-relaxed mb-6 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {league.description}
                    </p>
                    <div
                      className={`inline-flex items-center text-sm font-semibold ${getLeagueTextColor(
                        league.id
                      )} group-hover:translate-x-1 transition-transform duration-300`}
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
                </div>
              );
            })}
          </div>

          {/* Dynamic Stats Section */}
          <div className="mt-12 md:mt-20 max-w-4xl mx-auto">
            <StatsGrid
              stats={globalStats}
              className="transition-all duration-300"
            />
          </div>
        </div>

        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </section>
    </main>
  );
}
