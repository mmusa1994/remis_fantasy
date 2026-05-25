"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadStripe,
  Stripe as StripeClient,
} from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";

const stripePromise: Promise<StripeClient | null> = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
);

const ACCENT_OPTIONS = [
  { value: "amber", color: "from-amber-400 to-orange-500" },
  { value: "purple", color: "from-purple-500 to-fuchsia-600" },
  { value: "blue", color: "from-blue-500 to-indigo-600" },
  { value: "red", color: "from-red-500 to-rose-600" },
  { value: "green", color: "from-emerald-500 to-green-600" },
];

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
  templateId?: string | null;
  product?: ProductInfo;
  onBack: () => void;
}

export default function CreateTournamentPaymentForm(props: Props) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentInner {...props} />
    </Elements>
  );
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

function PaymentInner({
  userEmail,
  userName,
  credits,
  templateId,
  onBack,
}: Props) {
  const { t } = useTranslation("predictor");
  const { theme } = useTheme();
  const { showToast } = useToast();
  const dark = theme === "dark";
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const free = credits > 0;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [shortDesc, setShortDesc] = useState("");
  const [accentColor, setAccentColor] = useState("amber");
  const [cardholderName, setCardholderName] = useState(userName || "");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [cardComplete, setCardComplete] = useState({
    number: false,
    expiry: false,
    cvc: false,
  });
  const [cardFocus, setCardFocus] = useState<
    "number" | "expiry" | "cvc" | null
  >(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [created, setCreated] = useState<{
    slug: string;
    editorUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slugTouched) setSlug(slugFrom(name));
  }, [name, slugTouched]);

  const cardReady = useMemo(
    () => cardComplete.number && cardComplete.expiry && cardComplete.cvc,
    [cardComplete],
  );

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = t("create.form.errors.nameRequired");
    else if (name.trim().length < 3) next.name = t("create.form.errors.nameMin");
    else if (name.trim().length > 80) next.name = t("create.form.errors.nameMax");

    if (!slug.trim()) next.slug = t("create.form.errors.slugRequired");
    else if (!/^[a-z0-9-]+$/.test(slug)) next.slug = t("create.form.errors.slugFormat");

    if (shortDesc.length > 200) next.shortDesc = t("create.form.errors.shortDescMax");

    if (!free) {
      const trimmed = cardholderName.trim();
      if (!trimmed) {
        next.cardholder = t("create.form.errors.cardholderRequired");
      } else if (trimmed.split(/\s+/).filter(Boolean).length < 2) {
        next.cardholder = t("create.form.errors.cardholderFullName");
      }
      if (!cardReady) next.card = t("create.form.errors.cardIncomplete");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (free) {
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
        return;
      }

      if (!stripe || !elements) {
        throw new Error(t("create.form.errors.stripeNotReady"));
      }
      const cardNumber = elements.getElement(CardNumberElement);
      if (!cardNumber) throw new Error(t("create.form.errors.cardError"));

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumber,
        billing_details: {
          name: cardholderName.trim() || userName || userEmail,
          email: userEmail,
        },
      });
      if (pmError) throw new Error(pmError.message || t("create.form.errors.cardRejected"));

      const res = await fetch("/api/predictor/create-tournament/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournament_name: name.trim(),
          tournament_slug: slug.trim(),
          short_description: shortDesc.trim() || null,
          accent_color: accentColor,
          template_id: templateId || null,
          payment_method_id: paymentMethod.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t("create.form.errors.paymentStart"));

      const { error: confirmErr, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
      );
      if (confirmErr) throw new Error(confirmErr.message || t("create.form.errors.paymentRejected"));
      if (paymentIntent?.status !== "succeeded") {
        throw new Error(t("create.form.errors.paymentIncomplete"));
      }

      const pi = paymentIntent.id;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 800));
        const f = await fetch(
          `/api/predictor/create-tournament/finalize?payment_intent_id=${encodeURIComponent(pi)}`,
        );
        const fjson = await f.json();
        if (f.ok && fjson.ready && fjson.redirect_to) {
          showToast(t("owner.toast.tournamentCreated"));
          setCreated({ slug: fjson.slug || slug.trim(), editorUrl: fjson.redirect_to });
          return;
        }
      }
      throw new Error(t("create.form.errors.tournamentDelay"));
    } catch (err: any) {
      const msg = err?.message || t("create.form.errors.generic");
      setGlobalError(msg);
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  }

  const stripeStyle = useMemo(
    () => ({
      base: {
        fontSize: "15px",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        letterSpacing: "0.04em",
        color: dark ? "#fafafa" : "#111827",
        "::placeholder": { color: dark ? "#6b7280" : "#9ca3af" },
      },
      invalid: { color: "#f87171" },
    }),
    [dark],
  );

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
                {free ? t("create.pricing.creditTitle") : t("create.pricing.label")}
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
                : t("create.pricing.amount")}
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
                      /predictor/{slug || "tvoj-slug"}
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

          {/* Step 2 (only paid) */}
          {!free && (
            <section className="border-b px-6 py-7 sm:px-8"
              style={{
                borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(17,24,39,0.08)",
              }}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2
                  className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${
                    dark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  02. {t("create.form.step2")}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${
                    dark ? "text-emerald-300/80" : "text-emerald-700/80"
                  }`}
                >
                  <span className="relative inline-flex h-1.5 w-1.5">
                    <span
                      className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
                        dark ? "bg-emerald-300/60" : "bg-emerald-600/60"
                      }`}
                    />
                    <span
                      className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                        dark ? "bg-emerald-300/90" : "bg-emerald-700/90"
                      }`}
                    />
                  </span>
                  {t("create.form.secure")}
                </span>
              </div>

              <div className="space-y-4">
                <Field
                  dark={dark}
                  label={t("create.form.fields.cardholder")}
                  error={errors.cardholder}
                  hint={t("create.form.fields.cardholderHint")}
                >
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder={t("create.form.fields.cardholderPlaceholder")}
                    autoComplete="cc-name"
                    maxLength={120}
                    className={inputCls(dark)}
                  />
                </Field>

                <Field
                  dark={dark}
                  label={t("create.form.fields.cardNumber")}
                  error={undefined}
                >
                  <CardFieldShell
                    dark={dark}
                    focused={cardFocus === "number"}
                    complete={cardComplete.number}
                  >
                    <CardNumberElement
                      options={{ style: stripeStyle, showIcon: true }}
                      onChange={(e) =>
                        setCardComplete((p) => ({ ...p, number: e.complete }))
                      }
                      onFocus={() => setCardFocus("number")}
                      onBlur={() => setCardFocus(null)}
                    />
                  </CardFieldShell>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    dark={dark}
                    label={t("create.form.fields.cardExpiry")}
                    error={undefined}
                  >
                    <CardFieldShell
                      dark={dark}
                      focused={cardFocus === "expiry"}
                      complete={cardComplete.expiry}
                    >
                      <CardExpiryElement
                        options={{ style: stripeStyle }}
                        onChange={(e) =>
                          setCardComplete((p) => ({ ...p, expiry: e.complete }))
                        }
                        onFocus={() => setCardFocus("expiry")}
                        onBlur={() => setCardFocus(null)}
                      />
                    </CardFieldShell>
                  </Field>
                  <Field
                    dark={dark}
                    label={t("create.form.fields.cardCvc")}
                    error={undefined}
                  >
                    <CardFieldShell
                      dark={dark}
                      focused={cardFocus === "cvc"}
                      complete={cardComplete.cvc}
                    >
                      <CardCvcElement
                        options={{ style: stripeStyle }}
                        onChange={(e) =>
                          setCardComplete((p) => ({ ...p, cvc: e.complete }))
                        }
                        onFocus={() => setCardFocus("cvc")}
                        onBlur={() => setCardFocus(null)}
                      />
                    </CardFieldShell>
                  </Field>
                </div>
                {errors.card && (
                  <p
                    className={`text-xs ${
                      dark ? "text-red-300" : "text-red-600"
                    }`}
                  >
                    {errors.card}
                  </p>
                )}
                <p
                  className={`text-[11px] leading-relaxed ${
                    dark ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  {t("create.form.stripeNote")}
                </p>
              </div>
            </section>
          )}

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
                    ? free
                      ? t("create.form.submit.loadingFree")
                      : t("create.form.submit.loadingPaid")
                    : free
                      ? t("create.form.submit.free")
                      : t("create.form.submit.paid")}
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

        {/* Subtle, discreet payment brands strip */}
        {!free && <PaymentBrandsRow dark={dark} />}
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
        @keyframes cardFieldShimmer {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(220%);
          }
        }
      `}</style>
    </main>
  );
}

function CardFieldShell({
  dark,
  focused,
  complete,
  children,
}: {
  dark: boolean;
  focused: boolean;
  complete: boolean;
  children: React.ReactNode;
}) {
  const base = `relative w-full overflow-hidden rounded-lg border px-3.5 py-2.5 text-sm transition-all duration-200`;
  const palette = dark
    ? `bg-black/30 text-white ${
        focused
          ? "border-predictor-primary/60 bg-black/40 shadow-[0_0_0_3px_rgba(253,230,138,0.15)]"
          : complete
            ? "border-emerald-400/30"
            : "border-white/10"
      }`
    : `bg-white text-gray-900 ${
        focused
          ? "border-predictor-primary shadow-[0_0_0_3px_rgba(253,230,138,0.20)]"
          : complete
            ? "border-emerald-500/40"
            : "border-gray-200"
      }`;

  return (
    <div className={`${base} ${palette}`}>
      {children}
      <AnimatePresence>
        {focused && (
          <motion.span
            key="shimmer"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-predictor-primary/20 to-transparent"
            style={{
              animation: "cardFieldShimmer 2.2s ease-in-out infinite",
            }}
          />
        )}
      </AnimatePresence>
      {complete && !focused && (
        <span
          aria-hidden
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${
            dark ? "text-emerald-300" : "text-emerald-600"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </div>
  );
}

function PaymentBrandsRow({ dark }: { dark: boolean }) {
  const stroke = dark ? "rgba(255,255,255,0.42)" : "rgba(17,24,39,0.42)";
  const muted = dark ? "text-gray-600" : "text-gray-400";

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className={`h-px w-10 ${dark ? "bg-white/10" : "bg-gray-200"}`}
        />
        <span
          className={`text-[9px] font-semibold uppercase tracking-[0.3em] ${muted}`}
        >
          Powered by Stripe
        </span>
        <span
          aria-hidden
          className={`h-px w-10 ${dark ? "bg-white/10" : "bg-gray-200"}`}
        />
      </div>
      <div
        className={`flex items-center gap-4 opacity-70 ${
          dark ? "text-white/55" : "text-gray-500"
        }`}
        style={{ color: stroke }}
      >
        {/* Visa */}
        <svg width="34" height="12" viewBox="0 0 34 12" fill="none" aria-hidden>
          <text
            x="0"
            y="10"
            fontFamily="ui-sans-serif, system-ui, -apple-system"
            fontWeight="900"
            fontSize="11"
            letterSpacing="0.5"
            fill="currentColor"
          >
            VISA
          </text>
        </svg>
        {/* Mastercard */}
        <svg width="24" height="14" viewBox="0 0 24 14" aria-hidden>
          <circle cx="9" cy="7" r="6" fill="currentColor" opacity="0.85" />
          <circle cx="15" cy="7" r="6" fill="currentColor" opacity="0.45" />
        </svg>
        {/* Amex */}
        <svg width="34" height="12" viewBox="0 0 34 12" fill="none" aria-hidden>
          <text
            x="0"
            y="10"
            fontFamily="ui-sans-serif, system-ui, -apple-system"
            fontWeight="900"
            fontSize="10"
            letterSpacing="0.4"
            fill="currentColor"
          >
            AMEX
          </text>
        </svg>
        {/* Apple Pay glyph */}
        <svg width="26" height="14" viewBox="0 0 26 14" fill="currentColor" aria-hidden>
          <path d="M5.6 3.4c.3-.4.5-.9.5-1.4-.5 0-1 .3-1.4.7-.3.4-.6.9-.5 1.4.6.05 1.1-.3 1.4-.7zM6.1 4.2c-.8 0-1.5.5-1.9.5-.4 0-1-.4-1.6-.4-.8 0-1.6.5-2 1.2-.9 1.5-.2 3.8.6 5 .4.6.9 1.3 1.6 1.3.6 0 .9-.4 1.7-.4s1 .4 1.7.4c.7 0 1.1-.6 1.6-1.2.5-.7.7-1.4.7-1.4-.1 0-1.3-.5-1.3-2 0-1.2 1-1.8 1-1.9-.6-.9-1.5-1-1.9-1z" />
          <text
            x="11"
            y="10"
            fontFamily="ui-sans-serif, system-ui"
            fontWeight="700"
            fontSize="8"
            fill="currentColor"
          >
            Pay
          </text>
        </svg>
      </div>
      <p
        className={`max-w-xs text-center text-[10px] leading-relaxed ${muted}`}
      >
        PCI-DSS · 3-D Secure · End-to-end encrypted
      </p>
    </div>
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
