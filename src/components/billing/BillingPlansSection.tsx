"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
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

export default function BillingPlansSection() {
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const { t, ready } = useTranslation("billing");
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch("/api/billing/plans");
      if (response.ok) {
        const data: BillingPlansResponse = await response.json();
        setPlans(data.plans);
        setCurrentPlanId(data.currentPlanId || null);
      }
    } catch {
      // Silently fail for landing page
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Always fetch plans for public view; currentPlanId will be set only if authenticated
    fetchPlans();
  }, [fetchPlans]);

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

      if (data.success && data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        await fetchPlans();
      } else {
        alert(
          data.message ||
            t(
              "paymentProcessingError",
              "Payment processing error. Please try again."
            )
        );
      }
    } catch {
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
    return plans.sort((a, b) => {
      if (a.price_eur === 0) return -1;
      if (b.price_eur === 0) return 1;
      return a.price_eur - b.price_eur;
    });
  };

  const displayPlans = plans.length > 0 ? plans : [];
  const sortedPlans = sortPlans(displayPlans);

  if (isLoading) {
    return (
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50 relative">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            className={`text-4xl md:text-5xl font-black mb-6 ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            {t("billingPlans", "Choose Your Plan")}
          </h2>
          <p
            className={`text-xl leading-relaxed max-w-3xl mx-auto ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {t(
              "choosePlanDescription",
              "Unlock the full potential of your FPL journey with our AI-powered insights"
            )}
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-flow-cols-2 md:grid-cols-4  gap-6 max-w-8xl mx-auto mb-16">
          {sortedPlans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlanId;
            const isProcessing = processingPlanId === plan.id;
            const isFree = plan.price_eur === 0;
            const isPro = isPopularPlan(plan.name);

            return (
              <div
                key={plan.id}
                className={`relative group transition-all duration-500 ${
                  isPro ? "md:scale-105" : ""
                }`}
              >
                {/* Popular Plan Badge */}
                {isPro && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      {t("mostPopular", "Most Popular")}
                    </div>
                  </div>
                )}

                {/* Card Container */}
                <div
                  className={`relative h-full rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 ${
                    theme === "dark"
                      ? isPro
                        ? "bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-500/50"
                        : isFree
                        ? "bg-gray-800/50 border-gray-600/50"
                        : "bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border-yellow-500/50"
                      : isPro
                      ? "bg-gradient-to-br from-purple-100/70 to-purple-200/50 border-purple-300/50"
                      : isFree
                      ? "bg-white/80 border-gray-200/50"
                      : "bg-gradient-to-br from-yellow-100/70 to-yellow-200/50 border-yellow-300/50"
                  } shadow-2xl border-2`}
                >
                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center py-2 text-sm font-semibold z-10">
                      <FaCheck className="inline w-4 h-4 mr-1" />
                      {t("currentPlan", "Current Plan")}
                    </div>
                  )}

                  <div
                    className={`p-8 h-full flex flex-col ${
                      isCurrentPlan ? "pt-14" : ""
                    }`}
                  >
                    {/* Plan Header */}
                    <div className="text-center mb-6">
                      {/* Icon */}
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4 ${
                          isFree
                            ? "bg-green-100 text-green-600"
                            : isPro
                            ? "bg-purple-100 text-purple-600"
                            : "bg-yellow-100 text-yellow-600"
                        } ${theme === "dark" ? "bg-opacity-20" : ""}`}
                      >
                        <div className="text-2xl">{getPlanIcon(plan.name)}</div>
                      </div>

                      <h3
                        className={`text-2xl font-bold mb-2 ${
                          theme === "dark" ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {plan.name}
                      </h3>

                      <p
                        className={`text-sm mb-6 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {plan.description}
                      </p>

                      {/* Price */}
                      <div className="mb-6">
                        <div
                          className={`text-4xl font-black ${
                            theme === "dark" ? "text-white" : "text-gray-800"
                          }`}
                        >
                          {isFree ? (
                            <span className="text-green-500">FREE</span>
                          ) : (
                            <>
                              <span>€{plan.price_eur}</span>
                            </>
                          )}
                        </div>
                        {!isFree && (
                          <div
                            className={`text-lg ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            /{t("perMonth", "month")}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 mb-8 flex-1">
                      {getPlanFeatures(plan.name, plan.ai_queries_limit).map(
                        (feature, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <span className="text-green-500">✓</span>
                            <div>
                              <div
                                className={`font-medium ${
                                  theme === "dark"
                                    ? "text-gray-300"
                                    : "text-gray-600"
                                }`}
                              >
                                {feature.title}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => {
                        if (!session) {
                          window.location.href = "/login";
                        } else {
                          handleSelectPlan(plan.id);
                        }
                      }}
                      disabled={isCurrentPlan || isProcessing}
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                        isCurrentPlan
                          ? "bg-green-600 text-white cursor-not-allowed"
                          : isProcessing
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : isPro
                          ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-purple-500/25"
                          : isFree
                          ? "border-2 border-gray-300 text-gray-700 hover:bg-gray-100/50"
                          : "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-yellow-900 shadow-lg"
                      } ${
                        theme === "dark" &&
                        !isCurrentPlan &&
                        !isProcessing &&
                        isFree
                          ? "border-gray-600 text-gray-300 hover:bg-gray-700/50"
                          : ""
                      } disabled:bg-gray-400 disabled:text-white disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none disabled:hover:scale-100`}
                    >
                      {isProcessing ? (
                        <span className="flex items-center justify-center">
                          <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                          {t("processing", "Processing...")}
                        </span>
                      ) : isCurrentPlan ? (
                        <span className="flex items-center justify-center">
                          <FaCheck className="w-4 h-4 mr-2" />
                          {t("active", "Active")}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <FaCreditCard className="w-4 h-4 mr-2" />
                          {t("choosePlan", "Choose Plan")}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Money back guarantee */}
        <div className="text-center">
          <p
            className={`text-lg ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            💰 {t("moneyBackGuarantee", "30-day money-back guarantee")}
          </p>
        </div>
      </div>
    </section>
  );
}
