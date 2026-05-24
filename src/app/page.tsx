"use client";

import { useTheme } from "@/contexts/ThemeContext";
import Link from "next/link";
import { useHomepageData } from "@/hooks/useLeagueData";
import { IconType } from "react-icons";
import { SiPremierleague } from "react-icons/si";
import Image from "next/image";
import LoadingCard from "@/components/shared/LoadingCard";
import { useTranslation } from "react-i18next";
import {
  FaBrain,
  FaBolt,
  FaBullseye,
  FaChartBar,
  FaTrophy,
  FaRocket,
  FaShieldAlt,
  FaCog,
  FaStar,
  FaGlobeAmericas,
} from "react-icons/fa";
import { MdLiveTv } from "react-icons/md";
import { ArrowRight, Trophy, Target } from "lucide-react";
import HowItWorks from "@/components/shared/HowItWorks";

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
  "champions-league": SiPremierleague,
  "f1-fantasy": SiPremierleague,
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

  const typedLeagues: LeagueCard[] = leagues.map((league: any) => ({
    ...league,
    icon: iconMap[league.id] || SiPremierleague,
  }));

  const typedStats: StatCard[] = globalStats;

  const getLeagueAccent = (leagueId: string) => {
    switch (leagueId) {
      case "premier-league":
        return {
          border: "border-l-purple-600",
          text: "text-purple-600 dark:text-purple-400",
          hover: "hover:border-l-purple-500",
        };
      case "champions-league":
        return {
          border: "border-l-blue-600",
          text: "text-blue-600 dark:text-blue-400",
          hover: "hover:border-l-blue-500",
        };
      case "f1-fantasy":
        return {
          border: "border-l-red-600",
          text: "text-red-600 dark:text-red-400",
          hover: "hover:border-l-red-500",
        };
      default:
        return {
          border: "border-l-gray-600",
          text: "text-gray-600 dark:text-gray-400",
          hover: "hover:border-l-gray-500",
        };
    }
  };

  const whyChooseItems = [
    {
      icon: FaShieldAlt,
      color: "text-green-500",
      titleKey: "hero:whyChoose.payment.title",
      descKey: "hero:whyChoose.payment.description",
    },
    {
      icon: FaCog,
      color: "text-blue-500",
      titleKey: "hero:whyChoose.autoManagement.title",
      descKey: "hero:whyChoose.autoManagement.description",
    },
    {
      icon: FaTrophy,
      color: "text-yellow-500",
      titleKey: "hero:whyChoose.prizes.title",
      descKey: "hero:whyChoose.prizes.description",
    },
    {
      icon: FaBrain,
      color: "text-purple-500",
      titleKey: "hero:whyChoose.aiAnalysis.title",
      descKey: "hero:whyChoose.aiAnalysis.description",
    },
    {
      icon: MdLiveTv,
      color: "text-red-500",
      titleKey: "hero:whyChoose.liveTracking.title",
      descKey: "hero:whyChoose.liveTracking.description",
    },
    {
      icon: FaGlobeAmericas,
      color: "text-cyan-500",
      titleKey: "hero:whyChoose.multiLeague.title",
      descKey: "hero:whyChoose.multiLeague.description",
    },
  ];

  return (
    <main className="w-full min-h-screen overflow-x-hidden bg-theme-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pb-16 px-4 pt-5 md:pt-8">
        <div className="max-w-6xl mx-auto text-center">
          {/* Logo */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 mx-auto mb-8 flex items-center justify-center drop-shadow-xl">
            <Image
              src="/images/rf-logo.svg"
              alt="REMIS Fantasy Logo"
              width={1000}
              height={1000}
              className="object-cover"
            />
          </div>

          <h1
            className={`text-3xl md:text-4xl font-black mb-6 md:mb-8 leading-none ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            {t("hero.title")}
            <span
              className={`block text-lg md:text-xl mt-2 md:mt-4 font-normal ${
                theme === "dark" ? "text-orange-400" : "text-orange-600"
              }`}
            >
              {t("hero.season")}
            </span>
          </h1>

          <p
            className={`text-sm md:text-base leading-relaxed mb-8 md:mb-12 max-w-4xl mx-auto ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {t("hero.subtitle")}
          </p>

          {/* League Selection Cards — with official logos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {typedLeagues.map((league: LeagueCard) => {
              const accent = getLeagueAccent(league.id);
              const logoSrc =
                league.id === "premier-league"
                  ? "/images/logos/pl-logo.png"
                  : league.id === "champions-league"
                  ? "/images/logos/cl-logo.png"
                  : "/images/logos/f1.png";

              const logoFilter =
                league.id === "premier-league"
                  ? "brightness(0) invert(22%) sepia(97%) saturate(4729%) hue-rotate(264deg) brightness(87%) contrast(96%)"
                  : league.id === "champions-league"
                  ? "brightness(0) invert(29%) sepia(92%) saturate(2475%) hue-rotate(213deg) brightness(97%) contrast(92%)"
                  : undefined;

              return (
                <Link
                  key={league.id}
                  href={league.href + "/tables"}
                  className="block h-full"
                >
                  <div
                    className={`group relative flex flex-col h-full p-5 md:p-6 rounded-lg border-l-4 ${accent.border} ${accent.hover} transition-all duration-300 hover:-translate-y-1 ${
                      theme === "dark"
                        ? "bg-gray-800/60 border border-gray-700 hover:bg-gray-800/80"
                        : "bg-white/80 border border-gray-200 hover:bg-white hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Image
                        src={logoSrc}
                        alt={league.id}
                        width={36}
                        height={36}
                        className="w-9 h-9 object-contain"
                        style={logoFilter ? { filter: logoFilter } : undefined}
                      />
                      <h3
                        className={`text-lg font-bold ${
                          theme === "dark" ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {t(`leagues.${league.id}.name`)}
                      </h3>
                    </div>
                    <p
                      className={`text-sm leading-relaxed mb-4 flex-grow ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {t(`leagues.${league.id}.description`)}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 text-sm font-semibold ${accent.text} group-hover:gap-2 transition-all duration-300 mt-auto`}
                    >
                      {t("hero:hero.explore", "Explore")}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

      {/* Predictor & Tournament Promo */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Predictor Card */}
            <Link href="/predictor" className="block group">
              <div
                className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 h-full transition-all duration-300 hover:-translate-y-1 ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-gray-800/80 via-gray-900/60 to-gray-950/80 border-gray-700/60 hover:border-amber-500/40 shadow-lg hover:shadow-amber-500/10"
                    : "bg-gradient-to-br from-white via-gray-50 to-amber-50/30 border-gray-200 hover:border-amber-400/60 shadow-sm hover:shadow-lg"
                }`}
              >
                <span
                  aria-hidden
                  className={`pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl ${
                    theme === "dark" ? "bg-amber-500/8" : "bg-amber-400/15"
                  }`}
                />
                <div className="relative z-10">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                      theme === "dark"
                        ? "bg-amber-500/10 border border-amber-500/20"
                        : "bg-amber-100 border border-amber-200"
                    }`}
                  >
                    <Target
                      className={`w-6 h-6 ${
                        theme === "dark" ? "text-amber-300" : "text-amber-600"
                      }`}
                    />
                  </div>
                  <h3
                    className={`text-lg md:text-xl font-black mb-2 ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {t("hero:promo.predictor.title", "Predictions")}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed mb-4 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {t(
                      "hero:promo.predictor.desc",
                      "Tournament winner, top scorer, group standings — predict it all. Compete on the leaderboard and win real prizes.",
                    )}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 text-sm font-bold group-hover:gap-2.5 transition-all duration-300 ${
                      theme === "dark" ? "text-amber-300" : "text-amber-600"
                    }`}
                  >
                    {t("hero:promo.predictor.cta", "Browse tournaments")}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>

            {/* Create Tournament Card */}
            <Link href="/create-tournament" className="block group">
              <div
                className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 h-full transition-all duration-300 hover:-translate-y-1 ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-gray-800/80 via-gray-900/60 to-gray-950/80 border-gray-700/60 hover:border-white/30 shadow-lg hover:shadow-white/5"
                    : "bg-gradient-to-br from-white via-gray-50 to-gray-100/50 border-gray-200 hover:border-gray-400 shadow-sm hover:shadow-lg"
                }`}
              >
                <span
                  aria-hidden
                  className={`pointer-events-none absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-3xl ${
                    theme === "dark" ? "bg-white/5" : "bg-gray-400/10"
                  }`}
                />
                <div className="relative z-10">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                      theme === "dark"
                        ? "bg-white/5 border border-white/10"
                        : "bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <Trophy
                      className={`w-6 h-6 ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3
                      className={`text-lg md:text-xl font-black ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {t("hero:promo.create.title", "Create Tournament")}
                    </h3>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        theme === "dark"
                          ? "bg-white/10 text-gray-300"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      €2
                    </span>
                  </div>
                  <p
                    className={`text-sm leading-relaxed mb-4 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {t(
                      "hero:promo.create.desc",
                      "Build your own prediction tournament — World Cup, Champions League, or custom. Invite friends, set the rules, and compete.",
                    )}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 text-sm font-bold group-hover:gap-2.5 transition-all duration-300 ${
                      theme === "dark" ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {t("hero:promo.create.cta", "Start building")}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose REMIS Fantasy Section */}
      <section className="py-16 md:py-20 px-4 bg-theme-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className={`text-xl md:text-2xl font-black mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}
            >
              {t("hero:whyChoose.title")}
            </h2>
            <p
              className={`text-sm md:text-base max-w-2xl mx-auto ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {t("hero:whyChoose.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyChooseItems.map((item, index) => {
              const IconComp = item.icon;
              return (
                <div
                  key={index}
                  className={`p-5 rounded-md border transition-all duration-300 ${
                    theme === "dark"
                      ? "bg-gray-800/40 hover:bg-gray-800/60 border-gray-700/50"
                      : "bg-gray-50 hover:bg-gray-100 border-gray-200"
                  }`}
                >
                  <IconComp className={`w-6 h-6 ${item.color} mb-3`} />
                  <h3
                    className={`text-base font-bold mb-1 ${
                      theme === "dark" ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {t(item.titleKey)}
                  </h3>
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {t(item.descKey)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* AI Guru CTA Section */}
      <section className="py-16 md:py-20 px-4">
        <div
          className={`relative max-w-4xl mx-auto p-8 md:p-12 rounded-lg border-2 transition-all duration-500 ${
            theme === "dark"
              ? "bg-gray-800/50 border-purple-500/50"
              : "bg-white/80 border-purple-300"
          } shadow-md`}
        >
          <div
            className={`absolute inset-0 rounded-lg ${
              theme === "dark" ? "bg-purple-500/5" : "bg-purple-400/5"
            } animate-pulse`}
          />

          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-sm font-bold shadow-lg">
              <FaStar className="text-lg" />
              {t("hero:aiGuru.premium")}
            </div>
          </div>

          <div className="relative z-10 text-center pt-4">
            <div className="mb-6 flex justify-center">
              <FaBrain className="text-4xl text-purple-500" />
            </div>

            <h2
              className={`text-xl md:text-2xl font-black mb-6 ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}
            >
              {t("hero:aiGuru.cta.title")}
            </h2>

            <p
              className={`text-sm md:text-base leading-relaxed mb-8 max-w-2xl mx-auto ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {t("hero:aiGuru.cta.description")}
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {[
                { icon: <FaBolt />, text: t("hero:aiGuru.features.realTime") },
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
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

            <Link href="/premier-league/ai-team-analysis">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-bold text-base transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-purple-500/25">
                <FaRocket className="text-lg" />
                {t("hero:aiGuru.cta.tryFree")}
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-20 px-4">
        <div
          className={`max-w-5xl mx-auto text-center p-8 md:p-12 rounded-lg ${
            theme === "dark"
              ? "bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700"
              : "bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200"
          }`}
        >
          <h2
            className={`text-xl md:text-2xl font-black mb-6 ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            {t("hero:cta.title")}
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/premier-league/registration">
              <div
                className={`inline-flex items-center gap-3 px-8 py-4 rounded-md font-bold text-base transition-all duration-300 transform hover:scale-105 ${
                  theme === "dark"
                    ? "bg-white text-gray-900 hover:bg-gray-100"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                {t("hero:cta.register")}
                <ArrowRight className="w-5 h-5" />
              </div>
            </Link>
            <a href="#top">
              <div
                className={`inline-flex items-center gap-3 px-8 py-4 border-2 rounded-md font-bold text-base transition-all duration-300 transform hover:scale-105 ${
                  theme === "dark"
                    ? "border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white"
                    : "border-gray-300 text-gray-700 hover:border-gray-500 hover:text-gray-900"
                }`}
              >
                {t("hero:cta.explore")}
              </div>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
