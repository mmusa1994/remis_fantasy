"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Calendar,
  Lock,
  X,
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
  const [guideOpen, setGuideOpen] = useState(false);

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
  // List page stays clean. bg + theme music only appear on the specific
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
            className="mb-6 flex items-center justify-center gap-3"
          >
            <span
              className={`h-px w-8 ${
                theme === "dark" ? "bg-predictor-accent-dark/55" : "bg-predictor-primary/70"
              }`}
            />
            <span
              className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${
                theme === "dark" ? "text-predictor-accent-dark/90" : "text-predictor-accent-light/95"
              }`}
            >
              {t("badge", "Remis Predictor")}
            </span>
            <span
              className={`h-px w-8 ${
                theme === "dark" ? "bg-predictor-accent-dark/55" : "bg-predictor-primary/70"
              }`}
            />
          </motion.div>

          <h1
            className={`text-3xl md:text-5xl font-black mb-4 md:mb-6 leading-tight ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            {t("hero.title", "Predict. Compete. Win.")}
          </h1>
          <p
            className={`text-sm md:text-base leading-relaxed mb-10 max-w-3xl mx-auto ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {t(
              "hero.subtitle",
              "Tournament winner, top scorer, best goalkeeper, top 4 teams. call every shot. Climb the leaderboard. Claim the rewards.",
            )}
          </p>

          {/* CTA: refined, no wand/sparkles. Sophisticated split button with monospace price. */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/create-tournament"
              className="group inline-flex items-center gap-2 rounded-full bg-predictor-primary px-7 py-3.5 text-sm font-bold text-gray-900 transition-all duration-200 hover:bg-predictor-primary-hover"
            >
              {t("cta.create", "Create your tournament")}
              <span className="font-mono text-xs tracking-wider opacity-70">€2</span>
              <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/predictor/my-tournaments"
              className={`inline-flex items-center rounded-full border px-5 py-3.5 text-sm font-semibold transition-colors ${
                theme === "dark"
                  ? "border-white/15 text-gray-300 hover:border-amber-300/40 hover:text-amber-200"
                  : "border-gray-300 text-gray-700 hover:border-predictor-primary/70 hover:text-predictor-accent-light"
              }`}
            >
              {t("cta.myTournaments", "My tournaments")}
            </Link>
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className={`inline-flex items-center rounded-full border px-5 py-3.5 text-sm font-semibold transition-colors ${
                theme === "dark"
                  ? "border-white/15 text-gray-300 hover:border-amber-300/40 hover:text-amber-200"
                  : "border-gray-300 text-gray-700 hover:border-predictor-primary/70 hover:text-predictor-accent-light"
              }`}
            >
              {t("guide.trigger", "How it works")}
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={`mt-5 text-[11px] md:text-xs tracking-wide ${
              theme === "dark" ? "text-gray-500" : "text-gray-500"
            }`}
          >
            {t(
              "cta.tagline",
              "Run a private league for friends, or a public tournament for the whole community.",
            )}
          </motion.p>

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
                    icon={undefined}
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
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                    <SectionHeader
                      icon={undefined}
                      title={t("sections.all", "All tournaments")}
                    />
                    <Link
                      href="/create-tournament"
                      className={`group inline-flex items-center gap-2 border-b text-[11px] font-semibold uppercase tracking-[0.18em] pb-0.5 transition-colors ${
                        theme === "dark"
                          ? "border-amber-300/30 text-amber-300/85 hover:border-amber-300/70 hover:text-amber-200"
                          : "border-predictor-primary/50 text-predictor-accent-light/90 hover:border-predictor-primary hover:text-predictor-accent-light"
                      }`}
                      title={t("cta.createInline", "Create your own tournament. €2")}
                    >
                      {t("cta.createInline", "Create your own")}
                      <span className="font-mono text-[10px] tracking-wider opacity-70">
                        €2
                      </span>
                      <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </Link>
                  </div>
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

      <GuideModal open={guideOpen} onClose={() => setGuideOpen(false)} theme={theme} />
    </main>
  );
}

function GuideModal({
  open,
  onClose,
  theme,
}: {
  open: boolean;
  onClose: () => void;
  theme: string;
}) {
  const { t } = useTranslation("predictor");
  const dark = theme === "dark";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const steps = [
    {
      num: "01",
      title: t("guide.steps.1.title", "Choose a template"),
      desc: t(
        "guide.steps.1.desc",
        "Pick a ready-made tournament template (e.g. FIFA World Cup 2026) or start from scratch. Templates come pre-loaded with groups, categories, and scoring rules.",
      ),
    },
    {
      num: "02",
      title: t("guide.steps.2.title", "Name and customize"),
      desc: t(
        "guide.steps.2.desc",
        "Give your tournament a name, pick an accent color, and write a short description. The URL slug is auto-generated from the name.",
      ),
    },
    {
      num: "03",
      title: t("guide.steps.3.title", "Pay or use a credit"),
      desc: t(
        "guide.steps.3.desc",
        "Creating a tournament costs €2 (one-time). If you have free credits, it's instant. Payment is secure via Stripe.",
      ),
    },
    {
      num: "04",
      title: t("guide.steps.4.title", "Configure in the editor"),
      desc: t(
        "guide.steps.4.desc",
        "After creation, the full editor opens. Set up prediction categories, matches, rules, rewards, branding, and visibility. Everything is bilingual (BS/EN).",
      ),
    },
    {
      num: "05",
      title: t("guide.steps.5.title", "Publish and share"),
      desc: t(
        "guide.steps.5.desc",
        "Switch the status to 'Published' and share the link. Friends open it, sign in, and submit their predictions before the lock date.",
      ),
    },
  ];

  const features = [
    {
      title: t("guide.features.templates.title", "Templates"),
      desc: t(
        "guide.features.templates.desc",
        "World Cup 2026 template with all 48 teams, 12 groups, knockout rounds, and scoring pre-configured.",
      ),
    },
    {
      title: t("guide.features.categories.title", "Prediction types"),
      desc: t(
        "guide.features.categories.desc",
        "Winner, top scorer, group winners, exact scores, ranked picks, free text, and more.",
      ),
    },
    {
      title: t("guide.features.matches.title", "Match predictions"),
      desc: t(
        "guide.features.matches.desc",
        "Add individual matches with per-match scoring. Lock by match or by round.",
      ),
    },
    {
      title: t("guide.features.bilingual.title", "Bilingual"),
      desc: t(
        "guide.features.bilingual.desc",
        "Every label, rule, and reward can be written in both Bosnian and English. Users see their preferred language.",
      ),
    },
    {
      title: t("guide.features.privacy.title", "Public or private"),
      desc: t(
        "guide.features.privacy.desc",
        "Open to everyone, or require admin approval for each member. You control who plays.",
      ),
    },
    {
      title: t("guide.features.scoring.title", "Auto-scoring"),
      desc: t(
        "guide.features.scoring.desc",
        "Set correct answers in the editor. Points are calculated automatically and the leaderboard updates in real time.",
      ),
    },
  ];

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="guide-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 z-[9998] ${
              dark ? "bg-black/70" : "bg-black/40"
            } backdrop-blur-sm`}
            onClick={onClose}
          />
          <motion.div
            key="guide-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto pointer-events-none"
          >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`pointer-events-auto relative mx-4 my-8 w-full max-w-2xl rounded-3xl border shadow-2xl sm:my-12 ${
              dark
                ? "border-white/10 bg-gray-900 shadow-black/40"
                : "border-gray-200 bg-white shadow-gray-300/40"
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between border-b px-6 py-5 sm:px-8 ${
                dark ? "border-white/8" : "border-gray-200"
              }`}
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span
                    className={`h-px w-6 ${
                      dark ? "bg-predictor-accent-dark/55" : "bg-predictor-accent-light/60"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${
                      dark ? "text-predictor-accent-dark/90" : "text-predictor-accent-light/95"
                    }`}
                  >
                    {t("guide.eyebrow", "Guide")}
                  </span>
                </div>
                <h2
                  className={`text-xl font-black tracking-tight ${
                    dark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {t("guide.title", "How to create a tournament")}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`flex-shrink-0 rounded-xl p-2 transition-colors ${
                  dark
                    ? "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Steps */}
            <div className="px-6 py-7 sm:px-8">
              <ol className="space-y-6">
                {steps.map((step) => (
                  <li key={step.num} className="flex gap-5">
                    <span
                      className={`flex-shrink-0 select-none font-mono text-sm font-semibold tracking-wider pt-0.5 ${
                        dark ? "text-predictor-accent-dark/80" : "text-predictor-accent-light/80"
                      }`}
                      style={{ width: "2rem" }}
                    >
                      {step.num}
                    </span>
                    <div
                      className="flex-1 border-l pl-5 pb-1"
                      style={{
                        borderColor: dark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(17,24,39,0.08)",
                      }}
                    >
                      <h3
                        className={`mb-1 text-sm font-bold ${
                          dark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p
                        className={`text-[13px] leading-relaxed ${
                          dark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {step.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Features grid */}
            <div
              className={`border-t px-6 py-7 sm:px-8 ${
                dark ? "border-white/8" : "border-gray-200"
              }`}
            >
              <div className="mb-5 flex items-center gap-3">
                <span
                  className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${
                    dark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {t("guide.featuresTitle", "What's included")}
                </span>
                <span
                  className={`h-px flex-1 ${dark ? "bg-white/8" : "bg-gray-200"}`}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {features.map((f) => (
                  <div key={f.title}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span
                        className={`mt-0.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                          dark ? "bg-predictor-accent-dark/70" : "bg-predictor-accent-light/70"
                        }`}
                      />
                      <p
                        className={`text-xs font-bold ${
                          dark ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {f.title}
                      </p>
                    </div>
                    <p
                      className={`pl-4 text-[12px] leading-relaxed ${
                        dark ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      {f.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer CTA */}
            <div
              className={`flex items-center justify-between gap-3 border-t px-6 py-5 sm:px-8 ${
                dark ? "border-white/8" : "border-gray-200"
              }`}
            >
              <p
                className={`text-[11px] ${
                  dark ? "text-gray-500" : "text-gray-500"
                }`}
              >
                {t("guide.footerHint", "Ready? It takes under 2 minutes.")}
              </p>
              <Link
                href="/create-tournament"
                onClick={onClose}
                className="group inline-flex items-center gap-2 rounded-full bg-predictor-primary px-5 py-2.5 text-sm font-bold text-gray-900 transition-all hover:bg-predictor-primary-hover"
              >
                {t("guide.footerCta", "Create now")}
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
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
          isDark ? "bg-predictor-primary/10" : "bg-predictor-primary/20"
        }`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 opacity-[0.04] ${
          isDark ? "bg-[radial-gradient(circle_at_30%_20%,#fff_0,transparent_50%)]" : ""
        }`}
      />

      <div className="relative px-6 py-14 md:px-12 md:py-20 flex flex-col items-center text-center">
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
            "Predictor turniri se pojavljuju samo neposredno prije velikih takmičenja. Svjetsko prvenstvo, Euro, Liga prvaka. Vrati se uskoro i pripremi se da napadneš vrh tabele.",
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
            href="/create-tournament"
            className="group inline-flex items-center gap-2 rounded-full bg-predictor-primary px-6 py-2.5 text-sm font-bold text-gray-900 transition-all hover:bg-predictor-primary-hover"
          >
            {t("cta.create", "Create your tournament")}
            <span className="font-mono text-xs tracking-wider opacity-70">€2</span>
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <Link
            href="/premier-league/registration"
            className={`inline-flex items-center rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
              isDark
                ? "border-white/15 text-gray-300 hover:border-amber-300/40 hover:text-amber-200"
                : "border-gray-300 text-gray-700 hover:border-predictor-primary/70 hover:text-predictor-accent-light"
            }`}
          >
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
              title: t("empty.preview.prizes.title", "Prave nagrade"),
              desc: t(
                "empty.preview.prizes.desc",
                "Sponzorisani turniri sa konkretnim nagradama.",
              ),
            },
            {
              title: t("empty.preview.leaderboard.title", "Globalna tabela"),
              desc: t(
                "empty.preview.leaderboard.desc",
                "Bodovi se zbrajaju kroz cijeli turnir. kapnij vrh.",
              ),
            },
            {
              title: t("empty.preview.lock.title", "Tačno predviđanje"),
              desc: t(
                "empty.preview.lock.desc",
                "Predaj tipove prije starta. Sve fer i transparentno.",
              ),
            },
          ].map(({ title, desc }) => (
            <div
              key={title}
              className={`p-4 rounded-2xl text-left border transition-colors ${
                isDark
                  ? "bg-white/[0.03] border-white/10 hover:bg-white/[0.05]"
                  : "bg-white/70 border-gray-200/80 hover:bg-white"
              }`}
            >
              <div className="flex items-baseline gap-2.5 mb-1.5">
                <span
                  className={`mt-0.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                    isDark ? "bg-predictor-accent-dark/80" : "bg-predictor-accent-light/80"
                  }`}
                />
                <p
                  className={`text-xs font-bold uppercase tracking-wide ${
                    isDark ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  {title}
                </p>
              </div>
              <p
                className={`pl-4 text-[11px] leading-relaxed ${
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
  title,
}: {
  icon?: any;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-theme-text-secondary">
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
  const { t, i18n } = useTranslation("predictor");
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
        {/* Soft accent halo in the corner. purely decorative */}
        <span
          aria-hidden
          className={`pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-40 ${textClass.split(" ")[0]}`}
          style={{ background: "currentColor", opacity: 0.04 }}
        />

        {tournament.banner_image_url && (
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none opacity-20">
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
                className={`inline-flex items-center text-[10px] uppercase font-black px-2.5 py-1 rounded-full ${
                  theme === "dark"
                    ? `${ac.bg15} ${ac.textBrighter} border ${ac.border500_40}`
                    : `${ac.bgPale} ${ac.textDeeper} border ${ac.border300}`
                }`}
              >
                {t("card.closed", "Closed")}
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
              {new Date(tournament.starts_at).toLocaleDateString(lang === "bs" ? "sr-Latn" : "en-GB")}
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
              {new Date(tournament.registration_lock_at).toLocaleString(
                lang === "bs" ? "sr-Latn" : "en-GB",
                { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
              )}
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
            <span className="opacity-70">{t("card.sponsor", "Sponsor")} · </span>
            <span className="font-bold">{tournament.sponsor_name}</span>
          </p>
        )}

        <span
          className={`relative z-10 inline-flex items-center gap-1.5 text-sm font-bold ${textClass} group-hover:gap-2 transition-all duration-300 mt-auto`}
        >
          {tournament.require_approval
            ? t("card.requestAccess", "View and request access")
            : t("card.openPredictor", "Open predictor")}
          <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </Link>
  );
}
