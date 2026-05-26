"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import WCMusicPlayer from "@/components/shared/WCMusicPlayer";
import {
  Trophy,
  Calendar,
  BarChart3,
  Users,
  UserPlus,
  TrendingUp,
} from "lucide-react";

/* ──────────────────────────── constants ──────────────────────────── */

const TOURNAMENT_START = new Date("2026-06-11T00:00:00Z").getTime();

const CAROUSEL_SLIDES = [
  { src: "/wc2026/wc-5.webp", titleKey: "carousel.slide1Title", subKey: "carousel.slide1Sub" },
  { src: "/wc2026/bg-full-wc-2026.jpg", titleKey: "carousel.slide2Title", subKey: "carousel.slide2Sub" },
  { src: "/wc2026/wc-bg1.jpg", titleKey: "carousel.slide3Title", subKey: "carousel.slide3Sub" },
  { src: "/wc2026/wc-stadiusm.jpg", titleKey: "carousel.slide4Title", subKey: "carousel.slide4Sub" },
  { src: "/wc2026/wc-6.jpg", titleKey: "carousel.slide5Title", subKey: "carousel.slide5Sub" },
  { src: "/wc2026/wc-bg-3.webp", titleKey: "carousel.slide6Title", subKey: "carousel.slide6Sub" },
];

const NAV_ITEMS = [
  {
    href: "/wc2026/tables",
    icon: BarChart3,
    titleKey: "tables.title",
    descBs: "Fantasy tabela i rangiranje",
    descEn: "Fantasy table & rankings",
    color: "from-blue-600/20 to-red-600/20",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    border: "hover:border-blue-500/30",
  },
  {
    href: "/wc2026/matches",
    icon: Calendar,
    titleKey: "matches.title",
    descBs: "Raspored i rezultati",
    descEn: "Schedule & results",
    color: "from-red-600/20 to-white/10",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-600 dark:text-red-400",
    border: "hover:border-red-500/30",
  },
  {
    href: "/wc2026/groups",
    icon: Users,
    titleKey: "groups.title",
    descBs: "12 grupa, 48 timova",
    descEn: "12 groups, 48 teams",
    color: "from-green-600/20 to-white/10",
    iconBg: "bg-green-500/10",
    iconColor: "text-green-600 dark:text-green-400",
    border: "hover:border-green-500/30",
  },
  {
    href: "/wc2026/registration",
    icon: UserPlus,
    titleKey: "registration.subtitle",
    descBs: "Pridruži se za 5€",
    descEn: "Join for 5€",
    color: "from-teal-600/20 to-emerald-600/20",
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-600 dark:text-teal-400",
    border: "hover:border-teal-500/30",
  },
  {
    href: "/wc2026/statistics",
    icon: TrendingUp,
    titleKey: "statistics.title",
    descBs: "Golovi, asistencije, bodovi",
    descEn: "Goals, assists, points",
    color: "from-amber-600/20 to-red-600/20",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    border: "hover:border-amber-500/30",
  },
  {
    href: "/wc2026/prizes",
    icon: Trophy,
    titleKey: "prizes.title",
    descBs: "Nagradni fond",
    descEn: "Prize pool",
    color: "from-yellow-600/20 to-amber-600/20",
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    border: "hover:border-yellow-500/30",
  },
];

/* ──────────────────────────── countdown hook ─────────────────────── */

function useCountdown(target: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

/* ──────────────────────────── animation variants ─────────────────── */

const staggerChild = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

/* ──────────────────────────── 3D coverflow ──────────────────────── */

function CoverflowCarousel({ isDark }: { isDark: boolean }) {
  const { t } = useTranslation("wc2026");
  const [active, setActive] = useState(0);
  const total = CAROUSEL_SLIDES.length;

  const next = useCallback(() => setActive((p) => (p + 1) % total), [total]);
  const prev = useCallback(() => setActive((p) => (p - 1 + total) % total), [total]);

  useEffect(() => {
    const id = setInterval(next, 4500);
    return () => clearInterval(id);
  }, [next]);

  return (
    <section className="py-16 sm:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Carousel */}
        <div
          className="relative flex items-center justify-center"
          style={{ perspective: "1400px", minHeight: "420px" }}
        >
          {CAROUSEL_SLIDES.map((slide, i) => {
            const offset = ((i - active + total) % total) - Math.floor(total / 2);
            const absOffset = Math.abs(offset);
            const isCenter = offset === 0;

            return (
              <motion.div
                key={slide.src}
                className="absolute cursor-pointer"
                onClick={() => {
                  if (offset > 0) next();
                  else if (offset < 0) prev();
                }}
                animate={{
                  x: `${offset * 280}px`,
                  z: isCenter ? 0 : -absOffset * 120,
                  rotateY: offset * -15,
                  scale: isCenter ? 1 : Math.max(0.7, 1 - absOffset * 0.15),
                  opacity: absOffset > 2 ? 0 : isCenter ? 1 : 0.5 + (1 - absOffset * 0.2),
                }}
                transition={{ type: "spring", stiffness: 200, damping: 28 }}
                style={{
                  width: "clamp(300px, 42vw, 520px)",
                  transformStyle: "preserve-3d",
                  zIndex: total - absOffset,
                }}
              >
                <div className={`relative rounded-2xl overflow-hidden shadow-2xl ${
                  isCenter ? "shadow-teal-500/20" : ""
                }`} style={{ aspectRatio: "16/10" }}>
                  <Image
                    src={slide.src}
                    alt={t(slide.titleKey)}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 85vw, 520px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                  {/* Text overlay — only visible on active */}
                  <AnimatePresence>
                    {isCenter && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.4 }}
                        className="absolute bottom-0 left-0 right-0 p-6 sm:p-8"
                      >
                        <h3 className="text-white font-black text-xl sm:text-2xl tracking-tight drop-shadow-lg">
                          {t(slide.titleKey)}
                        </h3>
                        <p className="text-white/70 text-sm mt-1 font-medium">
                          {t(slide.subKey)}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Teal glow border on active */}
                  {isCenter && (
                    <div className="absolute inset-0 rounded-2xl ring-2 ring-teal-400/30" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {CAROUSEL_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`rounded-full transition-all duration-300 ${
                i === active
                  ? "w-8 h-2 bg-teal-500"
                  : `w-2 h-2 ${isDark ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-300 hover:bg-gray-400"}`
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── page component ─────────────────────── */

export default function WC2026LandingPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { t } = useTranslation("wc2026");
  const countdown = useCountdown(TOURNAMENT_START);

  /* parallax */
  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [0, 800], [1, 1.15]);
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0]);

  /* countdown items */
  const countdownItems = [
    { value: countdown.days, label: t("hero.days") },
    { value: countdown.hours, label: t("hero.hours") },
    { value: countdown.minutes, label: t("hero.minutes") },
    { value: countdown.seconds, label: t("hero.seconds") },
  ];

  /* info bar stats */
  const infoStats = [
    { icon: Users, text: t("tournament.teams") },
    { icon: Trophy, text: t("tournament.matches") },
    { icon: Calendar, text: t("tournament.hosts") },
    {
      icon: BarChart3,
      text: `${t("tournament.startDate")} - ${t("tournament.endDate")}`,
    },
  ];

  return (
    <div className={isDark ? "bg-gray-950" : "bg-gray-50"}>
      {/* ────────── WC Music Player ────────── */}
      <WCMusicPlayer />

      {/* ────────── Hero Section ────────── */}
      <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Background with parallax */}
        <motion.div className="absolute inset-0" style={{ scale: heroScale }}>
          <Image
            src="/wc2026/bg-full-wc-2026.jpg"
            alt="FIFA World Cup 2026"
            fill
            className="object-cover"
            priority
            quality={90}
          />
        </motion.div>

        {/* Heavy overlay for readability */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/90" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />

        {/* Hero content */}
        <motion.div
          className="relative z-10 text-center px-4 max-w-5xl mx-auto"
          style={{ opacity: heroOpacity }}
        >
          {/* Soft radial glow behind content — no hard edges */}
          <div
            className="absolute inset-0 mx-auto pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, transparent 80%)",
              filter: "blur(40px)",
            }}
          />
          {/* WC Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-8 relative z-10"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <Image
                src="/images/logos/wc-logo.png"
                alt="WC 2026 Logo"
                width={160}
                height={160}
                className="mx-auto drop-shadow-[0_0_40px_rgba(20,184,166,0.3)]"
              />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className="relative z-10 text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-4"
          >
            <span className="bg-gradient-to-r from-teal-300 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              {t("hero.title")}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="relative z-10 text-base sm:text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto font-light"
          >
            {t("hero.subtitle")}
          </motion.p>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="relative z-10 mb-10"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-teal-300/60 mb-5 font-semibold">
              {t("hero.countdown")}
            </p>
            <div className="flex justify-center gap-3 sm:gap-4">
              {countdownItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                  className="flex flex-col items-center bg-white/[0.07] backdrop-blur-xl rounded-2xl
                    px-4 sm:px-7 py-4 sm:py-5 border border-white/[0.1]
                    min-w-[72px] sm:min-w-[100px] shadow-lg shadow-black/20"
                >
                  <span className="text-3xl sm:text-5xl font-black text-white tabular-nums leading-none">
                    {String(item.value).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] sm:text-xs text-teal-300/50 uppercase tracking-wider mt-2 font-medium">
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="relative z-10 flex flex-wrap justify-center gap-4"
          >
            <Link
              href="/wc2026/registration"
              className="group relative px-10 py-4 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500
                text-white font-bold text-sm tracking-wide
                hover:from-teal-400 hover:to-emerald-400
                transition-all duration-300
                shadow-[0_0_30px_rgba(20,184,166,0.3)] hover:shadow-[0_0_50px_rgba(20,184,166,0.5)]
                hover:-translate-y-0.5"
            >
              {t("hero.cta")}
            </Link>
            <Link
              href="/wc2026/tables"
              className="px-10 py-4 rounded-full
                bg-white/[0.07] backdrop-blur-xl
                text-white font-bold text-sm tracking-wide
                border border-white/[0.15]
                hover:bg-white/[0.15] hover:border-white/[0.25]
                transition-all duration-300
                hover:-translate-y-0.5"
            >
              {t("hero.viewTables")}
            </Link>
          </motion.div>
        </motion.div>

        {/* Bottom fade into next section */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t ${
            isDark ? "from-gray-950" : "from-gray-50"
          } to-transparent`}
        />
      </section>

      {/* ────────── Tournament Info Bar ────────── */}
      <section className="relative -mt-24 z-20 px-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={`
            grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden
            border backdrop-blur-2xl shadow-2xl
            ${
              isDark
                ? "bg-gray-900/70 border-white/[0.08]"
                : "bg-white/70 border-gray-200/60"
            }
          `}
        >
          {infoStats.map((stat, i) => (
            <motion.div
              key={stat.text}
              custom={i}
              variants={staggerChild}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className={`flex flex-col items-center gap-2 py-6 sm:py-8 px-4
                ${isDark ? "bg-gray-900/50" : "bg-white/50"}`}
            >
              <stat.icon
                className={`w-6 h-6 ${
                  isDark ? "text-teal-400" : "text-teal-600"
                }`}
              />
              <p
                className={`text-sm sm:text-base font-bold text-center ${
                  isDark ? "text-white" : "text-gray-800"
                }`}
              >
                {stat.text}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ────────── 3D Coverflow Carousel ────────── */}
      <CoverflowCarousel isDark={isDark} />

      {/* ────────── Quick Navigation Grid ────────── */}
      <section
        className={`py-20 sm:py-28 ${
          isDark ? "bg-gray-900/50" : "bg-white/50"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`text-2xl sm:text-3xl font-bold text-center mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {t("subtitle")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className={`text-center mb-14 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {t("description")}
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {NAV_ITEMS.map((card, i) => (
              <motion.div
                key={card.href}
                custom={i}
                variants={staggerChild}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <Link
                  href={card.href}
                  className={`
                    group flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300
                    hover:-translate-y-1 hover:shadow-xl h-full
                    ${card.border}
                    ${
                      isDark
                        ? "bg-gray-900/60 border-white/[0.06] hover:bg-gray-900/90"
                        : "bg-white border-gray-200/80 hover:bg-gray-50"
                    }
                  `}
                >
                  <div
                    className={`
                    flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
                    transition-colors duration-300 ${card.iconBg} ${card.iconColor}
                  `}
                  >
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3
                      className={`font-bold text-sm mb-0.5 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {t(card.titleKey)}
                    </h3>
                    <p
                      className={`text-xs leading-relaxed ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {card.descBs}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
