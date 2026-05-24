"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Editorial login-required screen, used when an unauthenticated user lands on
 * /create-tournament. Same visual language as the main create flow so the
 * transition feels intentional rather than a hard redirect.
 */
export default function LoginRequiredScreen() {
  const { t } = useTranslation("predictor");
  const { theme } = useTheme();
  const dark = theme === "dark";

  const perks = ["ownership", "tracking", "google"] as const;

  return (
    <main className="relative min-h-screen w-full bg-theme-background theme-transition">
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-[520px] ${
          dark
            ? "bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(253,230,138,0.05),transparent_70%)]"
            : "bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(253,230,138,0.10),transparent_70%)]"
        }`}
      />

      <div className="relative z-10 mx-auto max-w-2xl px-5 pb-24 pt-8 sm:px-6 sm:pt-12">
        <Link
          href="/predictor"
          className={`mb-16 inline-flex items-center gap-1.5 text-xs transition-colors ${
            dark
              ? "text-gray-500 hover:text-gray-300"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <span aria-hidden>←</span>
          {t("create.loginRequired.back", "Predictor")}
        </Link>

        {/* Eyebrow */}
        <div className="mb-8 flex items-center gap-3">
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
            {t("create.loginRequired.eyebrow", "Login required")}
          </span>
        </div>

        <h1 className="mb-6 text-3xl font-black leading-tight tracking-tight text-theme-heading-primary sm:text-4xl md:text-5xl">
          {t("create.loginRequired.title", "Sign in to create a tournament")}
        </h1>

        <p className="mb-10 max-w-xl text-base leading-relaxed text-theme-text-secondary sm:text-lg">
          {t(
            "create.loginRequired.subtitle",
            "Creating a tournament requires an account. Signing in takes 10 seconds and your tournament is instantly linked to you as the owner.",
          )}
        </p>

        {/* CTA cluster */}
        <div className="mb-12 flex flex-wrap items-center gap-3">
          <Link
            href="/login?callbackUrl=/create-tournament"
            className="group inline-flex items-center gap-2.5 rounded-full bg-predictor-primary px-7 py-3.5 text-sm font-bold text-gray-900 transition-all duration-200 hover:bg-predictor-primary-hover"
          >
            {t("create.loginRequired.loginCta", "Sign in")}
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
          <Link
            href="/signup?callbackUrl=/create-tournament"
            className={`inline-flex items-center rounded-full border px-5 py-3.5 text-sm font-semibold transition-colors ${
              dark
                ? "border-white/15 text-gray-300 hover:border-predictor-primary/60 hover:text-predictor-accent-dark"
                : "border-gray-300 text-gray-700 hover:border-predictor-primary hover:text-predictor-accent-light"
            }`}
          >
            {t("create.loginRequired.signupCta", "No account. register")}
          </Link>
        </div>

        {/* Perks */}
        <section
          className={`rounded-2xl border px-6 py-7 sm:px-8 ${
            dark
              ? "border-white/8 bg-white/[0.02]"
              : "border-gray-200 bg-white/60"
          }`}
        >
          <div className="mb-5 flex items-center gap-3">
            <span
              className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${
                dark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {t("create.loginRequired.perks.title", "What you get with an account")}
            </span>
            <span
              className={`h-px flex-1 ${dark ? "bg-white/10" : "bg-gray-200"}`}
            />
          </div>
          <ul className="space-y-3">
            {perks.map((key) => (
              <li key={key} className="flex items-start gap-3 text-sm leading-relaxed">
                <span
                  className={`mt-2 inline-block h-1 w-1 flex-shrink-0 rounded-full ${
                    dark ? "bg-predictor-accent-dark/85" : "bg-predictor-accent-light/90"
                  }`}
                />
                <span className="text-theme-text-secondary">
                  {t(`create.loginRequired.perks.items.${key}`)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
