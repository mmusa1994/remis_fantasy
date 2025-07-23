"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { CheckCircle, AlertCircle, Trophy, Upload } from "lucide-react";
import Image from "next/image";

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  team_name: string;
  league_type: "standard" | "premium" | "";
  h2h_league: boolean;
  payment_proof?: File;
}

export default function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    team_name: "",
    league_type: "",
    h2h_league: false,
    payment_proof: undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!formData.team_name.trim()) {
      newErrors.team_name = "Team name is required";
    }

    if (!formData.league_type) {
      newErrors.league_type = "Please select a league type";
    }

    if (!formData.payment_proof) {
      newErrors.payment_proof = "Payment proof is required";
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
        payment_proof: "File size must be less than 10MB",
      }));
      return;
    }

    if (!allowedTypes.some((type) => file.type.startsWith(type))) {
      setErrors((prev) => ({
        ...prev,
        payment_proof: "Only images and PDF files are allowed",
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
      const { error } = await supabase.from("registration_25_26").insert([
        {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          team_name: formData.team_name.trim(),
          league_type: formData.league_type,
          h2h_league: formData.h2h_league,
          payment_proof_url: paymentProofUrl,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      // Send confirmation email
      try {
        const emailResponse = await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userData: {
              first_name: formData.first_name.trim(),
              last_name: formData.last_name.trim(),
              email: formData.email.trim(),
              phone: formData.phone.trim(),
              team_name: formData.team_name.trim(),
              league_type: formData.league_type,
              h2h_league: formData.h2h_league,
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
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        team_name: "",
        league_type: "",
        h2h_league: false,
        payment_proof: undefined,
      });
    } catch (error) {
      console.error("Registration error:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const leagueOptions = [
    {
      id: "standard",
      name: "Standard Liga",
      price: "15€ / 30KM",
      image: "/images/form/standard-form.png",
      description: "Klasična liga s osnovnim nagradama",
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
      description: "VIP liga s ekskluzivnim nagradama",
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
      text: "text-red-400",
      badge: "bg-gradient-to-r from-red-500 to-gray-600",
      badgeRing: "ring-red-500/50",
    },
  };

  return (
    <section className="relative py-32 bg-black overflow-hidden">
      {/* Subtle Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-900/10 via-gray-800/5 to-red-800/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-l from-gray-900/10 via-red-900/5 to-gray-800/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
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
            <motion.span
              className="bg-gradient-to-r from-red-700 via-red-600 to-gray-400 bg-clip-text text-transparent drop-shadow-2xl"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                backgroundSize: "200% 200%",
              }}
            >
              PRIJAVI SE ZA NOVU SEZONU
            </motion.span>
          </motion.h2>

          <motion.p
            className="text-gray-300 text-sm md:text-base lg:text-lg max-w-3xl mx-auto leading-relaxed font-medium"
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

        <div className="max-w-4xl mx-auto">
          <motion.div className="relative">
            {/* Animated burgundy border */}
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(45deg, rgba(139, 69, 19, 0.6), transparent, rgba(220, 38, 38, 0.4), transparent, rgba(139, 69, 19, 0.6))",
                backgroundSize: "200% 200%",
              }}
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <div className="absolute inset-[1px] bg-black/95" />
            </motion.div>

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
                  className="text-xl md:text-2xl font-black mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <motion.span
                    className="bg-gradient-to-r from-red-700 via-red-600 to-gray-400 bg-clip-text text-transparent"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      backgroundSize: "200% 200%",
                    }}
                  >
                    Lični Podaci
                  </motion.span>
                </motion.h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="relative">
                    <div className="relative">
                      {/* Animated gradient border for focus state */}
                      {focusedField === "first_name" && (
                        <motion.div
                          className="absolute inset-0 rounded-xl"
                          style={{
                            background:
                              "linear-gradient(45deg, rgba(139, 69, 19, 0.8), rgba(220, 38, 38, 0.6), rgba(107, 114, 128, 0.4), rgba(0, 0, 0, 0.8))",
                            backgroundSize: "300% 300%",
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
                        >
                          <div className="w-full h-full bg-black/60 rounded-xl" />
                        </motion.div>
                      )}

                      <motion.input
                        type="text"
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) =>
                          handleInputChange("first_name", e.target.value)
                        }
                        onFocus={() => setFocusedField("first_name")}
                        onBlur={() => setFocusedField(null)}
                        className={`relative w-full px-4 py-4 bg-black/60 border-2 rounded-xl text-white placeholder-transparent peer focus:outline-none transition-all duration-300 ${
                          errors.first_name
                            ? "border-red-400"
                            : focusedField === "first_name"
                            ? "border-transparent"
                            : "border-gray-600/50"
                        }`}
                        placeholder="Ime"
                        whileFocus={{ scale: 1.02 }}
                      />
                      <label
                        htmlFor="first_name"
                        className="absolute left-4 -top-2.5 bg-black px-2 text-sm text-red-400 transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-red-400 peer-focus:bg-black z-10"
                      >
                        Ime
                      </label>
                    </div>
                    <AnimatePresence>
                      {errors.first_name && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-red-400 text-sm mt-2 flex items-center gap-1"
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
                      {/* Animated gradient border for focus state */}
                      {focusedField === "last_name" && (
                        <motion.div
                          className="absolute inset-0 rounded-xl"
                          style={{
                            background:
                              "linear-gradient(45deg, rgba(139, 69, 19, 0.8), rgba(220, 38, 38, 0.6), rgba(107, 114, 128, 0.4), rgba(0, 0, 0, 0.8))",
                            backgroundSize: "300% 300%",
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
                        >
                          <div className="w-full h-full bg-black/60 rounded-xl" />
                        </motion.div>
                      )}

                      <motion.input
                        type="text"
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) =>
                          handleInputChange("last_name", e.target.value)
                        }
                        onFocus={() => setFocusedField("last_name")}
                        onBlur={() => setFocusedField(null)}
                        className={`relative w-full px-4 py-4 bg-black/60 border-2 rounded-xl text-white placeholder-transparent peer focus:outline-none transition-all duration-300 ${
                          errors.last_name
                            ? "border-red-400"
                            : focusedField === "last_name"
                            ? "border-transparent"
                            : "border-gray-600/50"
                        }`}
                        placeholder="Prezime"
                        whileFocus={{ scale: 1.02 }}
                      />
                      <label
                        htmlFor="last_name"
                        className="absolute left-4 -top-2.5 bg-black px-2 text-sm text-red-400 transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-red-400 peer-focus:bg-black z-10"
                      >
                        Prezime
                      </label>
                    </div>
                    <AnimatePresence>
                      {errors.last_name && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-red-400 text-sm mt-2 flex items-center gap-1"
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
                  className="text-xl md:text-2xl font-black mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <motion.span
                    className="bg-gradient-to-r from-red-700 via-red-600 to-gray-400 bg-clip-text text-transparent"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      backgroundSize: "200% 200%",
                    }}
                  >
                    Kontakt Podaci
                  </motion.span>
                </motion.h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div className="relative">
                    <div className="relative">
                      {/* Animated gradient border for focus state */}
                      {focusedField === "email" && (
                        <motion.div
                          className="absolute inset-0 rounded-xl"
                          style={{
                            background:
                              "linear-gradient(45deg, rgba(139, 69, 19, 0.8), rgba(220, 38, 38, 0.6), rgba(107, 114, 128, 0.4), rgba(0, 0, 0, 0.8))",
                            backgroundSize: "300% 300%",
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
                        >
                          <div className="w-full h-full bg-black/60 rounded-xl" />
                        </motion.div>
                      )}

                      <motion.input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        className={`relative w-full px-4 py-4 bg-black/60 border-2 rounded-xl text-white placeholder-transparent peer focus:outline-none transition-all duration-300 ${
                          errors.email
                            ? "border-red-400"
                            : focusedField === "email"
                            ? "border-transparent"
                            : "border-gray-600/50"
                        }`}
                        placeholder="Email Adresa"
                        whileFocus={{ scale: 1.02 }}
                      />
                      <label
                        htmlFor="email"
                        className="absolute left-4 -top-2.5 bg-black px-2 text-sm text-red-400 transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-red-400 peer-focus:bg-black z-10"
                      >
                        Email Adresa
                      </label>
                    </div>
                    <AnimatePresence>
                      {errors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-red-400 text-sm mt-2 flex items-center gap-1"
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
                      {/* Animated gradient border for focus state */}
                      {focusedField === "phone" && (
                        <motion.div
                          className="absolute inset-0 rounded-xl"
                          style={{
                            background:
                              "linear-gradient(45deg, rgba(139, 69, 19, 0.8), rgba(220, 38, 38, 0.6), rgba(107, 114, 128, 0.4), rgba(0, 0, 0, 0.8))",
                            backgroundSize: "300% 300%",
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
                        >
                          <div className="w-full h-full bg-black/60 rounded-xl" />
                        </motion.div>
                      )}

                      <motion.input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        onFocus={() => setFocusedField("phone")}
                        onBlur={() => setFocusedField(null)}
                        className={`relative w-full px-4 py-4 bg-black/60 border-2 rounded-xl text-white placeholder-transparent peer focus:outline-none transition-all duration-300 ${
                          errors.phone
                            ? "border-red-400"
                            : focusedField === "phone"
                            ? "border-transparent"
                            : "border-gray-600/50"
                        }`}
                        placeholder="Broj Telefona"
                        whileFocus={{ scale: 1.02 }}
                      />
                      <label
                        htmlFor="phone"
                        className="absolute left-4 -top-2.5 bg-black px-2 text-sm text-red-400 transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-red-400 peer-focus:bg-black z-10"
                      >
                        Broj Telefona
                      </label>
                    </div>
                    <AnimatePresence>
                      {errors.phone && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-red-400 text-sm mt-2 flex items-center gap-1"
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
                  className="text-xl md:text-2xl font-black mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <motion.span
                    className="bg-gradient-to-r from-red-700 via-red-600 to-gray-400 bg-clip-text text-transparent"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      backgroundSize: "200% 200%",
                    }}
                  >
                    Informacije o Ekipi
                  </motion.span>
                </motion.h3>

                <div className="relative">
                  <div className="relative">
                    {/* Animated gradient border for focus state */}
                    {focusedField === "team_name" && (
                      <motion.div
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background:
                            "linear-gradient(45deg, rgba(139, 69, 19, 0.8), rgba(220, 38, 38, 0.6), rgba(107, 114, 128, 0.4), rgba(0, 0, 0, 0.8))",
                          backgroundSize: "300% 300%",
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
                      >
                        <div className="w-full h-full bg-black/60 rounded-xl" />
                      </motion.div>
                    )}

                    <motion.input
                      type="text"
                      id="team_name"
                      value={formData.team_name}
                      onChange={(e) =>
                        handleInputChange("team_name", e.target.value)
                      }
                      onFocus={() => setFocusedField("team_name")}
                      onBlur={() => setFocusedField(null)}
                      className={`relative w-full px-4 py-4 bg-black/60 border-2 rounded-xl text-white placeholder-transparent peer focus:outline-none transition-all duration-300 ${
                        errors.team_name
                          ? "border-red-400"
                          : focusedField === "team_name"
                          ? "border-transparent"
                          : "border-gray-600/50"
                      }`}
                      placeholder="Ime Ekipe"
                      whileFocus={{ scale: 1.02 }}
                    />
                    <label
                      htmlFor="team_name"
                      className="absolute left-4 -top-2.5 bg-black px-2 text-sm text-red-400 transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-red-400 peer-focus:bg-black z-10"
                    >
                      Ime Ekipe
                    </label>
                  </div>
                  <AnimatePresence>
                    {errors.team_name && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-400 text-sm mt-2 flex items-center gap-1"
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
                  className="text-xl md:text-2xl font-black mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <motion.span
                    className="bg-gradient-to-r from-red-700 via-red-600 to-gray-400 bg-clip-text text-transparent"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      backgroundSize: "200% 200%",
                    }}
                  >
                    Tip Lige
                  </motion.span>
                </motion.h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-10">
                  {leagueOptions.map((option) => (
                    <motion.div
                      key={option.id}
                      className={`relative cursor-pointer rounded-2xl border-2 overflow-hidden transition-all duration-500 shadow-2xl ${
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
                          className="object-cover opacity-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                        {/* Price Badge */}
                        <motion.div
                          className={`absolute top-3 right-3 md:top-4 md:right-4 ${option.colors.badge} text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-sm md:text-lg shadow-2xl ring-2 ${option.colors.badgeRing}`}
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
                          className={`text-xl font-bold ${option.colors.text} mb-2`}
                        >
                          {option.name}
                        </h4>
                        <p className="text-gray-300 text-sm">
                          {option.description}
                        </p>
                      </div>

                      {formData.league_type === option.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`absolute top-4 left-4 w-10 h-10 ${option.colors.badge} rounded-full flex items-center justify-center border-2 border-white shadow-2xl ring-2 ${option.colors.badgeRing}`}
                          whileHover={{ scale: 1.1 }}
                        >
                          <CheckCircle className="w-6 h-6 text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>

                <motion.h3
                  className="text-xl md:text-2xl font-black mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <motion.span
                    className="bg-gradient-to-r from-red-700 via-red-600 to-gray-400 bg-clip-text text-transparent"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      backgroundSize: "200% 200%",
                    }}
                  >
                    Dodatna Liga
                  </motion.span>
                </motion.h3>
                {/* H2H League Option */}
                <motion.div
                  className={`relative cursor-pointer rounded-2xl border-2 overflow-hidden transition-all duration-500 shadow-2xl ${
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
                      className="object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    {/* Price Badge */}
                    <motion.div
                      className={`absolute top-4 right-4 ${h2hOption.colors.badge} text-white px-4 py-2 rounded-full font-bold text-lg shadow-2xl ring-2 ${h2hOption.colors.badgeRing}`}
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
                        className={`absolute top-4 left-4 w-10 h-10 ${h2hOption.colors.badge} rounded-full flex items-center justify-center border-2 border-white shadow-2xl ring-2 ${h2hOption.colors.badgeRing}`}
                        whileHover={{ scale: 1.1 }}
                      >
                        <CheckCircle className="w-6 h-6 text-white" />
                      </motion.div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 bg-black/60">
                    <h4
                      className={`text-xl font-bold ${h2hOption.colors.text} mb-2`}
                    >
                      {h2hOption.name}
                    </h4>
                    <p className="text-gray-300 text-sm">
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
                      className="text-red-400 text-sm mt-4 flex items-center gap-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errors.league_type}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* File Upload */}
              <div className="mb-12">
                <motion.h3
                  className="text-xl md:text-2xl font-black mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <motion.span
                    className="bg-gradient-to-r from-red-700 via-red-600 to-gray-400 bg-clip-text text-transparent"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      backgroundSize: "200% 200%",
                    }}
                  >
                    Dokaz o Uplati
                  </motion.span>
                </motion.h3>

                <motion.div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 bg-black/60 ${
                    dragActive
                      ? "border-red-500 bg-red-500/10"
                      : errors.payment_proof
                      ? "border-red-400"
                      : "border-gray-600/50 hover:border-red-500/50"
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
                          <Upload className="w-12 h-12 mx-auto text-red-400" />
                          <div>
                            <p className="text-lg font-bold text-white mb-2">
                              Otpusti fajl ovdje ili klikni za upload
                            </p>
                            <p className="text-gray-400 text-sm">
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
                      className="text-red-400 text-sm mt-4 flex items-center gap-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errors.payment_proof}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-red-600 via-red-700 to-gray-800 hover:from-red-700 hover:via-red-800 hover:to-gray-900 text-white font-black py-6 px-12 rounded-2xl text-xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden shadow-2xl border-2 border-red-500/50 font-russo"
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 25px 50px rgba(220, 38, 38, 0.4)",
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
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>OBRAĐUJEM REGISTRACIJU...</span>
                    </motion.div>
                  ) : (
                    <motion.span
                      key="submit"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-center gap-3"
                    >
                      <span>PRIJAVA</span>
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-gray-800/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-red-600 to-gray-800 rounded-2xl opacity-30 blur"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
              </motion.button>

              {/* Success/Error Messages */}
              <AnimatePresence>
                {submitStatus === "success" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    className="mt-8 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 border border-green-400/50 rounded-2xl p-4 md:p-6 backdrop-blur-xl"
                  >
                    <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                      <motion.div
                        className="w-16 h-16 md:w-12 md:h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl"
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
                          className="text-green-300 font-black text-xl md:text-lg mb-1"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          REGISTRACIJA USPJEŠNA!
                        </motion.h4>
                        <motion.p
                          className="text-green-200 text-sm md:text-sm leading-relaxed"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 }}
                        >
                          Dobrodošao u REMIS Fantasy 2025/26!
                          <br className="md:hidden" />
                          Poslali smo ti email sa kodovima za pristup ligi.
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
                    className="mt-8 bg-gradient-to-r from-red-500/20 via-rose-500/20 to-pink-500/20 border border-red-400/50 rounded-2xl p-6 backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-red-300 font-black text-lg mb-1">
                          GREŠKA PRI REGISTRACIJI
                        </h4>
                        <p className="text-red-200 text-sm">
                          Nešto je pošlo po zlu. Molimo pokušaj ponovo.
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
  );
}
