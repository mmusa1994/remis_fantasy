"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTrophy, FaMedal, FaAward, FaSearch } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { ClTableSkeleton } from "@/components/shared/TableSkeletons";

interface ChampionsLeaguePlayer {
  id: number;
  rank: number;
  team_name: string;
  user_name: string;
  avatar_url: string;
  member_number: number;
  points: number;
  last_md_points: number;
  is_winner: boolean;
  is_loser: boolean;
  is_tie: boolean;
}

export type ClSeason = "25_26" | "26_27";

interface PrizeInfo {
  total_km: number;
  total_eur: number;
  first_km: number;
  first_eur: number;
  second_km: number;
  second_eur: number;
  third_km: number;
  third_eur: number;
}

interface SeasonConfig {
  title: string;
  completed: boolean;
  participantsCount: number | null;
  // null dok nagradni fond za sezonu nije objavljen — UI tada prikazuje
  // procente (50/30/20) umjesto iznosa
  prize: PrizeInfo | null;
}

const SEASON_CONFIG: Record<ClSeason, SeasonConfig> = {
  "25_26": {
    title: "REMIS Champions League 2025/26",
    completed: true,
    participantsCount: 48,
    prize: {
      total_km: 750, // 15 * 50 KM
      total_eur: 385, // ~385€
      first_km: 375, // 50% = 375KM
      first_eur: 193, // ~193€
      second_km: 225, // 30% = 225KM
      second_eur: 115, // ~115€
      third_km: 150, // 20% = 150KM
      third_eur: 77, // ~77€
    },
  },
  "26_27": {
    title: "REMIS Champions League 2026/27",
    completed: false,
    participantsCount: null,
    prize: null,
  },
};

const PRIZE_SPLIT = { first: 50, second: 30, third: 20 };

const CL_MEDALS = [
  { ring: "linear-gradient(135deg,#fff3b0,#f5b50a 45%,#a86b00)", glow: "rgba(245,181,10,0.45)", text: "#4a2f00" },
  { ring: "linear-gradient(135deg,#ffffff,#c7ccd6 45%,#7b8494)", glow: "rgba(170,180,195,0.40)", text: "#2b313b" },
  { ring: "linear-gradient(135deg,#ffd9b0,#d9822b 45%,#7a3d0a)", glow: "rgba(217,130,43,0.40)", text: "#3d1d02" },
];

interface ChampionsLeagueTableProps {
  season?: ClSeason;
}

export default function ChampionsLeagueTable({
  season = "26_27",
}: ChampionsLeagueTableProps) {
  const [players, setPlayers] = useState<ChampionsLeaguePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { theme } = useTheme();
  const { t } = useTranslation("champions");

  const config = SEASON_CONFIG[season];

  useEffect(() => {
    const fetchTableData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/champions-league/table?season=${season}`
        );
        if (!response.ok) {
          throw new Error(t("table.fetchFailed"));
        }
        const data = await response.json();
        setPlayers(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("table.unknownError"));
      } finally {
        setLoading(false);
      }
    };

    fetchTableData();
  }, [season, t]);

  const getPrizeAmount = (rank: number) => {
    if (config.prize) {
      switch (rank) {
        case 1:
          return `${config.prize.first_km}KM/${config.prize.first_eur}€`;
        case 2:
          return `${config.prize.second_km}KM/${config.prize.second_eur}€`;
        case 3:
          return `${config.prize.third_km}KM/${config.prize.third_eur}€`;
        default:
          return null;
      }
    }
    // Fond još nije objavljen — prikaži procente
    switch (rank) {
      case 1:
        return `${PRIZE_SPLIT.first}%`;
      case 2:
        return `${PRIZE_SPLIT.second}%`;
      case 3:
        return `${PRIZE_SPLIT.third}%`;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <ClTableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="text-red-600 dark:text-red-400">
            <FaTrophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">
              {t("table.errorTitle")}
            </h3>
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const isDark = theme === "dark";
  // Some rows arrive without a rank — fall back to their list position
  const rankOf = (p: ChampionsLeaguePlayer) => p.rank || players.indexOf(p) + 1;
  const leaderPts = players[0]?.points ?? 0;
  const minPts = players.length ? Math.min(...players.map((p) => p.points)) : 0;
  const range = leaderPts - minPts;
  const q = query.trim().toLowerCase();
  const filtered = q
    ? players.filter((p) => `${p.team_name} ${p.user_name}`.toLowerCase().includes(q))
    : players;
  const podium = players.slice(0, 3);
  const podiumOrder = podium.length === 3 ? [podium[1], podium[0], podium[2]] : podium;

  const participantsCount =
    config.participantsCount ?? (players.length > 0 ? players.length : null);
  const participantsLabel =
    participantsCount !== null
      ? t("table.participants", { count: participantsCount })
      : null;

  return (
    <div className="space-y-6">
      {/* Prize Pool Info — hero on the UCL stadium wallpaper, logo in the right corner */}
      <motion.div
        className="relative isolate overflow-hidden rounded-3xl text-white shadow-2xl shadow-blue-900/30"
        style={{ backgroundColor: "#030e46" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Wallpaper shown near its native size (source is only 739px wide) and
            feathered into the navy so it never gets blurry from upscaling */}
        <motion.img
          src="/images/cl/wp-cl1.jpeg"
          srcSet="/images/cl/wp-cl1.jpeg 1x, /images/cl/wp-cl1@2x.webp 2x"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 aspect-[739/415] w-full object-cover md:inset-x-auto md:inset-y-0 md:right-0 md:h-full md:w-auto md:max-w-[62%]"
          style={{
            maskImage: "linear-gradient(90deg, transparent 0%, black 28%)",
            WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 28%)",
          }}
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        {/* mobile: fade the image into the navy below it */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 md:hidden"
          style={{ background: "linear-gradient(180deg, rgba(3,14,70,0) 0%, rgba(3,14,70,0.2) 22%, #030e46 42%)" }}
        />
        {/* soft glow behind the text column */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 hidden md:block"
          style={{
            background:
              "radial-gradient(60% 90% at 0% 0%, rgba(34,211,238,0.14), transparent 60%), radial-gradient(50% 80% at 30% 100%, rgba(168,85,247,0.18), transparent 60%)",
          }}
        />
        {/* neon rim, echoing the stadium lights */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
          style={{ background: "linear-gradient(90deg, transparent, #22d3ee, #a855f7, #f472b6, transparent)" }}
        />

        <div className="relative p-5 pt-[44vw] sm:p-8 sm:pt-[40vw] md:pt-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_#67e8f9]" />
              UEFA Champions League Fantasy
            </div>
            <h2 className="mt-2 text-2xl sm:text-4xl font-black leading-tight tracking-tight flex items-center gap-3 flex-wrap">
              {config.title}
              {config.completed && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 border border-white/20 rounded-full px-3 py-1">
                  {t("table.seasonFinished")}
                </span>
              )}
            </h2>
            <div className="mt-4 inline-flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-2.5 backdrop-blur-md">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100/80">
                {t("table.totalPrizeFund")}
              </span>
              <span className="text-2xl sm:text-3xl font-black">
                {config.prize
                  ? `${config.prize.total_km}KM / ${config.prize.total_eur}€`
                  : t("table.comingSoon")}
              </span>
              {participantsLabel && (
                <span className="text-xs text-blue-100/80">{participantsLabel}</span>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3 md:max-w-2xl">
            {[
              { icon: <FaTrophy className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-300" />, pct: PRIZE_SPLIT.first, label: t("table.place1"), amount: config.prize ? `${config.prize.first_km}KM / ${config.prize.first_eur}€` : null },
              { icon: <FaMedal className="w-6 h-6 sm:w-7 sm:h-7 text-slate-200" />, pct: PRIZE_SPLIT.second, label: t("table.place2"), amount: config.prize ? `${config.prize.second_km}KM / ${config.prize.second_eur}€` : null },
              { icon: <FaAward className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />, pct: PRIZE_SPLIT.third, label: t("table.place3"), amount: config.prize ? `${config.prize.third_km}KM / ${config.prize.third_eur}€` : null },
            ].map((tile, i) => (
              <motion.div
                key={i}
                className="rounded-2xl border border-white/15 bg-white/[0.08] p-3 sm:p-4 text-center backdrop-blur-md"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
              >
                <div className="mx-auto mb-1.5 flex justify-center">{tile.icon}</div>
                <div className="font-black text-sm sm:text-lg leading-tight">
                  {tile.amount ?? t("table.fundShare", { pct: tile.pct })}
                </div>
                <div className="mt-0.5 text-[11px] sm:text-sm text-blue-100/80">
                  {tile.label} ({tile.pct}%)
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Empty state for a season that hasn't started yet */}
      {players.length === 0 && !config.completed ? (
        <motion.div
          className={`text-center py-14 px-6 mx-auto max-w-xl rounded-2xl border ${
            theme === "dark"
              ? "border-blue-500/30 bg-blue-500/5"
              : "border-blue-300 bg-blue-50/50"
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <FaTrophy
            className={`w-10 h-10 mx-auto mb-4 ${
              theme === "dark" ? "text-blue-400" : "text-blue-500"
            }`}
          />
          <p
            className={`font-semibold ${
              theme === "dark" ? "text-blue-300" : "text-blue-700"
            }`}
          >
            {t("table.newSeasonSoon")}
          </p>
        </motion.div>
      ) : (
        <>
          {/* ── Podium ── */}
          {podium.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
              {podiumOrder.map((player) => {
                const rank = rankOf(player);
                const medal = CL_MEDALS[Math.min(rank, 3) - 1];
                const isFirst = rank === 1;
                const prize = getPrizeAmount(rank);
                return (
                  <motion.div
                    key={player.id}
                    className={`relative overflow-hidden rounded-2xl bg-theme-card p-4 sm:p-5 ${
                      isFirst ? "order-first sm:order-none sm:pb-7 sm:pt-7" : ""
                    }`}
                    style={{
                      background: isDark
                        ? `linear-gradient(180deg, rgba(59,130,246,${isFirst ? 0.16 : 0.08}), transparent 75%)`
                        : `linear-gradient(180deg, rgba(59,130,246,${isFirst ? 0.1 : 0.05}), #ffffff 75%)`,
                      boxShadow: `0 18px 40px -26px ${medal.glow}`,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 + rank * 0.06 }}
                  >
                    <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: medal.ring }} />
                    <div className="flex items-center gap-3.5 sm:flex-col sm:text-center">
                      <div className="relative shrink-0">
                        <div
                          className={`rounded-full p-[3px] ${isFirst ? "h-16 w-16 sm:h-20 sm:w-20" : "h-14 w-14 sm:h-16 sm:w-16"}`}
                          style={{ background: medal.ring, boxShadow: `0 0 22px ${medal.glow}` }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={player.avatar_url} alt="" className="h-full w-full rounded-full bg-theme-card object-cover" />
                        </div>
                        <span
                          className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-black shadow-md"
                          style={{ background: medal.ring, color: medal.text }}
                        >
                          {rank}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 sm:w-full">
                        <div className="truncate text-base font-extrabold text-theme-foreground">{player.team_name}</div>
                        <div className="truncate text-xs text-theme-text-secondary">{player.user_name}</div>
                        <div className="mt-2 flex items-end gap-1.5 sm:justify-center">
                          <span className={`font-black leading-none tabular-nums text-theme-foreground ${isFirst ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"}`}>
                            {player.points}
                          </span>
                          <span className="pb-0.5 text-xs font-semibold text-theme-text-muted">{t("table.pts")}</span>
                        </div>
                      </div>
                    </div>
                    {prize && (
                      <div className="mt-3 flex sm:justify-center">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            isDark ? "bg-blue-500/15 text-blue-200" : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {prize}
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ── Standings ── */}
          <motion.div
            className="overflow-hidden rounded-2xl bg-theme-card shadow-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-5 w-1 rounded-full bg-gradient-to-b from-cyan-400 to-blue-600" />
                  <h3 className="text-base font-extrabold text-theme-foreground sm:text-lg">{t("table.paidLeague")}</h3>
                  <span className="rounded-full bg-theme-card-secondary px-2 py-0.5 text-[11px] font-bold text-theme-text-secondary">
                    {players.length}
                  </span>
                </div>
                <p className="mt-0.5 pl-3 text-xs text-theme-text-muted">
                  {config.completed ? t("table.finalStandings") : t("table.currentStandings")}
                </p>
              </div>
              <label className="relative block sm:w-64">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-theme-text-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("table.search")}
                  className="w-full rounded-xl bg-theme-card-secondary py-2 pl-9 pr-3 text-sm text-theme-foreground outline-none placeholder:text-theme-text-muted"
                />
              </label>
            </div>

            {/* column header (desktop) */}
            <div className="hidden items-center gap-3 bg-theme-card-secondary px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-theme-text-muted sm:flex">
              <div className="w-9 text-center">#</div>
              <div className="flex-1">{t("table.colPlayer")}</div>
              <div className="w-20 text-right">{t("table.colLastMd")}</div>
              <div className="w-20 text-right">{t("table.colTotal")}</div>
            </div>

            <ol>
              {filtered.map((player, i) => {
                const rank = rankOf(player);
                const prize = getPrizeAmount(rank);
                const inZone = !!prize;
                const medal = rank <= 3 ? CL_MEDALS[rank - 1] : null;
                const pct = range > 0 ? Math.max(6, Math.round(((player.points - minPts) / range) * 100)) : 100;
                const next = filtered[i + 1];
                const showCutoff = !query && inZone && next && !getPrizeAmount(rankOf(next));
                return (
                  <li key={player.id}>
                    <motion.div
                      className="relative flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-theme-card-secondary sm:px-5 sm:py-3"
                      style={
                        inZone
                          ? { background: `linear-gradient(90deg, rgba(59,130,246,${isDark ? 0.12 : 0.07}), transparent 65%)` }
                          : undefined
                      }
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(i, 20) * 0.02 }}
                    >
                      {inZone && <span className="absolute bottom-0 left-0 top-0 w-[3px] bg-gradient-to-b from-cyan-400 to-blue-600" />}

                      <div className="flex w-9 shrink-0 justify-center">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black tabular-nums ${
                            medal ? "" : "text-theme-text-secondary"
                          }`}
                          style={medal ? { background: medal.ring, color: medal.text, boxShadow: `0 4px 14px -4px ${medal.glow}` } : undefined}
                        >
                          {rank}
                        </span>
                      </div>

                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={player.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full bg-theme-card-secondary object-cover" />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-bold text-theme-foreground sm:text-[15px]">{player.team_name}</span>
                          {prize && (
                            <span
                              className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold sm:inline ${
                                isDark ? "bg-blue-500/15 text-blue-200" : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {prize}
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs text-theme-text-secondary">{player.user_name}</div>
                        <div className="mt-1.5 h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-theme-card-secondary">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.15 + Math.min(i, 20) * 0.02, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      <div className="hidden w-20 text-right text-sm font-semibold tabular-nums text-theme-text-secondary sm:block">
                        {player.last_md_points}
                      </div>
                      <div className="w-16 shrink-0 text-right sm:w-20">
                        <div className="text-lg font-black leading-none tabular-nums text-theme-foreground sm:text-xl">{player.points}</div>
                        <div className="mt-1 text-[10px] font-semibold text-theme-text-muted">
                          {rank === 1 ? (
                            <span className="text-blue-500">{t("table.leader")}</span>
                          ) : (
                            <>
                              <span className="sm:hidden">
                                {t("table.lastMdShort")} {player.last_md_points}
                              </span>
                              <span className="hidden sm:inline">−{leaderPts - player.points}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {showCutoff && (
                      <div className="flex items-center gap-2 px-5 py-1.5">
                        <span className="h-px flex-1 border-t border-dashed border-blue-500/50" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-500">{t("table.prizeZone")}</span>
                        <span className="h-px flex-1 border-t border-dashed border-blue-500/50" />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>

            {filtered.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-theme-text-muted">{t("table.noResults", { q: query })}</div>
            )}

            <div className="bg-theme-card-secondary px-5 py-3 text-center text-[11px] leading-relaxed text-theme-text-muted">
              {config.completed ? t("table.footerFinished") : t("table.footerUpdates")}
              {participantsCount !== null && ` ${t("table.footerParticipants", { count: participantsCount })}`}
              <br />
              {config.prize
                ? t("table.prizeFundLine", {
                    total: `${config.prize.total_km}KM / ${config.prize.total_eur}€`,
                    first: `${config.prize.first_km}KM/${config.prize.first_eur}€`,
                    second: `${config.prize.second_km}KM/${config.prize.second_eur}€`,
                    third: `${config.prize.third_km}KM/${config.prize.third_eur}€`,
                  })
                : t("table.prizeSplitLine", {
                    first: PRIZE_SPLIT.first,
                    second: PRIZE_SPLIT.second,
                    third: PRIZE_SPLIT.third,
                  })}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
