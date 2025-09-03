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
import {
  FaBrain,
  FaStar,
  FaChartBar,
  FaMoneyBillWave,
  FaGem,
  FaNewspaper,
  FaCrown,
  FaBolt,
  FaBullseye,
  FaTrophy,
  FaRocket,
} from "react-icons/fa";
import BillingPlansSection from "@/components/billing/BillingPlansSection";
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
            title="Loading..."
            description="Loading homepage data..."
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
            <p className="text-red-500 mb-4">Error loading page</p>
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
            className={`w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 mx-auto mb-8 flex items-center justify-center drop-shadow-xl`}
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
                                ? "drop-shadow(0 0 8px rgba(59,130,246,0.6)) brightness(1.2) contrast(1.2)"
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
                      className={`w-full flex items-center justify-center text-sm font-semibold ${colors.text} group-hover:translate-x-1 group-hover:text-white transition-all duration-300 mt-auto py-3 px-4 rounded-lg border ${colors.border}`}
                      style={{
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(e) => {
                        const leagueId = league.id;
                        if (leagueId === "premier-league") {
                          e.currentTarget.style.backgroundColor =
                            "rgba(147, 51, 234, 0.8)"; // purple
                        } else if (leagueId === "champions-league") {
                          e.currentTarget.style.backgroundColor =
                            "rgba(59, 130, 246, 0.8)"; // blue
                        } else if (leagueId === "f1-fantasy") {
                          e.currentTarget.style.backgroundColor =
                            "rgba(239, 68, 68, 0.8)"; // red
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {t("hero:openLeague")}
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
          <div className="mt-12 md:mt-20 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 transition-all duration-300">
              {typedStats.map((stat, index) => {
                // Assign different colors to each stat card
                const colors = ["purple", "blue", "red", "orange"];
                const colorTheme = colors[index % colors.length];

                return (
                  <div key={`stat-${index}`} className="h-full">
                    <StatsGrid
                      stats={[stat]}
                      theme={colorTheme}
                      className="w-full h-full"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase Section */}
      <section className="py-20 px-4 bg-theme-background relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2
              className={`text-4xl md:text-5xl lg:text-6xl font-black mb-6 ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}
            >
              {t("hero:features.title")}
            </h2>
            <p
              className={`text-xl md:text-2xl leading-relaxed max-w-4xl mx-auto ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {t("hero:features.subtitle")}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {/* AI Fantasy Guru */}
            <div
              className={`group relative p-8 rounded-2xl backdrop-blur-lg border-2 transition-all duration-500 hover:scale-105 cursor-pointer ${
                theme === "dark"
                  ? "bg-gradient-to-br from-purple-900/20 via-gray-800/50 to-purple-800/20 border-purple-500/50 hover:border-purple-400"
                  : "bg-gradient-to-br from-purple-100/70 via-white/80 to-purple-200/70 border-purple-300 hover:border-purple-400"
              } shadow-2xl hover:shadow-purple-500/25`}
            >
              <Link href="/premier-league/ai-team-analysis">
                <div className="text-center">
                  <div className="mb-6 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <FaBrain className="text-2xl text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                        <FaStar className="text-xs text-yellow-900" />
                      </div>
                    </div>
                  </div>
                  <h3
                    className={`text-2xl font-bold mb-4 ${
                      theme === "dark" ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {t("hero:features.aiGuru.title")}
                  </h3>
                  <p
                    className={`text-base leading-relaxed mb-6 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {t("hero:features.aiGuru.description")}
                  </p>
                  <div className="inline-flex items-center gap-2 text-purple-500 font-semibold group-hover:gap-3 transition-all duration-300">
                    {t("hero:features.tryNow")} →
                  </div>
                </div>
              </Link>
            </div>

            {/* FPL Live */}
            <div
              className={`group relative p-8 rounded-2xl backdrop-blur-lg border-2 transition-all duration-500 hover:scale-105 cursor-pointer ${
                theme === "dark"
                  ? "bg-gradient-to-br from-red-900/20 via-gray-800/50 to-red-800/20 border-red-500/50 hover:border-red-400"
                  : "bg-gradient-to-br from-red-100/70 via-white/80 to-red-200/70 border-red-300 hover:border-red-400"
              } shadow-2xl hover:shadow-red-500/25`}
            >
              <Link href="/premier-league/fpl-live">
                <div className="text-center">
                  <div className="mb-6 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <MdLiveTv className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                    </div>
                  </div>
                  <h3
                    className={`text-2xl font-bold mb-4 ${
                      theme === "dark" ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {t("hero:features.fplLive.title")}
                  </h3>
                  <p
                    className={`text-base leading-relaxed mb-6 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {t("hero:features.fplLive.description")}
                  </p>
                  <div className="inline-flex items-center gap-2 text-red-500 font-semibold group-hover:gap-3 transition-all duration-300">
                    {t("hero:features.watchLive")} →
                  </div>
                </div>
              </Link>
            </div>

            {/* Analytics */}
            <div
              className={`group relative p-8 rounded-2xl backdrop-blur-lg border-2 transition-all duration-500 hover:scale-105 cursor-pointer ${
                theme === "dark"
                  ? "bg-gradient-to-br from-blue-900/20 via-gray-800/50 to-blue-800/20 border-blue-500/50 hover:border-blue-400"
                  : "bg-gradient-to-br from-blue-100/70 via-white/80 to-blue-200/70 border-blue-300 hover:border-blue-400"
              } shadow-2xl hover:shadow-blue-500/25`}
            >
              <Link href="/premier-league/tabele">
                <div className="text-center">
                  <div className="mb-6 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FaChartBar className="text-2xl text-white" />
                    </div>
                  </div>
                  <h3
                    className={`text-2xl font-bold mb-4 ${
                      theme === "dark" ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {t("hero:features.analytics.title")}
                  </h3>
                  <p
                    className={`text-base leading-relaxed mb-6 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {t("hero:features.analytics.description")}
                  </p>
                  <div className="inline-flex items-center gap-2 text-blue-500 font-semibold group-hover:gap-3 transition-all duration-300">
                    {t("hero:features.viewStats")} →
                  </div>
                </div>
              </Link>
            </div>

            {/* Player Prices */}
            <div
              className={`group relative p-8 rounded-2xl backdrop-blur-lg border-2 transition-all duration-500 hover:scale-105 cursor-pointer ${
                theme === "dark"
                  ? "bg-gradient-to-br from-green-900/20 via-gray-800/50 to-green-800/20 border-green-500/50 hover:border-green-400"
                  : "bg-gradient-to-br from-green-100/70 via-white/80 to-green-200/70 border-green-300 hover:border-green-400"
              } shadow-2xl hover:shadow-green-500/25`}
            >
              <Link href="/premier-league/cijene">
                <div className="text-center">
                  <div className="mb-6 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FaMoneyBillWave className="text-2xl text-white" />
                    </div>
                  </div>
                  <h3
                    className={`text-2xl font-bold mb-4 ${
                      theme === "dark" ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {t("hero:features.prices.title")}
                  </h3>
                  <p
                    className={`text-base leading-relaxed mb-6 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {t("hero:features.prices.description")}
                  </p>
                  <div className="inline-flex items-center gap-2 text-green-500 font-semibold group-hover:gap-3 transition-all duration-300">
                    {t("hero:features.checkPrices")} →
                  </div>
                </div>
              </Link>
            </div>

            {/* Best Differentials */}
            <div
              className={`group relative p-8 rounded-2xl backdrop-blur-lg border-2 transition-all duration-500 hover:scale-105 cursor-pointer ${
                theme === "dark"
                  ? "bg-gradient-to-br from-yellow-900/20 via-gray-800/50 to-yellow-800/20 border-yellow-500/50 hover:border-yellow-400"
                  : "bg-gradient-to-br from-yellow-100/70 via-white/80 to-yellow-200/70 border-yellow-300 hover:border-yellow-400"
              } shadow-2xl hover:shadow-yellow-500/25`}
            >
              <Link href="/premier-league/best-differentials">
                <div className="text-center">
                  <div className="mb-6 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FaGem className="text-2xl text-white" />
                    </div>
                  </div>
                  <h3
                    className={`text-2xl font-bold mb-4 ${
                      theme === "dark" ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {t("hero:features.differentials.title")}
                  </h3>
                  <p
                    className={`text-base leading-relaxed mb-6 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {t("hero:features.differentials.description")}
                  </p>
                  <div className="inline-flex items-center gap-2 text-yellow-500 font-semibold group-hover:gap-3 transition-all duration-300">
                    {t("hero:features.findGems")} →
                  </div>
                </div>
              </Link>
            </div>

            {/* Team News */}
            <div
              className={`group relative p-8 rounded-2xl backdrop-blur-lg border-2 transition-all duration-500 hover:scale-105 cursor-pointer ${
                theme === "dark"
                  ? "bg-gradient-to-br from-orange-900/20 via-gray-800/50 to-orange-800/20 border-orange-500/50 hover:border-orange-400"
                  : "bg-gradient-to-br from-orange-100/70 via-white/80 to-orange-200/70 border-orange-300 hover:border-orange-400"
              } shadow-2xl hover:shadow-orange-500/25`}
            >
              <Link href="/premier-league/team-news">
                <div className="text-center">
                  <div className="mb-6 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FaNewspaper className="text-2xl text-white" />
                    </div>
                  </div>
                  <h3
                    className={`text-2xl font-bold mb-4 ${
                      theme === "dark" ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {t("hero:features.teamNews.title")}
                  </h3>
                  <p
                    className={`text-base leading-relaxed mb-6 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {t("hero:features.teamNews.description")}
                  </p>
                  <div className="inline-flex items-center gap-2 text-orange-500 font-semibold group-hover:gap-3 transition-all duration-300">
                    {t("hero:features.readNews")} →
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* AI Guru CTA Section */}
          <div
            className={`relative max-w-4xl mx-auto p-8 md:p-12 rounded-3xl backdrop-blur-lg border-2 transition-all duration-500 hover:scale-105 ${
              theme === "dark"
                ? "bg-gradient-to-br from-purple-900/30 via-gray-800/50 to-purple-800/30 border-purple-500/50"
                : "bg-gradient-to-br from-purple-100/70 via-white/80 to-purple-200/70 border-purple-300"
            } shadow-2xl mb-20`}
          >
            {/* Animated background */}
            <div
              className={`absolute inset-0 rounded-3xl ${
                theme === "dark"
                  ? "bg-gradient-to-r from-purple-500/10 via-transparent to-purple-500/10"
                  : "bg-gradient-to-r from-purple-400/10 via-transparent to-purple-400/10"
              } animate-pulse`}
            />

            {/* Premium badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-sm font-bold shadow-lg">
                <FaCrown className="text-lg" />
                {t("hero:aiGuru.premium")}
              </div>
            </div>

            <div className="relative z-10 text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <FaBrain className="text-3xl text-white" />
                </div>
              </div>

              <h2
                className={`text-3xl md:text-4xl font-black mb-6 ${
                  theme === "dark" ? "text-white" : "text-gray-800"
                }`}
              >
                {t("hero:aiGuru.cta.title")}
              </h2>

              <p
                className={`text-lg md:text-xl leading-relaxed mb-8 max-w-2xl mx-auto ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {t("hero:aiGuru.cta.description")}
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {[
                  {
                    icon: <FaBolt />,
                    text: t("hero:aiGuru.features.realTime"),
                  },
                  {
                    icon: <FaBullseye />,
                    text: t("hero:aiGuru.features.personalized"),
                  },
                  {
                    icon: <FaChartBar />,
                    text: t("hero:aiGuru.features.datadriven"),
                  },
                  {
                    icon: <FaTrophy />,
                    text: t("hero:aiGuru.features.winMore"),
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                      theme === "dark"
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                        : "bg-purple-100/50 border-purple-300/50 text-purple-700"
                    }`}
                  >
                    <span className="text-sm">{feature.icon}</span>
                    <span className="text-sm font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/premier-league/ai-team-analysis">
                  <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25">
                    <FaRocket className="text-xl" />
                    {t("hero:aiGuru.cta.tryFree")}
                  </div>
                </Link>
                <Link href="/billing-plans">
                  <div
                    className={`inline-flex items-center gap-3 px-8 py-4 border-2 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                      theme === "dark"
                        ? "border-purple-500 text-purple-400 hover:bg-purple-500/10"
                        : "border-purple-600 text-purple-600 hover:bg-purple-100/50"
                    }`}
                  >
                    <FaGem className="text-xl" />
                    {t("hero:aiGuru.cta.upgrade")}
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Billing Plans Section */}
      <BillingPlansSection />

      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
    </main>
  );
}
