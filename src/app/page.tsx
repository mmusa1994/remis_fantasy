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
import { GiftIcon, ArrowRight, UserPlus, Zap } from "lucide-react";

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

  const howItWorksSteps = [
    {
      step: 1,
      icon: UserPlus,
      titleKey: "hero:howItWorks.step1.title",
      descKey: "hero:howItWorks.step1.description",
    },
    {
      step: 2,
      icon: Zap,
      titleKey: "hero:howItWorks.step2.title",
      descKey: "hero:howItWorks.step2.description",
    },
    {
      step: 3,
      icon: FaTrophy,
      titleKey: "hero:howItWorks.step3.title",
      descKey: "hero:howItWorks.step3.description",
    },
  ];

  return (
    <main className="w-full min-h-screen overflow-x-hidden bg-theme-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pb-16 px-4 pt-5 md:pt-20">
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

          {/* Stats Strip — clean inline numbers */}
          <div className={`mt-12 md:mt-16 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 ${
            theme === "dark"
              ? "divide-gray-700"
              : "divide-gray-200"
          }`}>
            {typedStats.map((stat, index) => (
              <div key={`stat-${index}`} className="text-center">
                <p className={`text-2xl md:text-3xl font-black leading-none mb-1 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  {stat.value}
                </p>
                <p className={`text-xs md:text-sm font-medium ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}>
                  {stat.label}
                </p>
              </div>
            ))}
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
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2
            className={`text-xl md:text-2xl font-black text-center mb-16 ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            {t("hero:howItWorks.title")}
          </h2>

          <div className="relative">
            {/* Connecting lines - Desktop */}
            <div className="hidden md:block absolute top-[28px] left-[16.67%] right-[16.67%] h-px">
              <div className={`w-full h-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`} />
              {/* Animated pulse traveling along the line */}
              <div
                className="absolute top-0 h-full w-16 animate-shimmer-border"
                style={{
                  backgroundImage: theme === "dark"
                    ? "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.6) 50%, transparent 100%)"
                    : "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.4) 50%, transparent 100%)",
                  backgroundSize: "200% 100%",
                }}
              />
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
              {howItWorksSteps.map((step, idx) => {
                const StepIcon = step.icon;
                const isLast = idx === howItWorksSteps.length - 1;
                return (
                  <div key={step.step} className="relative text-center">
                    {/* Mobile connecting line */}
                    {!isLast && (
                      <div className={`md:hidden absolute left-1/2 -translate-x-1/2 top-[56px] w-px h-[calc(100%+48px-56px)] ${
                        theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                      }`}>
                        <div
                          className="absolute left-0 w-full animate-pulse"
                          style={{
                            top: "30%",
                            height: "40%",
                            backgroundImage: theme === "dark"
                              ? "linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.5) 50%, transparent 100%)"
                              : "linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.3) 50%, transparent 100%)",
                          }}
                        />
                      </div>
                    )}

                    {/* Step circle */}
                    <div className="relative z-10 mx-auto mb-5">
                      <div className={`w-14 h-14 rounded-md flex items-center justify-center mx-auto text-lg font-bold relative overflow-hidden ${
                        theme === "dark"
                          ? "bg-gray-800 text-white border border-gray-600"
                          : "bg-white text-gray-900 border border-gray-200 shadow-sm"
                      }`}>
                        {/* Subtle glow effect */}
                        <div className={`absolute inset-0 opacity-20 ${
                          idx === 0 ? "bg-gradient-to-br from-purple-500 to-transparent" :
                          idx === 1 ? "bg-gradient-to-br from-blue-500 to-transparent" :
                          "bg-gradient-to-br from-green-500 to-transparent"
                        }`} />
                        <span className="relative z-10">{step.step}</span>
                      </div>
                      {/* Ping ring */}
                      <div className={`absolute inset-0 mx-auto w-14 h-14 rounded-md animate-ping opacity-10 ${
                        idx === 0 ? "bg-purple-500" :
                        idx === 1 ? "bg-blue-500" :
                        "bg-green-500"
                      }`} style={{ animationDuration: "3s" }} />
                    </div>

                    <h3
                      className={`text-base font-bold mb-2 ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {t(step.titleKey)}
                    </h3>
                    <p
                      className={`text-sm max-w-[240px] mx-auto ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {t(step.descKey)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

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

          <div className="absolute -top-4 right-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-green-400 to-green-500 text-white text-sm font-bold shadow-lg">
              <GiftIcon className="w-4 h-4" />
              {t("hero:aiGuru.freeForNow")}
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
