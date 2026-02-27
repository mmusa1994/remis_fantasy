"use client";

import React, { useState, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useTheme } from "@/contexts/ThemeContext";
import Toast from "./shared/Toast";
import ReCAPTCHA from "react-google-recaptcha";
import {
  AlertCircle,
  Trophy,
  BarChart3,
  Gift,
  Zap,
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle,
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

function F1RegistrationFormInner() {
  const { theme } = useTheme();
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [cardBrand, setCardBrand] = useState<string>("unknown");
  const [cardFocused, setCardFocused] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });
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

    if (!formData.first_name.trim()) {
      newErrors.first_name = "Ime je obavezno";
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Prezime je obavezno";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email je obavezan";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Unesite validnu email adresu";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Broj telefona je obavezan";
    } else {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,20}$/;
      const cleanPhone = formData.phone.replace(/\s/g, "");
      if (!phoneRegex.test(formData.phone) || cleanPhone.length < 8) {
        newErrors.phone = "Unesite validan broj telefona";
      }
    }
    if (!cardComplete.cardNumber || !cardComplete.cardExpiry || !cardComplete.cardCvc) {
      newErrors.payment = "Unesite podatke kartice";
    }
    if (!recaptchaToken) {
      newErrors.recaptcha = "Potvrdite da niste robot";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!stripe || !elements) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/f1/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          notes: formData.notes.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Greska pri registraciji");
      }

      const cardNumber = elements.getElement(CardNumberElement);
      if (!cardNumber) throw new Error("Card element not found");

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(data.clientSecret, {
          payment_method: {
            card: cardNumber,
            billing_details: {
              name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
              email: formData.email.trim(),
              phone: formData.phone.trim(),
            },
          },
        });

      if (stripeError) {
        throw new Error(stripeError.message || "Greska pri placanju");
      }

      if (paymentIntent?.status === "succeeded") {
        router.push("/f1-fantasy/registration/success");
      }
    } catch (error: unknown) {
      console.error("F1 registration error:", error);
      setToast({
        show: true,
        message:
          error instanceof Error
            ? error.message
            : "Doslo je do greske. Pokusajte ponovo.",
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
    `input-theme relative w-full px-3 xs:px-4 py-3 xs:py-4 border-2 rounded-xl peer transition-all duration-300 focus-ring text-sm xs:text-base ${
      errors[field]
        ? "border-red-400"
        : focusedField === field
          ? "border-red-500/60"
          : ""
    }`;

  const labelClassName = (field: string, value: string) =>
    `floating-label transition-all duration-300 theme-transition text-xs xs:text-sm ${
      value || focusedField === field
        ? "transform -translate-y-2 scale-90"
        : "floating-label-placeholder transform translate-y-0 scale-100"
    }`;

  const cardInputClass = (field: string) =>
    `input-theme px-4 py-4 border-2 rounded-xl transition-all duration-300 ${
      cardFocused === field
        ? "border-red-500/60 shadow-sm shadow-red-500/10"
        : cardComplete[field as keyof typeof cardComplete]
          ? "border-green-500/50"
          : ""
    }`;

  const cardElementStyle = {
    base: {
      fontSize: "16px",
      color: theme === "dark" ? "#e5e7eb" : "#1f2937",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSmoothing: "antialiased",
      "::placeholder": {
        color: theme === "dark" ? "#4b5563" : "#9ca3af",
      },
    },
    invalid: {
      color: "#f87171",
      iconColor: "#f87171",
    },
  };

  const CardBrandIcon = () => {
    if (cardBrand === "visa") {
      return <span className="text-[11px] font-black italic text-blue-600 dark:text-blue-400 tracking-tight">VISA</span>;
    }
    if (cardBrand === "mastercard") {
      return (
        <span className="flex items-center -space-x-1">
          <span className="w-3.5 h-3.5 rounded-full bg-red-500 inline-block" />
          <span className="w-3.5 h-3.5 rounded-full bg-orange-400 inline-block" />
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

      <section className="relative w-full bg-theme-background theme-transition">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-red-900/15 via-orange-800/10 to-red-800/15 rounded-full blur-3xl animate-pulse-gentle gpu-accelerated" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-l from-orange-900/15 via-red-900/10 to-orange-800/15 rounded-full blur-3xl animate-float-slow gpu-accelerated" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-5xl">
          {/* Header */}
          <div className="flex justify-center items-center flex-col mb-10 sm:mb-14 animate-fade-in-up">
            <div className="w-16 h-16 xs:w-20 xs:h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-2xl shadow-red-500/30 mb-6">
              <Zap className="w-8 h-8 xs:w-10 xs:h-10 md:w-12 md:h-12 text-white" />
            </div>

            <h2 className="text-2xl xs:text-3xl md:text-5xl lg:text-6xl font-black mb-2 xs:mb-3 text-balance leading-tight font-russo animate-scale-in animate-delay-200">
              <span className="bg-gradient-to-r from-red-600 via-orange-500 to-red-700 bg-clip-text text-transparent">
                F1 FANTASY 25/26
              </span>
            </h2>

            <h3 className="text-lg xs:text-xl md:text-2xl font-bold mb-4 text-theme-heading-primary">
              Registracija
            </h3>

            <p className="text-theme-text-secondary text-xs xs:text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-medium text-center px-2">
              Prijavite se za najuzbudljiviju motorsport fantasy ligu! Sav
              uplaceni novac ide u nagradni fond —{" "}
              <span className="font-bold text-red-500">100%</span>.
            </p>
          </div>

          {/* What You Get */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-10 animate-fade-in-up animate-delay-200">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-red-500/5 to-orange-500/5 border border-red-500/15 hover:border-red-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <div className="font-bold text-theme-heading-primary text-sm">Takmicenje za nagrade</div>
                <div className="text-xs text-theme-text-secondary">Osvojite dio nagradnog fonda</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-orange-500/5 to-red-500/5 border border-orange-500/15 hover:border-orange-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <div className="font-bold text-theme-heading-primary text-sm">Live tabela</div>
                <div className="text-xs text-theme-text-secondary">Rezultati u realnom vremenu</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-red-500/5 to-orange-500/5 border border-red-500/15 hover:border-red-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <div className="font-bold text-theme-heading-primary text-sm">Grand Prix nagrade</div>
                <div className="text-xs text-theme-text-secondary">Specijalne nagrade za svaku trku</div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="relative p-5 sm:p-8 md:p-10 border border-gray-200/60 dark:border-gray-700/60 rounded-3xl bg-theme-background/90 backdrop-blur-md theme-transition shadow-xl shadow-black/5 dark:shadow-black/20 animate-fade-in-up animate-delay-300"
          >
            {/* Price badge */}
            <div className="flex justify-center -mt-10 sm:-mt-12 mb-8">
              <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-6 py-2.5 rounded-full shadow-lg shadow-red-500/25 flex items-center gap-2">
                <span className="text-sm font-medium opacity-90">Kotizacija:</span>
                <span className="text-xl font-black">&euro;10</span>
              </div>
            </div>

            {/* Personal Info */}
            <div className="mb-8">
              <h3 className="text-sm xs:text-base font-bold mb-4 text-theme-heading-primary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-xs font-black text-red-500">1</span>
                Licni podaci
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange("first_name", e.target.value)}
                      onFocus={() => setFocusedField("first_name")}
                      onBlur={() => setFocusedField(null)}
                      className={inputClassName("first_name")}
                    />
                    <label htmlFor="first_name" className={labelClassName("first_name", formData.first_name)}>
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
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange("last_name", e.target.value)}
                      onFocus={() => setFocusedField("last_name")}
                      onBlur={() => setFocusedField(null)}
                      className={inputClassName("last_name")}
                    />
                    <label htmlFor="last_name" className={labelClassName("last_name", formData.last_name)}>
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
            <div className="mb-8">
              <h3 className="text-sm xs:text-base font-bold mb-4 text-theme-heading-primary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-xs font-black text-red-500">2</span>
                Kontakt podaci
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      className={inputClassName("email")}
                    />
                    <label htmlFor="email" className={labelClassName("email", formData.email)}>
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
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => setFocusedField(null)}
                      className={inputClassName("phone")}
                    />
                    <label htmlFor="phone" className={labelClassName("phone", formData.phone)}>
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
            <div className="mb-8">
              <div className="relative">
                <div className="relative">
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    onFocus={() => setFocusedField("notes")}
                    onBlur={() => setFocusedField(null)}
                    rows={2}
                    className={inputClassName("notes")}
                  />
                  <label htmlFor="notes" className={labelClassName("notes", formData.notes)}>
                    Napomene (opcionalno)
                  </label>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-theme-background px-4 text-xs text-theme-text-secondary font-medium uppercase tracking-wider">
                  Placanje
                </span>
              </div>
            </div>

            {/* Payment Section */}
            <div className="mb-8">
              <h3 className="text-sm xs:text-base font-bold mb-4 text-theme-heading-primary flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-xs font-black text-red-500">3</span>
                Podaci o kartici
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                    <span className="text-[10px] font-black italic text-blue-600 dark:text-blue-400">VISA</span>
                  </div>
                  <div className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block -ml-1" />
                  </div>
                  <div className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                    <span className="text-[9px] font-black text-blue-500 dark:text-blue-300">AMEX</span>
                  </div>
                </div>
              </h3>

              {/* Interactive 3D Card - Premium Black */}
              <div className="flex justify-center mb-6" style={{ perspective: "1200px" }}>
                <div
                  className="relative w-[340px] sm:w-[380px] h-[210px] sm:h-[230px] transition-transform duration-700 ease-in-out"
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
                    {/* Subtle shimmer overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-red-900/10 via-transparent to-orange-800/8" />
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white 0%, transparent 50%), radial-gradient(circle at 70% 80%, white 0%, transparent 50%)" }} />
                    {/* Top edge highlight */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                    {/* Left edge highlight */}
                    <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-transparent to-transparent" />

                    <div className="relative h-full p-6 sm:p-7 flex flex-col justify-between">
                      {/* Top row: chip + contactless + brand */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {/* Premium chip */}
                          <div className="w-11 h-8 sm:w-12 sm:h-9 rounded-lg overflow-hidden" style={{
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
                            <span className="text-xl sm:text-2xl font-black italic text-white/80 tracking-tight" style={{ textShadow: "0 0 20px rgba(255,255,255,0.1)" }}>VISA</span>
                          )}
                          {cardBrand === "mastercard" && (
                            <span className="flex items-center -space-x-2.5">
                              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-500 inline-block opacity-90" />
                              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-orange-400 inline-block opacity-90" />
                            </span>
                          )}
                          {cardBrand === "amex" && (
                            <span className="text-base sm:text-lg font-black text-white/80 tracking-widest">AMEX</span>
                          )}
                          {(cardBrand === "unknown" || !cardBrand) && (
                            <CreditCard className="w-8 h-8 sm:w-9 sm:h-9 text-white/20" />
                          )}
                        </div>
                      </div>

                      {/* Card number */}
                      <div className="font-mono text-[15px] xs:text-[17px] sm:text-[20px] tracking-[0.15em] sm:tracking-[0.2em] font-medium whitespace-nowrap" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                        {cardComplete.cardNumber ? (
                          <span className="text-white/85">•••• •••• •••• ••••</span>
                        ) : (
                          <span className="text-white/20">•••• •••• •••• ••••</span>
                        )}
                      </div>

                      {/* Bottom row: name + expiry */}
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-white/30 mb-1 font-medium">Card Holder</div>
                          <div className="text-[13px] sm:text-sm font-semibold text-white/70 tracking-wider uppercase truncate max-w-[200px]" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                            {formData.first_name || formData.last_name
                              ? `${formData.first_name} ${formData.last_name}`.trim()
                              : "YOUR NAME"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-white/30 mb-1 font-medium">Expires</div>
                          <div className="text-[13px] sm:text-sm font-semibold text-white/70 font-mono tracking-wider">
                            {cardComplete.cardExpiry ? "••/••" : <span className="text-white/20">MM/YY</span>}
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
                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-900/8 via-transparent to-red-900/8" />

                    <div className="relative h-full flex flex-col">
                      {/* Magnetic stripe */}
                      <div className="w-full h-[52px] sm:h-[58px] mt-7 sm:mt-8" style={{
                        background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 40%, #0f0f0f 60%, #1a1a1a 100%)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
                      }} />

                      {/* Signature + CVC */}
                      <div className="flex items-center gap-3 px-6 sm:px-7 mt-6 sm:mt-7">
                        {/* Signature strip */}
                        <div className="flex-1 h-10 sm:h-11 rounded-md" style={{
                          background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}>
                          <div className="h-full flex items-center px-3">
                            <div className="w-full h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
                          </div>
                        </div>
                        {/* CVC box */}
                        <div className={`w-16 sm:w-[72px] h-10 sm:h-11 rounded-md flex items-center justify-center font-mono text-sm sm:text-base font-bold transition-all duration-300 ${
                          cardFocused === "cardCvc"
                            ? "bg-white/20 text-white border border-white/40 shadow-lg shadow-white/5"
                            : "bg-white/8 text-white/40 border border-white/10"
                        }`}>
                          {cardComplete.cardCvc ? "•••" : "CVC"}
                        </div>
                      </div>

                      {/* Bottom: stripe logo */}
                      <div className="mt-auto px-6 sm:px-7 pb-5 sm:pb-6 flex justify-end">
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

              {/* Card Inputs */}
              <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-gradient-to-b from-gray-50/80 to-white/80 dark:from-gray-800/50 dark:to-gray-900/50 p-4 sm:p-5 space-y-3">
                {/* Card Number */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-theme-text-secondary flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      Broj kartice
                    </label>
                    {cardBrand !== "unknown" && <CardBrandIcon />}
                  </div>
                  <div className={cardInputClass("cardNumber")}>
                    <CardNumberElement
                      options={{ style: cardElementStyle, showIcon: true }}
                      onFocus={() => setCardFocused("cardNumber")}
                      onBlur={() => setCardFocused(null)}
                      onChange={(e) => {
                        setCardBrand(e.brand || "unknown");
                        setCardComplete((p) => ({ ...p, cardNumber: e.complete }));
                        if (e.complete && errors.payment) {
                          setErrors((p) => ({ ...p, payment: "" }));
                        }
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
                    <div className={cardInputClass("cardExpiry")}>
                      <CardExpiryElement
                        options={{ style: cardElementStyle }}
                        onFocus={() => setCardFocused("cardExpiry")}
                        onBlur={() => setCardFocused(null)}
                        onChange={(e) =>
                          setCardComplete((p) => ({ ...p, cardExpiry: e.complete }))
                        }
                      />
                    </div>
                  </div>

                  {/* CVC */}
                  <div>
                    <label className="text-xs font-semibold text-theme-text-secondary mb-1.5 block">
                      CVC
                    </label>
                    <div className={cardInputClass("cardCvc")}>
                      <CardCvcElement
                        options={{ style: cardElementStyle }}
                        onFocus={() => setCardFocused("cardCvc")}
                        onBlur={() => setCardFocused(null)}
                        onChange={(e) =>
                          setCardComplete((p) => ({ ...p, cardCvc: e.complete }))
                        }
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

            {/* Trust Signals */}
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
              disabled={isSubmitting || !stripe}
              className="w-full bg-gradient-to-r from-red-600 via-orange-600 to-red-700 hover:from-red-700 hover:via-orange-700 hover:to-red-800 text-white font-black py-4 md:py-5 px-8 rounded-2xl text-base md:text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 border border-red-500/30 font-russo focus-ring gpu-accelerated active:scale-[0.98]"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2.5">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Obrada placanja...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2.5">
                  <Lock className="w-4.5 h-4.5" />
                  Plati &euro;10 i Registruj se
                </span>
              )}
            </button>

            <p className="text-center text-[11px] text-theme-text-secondary mt-3 leading-relaxed">
              Vasi podaci kartice su zasticeni enkripcijom. Nikada ne vidimo niti cuvamo podatke vase kartice.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}

const F1RegistrationForm = React.memo(function F1RegistrationForm() {
  return (
    <Elements stripe={stripePromise}>
      <F1RegistrationFormInner />
    </Elements>
  );
});

export default F1RegistrationForm;
