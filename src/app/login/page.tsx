"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaGoogle,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaLock,
  FaUserCircle,
} from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export default function LoginPage() {
  const { theme } = useTheme();
  const { t, ready } = useTranslation("auth");
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user is already logged in
    getSession().then((session) => {
      if (session) {
        router.push("/premier-league/tabele");
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
        setError(t("invalidCredentials"));
      } else {
        router.push("/premier-league/tabele");
      }
    } catch (_error: any) {
      setError(t("loginError"));
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
        callbackUrl: "/premier-league/tabele",
      });
    } catch (_error: any) {
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

  if (!ready || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <AiOutlineLoading3Quarters className="w-8 h-8 animate-spin text-red-800" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-800 via-red-900 to-gray-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzAgMzBjMC0xMS4wNDYtOC45NTQtMjAtMjAtMjBzLTIwIDguOTU0LTIwIDIwIDguOTU0IDIwIDIwIDIwIDIwLTguOTU0IDIwLTIwem0tMzAgMGMwLTUuNTIzIDQuNDc3LTEwIDEwLTEwczEwIDQuNDc3IDEwIDEwLTQuNDc3IDEwLTEwIDEwLTEwLTQuNDc3LTEwLTEweiIvPjwvZz48L2c+PC9zdmc+')] bg-repeat" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center text-white p-12">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <FaUserCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Welcome to REMIS Fantasy
            </h1>
            <p className="text-xl text-red-100 mb-8">
              The ultimate Fantasy Premier League experience awaits
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center text-red-100">
              <div className="w-2 h-2 bg-red-300 rounded-full mr-3"></div>
              Live FPL tracking & analysis
            </div>
            <div className="flex items-center text-red-100">
              <div className="w-2 h-2 bg-red-300 rounded-full mr-3"></div>
              AI-powered team recommendations
            </div>
            <div className="flex items-center text-red-100">
              <div className="w-2 h-2 bg-red-300 rounded-full mr-3"></div>
              Advanced statistics & insights
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
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
                Sign In
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className={`mt-2 text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Access your Fantasy Premier League dashboard
              </motion.p>
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

            {/* Google Sign In Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
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
                  <span className="font-medium">Continue with Google</span>
                </>
              )}
            </motion.button>

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
                or sign in with email
              </span>
              <div
                className={`flex-1 h-px ${
                  theme === "dark" ? "bg-gray-600" : "bg-gray-300"
                }`}
              />
            </div>

            {/* Email/Password Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Email Field */}
              <div>
                <div className="relative">
                  <FaEnvelope
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Email address"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                      theme === "dark"
                        ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:bg-gray-700"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-800 focus:bg-gray-50"
                    } focus:outline-none focus:ring-0`}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="relative">
                  <FaLock
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="Password"
                    className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 transition-all duration-300 ${
                      theme === "dark"
                        ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:bg-gray-700"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-800 focus:bg-gray-50"
                    } focus:outline-none focus:ring-0`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      theme === "dark"
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-500 hover:text-gray-600"
                    } transition-colors`}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="w-5 h-5" />
                    ) : (
                      <FaEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "Sign In"
                )}
              </motion.button>
            </motion.form>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-6 text-center"
            >
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Dont have an account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-red-800 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                >
                  Sign up here
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
