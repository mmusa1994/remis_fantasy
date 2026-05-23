"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

interface Tournament {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  status: string;
  visibility: string;
  accent_color: string | null;
  created_at: string | null;
  prize_pool_amount: number | null;
  prize_pool_currency: string | null;
  logo_url: string | null;
  created_via: string | null;
}

interface Props {
  tournaments: Tournament[];
  credits: number;
}

const STATUS_KEYS = ["draft", "published", "locked", "finished"] as const;

export default function MyTournamentsClient({ tournaments, credits }: Props) {
  const { t } = useTranslation("predictor");
  const { theme } = useTheme();
  const dark = theme === "dark";
  const hasCredits = credits > 0;

  return (
    <main className="relative min-h-screen w-full bg-theme-background theme-transition">
      {/* Subtle decorative gradient — matches /create-tournament aesthetic */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-[420px] ${
          dark
            ? "bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(245,158,11,0.05),transparent_70%)]"
            : "bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(245,158,11,0.07),transparent_70%)]"
        }`}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-5 pb-24 pt-8 sm:px-6 sm:pt-12">
        {/* Top nav */}
        <nav className="mb-12 flex items-center justify-between text-xs">
          <Link
            href="/predictor"
            className={`inline-flex items-center gap-1.5 transition-colors ${
              dark
                ? "text-gray-500 hover:text-gray-300"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span aria-hidden>←</span>
            {t("create.mine.back", "Predictor")}
          </Link>
          <Link
            href="/create-tournament"
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all ${
              dark
                ? "bg-predictor-primary text-gray-900 hover:bg-predictor-primary-hover"
                : "bg-predictor-primary text-gray-900 hover:bg-predictor-primary-hover"
            }`}
          >
            {t("create.mine.newButton", "New tournament")}
            <span aria-hidden>→</span>
          </Link>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <div className="mb-6 flex items-center gap-3">
            <span
              className={`h-px w-10 flex-shrink-0 ${
                dark ? "bg-predictor-accent-dark/55" : "bg-predictor-accent-light/60"
              }`}
            />
            <span
              className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${
                dark ? "text-predictor-accent-dark/90" : "text-predictor-accent-light/95"
              }`}
            >
              {t("create.mine.eyebrow", "My tournaments")}
            </span>
          </div>
          <h1 className="mb-4 text-3xl font-black leading-tight tracking-tight text-theme-heading-primary sm:text-4xl md:text-5xl">
            {t("create.mine.title", "Your collection")}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-theme-text-secondary sm:text-base">
            {t(
              "create.mine.subtitle",
              "Every tournament you've created. Click any one to open the editor and keep building.",
            )}
          </p>

          {hasCredits && (
            <div
              className={`mt-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                dark
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                  : "border-emerald-500/40 bg-emerald-50 text-emerald-800"
              }`}
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  dark ? "bg-emerald-300" : "bg-emerald-600"
                }`}
              />
              {t("create.mine.credits.label", "You have free credits")} ·{" "}
              <strong className="font-bold">
                {t("create.mine.credits.amount", {
                  count: credits,
                  defaultValue: `${credits} credits`,
                })}
              </strong>
            </div>
          )}
        </header>

        {/* List or empty */}
        {tournaments.length === 0 ? (
          <EmptyState dark={dark} t={t} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} dark={dark} t={t} tournament={tournament} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyState({
  dark,
  t,
}: {
  dark: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  return (
    <div
      className={`rounded-2xl border border-dashed px-6 py-16 text-center sm:px-12 ${
        dark ? "border-white/15 bg-white/[0.02]" : "border-gray-300 bg-white/60"
      }`}
    >
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full text-2xl font-black tracking-tight">
        <span className={dark ? "text-predictor-accent-dark/80" : "text-predictor-accent-light/85"}>
          ✦
        </span>
      </div>
      <h2 className="mb-3 text-xl font-bold text-theme-heading-primary">
        {t("create.mine.empty.title", "No tournaments yet")}
      </h2>
      <p className="mx-auto mb-7 max-w-md text-sm leading-relaxed text-theme-text-secondary">
        {t(
          "create.mine.empty.subtitle",
          "Create your first tournament for €2 and invite friends to compete on predictions.",
        )}
      </p>
      <Link
        href="/create-tournament"
        className="inline-flex items-center gap-2 rounded-full bg-predictor-primary px-6 py-3 text-sm font-bold text-gray-900 transition-all hover:bg-predictor-primary-hover"
      >
        {t("create.mine.empty.cta", "Create your first tournament")}
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}

function TournamentCard({
  dark,
  t,
  tournament,
}: {
  dark: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
  tournament: Tournament;
}) {
  const statusKey = STATUS_KEYS.includes(tournament.status as any)
    ? tournament.status
    : "draft";

  return (
    <Link
      href={`/predictor/owner/${tournament.id}`}
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 transition-all duration-200 ${
        dark
          ? "border-white/8 bg-white/[0.02] hover:border-amber-300/30 hover:bg-white/[0.04]"
          : "border-gray-200 bg-white hover:border-amber-400/50 hover:bg-amber-50/30"
      }`}
    >
      {/* Top — logo + name + slug */}
      <div className="mb-4 flex items-start gap-3">
        {tournament.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tournament.logo_url}
            alt=""
            referrerPolicy="no-referrer"
            loading="lazy"
            className={`h-11 w-11 flex-shrink-0 rounded-xl object-cover ring-1 ${
              dark ? "ring-white/10" : "ring-gray-200"
            }`}
          />
        ) : (
          <div
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-base font-black ${
              dark
                ? "bg-predictor-primary/10 text-predictor-accent-dark ring-1 ring-predictor-primary/20"
                : "bg-predictor-primary/20 text-predictor-accent-light ring-1 ring-predictor-primary/40"
            }`}
          >
            {(tournament.name || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-theme-heading-primary">
            {tournament.name}
          </h3>
          <div className="truncate font-mono text-[11px] text-theme-text-secondary/80">
            /{tournament.slug}
          </div>
        </div>
        <span
          aria-hidden
          className={`flex-shrink-0 text-base transition-transform group-hover:translate-x-0.5 ${
            dark ? "text-gray-600" : "text-gray-400"
          }`}
        >
          →
        </span>
      </div>

      {/* Description */}
      {tournament.short_description && (
        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-theme-text-secondary">
          {tournament.short_description}
        </p>
      )}

      {/* Bottom — status badges */}
      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        <Badge
          dark={dark}
          tone={statusToneFor(statusKey, dark)}
          label={t(`create.mine.card.status.${statusKey}`, statusKey)}
        />
        <Badge
          dark={dark}
          tone={
            tournament.visibility === "private"
              ? dark
                ? "bg-rose-500/15 text-rose-200"
                : "bg-rose-50 text-rose-700 ring-rose-200"
              : dark
                ? "bg-sky-500/15 text-sky-200"
                : "bg-sky-50 text-sky-700 ring-sky-200"
          }
          label={t(
            `create.mine.card.visibility.${tournament.visibility === "private" ? "private" : "public"}`,
            tournament.visibility,
          )}
        />
        {tournament.prize_pool_amount != null && (
          <Badge
            dark={dark}
            tone={
              dark
                ? "bg-predictor-primary/15 text-predictor-accent-dark"
                : "bg-predictor-primary/20 text-predictor-accent-light ring-predictor-primary/40"
            }
            label={`${t("create.mine.card.prizePool", "Pool")} ${tournament.prize_pool_amount} ${tournament.prize_pool_currency || "EUR"}`}
          />
        )}
        {tournament.created_via === "user_credit" && (
          <Badge
            dark={dark}
            tone={
              dark
                ? "bg-emerald-500/10 text-emerald-200"
                : "bg-emerald-50 text-emerald-700 ring-emerald-200"
            }
            label={`✦ ${t("create.mine.card.freeBadge", "Free")}`}
          />
        )}
      </div>
    </Link>
  );
}

function statusToneFor(status: string, dark: boolean): string {
  switch (status) {
    case "published":
      return dark
        ? "bg-emerald-500/15 text-emerald-200"
        : "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "locked":
      return dark
        ? "bg-predictor-primary/15 text-predictor-accent-dark"
        : "bg-predictor-primary/20 text-predictor-accent-light ring-predictor-primary/40";
    case "finished":
      return dark
        ? "bg-blue-500/15 text-blue-200"
        : "bg-blue-50 text-blue-700 ring-blue-200";
    default:
      return dark
        ? "bg-zinc-500/15 text-zinc-300"
        : "bg-gray-100 text-gray-700 ring-gray-200";
  }
}

function Badge({
  dark: _dark,
  tone,
  label,
}: {
  dark: boolean;
  tone: string;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ring-transparent ${tone}`}
    >
      {label}
    </span>
  );
}
