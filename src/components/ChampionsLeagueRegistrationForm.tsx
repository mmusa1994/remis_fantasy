"use client";

import React, { useState, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import Toast from "./shared/Toast";
import { supabase } from "@/lib/supabase";
import ReCAPTCHA from "react-google-recaptcha";
import { CheckCircle, AlertCircle, Trophy, Star, Crown } from "lucide-react";

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  payment_method: "bank" | "wise" | "cash" | "paypal" | "";
  payment_proof?: File;
  notes: string;
}

const ChampionsLeagueRegistrationForm = React.memo(
  function ChampionsLeagueRegistrationForm() {
    const { theme } = useTheme();
    const { t } = useTranslation();

    const [formData, setFormData] = useState<FormData>({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      payment_method: "",
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

    const validateForm = () => {
      const newErrors: Record<string, string> = {};

      if (!formData.first_name.trim()) {
        newErrors.first_name = t("champions:validation.firstNameRequired");
      }

      if (!formData.last_name.trim()) {
        newErrors.last_name = t("champions:validation.lastNameRequired");
      }

      if (!formData.email.trim()) {
        newErrors.email = t("champions:validation.emailRequired");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = t("champions:validation.emailInvalid");
      }

      if (!formData.phone.trim()) {
        newErrors.phone = t("champions:validation.phoneRequired");
      } else {
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,20}$/;
        const cleanPhone = formData.phone.replace(/\s/g, "");

        if (!phoneRegex.test(formData.phone) || cleanPhone.length < 8) {
          newErrors.phone = t("champions:validation.phoneInvalid");
        }
      }

      if (!formData.payment_method) {
        newErrors.payment_method = t(
          "champions:validation.paymentMethodRequired"
        );
      }

      if (formData.payment_method !== "cash" && !formData.payment_proof) {
        newErrors.payment_proof = t(
          "champions:validation.paymentProofRequired"
        );
      }

      if (!recaptchaToken) {
        newErrors.recaptcha = t("champions:validation.recaptchaRequired");
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
          payment_proof: t("champions:validation.fileSizeError"),
        }));
        return;
      }

      if (!allowedTypes.some((type) => file.type.startsWith(type))) {
        setErrors((prev) => ({
          ...prev,
          payment_proof: t("champions:validation.fileTypeError"),
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
          const fileName = `champions-league/${Date.now()}_${Math.random()
            .toString(36)
            .substring(2)}.${fileExt}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("payment-proofs")
              .upload(fileName, formData.payment_proof);

          if (uploadError) throw uploadError;
          paymentProofUrl = uploadData?.path;
        }

        // Insert registration data into cl_registrations_25_26 table
        const { data: insertedData, error } = await supabase
          .from("cl_registrations_25_26")
          .insert([
            {
              first_name: formData.first_name.trim(),
              last_name: formData.last_name.trim(),
              email: formData.email.trim(),
              phone: formData.phone.trim(),
              payment_method: formData.payment_method,
              payment_proof_url: paymentProofUrl,
              notes: formData.notes.trim(),
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) throw error;

        // Send registration confirmation email
        try {
          const emailResponse = await fetch("/api/send-champions-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              emailType: "champions_registration",
              registrationId: insertedData?.id,
              recaptchaToken: recaptchaToken,
              userData: {
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                payment_method: formData.payment_method,
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

        setToast({
          show: true,
          message: t("champions:success.message"),
          type: "success",
        });

        // Reset form
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          payment_method: "",
          payment_proof: undefined,
          notes: "",
        });

        setRecaptchaToken(null);
        recaptchaRef.current?.reset();
      } catch (error: any) {
        console.error("Champions League registration error:", error);
        setSubmitStatus("error");

        let errorMessage = t("champions:error.general");

        if (
          error?.message?.includes("email_unique_constraint") ||
          error?.message?.includes("already exists")
        ) {
          errorMessage = t("champions:error.emailExists");
        }

        setToast({
          show: true,
          message: errorMessage,
          type: "error",
        });
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

    return (
      <>
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />

        <section className="relative w-full bg-theme-background theme-transition">
          {/* Champions League themed background effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-900/20 via-purple-800/10 to-blue-800/20 minimal-radius blur-3xl animate-pulse-gentle gpu-accelerated"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-l from-purple-900/20 via-blue-900/10 to-purple-800/20 minimal-radius blur-3xl animate-float-slow gpu-accelerated"></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-6xl">
            {/* Champions League Header */}
            <div className="text-center mb-8 xs:mb-10 sm:mb-12 animate-fade-in-up">
              <div className="flex items-center justify-center gap-4 mb-6">
                <Crown className="w-8 h-8 md:w-12 md:h-12 text-blue-500" />
                <Trophy className="w-10 h-10 md:w-16 md:h-16 text-purple-500" />
                <Star className="w-8 h-8 md:w-12 md:h-12 text-blue-500" />
              </div>

              <h2 className="text-2xl xs:text-3xl md:text-5xl lg:text-6xl font-black mb-3 xs:mb-4 text-balance leading-tight font-russo animate-scale-in animate-delay-200">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent drop-shadow-2xl">
                  CHAMPIONS LEAGUE
                </span>
              </h2>

              <h3 className="text-xl xs:text-2xl md:text-3xl lg:text-4xl font-black mb-4 text-theme-heading-primary">
                {t("champions:registration.registerTitle")}
              </h3>

              <p className="text-theme-text-secondary text-xs xs:text-sm md:text-base lg:text-lg w-full max-w-3xl mx-auto leading-relaxed font-medium theme-transition animate-fade-in animate-delay-500 px-2">
                {t("champions:registration.description")}{" "}
                <span className="font-bold text-blue-500">260 KM</span>.
              </p>
            </div>

            {/* Prize Summary */}
            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl p-6 mb-8 border border-blue-500/30">
              <h3 className="text-lg font-bold text-center mb-4 text-theme-heading-primary">
                {t("champions:registration.prizesSummary")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 rounded-xl p-4 border border-yellow-500/30">
                  <div className="text-2xl mb-2">🥇</div>
                  <div className="font-bold text-theme-heading-primary">
                    {t("champions:prizes.firstPlace.title")}
                  </div>
                  <div className="text-xl font-black text-yellow-600">
                    {t("champions:prizes.firstPlace.amount")}
                  </div>
                </div>
                <div className="bg-gradient-to-r from-gray-400/20 to-gray-600/20 rounded-xl p-4 border border-gray-500/30">
                  <div className="text-2xl mb-2">🥈</div>
                  <div className="font-bold text-theme-heading-primary">
                    {t("champions:prizes.secondPlace.title")}
                  </div>
                  <div className="text-xl font-black text-gray-600">
                    {t("champions:prizes.secondPlace.amount")}
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-400/20 to-orange-600/20 rounded-xl p-4 border border-orange-500/30">
                  <div className="text-2xl mb-2">🥉</div>
                  <div className="font-bold text-theme-heading-primary">
                    {t("champions:prizes.thirdPlace.title")}
                  </div>
                  <div className="text-xl font-black text-orange-600">
                    {t("champions:prizes.thirdPlace.amount")}
                  </div>
                </div>
              </div>
              <div className="text-center mt-4">
                <div className="text-lg font-bold text-theme-heading-primary">
                  {t("champions:registration.entryFeeLabel")}{" "}
                  <span className="text-blue-600">15 KM/ 8 EUR</span>
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <div className="w-full">
              <div className="relative">
                <form
                  onSubmit={handleSubmit}
                  className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-12 animate-fade-in-up animate-delay-200 border-2 border-blue-600/30 rounded-2xl bg-theme-background/80 backdrop-blur-sm theme-transition"
                >
                  {/* Personal Info Section */}
                  <div className="mb-8 xs:mb-10 sm:mb-12">
                    <h3 className="text-base xs:text-lg md:text-xl lg:text-2xl font-black mb-3 xs:mb-4 md:mb-6 animate-slide-in-left animate-delay-100">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {t("champions:form.personalInfo")}
                      </span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-6">
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
                            className={`input-theme relative w-full px-3 xs:px-4 py-3 xs:py-4 border-2 minimal-radius peer transition-all duration-500 ease-in-out focus-ring text-sm xs:text-base ${
                              errors.first_name
                                ? "border-red-400"
                                : focusedField === "first_name"
                                ? "border-blue-400"
                                : ""
                            }`}
                          />
                          <label
                            htmlFor="first_name"
                            className={`floating-label transition-all duration-500 ease-in-out theme-transition text-xs xs:text-sm ${
                              formData.first_name ||
                              focusedField === "first_name"
                                ? "transform -translate-y-2 scale-90"
                                : "floating-label-placeholder transform translate-y-0 scale-100"
                            }`}
                          >
                            {t("champions:form.firstName")}{" "}
                            {t("champions:form.required")}
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
                            className={`input-theme relative w-full px-3 xs:px-4 py-3 xs:py-4 border-2 minimal-radius peer transition-all duration-500 ease-in-out focus-ring text-sm xs:text-base ${
                              errors.last_name
                                ? "border-red-400"
                                : focusedField === "last_name"
                                ? "border-blue-400"
                                : ""
                            }`}
                          />
                          <label
                            htmlFor="last_name"
                            className={`floating-label transition-all duration-500 ease-in-out theme-transition text-xs xs:text-sm ${
                              formData.last_name || focusedField === "last_name"
                                ? "transform -translate-y-2 scale-90"
                                : "floating-label-placeholder transform translate-y-0 scale-100"
                            }`}
                          >
                            {t("champions:form.lastName")}{" "}
                            {t("champions:form.required")}
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
                  <div className="mb-8 xs:mb-10 sm:mb-12">
                    <h3 className="text-base xs:text-lg md:text-xl lg:text-2xl font-black mb-3 xs:mb-4 md:mb-6 animate-slide-in-left animate-delay-100">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {t("champions:form.contactInfo")}
                      </span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-6">
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
                            className={`input-theme relative w-full px-3 xs:px-4 py-3 xs:py-4 border-2 minimal-radius peer transition-all duration-500 ease-in-out focus-ring text-sm xs:text-base ${
                              errors.email
                                ? "border-red-400"
                                : focusedField === "email"
                                ? "border-blue-400"
                                : ""
                            }`}
                          />
                          <label
                            htmlFor="email"
                            className={`floating-label transition-all duration-500 ease-in-out theme-transition text-xs xs:text-sm ${
                              formData.email || focusedField === "email"
                                ? "transform -translate-y-2 scale-90"
                                : "floating-label-placeholder transform translate-y-0 scale-100"
                            }`}
                          >
                            {t("champions:form.email")}{" "}
                            {t("champions:form.required")}
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
                            className={`input-theme relative w-full px-3 xs:px-4 py-3 xs:py-4 border-2 minimal-radius peer transition-all duration-500 ease-in-out focus-ring text-sm xs:text-base ${
                              errors.phone
                                ? "border-red-400"
                                : focusedField === "phone"
                                ? "border-blue-400"
                                : ""
                            }`}
                          />
                          <label
                            htmlFor="phone"
                            className={`floating-label transition-all duration-500 ease-in-out theme-transition text-xs xs:text-sm ${
                              formData.phone || focusedField === "phone"
                                ? "transform -translate-y-2 scale-90"
                                : "floating-label-placeholder transform translate-y-0 scale-100"
                            }`}
                          >
                            {t("champions:form.phone")}{" "}
                            {t("champions:form.required")}
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

                  {/* Payment Method Section */}
                  <div className="mb-8 xs:mb-10 sm:mb-12">
                    <h3 className="text-base xs:text-lg md:text-xl lg:text-2xl font-black mb-3 xs:mb-4 md:mb-6 animate-slide-in-left animate-delay-100">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {t("champions:form.paymentMethod")}
                      </span>
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {[
                        {
                          value: "paypal",
                          label: t("champions:payment.paypal"),
                          color: "blue",
                        },
                        {
                          value: "wise",
                          label: `${t("champions:payment.wise")}`,
                          color: "green",
                        },
                        {
                          value: "bank",
                          label: t("champions:payment.bank"),
                          color: "purple",
                        },
                        {
                          value: "cash",
                          label: t("champions:payment.cash"),
                          color: "yellow",
                        },
                      ].map((method) => (
                        <label
                          key={method.value}
                          className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${
                            formData.payment_method === method.value
                              ? method.color === "green"
                                ? "border-green-500 bg-green-500/10"
                                : method.color === "purple"
                                ? "border-purple-500 bg-purple-500/10"
                                : method.color === "yellow"
                                ? "border-yellow-500 bg-yellow-500/10"
                                : "border-blue-500 bg-blue-500/10"
                              : "border-theme-border hover:border-blue-400"
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment_method"
                            value={method.value}
                            checked={formData.payment_method === method.value}
                            onChange={(e) =>
                              handleInputChange(
                                "payment_method",
                                e.target.value
                              )
                            }
                            className="sr-only"
                          />
                          <div className="text-center">
                            <div className="text-lg font-bold text-theme-heading-primary">
                              {method.label}
                            </div>
                            {formData.payment_method === method.value && (
                              <CheckCircle
                                className={`w-5 h-5 mx-auto mt-2 ${
                                  method.color === "green"
                                    ? "text-green-500"
                                    : method.color === "purple"
                                    ? "text-purple-500"
                                    : method.color === "yellow"
                                    ? "text-yellow-500"
                                    : "text-blue-500"
                                }`}
                              />
                            )}
                          </div>
                        </label>
                      ))}
                    </div>

                    {errors.payment_method && (
                      <p className="text-red-400 text-sm mt-2 flex items-center gap-1 font-medium animate-fade-in">
                        <AlertCircle className="w-4 h-4" />
                        {errors.payment_method}
                      </p>
                    )}
                  </div>

                  {/* Payment Instructions */}
                  {formData.payment_method && (
                    <div className="mb-8 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl p-6 border border-blue-500/20 animate-fade-in">
                      <h4 className="font-bold text-theme-heading-primary mb-4">
                        {t("champions:payment.instructions")} -{" "}
                        {formData.payment_method === "paypal"
                          ? t("champions:payment.paypal")
                          : formData.payment_method === "wise"
                          ? t("champions:payment.wise")
                          : formData.payment_method === "bank"
                          ? t("champions:payment.bank")
                          : t("champions:payment.cash")}
                      </h4>

                      {formData.payment_method === "paypal" && (
                        <div className="space-y-3 text-theme-text-secondary">
                          <div className="bg-blue-50/10 p-4 rounded-lg border border-blue-500/20">
                            <p className="font-bold text-blue-400 mb-2">
                              {t("champions:payment.paypalNote")}
                            </p>
                            <p>
                              • {t("champions:payment.amount")}{" "}
                              <span className="font-bold">15 KM/ 8 EUR</span>
                            </p>
                            <p>
                              • {t("champions:payment.note")} Champions League
                              Fantasy {formData.first_name} {formData.last_name}
                            </p>
                          </div>
                        </div>
                      )}

                      {formData.payment_method === "wise" && (
                        <div className="space-y-3 text-theme-text-secondary">
                          <div className="bg-green-50/10 p-4 rounded-lg border border-green-500/20">
                            <p>
                              • Email:{" "}
                              <span className="font-mono font-bold text-green-400">
                                muhamed.musa1994@gmail.com
                              </span>
                            </p>
                            <p>
                              • {t("champions:payment.amount")}{" "}
                              <span className="font-bold">15 KM/ 8 EUR</span>
                            </p>
                            <p>
                              • {t("champions:payment.note")} Champions League
                              Fantasy {formData.first_name} {formData.last_name}
                            </p>
                          </div>
                        </div>
                      )}

                      {formData.payment_method === "bank" && (
                        <div className="space-y-3 text-theme-text-secondary">
                          <div className="bg-purple-50/10 p-4 rounded-lg border border-purple-500/20">
                            <p className="font-bold text-purple-400 mb-3">
                              {t("champions:payment.bankNote")}
                            </p>

                            <div className="mb-4">
                              <p className="font-bold text-purple-300">
                                {t("champions:payment.personalDetails")}
                              </p>
                              <p className="text-sm">
                                {t("champions:payment.personalInfo")}
                              </p>
                            </div>

                            <div className="mb-4">
                              <p className="font-bold text-purple-300">
                                {t("champions:payment.bankAccounts")}
                              </p>
                              <p className="text-sm">
                                {t("champions:payment.unicreditAccount")}
                              </p>
                              <p className="text-sm">
                                {t("champions:payment.raiffeisenAccount")}
                              </p>
                              <p className="text-sm">
                                {t("champions:payment.asaAccount")}
                              </p>
                            </div>

                            <div className="mb-4">
                              <p className="font-bold text-purple-300">
                                {t("champions:payment.unicreditIban")}
                              </p>
                              <p className="text-sm">
                                {t("champions:payment.swift")}
                              </p>
                              <p className="text-sm">
                                {t("champions:payment.swiftCode")}
                              </p>
                            </div>

                            <p>
                              • {t("champions:payment.amount")}{" "}
                              <span className="font-bold">15 KM/ 8 EUR</span>
                            </p>
                          </div>
                        </div>
                      )}

                      {formData.payment_method === "cash" && (
                        <div className="space-y-3 text-theme-text-secondary">
                          <div className="bg-yellow-50/10 p-4 rounded-lg border border-yellow-500/20">
                            <p>
                              • {t("champions:payment.amount")}{" "}
                              <span className="font-bold">15 KM/8 EUR</span>
                            </p>
                            <p>
                              • {t("champions:payment.location")}{" "}
                              {t("champions:payment.arrangement")}
                            </p>
                            <p className="text-yellow-400 font-medium mt-3">
                              ⚠️ {t("champions:payment.contact")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment Proof Upload */}
                  {formData.payment_method &&
                    formData.payment_method !== "cash" && (
                      <div className="mb-8 xs:mb-10 sm:mb-12 animate-fade-in">
                        <h3 className="text-base xs:text-lg md:text-xl lg:text-2xl font-black mb-3 xs:mb-4 md:mb-6">
                          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {t("champions:form.paymentProof")}{" "}
                            {t("champions:form.required")}
                          </span>
                        </h3>

                        <div
                          className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
                            dragActive
                              ? "border-blue-400 bg-blue-50/10"
                              : errors.payment_proof
                              ? "border-red-400"
                              : "border-theme-border hover:border-blue-400"
                          }`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                        >
                          {formData.payment_proof ? (
                            <div className="text-center">
                              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                              <p className="text-theme-heading-primary font-bold">
                                {formData.payment_proof.name}
                              </p>
                              <p className="text-theme-text-secondary text-sm mt-2">
                                {(
                                  formData.payment_proof.size /
                                  (1024 * 1024)
                                ).toFixed(2)}{" "}
                                MB
                              </p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                                <svg
                                  className="w-8 h-8 text-blue-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                  />
                                </svg>
                              </div>
                              <p className="text-theme-heading-primary font-bold mb-2">
                                {t("champions:form.uploadProof")}
                              </p>
                              <p className="text-theme-text-secondary text-sm mb-4">
                                {t("champions:form.uploadInstructions")}
                              </p>
                              <input
                                type="file"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(file);
                                }}
                                accept="image/*,.pdf"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                          )}
                        </div>

                        {errors.payment_proof && (
                          <p className="text-red-400 text-sm mt-2 flex items-center gap-1 font-medium animate-fade-in">
                            <AlertCircle className="w-4 h-4" />
                            {errors.payment_proof}
                          </p>
                        )}
                      </div>
                    )}

                  {/* Notes Section */}
                  <div className="mb-8 animate-fade-in animate-delay-200">
                    <label
                      htmlFor="notes"
                      className="block text-sm md:text-base font-bold mb-3 theme-transition font-russo"
                    >
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {t("champions:form.notes")}
                      </span>
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        handleInputChange("notes", e.target.value)
                      }
                      className="w-full px-3 xs:px-4 py-3 md:px-6 md:py-4 minimal-radius bg-theme-background backdrop-blur-sm border-2 border-theme-border focus:border-blue-400 focus:outline-none text-xs xs:text-sm md:text-base theme-transition placeholder:text-gray-400 font-medium font-inter resize-vertical focus-ring"
                      placeholder={t("champions:form.notesPlaceholder")}
                      rows={4}
                      maxLength={1000}
                    />
                    <div className="text-right mt-1">
                      <span className="text-xs text-gray-400">
                        {formData.notes.length}/1000
                      </span>
                    </div>
                  </div>

                  {/* reCAPTCHA */}
                  <div className="mb-8 flex justify-center">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                      onChange={(token) => setRecaptchaToken(token)}
                      theme={theme === "dark" ? "dark" : "light"}
                    />
                    {errors.recaptcha && (
                      <p className="text-red-400 text-sm mt-2 flex items-center gap-1 font-medium animate-fade-in">
                        <AlertCircle className="w-4 h-4" />
                        {errors.recaptcha}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 via-purple-700 to-blue-800 hover:from-blue-700 hover:via-purple-800 hover:to-blue-900 text-white font-black py-3 xs:py-4 md:py-6 px-6 xs:px-8 md:px-12 minimal-radius text-base xs:text-lg md:text-xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden shadow-2xl border-2 border-blue-500/50 font-russo hover-scale hover-glow focus-ring gpu-accelerated"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-3 animate-fade-in">
                        <div className="w-6 h-6 border-3 border-white border-t-transparent minimal-radius animate-rotate-slow"></div>
                        <span>{t("champions:form.submitting")}</span>
                      </div>
                    ) : (
                      <span className="flex items-center justify-center gap-3 animate-fade-in">
                        <Trophy className="w-5 h-5" />
                        <span>{t("champions:form.submitButton")}</span>
                        <Trophy className="w-5 h-5" />
                      </span>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-800/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-800 minimal-radius opacity-30 blur animate-rotate-slow" />
                  </button>

                  {/* Success Message */}
                  {submitStatus === "success" && (
                    <div className="mt-6 xs:mt-8 bg-gradient-to-r from-green-500/30 via-emerald-500/30 to-teal-500/30 border border-green-500/60 minimal-radius p-3 xs:p-4 md:p-6 backdrop-blur-xl shadow-lg animate-scale-in">
                      <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                        <div className="w-12 h-12 xs:w-14 xs:h-14 md:w-12 md:h-12 bg-gradient-to-r from-green-400 to-emerald-500 minimal-radius flex items-center justify-center shadow-2xl animate-scale-in animate-delay-200">
                          <CheckCircle className="w-6 h-6 xs:w-7 xs:h-7 md:w-6 md:h-6 text-white" />
                        </div>
                        <div className="space-y-2">
                          <h4
                            className={`${
                              theme === "light"
                                ? "text-gray-900"
                                : "text-green-300"
                            } font-black text-base xs:text-lg md:text-lg mb-1 animate-fade-in animate-delay-400`}
                          >
                            {t("champions:success.title")}
                          </h4>
                          <p
                            className={`${
                              theme === "light"
                                ? "text-gray-800"
                                : "text-green-200"
                            } text-xs xs:text-sm md:text-sm leading-relaxed font-bold animate-fade-in animate-delay-500`}
                          >
                            {t("champions:success.welcome")}
                            <br />
                            {t("champions:success.emailSent")}
                            <br />
                            {t("champions:success.codesInfo")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {submitStatus === "error" && (
                    <div className="mt-6 xs:mt-8 bg-gradient-to-r from-red-500/20 via-rose-500/20 to-pink-500/20 border border-red-400/50 minimal-radius p-4 xs:p-6 backdrop-blur-xl animate-scale-in">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 xs:w-12 xs:h-12 bg-red-500 minimal-radius flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 xs:w-6 xs:h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-red-300 font-black text-base xs:text-lg mb-1">
                            {t("champions:error.title")}
                          </h4>
                          <p className="text-red-200 text-xs xs:text-sm">
                            {t("champions:error.message")}
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

export default ChampionsLeagueRegistrationForm;
