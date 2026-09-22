"use client";

import React, { useState, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import Toast from "./shared/Toast";
import ReCAPTCHA from "react-google-recaptcha";
import {
  AlertCircle,
  Trophy,
  BarChart3,
  Gift,
  CheckCircle,
  Banknote,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";

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
  // Calculate total price based on selections
  const tierPrice = (mainLeague === "standard" ? 20 : mainLeague === "premium" ? 50 : 0) + (h2hSelected ? 15 : 0);

  // Build league_tier string for API
  const getLeagueTier = () => {
    if (mainLeague && h2hSelected) return `${mainLeague}_h2h`;
    if (mainLeague) return mainLeague;
    if (h2hSelected) return "h2h_only";
    return "";
  };

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
    if (!cashDeliveryDate) {
      newErrors.cashDeliveryDate = "Morate odabrati datum dostave uplate";
    }
    if (!cashConfirmed) {
      newErrors.cashConfirmed = "Morate potvrditi da ćete dostaviti uplatu";
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

    setIsSubmitting(true);

    try {
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
          recaptcha_token: recaptchaToken,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("common:validation.registrationError"));
      }
      router.push("/premier-league/registration/success?method=cash");
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

            {/* Payment Method */}
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

              <div className="flex items-center gap-3 p-3.5 rounded-lg border-2 border-green-600/50 bg-green-500/[0.04] dark:bg-green-500/[0.08]">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-600/10 text-green-600 dark:text-green-400">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-green-600 dark:text-green-400">
                    Gotovina
                  </div>
                  <div className="text-[10px] text-theme-text-secondary mt-0.5">
                    Dostava gotovine — jedini dostupni način plaćanja
                  </div>
                </div>
              </div>
            </div>

            {/* Cash Payment Section */}
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
                  Obrađujem registraciju...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2.5">
                  <CheckCircle className="w-[18px] h-[18px]" />
                  Registruj se
                </span>
              )}
            </button>

            <p className="text-center text-[11px] text-theme-text-secondary mt-3 leading-relaxed">
              Vaši podaci se prenose preko 256-bit SSL enkripcije i koriste se isključivo za potrebe lige.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}

const PLRegistrationForm = React.memo(function PLRegistrationForm() {
  return <PLRegistrationFormInner />;
});

export default PLRegistrationForm;
