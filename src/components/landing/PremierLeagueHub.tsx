"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";

// Landing "one click" hub for every Premier League page. Always dark,
// in PL brand colours, so it reads as the hero of the page in both themes.

const PL = {
  purple: "#37003c",
  magenta: "#e90052",
  cyan: "#04f5ff",
  green: "#00ff85",
};

interface HubItem {
  key: string;
  href: string;
  accent?: string;
  badge?: "live";
}

const FEATURED: HubItem[] = [
  { key: "fplLive", href: "/premier-league/fpl-live", accent: PL.green, badge: "live" },
  { key: "fantasyCommand", href: "/premier-league/team-planner", accent: PL.cyan },
  { key: "aiTeamAnalysis", href: "/premier-league/ai-team-analysis", accent: PL.magenta },
  { key: "tables", href: "/premier-league/tables", accent: "#f5b50a" },
];

const MORE: HubItem[] = [
  { key: "prices", href: "/premier-league/prices" },
  { key: "bestDifferentials", href: "/premier-league/best-differentials" },
  { key: "teamNews", href: "/premier-league/team-news" },
  { key: "registration", href: "/premier-league/registration" },
  { key: "prizes", href: "/premier-league/prizes" },
  { key: "gallery", href: "/premier-league/gallery" },
];

const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export default function PremierLeagueHub() {
  const { t } = useTranslation(["hero", "navigation"]);
  const name = (key: string) => t(`navigation:${key}`);
  const desc = (key: string) => t(`hero:plHub.desc.${key}`);

  return (
    <motion.section
      aria-labelledby="pl-hub-title"
      className="relative isolate mx-auto max-w-5xl overflow-hidden rounded-[28px] text-left text-white shadow-2xl"
      style={{
        background: `radial-gradient(70% 90% at 100% 0%, ${hexA(PL.magenta, 0.32)} 0%, transparent 60%),
          radial-gradient(60% 80% at 0% 100%, ${hexA(PL.cyan, 0.16)} 0%, transparent 60%),
                    linear-gradient(145deg, #24002a 0%, ${PL.purple} 45%, #1a0020 100%)`,
        boxShadow: `0 40px 80px -48px ${hexA(PL.magenta, 0.45)}`,
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Blurred lion behind everything */}
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-10 -z-10 h-[380px] w-[380px] sm:-right-10 sm:h-[520px] sm:w-[520px]">
        <Image
          src="/images/logos/pl-logo.png"
          alt=""
          fill
          sizes="520px"
          className="object-contain opacity-[0.13] blur-[8px]"
        />
      </div>
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-10 -z-10 h-[380px] w-[380px] sm:-right-10 sm:h-[520px] sm:w-[520px]">
        <Image src="/images/logos/pl-logo.png" alt="" fill sizes="520px" className="object-contain opacity-[0.04]" />
      </div>

      {/* PL-style diagonal stripes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035]"
        style={{
          backgroundImage: "repeating-linear-gradient(115deg, #fff 0 2px, transparent 2px 22px)",
          maskImage: "linear-gradient(90deg, transparent, black 40%, black 70%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, black 40%, black 70%, transparent)",
        }}
      />

      <div className="relative p-5 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Image
            src="/images/logos/pl-logo.png"
            alt="Premier League"
            width={48}
            height={48}
            className="h-10 w-10 shrink-0 object-contain opacity-95 sm:h-12 sm:w-12"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55 sm:text-[11px]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ backgroundColor: PL.green }} />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PL.green }} />
              </span>
              {t("hero:plHub.eyebrow")}
            </div>
            <h2 id="pl-hub-title" className="mt-1 text-2xl font-black leading-tight tracking-tight sm:text-[34px]">
              {t("hero:plHub.title")}
            </h2>
          </div>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-[15px]">{t("hero:plHub.subtitle")}</p>

        {/* Featured — quiet, borderless tiles; colour only as a thin accent */}
        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
          {FEATURED.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12 + i * 0.06 }}
            >
              <Link
                href={item.href}
                className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-white/[0.045] px-4 py-3.5 transition-colors duration-300 hover:bg-white/[0.09] sm:px-5 sm:py-4"
              >
                <span
                  aria-hidden
                  className="h-9 w-[3px] shrink-0 rounded-full transition-all duration-300 group-hover:h-11"
                  style={{ backgroundColor: item.accent }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[15px] font-bold tracking-tight sm:text-base">{name(item.key)}</h3>
                    {item.badge === "live" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: PL.green }}>
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: PL.green }} />
                        {t("hero:plHub.live")}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-white/60">{desc(item.key)}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-white/35 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* More — plain text chips */}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {MORE.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.4 + i * 0.04 }}
            >
              <Link
                href={item.href}
                title={desc(item.key)}
                className="inline-flex items-center rounded-full bg-white/[0.04] px-3.5 py-1.5 text-[13px] font-medium text-white/70 transition-colors duration-200 hover:bg-white/[0.1] hover:text-white"
              >
                {name(item.key)}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
