"use client";

import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import Toast from "@/components/shared/Toast";
import {
  AlertCircle,
  CheckCircle,
  Trophy,
  BarChart3,
  CreditCard,
  Shield,
  Lock,
  Banknote,
} from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  team_name: string;
  payment_method: "card" | "cash";
  notes: string;
}

function WC2026FormInner() {
  const { theme } = useTheme();
  const { t } = useTranslation("wc2026");
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const isDark = theme === "dark";

  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    team_name: "",
    payment_method: "card",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [cardFocused, setCardFocused] = useState<string | null>(null);
  const [cardBrand, setCardBrand] = useState<string>("unknown");
  const [cardComplete, setCardComplete] = useState({
    number: false,
    expiry: false,
    cvc: false,
  });
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const stripeElementStyle = {
    base: {
      fontSize: "14px",
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      letterSpacing: "0.05em",
      color: isDark ? "#e5e7eb" : "#1f2937",
      "::placeholder": { color: isDark ? "#6b7280" : "#9ca3af" },
    },
    invalid: { color: "#f87171" },
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim())
      newErrors.first_name = t("registration.errors.firstNameRequired");
    if (!formData.last_name.trim())
      newErrors.last_name = t("registration.errors.lastNameRequired");
    if (!formData.email.trim()) {
      newErrors.email = t("registration.errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("registration.errors.emailInvalid");
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t("registration.errors.phoneRequired");
    } else {
      const cleanPhone = formData.phone.replace(/\s/g, "");
      if (
        !/^[+]?[\d\s\-()]{8,20}$/.test(formData.phone) ||
        cleanPhone.length < 8
      )
        newErrors.phone = t("registration.errors.phoneInvalid");
    }
    if (!formData.team_name.trim())
      newErrors.team_name = t("registration.errors.teamNameRequired");
    if (formData.payment_method === "card") {
      if (!cardComplete.number || !cardComplete.expiry || !cardComplete.cvc) {
        newErrors.payment = t("registration.errors.paymentRequired");
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (formData.payment_method === "card" && !stripe) return;

    setIsSubmitting(true);

    try {
      // Cash flow — just register, no Stripe
      if (formData.payment_method === "cash") {
        const response = await fetch("/api/wc2026/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            team_name: formData.team_name.trim(),
            payment_method: "cash",
            notes: formData.notes.trim(),
          }),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Registration failed");
        router.push("/wc2026/registration/success");
        return;
      }

      // Card flow — PCI-compliant Stripe Elements
      if (!stripe || !elements) return;

      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) return;

      const { error: pmError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: "card",
          card: cardNumberElement,
          billing_details: {
            name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
            email: formData.email.trim(),
            phone: formData.phone.trim(),
          },
        });

      if (pmError) {
        throw new Error(pmError.message || "Payment method creation failed");
      }

      // Send payment_method_id to backend → creates PaymentIntent → returns clientSecret
      const response = await fetch("/api/wc2026/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          team_name: formData.team_name.trim(),
          payment_method: "card",
          payment_method_id: paymentMethod.id,
          notes: formData.notes.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Registration failed");

      // Confirm the payment client-side
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(data.clientSecret);

      if (stripeError) {
        throw new Error(stripeError.message || "Payment confirmation failed");
      }

      if (paymentIntent?.status === "succeeded") {
        router.push("/wc2026/registration/success");
      }
    } catch (error: unknown) {
      console.error("WC2026 registration error:", error);
      setToast({
        show: true,
        message:
          error instanceof Error ? error.message : "Registration failed",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const inputCls = (field: string) =>
    `w-full px-4 py-3 border rounded-lg text-sm transition-all duration-200 outline-none ${
      isDark
        ? "bg-gray-800/60 text-white placeholder-gray-500"
        : "bg-gray-50 text-gray-900 placeholder-gray-400"
    } ${
      errors[field]
        ? "border-red-400 focus:ring-2 focus:ring-red-400/30"
        : focusedField === field
          ? "border-teal-500/50 ring-2 ring-teal-500/20"
          : isDark
            ? "border-gray-700 focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20"
            : "border-gray-200 focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20"
    }`;

  const labelCls = `block text-xs font-semibold mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`;

  const stripeElementClass = `w-full px-3.5 py-3 border rounded-lg transition-all duration-200 text-sm ${
    isDark
      ? "bg-gray-800/60 text-white"
      : "bg-gray-50 text-gray-900"
  } ${
    cardFocused
      ? "border-teal-500/50 ring-1 ring-teal-500/20"
      : isDark
        ? "border-gray-700"
        : "border-gray-200"
  }`;

  const CardBrandIcon = () => {
    if (cardBrand === "visa") {
      return (
        <span className="text-[11px] font-black italic text-blue-600 dark:text-blue-400 tracking-tight">
          VISA
        </span>
      );
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
      return (
        <span className="text-[10px] font-black text-blue-500 tracking-tight">
          AMEX
        </span>
      );
    }
    return null;
  };

  if (isSuccess) {
    return (
      <motion.div
        className={`rounded-2xl border p-8 md:p-12 text-center max-w-lg mx-auto ${
          isDark
            ? "bg-gray-900 border-gray-800"
            : "bg-white border-gray-200"
        }`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <Image
          src="/images/logos/wc-logo.png"
          alt="WC2026"
          width={60}
          height={36}
          className="h-9 w-auto object-contain mx-auto mb-4"
        />
        <div className="w-20 h-20 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-teal-600 dark:text-teal-400" />
        </div>
        <h2
          className={`text-2xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
        >
          {t("registration.successTitle")}
        </h2>
        <p
          className={`text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}
        >
          {t("registration.successMessage")}
        </p>
      </motion.div>
    );
  }

  const features = [
    {
      icon: Trophy,
      titleKey: "registration.feature1Title",
      descKey: "registration.feature1Desc",
    },
    {
      icon: BarChart3,
      titleKey: "registration.feature2Title",
      descKey: "registration.feature2Desc",
    },
  ];

  return (
    <>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <section className="relative w-full bg-theme-background pb-16 sm:pb-20">
        <div className="mx-auto px-4 sm:px-6 max-w-2xl">
          {/* Header with WC Logo */}
          <div className="text-center mb-8">
            <motion.div
              className="flex justify-center mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src="/images/logos/wc-logo.png"
                alt="FIFA World Cup 2026"
                width={80}
                height={48}
                className="h-12 w-auto object-contain"
                priority
              />
            </motion.div>
            <motion.h2
              className="text-xl sm:text-2xl md:text-3xl font-black mb-1.5 font-anta bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-400 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {t("registration.title")}
            </motion.h2>
            <motion.div
              className="flex items-center justify-center gap-2.5 mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h3
                className={`text-base sm:text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {t("registration.subtitle")}
              </h3>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm">
                5,00 &euro;
              </span>
            </motion.div>
            <motion.p
              className={`text-sm max-w-md mx-auto ${isDark ? "text-gray-400" : "text-gray-600"}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {t("registration.description")}
            </motion.p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.titleKey}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${
                    isDark
                      ? "bg-gray-800/40 border-gray-700/50 hover:border-teal-500/30"
                      : "bg-gray-50/80 border-gray-200/60 hover:border-teal-500/30"
                  }`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`font-semibold text-sm leading-tight ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {t(f.titleKey)}
                    </div>
                    <div className="text-xs leading-tight mt-0.5 text-gray-500">
                      {t(f.descKey)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className={`rounded-2xl border p-5 sm:p-6 md:p-8 ${
              isDark
                ? "bg-gray-900/80 border-gray-800"
                : "bg-white border-gray-200"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Section 1 — Personal */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded bg-teal-600/10 flex items-center justify-center text-[10px] font-black text-teal-600 dark:text-teal-400">
                  1
                </span>
                <span
                  className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {t("registration.personalInfo")}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="wc_fn" className={labelCls}>
                    {t("registration.firstName")} *
                  </label>
                  <input
                    id="wc_fn"
                    type="text"
                    value={formData.first_name}
                    onChange={(e) =>
                      handleInputChange("first_name", e.target.value)
                    }
                    onFocus={() => setFocusedField("first_name")}
                    onBlur={() => setFocusedField(null)}
                    className={inputCls("first_name")}
                    placeholder={t("registration.firstName")}
                  />
                  {errors.first_name && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {errors.first_name}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="wc_ln" className={labelCls}>
                    {t("registration.lastName")} *
                  </label>
                  <input
                    id="wc_ln"
                    type="text"
                    value={formData.last_name}
                    onChange={(e) =>
                      handleInputChange("last_name", e.target.value)
                    }
                    onFocus={() => setFocusedField("last_name")}
                    onBlur={() => setFocusedField(null)}
                    className={inputCls("last_name")}
                    placeholder={t("registration.lastName")}
                  />
                  {errors.last_name && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {errors.last_name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2 — Contact */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded bg-teal-600/10 flex items-center justify-center text-[10px] font-black text-teal-600 dark:text-teal-400">
                  2
                </span>
                <span
                  className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {t("registration.contactInfo")}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="wc_em" className={labelCls}>
                    Email *
                  </label>
                  <input
                    id="wc_em"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      handleInputChange("email", e.target.value)
                    }
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    className={inputCls("email")}
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="wc_ph" className={labelCls}>
                    {t("registration.phone")} *
                  </label>
                  <input
                    id="wc_ph"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      handleInputChange("phone", e.target.value)
                    }
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                    className={inputCls("phone")}
                    placeholder="+387 6X XXX XXX"
                  />
                  {errors.phone && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3 — Team */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded bg-teal-600/10 flex items-center justify-center text-[10px] font-black text-teal-600 dark:text-teal-400">
                  3
                </span>
                <span
                  className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {t("registration.teamInfo")}
                </span>
              </div>
              <label htmlFor="wc_tn" className={labelCls}>
                {t("registration.teamName")} *
              </label>
              <input
                id="wc_tn"
                type="text"
                value={formData.team_name}
                onChange={(e) =>
                  handleInputChange("team_name", e.target.value)
                }
                onFocus={() => setFocusedField("team_name")}
                onBlur={() => setFocusedField(null)}
                className={inputCls("team_name")}
                placeholder={t("registration.teamName")}
              />
              {errors.team_name && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {errors.team_name}
                </p>
              )}
            </div>

            {/* Section 4 — Payment */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded bg-teal-600/10 flex items-center justify-center text-[10px] font-black text-teal-600 dark:text-teal-400">
                  4
                </span>
                <span
                  className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {t("registration.paymentMethod")}
                </span>
                <span className="ml-auto text-sm font-bold text-teal-600 dark:text-teal-400">
                  5,00 &euro;
                </span>
              </div>

              {/* Card — dominant */}
              <button
                type="button"
                onClick={() => handleInputChange("payment_method", "card")}
                className={`w-full rounded-xl border-2 p-4 sm:p-5 mb-3 transition-all duration-300 text-left ${
                  formData.payment_method === "card"
                    ? "border-teal-500 bg-gradient-to-br from-teal-500/[0.04] to-emerald-500/[0.04] dark:from-teal-500/[0.08] dark:to-emerald-500/[0.08] shadow-sm shadow-teal-500/10"
                    : isDark
                      ? "border-gray-700 hover:border-gray-600"
                      : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                      formData.payment_method === "card"
                        ? "bg-gradient-to-br from-teal-500/20 to-emerald-500/20"
                        : isDark
                          ? "bg-gray-800"
                          : "bg-gray-100"
                    }`}
                  >
                    <CreditCard
                      className={`w-5 h-5 ${
                        formData.payment_method === "card"
                          ? "text-teal-500"
                          : isDark
                            ? "text-gray-400"
                            : "text-gray-500"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {t("registration.paymentCard")}
                    </div>
                    <div
                      className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      Visa, Mastercard, American Express
                    </div>
                  </div>
                  <AnimatePresence>
                    {formData.payment_method === "card" && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-500/30 flex-shrink-0"
                      >
                        <CheckCircle className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </button>

              {/* Card payment section — inline Stripe Elements */}
              <AnimatePresence>
                {formData.payment_method === "card" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden mb-3"
                  >
                    {/* 3D Card Visual */}
                    <div
                      className="flex justify-center mb-5"
                      style={{ perspective: "1200px" }}
                    >
                      <div
                        className="relative w-[300px] sm:w-[340px] h-[185px] sm:h-[210px] transition-transform duration-700 ease-in-out"
                        style={{
                          transformStyle: "preserve-3d",
                          transform:
                            cardFocused === "cardCvc"
                              ? "rotateY(180deg)"
                              : "rotateY(0deg)",
                        }}
                      >
                        {/* Front */}
                        <div
                          className="absolute inset-0 rounded-[20px] overflow-hidden"
                          style={{
                            backfaceVisibility: "hidden",
                            boxShadow:
                              "0 25px 60px -12px rgba(0, 0, 0, 0.5), 0 0 40px -8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          {/* Premium dark base with teal tint */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#0f1f1a] via-[#0d1a17] to-[#0a1410]" />
                          {/* Teal shimmer overlay */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-teal-950/8 via-transparent to-emerald-900/5" />
                          <div
                            className="absolute inset-0 opacity-[0.03]"
                            style={{
                              backgroundImage:
                                "radial-gradient(circle at 30% 20%, white 0%, transparent 50%), radial-gradient(circle at 70% 80%, white 0%, transparent 50%)",
                            }}
                          />
                          {/* Top edge highlight */}
                          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                          {/* Left edge highlight */}
                          <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-transparent to-transparent" />

                          <div className="relative h-full p-5 sm:p-6 flex flex-col justify-between">
                            {/* Top row: chip + contactless + brand */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                {/* Premium chip */}
                                <div
                                  className="w-10 h-7 sm:w-11 sm:h-8 rounded-lg overflow-hidden"
                                  style={{
                                    background:
                                      "linear-gradient(135deg, #d4af37 0%, #f5d061 25%, #d4af37 50%, #c5a028 75%, #f5d061 100%)",
                                    boxShadow:
                                      "inset 0 1px 2px rgba(255,255,255,0.3), 0 1px 3px rgba(0,0,0,0.3)",
                                  }}
                                >
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div
                                      className="w-7 h-5 sm:w-8 sm:h-6 rounded-sm"
                                      style={{
                                        background:
                                          "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.15) 100%)",
                                        border:
                                          "1px solid rgba(180,150,50,0.4)",
                                      }}
                                    >
                                      <div className="w-full h-full grid grid-cols-3 gap-px p-px opacity-40">
                                        {[...Array(6)].map((_, i) => (
                                          <div
                                            key={i}
                                            className="bg-yellow-800/30 rounded-[1px]"
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {/* Contactless icon */}
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  className="text-white/25"
                                >
                                  <path
                                    d="M12.5 6.5C14.5 8 16 10 16 12.5S14.5 17 12.5 18.5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                  />
                                  <path
                                    d="M9.5 9C10.5 9.5 12 10.5 12 12.5S10.5 15.5 9.5 16"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                  />
                                  <path
                                    d="M6.5 11C7 11.5 8 12 8 12.5S7 13.5 6.5 14"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </div>
                              {/* Brand */}
                              <div className="flex items-center">
                                {cardBrand === "visa" && (
                                  <span className="text-lg sm:text-xl font-black italic text-white/75 tracking-tight">
                                    VISA
                                  </span>
                                )}
                                {cardBrand === "mastercard" && (
                                  <span className="flex items-center -space-x-2">
                                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500 inline-block opacity-85" />
                                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-500 inline-block opacity-85" />
                                  </span>
                                )}
                                {cardBrand === "amex" && (
                                  <span className="text-sm sm:text-base font-black text-white/75 tracking-widest">
                                    AMEX
                                  </span>
                                )}
                                {(cardBrand === "unknown" || !cardBrand) && (
                                  <CreditCard className="w-7 h-7 sm:w-8 sm:h-8 text-white/15" />
                                )}
                              </div>
                            </div>

                            {/* Card number placeholder */}
                            <div
                              className="font-mono text-[14px] xs:text-[15px] sm:text-[17px] tracking-[0.15em] sm:tracking-[0.18em] font-medium whitespace-nowrap rounded-md px-2 py-1 -mx-2"
                              style={{
                                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                              }}
                            >
                              <span className="text-white/15">
                                {"•••• •••• •••• ••••"}
                              </span>
                            </div>

                            {/* Bottom row: name + expiry */}
                            <div className="flex items-end justify-between">
                              <div>
                                <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-white/30 mb-1 font-medium">
                                  Card Holder
                                </div>
                                <div
                                  className={`text-[12px] sm:text-[13px] font-semibold tracking-wider uppercase truncate max-w-[180px] transition-colors duration-300 ${
                                    formData.first_name || formData.last_name
                                      ? "text-white/70"
                                      : "text-white/15"
                                  }`}
                                  style={{
                                    textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                  }}
                                >
                                  {formData.first_name || formData.last_name
                                    ? `${formData.first_name} ${formData.last_name}`.trim()
                                    : "YOUR NAME"}
                                </div>
                              </div>
                              <div className="text-right rounded-md px-2 py-1 -mr-2">
                                <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-white/30 mb-1 font-medium">
                                  Expires
                                </div>
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
                            boxShadow:
                              "0 25px 60px -12px rgba(0, 0, 0, 0.5), 0 0 40px -8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-[#0f1f1a] via-[#0d1a17] to-[#0a1410]" />
                          <div className="absolute inset-0 bg-gradient-to-tr from-teal-950/5 via-transparent to-teal-950/5" />

                          <div className="relative h-full flex flex-col">
                            {/* Magnetic stripe */}
                            <div
                              className="w-full h-[46px] sm:h-[50px] mt-6 sm:mt-7"
                              style={{
                                background:
                                  "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 40%, #0f0f0f 60%, #1a1a1a 100%)",
                                boxShadow:
                                  "0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
                              }}
                            />

                            {/* Signature + CVC */}
                            <div className="flex items-center gap-3 px-5 sm:px-6 mt-5 sm:mt-6">
                              <div
                                className="flex-1 h-10 sm:h-11 rounded-md"
                                style={{
                                  background:
                                    "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
                                  border: "1px solid rgba(255,255,255,0.06)",
                                }}
                              >
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

                    {/* Stripe Elements Inputs */}
                    <div
                      className={`rounded-lg border p-4 space-y-3 ${
                        isDark
                          ? "border-gray-700/60 bg-gray-800/30"
                          : "border-gray-200/60 bg-gray-50/50"
                      }`}
                    >
                      {/* Card Number */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            {t("registration.cardNumber")}
                          </label>
                          {cardBrand !== "unknown" && <CardBrandIcon />}
                        </div>
                        <div className={stripeElementClass}>
                          <CardNumberElement
                            options={{
                              style: stripeElementStyle,
                              showIcon: true,
                            }}
                            onFocus={() => setCardFocused("cardNumber")}
                            onBlur={() => setCardFocused(null)}
                            onChange={(e) => {
                              setCardBrand(e.brand || "unknown");
                              setCardComplete((p) => ({
                                ...p,
                                number: e.complete,
                              }));
                              if (errors.payment)
                                setErrors((p) => ({ ...p, payment: "" }));
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Expiry */}
                        <div>
                          <label
                            className={`text-xs font-semibold mb-1.5 block ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
                            {t("registration.cardExpiry")}
                          </label>
                          <div className={stripeElementClass}>
                            <CardExpiryElement
                              options={{ style: stripeElementStyle }}
                              onFocus={() => setCardFocused("cardExpiry")}
                              onBlur={() => setCardFocused(null)}
                              onChange={(e) => {
                                setCardComplete((p) => ({
                                  ...p,
                                  expiry: e.complete,
                                }));
                                if (errors.payment)
                                  setErrors((p) => ({ ...p, payment: "" }));
                              }}
                            />
                          </div>
                        </div>

                        {/* CVC */}
                        <div>
                          <label
                            className={`text-xs font-semibold mb-1.5 block ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
                            {t("registration.cardCvc")}
                          </label>
                          <div className={stripeElementClass}>
                            <CardCvcElement
                              options={{ style: stripeElementStyle }}
                              onFocus={() => setCardFocused("cardCvc")}
                              onBlur={() => setCardFocused(null)}
                              onChange={(e) => {
                                setCardComplete((p) => ({
                                  ...p,
                                  cvc: e.complete,
                                }));
                                if (errors.payment)
                                  setErrors((p) => ({ ...p, payment: "" }));
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {errors.payment && (
                        <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {errors.payment}
                        </p>
                      )}

                      {/* Security badges */}
                      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-teal-500" />
                          <span
                            className={`text-[11px] font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}
                          >
                            {t("registration.securePayment")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-teal-500" />
                          <span
                            className={`text-[11px] font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}
                          >
                            SSL {t("registration.encrypted")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Image
                            src="/images/stripe.png"
                            alt="Stripe"
                            width={40}
                            height={17}
                            className={`${isDark ? "brightness-200 opacity-50" : "opacity-60"}`}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Cash — subtle */}
              <button
                type="button"
                onClick={() => handleInputChange("payment_method", "cash")}
                className={`w-full rounded-lg border p-3 transition-all duration-300 ${
                  formData.payment_method === "cash"
                    ? isDark
                      ? "border-teal-500/30 bg-teal-500/[0.04]"
                      : "border-teal-500/25 bg-teal-50/40"
                    : isDark
                      ? "border-gray-800 hover:border-gray-700"
                      : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Banknote
                    className={`w-4 h-4 flex-shrink-0 ${
                      formData.payment_method === "cash"
                        ? "text-teal-500/60"
                        : isDark ? "text-gray-600" : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      formData.payment_method === "cash"
                        ? isDark ? "text-gray-300" : "text-gray-600"
                        : isDark ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {t("registration.paymentCash")}
                  </span>
                  {formData.payment_method === "cash" && (
                    <CheckCircle className="w-3.5 h-3.5 text-teal-500/60 ml-auto" />
                  )}
                </div>
              </button>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label htmlFor="wc_notes" className={labelCls}>
                {t("registration.notes")}
              </label>
              <textarea
                id="wc_notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                onFocus={() => setFocusedField("notes")}
                onBlur={() => setFocusedField(null)}
                rows={2}
                className={inputCls("notes")}
                placeholder={t("registration.notes")}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 hover:from-teal-500 hover:via-emerald-500 hover:to-teal-400 text-white font-bold py-3.5 px-8 rounded-xl text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-600/20 hover:shadow-xl hover:shadow-teal-500/30 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t("registration.submitting")}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {formData.payment_method === "card" ? (
                    <CreditCard className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {formData.payment_method === "card"
                    ? `${t("registration.submit")} — 5,00 €`
                    : t("registration.submit")}
                </span>
              )}
            </button>

            <p
              className={`text-center text-[11px] mt-3 ${isDark ? "text-gray-600" : "text-gray-400"}`}
            >
              {t("registration.disclaimer")}
            </p>
          </motion.form>
        </div>
      </section>
    </>
  );
}

export default function WC2026RegistrationForm() {
  return (
    <Elements stripe={stripePromise}>
      <WC2026FormInner />
    </Elements>
  );
}
