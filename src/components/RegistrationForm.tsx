"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import Toast from "./Toast";
import { supabase } from "@/lib/supabase";
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
} from "lucide-react";
import Image from "next/image";
import { downloadPaymentInstructions } from "@/utils/downloadPDF";

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  team_name: string;
  league_type: "standard" | "premium" | "";
  h2h_league: boolean;
  payment_method: "bank" | "wise" | "cash" | "";
  cash_status?: "paid" | "pending" | "unpaid" | "confirmed" | "rejected";
  payment_proof?: File;
}

export default function RegistrationForm() {
  const { theme } = useTheme();
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

        const { data: uploadData, error: uploadError } = await supabase.storage
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
          console.warn("Email sending failed, but registration was successful");
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
      });
    } catch (error) {
      console.error("Registration error:", error);
      setSubmitStatus("error");

      // Show error toast
      setToast({
        show: true,
        message: "Greška pri registraciji. Pokušajte ponovo.",
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

  const leagueOptions = [
    {
      id: "standard",
      name: "Standard Liga",
      price: "15€ / 30KM",
      image: "/images/form/standard-form.png",
      description: "Klasična liga sa osnovnim nagradama",
      colors: {
        border: "border-sky-400",
        bg: "bg-sky-400/10",
        hover: "hover:border-sky-400/50",
        text: "text-sky-300",
        badge: "bg-gradient-to-r from-sky-400 to-gray-600",
        badgeRing: "ring-sky-400/50",
      },
    },
    {
      id: "premium",
      name: "Premium Liga",
      price: "50€ / 100KM",
      image: "/images/form/premium-form.png",
      description: "VIP liga sa ekskluzivnim nagradama",
      colors: {
        border: "border-yellow-400",
        bg: "bg-yellow-400/10",
        hover: "hover:border-yellow-400/50",
        text: "text-yellow-300",
        badge: "bg-gradient-to-r from-yellow-400 to-gray-600",
        badgeRing: "ring-yellow-400/50",
      },
    },
  ];

  const h2hOption = {
    name: "H2H Liga",
    price: "10€ / 20KM",
    image: "/images/form/h2h-form.png",
    description: "Head-to-Head dodatna liga sa posebnim nagradama",
    colors: {
      border: "border-red-500",
      bg: "bg-red-500/10",
      hover: "hover:border-red-500/50",
      text: "text-white",
      badge: "bg-gradient-to-r from-red-500 to-gray-600",
      badgeRing: "ring-red-500/50",
    },
  };

  return (
    <>
      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <section className="relative w-full py-32 bg-theme-background overflow-hidden theme-transition">
        {/* Subtle Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-900/10 via-gray-800/5 to-red-800/10 minimal-radius blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-l from-gray-900/10 via-red-900/5 to-gray-800/10 minimal-radius blur-3xl"></div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <motion.h2
              className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 text-balance leading-tight font-russo"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                type: "spring",
                stiffness: 120,
              }}
            >
              <motion.span className="text-theme-heading-primary drop-shadow-2xl theme-transition">
                PRIJAVI SE ZA NOVU SEZONU
              </motion.span>
            </motion.h2>

            <motion.p
              className="text-theme-text-secondary text-sm md:text-base lg:text-lg w-full max-w-3xl mx-auto leading-relaxed font-medium theme-transition"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.5,
              }}
            >
              Popuni formu i izaberi ligu za sebe koju želiš igrati, povratne
              informacije ćeš dobiti u mailu.
            </motion.p>
          </motion.div>

          <div className="w-full max-w-4xl mx-auto">
            <motion.div className="relative">
              {/* Animated burgundy border - ONLY BORDER, NO BACKGROUND */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(45deg, rgba(139, 69, 19, 0.6), transparent, rgba(220, 38, 38, 0.4), transparent, rgba(139, 69, 19, 0.6))",
                  backgroundSize: "200% 200%",
                  mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  maskComposite: "xor",
                  WebkitMask:
                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  padding: "2px",
                }}
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              <motion.form
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                onSubmit={handleSubmit}
                className="relative z-10 p-8 md:p-12"
              >
                {/* Personal Info Section */}
                <div className="mb-12">
                  <motion.h3
                    className="text-lg md:text-xl lg:text-2xl font-black mb-4 md:mb-6"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <motion.span className="text-theme-heading-primary theme-transition">
                      Lični Podaci
                    </motion.span>
                  </motion.h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div className="relative">
                      <div className="relative">
                        <motion.input
                          type="text"
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) =>
                            handleInputChange("first_name", e.target.value)
                          }
                          onFocus={() => setFocusedField("first_name")}
                          onBlur={() => setFocusedField(null)}
                          className={`input-theme relative w-full px-4 py-4 border-2 minimal-radius peer transition-all duration-300 ${
                            errors.first_name
                              ? "border-red-400"
                              : focusedField === "first_name"
                              ? "border-transparent"
                              : ""
                          }`}
                          whileFocus={{ scale: 1.02 }}
                        />
                        <label
                          htmlFor="first_name"
                          className={`floating-label theme-transition ${
                            formData.first_name || focusedField === "first_name"
                              ? ""
                              : "floating-label-placeholder"
                          }`}
                        >
                          Ime *
                        </label>
                      </div>
                      <AnimatePresence>
                        {errors.first_name && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-red-400 text-xs md:text-sm mt-2 flex items-center gap-1 font-medium theme-transition"
                          >
                            <AlertCircle className="w-4 h-4" />
                            {errors.first_name}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Last Name */}
                    <div className="relative">
                      <div className="relative">
                        <motion.input
                          type="text"
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) =>
                            handleInputChange("last_name", e.target.value)
                          }
                          onFocus={() => setFocusedField("last_name")}
                          onBlur={() => setFocusedField(null)}
                          className={`input-theme relative w-full px-4 py-4 border-2 minimal-radius peer transition-all duration-300 ${
                            errors.last_name
                              ? "border-red-400"
                              : focusedField === "last_name"
                              ? "border-transparent"
                              : ""
                          }`}
                          whileFocus={{ scale: 1.02 }}
                        />
                        <label
                          htmlFor="last_name"
                          className={`floating-label theme-transition ${
                            formData.last_name || focusedField === "last_name"
                              ? ""
                              : "floating-label-placeholder"
                          }`}
                        >
                          Prezime *
                        </label>
                      </div>
                      <AnimatePresence>
                        {errors.last_name && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-red-400 text-xs md:text-sm mt-2 flex items-center gap-1 font-medium theme-transition"
                          >
                            <AlertCircle className="w-4 h-4" />
                            {errors.last_name}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Contact Info Section */}
                <div className="mb-12">
                  <motion.h3
                    className="text-lg md:text-xl lg:text-2xl font-black mb-4 md:mb-6"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <motion.span className="text-theme-heading-primary theme-transition">
                      Kontakt Podaci
                    </motion.span>
                  </motion.h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Email */}
                    <div className="relative">
                      <div className="relative">
                        <motion.input
                          type="email"
                          id="email"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          onFocus={() => setFocusedField("email")}
                          onBlur={() => setFocusedField(null)}
                          className={`input-theme relative w-full px-4 py-4 border-2 minimal-radius peer transition-all duration-300 ${
                            errors.email
                              ? "border-red-400"
                              : focusedField === "email"
                              ? "border-transparent"
                              : ""
                          }`}
                          whileFocus={{ scale: 1.02 }}
                        />
                        <label
                          htmlFor="email"
                          className={`floating-label theme-transition ${
                            formData.email || focusedField === "email"
                              ? ""
                              : "floating-label-placeholder"
                          }`}
                        >
                          Email Adresa *
                        </label>
                      </div>
                      <AnimatePresence>
                        {errors.email && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-red-400 text-xs md:text-sm mt-2 flex items-center gap-1 font-medium theme-transition"
                          >
                            <AlertCircle className="w-4 h-4" />
                            {errors.email}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Phone */}
                    <div className="relative">
                      <div className="relative">
                        <motion.input
                          type="tel"
                          id="phone"
                          value={formData.phone}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          onFocus={() => setFocusedField("phone")}
                          onBlur={() => setFocusedField(null)}
                          className={`input-theme relative w-full px-4 py-4 border-2 minimal-radius peer transition-all duration-300 ${
                            errors.phone
                              ? "border-red-400"
                              : focusedField === "phone"
                              ? "border-transparent"
                              : ""
                          }`}
                          whileFocus={{ scale: 1.02 }}
                        />
                        <label
                          htmlFor="phone"
                          className={`floating-label theme-transition ${
                            formData.phone || focusedField === "phone"
                              ? ""
                              : "floating-label-placeholder"
                          }`}
                        >
                          Broj Telefona *
                        </label>
                      </div>
                      <AnimatePresence>
                        {errors.phone && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-red-400 text-xs md:text-sm mt-2 flex items-center gap-1 font-medium theme-transition"
                          >
                            <AlertCircle className="w-4 h-4" />
                            {errors.phone}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Team Info */}
                <div className="mb-12">
                  <motion.h3
                    className="text-lg md:text-xl lg:text-2xl font-black mb-4 md:mb-6"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <motion.span className="text-theme-heading-primary theme-transition">
                      Informacije o Ekipi
                    </motion.span>
                  </motion.h3>

                  <div className="relative">
                    <div className="relative">
                      <motion.input
                        type="text"
                        id="team_name"
                        value={formData.team_name}
                        onChange={(e) =>
                          handleInputChange("team_name", e.target.value)
                        }
                        onFocus={() => setFocusedField("team_name")}
                        onBlur={() => setFocusedField(null)}
                        className={`input-theme relative w-full px-4 py-4 border-2 minimal-radius peer transition-all duration-300 ${
                          errors.team_name
                            ? "border-red-400"
                            : focusedField === "team_name"
                            ? "border-transparent"
                            : ""
                        }`}
                        whileFocus={{ scale: 1.02 }}
                      />
                      <label
                        htmlFor="team_name"
                        className={`floating-label theme-transition ${
                          formData.team_name || focusedField === "team_name"
                            ? ""
                            : "floating-label-placeholder"
                        }`}
                      >
                        Ime Ekipe *
                      </label>
                    </div>
                    <AnimatePresence>
                      {errors.team_name && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-red-400 text-sm mt-2 flex items-center gap-1 font-medium theme-transition"
                        >
                          <AlertCircle className="w-4 h-4" />
                          {errors.team_name}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* League Selection */}
                <div className="mb-12">
                  <motion.h3
                    className="text-lg md:text-xl lg:text-2xl font-black mb-4 md:mb-6"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <motion.span className="text-theme-heading-primary theme-transition">
                      Tip Lige
                    </motion.span>
                  </motion.h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-10">
                    {leagueOptions.map((option) => (
                      <motion.div
                        key={option.id}
                        className={`relative cursor-pointer minimal-radius border-2 overflow-hidden transition-all duration-500 shadow-2xl ${
                          formData.league_type === option.id
                            ? `${option.colors.border} ${option.colors.bg} shadow-lg ring-4 ${option.colors.badgeRing}`
                            : `border-gray-600/50 ${option.colors.hover} hover:shadow-xl`
                        }`}
                        onClick={() =>
                          handleInputChange("league_type", option.id)
                        }
                        whileHover={{
                          scale: 1.03,
                          y: -5,
                          transition: { duration: 0.2 },
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <input
                          type="radio"
                          name="league_type"
                          value={option.id}
                          checked={formData.league_type === option.id}
                          onChange={() =>
                            handleInputChange("league_type", option.id)
                          }
                          className="sr-only"
                        />

                        {/* League Image */}
                        <div className="relative h-48 md:h-56 bg-black/50">
                          <Image
                            src={option.image}
                            alt={option.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover opacity-90"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                          {/* Price Badge */}
                          <motion.div
                            className={`absolute top-3 right-3 md:top-4 md:right-4 ${option.colors.badge} text-white px-3 py-1.5 md:px-4 md:py-2 minimal-radius font-bold text-sm md:text-lg shadow-2xl ring-2 ${option.colors.badgeRing}`}
                            whileHover={{ scale: 1.05 }}
                            animate={{
                              boxShadow: [
                                "0 0 20px rgba(255,255,255,0.1)",
                                "0 0 30px rgba(255,255,255,0.2)",
                                "0 0 20px rgba(255,255,255,0.1)",
                              ],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          >
                            {option.price}
                          </motion.div>
                        </div>

                        {/* Content */}
                        <div className="p-6 bg-black/60">
                          <h4
                            className={`text-lg md:text-xl font-bold ${option.colors.text} mb-2`}
                          >
                            {option.name}
                          </h4>
                          <p className="text-gray-300 text-xs md:text-sm leading-tight">
                            {option.description}
                          </p>
                        </div>

                        {formData.league_type === option.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`absolute top-4 left-4 w-10 h-10 ${option.colors.badge} minimal-radius flex items-center justify-center border-2 border-white shadow-2xl ring-2 ${option.colors.badgeRing}`}
                            whileHover={{ scale: 1.1 }}
                          >
                            <CheckCircle className="w-6 h-6 text-white" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <motion.h3
                    className="text-lg md:text-xl lg:text-2xl font-black mb-4 md:mb-6"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <motion.span className="text-theme-heading-primary theme-transition">
                      Dodatna Liga (*samo 40 mjesta)
                    </motion.span>
                  </motion.h3>
                  {/* H2H League Option */}
                  <motion.div
                    className={`relative cursor-pointer minimal-radius border-2 overflow-hidden transition-all duration-500 shadow-2xl ${
                      formData.h2h_league
                        ? `${h2hOption.colors.border} ${h2hOption.colors.bg} shadow-lg ring-4 ${h2hOption.colors.badgeRing}`
                        : `border-gray-600/50 ${h2hOption.colors.hover} hover:shadow-xl`
                    }`}
                    onClick={() =>
                      handleInputChange("h2h_league", !formData.h2h_league)
                    }
                    whileHover={{
                      scale: 1.03,
                      y: -5,
                      transition: { duration: 0.2 },
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.h2h_league}
                      onChange={(e) =>
                        handleInputChange("h2h_league", e.target.checked)
                      }
                      className="sr-only"
                    />

                    {/* H2H Image - Full width like other cards */}
                    <div className="relative h-48 bg-black/50">
                      <Image
                        src={h2hOption.image}
                        alt={h2hOption.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw"
                        className="object-cover opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                      {/* Price Badge */}
                      <motion.div
                        className={`absolute top-4 right-4 ${h2hOption.colors.badge} text-white px-4 py-2 minimal-radius font-bold text-lg shadow-2xl ring-2 ${h2hOption.colors.badgeRing}`}
                        whileHover={{ scale: 1.05 }}
                        animate={{
                          boxShadow: [
                            "0 0 20px rgba(255,255,255,0.1)",
                            "0 0 30px rgba(255,255,255,0.2)",
                            "0 0 20px rgba(255,255,255,0.1)",
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        {h2hOption.price}
                      </motion.div>

                      {/* Selected indicator */}
                      {formData.h2h_league && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`absolute top-4 left-4 w-10 h-10 ${h2hOption.colors.badge} minimal-radius flex items-center justify-center border-2 border-white shadow-2xl ring-2 ${h2hOption.colors.badgeRing}`}
                          whileHover={{ scale: 1.1 }}
                        >
                          <CheckCircle className="w-6 h-6 text-white" />
                        </motion.div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 bg-black/60">
                      <h4
                        className={`text-lg md:text-xl font-bold ${h2hOption.colors.text} mb-2`}
                      >
                        {h2hOption.name}
                      </h4>
                      <p className="text-gray-300 text-xs md:text-sm leading-tight">
                        {h2hOption.description}
                      </p>
                    </div>
                  </motion.div>

                  <AnimatePresence>
                    {errors.league_type && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-400 text-xs md:text-sm mt-4 flex items-center gap-1 font-medium theme-transition"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {errors.league_type}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Payment Method Selection */}
                <div className="mb-12">
                  <motion.h3
                    className="text-lg md:text-xl lg:text-2xl font-black mb-4 md:mb-6"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <motion.span className="text-theme-heading-primary theme-transition">
                      Način Plaćanja *
                    </motion.span>
                  </motion.h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                    {[
                      {
                        id: "bank",
                        name: "Bankovni Račun",
                        Icon: Building2,
                        color: "blue",
                      },

                      {
                        id: "wise",
                        name: "Wise",
                        Icon: CreditCardIcon,
                        color: "green",
                      },
                      {
                        id: "cash",
                        name: "Keš",
                        Icon: Banknote,
                        color: "yellow",
                      },
                    ].map((method) => (
                      <motion.div
                        key={method.id}
                        className={`relative cursor-pointer minimal-radius border-2 p-3 md:p-4 text-center transition-all duration-300 ${
                          formData.payment_method === method.id
                            ? "border-red-500 bg-red-500/10 shadow-lg ring-2 ring-red-500/50"
                            : "border-gray-600/50 hover:border-red-500/50 hover:bg-red-500/5"
                        }`}
                        onClick={() => {
                          handleInputChange("payment_method", method.id);
                          if (method.id !== "cash") {
                            handleInputChange("cash_status", undefined);
                          }
                        }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <method.Icon
                            className={`w-6 h-6 md:w-8 md:h-8 ${
                              formData.payment_method === method.id
                                ? "text-white"
                                : method.color === "blue"
                                ? "text-blue-400"
                                : method.color === "purple"
                                ? "text-purple-400"
                                : method.color === "green"
                                ? "text-green-400"
                                : "text-yellow-400"
                            }`}
                          />
                          <div className="text-theme-foreground text-xs md:text-sm font-bold leading-tight theme-transition">
                            {method.name}
                          </div>
                        </div>
                        {formData.payment_method === method.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 md:w-6 md:h-6 bg-red-500 minimal-radius flex items-center justify-center"
                          >
                            <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Bank Account Download Instructions */}
                  <AnimatePresence>
                    {formData.payment_method === "bank" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6"
                      >
                        <motion.button
                          onClick={() => {
                            const selectedLeague = leagueOptions.find(
                              (option) => option.id === formData.league_type
                            );
                            const leagueType = selectedLeague
                              ? selectedLeague.name
                              : "Fantasy Football Liga";
                            downloadPaymentInstructions(leagueType);
                          }}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-4 py-3 minimal-radius font-medium text-sm transition-all duration-300 border border-theme-border bg-theme-secondary hover:bg-theme-accent hover:border-theme-border-strong text-theme-text-secondary hover:text-theme-foreground group cursor-pointer backdrop-blur-sm theme-transition"
                          whileHover={{
                            scale: 1.01,
                            transition: { duration: 0.3 },
                          }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <Download className="w-5 h-5 group-hover:animate-bounce" />
                          <span>Preuzmi uputstva za bankovnu uplatu</span>
                        </motion.button>

                        <motion.p
                          className="text-gray-400 text-xs mt-3 text-center sm:text-left"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          📄 PDF dokument sa detaljnim uputstvima i podacima za
                          uplatu
                        </motion.p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Wise Payment Instructions */}
                  <AnimatePresence>
                    {formData.payment_method === "wise" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6"
                      >
                        <motion.div
                          className="bg-theme-secondary border border-theme-border minimal-radius p-4 backdrop-blur-sm theme-transition"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-green-500/20 minimal-radius flex items-center justify-center">
                              <Mail className="w-4 h-4 text-green-400" />
                            </div>
                            <h4 className="text-theme-foreground font-semibold text-sm theme-transition">
                              Wise Uplata
                            </h4>
                          </div>

                          <p className="text-theme-text-secondary text-xs mb-4 leading-relaxed theme-transition">
                            Za Wise uplatu, pronađite korisnika putem email
                            adrese i pošaljite novac:
                          </p>

                          <div className="bg-theme-card-secondary/40 minimal-radius p-3 border border-theme-border theme-transition">
                            <div className="flex items-center gap-2 mb-2">
                              <Mail className="w-4 h-4 text-green-400 flex-shrink-0" />
                              <span className="text-theme-foreground font-mono text-xs sm:text-sm flex-1 break-all theme-transition">
                                muhamed.musa1994@gmail.com
                              </span>
                            </div>
                            <motion.button
                              onClick={copyEmailToClipboard}
                              className="w-full sm:w-auto flex items-center justify-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors border"
                              style={{
                                backgroundColor: emailCopied
                                  ? "rgba(34, 197, 94, 0.2)"
                                  : "rgba(107, 114, 128, 0.2)",
                                borderColor: emailCopied
                                  ? "rgba(34, 197, 94, 0.4)"
                                  : "rgba(107, 114, 128, 0.4)",
                                color: emailCopied ? "#22c55e" : "#9ca3af",
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Copy className="w-3 h-3" />
                              {emailCopied ? "Kopirano!" : "Kopiraj"}
                            </motion.button>
                          </div>

                          <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 minimal-radius">
                            <p className="text-blue-300 text-xs font-medium">
                              💡 Napomena: U opis uplate navedite vaše ime i tip
                              lige koje se prijavljujete.
                            </p>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Cash Status Options */}
                  <AnimatePresence>
                    {formData.payment_method === "cash" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                          {[
                            { id: "paid", name: "Plaćeno", color: "green" },
                            {
                              id: "pending",
                              name: "Dostaviti ću",
                              color: "yellow",
                            },
                          ].map((status) => (
                            <motion.div
                              key={status.id}
                              className={`relative cursor-pointer minimal-radius border-2 p-3 md:p-4 text-center transition-all duration-300 ${
                                formData.cash_status === status.id
                                  ? status.color === "green"
                                    ? "border-green-500 bg-green-500/10 shadow-lg ring-2 ring-green-500/50"
                                    : "border-yellow-500 bg-yellow-500/10 shadow-lg ring-2 ring-yellow-500/50"
                                  : "border-gray-600/50 hover:border-gray-400/50"
                              }`}
                              onClick={() =>
                                handleInputChange("cash_status", status.id)
                              }
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <div
                                className={`text-xs md:text-sm font-bold ${
                                  formData.cash_status === status.id
                                    ? status.color === "green"
                                      ? "text-green-300"
                                      : "text-yellow-300"
                                    : "text-theme-foreground theme-transition"
                                }`}
                              >
                                {status.name}
                              </div>
                              {formData.cash_status === status.id && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className={`absolute top-2 right-2 w-5 h-5 md:w-6 md:h-6 minimal-radius flex items-center justify-center ${
                                    status.color === "green"
                                      ? "bg-green-500"
                                      : "bg-yellow-500"
                                  }`}
                                >
                                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                </motion.div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {errors.payment_method && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-400 text-xs md:text-sm mb-4 flex items-center gap-1 font-medium theme-transition"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {errors.payment_method}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {errors.cash_status && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-400 text-xs md:text-sm mb-4 flex items-center gap-1 font-medium theme-transition"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {errors.cash_status}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* File Upload */}
                {formData.payment_method !== "cash" && (
                  <div className="mb-12">
                    <motion.h3
                      className="text-xl md:text-2xl font-black mb-6"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                    >
                      <motion.span className="text-theme-heading-primary theme-transition">
                        Dokaz o Uplati
                      </motion.span>
                    </motion.h3>

                    <motion.div
                      className={`relative border-2 border-dashed minimal-radius p-8 text-center transition-all duration-300 bg-theme-input-bg theme-transition ${
                        dragActive
                          ? "border-red-500 bg-red-500/10"
                          : errors.payment_proof
                          ? "border-red-400"
                          : "border-theme-dark hover:border-red-500/50"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      whileHover={{ scale: 1.01 }}
                    >
                      <input
                        type="file"
                        id="payment_proof"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                        className="sr-only"
                      />

                      <label htmlFor="payment_proof" className="cursor-pointer">
                        <div className="space-y-4">
                          {formData.payment_proof ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-green-400"
                            >
                              <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                              <p className="font-bold text-lg">
                                {formData.payment_proof.name}
                              </p>
                              <p className="text-sm text-gray-400">
                                {(
                                  formData.payment_proof.size /
                                  1024 /
                                  1024
                                ).toFixed(2)}{" "}
                                MB
                              </p>
                            </motion.div>
                          ) : (
                            <>
                              <Upload className="w-12 h-12 mx-auto text-theme-foreground theme-transition" />
                              <div>
                                <p className="text-lg font-bold text-theme-foreground mb-2 theme-transition">
                                  Prevuci fajl ovdje ili klikni za upload
                                </p>
                                <p className="text-theme-text-muted text-sm theme-transition">
                                  PNG, JPG, PDF do 10MB
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </label>
                    </motion.div>

                    <AnimatePresence>
                      {errors.payment_proof && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-red-400 text-xs md:text-sm mt-4 flex items-center gap-1 font-medium theme-transition"
                        >
                          <AlertCircle className="w-4 h-4" />
                          {errors.payment_proof}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 via-slate-700 to-gray-800 hover:from-blue-700 hover:via-slate-800 hover:to-gray-900 text-white font-black py-4 md:py-6 px-8 md:px-12 minimal-radius text-lg md:text-xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden shadow-2xl border-2 border-blue-500/50 font-russo"
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 25px 50px rgba(59, 130, 246, 0.4)",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <AnimatePresence mode="wait">
                    {isSubmitting ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center gap-3"
                      >
                        <div className="w-6 h-6 border-3 border-white border-t-transparent minimal-radius animate-spin"></div>
                        <span>OBRAĐUJEM PRIJAVU...</span>
                      </motion.div>
                    ) : (
                      <motion.span
                        key="submit"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center gap-3"
                      >
                        <span>PRIJAVI SE</span>
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Animated Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-gray-800/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <motion.div
                    className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-gray-800 minimal-radius opacity-30 blur"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </motion.button>

                {/* Success/Error Messages */}
                <AnimatePresence>
                  {submitStatus === "success" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      className="mt-8 bg-gradient-to-r from-green-500/30 via-emerald-500/30 to-teal-500/30 border border-green-500/60 minimal-radius p-4 md:p-6 backdrop-blur-xl shadow-lg"
                    >
                      <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                        <motion.div
                          className="w-16 h-16 md:w-12 md:h-12 bg-gradient-to-r from-green-400 to-emerald-500 minimal-radius flex items-center justify-center shadow-2xl"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            delay: 0.2,
                          }}
                        >
                          <CheckCircle className="w-8 h-8 md:w-6 md:h-6 text-white" />
                        </motion.div>
                        <div className="space-y-2">
                          <motion.h4
                            className={`${
                              theme === "light"
                                ? "text-gray-900"
                                : "text-green-300"
                            } font-black text-xl md:text-lg mb-1`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                          >
                            PRIJAVA USPJEŠNA!
                          </motion.h4>
                          <motion.p
                            className={`${
                              theme === "light"
                                ? "text-gray-800"
                                : "text-green-200"
                            } text-sm md:text-sm leading-relaxed font-bold`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                          >
                            Dobrodošli u REMIS Fantasy 2025/26!
                            <br />
                            Poslali smo vam email sa potvrdom prijave.
                            <br />
                            Kodovi za pristup ligi će vam biti poslati nakon
                            revizije uplate.
                          </motion.p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {submitStatus === "error" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      className="mt-8 bg-gradient-to-r from-red-500/20 via-rose-500/20 to-pink-500/20 border border-red-400/50 minimal-radius p-6 backdrop-blur-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500 minimal-radius flex items-center justify-center">
                          <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-red-300 font-black text-lg mb-1">
                            GREŠKA PRI PRIJAVI
                          </h4>
                          <p className="text-red-200 text-sm">
                            Nešto je pošlo po zlu. Molimo pokušajte ponovo.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.form>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
