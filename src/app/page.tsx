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
import LoadingCard from "@/components/shared/LoadingCard";
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
  "premier-league": SiPremierleague,
  "champions-league": PiSoccerBall,
  "f1-fantasy": GiF1Car,
};

export default function Home() {
  const { theme } = useTheme();
  const { t, ready } = useTranslation();
  const { data, loading, error } = useHomepageData();

  if (loading || !ready) {
    return (
      <main className="w-full min-h-screen overflow-x-hidden bg-theme-background">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingCard
            title={t("common.loading")}
            description={t("common.loadingHomepage")}
            className="w-full max-w-md mx-auto"
          />
        </div>
      </main>
    );
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

  const getLeagueColors = (leagueId: string, isDark: boolean) => {
    switch (leagueId) {
      case "premier-league":
        return {
          bg: isDark ? "bg-purple-500/20" : "bg-purple-500/10",
          border: "border-purple-500/50",
          text: "text-purple-400",
          hover: isDark ? "hover:bg-purple-500/30" : "hover:bg-purple-500/20",
          icon: "text-purple-400",
          cardBg: isDark ? "bg-gray-800/80" : "bg-white/80",
          glow: "shadow-purple-500/20",
        };
      case "champions-league":
        return {
          bg: isDark ? "bg-blue-500/20" : "bg-blue-500/10",
          border: "border-blue-500/50",
          text: "text-blue-400",
          hover: isDark ? "hover:bg-blue-500/30" : "hover:bg-blue-500/20",
          icon: "text-blue-400",
          cardBg: isDark ? "bg-gray-800/80" : "bg-white/80",
          glow: "shadow-blue-500/20",
        };
      case "f1-fantasy":
        return {
          bg: isDark ? "bg-red-500/20" : "bg-red-500/10",
          border: "border-red-500/50",
          text: "text-red-400",
          hover: isDark ? "hover:bg-red-500/30" : "hover:bg-red-500/20",
          icon: "text-red-400",
          cardBg: isDark ? "bg-gray-800/80" : "bg-white/80",
          glow: "shadow-red-500/20",
        };
      default:
        return {
          bg: isDark ? "bg-gray-500/20" : "bg-gray-500/10",
          border: "border-gray-500/50",
          text: "text-gray-400",
          hover: isDark ? "hover:bg-gray-500/30" : "hover:bg-gray-500/20",
          icon: "text-gray-400",
          cardBg: isDark ? "bg-gray-800/80" : "bg-white/80",
          glow: "shadow-gray-500/20",
        };
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
              const isDark = theme === "dark";
              const colors = getLeagueColors(league.id, isDark);

              return (
                <div
                  key={league.id}
                  className={`group relative p-6 md:p-8 rounded-2xl md:rounded-3xl backdrop-blur-lg border-2 transition-all duration-500 hover:scale-105 cursor-pointer ${colors.border} ${colors.hover} ${colors.glow} hover:shadow-2xl flex flex-col h-full`}
                  style={{
                    background: isDark
                      ? league.id === "premier-league"
                        ? "linear-gradient(135deg, rgba(31,41,55,0.95) 0%, rgba(147,51,234,0.1) 100%)"
                        : league.id === "champions-league"
                        ? "linear-gradient(135deg, rgba(31,41,55,0.95) 0%, rgba(59,130,246,0.15) 100%)"
                        : "linear-gradient(135deg, rgba(31,41,55,0.95) 0%, rgba(239,68,68,0.1) 100%)"
                      : league.id === "premier-league"
                      ? "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(147,51,234,0.05) 100%)"
                      : league.id === "champions-league"
                      ? "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(59,130,246,0.08) 100%)"
                      : "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(239,68,68,0.05) 100%)",
                    borderColor:
                      league.id === "premier-league"
                        ? "rgba(147,51,234,0.5)"
                        : league.id === "champions-league"
                        ? "rgba(59,130,246,0.5)"
                        : "rgba(239,68,68,0.5)",
                    boxShadow:
                      league.id === "premier-league"
                        ? "0 0 20px rgba(147,51,234,0.3)"
                        : league.id === "champions-league"
                        ? "0 0 25px rgba(59,130,246,0.4), 0 0 50px rgba(59,130,246,0.2)"
                        : "0 0 20px rgba(239,68,68,0.3)",
                  }}
                >
                  <Link
                    href={league.href}
                    className="block flex flex-col h-full"
                  >
                    <div className="mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                      {league.id === "champions-league" ? (
                        <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center relative">
                          <div
                            className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"
                            style={{
                              background: isDark
                                ? "radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(59,130,246,0.1) 50%, transparent 100%)"
                                : "radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(59,130,246,0.2) 50%, transparent 100%)",
                            }}
                          />
                          <Image
                            src="/images/logos/cl-logo.png"
                            alt="Champions League"
                            width={64}
                            height={64}
                            className="w-full h-full object-contain relative z-10 drop-shadow-lg"
                            style={{
                              filter: isDark
                                ? "drop-shadow(0 0 8px rgba(59,130,246,0.6)) brightness(1.2)"
                                : "drop-shadow(0 0 12px rgba(59,130,246,0.8)) brightness(1.1) contrast(1.2)",
                            }}
                          />
                        </div>
                      ) : league.id === "f1-fantasy" ? (
                        <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
                          <Image
                            src="/images/logos/f1.png"
                            alt="F1 Fantasy"
                            width={64}
                            height={64}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <SiPremierleague
                          className={`w-12 h-12 md:w-16 md:h-16 ${colors.icon}`}
                        />
                      )}
                    </div>
                    <h3
                      className={`text-2xl font-bold mb-4 ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {t(`leagues.${league.id}.name`)}
                    </h3>
                    <p
                      className={`text-base leading-relaxed mb-6 flex-grow ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {t(`leagues.${league.id}.description`)}
                    </p>
                    <div
                      className={`w-full flex items-center justify-center text-sm font-semibold ${colors.text} group-hover:translate-x-1 transition-transform duration-300 mt-auto py-3 px-4 rounded-lg border ${colors.border} hover:bg-opacity-20 hover:bg-current`}
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
