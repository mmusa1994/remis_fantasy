"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
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
  FaHistory,
} from "react-icons/fa";
import { BiEdit, BiSave, BiX } from "react-icons/bi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { MdVerified, MdWarning } from "react-icons/md";
import { TbTaxEuro } from "react-icons/tb";
import LoadingCard from "@/components/shared/LoadingCard";
import PhotoUpload from "@/components/shared/PhotoUpload";
import Toast from "@/components/shared/Toast";

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
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showLoginRedirect, setShowLoginRedirect] = useState(false);
  
  // Manager ID states
  const [managerData, setManagerData] = useState<{
    managerId: string | null;
    isVerified: boolean;
    verificationNote: string | null;
  } | null>(null);
  const [isEditingManagerId, setIsEditingManagerId] = useState(false);
  const [editManagerId, setEditManagerId] = useState("");
  const [isSavingManagerId, setIsSavingManagerId] = useState(false);
  const [managerIdError, setManagerIdError] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Check if we should focus on manager ID section
  const shouldFocusManagerId = searchParams?.get('tab') === 'manager-id';

  useEffect(() => {
    if (status === "unauthenticated") {
      setShowLoginRedirect(true);
    } else if (status === "authenticated" && session?.user) {
      fetchProfile();
      fetchUsage();
      fetchManagerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

  // Auto-focus manager ID editing when coming from navbar
  useEffect(() => {
    if (shouldFocusManagerId && managerData !== null && !isEditingManagerId) {
      setIsEditingManagerId(true);
    }
  }, [shouldFocusManagerId, managerData, isEditingManagerId]);

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

  const fetchManagerData = async () => {
    try {
      const response = await fetch("/api/user/manager-id");
      if (response.ok) {
        const data = await response.json();
        if (!data.error) {
          setManagerData({
            managerId: data.managerId,
            isVerified: data.isVerified,
            verificationNote: data.verificationNote
          });
          setEditManagerId(data.managerId || "");
        }
      }
    } catch (error) {
      console.error("Failed to fetch manager data:", error);
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
    } catch {
      setError(t("failedToUpdateProfile"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveManagerId = async () => {
    if (!editManagerId.trim()) {
      setManagerIdError("Manager ID cannot be empty");
      return;
    }

    setIsSavingManagerId(true);
    setManagerIdError("");

    try {
      const response = await fetch("/api/user/manager-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          managerId: editManagerId.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setManagerData({
          managerId: data.managerId,
          isVerified: data.isVerified,
          verificationNote: data.verificationNote
        });
        setIsEditingManagerId(false);
        setManagerIdError("");
        
        // Show success toast
        const message = data.isVerified 
          ? "Manager ID successfully saved and verified!" 
          : "Manager ID saved! Verification may take a moment.";
        setSuccessMessage(message);
        setShowSuccessToast(true);
      } else {
        setManagerIdError(data.error || "Failed to update Manager ID");
      }
    } catch {
      setManagerIdError("Failed to update Manager ID");
    } finally {
      setIsSavingManagerId(false);
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
            className="bg-red-800 hover:bg-red-900 text-white px-6 py-2 rounded-md transition-all duration-300"
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
          className={`text-center p-8 rounded-lg ${
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
            className={`text-2xl font-bold ${
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
              className={`rounded-lg border ${
                theme === "dark"
                  ? "bg-gray-800/50 border-gray-700"
                  : "bg-white/50 border-gray-200"
              } p-6`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2
                  className={`text-xl font-semibold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {t("profileInformation")}
                </h2>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 transition-colors border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">{t("signOut")}</span>
                </button>
              </div>

              {/* Avatar and Basic Info */}
              <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
                <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-start">
                  <PhotoUpload
                    currentPhotoUrl={profile.avatar_url}
                    onPhotoUpdate={handlePhotoUpdate}
                    className=""
                  />
                </div>

                <div className="flex-1 min-w-0 w-full">
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
                          className={`text-lg break-words ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {profile.name}
                        </span>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="p-2 text-gray-500 hover:text-gray-700 flex-shrink-0 ml-2"
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
                    <div className="flex items-center gap-2 min-w-0">
                      <FaEnvelope
                        className={`w-4 h-4 flex-shrink-0 ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      />
                      <span
                        className={`break-all min-w-0 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {profile.email}
                      </span>
                      {profile.email_verified && (
                        <FaCheckCircle
                          className="w-4 h-4 text-green-500 flex-shrink-0"
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

                  {/* Manager ID */}
                  <div className="mb-4">
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      FPL Manager ID
                    </label>
                    {isEditingManagerId ? (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <input
                            type="text"
                            value={editManagerId}
                            onChange={(e) => setEditManagerId(e.target.value)}
                            placeholder="e.g., 123456"
                            className={`flex-1 min-w-0 px-3 py-2 rounded-lg border text-sm ${
                              theme === "dark"
                                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                            } focus:ring-2 focus:ring-red-800 focus:border-transparent`}
                          />
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={handleSaveManagerId}
                              disabled={isSavingManagerId || !editManagerId.trim()}
                              className="p-2 text-green-600 hover:text-green-700 disabled:opacity-50"
                              title="Save"
                            >
                              {isSavingManagerId ? (
                                <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
                              ) : (
                                <BiSave className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingManagerId(false);
                                setEditManagerId(managerData?.managerId || "");
                                setManagerIdError("");
                              }}
                              className="p-2 text-gray-600 hover:text-gray-700"
                              title="Cancel"
                            >
                              <BiX className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className={`text-xs leading-relaxed ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}>
                          Find your ID in your FPL URL:<br />
                          <span className="font-mono text-xs">fantasy.premierleague.com/entry/YOUR_ID/event/</span>
                        </p>
                        {managerIdError && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {managerIdError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`font-mono text-sm ${
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {managerData?.managerId || "Not set"}
                          </span>
                          {managerData?.managerId && (
                            <>
                              {managerData.isVerified ? (
                                <MdVerified className="w-4 h-4 text-green-500" title="Verified" />
                              ) : (
                                <MdWarning className="w-4 h-4 text-yellow-500" title="Not verified" />
                              )}
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => setIsEditingManagerId(true)}
                          className="p-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
                          title="Edit Manager ID"
                        >
                          <BiEdit className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {managerData?.verificationNote && !isEditingManagerId && (
                      <div className={`mt-2 p-2 rounded text-xs ${
                        theme === "dark" 
                          ? "bg-yellow-900/20 text-yellow-400" 
                          : "bg-yellow-50 text-yellow-700"
                      }`}>
                        {managerData.verificationNote}
                      </div>
                    )}
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
              className={`rounded-lg border ${
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
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        profile.subscription.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {profile.subscription.status}
                    </span>
                  </div>

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
                </div>
              )}
            </div>

            {/* Usage Card */}
            {usage && (
              <div
                className={`rounded-lg border ${
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
              className={`rounded-lg border ${
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
      
      {/* Success Toast */}
      <Toast
        show={showSuccessToast}
        message={successMessage}
        type="success"
        onClose={() => setShowSuccessToast(false)}
      />
    </div>
  );
}
