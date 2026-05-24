"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import CreateTournamentPaymentForm from "./CreateTournamentPaymentForm";
import TemplatePicker from "./TemplatePicker";

interface ProductInfo {
  name?: string | null;
  image?: string | null;
  amount?: number;
  currency?: string;
}

interface Props {
  userEmail: string;
  userName: string;
  credits: number;
  product?: ProductInfo;
}

export default function CreateTournamentLanding({
  userEmail,
  userName,
  credits,
  product,
}: Props) {
  const { t } = useTranslation("predictor");
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [step, setStep] = useState<"landing" | "form">("landing");
  const [templateId, setTemplateId] = useState<string | null>("world-cup-2026");

  if (step === "form") {
    return (
      <CreateTournamentPaymentForm
        userEmail={userEmail}
        userName={userName}
        credits={credits}
        templateId={templateId}
        product={product}
        onBack={() => setStep("landing")}
      />
    );
  }

  const hasCredits = credits > 0;

  return (
    <main className="relative min-h-screen w-full bg-theme-background theme-transition">
      {/* Subtle decorative gradient — barely there */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-[520px] ${
          dark
            ? "bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(245,158,11,0.06),transparent_70%)]"
            : "bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(245,158,11,0.08),transparent_70%)]"
        }`}
      />

      <div className="relative z-10 mx-auto max-w-3xl px-5 pb-24 pt-8 sm:px-6 sm:pt-12">
        {/* Top nav */}
        <nav className="mb-16 flex items-center justify-between text-xs">
          <Link
            href="/predictor"
            className={`inline-flex items-center gap-1.5 transition-colors ${
              dark
                ? "text-gray-500 hover:text-gray-300"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span aria-hidden>←</span>
            {t("create.nav.back")}
          </Link>
          <Link
            href="/predictor/my-tournaments"
            className={`transition-colors ${
              dark
                ? "text-gray-500 hover:text-gray-200"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {t("create.nav.myTournaments")} <span aria-hidden>→</span>
          </Link>
        </nav>

        {/* Hero */}
        <header className="mb-20">
          <div className="mb-8 flex items-center gap-3">
            <span
              className={`h-px flex-shrink-0 ${
                dark ? "w-10 bg-predictor-accent-dark/55" : "w-10 bg-predictor-accent-light/60"
              }`}
            />
            <span
              className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${
                dark ? "text-predictor-accent-dark/90" : "text-predictor-accent-light/95"
              }`}
            >
              {t("create.eyebrow")}
            </span>
          </div>

          <h1
            className="mb-8 text-4xl font-black leading-[1.05] tracking-tight text-theme-heading-primary sm:text-5xl md:text-6xl"
            style={{ fontFeatureSettings: "'ss01', 'ss02'" }}
          >
            <span className="block">{t("create.title.line1")}</span>
            <span className="block">{t("create.title.line2")}</span>
            <span
              className={`block ${
                dark ? "text-predictor-accent-dark" : "text-predictor-accent-light"
              }`}
            >
              {t("create.title.line3")}
            </span>
          </h1>

          <p className="max-w-2xl text-base leading-relaxed text-theme-text-secondary sm:text-lg">
            {t("create.subtitle")}
          </p>
        </header>

        {/* Templates — quick start */}
        <TemplatePicker
          dark={dark}
          selectedId={templateId}
          onSelect={setTemplateId}
        />

        {/* Pricing + CTA */}
        <section
          className={`mb-20 rounded-2xl border px-6 py-8 sm:px-10 sm:py-10 ${
            dark
              ? "border-white/8 bg-white/[0.02]"
              : "border-gray-200 bg-white/60"
          }`}
        >
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
            <div>
              {hasCredits ? (
                <>
                  <div
                    className={`mb-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] ${
                      dark ? "text-emerald-300/80" : "text-emerald-700/80"
                    }`}
                  >
                    {t("create.pricing.creditTitle")}
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span
                      className={`text-5xl font-black tracking-tight ${
                        dark ? "text-emerald-300" : "text-emerald-700"
                      }`}
                    >
                      {t("create.pricing.creditAmount", { count: credits })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-theme-text-secondary">
                    {t("create.pricing.creditNote")}
                  </p>
                </>
              ) : (
                <>
                  <div
                    className={`mb-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] ${
                      dark ? "text-gray-500" : "text-gray-500"
                    }`}
                  >
                    {t("create.pricing.label")}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black tracking-tight text-theme-heading-primary">
                      {t("create.pricing.amount")}
                    </span>
                  </div>
                  <p className="mt-2 max-w-xs text-sm text-theme-text-secondary">
                    {t("create.pricing.note")}
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="group inline-flex items-center gap-2.5 rounded-full bg-predictor-primary px-7 py-3.5 text-sm font-bold text-gray-900 transition-all duration-200 hover:bg-predictor-primary-hover hover:shadow-[0_8px_30px_-6px_rgba(252,211,77,0.35)]"
              >
                {hasCredits ? t("create.cta.primaryFree") : t("create.cta.primary")}
                <span
                  aria-hidden
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </button>
              <p
                className={`text-[11px] ${
                  dark ? "text-gray-600" : "text-gray-400"
                }`}
              >
                {t("create.cta.signedInAs")}{" "}
                <span className={dark ? "text-gray-400" : "text-gray-600"}>
                  {userEmail}
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* What's included */}
        <section className="mb-20">
          <SectionHeading dark={dark}>{t("create.included.title")}</SectionHeading>

          <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
            {[
              "ownership",
              "categories",
              "scoring",
              "visibility",
              "branding",
              "bilingual",
            ].map((key) => (
              <IncludedItem
                key={key}
                dark={dark}
                title={t(`create.included.items.${key}.title`)}
                desc={t(`create.included.items.${key}.desc`)}
              />
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mb-20">
          <SectionHeading dark={dark}>{t("create.how.title")}</SectionHeading>

          <ol className="space-y-7">
            {[1, 2, 3].map((n) => (
              <li key={n} className="flex gap-6">
                <span
                  className={`flex-shrink-0 select-none font-mono text-sm font-semibold tracking-wider ${
                    dark ? "text-predictor-accent-dark/85" : "text-predictor-accent-light/85"
                  }`}
                  style={{ width: "2.5rem" }}
                >
                  0{n}
                </span>
                <div className="flex-1 border-l pl-6 pb-1"
                  style={{
                    borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(17,24,39,0.06)",
                  }}
                >
                  <h3 className="mb-1.5 text-base font-bold text-theme-heading-primary">
                    {t(`create.how.step${n}.label`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-theme-text-secondary">
                    {t(`create.how.step${n}.desc`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Trust row */}
        <section className="mb-16">
          <div
            className={`grid grid-cols-1 gap-4 border-t border-b py-6 sm:grid-cols-3 ${
              dark ? "border-white/8" : "border-gray-200"
            }`}
          >
            {(["stripe", "owner", "lifetime"] as const).map((key) => (
              <div
                key={key}
                className="text-center text-xs font-medium text-theme-text-secondary sm:text-left"
              >
                <span
                  className={`mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle ${
                    dark ? "bg-predictor-accent-dark/80" : "bg-predictor-primary/90"
                  }`}
                />
                {t(`create.trust.${key}`)}
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mb-16 text-center">
          <button
            type="button"
            onClick={() => setStep("form")}
            className="group inline-flex items-center gap-2.5 rounded-full bg-predictor-primary px-8 py-4 text-base font-bold text-gray-900 transition-all duration-200 hover:bg-predictor-primary-hover"
          >
            {hasCredits ? t("create.cta.primaryFree") : t("create.cta.primary")}
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </button>
        </section>

        {/* Footer */}
        <footer
          className={`border-t pt-8 text-center text-[11px] ${
            dark ? "border-white/8 text-gray-600" : "border-gray-200 text-gray-500"
          }`}
        >
          {t("create.footer.support")}{" "}
          <a
            href="mailto:remis.fantasy@gmail.com"
            className={`underline-offset-2 hover:underline ${
              dark ? "text-gray-400" : "text-gray-700"
            }`}
          >
            remis.fantasy@gmail.com
          </a>
        </footer>
      </div>
    </main>
  );
}

function SectionHeading({
  dark,
  children,
}: {
  dark: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10 flex items-center gap-3">
      <span
        className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${
          dark ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {children}
      </span>
      <span
        className={`h-px flex-1 ${dark ? "bg-white/10" : "bg-gray-200"}`}
      />
    </div>
  );
}

function IncludedItem({
  dark,
  title,
  desc,
}: {
  dark: boolean;
  title: string;
  desc: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2.5">
        <span
          className={`h-1 w-1 flex-shrink-0 rounded-full ${
            dark ? "bg-predictor-accent-dark/85" : "bg-predictor-accent-light/85"
          }`}
        />
        <h3 className="text-[15px] font-bold text-theme-heading-primary">
          {title}
        </h3>
      </div>
      <p className="pl-[14px] text-sm leading-relaxed text-theme-text-secondary">
        {desc}
      </p>
    </div>
  );
}
