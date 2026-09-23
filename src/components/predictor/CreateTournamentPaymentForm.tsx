"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";

const ACCENT_OPTIONS = [
  { value: "amber", color: "from-amber-400 to-orange-500" },
  { value: "purple", color: "from-purple-500 to-fuchsia-600" },
  { value: "blue", color: "from-blue-500 to-indigo-600" },
  { value: "red", color: "from-red-500 to-rose-600" },
  { value: "green", color: "from-emerald-500 to-green-600" },
];

interface Props {
  userEmail: string;
  userName: string;
  credits: number;
  templateId?: string | null;
  onBack: () => void;
}

export default function CreateTournamentPaymentForm(props: Props) {
  return <PaymentInner {...props} />;
}

function slugFrom(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function PaymentInner({ credits, templateId, onBack }: Props) {
  const { t } = useTranslation("predictor");
  const { theme } = useTheme();
  const { showToast } = useToast();
  const dark = theme === "dark";
  const router = useRouter();

  const free = credits > 0;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [shortDesc, setShortDesc] = useState("");
  const [accentColor, setAccentColor] = useState("amber");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [created, setCreated] = useState<{
    slug: string;
    editorUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slugTouched) setSlug(slugFrom(name));
  }, [name, slugTouched]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = t("create.form.errors.nameRequired");
    else if (name.trim().length < 3) next.name = t("create.form.errors.nameMin");
    else if (name.trim().length > 80) next.name = t("create.form.errors.nameMax");

    if (!slug.trim()) next.slug = t("create.form.errors.slugRequired");
    else if (!/^[a-z0-9-]+$/.test(slug)) next.slug = t("create.form.errors.slugFormat");

    if (shortDesc.length > 200) next.shortDesc = t("create.form.errors.shortDescMax");

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/predictor/create-tournament/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournament_name: name.trim(),
          tournament_slug: slug.trim(),
          short_description: shortDesc.trim() || null,
          accent_color: accentColor,
          template_id: templateId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t("create.form.errors.generic"));
      showToast(t("owner.toast.tournamentCreated"));
      setCreated({ slug: slug.trim(), editorUrl: data.redirect_to });
    } catch (err: any) {
      const msg = err?.message || t("create.form.errors.generic");
      setGlobalError(msg);
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  }

  const shareUrl =
    created && typeof window !== "undefined"
      ? `${window.location.origin}/predictor/${created.slug}`
      : "";

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast(t("owner.share.copied", "Copied!"));
      setTimeout(() => setCopied(false), 2200);
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  if (created) {
    return (
      <main className="relative min-h-screen w-full bg-theme-background theme-transition">
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-0 h-[520px] ${
            dark
              ? "bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(245,158,11,0.06),transparent_70%)]"
              : "bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(245,158,11,0.10),transparent_70%)]"
          }`}
        />
        <div className="relative z-10 mx-auto max-w-2xl px-5 pb-24 pt-8 sm:px-6 sm:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
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
                {t("owner.share.title", "Tournament created")}
              </span>
            </div>

            <h1 className="mb-4 text-3xl font-black leading-tight tracking-tight text-theme-heading-primary sm:text-4xl md:text-5xl">
              {name.trim()}
            </h1>
            <p className="mb-10 max-w-xl text-base leading-relaxed text-theme-text-secondary">
              {t("owner.share.subtitle", "Share the link with friends and start competing.")}
            </p>

            {/* Share link card */}
            <div
              className={`mb-8 rounded-2xl border px-6 py-7 sm:px-8 ${
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
                  {t("owner.share.linkLabel", "Tournament link")}
                </span>
                <span
                  className={`h-px flex-1 ${dark ? "bg-white/10" : "bg-gray-200"}`}
                />
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`flex-1 min-w-0 rounded-lg border px-4 py-3 font-mono text-sm truncate select-all ${
                    dark
                      ? "border-white/10 bg-black/30 text-gray-200"
                      : "border-gray-200 bg-gray-50 text-gray-700"
                  }`}
                >
                  {shareUrl}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`flex-shrink-0 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-all duration-200 ${
                    copied
                      ? dark
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-300"
                      : "bg-predictor-primary text-gray-900 hover:bg-predictor-primary-hover"
                  }`}
                >
                  {copied
                    ? t("owner.share.copied", "Copied")
                    : t("owner.share.copy", "Copy link")}
                </button>
              </div>

              <p
                className={`mt-4 text-[11px] leading-relaxed ${
                  dark ? "text-gray-500" : "text-gray-500"
                }`}
              >
                {t("owner.share.hint", "Anyone who opens this link can sign up and start predicting.")}
              </p>
            </div>

            {/* Go to editor */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => router.push(created.editorUrl)}
                className={`group inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-bold transition-colors ${
                  dark
                    ? "border-white/15 text-gray-200 hover:border-predictor-primary/50 hover:text-predictor-accent-dark"
                    : "border-gray-300 text-gray-800 hover:border-predictor-primary hover:text-predictor-accent-light"
                }`}
              >
                {t("owner.share.goToEditor", "Go to editor")}
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full bg-theme-background theme-transition">
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-[420px] ${
          dark
            ? "bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(245,158,11,0.05),transparent_70%)]"
            : "bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(245,158,11,0.06),transparent_70%)]"
        }`}
      />

      <div className="relative z-10 mx-auto max-w-2xl px-5 pb-24 pt-8 sm:px-6 sm:pt-12">
        <button
          type="button"
          onClick={onBack}
          className={`mb-12 inline-flex items-center gap-1.5 text-xs transition-colors ${
            dark ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <span aria-hidden>←</span>
          {t("create.form.backToInfo")}
        </button>

        <header className="mb-12">
          <div className="mb-6 flex items-center gap-3">
            <span
              className={`h-px w-10 flex-shrink-0 ${
                dark ? "bg-predictor-accent-dark/50" : "bg-predictor-accent-light/55"
              }`}
            />
            <span
              className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${
                dark ? "text-predictor-accent-dark/85" : "text-predictor-accent-light/90"
              }`}
            >
              {t("create.eyebrow")}
            </span>
          </div>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-theme-heading-primary sm:text-4xl">
            {t("create.title.line1")} {t("create.title.line2")}
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-theme-text-secondary">
            {t("create.subtitle")}
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className={`rounded-2xl border ${
            dark ? "border-white/8 bg-white/[0.02]" : "border-gray-200 bg-white/60"
          }`}
        >
          {/* Price row */}
          <div
            className={`flex items-baseline justify-between border-b px-6 py-5 sm:px-8 ${
              dark ? "border-white/8" : "border-gray-200"
            }`}
          >
            <div>
              <div
                className={`text-[10px] font-semibold uppercase tracking-[0.25em] ${
                  free
                    ? dark ? "text-emerald-300/80" : "text-emerald-700/80"
                    : dark ? "text-gray-500" : "text-gray-500"
                }`}
              >
                {free
                ? t("create.pricing.creditTitle")
                : t("create.pricing.unavailableTitle")}
              </div>
            </div>
            <div
              className={`text-2xl font-black tracking-tight ${
                free
                  ? dark ? "text-emerald-300" : "text-emerald-700"
                  : "text-theme-heading-primary"
              }`}
            >
              {free
                ? t("create.pricing.creditAmount", { count: credits })
                : "—"}
            </div>
          </div>

          {/* Step 1 */}
          <section className="border-b px-6 py-7 sm:px-8"
            style={{
              borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(17,24,39,0.08)",
            }}
          >
            <h2
              className={`mb-6 text-[10px] font-semibold uppercase tracking-[0.3em] ${
                dark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              01. {t("create.form.step1")}
            </h2>

            <div className="space-y-5">
              <Field
                dark={dark}
                label={t("create.form.fields.name")}
                error={errors.name}
                hint={t("create.form.fields.nameHint")}
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("create.form.fields.namePlaceholder")}
                  maxLength={80}
                  required
                  className={inputCls(dark)}
                />
              </Field>

              <Field
                dark={dark}
                label={t("create.form.fields.slug")}
                error={errors.slug}
                hint={
                  <>
                    {t("create.form.fields.slugHint")}{" "}
                    <code className={`rounded px-1 py-px font-mono text-[10px] ${
                      dark ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-600"
                    }`}>
                      /predictor/{slug || t("create.form.fields.slugExample")}
                    </code>
                  </>
                }
              >
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "")
                        .slice(0, 80),
                    );
                  }}
                  placeholder={t("create.form.fields.slugPlaceholder")}
                  required
                  className={`${inputCls(dark)} font-mono text-sm`}
                />
              </Field>

              <Field
                dark={dark}
                label={t("create.form.fields.shortDesc")}
                error={errors.shortDesc}
                hint={t("create.form.fields.shortDescHint")}
              >
                <textarea
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value.slice(0, 200))}
                  placeholder={t("create.form.fields.shortDescPlaceholder")}
                  rows={2}
                  className={`${inputCls(dark)} resize-none`}
                />
              </Field>

              <Field
                dark={dark}
                label={t("create.form.fields.accent")}
                hint={t("create.form.fields.accentHint")}
              >
                <div className="flex flex-wrap gap-2">
                  {ACCENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAccentColor(opt.value)}
                      className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        accentColor === opt.value
                          ? dark
                            ? "border-predictor-primary/60 bg-predictor-primary/10 text-predictor-accent-dark"
                            : "border-predictor-primary bg-predictor-primary/15 text-predictor-accent-light"
                          : dark
                            ? "border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200"
                            : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${opt.color}`}
                      />
                      {t(`create.form.colors.${opt.value}`)}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </section>

          {globalError && (
            <div
              className={`mx-6 mt-6 rounded-lg border px-4 py-3 text-sm sm:mx-8 ${
                dark
                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                  : "border-red-300 bg-red-50 text-red-700"
              }`}
            >
              {globalError}
            </div>
          )}

          <div className="px-6 py-6 sm:px-8">
            <button
              type="submit"
              disabled={submitting}
              className={`group relative w-full overflow-hidden rounded-full px-7 py-4 text-base font-bold text-gray-900 shadow-[0_8px_30px_-12px_rgba(245,158,11,0.55)] transition-all duration-300 hover:shadow-[0_12px_36px_-10px_rgba(245,158,11,0.7)] disabled:cursor-not-allowed disabled:opacity-70 ${
                submitting
                  ? "bg-predictor-primary/90"
                  : "bg-predictor-primary hover:bg-predictor-primary-hover active:scale-[0.99]"
              }`}
            >
              {/* Idle gloss sweep — runs once on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:animate-[paySheen_1.2s_ease-in-out_forwards] group-disabled:hidden"
              />
              {/* Submitting indeterminate shimmer */}
              {submitting && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-[paySheenLoop_1.6s_linear_infinite]"
                />
              )}
              <span className="relative inline-flex items-center justify-center gap-2">
                {submitting && (
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      opacity="0.25"
                    />
                    <path
                      d="M21 12a9 9 0 0 0-9-9"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                <span>
                  {submitting
                    ? t("create.form.submit.loadingFree")
                    : t("create.form.submit.free")}
                </span>
              </span>
            </button>
            <p
              className={`mt-4 text-center text-[11px] leading-relaxed ${
                dark ? "text-gray-600" : "text-gray-500"
              }`}
            >
              {t("create.footer.terms")}
            </p>
          </div>
        </form>
      </div>

      {/* Local keyframes for the button gloss + field shimmer */}
      <style jsx global>{`
        @keyframes paySheen {
          0% {
            transform: translateX(0) skewX(-12deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translateX(450%) skewX(-12deg);
            opacity: 0;
          }
        }
        @keyframes paySheenLoop {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(300%) skewX(-12deg);
          }
        }
      `}</style>
    </main>
  );
}

function Field({
  dark,
  label,
  hint,
  error,
  children,
}: {
  dark: boolean;
  label: string;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className={`mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] ${
          dark ? "text-gray-400" : "text-gray-600"
        }`}
      >
        {label}
      </label>
      {children}
      {error ? (
        <p
          className={`mt-1.5 text-xs ${
            dark ? "text-red-300" : "text-red-600"
          }`}
        >
          {error}
        </p>
      ) : hint ? (
        <p
          className={`mt-1.5 text-[11px] leading-relaxed ${
            dark ? "text-gray-500" : "text-gray-500"
          }`}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function inputCls(dark: boolean): string {
  return `w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors ${
    dark
      ? "border-white/10 bg-black/30 text-white placeholder-gray-600 focus:border-predictor-primary/60 focus:bg-black/40"
      : "border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-predictor-primary focus:bg-white"
  }`;
}
