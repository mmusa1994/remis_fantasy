"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Trophy, Medal, Shirt, Ticket, Banknote, Search, Crown, Users, Coins, Star } from "lucide-react";
import { GiDiamondTrophy } from "react-icons/gi";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

// League names come from static Bosnian data — show them in the UI language
const LEAGUE_NAME_KEYS: Record<string, string> = {
  premium: "fplLive.premiumLeague",
  standard: "fplLive.standardLeague",
  h2h: "fplLive.h2hLeague",
  h2h2: "fplLive.h2h2League",
  free: "fplLive.freeLeague",
};

export interface TablePlayer {
  id: string;
  firstName: string;
  lastName: string;
  teamName: string;
  points: number;
  position: number;
  h2h_points?: number | null;
  h2h_stats?: { w: number; d: number; l: number } | null;
}

export interface TablePrize {
  position: number;
  description: string;
  amountKM: number;
  amountEUR: number;
  percentage: number;
}

export interface ReusableLeagueTableProps {
  leagueName: string;
  leagueType: "premium" | "standard" | "h2h" | "h2h2" | "free";
  players: TablePlayer[];
  prizes: TablePrize[];
  totalPrizeFundKM: number;
  totalPrizeFundEUR: number;
  entryFeeKM: number;
  entryFeeEUR: number;
  monthlyPrizeKM?: number;
  monthlyPrizeEUR?: number;
  cupPrizeKM?: number;
  cupPrizeEUR?: number;
  maxParticipants: number;
  seasonLabel?: string;
  specialPrizes?: { titleKey: string; prizeKey: string }[];
  className?: string;
}

interface Accent {
  main: string;
  soft: string;
  deep: string;
}

const ACCENTS: Record<ReusableLeagueTableProps["leagueType"], Accent> = {
  premium: { main: "#f5b50a", soft: "#ffe08a", deep: "#7a4d00" },
  standard: { main: "#3b82f6", soft: "#93c5fd", deep: "#1e3a8a" },
  h2h: { main: "#f43f5e", soft: "#fda4af", deep: "#881337" },
  h2h2: { main: "#f43f5e", soft: "#fda4af", deep: "#881337" },
  free: { main: "#8b5cf6", soft: "#c4b5fd", deep: "#4c1d95" },
};

const MEDALS = [
  { ring: "linear-gradient(135deg,#fff3b0,#f5b50a 45%,#a86b00)", glow: "rgba(245,181,10,0.45)", text: "#4a2f00" },
  { ring: "linear-gradient(135deg,#ffffff,#c7ccd6 45%,#7b8494)", glow: "rgba(170,180,195,0.40)", text: "#2b313b" },
  { ring: "linear-gradient(135deg,#ffd9b0,#d9822b 45%,#7a3d0a)", glow: "rgba(217,130,43,0.40)", text: "#3d1d02" },
];

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

const initials = (p: TablePlayer) =>
  `${p.firstName?.[0] ?? ""}${p.lastName?.[0] ?? ""}`.toUpperCase() || (p.teamName?.[0] ?? "?").toUpperCase();

const fmt = (n: number) => new Intl.NumberFormat("de-DE").format(n);

export default function ReusableLeagueTable({
  leagueName,
  leagueType,
  players,
  prizes,
  totalPrizeFundKM,
  totalPrizeFundEUR,
  entryFeeKM,
  entryFeeEUR,
  seasonLabel,
  specialPrizes = [],
  className = "",
}: ReusableLeagueTableProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const accent = ACCENTS[leagueType] ?? ACCENTS.premium;
  const isH2H = leagueType === "h2h" || leagueType === "h2h2";
  const displayName = LEAGUE_NAME_KEYS[leagueType] ? t(LEAGUE_NAME_KEYS[leagueType]) : leagueName;

  const score = (p: TablePlayer) => (isH2H ? p.h2h_points ?? 0 : p.points);
  const leader = players[0];
  const leaderScore = leader ? score(leader) : 0;
  // Bars scale across the league's own range (last → leader) so small gaps stay visible
  const minScore = players.length ? Math.min(...players.map(score)) : 0;
  const range = leaderScore - minScore;
  const prizeByPos = useMemo(() => new Map(prizes.map((p) => [p.position, p])), [prizes]);
  const lastPrizePos = prizes.length ? Math.max(...prizes.map((p) => p.position)) : 0;

  const prizeText = (prize?: TablePrize) => {
    if (!prize) return "";
    if (prize.amountKM > 0) return `${fmt(prize.amountKM)} KM`;
    const d = prize.description || "";
    if (d === "ORIGINAL_JERSEY_PL") return t("leagueTables.originalJerseyPL");
    if (d.includes("ORIGINAL DRES") || d.includes("ORIGINAL JERSEY") || d === "ORIGINAL_JERSEY_PLACEHOLDER")
      return t("prizes.originalJersey");
    if (d.includes("BESPLATNO") || d.includes("FREE ENTRY") || d === "FREE_ENTRY_PLACEHOLDER")
      return t("leagueTables.freeEntry");
    return d;
  };

  const prizeIcon = (prize: TablePrize | undefined, size = "w-3.5 h-3.5") => {
    if (!prize) return null;
    if (prize.position === 1)
      return leagueType === "premium" ? <GiDiamondTrophy className={size} /> : <Trophy className={size} />;
    if (prize.position <= 3) return <Medal className={size} />;
    if (prize.amountKM > 0) return <Banknote className={size} />;
    const d = prize.description || "";
    if (d.includes("DRES") || d.includes("JERSEY")) return <Shirt className={size} />;
    return <Ticket className={size} />;
  };

  // Collapse consecutive identical non-cash prizes (e.g. 8.–10. free entry) into one chip
  const prizeGroups = useMemo(() => {
    const groups: { from: number; to: number; prize: TablePrize }[] = [];
    for (const p of [...prizes].sort((a, b) => a.position - b.position)) {
      const last = groups[groups.length - 1];
      if (last && p.amountKM === 0 && last.prize.amountKM === 0 && last.prize.description === p.description && last.to === p.position - 1) {
        last.to = p.position;
      } else {
        groups.push({ from: p.position, to: p.position, prize: p });
      }
    }
    return groups;
  }, [prizes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) =>
      `${p.firstName} ${p.lastName} ${p.teamName}`.toLowerCase().includes(q)
    );
  }, [players, query]);

  const podium = players.slice(0, 3);
  // Desktop order: 2 · 1 · 3
  const podiumOrder = podium.length === 3 ? [podium[1], podium[0], podium[2]] : podium;

  const card = "bg-theme-card border border-theme-border";

  return (
    <motion.section
      className={`w-full max-w-6xl mx-auto ${className}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-3xl p-5 sm:p-8 text-white shadow-2xl"
        style={{
          background: `radial-gradient(120% 140% at 100% 0%, ${rgba(accent.main, 0.55)} 0%, transparent 55%),
             radial-gradient(90% 120% at 0% 100%, ${rgba(accent.soft, 0.22)} 0%, transparent 60%),
             linear-gradient(135deg, #07071a 0%, #10102a 55%, ${accent.deep} 140%)`,
          boxShadow: `0 30px 60px -30px ${rgba(accent.main, 0.55)}`,
        }}
      >
        {/* pitch lines */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #fff 0 1px, transparent 1px 64px), repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 64px)",
            maskImage: "radial-gradient(80% 90% at 80% 20%, black, transparent 75%)",
            WebkitMaskImage: "radial-gradient(80% 90% at 80% 20%, black, transparent 75%)",
          }}
        />
        {/* blurred PL lion fading out on the right */}
        <div aria-hidden className="pointer-events-none absolute -right-14 -top-8 h-[300px] w-[300px] sm:-right-6 sm:-top-12 sm:h-[400px] sm:w-[400px]">
          <Image src="/images/logos/pl-logo.png" alt="" fill sizes="400px" className="object-contain opacity-[0.18] blur-[7px]" />
        </div>
        <div aria-hidden className="pointer-events-none absolute -right-14 -top-8 h-[300px] w-[300px] sm:-right-6 sm:-top-12 sm:h-[400px] sm:w-[400px]">
          <Image src="/images/logos/pl-logo.png" alt="" fill sizes="400px" className="object-contain opacity-[0.05]" />
        </div>
        {/* shimmer sweep */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3"
          style={{ background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.08), transparent)" }}
          animate={{ x: ["0%", "450%"] }}
          transition={{ duration: 5.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
        />

        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: accent.soft }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent.main, boxShadow: `0 0 12px ${accent.main}` }} />
            REMIS Fantasy{seasonLabel ? ` · ${seasonLabel}` : ""}
          </div>
          <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight leading-none">{displayName}</h2>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <HeroStat icon={<Users className="w-4 h-4" />} label={t("leagueTables.players")} value={fmt(players.length)} />
            <HeroStat
              icon={<Coins className="w-4 h-4" />}
              label={t("leagueTables.prizePool")}
              value={totalPrizeFundKM > 0 ? `${fmt(totalPrizeFundKM)} KM` : "—"}
              sub={totalPrizeFundEUR > 0 ? `${fmt(totalPrizeFundEUR)} €` : undefined}
            />
            <HeroStat
              icon={<Ticket className="w-4 h-4" />}
              label={t("leagueTables.entryFee")}
              value={entryFeeKM > 0 ? `${fmt(entryFeeKM)} KM` : t("leagueTables.free")}
              sub={entryFeeEUR > 0 ? `${fmt(entryFeeEUR)} €` : undefined}
            />
            <HeroStat
              icon={<Crown className="w-4 h-4" />}
              label={t("leagueTables.leader")}
              value={leader ? leader.teamName : "—"}
              sub={leader ? `${fmt(leaderScore)} ${t("leagueTables.points")}` : undefined}
              truncate
            />
          </div>
        </div>
      </div>

      {/* ── Podium ───────────────────────────────────────────── */}
      {podium.length > 0 && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:items-end">
          {podiumOrder.map((p) => {
            const idx = p.position - 1;
            const medal = MEDALS[Math.min(idx, 2)];
            const isFirst = p.position === 1;
            const prize = prizeByPos.get(p.position);
            return (
              <motion.div
                key={p.id}
                className={`relative overflow-hidden rounded-2xl ${card} ${isFirst ? "sm:pb-8 sm:pt-7" : ""} ${
                  isFirst ? "order-first sm:order-none" : ""
                } p-4 sm:p-5`}
                style={{
                  boxShadow: `0 18px 40px -24px ${medal.glow}`,
                  background: isDark
                    ? `linear-gradient(180deg, ${rgba(accent.main, isFirst ? 0.16 : 0.08)}, transparent 70%)`
                    : `linear-gradient(180deg, ${rgba(accent.main, isFirst ? 0.14 : 0.07)}, #ffffff 70%)`,
                }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + idx * 0.08 }}
              >
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: medal.ring }} />
                <div className="flex items-center gap-3.5 sm:flex-col sm:text-center">
                  <div className="relative shrink-0">
                    <div
                      className={`rounded-full p-[3px] ${isFirst ? "w-16 h-16 sm:w-20 sm:h-20" : "w-14 h-14 sm:w-16 sm:h-16"}`}
                      style={{ background: medal.ring, boxShadow: `0 0 24px ${medal.glow}` }}
                    >
                      <div
                        className="flex h-full w-full items-center justify-center rounded-full bg-theme-card text-lg sm:text-xl font-black"
                        style={{ color: isDark ? accent.soft : accent.deep }}
                      >
                        {initials(p)}
                      </div>
                    </div>
                    <div
                      className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-black shadow-md"
                      style={{ background: medal.ring, color: medal.text }}
                    >
                      {p.position}
                    </div>
                    {isFirst && (
                      <Crown
                        className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-6 h-6 drop-shadow"
                        style={{ color: "#f5b50a", fill: "#f5b50a" }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 sm:w-full">
                    <div className="truncate text-base font-extrabold text-theme-foreground">{p.teamName}</div>
                    <div className="truncate text-xs text-theme-text-secondary">
                      {p.firstName} {p.lastName}
                    </div>
                    <div className="mt-2 flex items-end gap-1.5 sm:justify-center">
                      <span className={`font-black leading-none tabular-nums text-theme-foreground ${isFirst ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"}`}>
                        {fmt(score(p))}
                      </span>
                      <span className="pb-0.5 text-xs font-semibold text-theme-text-muted">
                        {isH2H ? t("leagueTables.h2hPoints") : t("leagueTables.points")}
                      </span>
                    </div>
                    {isH2H && p.h2h_stats && (
                      <div className="mt-2 flex gap-1 sm:justify-center">
                        <WdlPill kind="w" value={p.h2h_stats.w} label={t("leagueTables.won")} />
                        <WdlPill kind="d" value={p.h2h_stats.d} label={t("leagueTables.drawn")} />
                        <WdlPill kind="l" value={p.h2h_stats.l} label={t("leagueTables.lost")} />
                      </div>
                    )}
                  </div>
                </div>
                {prize && (
                  <div className="mt-3 flex sm:justify-center">
                    <span
                      className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{ backgroundColor: rgba(accent.main, 0.14), color: isDark ? accent.soft : accent.deep }}
                    >
                      {prizeIcon(prize)}
                      <span className="truncate">{prizeText(prize)}</span>
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Prizes ───────────────────────────────────────────── */}
      {prizeGroups.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-2xl bg-theme-card shadow-sm">
          <div className="flex items-baseline justify-between gap-3 px-4 pt-4 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full" style={{ backgroundColor: accent.main }} />
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-theme-foreground">{t("leagueTables.prizes")}</h3>
            </div>
            {totalPrizeFundKM > 0 && (
              <div className="text-right text-xs text-theme-text-muted">
                {t("leagueTables.prizePool")}{" "}
                <span className="font-extrabold text-theme-foreground">{fmt(totalPrizeFundKM)} KM</span>
                {totalPrizeFundEUR > 0 && <span> · {fmt(totalPrizeFundEUR)} €</span>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-4 px-4 py-4 sm:grid-cols-3 sm:px-5 lg:grid-cols-5">
            {prizeGroups.map(({ from, to, prize }) => {
              const medal = from <= 3 ? MEDALS[from - 1] : null;
              const isCash = prize.amountKM > 0;
              return (
                <div key={from} className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-theme-text-muted">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: medal ? medal.ring : rgba(accent.main, 0.55) }}
                    />
                    {from === to ? t("leagueTables.place", { n: from }) : t("leagueTables.places", { from, to })}
                  </div>
                  {isCash ? (
                    <div className="mt-1 leading-none">
                      <span className={`font-black tabular-nums text-theme-foreground ${from === 1 ? "text-2xl" : "text-xl"}`}>
                        {fmt(prize.amountKM)}
                      </span>
                      <span className="ml-1 text-xs font-bold text-theme-text-muted">KM</span>
                      <div className="mt-1 text-[11px] font-medium text-theme-text-muted">{fmt(prize.amountEUR)} €</div>
                    </div>
                  ) : (
                    <div className="mt-1 text-[13px] font-bold leading-snug text-theme-foreground">{prizeText(prize)}</div>
                  )}
                </div>
              );
            })}
          </div>

          {specialPrizes.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-theme-border px-4 py-3 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:px-5">
              {specialPrizes.map((sp) => (
                <div key={sp.titleKey} className="flex items-center gap-2 text-[13px]">
                  <Star className="h-3.5 w-3.5 shrink-0" style={{ color: accent.main, fill: accent.main }} />
                  <span className="text-theme-text-muted">{t(sp.titleKey)}</span>
                  <span className="font-bold text-theme-foreground">{t(sp.prizeKey)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Standings ────────────────────────────────────────── */}
      <div className={`mt-5 overflow-hidden rounded-2xl ${card} shadow-sm`}>
        <div className="flex flex-col gap-3 border-b border-theme-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1 rounded-full" style={{ backgroundColor: accent.main }} />
            <h3 className="text-base font-extrabold text-theme-foreground">{t("leagueTables.standings")}</h3>
            <span className="rounded-full bg-theme-card-secondary px-2 py-0.5 text-[11px] font-bold text-theme-text-secondary">
              {players.length}
            </span>
          </div>
          <label className="relative block sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("leagueTables.searchPlaceholder")}
              className="w-full rounded-xl border border-theme-border bg-theme-card-secondary py-2 pl-9 pr-3 text-sm text-theme-foreground placeholder:text-theme-text-muted outline-none transition focus:border-theme-border-strong"
            />
          </label>
        </div>

        {/* column header (desktop) */}
        <div className="hidden sm:flex items-center gap-3 bg-theme-card-secondary px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-theme-text-muted">
          <div className="w-10 text-center">#</div>
          <div className="flex-1">{t("premiumLeague.tableHeaders.team")}</div>
          {isH2H && <div className="w-28 text-center">{t("leagueTables.won")} · {t("leagueTables.drawn")} · {t("leagueTables.lost")}</div>}
          {isH2H && <div className="w-20 text-right">{t("leagueTables.overall")}</div>}
          <div className="w-24 text-right">{isH2H ? t("leagueTables.h2hPoints") : t("leagueTables.pointsLong")}</div>
        </div>

        <ol>
          {filtered.map((p, i) => {
            const prize = prizeByPos.get(p.position);
            const inZone = !!prize;
            const s = score(p);
            const pct = range > 0 ? Math.max(6, Math.round(((s - minScore) / range) * 100)) : 100;
            const gap = leaderScore - s;
            const showCutoff = !query && lastPrizePos > 0 && p.position === lastPrizePos && i < filtered.length - 1;
            const medal = p.position <= 3 ? MEDALS[p.position - 1] : null;
            return (
              <li key={p.id}>
                <motion.div
                  className="group relative flex items-center gap-3 border-b border-theme-border px-3 py-2.5 sm:px-4 sm:py-3 transition-colors hover:bg-theme-card-secondary"
                  style={inZone ? { background: `linear-gradient(90deg, ${rgba(accent.main, isDark ? 0.1 : 0.07)}, transparent 60%)` } : undefined}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i, 20) * 0.02 }}
                >
                  {inZone && <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: accent.main }} />}

                  {/* rank */}
                  <div className="w-10 shrink-0 flex justify-center">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black tabular-nums"
                      style={
                        medal
                          ? { background: medal.ring, color: medal.text, boxShadow: `0 4px 14px -4px ${medal.glow}` }
                          : inZone
                            ? { backgroundColor: rgba(accent.main, 0.16), color: isDark ? accent.soft : accent.deep }
                            : undefined
                      }
                    >
                      <span className={medal || inZone ? "" : "text-theme-text-secondary"}>{p.position}</span>
                    </span>
                  </div>

                  {/* identity */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm sm:text-[15px] font-bold text-theme-foreground">{p.teamName}</span>
                      {prize && (
                        <span
                          className="hidden md:inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ backgroundColor: rgba(accent.main, 0.14), color: isDark ? accent.soft : accent.deep }}
                        >
                          {prizeIcon(prize, "w-3 h-3")}
                          {prizeText(prize)}
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-theme-text-secondary">
                      {p.firstName} {p.lastName}
                    </div>
                    {/* progress vs leader */}
                    <div className="mt-1.5 h-1 w-full max-w-[220px] overflow-hidden rounded-full bg-theme-card-secondary">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${accent.main}, ${accent.soft})` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.15 + Math.min(i, 20) * 0.02, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {isH2H && (
                    <div className="hidden sm:flex w-28 justify-center gap-1">
                      <WdlPill kind="w" value={p.h2h_stats?.w ?? 0} />
                      <WdlPill kind="d" value={p.h2h_stats?.d ?? 0} />
                      <WdlPill kind="l" value={p.h2h_stats?.l ?? 0} />
                    </div>
                  )}
                  {isH2H && (
                    <div className="hidden sm:block w-20 text-right text-sm font-semibold tabular-nums text-theme-text-secondary">
                      {fmt(p.points)}
                    </div>
                  )}

                  {/* score */}
                  <div className="w-24 shrink-0 text-right">
                    <div className="text-lg sm:text-xl font-black tabular-nums leading-none text-theme-foreground">{fmt(s)}</div>
                    <div className="mt-1 text-[10px] font-semibold text-theme-text-muted">
                      {p.position === 1 ? (
                        <span style={{ color: isDark ? accent.soft : accent.deep }}>{t("leagueTables.leaderBadge")}</span>
                      ) : isH2H ? (
                        <span className="sm:hidden">
                          {p.h2h_stats ? `${p.h2h_stats.w}-${p.h2h_stats.d}-${p.h2h_stats.l}` : ""}
                        </span>
                      ) : (
                        `−${fmt(gap)}`
                      )}
                    </div>
                  </div>
                </motion.div>

                {showCutoff && (
                  <div className="relative flex items-center gap-2 px-4 py-1.5">
                    <span className="h-px flex-1 border-t border-dashed" style={{ borderColor: rgba(accent.main, 0.55) }} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: accent.main }}>
                      {t("leagueTables.prizeZone")}
                    </span>
                    <span className="h-px flex-1 border-t border-dashed" style={{ borderColor: rgba(accent.main, 0.55) }} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-theme-text-muted">
            {players.length === 0 ? t("leagueTables.comingSoonText") : t("leagueTables.noResults", { q: query })}
          </div>
        )}
      </div>
    </motion.section>
  );
}

function HeroStat({
  icon,
  label,
  value,
  sub,
  truncate,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  truncate?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/60">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-base sm:text-lg font-extrabold leading-tight ${truncate ? "truncate" : ""}`}>{value}</div>
      {sub && <div className="text-[11px] font-semibold text-white/55">{sub}</div>}
    </div>
  );
}

function WdlPill({ kind, value, label }: { kind: "w" | "d" | "l"; value: number; label?: string }) {
  const styles = {
    w: "bg-emerald-500 text-white",
    d: "bg-slate-400 text-white",
    l: "bg-rose-500 text-white",
  }[kind];
  return (
    <span className={`inline-flex min-w-[26px] items-center justify-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${styles}`}>
      {label && <span className="opacity-80">{label}</span>}
      {value}
    </span>
  );
}
