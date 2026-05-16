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
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import LoadingCard from "@/components/shared/LoadingCard";
import WCBackground from "@/components/shared/WCBackground";
import type { Tournament, TournamentStatus } from "@/types/predictor";
import { getLogoFilter } from "@/utils/predictor-logo";
import {
  localizedTournamentName,
  localizedTournamentShort,
  normalizeLang,
} from "@/utils/predictor-i18n";

const ACCENT_BORDER: Record<string, string> = {
  amber: "border-l-amber-500",
  gold: "border-l-amber-500",
  purple: "border-l-purple-600",
  blue: "border-l-blue-600",
  red: "border-l-red-600",
  green: "border-l-emerald-600",
};

const ACCENT_TEXT: Record<string, string> = {
  amber: "text-amber-500 dark:text-amber-400",
  gold: "text-amber-500 dark:text-amber-400",
  purple: "text-purple-600 dark:text-purple-400",
  blue: "text-blue-600 dark:text-blue-400",
  red: "text-red-600 dark:text-red-400",
  green: "text-emerald-600 dark:text-emerald-400",
};

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
    fetch("/api/predictor/tournaments")
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
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-300 text-xs font-bold uppercase tracking-widest mb-6"
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

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-4">
            {[
              t("features.tournamentWinner", "Tournament winner"),
              t("features.topScorer", "Top scorer"),
              t("features.bestPlayer", "Best player"),
              t("features.top4", "Top 4 teams"),
              t("features.groupWinners", "Group winners"),
              t("features.surprise", "Surprise team"),
            ].map((f) => (
              <span
                key={f}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  theme === "dark"
                    ? "bg-gray-800/60 border-gray-700 text-gray-300"
                    : "bg-white/70 border-gray-200 text-gray-700"
                }`}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Tournament grid */}
      <section className="relative z-10 px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          {tournaments.length === 0 ? (
            <div
              className={`rounded-lg border border-dashed p-12 text-center ${
                theme === "dark"
                  ? "border-gray-700 text-gray-400"
                  : "border-gray-300 text-gray-500"
              }`}
            >
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-base font-semibold mb-1">
                {t("empty.title", "No active tournaments yet")}
              </p>
              <p className="text-sm">
                {t(
                  "empty.subtitle",
                  "Check back soon — new prediction tournaments drop before major events.",
                )}
              </p>
            </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {others.map((tr) => (
                      <TournamentCard
                        key={tr.id}
                        tournament={tr}
                        theme={theme}
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

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: any;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-amber-500" />
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
  const accent = tournament.accent_color || "amber";
  const borderClass = ACCENT_BORDER[accent] ?? "border-l-amber-500";
  const textClass = ACCENT_TEXT[accent] ?? "text-amber-500 dark:text-amber-400";
  const badge = STATUS_BADGE[tournament.status];
  const displayName = localizedTournamentName(tournament, lang);
  const displayShort = localizedTournamentShort(tournament, lang);

  return (
    <Link
      href={`/predictor/${tournament.slug}`}
      className="block h-full group"
    >
      <div
        className={`relative flex flex-col h-full ${large ? "p-6 md:p-7" : "p-5 md:p-6"} rounded-lg border-l-4 ${borderClass} transition-all duration-300 hover:-translate-y-1 ${
          theme === "dark"
            ? "bg-gray-800/60 border border-gray-700 hover:bg-gray-800/80"
            : "bg-white/80 border border-gray-200 hover:bg-white hover:shadow-md"
        }`}
      >
        {tournament.banner_image_url && large && (
          <div className="absolute inset-0 rounded-lg overflow-hidden opacity-10 pointer-events-none">
            <Image
              src={tournament.banner_image_url}
              alt=""
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="relative z-10 flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {tournament.logo_url ? (
              <Image
                src={tournament.logo_url}
                alt={displayName}
                width={36}
                height={36}
                className="w-9 h-9 object-contain"
                style={{
                  filter: getLogoFilter(
                    tournament.logo_url,
                    tournament.accent_color,
                  ),
                }}
              />
            ) : (
              <Trophy className={`w-7 h-7 ${textClass}`} />
            )}
            <h3
              className={`${large ? "text-xl md:text-2xl" : "text-lg"} font-bold ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}
            >
              {displayName}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {tournament.require_approval && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                  theme === "dark"
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/40"
                    : "bg-amber-50 text-amber-700 border border-amber-300"
                }`}
              >
                <Lock className="w-3 h-3" />
                Zatvoren
              </span>
            )}
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${badge.cls}`}
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

        <div className="relative z-10 flex flex-wrap gap-3 text-xs text-theme-text-secondary mb-4">
          {tournament.starts_at && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(tournament.starts_at).toLocaleDateString()}
            </span>
          )}
          {tournament.registration_lock_at && (
            <span className="inline-flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              {new Date(tournament.registration_lock_at).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {tournament.prize_pool_amount != null && (
            <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
              <Trophy className="w-3.5 h-3.5" />
              {tournament.prize_pool_amount} {tournament.prize_pool_currency}
            </span>
          )}
        </div>

        {tournament.sponsor_name && (
          <p className="relative z-10 text-[11px] text-theme-text-secondary mb-3">
            Sponsor: <span className="font-semibold">{tournament.sponsor_name}</span>
          </p>
        )}

        <span
          className={`relative z-10 inline-flex items-center gap-1 text-sm font-semibold ${textClass} group-hover:gap-2 transition-all duration-300 mt-auto`}
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
