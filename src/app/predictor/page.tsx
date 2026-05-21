"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Trophy,
  Calendar,
  Lock,
  Sparkles,
  CheckCircle2,
  Star,
  BellRing,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import LoadingCard from "@/components/shared/LoadingCard";
import WCBackground from "@/components/shared/WCBackground";
import type { Tournament, TournamentStatus } from "@/types/predictor";
import { getLogoFilter } from "@/utils/predictor-logo";
import { getAccentClasses } from "@/utils/predictor-accent";
import {
  localizedTournamentName,
  localizedTournamentShort,
  normalizeLang,
} from "@/utils/predictor-i18n";

const STATUS_BADGE: Record<TournamentStatus, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-gray-500/20 text-gray-400" },
  published: {
    label: "Live",
    cls: "bg-emerald-500/20 text-emerald-500 dark:text-emerald-400",
  },
  locked: {
    label: "Locked",
    cls: "bg-amber-500/20 text-amber-600 dark:text-amber-300",
  },
  finished: {
    label: "Finished",
    cls: "bg-blue-500/20 text-blue-600 dark:text-blue-300",
  },
};

export default function PredictorIndexPage() {
  const { theme } = useTheme();
  const { t, ready } = useTranslation("predictor");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/predictor/tournaments", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setTournaments(d ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !ready) {
    return (
      <main className="w-full min-h-screen overflow-x-hidden bg-theme-background">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingCard
            title={t("loading", "Loading…")}
            description={t("loadingDesc", "Fetching tournaments")}
            className="w-full max-w-md mx-auto"
          />
        </div>
      </main>
    );
  }

  const featured = tournaments.filter((x) => x.is_featured);
  const others = tournaments.filter((x) => !x.is_featured);
  // List page stays clean — bg + theme music only appear on the specific
  // tournament page that admin opted into via the settings picker.
  const featuredThemeBg =
    featured.find((t) => t.theme_background_image)?.theme_background_image ??
    null;

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden bg-theme-background">
      {featuredThemeBg && (
        <WCBackground
          variant="hero"
          src={featuredThemeBg}
          opacity={0.3}
          overlay={0.6}
          fixed
        />
      )}
      {/* Hero */}
      <section className="relative z-10 overflow-hidden pb-10 px-4 pt-6 md:pt-10">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest mb-6 ${
              theme === "dark"
                ? "bg-white/5 text-theme-foreground/85 border-white/10"
                : "bg-black/[0.04] text-theme-foreground/80 border-black/10"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t("badge", "Remis Predictor")}
          </motion.div>

          <h1
            className={`text-3xl md:text-5xl font-black mb-4 md:mb-6 leading-tight ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            {t("hero.title", "Predict. Compete. Win.")}
          </h1>
          <p
            className={`text-sm md:text-base leading-relaxed mb-8 max-w-3xl mx-auto ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {t(
              "hero.subtitle",
              "Tournament winner, top scorer, best goalkeeper, top 4 teams — call every shot. Climb the leaderboard. Claim the rewards.",
            )}
          </p>

        </div>
      </section>

      {/* Tournament grid */}
      <section className="relative z-10 px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          {tournaments.length === 0 ? (
            <PredictorEmptyState theme={theme} t={t} />
          ) : (
            <>
              {featured.length > 0 && (
                <>
                  <SectionHeader
                    icon={Star}
                    title={t("sections.featured", "Featured")}
                  />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-10">
                    {featured.map((tr) => (
                      <TournamentCard
                        key={tr.id}
                        tournament={tr}
                        theme={theme}
                        large
                      />
                    ))}
                  </div>
                </>
              )}

              {others.length > 0 && (
                <>
                  <SectionHeader
                    icon={Trophy}
                    title={t("sections.all", "All tournaments")}
                  />
                  <div
                    className={`grid gap-5 md:gap-6 ${
                      others.length === 1
                        ? "grid-cols-1 max-w-3xl mx-auto"
                        : others.length === 2
                        ? "grid-cols-1 md:grid-cols-2"
                        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    }`}
                  >
                    {others.map((tr) => (
                      <TournamentCard
                        key={tr.id}
                        tournament={tr}
                        theme={theme}
                        large={others.length <= 2}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function PredictorEmptyState({
  theme,
  t,
}: {
  theme: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  const isDark = theme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-3xl border ${
        isDark
          ? "border-white/10 bg-gradient-to-br from-gray-900/80 via-gray-900/50 to-gray-950/80"
          : "border-gray-200/80 bg-gradient-to-br from-white via-white to-gray-50/80 shadow-sm"
      }`}
    >
      {/* Decorative blurred orbs */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full blur-3xl ${
          isDark ? "bg-purple-500/10" : "bg-purple-400/15"
        }`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full blur-3xl ${
          isDark ? "bg-amber-400/10" : "bg-amber-300/15"
        }`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 opacity-[0.04] ${
          isDark ? "bg-[radial-gradient(circle_at_30%_20%,#fff_0,transparent_50%)]" : ""
        }`}
      />

      <div className="relative px-6 py-14 md:px-12 md:py-20 flex flex-col items-center text-center">
        {/* Iconic trophy with halo */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative mb-6"
        >
          <span
            aria-hidden
            className={`absolute inset-0 rounded-full blur-2xl ${
              isDark ? "bg-amber-400/30" : "bg-amber-300/40"
            }`}
          />
          <div
            className={`relative inline-flex items-center justify-center w-20 h-20 rounded-2xl ${
              isDark
                ? "bg-gradient-to-br from-amber-400/15 via-amber-500/10 to-amber-600/5 border border-amber-400/30 shadow-[0_8px_30px_rgb(245,158,11,0.15)]"
                : "bg-gradient-to-br from-amber-100 via-amber-50 to-white border border-amber-200 shadow-md"
            }`}
          >
            <Trophy
              className={`w-10 h-10 ${
                isDark ? "text-amber-300" : "text-amber-500"
              }`}
              strokeWidth={1.8}
            />
            <motion.span
              aria-hidden
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className={`absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full ${
                isDark
                  ? "bg-amber-300 shadow-lg shadow-amber-500/50"
                  : "bg-amber-400 shadow-md shadow-amber-300/60"
              }`}
            >
              <Sparkles className="w-3 h-3 text-white" />
            </motion.span>
          </div>
        </motion.div>

        {/* Eyebrow */}
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className={`inline-flex items-center gap-1.5 text-[10px] md:text-[11px] uppercase tracking-[0.18em] font-bold px-3 py-1 rounded-full mb-3 border ${
            isDark
              ? "border-white/10 bg-white/5 text-amber-300/90"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          <Sparkles className="w-3 h-3" />
          {t("empty.eyebrow", "Coming soon")}
        </motion.span>

        <motion.h3
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.45 }}
          className={`text-2xl md:text-3xl font-black tracking-tight mb-3 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {t("empty.title", "No active tournaments yet")}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={`max-w-xl text-sm md:text-base leading-relaxed mb-8 ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {t(
            "empty.subtitle",
            "Predictor turniri se pojavljuju samo neposredno prije velikih takmičenja — Svjetsko prvenstvo, Euro, Liga prvaka. Vrati se uskoro i pripremi se da napadneš vrh tabele.",
          )}
        </motion.p>

        {/* CTA pair */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-3 mb-10"
        >
          <Link
            href="/premier-league/fpl-live"
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isDark
                ? "bg-gradient-to-r from-amber-400 to-amber-500 text-gray-900 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:-translate-y-0.5"
                : "bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-md shadow-amber-300/40 hover:shadow-amber-400/50 hover:-translate-y-0.5"
            }`}
          >
            <Trophy className="w-4 h-4" />
            {t("empty.exploreFpl", "Otvori FPL Live")}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/premier-league/registration"
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border transition-all ${
              isDark
                ? "border-white/15 bg-white/5 text-gray-200 hover:bg-white/10 hover:border-white/20"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            <BellRing className="w-4 h-4" />
            {t("empty.notify", "Obavijesti me kad krene")}
          </Link>
        </motion.div>

        {/* Feature preview cards */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.55 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl"
        >
          {[
            {
              icon: Trophy,
              title: t("empty.preview.prizes.title", "Prave nagrade"),
              desc: t(
                "empty.preview.prizes.desc",
                "Sponzorisani turniri sa konkretnim nagradama.",
              ),
            },
            {
              icon: Star,
              title: t("empty.preview.leaderboard.title", "Globalna tabela"),
              desc: t(
                "empty.preview.leaderboard.desc",
                "Bodovi se zbrajaju kroz cijeli turnir — kapnij vrh.",
              ),
            },
            {
              icon: CheckCircle2,
              title: t("empty.preview.lock.title", "Tačno predviđanje"),
              desc: t(
                "empty.preview.lock.desc",
                "Predaj tipove prije starta. Sve fer i transparentno.",
              ),
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className={`p-4 rounded-2xl text-left border transition-colors ${
                isDark
                  ? "bg-white/[0.03] border-white/10 hover:bg-white/[0.05]"
                  : "bg-white/70 border-gray-200/80 hover:bg-white"
              }`}
            >
              <Icon
                className={`w-4 h-4 mb-2 ${
                  isDark ? "text-amber-300/80" : "text-amber-500"
                }`}
              />
              <p
                className={`text-xs font-bold uppercase tracking-wide mb-1 ${
                  isDark ? "text-gray-200" : "text-gray-800"
                }`}
              >
                {title}
              </p>
              <p
                className={`text-[11px] leading-relaxed ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {desc}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: any;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-theme-text-secondary opacity-80" />
      <h2 className="text-sm font-bold uppercase tracking-widest text-theme-text-secondary">
        {title}
      </h2>
      <div className="flex-1 h-px bg-theme-border" />
    </div>
  );
}

function TournamentCard({
  tournament,
  theme,
  large,
}: {
  tournament: Tournament;
  theme: string;
  large?: boolean;
}) {
  const { i18n } = useTranslation("predictor");
  const lang = normalizeLang(i18n.language);
  const ac = getAccentClasses(tournament.accent_color);
  const borderClass = ac.border;
  const textClass = ac.text;
  const badge = STATUS_BADGE[tournament.status];
  const displayName = localizedTournamentName(tournament, lang);
  const displayShort = localizedTournamentShort(tournament, lang);

  return (
    <Link
      href={`/predictor/${tournament.slug}`}
      className="block h-full group"
    >
      <div
        className={`relative flex flex-col h-full ${large ? "p-7 md:p-9" : "p-5 md:p-6"} rounded-3xl border-l-4 ${borderClass} transition-all duration-300 hover:-translate-y-0.5 overflow-hidden ${
          theme === "dark"
            ? "bg-gradient-to-br from-gray-800/70 via-gray-800/60 to-gray-900/70 border border-gray-700/80 hover:border-gray-600 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30"
            : "bg-gradient-to-br from-white via-white to-gray-50/60 border border-gray-200/80 hover:border-gray-300 shadow-sm hover:shadow-xl hover:shadow-gray-900/5"
        }`}
      >
        {/* Soft accent halo in the corner — purely decorative */}
        <span
          aria-hidden
          className={`pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-40 ${textClass.split(" ")[0]}`}
          style={{ background: "currentColor", opacity: 0.04 }}
        />

        {tournament.banner_image_url && large && (
          <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-10 pointer-events-none">
            <Image
              src={tournament.banner_image_url}
              alt=""
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="relative z-10 flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {tournament.logo_url ? (
              <div
                className={`flex-shrink-0 inline-flex items-center justify-center rounded-2xl overflow-hidden transition-transform duration-300 group-hover:scale-105 ${
                  large
                    ? "w-20 h-20 md:w-24 md:h-24"
                    : "w-14 h-14 md:w-16 md:h-16"
                } ${
                  theme === "dark"
                    ? "bg-gray-900/80 border border-gray-700/80 shadow-lg shadow-black/30 ring-1 ring-white/5"
                    : "bg-white border border-gray-200 shadow-md ring-1 ring-gray-100"
                }`}
              >
                <Image
                  src={tournament.logo_url}
                  alt={displayName}
                  width={large ? 128 : 80}
                  height={large ? 128 : 80}
                  className={`${
                    large
                      ? "w-[72px] h-[72px] md:w-[88px] md:h-[88px]"
                      : "w-[52px] h-[52px] md:w-[58px] md:h-[58px]"
                  } object-contain`}
                  style={{
                    filter: getLogoFilter(
                      tournament.logo_url,
                      tournament.accent_color,
                    ),
                  }}
                />
              </div>
            ) : (
              <div
                className={`flex-shrink-0 inline-flex items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 ${
                  large
                    ? "w-20 h-20 md:w-24 md:h-24"
                    : "w-14 h-14 md:w-16 md:h-16"
                } ${
                  theme === "dark"
                    ? "bg-gray-900/80 border border-gray-700/80 shadow-lg shadow-black/30 ring-1 ring-white/5"
                    : "bg-white border border-gray-200 shadow-md ring-1 ring-gray-100"
                }`}
              >
                <Trophy
                  className={`${large ? "w-12 h-12" : "w-8 h-8"} ${textClass}`}
                />
              </div>
            )}
            <h3
              className={`${large ? "text-2xl md:text-3xl" : "text-lg"} font-bold leading-tight tracking-tight ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {displayName}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end flex-shrink-0">
            {tournament.require_approval && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] uppercase font-black px-2.5 py-1 rounded-full ${
                  theme === "dark"
                    ? `${ac.bg15} ${ac.textBrighter} border ${ac.border500_40}`
                    : `${ac.bgPale} ${ac.textDeeper} border ${ac.border300}`
                }`}
              >
                <Lock className="w-3 h-3" />
                Zatvoren
              </span>
            )}
            <span
              className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${badge.cls}`}
            >
              {badge.label}
            </span>
          </div>
        </div>

        {displayShort && (
          <p
            className={`relative z-10 text-sm leading-relaxed mb-4 flex-grow ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {displayShort}
          </p>
        )}

        <div className="relative z-10 flex flex-wrap items-center gap-1.5 mb-3">
          {tournament.starts_at && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full ${
                theme === "dark"
                  ? "bg-gray-900/40 text-gray-400 border border-gray-700/60"
                  : "bg-gray-50 text-gray-600 border border-gray-200/80"
              }`}
            >
              <Calendar className="w-3 h-3 opacity-70" />
              {new Date(tournament.starts_at).toLocaleDateString()}
            </span>
          )}
          {tournament.registration_lock_at && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full ${
                theme === "dark"
                  ? "bg-gray-900/40 text-gray-400 border border-gray-700/60"
                  : "bg-gray-50 text-gray-600 border border-gray-200/80"
              }`}
            >
              <Lock className="w-3 h-3 opacity-70" />
              {new Date(tournament.registration_lock_at).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {tournament.prize_pool_amount != null && (
            <span
              className={`inline-flex items-baseline gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                theme === "dark"
                  ? "bg-white/5 text-theme-foreground/85 border-white/10"
                  : "bg-black/[0.04] text-theme-foreground/80 border-black/10"
              }`}
            >
              <Trophy className="w-3 h-3 self-center opacity-70" />
              <span className="text-[13px] font-black tabular-nums leading-none">
                {tournament.prize_pool_amount}
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold leading-none">
                {tournament.prize_pool_currency}
              </span>
            </span>
          )}
        </div>

        {tournament.sponsor_name && (
          <p
            className={`relative z-10 text-[10px] uppercase tracking-wider mb-3 ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}
          >
            <span className="opacity-70">Sponzor · </span>
            <span className="font-bold">{tournament.sponsor_name}</span>
          </p>
        )}

        <span
          className={`relative z-10 inline-flex items-center gap-1.5 text-sm font-bold ${textClass} group-hover:gap-2.5 transition-all duration-300 mt-auto`}
        >
          {tournament.require_approval ? (
            <>
              <Lock className="w-4 h-4" />
              Pogledaj i zatraži učešće
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Otvori predictor
            </>
          )}
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}
