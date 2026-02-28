"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export default function ForgotPasswordPage() {
  const { theme } = useTheme();
  const { t } = useTranslation("auth");

  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "request" }),
      });
      // We return generic success even if user not found
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("resetCodeSendError"));
      }
      setCodeSent(true);
      setStep("otp");
    } catch (err: any) {
      setError(err.message || t("resetCodeSendError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("passwordsDontMatch"));
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "reset", otp, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t("resetError"));
      }
      setResetSuccess(true);
    } catch (err: any) {
      setError(err.message || t("resetError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-800 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className={theme === "dark" ? "text-white" : "text-gray-900"}>
            {t("resetSuccessRedirect")}
          </p>
          <Link
            href="/login"
            className="inline-block mt-4 bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white px-6 py-2 rounded-lg transition-all duration-300"
          >
            {t("signIn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzAgMzBjMC0xMS4wNDYtOC45NTQtMjAtMjAtMjBzLTIwIDguOTU0LTIwIDIwIDguOTU0IDIwIDIwIDIwIDIwLTguOTU0IDIwLTIwem0tMzAgMGMwLTUuNTIzIDQuNDc3LTEwIDEwLTEwczEwIDQuNDc3IDEwIDEwLTQuNDc3IDEwLTEwIDEwLTEwLTQuNDc3LTEwLTEweiIvPjwvZz48L2c+PC9zdmc+')] bg-repeat" />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center text-center text-white p-12 w-full">
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mb-8 flex flex-col justify-center items-center">
            <Image src="/images/rf-logo.svg" alt="REMIS Fantasy Logo" width={300} height={300} className="object-cover" />
            <h1 className="text-4xl font-bold mb-4">{t("welcomeToRemisFantasy")}</h1>
            <p className="text-xl text-red-100 mb-8">{t("experienceAwaits")}</p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
          <div className={`rounded-lg shadow-md p-8 ${theme === "dark" ? "bg-gray-800/90 backdrop-blur-sm border border-gray-700/50" : "bg-white/90 backdrop-blur-sm border border-gray-200/50"}`}>
            <div className="text-center mb-8">
              <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {step === "form" ? t("forgotPassword") : t("resetPassword")}
              </motion.h2>
              <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className={`mt-2 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                {step === "form" ? t("forgotPasswordSubtitle") : t("enterResetCode")}
              </motion.p>
            </div>

            {step === "form" ? (
              <form className="space-y-6" onSubmit={handleSendCode}>
                <div>
                  <div className="relative">
                    <FaEnvelope className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder={t("emailAddress")}
                      className={`w-full pl-12 pr-4 py-3 rounded-md border-2 transition-all duration-300 ${theme === "dark" ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:bg-gray-700" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-800 focus:bg-gray-50"} focus:outline-none focus:ring-0`}
                    />
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50">
                    <p className="text-sm text-red-800 dark:text-red-300 text-center">{error}</p>
                  </motion.div>
                )}

                <div>
                  <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-red-800 hover:bg-red-900 text-white font-semibold rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md">
                    {isLoading ? (
                      <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      t("sendResetCode")
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                    {t("rememberedPassword")} {" "}
                    <Link href="/login" className="font-semibold text-red-800 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                      {t("signIn")}
                    </Link>
                  </p>
                </div>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={handleReset}>
                {codeSent && (
                  <div className="rounded-md bg-green-50 dark:bg-green-900/50 p-4 mb-4">
                    <div className="flex">
                      <FaCheckCircle className="h-5 w-5 text-green-400" />
                      <div className="ml-3">
                        <p className="text-sm text-green-800 dark:text-green-200">{t("resetCodeSentSuccessfully")}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="otp" className="sr-only">{t("verificationCode")}</label>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className={`appearance-none relative block w-full px-3 py-3 border ${theme === "dark" ? "border-gray-700 bg-gray-800 text-white placeholder-gray-400" : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg tracking-widest`}
                      placeholder="000000"
                    />
                    <p className={`mt-2 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>{t("enterSixDigitCode")}</p>
                  </div>

                  <div>
                    <div className="relative">
                      <FaLock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder={t("newPassword")}
                        className={`w-full pl-12 pr-12 py-3 rounded-md border-2 transition-all duration-300 ${theme === "dark" ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:bg-gray-700" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-800 focus:bg-gray-50"} focus:outline-none focus:ring-0`}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme === "dark" ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-600"} transition-colors`}>
                        {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <FaLock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder={t("confirmNewPassword")}
                        className={`w-full pl-12 pr-12 py-3 rounded-md border-2 transition-all duration-300 ${theme === "dark" ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:bg-gray-700" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-800 focus:bg-gray-50"} focus:outline-none focus:ring-0`}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme === "dark" ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-600"} transition-colors`}>
                        {showConfirmPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50">
                    <p className="text-sm text-red-800 dark:text-red-300 text-center">{error}</p>
                  </motion.div>
                )}

                <div>
                  <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-red-800 hover:bg-red-900 text-white font-semibold rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md">
                    {isLoading ? (
                      <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      t("updatePassword")
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <button type="button" onClick={() => setStep("form")} disabled={isLoading} className={`text-sm ${theme === "dark" ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-500"} disabled:opacity-50`}>
                    {t("backToForm")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

