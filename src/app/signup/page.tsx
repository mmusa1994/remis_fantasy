"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { FaGoogle, FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUser, FaCheckCircle } from "react-icons/fa";
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
  const { t, ready } = useTranslation('auth');
  const [step, setStep] = useState<'form' | 'otp'>('form');
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
      setError(t('nameRequired'));
      return false;
    }
    if (!formData.email.trim()) {
      setError(t('emailRequired'));
      return false;
    }
    if (formData.password.length < 6) {
      setError(t('passwordTooShort'));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordsDontMatch'));
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
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          action: 'send',
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpSent(true);
      setStep('otp');
    } catch (error: any) {
      setError(error.message || t('otpSendError'));
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
      const verifyResponse = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          action: 'verify',
          otp: otp,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.valid) {
        throw new Error(t('invalidOTP'));
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
      setError(error.message || t('registrationError'));
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
    } catch (error: any) {
      setError(t('googleSignInError'));
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          action: 'send',
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP');
      }

      setOtpSent(true);
    } catch (error: any) {
      setError(error.message || t('otpResendError'));
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
      <div className={`min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-800 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className={`mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            Signup successful! Redirecting...
          </p>
          <Link 
            href="/premier-league/tabele"
            className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white px-6 py-2 rounded-lg transition-all duration-300"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-background px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
            <BiUserPlus className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className={`mt-6 text-3xl font-extrabold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {step === 'form' ? t('createAccount') : t('verifyEmail')}
          </h2>
          <p className={`mt-2 text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {step === 'form' ? (
              <>
                {t('alreadyHaveAccount')}{' '}
                <Link href="/login" className="font-medium text-purple-600 hover:text-purple-500">
                  {t('signIn')}
                </Link>
              </>
            ) : (
              t('enterOtpSentToEmail')
            )}
          </p>
        </div>

        {step === 'form' ? (
          /* Registration Form */
          <form className="mt-8 space-y-6" onSubmit={handleSendOTP}>
            <div className="space-y-4">
              {/* Name Input */}
              <div>
                <label htmlFor="name" className="sr-only">
                  {t('fullName')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className={`h-5 w-5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                    }`} />
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
                      theme === 'dark'
                        ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-400'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    placeholder={t('fullName')}
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="sr-only">
                  {t('emailAddress')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className={`h-5 w-5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                    }`} />
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
                      theme === 'dark'
                        ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-400'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    placeholder={t('emailAddress')}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="sr-only">
                  {t('password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className={`h-5 w-5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                    }`} />
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
                      theme === 'dark'
                        ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-400'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    placeholder={t('password')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FaEyeSlash className={`h-5 w-5 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                    ) : (
                      <FaEye className={`h-5 w-5 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  {t('confirmPassword')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className={`h-5 w-5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                    }`} />
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
                      theme === 'dark'
                        ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-400'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    placeholder={t('confirmPassword')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash className={`h-5 w-5 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                    ) : (
                      <FaEye className={`h-5 w-5 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
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
                {t('sendVerificationCode')}
              </button>
            </div>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${
                    theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
                  }`} />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className={`px-2 ${
                    theme === 'dark' ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-500'
                  }`}>
                    {t('orContinueWith')}
                  </span>
                </div>
              </div>
            </div>

            {/* Google Sign In */}
            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-3 px-4 border ${
                  theme === 'dark' 
                    ? 'border-gray-700 hover:bg-gray-800' 
                    : 'border-gray-300 hover:bg-gray-50'
                } text-sm font-medium rounded-lg ${
                  theme === 'dark' ? 'text-white' : 'text-gray-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
              >
                <FaGoogle className="w-5 h-5 mr-2 text-red-500" />
                {t('signUpWithGoogle')}
              </button>
            </div>
          </form>
        ) : (
          /* OTP Verification Form */
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
            {/* Success Message */}
            {otpSent && (
              <div className="rounded-md bg-green-50 dark:bg-green-900/50 p-4 mb-4">
                <div className="flex">
                  <FaCheckCircle className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      {t('otpSentSuccessfully')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* OTP Input */}
              <div>
                <label htmlFor="otp" className="sr-only">
                  {t('verificationCode')}
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
                    theme === 'dark'
                      ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-400'
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg tracking-widest`}
                  placeholder="000000"
                />
                <p className={`mt-2 text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {t('enterSixDigitCode')}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
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
                {t('verifyAndCreateAccount')}
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
                {t('resendCode')}
              </button>
            </div>

            {/* Back Button */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep('form')}
                disabled={isLoading}
                className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-500'
                } disabled:opacity-50`}
              >
                {t('backToForm')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}