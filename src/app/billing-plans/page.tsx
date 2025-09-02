"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import {
  FaRobot,
  FaCheck,
  FaCreditCard,
  FaSpinner,
  FaStar,
  FaGift,
  FaRocket,
  FaExchangeAlt,
} from "react-icons/fa";
import { BiDiamond } from "react-icons/bi";
import { MdPayment, MdAnalytics } from "react-icons/md";
import { RiVipCrownFill } from "react-icons/ri";
import { HiSparkles } from "react-icons/hi";
import LoadingCard from "@/components/shared/LoadingCard";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_eur: number;
  ai_queries_limit: number;
  billing_interval: string;
  is_active: boolean;
  created_at: string;
}

interface BillingPlansResponse {
  plans: SubscriptionPlan[];
  currentPlanId?: string;
}

export default function BillingPlansPage() {
  const { data: session, status } = useSession();
  const [showLoginRedirect, setShowLoginRedirect] = useState(false);
  const { theme } = useTheme();
  const { t, ready } = useTranslation("billing");
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch("/api/billing/plans");
      if (response.ok) {
        const data: BillingPlansResponse = await response.json();
        setPlans(data.plans);
        setCurrentPlanId(data.currentPlanId || null);
      } else {
        setError(t("failedToLoadPlans", "Failed to load subscription plans"));
      }
    } catch (_error) {
      setError(t("failedToLoadPlans", "Failed to load subscription plans"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (status === "unauthenticated") {
      setShowLoginRedirect(true);
    } else if (status === "authenticated" && session?.user) {
      fetchPlans();
    }
  }, [status, session, fetchPlans]);

  const handleSelectPlan = async (planId: string) => {
    if (processingPlanId || planId === currentPlanId) return;

    setProcessingPlanId(planId);

    try {
      const response = await fetch("/api/billing/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          paymentMethod: "stripe",
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Payment successful - refresh page or redirect
        await fetchPlans();
      } else {
        // Show the logged message for now
        alert(
          data.message ||
            t(
              "paymentProcessingError",
              "Payment processing error. Please try again."
            )
        );
      }
    } catch (_error) {
      alert(
        t(
          "paymentProcessingError",
          "Payment processing error. Please try again."
        )
      );
    } finally {
      setProcessingPlanId(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes("free")) return <FaGift />;
    if (name.includes("starter")) return <HiSparkles />;
    if (name.includes("premium")) return <RiVipCrownFill />;
    if (name.includes("pro")) return <FaRocket />;
    if (name.includes("enterprise") || name.includes("ultimate"))
      return <BiDiamond />;
    return <MdPayment />;
  };

  const getPlanFeatures = (planName: string, aiLimit: number) => {
    const name = planName.toLowerCase();
    const baseFeatures = [
      {
        icon: <FaRobot className="w-3 h-3 text-white" />,
        title:
          aiLimit === -1
            ? t("unlimitedQueries", "Unlimited AI Queries")
            : t("aiQueriesLimit", "{{count}} AI Queries", { count: aiLimit }),
        subtitle: t("perWeek", "per week"),
        bgColor: "bg-purple-500",
      },
      {
        icon: <FaCheck className="w-3 h-3 text-white" />,
        title: t("allFeatures", "All Core Features"),
        subtitle: t("fullAccess", "Complete platform access"),
        bgColor: "bg-green-500",
      },
      {
        icon: <FaStar className="w-3 h-3 text-white" />,
        title: name.includes("free")
          ? t("emailSupport", "Email Support")
          : t("prioritySupport", "Priority Support"),
        subtitle: name.includes("free")
          ? t("basicHelp", "Get help when needed")
          : t("fastResponse", "Quick response time"),
        bgColor: "bg-blue-500",
      },
    ];

    if (name.includes("pro")) {
      baseFeatures.push({
        icon: <MdAnalytics className="w-3 h-3 text-white" />,
        title: t("advancedAnalytics", "Advanced Analytics"),
        subtitle: t("detailedInsights", "Player performance insights"),
        bgColor: "bg-orange-500",
      });
    }

    if (name.includes("premium")) {
      baseFeatures.push({
        icon: <FaExchangeAlt className="w-3 h-3 text-white" />,
        title: t("transferPlanning", "Transfer Planning"),
        subtitle: t("optimizedTransfers", "AI-powered transfer optimization"),
        bgColor: "bg-purple-600",
      });
    }

    return baseFeatures;
  };

  const isPopularPlan = (planName: string) => {
    return planName.toLowerCase().includes("pro");
  };

  const sortPlans = (plans: SubscriptionPlan[]) => {
    // Sort: Free first, then by price ascending
    return plans.sort((a, b) => {
      if (a.price_eur === 0) return -1;
      if (b.price_eur === 0) return 1;
      return a.price_eur - b.price_eur;
    });
  };

  if (!ready || status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-background">
        <LoadingCard
          title={t("loadingPlans", "Loading Plans")}
          description={t(
            "loadingDescription",
            "Getting available subscription plans..."
          )}
          className="w-full max-w-md mx-auto"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-background">
        <div
          className={`text-center p-8 rounded-xl border ${
            theme === "dark"
              ? "bg-gray-800/50 border-gray-700 text-white"
              : "bg-white/50 border-gray-200 text-gray-900"
          }`}
        >
          <h2 className="text-xl font-bold mb-4">
            {t("errorTitle", "Error Loading Plans")}
          </h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => {
              setError("");
              setIsLoading(true);
              fetchPlans();
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            {t("tryAgain", "Try Again")}
          </button>
        </div>
      </div>
    );
  }

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

  const sortedPlans = sortPlans(plans);

  return (
    <div className="min-h-screen bg-theme-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className={`text-3xl md:text-4xl font-bold mb-4 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {t("billingPlans", "Choose Your Plan")}
          </h1>
          <p
            className={`text-base md:text-lg ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            } max-w-2xl mx-auto`}
          >
            {t(
              "choosePlanDescription",
              "Unlock the full potential of your FPL journey with our AI-powered insights"
            )}
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
          {sortedPlans.map((plan, index) => {
            const isCurrentPlan = plan.id === currentPlanId;
            const isProcessing = processingPlanId === plan.id;
            const isFree = plan.price_eur === 0;
            const isPro = isPopularPlan(plan.name);

            return (
              <div
                key={plan.id}
                className={`relative group transition-all duration-500 ${
                  index === 0 && isFree ? "xl:col-start-1" : ""
                } ${isPro ? "xl:scale-105" : ""}`}
              >
                {/* Card Container */}
                <div
                  className={`relative h-full rounded-2xl overflow-hidden transition-all duration-500 ${
                    theme === "dark"
                      ? "bg-gray-900/95 border border-gray-700/50"
                      : "bg-white border border-gray-200"
                  } shadow-lg hover:shadow-xl group-hover:scale-105`}
                >
                  {/* Current Plan Badge - Top of card */}
                  {isCurrentPlan && (
                    <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center py-2 text-sm font-semibold z-10">
                      <FaCheck className="inline w-4 h-4 mr-1" />
                      {t("currentPlan", "Current Plan")}
                    </div>
                  )}

                  {/* Popular Plan Badge */}
                  {isPro && (
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 text-center pt-5">
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-1.5 rounded-full text-xs font-bold shadow-lg">
                        {t("mostPopular", "MOST POPULAR")}
                      </div>
                    </div>
                  )}

                  {/* Gradient Background for Pro */}
                  {isPro && (
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 pointer-events-none" />
                  )}

                  <div
                    className={`p-6 h-full flex flex-col ${
                      isCurrentPlan ? "pt-14" : "pt-8"
                    }`}
                  >
                    {/* Plan Header */}
                    <div className="text-center mb-6">
                      {/* Icon */}
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4 ${
                          isFree
                            ? "bg-green-100 text-green-600"
                            : plan.name.toLowerCase().includes("starter")
                            ? "bg-blue-100 text-blue-600"
                            : isPro
                            ? "bg-orange-100 text-orange-600"
                            : "bg-purple-100 text-purple-600"
                        } ${theme === "dark" ? "bg-opacity-20" : ""}`}
                      >
                        <div className="text-2xl">{getPlanIcon(plan.name)}</div>
                      </div>

                      <h3
                        className={`text-xl font-bold mb-2 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {plan.name}
                      </h3>

                      <p
                        className={`text-sm mb-4 ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {plan.description}
                      </p>

                      {/* Price */}
                      <div className="mb-4">
                        <div
                          className={`text-3xl font-bold ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {isFree ? (
                            <span className="text-green-500">FREE</span>
                          ) : (
                            <>
                              <span className="text-lg">€</span>
                              <span>{plan.price_eur}</span>
                            </>
                          )}
                        </div>
                        {!isFree && (
                          <div
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            per month
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-4 mb-6 flex-1">
                      {getPlanFeatures(plan.name, plan.ai_queries_limit).map(
                        (feature, idx) => (
                          <div key={idx} className="flex items-start space-x-3">
                            <div
                              className={`flex-shrink-0 w-6 h-6 rounded-full ${feature.bgColor} flex items-center justify-center mt-0.5`}
                            >
                              {feature.icon}
                            </div>
                            <div>
                              <div
                                className={`text-sm font-semibold ${
                                  theme === "dark"
                                    ? "text-white"
                                    : "text-gray-900"
                                }`}
                              >
                                {feature.title}
                              </div>
                              <div
                                className={`text-xs ${
                                  theme === "dark"
                                    ? "text-gray-400"
                                    : "text-gray-500"
                                }`}
                              >
                                {feature.subtitle}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isCurrentPlan || isProcessing || !isFree}
                      className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center ${
                        isCurrentPlan
                          ? "bg-green-500 text-white cursor-not-allowed"
                          : isProcessing
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : !isFree
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : isPro
                          ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white transform hover:scale-105 shadow-lg"
                          : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transform hover:scale-105 shadow-lg"
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                          {t("processing", "Processing...")}
                        </>
                      ) : isCurrentPlan ? (
                        <>
                          <FaCheck className="w-4 h-4 mr-2" />
                          {t("active", "Active")}
                        </>
                      ) : (
                        <>
                          <FaCreditCard className="w-4 h-4 mr-2" />
                          {isFree
                            ? t("getStarted", "Get Started")
                            : t("comingSoon", "Coming Soon")}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div
          className={`text-center mt-12 p-6 rounded-2xl ${
            theme === "dark"
              ? "bg-gray-800/50 border border-gray-700"
              : "bg-gray-50 border border-gray-200"
          }`}
        >
          <h3
            className={`text-lg font-bold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {t("needHelp", "Need help choosing?")}
          </h3>
          <p
            className={`text-sm mb-4 ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {t(
              "helpDescription",
              "Contact our support team for personalized recommendations"
            )}
          </p>
          <a
            href="mailto:support@remis-fantasy.com"
            className="inline-flex items-center px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            {t("contactSupport", "Contact Support")}
          </a>
        </div>
      </div>
    </div>
  );
}
