"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { safeLogout } from "@/lib/session-utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import {
  FaEnvelope,
  FaRobot,
  FaSignOutAlt,
  FaGoogle,
  FaCheckCircle,
  FaCreditCard,
  FaHistory,
} from "react-icons/fa";
import { BiEdit, BiSave, BiX } from "react-icons/bi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { TbTaxEuro } from "react-icons/tb";
import LoadingCard from "@/components/shared/LoadingCard";
import PhotoUpload from "@/components/shared/PhotoUpload";

interface Usage {
  remaining: number;
  total: number;
  used: number;
  resetDate: string;
  resetDateFormatted: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  provider: string;
  email_verified: boolean;
  created_at: string;
  subscription?: {
    plan: {
      name: string;
      price_eur: number;
      ai_queries_limit: number;
    };
    status: string;
  };
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const { theme } = useTheme();
  const { t, ready } = useTranslation("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showLoginRedirect, setShowLoginRedirect] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      setShowLoginRedirect(true);
    } else if (status === "authenticated" && session?.user) {
      fetchProfile();
      fetchUsage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditName(data.name);
      } else {
        console.error(
          "Profile API error:",
          response.status,
          response.statusText
        );
        if (response.status === 401) {
          setShowLoginRedirect(true);
        } else {
          setError(t("failedToLoadProfile"));
        }
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
      setError(t("failedToLoadProfile"));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsage = async () => {
    try {
      const response = await fetch("/api/user/usage");
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName.trim(),
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);

        // Update session
        await update({
          name: editName.trim(),
        });
      } else {
        const data = await response.json();
        setError(data.error || t("failedToUpdateProfile"));
      }
    } catch (error) {
      setError(t("failedToUpdateProfile"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await safeLogout("/");
  };

  const handlePhotoUpdate = async (photoUrl: string | null) => {
    setProfile((prev) =>
      prev ? { ...prev, avatar_url: photoUrl || undefined } : null
    );
    
    // Force refresh session to get updated avatar from database
    await update();
  };

  if (showLoginRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-800 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p
            className={`mb-4 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Redirecting to login...
          </p>
          <Link
            href="/login"
            className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white px-6 py-2 rounded-lg transition-all duration-300"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!ready || status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-theme-background py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingCard
            title={t("loadingProfile", "Loading Profile")}
            description={t(
              "loadingDescription",
              "Getting your profile information..."
            )}
            className="w-full max-w-md mx-auto"
          />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-background">
        <div
          className={`text-center p-8 rounded-xl ${
            theme === "dark"
              ? "bg-gray-800 text-white"
              : "bg-white text-gray-900"
          }`}
        >
          <h2 className="text-xl font-bold mb-4">{t("profileNotFound")}</h2>
          <Link href="/login" className="text-red-800 hover:text-red-700">
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className={`text-3xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {t("myProfile")}
          </h1>
          <p
            className={`mt-2 text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {t("manageAccountSettings")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div
              className={`rounded-xl border ${
                theme === "dark"
                  ? "bg-gray-800/50 border-gray-700"
                  : "bg-white/50 border-gray-200"
              } p-6`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2
                  className={`text-xl font-semibold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {t("profileInformation")}
                </h2>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  <FaSignOutAlt />
                  {t("signOut")}
                </button>
              </div>

              {/* Avatar and Basic Info */}
              <div className="flex items-start gap-6 mb-6">
                <div className="flex-shrink-0">
                  <PhotoUpload
                    currentPhotoUrl={profile.avatar_url}
                    onPhotoUpdate={handlePhotoUpdate}
                    className=""
                  />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Name */}
                  <div className="mb-4">
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {t("fullName")}
                    </label>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className={`flex-1 px-3 py-2 rounded-lg border ${
                            theme === "dark"
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:ring-2 focus:ring-red-800 focus:border-transparent`}
                        />
                        <button
                          onClick={handleSaveName}
                          disabled={isSaving || !editName.trim()}
                          className="p-2 text-green-600 hover:text-green-700 disabled:opacity-50"
                        >
                          {isSaving ? (
                            <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
                          ) : (
                            <BiSave className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditName(profile.name);
                            setError("");
                          }}
                          className="p-2 text-gray-600 hover:text-gray-700"
                        >
                          <BiX className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-lg ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {profile.name}
                        </span>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="p-2 text-gray-500 hover:text-gray-700"
                        >
                          <BiEdit className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="mb-4">
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {t("emailAddress")}
                    </label>
                    <div className="flex items-center gap-2">
                      <FaEnvelope
                        className={`w-4 h-4 ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      />
                      <span
                        className={
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }
                      >
                        {profile.email}
                      </span>
                      {profile.email_verified && (
                        <FaCheckCircle
                          className="w-4 h-4 text-green-500"
                          title={t("verified")}
                        />
                      )}
                    </div>
                  </div>

                  {/* Provider */}
                  <div className="mb-4">
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {t("signInMethod")}
                    </label>
                    <div className="flex items-center gap-2">
                      {profile.provider === "google" ? (
                        <>
                          <FaGoogle className="w-4 h-4 text-red-500" />
                          <span
                            className={
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }
                          >
                            Google
                          </span>
                        </>
                      ) : (
                        <>
                          <FaEnvelope
                            className={`w-4 h-4 ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          />
                          <span
                            className={
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }
                          >
                            {t("emailPassword")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Member Since */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {t("memberSince")}
                    </label>
                    <span
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {new Date(profile.created_at).toLocaleDateString(
                        "en-GB",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/50">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription Card */}
            <div
              className={`rounded-xl border ${
                theme === "dark"
                  ? "bg-gray-800/50 border-gray-700"
                  : "bg-white/50 border-gray-200"
              } p-6`}
            >
              <h3
                className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                <TbTaxEuro className="text-blue-500" />
                {t("subscription")}
              </h3>

              {profile.subscription ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {t("currentPlan")}
                    </span>
                    <span
                      className={`font-medium ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {profile.subscription.plan.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {t("price")}
                    </span>
                    <span
                      className={`font-medium ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {profile.subscription.plan.price_eur === 0
                        ? t("free")
                        : `€${profile.subscription.plan.price_eur}/month`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {t("status")}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        profile.subscription.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {profile.subscription.status}
                    </span>
                  </div>

                  {profile.subscription.plan.name === "Free" && (
                    <Link href="/billing-plans">
                      <button className="w-full mt-4 px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        <FaCreditCard />
                        {t("upgradeNow")}
                      </button>
                    </Link>
                  )}
                </div>
              ) : (
                <div>
                  <p
                    className={`text-sm mb-4 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {t("noActiveSubscription")}
                  </p>
                  <Link href="/billing-plans">
                    <button className="w-full px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                      <FaCreditCard />
                      {t("choosePlan")}
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Usage Card */}
            {usage && (
              <div
                className={`rounded-xl border ${
                  theme === "dark"
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
                } p-6`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  <FaRobot className="text-red-800" />
                  {t("aiUsage")}
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {t("thisWeek")}
                    </span>
                    <span
                      className={`font-medium ${
                        usage.remaining > 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {usage.remaining}/{usage.total}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div
                    className={`w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700`}
                  >
                    <div
                      className={`h-2 rounded-full transition-all ${
                        usage.remaining > 0 ? "bg-green-500" : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.max(
                          10,
                          (usage.remaining / usage.total) * 100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {t("resetsOn")}
                    </span>
                    <span
                      className={`text-xs ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {usage.resetDateFormatted}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div
              className={`rounded-xl border ${
                theme === "dark"
                  ? "bg-gray-800/50 border-gray-700"
                  : "bg-white/50 border-gray-200"
              } p-6`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {t("quickActions")}
              </h3>

              <div className="space-y-2">
                <Link
                  href="/premier-league/ai-team-analysis"
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border ${
                    theme === "dark"
                      ? "border-gray-700 hover:bg-gray-800"
                      : "border-gray-300 hover:bg-gray-50"
                  } text-sm transition-colors`}
                >
                  <FaRobot className="text-red-800" />
                  {t("useAiAnalysis")}
                </Link>

                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border ${
                    theme === "dark"
                      ? "border-gray-700 hover:bg-gray-800"
                      : "border-gray-300 hover:bg-gray-50"
                  } text-sm transition-colors`}
                  disabled
                >
                  <FaHistory
                    className={`${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                  {t("viewHistory")} ({t("comingSoon")})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
