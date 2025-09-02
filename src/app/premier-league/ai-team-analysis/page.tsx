"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { FaWandMagicSparkles, FaGoogle, FaEnvelope } from "react-icons/fa6";
import { HiChatBubbleLeftEllipsis, HiKey } from "react-icons/hi2";
import { BiSend, BiUserPlus } from "react-icons/bi";
import { FaUser } from "react-icons/fa";
import { SiCodemagic } from "react-icons/si";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import LoadingCard from "@/components/shared/LoadingCard";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Usage {
  remaining: number;
  total: number;
  resetDate: string;
  resetDateFormatted: string;
}

export default function AITeamAnalysis() {
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const { t, ready, i18n } = useTranslation("ai");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [userApiKey, setUserApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [usageLoading, setUsageLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  // Auto scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Check if user is authenticated and fetch usage information
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchUsage();
    } else if (status === "unauthenticated") {
      setUsageLoading(false);
      setAuthRequired(true);
    }
  }, [status, session]);

  const fetchUsage = async () => {
    try {
      setUsageLoading(true);
      const response = await fetch("/api/user/usage");
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
        setAuthRequired(false);
      } else if (response.status === 401) {
        setAuthRequired(true);
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
      setAuthRequired(true);
    } finally {
      setUsageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Show confirmation modal
    setPendingMessage(input.trim());
    setShowConfirmModal(true);
  };

  const confirmAndSend = async () => {
    setShowConfirmModal(false);

    const userMessage: Message = {
      role: "user",
      content: pendingMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: pendingMessage,
          userApiKey: userApiKey || undefined,
          chatHistory: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && data.requiresAuth) {
          // Authentication required
          setAuthRequired(true);
          const errorMessage: Message = {
            role: "assistant",
            content: data.message || t("authenticationRequired"),
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          return;
        }

        if (response.status === 429) {
          // Rate limit exceeded
          const errorMessage: Message = {
            role: "assistant",
            content: data.message || t("rateLimitMessage"),
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          if (data.requiresAuth) {
            setAuthRequired(true);
          }
          fetchUsage(); // Refresh usage info
          return;
        }
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Refresh usage if using free tier
      if (!userApiKey) {
        fetchUsage();
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: t("errorMessage"),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setPendingMessage("");
    }
  };

  if (!ready || status === "loading") {
    return (
      <main className="w-full min-h-screen overflow-x-hidden bg-theme-background">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingCard
            title={t("loadingTitle")}
            description={t("loadingDescription")}
            className="w-full max-w-md mx-auto"
          />
        </div>
      </main>
    );
  }

  // Show authentication required screen
  if (authRequired && !userApiKey) {
    return (
      <main className="w-full min-h-screen overflow-x-hidden bg-theme-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FaWandMagicSparkles className="w-8 h-8 text-purple-500" />
              <h1
                className={`text-3xl md:text-4xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-800"
                }`}
              >
                {t("title")}
              </h1>
            </div>
            <p
              className={`text-lg ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {t("subtitle")}
            </p>
          </div>

          {/* Authentication Required Card */}
          <div
            className={`max-w-md mx-auto p-8 rounded-xl border ${
              theme === "dark"
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white/50 border-gray-200"
            } text-center`}
          >
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900 mb-6">
              <BiUserPlus className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>

            <h3
              className={`text-xl font-bold mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {t("authenticationRequired")}
            </h3>

            <p
              className={`text-sm mb-6 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {t("signInToAccess")}
            </p>

            <div className="space-y-3">
              {/* Google Sign In */}
              <button
                onClick={() =>
                  signIn("google", {
                    callbackUrl: "/premier-league/ai-team-analysis",
                  })
                }
                className={`w-full flex items-center justify-center gap-3 px-4 py-3 border ${
                  theme === "dark"
                    ? "border-gray-700 hover:bg-gray-800"
                    : "border-gray-300 hover:bg-gray-50"
                } rounded-lg text-sm font-medium transition-colors`}
              >
                <FaGoogle className="text-red-500" />
                {t("signInWithGoogle")}
              </button>

              {/* Email Sign In */}
              <Link
                href="/login"
                className={`w-full flex items-center justify-center gap-3 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors`}
              >
                <FaEnvelope />
                {t("signInWithEmail")}
              </Link>

              {/* Sign Up */}
              <div
                className={`text-xs ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {t("dontHaveAccount")}{" "}
                <Link
                  href="/signup"
                  className="text-purple-600 hover:text-purple-500 font-medium"
                >
                  {t("createFreeAccount")}
                </Link>
              </div>
            </div>

            {/* Benefits */}
            <div
              className={`mt-6 pt-6 border-t ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <h4
                className={`text-sm font-medium mb-3 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {t("freeAccountIncludes")}
              </h4>
              <ul
                className={`text-xs space-y-1 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                <li>• {t("freeQueries")} AI questions per week</li>
                <li>• {t("personalizedAdvice")}</li>
                <li>• {t("realTimeData")}</li>
              </ul>
            </div>
          </div>

          {/* API Key Option */}
          <div
            className={`mt-6 p-4 rounded-lg border ${
              theme === "dark"
                ? "bg-gray-800/30 border-gray-700"
                : "bg-blue-50 border-blue-200"
            } max-w-md mx-auto`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HiKey className="w-4 h-4 text-purple-500" />
                <span
                  className={`text-sm font-medium ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {t("useOwnApiKey")}
                </span>
              </div>
              <button
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className="text-xs text-purple-500 hover:text-purple-600 transition-colors"
              >
                {showApiKeyInput ? t("hide") : t("show")}
              </button>
            </div>

            {showApiKeyInput && (
              <div className="space-y-2">
                <input
                  type="password"
                  placeholder={t("enterApiKey")}
                  value={userApiKey}
                  onChange={(e) => setUserApiKey(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
                <p
                  className={`text-xs ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {t("apiKeyDescription")}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen overflow-x-hidden bg-theme-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FaWandMagicSparkles className="w-8 h-8 text-purple-500" />
            <h1
              className={`text-3xl md:text-4xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}
            >
              {t("title")}
            </h1>
          </div>
          <p
            className={`text-lg ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {t("subtitle")}
          </p>
        </div>

        {/* Beautiful Usage Card */}
        {!userApiKey && (
          <div
            className={`mb-6 p-6 rounded-2xl backdrop-blur-lg border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
              theme === "dark"
                ? "bg-green-500/10 border-green-500/30 shadow-green-500/10"
                : "bg-green-50/80 border-green-200/50 shadow-green-200/20"
            } shadow-xl relative overflow-hidden`}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 via-emerald-500/5 to-green-600/10 animate-pulse opacity-50"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      theme === "dark" ? "bg-green-500/20" : "bg-green-100"
                    }`}
                  >
                    <HiChatBubbleLeftEllipsis className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <span
                      className={`font-bold text-lg ${
                        theme === "dark" ? "text-green-100" : "text-green-800"
                      }`}
                    >
                      {t("freeQuestions")}
                    </span>
                    <div
                      className={`text-sm ${
                        theme === "dark" ? "text-green-300" : "text-green-600"
                      }`}
                    >
                      {t("weeklyAllowance", "Weekly allowance")}
                    </div>
                  </div>
                </div>

                {usageLoading ? (
                  <div className="animate-pulse">
                    <div
                      className={`h-8 w-16 rounded-lg ${
                        theme === "dark" ? "bg-green-400/20" : "bg-green-200"
                      }`}
                    ></div>
                  </div>
                ) : usage ? (
                  <div className="text-right">
                    <div
                      className={`text-2xl font-black ${
                        usage.remaining > 0
                          ? theme === "dark"
                            ? "text-green-400"
                            : "text-green-600"
                          : theme === "dark"
                          ? "text-red-400"
                          : "text-red-500"
                      }`}
                    >
                      {usage.remaining}/{usage.total}
                    </div>
                    <div
                      className={`text-xs font-medium uppercase tracking-wide ${
                        usage.remaining > 0
                          ? theme === "dark"
                            ? "text-green-300"
                            : "text-green-500"
                          : theme === "dark"
                          ? "text-red-300"
                          : "text-red-400"
                      }`}
                    >
                      {t("remaining")}
                    </div>
                  </div>
                ) : null}
              </div>

              {usage && (
                <div
                  className={`p-3 rounded-xl backdrop-blur-sm ${
                    theme === "dark"
                      ? "bg-green-900/20 border border-green-500/20"
                      : "bg-white/60 border border-green-200/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        theme === "dark" ? "bg-green-400" : "bg-green-500"
                      } animate-pulse`}
                    ></div>
                    <p
                      className={`text-sm font-medium ${
                        theme === "dark" ? "text-green-200" : "text-green-700"
                      }`}
                    >
                      {t("resetsOn")} {usage.resetDateFormatted}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full animate-shimmer"></div>
          </div>
        )}

        {/* API Key Section */}
        <div
          className={`mb-6 p-4 rounded-lg border ${
            theme === "dark"
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white/50 border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HiKey className="w-5 h-5 text-purple-500" />
              <span
                className={`font-medium ${
                  theme === "dark" ? "text-white" : "text-gray-800"
                }`}
              >
                {t("useOwnApiKey")}
              </span>
            </div>
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="text-sm text-purple-500 hover:text-purple-600 transition-colors"
            >
              {showApiKeyInput ? t("hide") : t("show")}
            </button>
          </div>

          {showApiKeyInput && (
            <div className="space-y-2">
              <input
                type="password"
                placeholder={t("enterApiKey")}
                value={userApiKey}
                onChange={(e) => setUserApiKey(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
              <p
                className={`text-xs ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {t("apiKeyDescription")}
              </p>
            </div>
          )}
        </div>

        {/* Magical Chat Interface */}
        <motion.div
          className={`relative rounded-2xl border backdrop-blur-xl overflow-hidden shadow-2xl ${
            theme === "dark"
              ? "bg-gradient-to-br from-purple-900/20 via-gray-800/50 to-indigo-900/20 border-purple-500/30"
              : "bg-gradient-to-br from-purple-50/80 via-white/60 to-indigo-50/80 border-purple-200/50"
          }`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Magical Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 via-transparent to-indigo-400/5 animate-pulse"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-400/10 via-transparent to-transparent"></div>

          {/* Messages Container */}
          <div
            ref={chatContainerRef}
            className="h-96 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent"
          >
            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <SiCodemagic
                      className={`w-16 h-16 mx-auto mb-6 ${
                        theme === "dark" ? "text-purple-400" : "text-purple-500"
                      }`}
                    />
                  </motion.div>
                  <p
                    className={`text-xl font-medium ${
                      theme === "dark" ? "text-white" : "text-gray-800"
                    }`}
                  >
                    ✨ {t("readyToHelp")} ✨
                  </p>
                  <p
                    className={`text-sm mt-3 ${
                      theme === "dark" ? "text-purple-300" : "text-purple-600"
                    }`}
                  >
                    {t("askAboutStrategies")}
                  </p>
                </motion.div>
              ) : (
                messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={`flex gap-4 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <motion.div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg overflow-hidden ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-purple-500 to-purple-600"
                          : "bg-gradient-to-br from-indigo-500 to-purple-600"
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {message.role === "user" ? (
                        session?.user?.image ? (
                          <Image
                            src={session.user.image}
                            alt={session.user.name || "User"}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FaUser className="w-4 h-4 text-white" />
                        )
                      ) : (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <SiCodemagic className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                    <div
                      className={`flex-1 max-w-xs md:max-w-md lg:max-w-lg ${
                        message.role === "user" ? "text-right" : ""
                      }`}
                    >
                      <motion.div
                        className={`p-4 rounded-2xl shadow-lg backdrop-blur-sm border ${
                          message.role === "user"
                            ? theme === "dark"
                              ? "bg-gradient-to-br from-purple-600/90 to-purple-700/90 text-white border-purple-400/30"
                              : "bg-gradient-to-br from-purple-500/90 to-purple-600/90 text-white border-purple-300/30"
                            : theme === "dark"
                            ? "bg-gradient-to-br from-gray-800/90 to-gray-900/90 text-gray-100 border-purple-500/20"
                            : "bg-gradient-to-br from-white/90 to-gray-50/90 text-gray-900 border-purple-200/30"
                        }`}
                        initial={{
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        whileHover={{
                          scale: 1.02,
                          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                        }}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      </motion.div>
                      <p
                        className={`text-xs mt-2 ${
                          theme === "dark"
                            ? "text-purple-300/60"
                            : "text-purple-500/60"
                        } ${message.role === "user" ? "text-right" : ""}`}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>

            {/* Magical Typing Indicator */}
            {isLoading && (
              <motion.div
                className="flex gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <motion.div
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg"
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(139, 92, 246, 0.4)",
                      "0 0 0 10px rgba(139, 92, 246, 0)",
                      "0 0 0 0 rgba(139, 92, 246, 0.4)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <SiCodemagic className="w-4 h-4 text-white" />
                  </motion.div>
                </motion.div>
                <div className="flex-1">
                  <motion.div
                    className={`p-4 rounded-2xl backdrop-blur-sm border shadow-lg ${
                      theme === "dark"
                        ? "bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-purple-500/20"
                        : "bg-gradient-to-br from-white/90 to-gray-50/90 border-purple-200/30"
                    }`}
                    animate={{
                      background:
                        theme === "dark"
                          ? [
                              "linear-gradient(to bottom right, rgba(31, 41, 55, 0.9), rgba(17, 24, 39, 0.9))",
                              "linear-gradient(to bottom right, rgba(139, 92, 246, 0.1), rgba(31, 41, 55, 0.9))",
                              "linear-gradient(to bottom right, rgba(31, 41, 55, 0.9), rgba(17, 24, 39, 0.9))",
                            ]
                          : [
                              "linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(249, 250, 251, 0.9))",
                              "linear-gradient(to bottom right, rgba(139, 92, 246, 0.1), rgba(255, 255, 255, 0.9))",
                              "linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(249, 250, 251, 0.9))",
                            ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="flex gap-2 items-center">
                      <motion.div
                        className="w-2 h-2 bg-purple-500 rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-purple-500 rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: 0.2,
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-purple-500 rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: 0.4,
                        }}
                      />
                      <span
                        className={`text-sm ml-2 font-medium ${
                          theme === "dark"
                            ? "text-purple-300"
                            : "text-purple-600"
                        }`}
                      >
                        {t("analyzing", "Analiziram...")}
                      </span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Magical Input Form */}
          <motion.form
            onSubmit={handleSubmit}
            className={`p-6 border-t backdrop-blur-sm ${
              theme === "dark"
                ? "border-purple-500/30 bg-gray-900/20"
                : "border-purple-200/50 bg-white/20"
            }`}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex gap-3">
              <motion.input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about FPL players, transfers, captains..."
                disabled={isLoading}
                className={`flex-1 px-5 py-3 rounded-full border backdrop-blur-sm shadow-lg ${
                  theme === "dark"
                    ? "bg-gray-800/50 border-purple-500/30 text-white placeholder-gray-400"
                    : "bg-white/60 border-purple-300/50 text-gray-900 placeholder-gray-500"
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300`}
                whileFocus={{
                  scale: 1.02,
                  boxShadow: "0 0 30px rgba(139, 92, 246, 0.3)",
                }}
              />
              <motion.button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-full transition-all duration-300 flex items-center gap-2 shadow-lg"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 20px rgba(139, 92, 246, 0.3)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={isLoading ? { rotate: 360 } : {}}
                  transition={{
                    duration: 1,
                    repeat: isLoading ? Infinity : 0,
                    ease: "linear",
                  }}
                >
                  {isLoading ? (
                    <SiCodemagic className="w-4 h-4" />
                  ) : (
                    <BiSend className="w-4 h-4" />
                  )}
                </motion.div>
                {isLoading ? t("analyzing", "Analiziram...") : t("send")}
              </motion.button>
            </div>
          </motion.form>
        </motion.div>

        {/* Tips */}
        <div
          className={`mt-6 p-4 rounded-lg ${
            theme === "dark"
              ? "bg-blue-900/20 border border-blue-800/50"
              : "bg-blue-50 border border-blue-200"
          }`}
        >
          <h3
            className={`font-medium mb-2 ${
              theme === "dark" ? "text-blue-400" : "text-blue-800"
            }`}
          >
            {t("exampleQuestionsTitle")}
          </h3>
          <ul
            className={`text-sm space-y-1 ${
              theme === "dark" ? "text-blue-300" : "text-blue-700"
            }`}
          >
            <li>• {t("exampleQuestions.0")}</li>
            <li>• {t("exampleQuestions.1")}</li>
            <li>• {t("exampleQuestions.2")}</li>
            <li>• {t("exampleQuestions.3")}</li>
            <li>• {t("exampleQuestions.4")}</li>
          </ul>
        </div>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {showConfirmModal && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
            >
              <motion.div
                className={`max-w-md w-full rounded-2xl border shadow-2xl p-6 ${
                  theme === "dark"
                    ? "bg-gray-900 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/50 mb-4">
                    <HiChatBubbleLeftEllipsis className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  </div>

                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {t(
                      "confirmQuestion",
                      ready && i18n.language === "bs"
                        ? "Potvrdi pitanje"
                        : "Confirm Question"
                    )}
                  </h3>

                  <p
                    className={`text-sm mb-4 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {t(
                      "confirmDescription",
                      ready && i18n.language === "bs"
                        ? "Da li si siguran da je tvoje pitanje vezano za Fantasy Premier League sezonu 2025/26?"
                        : "Are you sure your question is related to Fantasy Premier League season 2025/26?"
                    )}
                  </p>

                  <div
                    className={`p-3 rounded-lg border-2 border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 mb-4`}
                  >
                    <p
                      className={`text-xs font-medium text-yellow-800 dark:text-yellow-200`}
                    >
                      ⚠️{" "}
                      {t(
                        "warningMessage",
                        ready && i18n.language === "bs"
                          ? "Upozorenje: Ako pitanje nije vezano za Fantasy, izgubit ćeš besplatne tokene a nećeš dobiti odgovor vezan za Fantasy od našeg FPL Guru-a. On samo odgovara na pitanja vezana za FPL sezonu 2025/26."
                          : "Warning: If your question is not Fantasy-related, you'll lose free tokens without getting a Fantasy-related answer from our FPL Guru. He only answers questions about FPL season 2025/26."
                      )}
                    </p>
                  </div>

                  <div
                    className={`text-xs p-2 rounded bg-gray-100 dark:bg-gray-800 mb-4`}
                  >
                    <strong>
                      {ready && i18n.language === "bs"
                        ? "Tvoje pitanje:"
                        : "Your question:"}
                    </strong>
                    <p
                      className={`mt-1 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      &ldquo;{pendingMessage}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setShowConfirmModal(false)}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      theme === "dark"
                        ? "border-gray-600 hover:bg-gray-800 text-gray-300"
                        : "border-gray-300 hover:bg-gray-50 text-gray-700"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {t(
                      "cancel",
                      ready && i18n.language === "bs" ? "Otkaži" : "Cancel"
                    )}
                  </motion.button>

                  <motion.button
                    onClick={confirmAndSend}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {t(
                      "confirm",
                      ready && i18n.language === "bs"
                        ? "Potvrdi & Pošalji"
                        : "Confirm & Send"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
