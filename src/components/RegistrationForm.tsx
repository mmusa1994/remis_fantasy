"use client";

import React, { useState, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import Toast from "./shared/Toast";
import { supabase } from "@/lib/supabase";
import ReCAPTCHA from "react-google-recaptcha";
import {
  CheckCircle,
  AlertCircle,
  Upload,
  Building2,
  Banknote,
  CreditCardIcon,
  Download,
  Mail,
  Copy,
  Lightbulb,
} from "lucide-react";
import Image from "next/image";
import { downloadPaymentInstructions } from "@/utils/downloadPDF";
import { useRegistrationConfig } from "@/hooks/useLeagueData";
import LoadingCard from "@/components/shared/LoadingCard";

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  team_name: string;
  league_type: "standard" | "premium" | "h2h" | "";
  h2h_league: boolean;
  payment_method: "bank" | "wise" | "cash" | "paypal" | "";
  cash_status?: "paid" | "pending" | "unpaid" | "confirmed" | "rejected";
  payment_proof?: File;
  notes: string;
}

interface RegistrationFormProps {
  leagueType: string;
}

const RegistrationForm = React.memo<RegistrationFormProps>(
  function RegistrationForm({ leagueType }) {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const {
      data: registrationConfig,
      loading: configLoading,
      error: configError,
    } = useRegistrationConfig(leagueType);

    const [formData, setFormData] = useState<FormData>({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      team_name: "",
      league_type: "",
      h2h_league: false,
      payment_method: "",
      cash_status: undefined,
      payment_proof: undefined,
      notes: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<
      "idle" | "success" | "error"
    >("idle");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [dragActive, setDragActive] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [emailCopied, setEmailCopied] = useState(false);
    const [toast, setToast] = useState<{
      show: boolean;
      message: string;
      type: "success" | "error";
    }>({
      show: false,
      message: "",
      type: "success",
    });
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    // Show loading state while config is loading
    if (configLoading) {
      return (
        <section className="relative w-full bg-theme-background overflow-hidden theme-transition min-h-screen flex items-center justify-center">
          <div className="w-full max-w-4xl mx-auto px-4">
            <LoadingCard
              title={t("registration.loadingForm")}
              description={t("registration.loadingDescription")}
              className="animate-fade-in-up"
            />
          </div>
        </section>
      );
    }

    // Show error state if config failed to load
    if (configError || !registrationConfig) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-500 mb-4">Greška pri učitavanju podataka</p>
            <p className="text-theme-text-secondary">{configError}</p>
          </div>
        </div>
      );
    }

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
        newErrors.email = "Molimo unesite valjan email";
      }

      if (!formData.phone.trim()) {
        newErrors.phone = "Broj telefona je obavezan";
      } else {
        // Simple phone validation - allows various formats but ensures it looks like a phone number
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,20}$/;
        const cleanPhone = formData.phone.replace(/\s/g, ""); // Remove spaces for length check

        if (!phoneRegex.test(formData.phone) || cleanPhone.length < 8) {
          newErrors.phone =
            "Molimo unesite valjan broj telefona (minimum 8 cifara)";
        }
      }

      if (!formData.team_name.trim()) {
        newErrors.team_name = "Ime tima je obavezno";
      }

      if (!formData.league_type) {
        newErrors.league_type = "Molimo odaberite tip lige";
      }

      if (!formData.payment_method) {
        newErrors.payment_method = "Molimo odaberite način plaćanja";
      }

      if (formData.payment_method === "cash" && !formData.cash_status) {
        newErrors.cash_status = "Molimo odaberite status keš plaćanja";
      }

      if (formData.payment_method !== "cash" && !formData.payment_proof) {
        newErrors.payment_proof = "Dokaz o uplati je obavezan";
      }

      if (!recaptchaToken) {
        newErrors.recaptcha = "Molimo potvrdite da niste robot";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleFileUpload = (file: File) => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ["image/", "application/pdf"];

      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          payment_proof: "Veličina fajla mora biti manja od 10MB",
        }));
        return;
      }

      if (!allowedTypes.some((type) => file.type.startsWith(type))) {
        setErrors((prev) => ({
          ...prev,
          payment_proof: "Dozvoljene su samo slike i PDF fajlovi",
        }));
        return;
      }

      setFormData((prev) => ({ ...prev, payment_proof: file }));
      if (errors.payment_proof) {
        setErrors((prev) => ({ ...prev, payment_proof: "" }));
      }
    };

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) return;

      setIsSubmitting(true);
      setSubmitStatus("idle");

      try {
        let paymentProofUrl = null;

        // Upload file to Supabase Storage if exists
        if (formData.payment_proof) {
          const fileExt = formData.payment_proof.name.split(".").pop();
          const fileName = `public/${Date.now()}_${Math.random()
            .toString(36)
            .substring(2)}.${fileExt}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("payment-proofs")
              .upload(fileName, formData.payment_proof);

          if (uploadError) throw uploadError;
          paymentProofUrl = uploadData?.path;
        }

        // Insert registration data
        const { data: insertedData, error } = await supabase
          .from("registration_25_26")
          .insert([
            {
              first_name: formData.first_name.trim(),
              last_name: formData.last_name.trim(),
              email: formData.email.trim(),
              phone: formData.phone.trim(),
              team_name: formData.team_name.trim(),
              league_type: formData.league_type,
              h2h_league: formData.h2h_league,
              payment_method: formData.payment_method,
              cash_status: formData.cash_status,
              payment_proof_url: paymentProofUrl,
              notes: formData.notes.trim(),
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) throw error;

        // Send registration confirmation email (without codes) to user and admin notification
        try {
          const emailResponse = await fetch("/api/send-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              emailType: "registration",
              registrationId: insertedData?.id,
              recaptchaToken: recaptchaToken,
              userData: {
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                team_name: formData.team_name.trim(),
                league_type: formData.league_type,
                h2h_league: formData.h2h_league,
                payment_method: formData.payment_method,
                cash_status: formData.cash_status,
              },
            }),
          });

          if (!emailResponse.ok) {
            console.warn(
              "Email sending failed, but registration was successful"
            );
          }
        } catch (emailError) {
          console.warn(
            "Email sending failed, but registration was successful:",
            emailError
          );
        }

        setSubmitStatus("success");

        // Show success toast
        setToast({
          show: true,
          message: "Registracija uspešna! Proverite email za potvrdu.",
          type: "success",
        });

        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          team_name: "",
          league_type: "",
          h2h_league: false,
          payment_method: "",
          cash_status: undefined,
          payment_proof: undefined,
          notes: "",
        });

        setRecaptchaToken(null);
        recaptchaRef.current?.reset();
      } catch (error: any) {
        console.error("Registration error:", error);
        setSubmitStatus("error");

        let errorMessage = "Greška pri registraciji. Pokušajte ponovo.";

        if (
          error?.message?.includes("email_unique_constraint") ||
          error?.message?.includes("already exists")
        ) {
          errorMessage =
            "Email adresa je već registrovana. Molimo koristite drugu email adresu.";
        }

        // Show error toast
        setToast({
          show: true,
          message: errorMessage,
          type: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleInputChange = (
      field: keyof FormData,
      value: string | boolean | undefined
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    };

    const copyEmailToClipboard = async () => {
      try {
        await navigator.clipboard.writeText("muhamed.musa1994@gmail.com");
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy email: ", err);
      }
    };

    const leagueOptions = registrationConfig?.leagueOptions || [];
    const h2hOption = registrationConfig?.h2hOption;

    return (
      <>
        {/* Toast Notification */}
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />

        <section className="relative w-full bg-theme-background overflow-hidden theme-transition">
          {/* Optimized Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-900/10 via-gray-800/5 to-red-800/10 minimal-radius blur-3xl animate-pulse-gentle gpu-accelerated"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-l from-gray-900/10 via-red-900/5 to-gray-800/10 minimal-radius blur-3xl animate-float-slow gpu-accelerated"></div>
          </div>

          <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 text-balance leading-tight font-russo animate-scale-in animate-delay-200">
                <span className="text-theme-heading-primary drop-shadow-2xl theme-transition">
                  {t("registration.title")}
                </span>
              </h2>

              <p className="text-theme-text-secondary text-sm md:text-base lg:text-lg w-full max-w-3xl mx-auto leading-relaxed font-medium theme-transition animate-fade-in animate-delay-500">
                {t("registration.subtitle")}
              </p>
            </div>

            <div className="w-full max-w-4xl mx-auto">
              <div className="relative">
                <form
                  onSubmit={handleSubmit}
                  className="relative z-10 p-8 md:p-12 animate-fade-in-up animate-delay-200 border-2 border-gray-600/30 rounded-2xl bg-theme-background/80 backdrop-blur-sm theme-transition"
                >
                  {/* Personal Info Section */}
                  <div className="mb-12">
                    <h3 className="text-lg md:text-xl lg:text-2xl font-black mb-4 md:mb-6 animate-slide-in-left animate-delay-100">
                      <span className="text-theme-heading-primary theme-transition">
                        {t("registration.personalData")}
                      </span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* First Name */}
                      <div className="relative">
                        <div className="relative">
                          <input
                            type="text"
                            id="first_name"
                            value={formData.first_name}
                            onChange={(e) =>
                              handleInputChange("first_name", e.target.value)
                            }
                            onFocus={() => setFocusedField("first_name")}
                            onBlur={() => setFocusedField(null)}
                            className={`input-theme relative w-full px-4 py-4 border-2 minimal-radius peer transition-all duration-500 ease-in-out focus-ring ${
                              errors.first_name
                                ? "border-red-400"
                                : focusedField === "first_name"
                                ? "border-transparent"
                                : ""
                            }`}
                          />
                          <label
                            htmlFor="first_name"
                            className={`floating-label transition-all duration-500 ease-in-out theme-transition ${
                              formData.first_name ||
                              focusedField === "first_name"
                                ? "transform -translate-y-2 scale-90"
                                : "floating-label-placeholder transform translate-y-0 scale-100"
                            }`}
                          >
                            {t("registration.firstName")} *
                          </label>
                        </div>
                        {errors.first_name && (
                          <p className="text-red-400 text-xs md:text-sm mt-2 flex items-center gap-1 font-medium theme-transition animate-fade-in">
                            <AlertCircle className="w-4 h-4" />
                            {errors.first_name}
                          </p>
                        )}
                      </div>

                      {/* Last Name */}
                      <div className="relative">
                        <div className="relative">
                          <input
                            type="text"
                            id="last_name"
                            value={formData.last_name}
                            onChange={(e) =>
                              handleInputChange("last_name", e.target.value)
                            }
                            onFocus={() => setFocusedField("last_name")}
                            onBlur={() => setFocusedField(null)}
                            className={`input-theme relative w-full px-4 py-4 border-2 minimal-radius peer transition-all duration-500 ease-in-out focus-ring ${
                              errors.last_name
                                ? "border-red-400"
                                : focusedField === "last_name"
                                ? "border-transparent"
                                : ""
                            }`}
                          />
                          <label
                            htmlFor="last_name"
                            className={`floating-label transition-all duration-500 ease-in-out theme-transition ${
                              formData.last_name || focusedField === "last_name"
                                ? "transform -translate-y-2 scale-90"
                                : "floating-label-placeholder transform translate-y-0 scale-100"
                            }`}
                          >
                            {t("registration.lastName")} *
                          </label>
                        </div>
                        {errors.last_name && (
                          <p className="text-red-400 text-xs md:text-sm mt-2 flex items-center gap-1 font-medium theme-transition animate-fade-in">
                            <AlertCircle className="w-4 h-4" />
                            {errors.last_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info Section */}
                  <div className="mb-12">
                    <h3 className="text-lg md:text-xl lg:text-2xl font-black mb-4 md:mb-6 animate-slide-in-left animate-delay-100">
                      <span className="text-theme-heading-primary theme-transition">
                        {t("registration.contactData")}
                      </span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Email */}
                      <div className="relative">
                        <div className="relative">
                          <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            onFocus={() => setFocusedField("email")}
                            onBlur={() => setFocusedField(null)}
                            className={`input-theme relative w-full px-4 py-4 border-2 minimal-radius peer transition-all duration-500 ease-in-out focus-ring ${
                              errors.email
                                ? "border-red-400"
                                : focusedField === "email"
                                ? "border-transparent"
                                : ""
                            }`}
                          />
                          <label
                            htmlFor="email"
                            className={`floating-label transition-all duration-500 ease-in-out theme-transition ${
                              formData.email || focusedField === "email"
                                ? "transform -translate-y-2 scale-90"
                                : "floating-label-placeholder transform translate-y-0 scale-100"
                            }`}
                          >
                            {t("registration.emailAddress")} *
                          </label>
                        </div>
                        {errors.email && (
                          <p className="text-red-400 text-xs md:text-sm mt-2 flex items-center gap-1 font-medium theme-transition animate-fade-in">
                            <AlertCircle className="w-4 h-4" />
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Phone */}
                      <div className="relative">
                        <div className="relative">
                          <input
                            type="tel"
                            id="phone"
                            value={formData.phone}
                            onChange={(e) =>
                              handleInputChange("phone", e.target.value)
                            }
                            onFocus={() => setFocusedField("phone")}
                            onBlur={() => setFocusedField(null)}
                            className={`input-theme relative w-full px-4 py-4 border-2 minimal-radius peer transition-all duration-500 ease-in-out focus-ring ${
                              errors.phone
                                ? "border-red-400"
                                : focusedField === "phone"
                                ? "border-transparent"
                                : ""
                            }`}
                          />
                          <label
                            htmlFor="phone"
                            className={`floating-label transition-all duration-500 ease-in-out theme-transition ${
                              formData.phone || focusedField === "phone"
                                ? "transform -translate-y-2 scale-90"
                                : "floating-label-placeholder transform translate-y-0 scale-100"
                            }`}
                          >
                            {t("registration.phoneNumber")} *
                          </label>
                        </div>
                        {errors.phone && (
                          <p className="text-red-400 text-xs md:text-sm mt-2 flex items-center gap-1 font-medium theme-transition animate-fade-in">
                            <AlertCircle className="w-4 h-4" />
                            {errors.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Team Info */}
                  <div className="mb-12">
                    <h3 className="text-lg md:text-xl lg:text-2xl font-black mb-4 md:mb-6 animate-slide-in-left animate-delay-100">
                      <span className="text-theme-heading-primary theme-transition">
                        {t("registration.teamInfo")}
                      </span>
                    </h3>

                    <div className="relative">
                      <div className="relative">
                        <input
                          type="text"
                          id="team_name"
                          value={formData.team_name}
                          onChange={(e) =>
                            handleInputChange("team_name", e.target.value)
                          }
                          onFocus={() => setFocusedField("team_name")}
                          onBlur={() => setFocusedField(null)}
                          className={`input-theme relative w-full px-4 py-4 border-2 minimal-radius peer transition-all duration-500 ease-in-out focus-ring ${
                            errors.team_name
                              ? "border-red-400"
                              : focusedField === "team_name"
                              ? "border-transparent"
                              : ""
                          }`}
                        />
                        <label
                          htmlFor="team_name"
                          className={`floating-label transition-all duration-500 ease-in-out theme-transition ${
                            formData.team_name || focusedField === "team_name"
                              ? "transform -translate-y-2 scale-90"
                              : "floating-label-placeholder transform translate-y-0 scale-100"
                          }`}
                                                  >
                            {t("registration.teamName")} *
                          </label>
                      </div>
                      {errors.team_name && (
                        <p className="text-red-400 text-sm mt-2 flex items-center gap-1 font-medium theme-transition animate-fade-in">
                          <AlertCircle className="w-4 h-4" />
                          {errors.team_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Notes section for additional info */}
                  <div className="mb-8 animate-fade-in animate-delay-200">
                    <label
                      htmlFor="notes"
                      className="block text-sm md:text-base font-bold mb-3 theme-transition font-russo"
                    >
                      <span className="text-theme-heading-primary theme-transition">
                        {t("registration.notes")}
                      </span>
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="w-full px-4 py-3 md:px-6 md:py-4 minimal-radius bg-theme-background backdrop-blur-sm border-2 border-theme-border focus:border-blue-400 focus:outline-none text-sm md:text-base theme-transition placeholder:text-gray-400 font-medium font-inter resize-vertical focus-ring"
                      placeholder={t("registration.notesPlaceholder")}
                      rows={4}
                      maxLength={1000}
                    />
                    <div className="text-right mt-1">
                      <span className="text-xs text-gray-400">
                        {formData.notes.length}/1000
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={true} // Disabled for now
                    className="w-full bg-gradient-to-r from-blue-600 via-slate-700 to-gray-800 hover:from-blue-700 hover:via-slate-800 hover:to-gray-900 text-white font-black py-4 md:py-6 px-8 md:px-12 minimal-radius text-lg md:text-xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden shadow-2xl border-2 border-blue-500/50 font-russo hover-scale hover-glow focus-ring gpu-accelerated"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-3 animate-fade-in">
                        <div className="w-6 h-6 border-3 border-white border-t-transparent minimal-radius animate-rotate-slow"></div>
                        <span>{t("registration.loading")}</span>
                      </div>
                    ) : (
                      <span className="flex items-center justify-center gap-3 animate-fade-in">
                        <span>{t("registration.registrationClosed")}</span>
                      </span>
                    )}

                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-gray-800/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-gray-800 minimal-radius opacity-30 blur animate-rotate-slow" />
                  </button>

                  {/* Success/Error Messages */}
                  {submitStatus === "success" && (
                    <div className="mt-8 bg-gradient-to-r from-green-500/30 via-emerald-500/30 to-teal-500/30 border border-green-500/60 minimal-radius p-4 md:p-6 backdrop-blur-xl shadow-lg animate-scale-in">
                      <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                        <div className="w-16 h-16 md:w-12 md:h-12 bg-gradient-to-r from-green-400 to-emerald-500 minimal-radius flex items-center justify-center shadow-2xl animate-scale-in animate-delay-200">
                          <CheckCircle className="w-8 h-8 md:w-6 md:h-6 text-white" />
                        </div>
                        <div className="space-y-2">
                          <h4
                            className={`${
                              theme === "light"
                                ? "text-gray-900"
                                : "text-green-300"
                            } font-black text-xl md:text-lg mb-1 animate-fade-in animate-delay-400`}
                          >
                            {t("registration.successTitle")}
                          </h4>
                          <p
                            className={`${
                              theme === "light"
                                ? "text-gray-800"
                                : "text-green-200"
                            } text-sm md:text-sm leading-relaxed font-bold animate-fade-in animate-delay-500`}
                          >
                            Dobrodošli u REMIS Fantasy 2025/26!
                            <br />
                            Poslali smo vam email sa potvrdom prijave.
                            <br />
                            Kodovi za pristup ligi će vam biti poslati nakon
                            revizije uplate.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {submitStatus === "error" && (
                    <div className="mt-8 bg-gradient-to-r from-red-500/20 via-rose-500/20 to-pink-500/20 border border-red-400/50 minimal-radius p-6 backdrop-blur-xl animate-scale-in">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500 minimal-radius flex items-center justify-center">
                          <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-red-300 font-black text-lg mb-1">
                            {t("registration.errorTitle")}
                          </h4>
                          <p className="text-red-200 text-sm">
                            {t("registration.errorMessage")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }
);

export default RegistrationForm;
