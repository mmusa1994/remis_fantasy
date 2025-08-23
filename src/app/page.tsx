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
import { SkeletonPage } from "@/components/skeletons";
import { useTranslation } from "react-i18next";
import { MdLiveTv } from "react-icons/md";
import { RiLiveLine } from "react-icons/ri";
import { IoPlayCircle } from "react-icons/io5";
// TypeScript types for league and stat data
interface LeagueCard {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  registrationOpen: boolean;
  icon: IconType;
}

interface StatCard {
  label: string;
  value: string;
  color: string;
  icon: IconType;
}

// Icon mapping for league cards
const iconMap: Record<string, IconType> = {
  premier: SiPremierleague,
  champions: PiSoccerBall,
  f1: GiF1Car,
};

export default function Home() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { data, loading, error } = useHomepageData();

  if (loading) {
    return <SkeletonPage variant="homepage" />;
  }

  if (error) {
    return (
      <main className="w-full min-h-screen overflow-x-hidden bg-theme-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-500 mb-4">{t("common.error")}</p>
            <p className="text-theme-text-secondary">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  const { leagues, globalStats } = data;

  // Type the data from the hook
  const typedLeagues: LeagueCard[] = leagues.map((league: any) => ({
    ...league,
    icon: iconMap[league.id] || SiPremierleague,
  }));

  const typedStats: StatCard[] = globalStats;

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
    <main className="w-full min-h-screen overflow-x-hidden bg-theme-background">
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
            {t("hero.title")}
            <span
              className={`block text-lg sm:text-xl md:text-2xl lg:text-4xl xl:text-5xl mt-2 md:mt-4 font-normal ${
                theme === "dark" ? "text-orange-400" : "text-orange-600"
              }`}
            >
              {t("hero.season")}
            </span>
          </h1>

          <p
            className={`text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed mb-8 md:mb-12 max-w-4xl mx-auto ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {t("hero.subtitle")}
          </p>

          {/* LIVE FPL Section */}
          <div className="mb-12 md:mb-16">
            <div
              className={`relative max-w-2xl mx-auto p-6 md:p-8 rounded-3xl backdrop-blur-lg border-2 transition-all duration-500 hover:scale-105 group ${
                theme === "dark"
                  ? "bg-gradient-to-br from-red-900/30 via-gray-800/50 to-red-800/30 border-red-600/50 hover:border-red-500"
                  : "bg-gradient-to-br from-blue-100/70 via-white/80 to-blue-200/70 border-blue-300 hover:border-blue-400"
              } shadow-2xl hover:shadow-3xl`}
            >
              {/* Animated background pulse */}
              <div
                className={`absolute inset-0 rounded-3xl ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10"
                    : "bg-gradient-to-r from-blue-400/10 via-transparent to-blue-400/10"
                } animate-pulse`}
              />

              {/* Live indicator */}
              <div className="absolute -top-3 left-6 flex items-center gap-2">
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold animate-pulse">
                  <RiLiveLine className="w-3 h-3" />
                  {t("hero.live")}
                </div>
              </div>

              <div className="relative z-10 text-center">
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                  <div className="relative">
                    <MdLiveTv
                      className={`w-16 h-16 md:w-20 md:h-20 ${
                        theme === "dark" ? "text-red-400" : "text-blue-600"
                      }`}
                    />
                    <div className="absolute -top-1 -right-1">
                      <div className="w-4 h-4 bg-red-500 rounded-full animate-ping" />
                      <div className="absolute top-0 w-4 h-4 bg-red-600 rounded-full" />
                    </div>
                  </div>
                </div>

                <h2
                  className={`text-2xl md:text-3xl font-bold mb-3 ${
                    theme === "dark" ? "text-white" : "text-gray-800"
                  }`}
                >
                  {t("hero.liveFpl")}
                </h2>

                <p
                  className={`text-base md:text-lg leading-relaxed mb-6 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {t("hero.liveFplDescription")}
                </p>

                <Link href="/premier-league/fpl-live">
                  <div
                    className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                      theme === "dark"
                        ? "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/25"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25"
                    }`}
                  >
                    <IoPlayCircle className="w-5 h-5" />
                    {t("hero.watchLive")}
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Dynamic League Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {typedLeagues.map((league: LeagueCard) => {
              const IconComponent = league.icon;

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
                      {t(`leagues.${league.id}.name`)}
                    </h3>
                    <p
                      className={`text-base leading-relaxed mb-6 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {t(`leagues.${league.id}.description`)}
                    </p>
                    <div
                      className={`inline-flex items-center text-sm font-semibold ${getLeagueTextColor(
                        league.id
                      )} group-hover:translate-x-1 transition-transform duration-300`}
                    >
                      {t("hero.openLeague")}
                      <svg
                        className="w-4 h-4 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        role="img"
                        aria-labelledby="hero-icon-title"
                      >
                        <title id="hero-icon-title">Arrow pointing right</title>
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
              stats={typedStats}
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
