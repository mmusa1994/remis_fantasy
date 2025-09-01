"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { FaGoogle, FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
import { BiUser } from "react-icons/bi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export default function LoginPage() {
  const { theme } = useTheme();
  const { t, ready } = useTranslation('auth');
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    getSession().then((session) => {
      if (session) {
        router.push("/premier-league");
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        action: "login",
        redirect: false,
      });

      if (result?.error) {
        setError(t('invalidCredentials'));
      } else {
        router.push("/premier-league");
      }
    } catch (error: any) {
      setError(t('loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      await signIn("google", {
        callbackUrl: "/premier-league",
      });
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

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-background">
        <AiOutlineLoading3Quarters className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-background px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
            <BiUser className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className={`mt-6 text-3xl font-extrabold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {t('signInToAccount')}
          </h2>
          <p className={`mt-2 text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {t('dontHaveAccount')}{' '}
            <Link href="/signup" className="font-medium text-purple-600 hover:text-purple-500">
              {t('signUp')}
            </Link>
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" value="true" />
          <div className="space-y-4">
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
                  autoComplete="current-password"
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
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className={`ml-2 block text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
              }`}>
                {t('rememberMe')}
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-purple-600 hover:text-purple-500">
                {t('forgotPassword')}
              </Link>
            </div>
          </div>

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
              {t('signIn')}
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
              {!isLoading && <FaGoogle className="w-5 h-5 mr-2 text-red-500" />}
              {isLoading && (
                <AiOutlineLoading3Quarters className="w-5 h-5 mr-2 animate-spin" />
              )}
              {t('signInWithGoogle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}