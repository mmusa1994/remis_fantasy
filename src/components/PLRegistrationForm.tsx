"use client";

import React, { useState, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import Toast from "./shared/Toast";
import ReCAPTCHA from "react-google-recaptcha";
import {
  AlertCircle,
  Trophy,
  BarChart3,
  Gift,
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle,
  Banknote,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  notes: string;
}

type MainLeague = "standard" | "premium" | null;

function PLRegistrationFormInner() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [mainLeague, setMainLeague] = useState<MainLeague>(null);
  const [h2hSelected, setH2hSelected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [cardFocused, setCardFocused] = useState<string | null>(null);

  // Stripe Elements state (PCI compliant - card data never touches our code)
  const [cardBrand, setCardBrand] = useState<string>("unknown");
  const [cardComplete, setCardComplete] = useState({ number: false, expiry: false, cvc: false });

  // Stripe Element style (matches existing theme)
  const stripeElementStyle = {
    base: {
      fontSize: "14px",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      letterSpacing: "0.05em",
      color: theme === "dark" ? "#e5e7eb" : "#1f2937",
      "::placeholder": { color: theme === "dark" ? "#6b7280" : "#9ca3af" },
    },
    invalid: { color: "#f87171" },
  };

  // Calculate total price based on selections
  const tierPrice = (mainLeague === "standard" ? 20 : mainLeague === "premium" ? 50 : 0) + (h2hSelected ? 15 : 0);

  // Build league_tier string for API
  const getLeagueTier = () => {
    if (mainLeague && h2hSelected) return `${mainLeague}_h2h`;
    if (mainLeague) return mainLeague;
    if (h2hSelected) return "h2h_only";
    return "";
  };

  const [paymentMode, setPaymentMode] = useState<"card" | "cash">("card");
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [cashDeliveryDate, setCashDeliveryDate] = useState("");
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // At least one league must be selected
    if (!mainLeague && !h2hSelected) {
      newErrors.league = "Morate odabrati barem jednu ligu";
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = t("common:validation.firstNameRequired");
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = t("common:validation.lastNameRequired");
    }
    if (!formData.email.trim()) {
      newErrors.email = t("common:validation.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("common:validation.emailInvalid");
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t("common:validation.phoneRequired");
    } else {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,20}$/;
      const cleanPhone = formData.phone.replace(/\s/g, "");
      if (!phoneRegex.test(formData.phone) || cleanPhone.length < 8) {
        newErrors.phone = t("common:validation.phoneInvalid");
      }
    }
    if (paymentMode === "card") {
      if (!cardComplete.number || !cardComplete.expiry || !cardComplete.cvc) {
        newErrors.payment = t("common:validation.cardDataRequired");
      }
    } else {
      if (!cashDeliveryDate) {
        newErrors.cashDeliveryDate = "Morate odabrati datum dostave uplate";
      }
      if (!cashConfirmed) {
        newErrors.cashConfirmed = "Morate potvrditi da ćete dostaviti uplatu";
      }
    }
    if (!recaptchaToken) {
      newErrors.recaptcha = t("common:validation.recaptchaRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (paymentMode === "card" && !stripe) return;

    setIsSubmitting(true);

    try {
      // Cash flow
      if (paymentMode === "cash") {
        const response = await fetch("/api/premier-league/register-cash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            notes: formData.notes.trim(),
            payment_method: "cash",
            cash_delivery_date: cashDeliveryDate,
            league_tier: getLeagueTier(),
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || t("common:validation.registrationError"));
        }
        router.push("/premier-league/registration/success");
        return;
      }

      // PCI-compliant card flow: create PaymentMethod client-side via Stripe Elements
      if (!stripe || !elements) return;

      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) return;

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumberElement,
        billing_details: {
          name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        },
      });

      if (pmError) {
        throw new Error(pmError.message || t("common:validation.registrationError"));
      }

      // Send only the PaymentMethod ID to backend (never raw card data)
      const response = await fetch("/api/premier-league/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          notes: formData.notes.trim(),
          payment_method_id: paymentMethod.id,
          league_tier: getLeagueTier(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("common:validation.registrationError"));
      }

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(data.clientSecret);

      if (stripeError) {
        throw new Error(stripeError.message || t("common:validation.registrationError"));
      }

      if (paymentIntent?.status === "succeeded") {
        router.push("/premier-league/registration/success");
      }
    } catch (error: unknown) {
      console.error("PL registration error:", error);
      setToast({
        show: true,
        message:
          error instanceof Error
            ? error.message
            : t("common:validation.registrationError"),
        type: "error",
      });
      setRecaptchaToken(null);
      recaptchaRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const inputClassName = (field: string) =>
    `input-theme relative w-full px-3 xs:px-4 py-2.5 xs:py-3 border rounded-lg peer transition-all duration-200 focus-ring text-sm xs:text-base ${
      errors[field]
        ? "border-red-400"
        : focusedField === field
          ? "border-purple-600/40 dark:border-purple-400/40"
          : "border-gray-200 dark:border-gray-700"
    }`;

  const labelClassName = (field: string, value: string) =>
    `floating-label transition-all duration-300 theme-transition text-xs xs:text-sm ${
      value || focusedField === field
        ? "transform -translate-y-2 scale-90"
        : "floating-label-placeholder transform translate-y-0 scale-100"
    }`;

  const stripeElementClass = `input-theme w-full px-3.5 py-3 border rounded-lg transition-all duration-200 text-sm ${
    cardFocused
      ? "border-purple-600/40 dark:border-purple-400/40 ring-1 ring-purple-600/20"
      : "border-gray-200 dark:border-gray-700"
  }`;

  const CardBrandIcon = () => {
    if (cardBrand === "visa") {
      return <span className="text-[11px] font-black italic text-blue-600 dark:text-blue-400 tracking-tight">VISA</span>;
    }
    if (cardBrand === "mastercard") {
      return (
        <span className="flex items-center -space-x-1">
          <span className="w-3.5 h-3.5 rounded-full bg-red-500 inline-block" />
          <span className="w-3.5 h-3.5 rounded-full bg-yellow-500 inline-block" />
        </span>
      );
    }
    if (cardBrand === "amex") {
      return <span className="text-[10px] font-black text-blue-500 tracking-tight">AMEX</span>;
    }
    return null;
  };

  return (
    <>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <section className="relative w-full bg-theme-background theme-transition pb-16 sm:pb-20 md:pb-24">

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-3xl">
          {/* Header */}
          <div className="flex justify-center items-center flex-col mb-8 sm:mb-10 animate-fade-in-up">
            <h2 className="text-2xl xs:text-3xl md:text-4xl font-black mb-2 xs:mb-3 text-balance leading-tight font-anta animate-scale-in animate-delay-200">
              <span className="text-purple-600 dark:text-purple-400">
                Premier League Fantasy 2026/27
              </span>
            </h2>

            <h3 className="text-lg xs:text-xl md:text-2xl font-bold mb-3 text-theme-heading-primary">
              Registracija
            </h3>

            <p className="text-theme-text-secondary text-xs xs:text-sm md:text-base max-w-xl mx-auto leading-relaxed font-medium text-center px-2">
              Pridružite se Premier League Fantasy ligi za sezonu 2026/27 i takmičite se za nagrade.
            </p>
          </div>

          {/* What You Get */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-8 animate-fade-in-up animate-delay-200">
            <div className="flex items-center gap-3 p-3.5 rounded-lg bg-purple-500/[0.03] dark:bg-purple-500/[0.06] border border-purple-500/10 hover:border-purple-500/20 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-purple-500/8 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-[18px] h-[18px] text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-bold text-theme-heading-primary text-sm">Takmičenje za nagrade</div>
                <div className="text-xs text-theme-text-secondary">Osvoji nagradni fond</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-lg bg-purple-500/[0.03] dark:bg-purple-500/[0.06] border border-purple-500/10 hover:border-purple-500/20 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-purple-500/8 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-[18px] h-[18px] text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-bold text-theme-heading-primary text-sm">Live tabela</div>
                <div className="text-xs text-theme-text-secondary">Rezultati u realnom vremenu</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-lg bg-purple-500/[0.03] dark:bg-purple-500/[0.06] border border-purple-500/10 hover:border-purple-500/20 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-purple-500/8 flex items-center justify-center flex-shrink-0">
                <Gift className="w-[18px] h-[18px] text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-bold text-theme-heading-primary text-sm">Mjesečne nagrade</div>
                <div className="text-xs text-theme-text-secondary">Specijalne nagrade po kolu</div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="relative p-5 sm:p-6 md:p-8 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-theme-background/95 backdrop-blur-md theme-transition shadow-lg shadow-black/[0.03] dark:shadow-black/15 animate-fade-in-up animate-delay-300"
          >
            {/* Price badge */}
            <div className="flex justify-center -mt-10 sm:-mt-11 mb-7">
              <div className={`text-white px-5 py-2 rounded-lg shadow-md flex items-center gap-2 transition-all duration-300 ${
                tierPrice > 0 ? "bg-purple-600 shadow-purple-600/20" : "bg-gray-400 shadow-gray-400/20"
              }`}>
                <span className="text-sm font-medium opacity-90">Kotizacija</span>
                <span className="text-lg font-black">{tierPrice > 0 ? <>&euro;{tierPrice}</> : "—"}</span>
              </div>
            </div>

            {/* League Selection */}
            <div className="mb-6">
              <h3 className="text-sm xs:text-base font-bold mb-3 text-theme-heading-primary flex items-center gap-2">
                <span className="w-[22px] h-[22px] rounded-md bg-purple-600/10 flex items-center justify-center text-[11px] font-black text-purple-600 dark:text-purple-400">1</span>
                Odaberite ligu
              </h3>

              {/* Main league: Standard or Premium (mutually exclusive) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setMainLeague(mainLeague === "standard" ? null : "standard");
                    if (errors.league) setErrors((p) => ({ ...p, league: "" }));
                  }}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                    mainLeague === "standard"
                      ? "border-purple-600/60 bg-purple-500/[0.04] dark:bg-purple-500/[0.08] shadow-sm"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  {mainLeague === "standard" && (
                    <div className="absolute top-2.5 right-2.5">
                      <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  )}
                  <div className={`text-sm font-bold mb-1 ${
                    mainLeague === "standard" ? "text-purple-600 dark:text-purple-400" : "text-theme-heading-primary"
                  }`}>
                    Standard Liga
                  </div>
                  <div className="text-xs text-theme-text-secondary">Osnovna liga sa takmičenjem za nagrade</div>
                  <div className={`text-lg font-black mt-2 ${
                    mainLeague === "standard" ? "text-purple-600 dark:text-purple-400" : "text-theme-heading-primary"
                  }`}>
                    &euro;20
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMainLeague(mainLeague === "premium" ? null : "premium");
                    if (errors.league) setErrors((p) => ({ ...p, league: "" }));
                  }}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                    mainLeague === "premium"
                      ? "border-purple-600/60 bg-purple-500/[0.04] dark:bg-purple-500/[0.08] shadow-sm"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  {mainLeague === "premium" && (
                    <div className="absolute top-2.5 right-2.5">
                      <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  )}
                  <div className={`text-sm font-bold mb-1 ${
                    mainLeague === "premium" ? "text-purple-600 dark:text-purple-400" : "text-theme-heading-primary"
                  }`}>
                    Premium Liga
                  </div>
                  <div className="text-xs text-theme-text-secondary">Premium liga sa većim nagradnim fondom</div>
                  <div className={`text-lg font-black mt-2 ${
                    mainLeague === "premium" ? "text-purple-600 dark:text-purple-400" : "text-theme-heading-primary"
                  }`}>
                    &euro;50
                  </div>
                </button>
              </div>

              {/* H2H add-on checkbox */}
              <button
                type="button"
                onClick={() => {
                  setH2hSelected(!h2hSelected);
                  if (errors.league) setErrors((p) => ({ ...p, league: "" }));
                }}
                className={`relative w-full p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                  h2hSelected
                    ? "border-purple-600/60 bg-purple-500/[0.04] dark:bg-purple-500/[0.08] shadow-sm"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-sm font-bold mb-1 ${
                      h2hSelected ? "text-purple-600 dark:text-purple-400" : "text-theme-heading-primary"
                    }`}>
                      H2H Liga
                    </div>
                    <div className="text-xs text-theme-text-secondary">Head-to-Head takmičenje (može se kombinovati)</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-lg font-black ${
                      h2hSelected ? "text-purple-600 dark:text-purple-400" : "text-theme-heading-primary"
                    }`}>
                      &euro;15
                    </div>
                    <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center flex-shrink-0 ${
                      h2hSelected
                        ? "bg-purple-600 border-purple-600"
                        : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {h2hSelected && (
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {errors.league && (
                <p className="text-red-400 text-xs mt-2 flex items-center gap-1 font-medium animate-fade-in">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.league}
                </p>
              )}
            </div>

            {/* Personal Info */}
            <div className="mb-6">
              <h3 className="text-sm xs:text-base font-bold mb-3 text-theme-heading-primary flex items-center gap-2">
                <span className="w-[22px] h-[22px] rounded-md bg-purple-600/10 flex items-center justify-center text-[11px] font-black text-purple-600 dark:text-purple-400">2</span>
                Lični podaci
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      id="pl_first_name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange("first_name", e.target.value)}
                      onFocus={() => setFocusedField("first_name")}
                      onBlur={() => setFocusedField(null)}
                      className={inputClassName("first_name")}
                    />
                    <label htmlFor="pl_first_name" className={labelClassName("first_name", formData.first_name)}>
                      Ime *
                    </label>
                  </div>
                  {errors.first_name && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1 font-medium animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.first_name}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      id="pl_last_name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange("last_name", e.target.value)}
                      onFocus={() => setFocusedField("last_name")}
                      onBlur={() => setFocusedField(null)}
                      className={inputClassName("last_name")}
                    />
                    <label htmlFor="pl_last_name" className={labelClassName("last_name", formData.last_name)}>
                      Prezime *
                    </label>
                  </div>
                  {errors.last_name && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1 font-medium animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.last_name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mb-6">
              <h3 className="text-sm xs:text-base font-bold mb-3 text-theme-heading-primary flex items-center gap-2">
                <span className="w-[22px] h-[22px] rounded-md bg-purple-600/10 flex items-center justify-center text-[11px] font-black text-purple-600 dark:text-purple-400">3</span>
                Kontakt informacije
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <div className="relative">
                    <input
                      type="email"
                      id="pl_email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      className={inputClassName("email")}
                    />
                    <label htmlFor="pl_email" className={labelClassName("email", formData.email)}>
                      Email *
                    </label>
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1 font-medium animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <div className="relative">
                    <input
                      type="tel"
                      id="pl_phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => setFocusedField(null)}
                      className={inputClassName("phone")}
                    />
                    <label htmlFor="pl_phone" className={labelClassName("phone", formData.phone)}>
                      Telefon *
                    </label>
                  </div>
                  {errors.phone && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1 font-medium animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <div className="relative">
                <div className="relative">
                  <textarea
                    id="pl_notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    onFocus={() => setFocusedField("notes")}
                    onBlur={() => setFocusedField(null)}
                    rows={2}
                    className={inputClassName("notes")}
                  />
                  <label htmlFor="pl_notes" className={labelClassName("notes", formData.notes)}>
                    Napomene
                  </label>
                </div>
              </div>
            </div>

            {/* Payment Method Toggle */}
            <div className="mb-6">
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-theme-background px-4 text-xs text-theme-text-secondary font-medium uppercase tracking-wider">
                    Način plaćanja
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMode("card")}
                  className={`relative p-3.5 rounded-lg border-2 transition-all duration-300 flex flex-col items-center gap-2.5 ${
                    paymentMode === "card"
                      ? "border-purple-600/60 bg-purple-500/[0.04] dark:bg-purple-500/[0.08] shadow-sm"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  {paymentMode === "card" && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    paymentMode === "card"
                      ? "bg-purple-600/10 text-purple-600 dark:text-purple-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                  }`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-bold ${
                      paymentMode === "card" ? "text-purple-600 dark:text-purple-400" : "text-theme-heading-primary"
                    }`}>
                      Kartica
                    </div>
                    <div className="text-[10px] text-theme-text-secondary mt-0.5">
                      Visa · Mastercard · Amex
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode("cash")}
                  className={`relative p-3.5 rounded-lg border-2 transition-all duration-300 flex flex-col items-center gap-2.5 ${
                    paymentMode === "cash"
                      ? "border-green-600/50 bg-green-500/[0.04] dark:bg-green-500/[0.08] shadow-sm"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  {paymentMode === "cash" && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    paymentMode === "cash"
                      ? "bg-green-600/10 text-green-600 dark:text-green-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                  }`}>
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-bold ${
                      paymentMode === "cash" ? "text-green-600 dark:text-green-400" : "text-theme-heading-primary"
                    }`}>
                      Gotovina
                    </div>
                    <div className="text-[10px] text-theme-text-secondary mt-0.5">
                      Dostava gotovine
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Card Payment Section */}
            {paymentMode === "card" && (
            <div className="mb-6">
              <h3 className="text-sm xs:text-base font-bold mb-3 text-theme-heading-primary flex items-center gap-2">
                <span className="w-[22px] h-[22px] rounded-md bg-purple-600/10 flex items-center justify-center text-[11px] font-black text-purple-600 dark:text-purple-400">4</span>
                Podaci o kartici
                <div className="ml-auto flex items-center gap-1">
                  <div className="px-1.5 py-0.5 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700">
                    <span className="text-[9px] font-black italic text-blue-600 dark:text-blue-400">VISA</span>
                  </div>
                  <div className="px-1.5 py-0.5 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                    <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block -ml-0.5" />
                  </div>
                  <div className="px-1.5 py-0.5 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700">
                    <span className="text-[8px] font-black text-blue-500 dark:text-blue-300">AMEX</span>
                  </div>
                </div>
              </h3>

              {/* Interactive 3D Card - Premium Black with Purple tint */}
              <div className="flex justify-center mb-5" style={{ perspective: "1200px" }}>
                <div
                  className="relative w-[300px] sm:w-[340px] h-[185px] sm:h-[210px] transition-transform duration-700 ease-in-out"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: cardFocused === "cardCvc" ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* Front */}
                  <div
                    className="absolute inset-0 rounded-[20px] overflow-hidden"
                    style={{
                      backfaceVisibility: "hidden",
                      boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.5), 0 0 40px -8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {/* Premium black base */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16162a] to-[#0f0f1a]" />
                    {/* Purple shimmer overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/8 via-transparent to-purple-900/5" />
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white 0%, transparent 50%), radial-gradient(circle at 70% 80%, white 0%, transparent 50%)" }} />
                    {/* Top edge highlight */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                    {/* Left edge highlight */}
                    <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-transparent to-transparent" />

                    <div className="relative h-full p-5 sm:p-6 flex flex-col justify-between">
                      {/* Top row: chip + contactless + brand */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {/* Premium chip */}
                          <div className="w-10 h-7 sm:w-11 sm:h-8 rounded-lg overflow-hidden" style={{
                            background: "linear-gradient(135deg, #d4af37 0%, #f5d061 25%, #d4af37 50%, #c5a028 75%, #f5d061 100%)",
                            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3), 0 1px 3px rgba(0,0,0,0.3)",
                          }}>
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-7 h-5 sm:w-8 sm:h-6 rounded-sm" style={{
                                background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.15) 100%)",
                                border: "1px solid rgba(180,150,50,0.4)",
                              }}>
                                <div className="w-full h-full grid grid-cols-3 gap-px p-px opacity-40">
                                  {[...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-yellow-800/30 rounded-[1px]" />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Contactless icon */}
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/25">
                            <path d="M12.5 6.5C14.5 8 16 10 16 12.5S14.5 17 12.5 18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M9.5 9C10.5 9.5 12 10.5 12 12.5S10.5 15.5 9.5 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M6.5 11C7 11.5 8 12 8 12.5S7 13.5 6.5 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </div>
                        {/* Brand */}
                        <div className="flex items-center">
                          {cardBrand === "visa" && (
                            <span className="text-lg sm:text-xl font-black italic text-white/75 tracking-tight">VISA</span>
                          )}
                          {cardBrand === "mastercard" && (
                            <span className="flex items-center -space-x-2">
                              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500 inline-block opacity-85" />
                              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-500 inline-block opacity-85" />
                            </span>
                          )}
                          {cardBrand === "amex" && (
                            <span className="text-sm sm:text-base font-black text-white/75 tracking-widest">AMEX</span>
                          )}
                          {(cardBrand === "unknown" || !cardBrand) && (
                            <CreditCard className="w-7 h-7 sm:w-8 sm:h-8 text-white/15" />
                          )}
                        </div>
                      </div>

                      {/* Card number placeholder */}
                      <div className="font-mono text-[14px] xs:text-[15px] sm:text-[17px] tracking-[0.15em] sm:tracking-[0.18em] font-medium whitespace-nowrap rounded-md px-2 py-1 -mx-2" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                        <span className="text-white/15">
                          {"\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022"}
                        </span>
                      </div>

                      {/* Bottom row: name + expiry */}
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-white/30 mb-1 font-medium">Card Holder</div>
                          <div className={`text-[12px] sm:text-[13px] font-semibold tracking-wider uppercase truncate max-w-[180px] transition-colors duration-300 ${
                            formData.first_name || formData.last_name ? "text-white/70" : "text-white/15"
                          }`} style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                            {formData.first_name || formData.last_name
                              ? `${formData.first_name} ${formData.last_name}`.trim()
                              : "YOUR NAME"}
                          </div>
                        </div>
                        <div className="text-right rounded-md px-2 py-1 -mr-2">
                          <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-white/30 mb-1 font-medium">Expires</div>
                          <div className="text-[12px] sm:text-[13px] font-semibold font-mono tracking-wider">
                            <span className="text-white/15">MM/YY</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Back */}
                  <div
                    className="absolute inset-0 rounded-[20px] overflow-hidden"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.5), 0 0 40px -8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16162a] to-[#0f0f1a]" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/5 via-transparent to-purple-950/5" />

                    <div className="relative h-full flex flex-col">
                      {/* Magnetic stripe */}
                      <div className="w-full h-[46px] sm:h-[50px] mt-6 sm:mt-7" style={{
                        background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 40%, #0f0f0f 60%, #1a1a1a 100%)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
                      }} />

                      {/* Signature + CVC */}
                      <div className="flex items-center gap-3 px-5 sm:px-6 mt-5 sm:mt-6">
                        <div className="flex-1 h-10 sm:h-11 rounded-md" style={{
                          background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}>
                          <div className="h-full flex items-center px-3">
                            <div className="w-full h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
                          </div>
                        </div>
                        <div className="w-14 sm:w-16 h-9 sm:h-10 rounded-md flex items-center justify-center font-mono text-sm font-bold bg-white/8 text-white/40 border border-white/10">
                          CVC
                        </div>
                      </div>

                      {/* Bottom: stripe logo */}
                      <div className="mt-auto px-5 sm:px-6 pb-4 sm:pb-5 flex justify-end">
                        <Image
                          src="/images/stripe.png"
                          alt="Stripe"
                          width={50}
                          height={21}
                          className="brightness-200 opacity-30"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Inputs - Stripe Elements (PCI Compliant) */}
              <div className="rounded-lg border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/30 p-4 space-y-3">
                {/* Card Number */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-theme-text-secondary flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      Broj kartice
                    </label>
                    {cardBrand !== "unknown" && <CardBrandIcon />}
                  </div>
                  <div className={stripeElementClass}>
                    <CardNumberElement
                      options={{ style: stripeElementStyle, showIcon: true }}
                      onFocus={() => setCardFocused("cardNumber")}
                      onBlur={() => setCardFocused(null)}
                      onChange={(e) => {
                        setCardBrand(e.brand || "unknown");
                        setCardComplete((p) => ({ ...p, number: e.complete }));
                        if (errors.payment) setErrors((p) => ({ ...p, payment: "" }));
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Expiry */}
                  <div>
                    <label className="text-xs font-semibold text-theme-text-secondary mb-1.5 block">
                      Datum isteka
                    </label>
                    <div className={stripeElementClass}>
                      <CardExpiryElement
                        options={{ style: stripeElementStyle }}
                        onFocus={() => setCardFocused("cardExpiry")}
                        onBlur={() => setCardFocused(null)}
                        onChange={(e) => {
                          setCardComplete((p) => ({ ...p, expiry: e.complete }));
                          if (errors.payment) setErrors((p) => ({ ...p, payment: "" }));
                        }}
                      />
                    </div>
                  </div>

                  {/* CVC */}
                  <div>
                    <label className="text-xs font-semibold text-theme-text-secondary mb-1.5 block">
                      CVC
                    </label>
                    <div className={stripeElementClass}>
                      <CardCvcElement
                        options={{ style: stripeElementStyle }}
                        onFocus={() => setCardFocused("cardCvc")}
                        onBlur={() => setCardFocused(null)}
                        onChange={(e) => {
                          setCardComplete((p) => ({ ...p, cvc: e.complete }));
                          if (errors.payment) setErrors((p) => ({ ...p, payment: "" }));
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Stripe trust line */}
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  <Lock className="w-3 h-3 text-gray-400" />
                  <span className="text-[11px] text-gray-400">Secured by</span>
                  <Image
                    src="/images/stripe.png"
                    alt="Stripe"
                    width={40}
                    height={17}
                    className="opacity-70 dark:brightness-200"
                  />
                </div>
              </div>

              {errors.payment && (
                <p className="text-red-400 text-xs mt-2 flex items-center gap-1 font-medium animate-fade-in">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.payment}
                </p>
              )}
            </div>
            )}

            {/* Cash Payment Section */}
            {paymentMode === "cash" && (
              <div className="mb-6">
                <h3 className="text-sm xs:text-base font-bold mb-3 text-theme-heading-primary flex items-center gap-2">
                  <span className="w-[22px] h-[22px] rounded-md bg-green-600/10 flex items-center justify-center text-[11px] font-black text-green-600 dark:text-green-400">4</span>
                  Gotovinska uplata
                </h3>

                <div className="rounded-lg border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/30 p-4 space-y-4">
                  {/* Info */}
                  <div className="flex items-start gap-3 p-3 rounded-md bg-green-500/5 border border-green-500/15">
                    <Banknote className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-theme-heading-primary">Plaćanje gotovinom</p>
                      <p className="text-xs text-theme-text-secondary mt-1">Izaberite datum do kojeg ćete dostaviti uplatu od &euro;{tierPrice}. Vaša registracija će biti potvrđena nakon primanja uplate.</p>
                    </div>
                  </div>

                  {/* Date picker */}
                  <div>
                    <label className="text-xs font-semibold text-theme-text-secondary mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Datum dostave uplate
                    </label>
                    <input
                      type="date"
                      value={cashDeliveryDate}
                      onChange={(e) => {
                        setCashDeliveryDate(e.target.value);
                        if (errors.cashDeliveryDate) {
                          setErrors((p) => ({ ...p, cashDeliveryDate: "" }));
                        }
                      }}
                      min={new Date().toISOString().split("T")[0]}
                      className="input-theme w-full px-4 py-3 border-2 rounded-md transition-all duration-300 focus-ring text-sm"
                    />
                    {errors.cashDeliveryDate && (
                      <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1 font-medium animate-fade-in">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.cashDeliveryDate}
                      </p>
                    )}
                  </div>

                  {/* Checkbox confirmation */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={cashConfirmed}
                        onChange={(e) => {
                          setCashConfirmed(e.target.checked);
                          if (errors.cashConfirmed) {
                            setErrors((p) => ({ ...p, cashConfirmed: "" }));
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                        cashConfirmed
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300 dark:border-gray-600 group-hover:border-green-400"
                      }`}>
                        {cashConfirmed && (
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-theme-text-secondary leading-relaxed">
                      Potvrđujem da ću dostaviti uplatu od <strong className="text-theme-heading-primary">&euro;{tierPrice}</strong> do odabranog datuma.
                    </span>
                  </label>
                  {errors.cashConfirmed && (
                    <p className="text-red-400 text-xs flex items-center gap-1 font-medium animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.cashConfirmed}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Trust Signals */}
            {paymentMode === "card" && (
            <div className="flex items-center justify-center gap-4 sm:gap-6 mb-6 text-theme-text-secondary">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span className="text-[11px] font-medium">256-bit SSL</span>
              </div>
              <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-500" />
                <span className="text-[11px] font-medium">PCI DSS</span>
              </div>
              <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-indigo-500" />
                <Image
                  src="/images/stripe.png"
                  alt="Stripe"
                  width={36}
                  height={15}
                  className="opacity-60 dark:brightness-200"
                />
              </div>
            </div>
            )}

            {/* reCAPTCHA */}
            <div className="flex justify-center mb-6">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                onChange={(token) => {
                  setRecaptchaToken(token);
                  if (errors.recaptcha) {
                    setErrors((p) => ({ ...p, recaptcha: "" }));
                  }
                }}
                onExpired={() => setRecaptchaToken(null)}
                theme={theme === "dark" ? "dark" : "light"}
              />
            </div>
            {errors.recaptcha && (
              <p className="text-red-400 text-xs mb-4 flex items-center justify-center gap-1 font-medium animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.recaptcha}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 md:py-4 px-8 rounded-lg text-sm md:text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden shadow-md shadow-purple-600/15 hover:shadow-lg hover:shadow-purple-600/20 font-anta focus-ring gpu-accelerated active:scale-[0.98]"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2.5">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Obrađujem uplatu...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2.5">
                  {paymentMode === "card" ? (
                    <>
                      <Lock className="w-[18px] h-[18px]" />
                      Plati &euro;{tierPrice} i registruj se
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-[18px] h-[18px]" />
                      Registruj se
                    </>
                  )}
                </span>
              )}
            </button>

            <p className="text-center text-[11px] text-theme-text-secondary mt-3 leading-relaxed">
              Vaši podaci su zaštićeni 256-bit SSL enkripcijom. Kartični podaci se sigurno obrađuju putem Stripe-a.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}

const PLRegistrationForm = React.memo(function PLRegistrationForm() {
  return (
    <Elements stripe={stripePromise}>
      <PLRegistrationFormInner />
    </Elements>
  );
});

export default PLRegistrationForm;
