"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FaGoogle,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaLock,
  FaUser,
  FaCheckCircle,
} from "react-icons/fa";
import { BiUserPlus } from "react-icons/bi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignUpPage() {
  const { theme } = useTheme();
  const { t, ready } = useTranslation("auth");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    getSession().then((session) => {
      if (session) {
        setSignupSuccess(true);
      }
    });
  }, []);

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError(t("nameRequired"));
      return false;
    }
    if (!formData.email.trim()) {
      setError(t("emailRequired"));
      return false;
    }
    if (formData.password.length < 6) {
      setError(t("passwordTooShort"));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t("passwordsDontMatch"));
      return false;
    }
    return true;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          action: "send",
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setOtpSent(true);
      setStep("otp");
    } catch (error: any) {
      setError(error.message || t("otpSendError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !otp.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      // First verify OTP
      const verifyResponse = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          action: "verify",
          otp: otp,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.valid) {
        throw new Error(t("invalidOTP"));
      }

      // Then create account
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        otp: otp,
        action: "register",
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      setSignupSuccess(true);
    } catch (error: any) {
      setError(error.message || t("registrationError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("google", {
        redirect: false,
      });
      if (result?.ok) {
        setSignupSuccess(true);
      }
    } catch {
      setError(t("googleSignInError"));
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          action: "send",
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend OTP");
      }

      setOtpSent(true);
    } catch (error: any) {
      setError(error.message || t("otpResendError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-background">
        <AiOutlineLoading3Quarters className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-800 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p
            className={`mb-4 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {t("signupSuccessRedirect")}
          </p>
          <Link
            href="/premier-league/tables"
            className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white px-6 py-2 rounded-lg transition-all duration-300"
          >
            {t("goToDashboard")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex  bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-800 via-red-900 to-gray-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzAgMzBjMC0xMS4wNDYtOC45NTQtMjAtMjAtMjBzLTIwIDguOTU0LTIwIDIwIDguOTU0IDIwIDIwIDIwIDIwLTguOTU0IDIwLTIwem0tMzAgMGMwLTUuNTIzIDQuNDc3LTEwIDEwLTEwczEwIDQuNDc3IDEwIDEwLTQuNDc3IDEwLTEwIDEwLTEwLTQuNDc3LTEwLTEweiIvPjwvZz48L2c+PC9zdmc+')] bg-repeat" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center text-white p-12 w-full">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 flex flex-col justify-center items-center"
          >
            <Image
              src="/images/rf-logo.svg"
              alt="REMIS Fantasy Logo"
              width={300}
              height={300}
              className="object-cover"
            />
            <h1 className="text-4xl font-bold mb-4">
              {t("welcomeToRemisFantasy")}
            </h1>
            <p className="text-xl text-red-100 mb-8">{t("experienceAwaits")}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center text-red-100">
              <div className="w-2 h-2 bg-red-300 rounded-full mr-3"></div>
              {t("liveFplTracking")}
            </div>
            <div className="flex items-center text-red-100">
              <div className="w-2 h-2 bg-red-300 rounded-full mr-3"></div>
              {t("aiPoweredRecommendations")}
            </div>
            <div className="flex items-center text-red-100">
              <div className="w-2 h-2 bg-red-300 rounded-full mr-3"></div>
              {t("advancedStatsAndInsights")}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div
            className={`rounded-2xl shadow-2xl p-8 ${
              theme === "dark"
                ? "bg-gray-800/90 backdrop-blur-sm border border-gray-700/50"
                : "bg-white/90 backdrop-blur-sm border border-gray-200/50"
            }`}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`text-3xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {step === "form" ? t("createAccount") : t("verifyEmail")}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className={`mt-2 text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {step === "form" ? (
                  <>
                    {t("alreadyHaveAccount")}{" "}
                    <Link
                      href="/login"
                      className="font-medium text-purple-600 hover:text-purple-500"
                    >
                      {t("signIn")}
                    </Link>
                  </>
                ) : (
                  t("enterOtpSentToEmail")
                )}
              </motion.p>
            </div>

            {step === "form" ? (
              /* Registration Form */
              <form className="space-y-6" onSubmit={handleSendOTP}>
                <div className="space-y-4">
                  {/* Name Input */}
                  <div>
                    <label htmlFor="name" className="sr-only">
                      {t("fullName")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser
                          className={`h-5 w-5 ${
                            theme === "dark" ? "text-gray-400" : "text-gray-400"
                          }`}
                        />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`appearance-none relative block w-full pl-10 pr-3 py-3 border ${
                          theme === "dark"
                            ? "border-gray-700 bg-gray-800 text-white placeholder-gray-400"
                            : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                        placeholder={t("fullName")}
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div>
                    <label htmlFor="email" className="sr-only">
                      {t("emailAddress")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaEnvelope
                          className={`h-5 w-5 ${
                            theme === "dark" ? "text-gray-400" : "text-gray-400"
                          }`}
                        />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`appearance-none relative block w-full pl-10 pr-3 py-3 border ${
                          theme === "dark"
                            ? "border-gray-700 bg-gray-800 text-white placeholder-gray-400"
                            : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                        placeholder={t("emailAddress")}
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label htmlFor="password" className="sr-only">
                      {t("password")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock
                          className={`h-5 w-5 ${
                            theme === "dark" ? "text-gray-400" : "text-gray-400"
                          }`}
                        />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`appearance-none relative block w-full pl-10 pr-10 py-3 border ${
                          theme === "dark"
                            ? "border-gray-700 bg-gray-800 text-white placeholder-gray-400"
                            : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                        placeholder={t("password")}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <FaEyeSlash
                            className={`h-5 w-5 ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-400"
                            }`}
                          />
                        ) : (
                          <FaEye
                            className={`h-5 w-5 ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-400"
                            }`}
                          />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div>
                    <label htmlFor="confirmPassword" className="sr-only">
                      {t("confirmPassword")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock
                          className={`h-5 w-5 ${
                            theme === "dark" ? "text-gray-400" : "text-gray-400"
                          }`}
                        />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`appearance-none relative block w-full pl-10 pr-10 py-3 border ${
                          theme === "dark"
                            ? "border-gray-700 bg-gray-800 text-white placeholder-gray-400"
                            : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                        placeholder={t("confirmPassword")}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <FaEyeSlash
                            className={`h-5 w-5 ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-400"
                            }`}
                          />
                        ) : (
                          <FaEye
                            className={`h-5 w-5 ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-400"
                            }`}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50"
                  >
                    <p className="text-sm text-red-800 dark:text-red-300 text-center">
                      {error}
                    </p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading && (
                      <AiOutlineLoading3Quarters className="w-5 h-5 mr-2 animate-spin" />
                    )}
                    {t("sendVerificationCode")}
                  </button>
                </div>

                {/* Divider */}
                <div className="my-6 flex items-center">
                  <div
                    className={`flex-1 h-px ${
                      theme === "dark" ? "bg-gray-600" : "bg-gray-300"
                    }`}
                  />
                  <span
                    className={`mx-4 text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {t("orContinueWith")}
                  </span>
                  <div
                    className={`flex-1 h-px ${
                      theme === "dark" ? "bg-gray-600" : "bg-gray-300"
                    }`}
                  />
                </div>

                {/* Google Sign In */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 transition-all duration-300 ${
                    theme === "dark"
                      ? "border-gray-600 bg-gray-700/50 hover:bg-gray-600/50 text-white"
                      : "border-gray-300 bg-white hover:bg-gray-50 text-gray-900"
                  } disabled:opacity-50 disabled:cursor-not-allowed group`}
                >
                  {isLoading ? (
                    <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <FaGoogle className="w-5 h-5 text-red-500" />
                      <span className="font-medium">
                        {t("signUpWithGoogle")}
                      </span>
                    </>
                  )}
                </motion.button>
              </form>
            ) : (
              /* OTP Verification Form */
              <form className="space-y-6" onSubmit={handleVerifyOTP}>
                {/* Success Message */}
                {otpSent && (
                  <div className="rounded-md bg-green-50 dark:bg-green-900/50 p-4 mb-4">
                    <div className="flex">
                      <FaCheckCircle className="h-5 w-5 text-green-400" />
                      <div className="ml-3">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          {t("otpSentSuccessfully")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* OTP Input */}
                  <div>
                    <label htmlFor="otp" className="sr-only">
                      {t("verificationCode")}
                    </label>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className={`appearance-none relative block w-full px-3 py-3 border ${
                        theme === "dark"
                          ? "border-gray-700 bg-gray-800 text-white placeholder-gray-400"
                          : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg tracking-widest`}
                      placeholder="000000"
                    />
                    <p
                      className={`mt-2 text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {t("enterSixDigitCode")}
                    </p>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50"
                  >
                    <p className="text-sm text-red-800 dark:text-red-300 text-center">
                      {error}
                    </p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isLoading || !otp.trim()}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading && (
                      <AiOutlineLoading3Quarters className="w-5 h-5 mr-2 animate-spin" />
                    )}
                    {t("verifyAndCreateAccount")}
                  </button>
                </div>

                {/* Resend OTP */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="font-medium text-purple-600 hover:text-purple-500 disabled:opacity-50"
                  >
                    {t("resendCode")}
                  </button>
                </div>

                {/* Back Button */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    disabled={isLoading}
                    className={`text-sm ${
                      theme === "dark"
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-600 hover:text-gray-500"
                    } disabled:opacity-50`}
                  >
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
