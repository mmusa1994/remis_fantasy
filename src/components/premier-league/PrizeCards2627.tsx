"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";
import { leagueData2627, type LeagueData, type Prize } from "@/data/leagueTableData";

// Season 26/27 prize cards — styled after the official league visuals
// (black, diagonal league-colour glow, lion silhouette, REMIS crest).
// Reads the same data as the standings tables so both always agree.

const ACCENT: Record<string, { main: string; soft: string; word: string }> = {
  premium: { main: "#f5b50a", soft: "#ffe08a", word: "PREMIUM" },
  standard: { main: "#22d3ee", soft: "#a5f3fc", word: "STANDARD" },
  h2h: { main: "#ef4444", soft: "#fca5a5", word: "H2H" },
};

const MEDAL = [
  "linear-gradient(135deg,#fff3b0,#f5b50a 45%,#a86b00)",
  "linear-gradient(135deg,#ffffff,#c7ccd6 45%,#7b8494)",
  "linear-gradient(135deg,#ffd9b0,#d9822b 45%,#7a3d0a)",
];

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

const fmt = (n: number) => new Intl.NumberFormat("de-DE").format(n);

// 8., 9., 10. free entry → one "8.–10." row
function groupPrizes(prizes: Prize[]) {
  const groups: { from: number; to: number; prize: Prize }[] = [];
  for (const p of [...prizes].sort((a, b) => a.position - b.position)) {
    const last = groups[groups.length - 1];
    if (last && p.amountKM === 0 && last.prize.amountKM === 0 && last.prize.description === p.description && last.to === p.position - 1) {
      last.to = p.position;
    } else {
      groups.push({ from: p.position, to: p.position, prize: p });
    }
  }
  return groups;
}

function LeaguePrizeCard({ league, index }: { league: LeagueData; index: number }) {
  const { t } = useTranslation();
  const accent = ACCENT[league.type] ?? ACCENT.premium;

  const perkText = (d: string) => {
    if (d === "ORIGINAL_JERSEY_PL") return t("leagueTables.originalJerseyPL");
    if (d === "FREE_ENTRY_PLACEHOLDER") return t("leagueTables.freeEntry");
    return d;
  };

  return (
    <motion.article
      className="relative isolate flex flex-col overflow-hidden rounded-[28px] bg-[#07070c] text-white shadow-2xl"
      style={{ boxShadow: `0 40px 80px -50px ${rgba(accent.main, 0.7)}` }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.08 }}
    >
      {/* diagonal league glow, like the official visuals */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(90% 70% at 100% 100%, ${rgba(accent.main, 0.55)} 0%, transparent 60%),
            linear-gradient(150deg, transparent 52%, ${rgba(accent.main, 0.16)} 75%, ${rgba(accent.main, 0.32)} 100%)`,
        }}
      />
      {/* lion silhouette */}
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-10 -z-10 h-72 w-72 opacity-[0.1] blur-[5px]">
        <Image src="/images/logos/pl-logo.png" alt="" fill sizes="288px" className="object-contain" />
      </div>

      <header className="px-6 pt-6">
        <div className="flex items-center justify-between">
          <Image src="/images/rf-logo.svg" alt="REMIS Fantasy" width={44} height={44} className="h-11 w-11 object-contain" />
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/50">
            {t("leagueTables.season", { season: "26/27" })}
          </span>
        </div>
        <h2 className="mt-5 leading-none">
          <span className="block text-4xl font-black tracking-tight" style={{ color: accent.main }}>
            {accent.word}
          </span>
          <span className="mt-1 block text-lg font-bold uppercase tracking-[0.3em] text-white/90">
            {t("leagueTables.league")}
          </span>
        </h2>
        <div className="mt-3 h-px w-24" style={{ background: `linear-gradient(90deg, ${accent.main}, transparent)` }} />

        <dl className="mt-5 grid grid-cols-3 gap-3 text-left">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/45">{t("leagueTables.entryFee")}</dt>
            <dd className="mt-1 text-sm font-extrabold">{fmt(league.entryFeeKM)} KM</dd>
            <dd className="text-[11px] text-white/45">{fmt(league.entryFeeEUR)} €</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/45">{t("leagueTables.participants")}</dt>
            <dd className="mt-1 text-sm font-extrabold">{league.maxParticipants}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/45">{t("leagueTables.prizePool")}</dt>
            <dd className="mt-1 text-sm font-extrabold">{fmt(league.totalPrizeFundKM)} KM</dd>
            <dd className="text-[11px] text-white/45">{fmt(league.totalPrizeFundEUR)} €</dd>
          </div>
        </dl>
      </header>

      {/* prize ladder */}
      <ol className="mt-6 flex-1 px-3">
        {groupPrizes(league.prizes).map(({ from, to, prize }) => {
          const isCash = prize.amountKM > 0;
          const first = from === 1;
          return (
            <li
              key={from}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
              style={first ? { background: `linear-gradient(90deg, ${rgba(accent.main, 0.16)}, transparent 85%)` } : undefined}
            >
              <span
                className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-black tabular-nums"
                style={
                  from <= 3
                    ? { background: MEDAL[from - 1], color: "#1a1206" }
                    : { backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.75)" }
                }
              >
                {from === to ? from : `${from}–${to}`}
              </span>
              <span className="flex-1 text-[13px] font-medium text-white/60">
                {from === to ? t("leagueTables.place", { n: from }) : t("leagueTables.places", { from, to })}
              </span>
              {isCash ? (
                <span className="text-right leading-none">
                  <span className={`font-black tabular-nums ${first ? "text-2xl" : "text-lg"}`}>{fmt(prize.amountKM)}</span>
                  <span className="ml-1 text-[11px] font-bold text-white/50">KM</span>
                  <span className="mt-0.5 block text-[10px] text-white/40">{fmt(prize.amountEUR)} €</span>
                </span>
              ) : (
                <span className="max-w-[55%] text-right text-[13px] font-bold leading-tight" style={{ color: accent.soft }}>
                  {perkText(prize.description)}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {league.specialPrizes && league.specialPrizes.length > 0 && (
        <div className="mx-6 mt-4 space-y-2.5 border-t border-white/[0.08] py-4">
          {league.specialPrizes.map((sp) => (
            <div key={sp.titleKey} className="flex items-start gap-2.5">
              <Star className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: accent.main, fill: accent.main }} />
              <div className="leading-tight">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-white/45">{t(sp.titleKey)}</div>
                <div className="mt-0.5 text-sm font-bold">{t(sp.prizeKey)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="h-3" />
    </motion.article>
  );
}

export default function PrizeCards2627() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-12">
      <div className="mb-8 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-theme-text-muted">
          {t("leagueTables.prizesPage.eyebrow")}
        </div>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-theme-foreground md:text-4xl">
          {t("leagueTables.prizesPage.title")}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-theme-text-secondary">{t("leagueTables.prizesPage.subtitle")}</p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {leagueData2627.map((league, i) => (
          <LeaguePrizeCard key={league.type} league={league} index={i} />
        ))}
      </div>
    </section>
  );
}
