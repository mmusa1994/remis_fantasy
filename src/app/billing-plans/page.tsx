"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { 
  FaRobot, 
  FaCheck, 
  FaCreditCard, 
  FaSpinner,
  FaStar,
  FaGift,
  FaRocket
} from "react-icons/fa";
import { BiDiamond } from "react-icons/bi";
import { MdPayment } from "react-icons/md";
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
  const router = useRouter();
  const { theme } = useTheme();
  const { t, ready } = useTranslation('billing');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/plans');
      if (response.ok) {
        const data: BillingPlansResponse = await response.json();
        setPlans(data.plans);
        setCurrentPlanId(data.currentPlanId || null);
      } else {
        setError(t('failedToLoadPlans', 'Failed to load subscription plans'));
      }
    } catch (_error) {
      setError(t('failedToLoadPlans', 'Failed to load subscription plans'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user) {
      fetchPlans();
    }
  }, [status, session, router, fetchPlans]);

  const handleSelectPlan = async (planId: string) => {
    if (processingPlanId || planId === currentPlanId) return;
    
    setProcessingPlanId(planId);
    
    try {
      const response = await fetch('/api/billing/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          paymentMethod: 'stripe'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Payment successful - refresh page or redirect
        await fetchPlans();
      } else {
        // Show the logged message for now
        alert(data.message || t('paymentProcessingError', 'Payment processing error. Please try again.'));
      }
    } catch (_error) {
      alert(t('paymentProcessingError', 'Payment processing error. Please try again.'));
    } finally {
      setProcessingPlanId(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('free')) return <FaGift />;
    if (name.includes('basic')) return <HiSparkles />;
    if (name.includes('premium')) return <RiVipCrownFill />;
    if (name.includes('pro')) return <FaRocket />;
    if (name.includes('enterprise') || name.includes('ultimate')) return <BiDiamond />;
    return <MdPayment />; // Default card/payment icon
  };

  const getPlanColor = (planName: string, isCurrentPlan: boolean) => {
    const name = planName.toLowerCase();
    if (isCurrentPlan) return 'border-green-500';
    if (name.includes('free') || name.includes('basic')) return 'border-blue-200 dark:border-blue-800';
    if (name.includes('premium') || name.includes('pro')) return 'border-purple-200 dark:border-purple-800';
    if (name.includes('enterprise') || name.includes('ultimate')) return 'border-yellow-200 dark:border-yellow-800';
    return 'border-gray-200 dark:border-gray-700';
  };

  const getPlanGradient = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('free') || name.includes('basic')) return 'from-blue-500/10 to-blue-600/5';
    if (name.includes('premium') || name.includes('pro')) return 'from-purple-500/10 to-purple-600/5';
    if (name.includes('enterprise') || name.includes('ultimate')) return 'from-yellow-500/10 to-yellow-600/5';
    return 'from-gray-500/10 to-gray-600/5';
  };

  if (!ready || status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-background">
        <LoadingCard
          title={t('loadingPlans', 'Loading Plans')}
          description={t('loadingDescription', 'Getting available subscription plans...')}
          className="w-full max-w-md mx-auto"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-background">
        <div className={`text-center p-8 rounded-xl border ${
          theme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-white/50 border-gray-200 text-gray-900'
        }`}>
          <h2 className="text-xl font-bold mb-4">{t('errorTitle', 'Error Loading Plans')}</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => {
              setError("");
              setIsLoading(true);
              fetchPlans();
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            {t('tryAgain', 'Try Again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-2xl md:text-3xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {t('billingPlans', 'Billing Plans')}
          </h1>
          <p className={`text-sm md:text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} max-w-xl mx-auto`}>
            {t('choosePlanDescription', 'Choose the perfect plan for your fantasy sports journey. Upgrade or downgrade at any time.')}
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlanId;
            const isProcessing = processingPlanId === plan.id;
            const isFree = plan.price_eur === 0;
            
            return (
              <div
                key={plan.id}
                className={`relative group overflow-hidden transition-all duration-500 ${
                  isCurrentPlan ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-transparent' : ''
                }`}
              >
                {/* Enhanced Card Container */}
                <div className={`relative h-full rounded-3xl border backdrop-blur-lg transition-all duration-500 transform group-hover:scale-105 group-hover:shadow-2xl ${
                  getPlanColor(plan.name, isCurrentPlan)
                } ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-br from-gray-800/90 via-gray-800/95 to-gray-900/90 border-gray-700/50' 
                    : 'bg-gradient-to-br from-white/90 via-white/95 to-gray-50/90 border-gray-200/50'
                } shadow-xl group-hover:shadow-purple-500/20`}>
                
                  {/* Animated Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${getPlanGradient(plan.name)} opacity-30 group-hover:opacity-50 transition-opacity duration-500 rounded-3xl`} />
                  
                  {/* Premium Plan Highlight */}
                  {plan.name.toLowerCase().includes('premium') && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-gradient-to-r from-purple-600 to-purple-400 text-white px-6 py-1 rounded-full text-xs font-bold shadow-lg">
                        {t('mostPopular', 'MOST POPULAR')}
                      </div>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute top-6 right-6 z-10">
                      <div className="flex items-center space-x-2 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                        <FaCheck className="w-3 h-3" />
                        <span>{t('currentPlan', 'Current Plan')}</span>
                      </div>
                    </div>
                  )}

                  <div className="relative z-10 p-6 sm:p-8 h-full flex flex-col">
                    {/* Plan Header */}
                    <div className="text-center mb-8">
                      {/* Icon with animated background */}
                      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 relative overflow-hidden ${
                        theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100/50'
                      }`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 animate-pulse"></div>
                        <div className={`relative text-3xl ${
                          plan.name.toLowerCase().includes('free') ? 'text-green-500' :
                          plan.name.toLowerCase().includes('basic') ? 'text-blue-500' :
                          plan.name.toLowerCase().includes('premium') ? 'text-purple-500' :
                          plan.name.toLowerCase().includes('pro') ? 'text-red-500' :
                          'text-gray-500'
                        }`}>
                          {getPlanIcon(plan.name)}
                        </div>
                      </div>
                      
                      <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {plan.name}
                      </h3>
                      
                      {/* Price Display */}
                      <div className="mb-3">
                        <div className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {isFree ? (
                            <span className="text-green-500">{t('free', 'FREE')}</span>
                          ) : (
                            <>
                              <span className="text-lg">€</span>
                              <span>{plan.price_eur}</span>
                            </>
                          )}
                        </div>
                        {!isFree && (
                          <div className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t('per', 'per')} {plan.billing_interval === 'monthly' ? t('month', 'month') : plan.billing_interval === 'weekly' ? t('week', 'week') : t('year', 'year')}
                          </div>
                        )}
                      </div>

                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {plan.description || t('planDescription', 'Perfect plan for your needs')}
                      </p>
                    </div>

                    {/* Features List - Enhanced */}
                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center mt-0.5">
                          <FaRobot className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {plan.ai_queries_limit === -1 
                              ? t('unlimitedQueries', 'Unlimited AI Queries')
                              : t('aiQueriesLimit', '{{count}} AI Queries', { count: plan.ai_queries_limit })
                            }
                          </div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {plan.billing_interval === 'weekly' 
                              ? t('perWeek', 'per week')
                              : plan.billing_interval === 'monthly'
                              ? t('perMonth', 'per month')  
                              : t('perYear', 'per year')
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                          <FaCheck className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {t('allFeatures', 'All Core Features')}
                          </div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t('fullAccess', 'Complete platform access')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                          <FaStar className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {isFree ? t('emailSupport', 'Email Support') : t('prioritySupport', 'Priority Support')}
                          </div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {isFree ? t('basicHelp', 'Get help when needed') : t('fastResponse', 'Quick response time')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Action Button */}
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isCurrentPlan || isProcessing}
                      className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center shadow-lg relative overflow-hidden group/button ${
                        isCurrentPlan
                          ? 'bg-green-500 text-white cursor-not-allowed shadow-green-200'
                          : isProcessing
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : isFree
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-blue-200 hover:shadow-blue-300'
                          : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-purple-200 hover:shadow-purple-300'
                      } hover:shadow-xl transform hover:scale-105`}
                    >
                      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover/button:translate-x-full transition-transform duration-1000"></div>
                      {isProcessing ? (
                        <>
                          <FaSpinner className="w-5 h-5 mr-2 animate-spin" />
                          {t('processing', 'Processing...')}
                        </>
                      ) : isCurrentPlan ? (
                        <>
                          <FaCheck className="w-5 h-5 mr-2" />
                          {t('currentPlan', 'Current Plan')}
                        </>
                      ) : (
                        <>
                          <FaCreditCard className="w-5 h-5 mr-2" />
                          {isFree ? t('selectPlan', 'Get Started') : t('upgrade', 'Upgrade Now')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Footer Note */}
        <div className={`text-center mt-16 p-8 rounded-3xl border backdrop-blur-lg relative overflow-hidden ${
          theme === 'dark' 
            ? 'bg-gradient-to-r from-gray-800/50 via-gray-800/60 to-gray-800/50 border-gray-700/50' 
            : 'bg-gradient-to-r from-white/50 via-white/60 to-white/50 border-gray-200/50'
        } shadow-xl`}>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-50"></div>
          <div className="relative">
            <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('needHelp', 'Need help choosing a plan?')}
            </h3>
            <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('helpDescription', 'Our support team is here to help you find the perfect plan for your fantasy journey.')}
            </p>
            <a 
              href="mailto:support@remis-fantasy.com" 
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t('contactSupport', 'Contact Support')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}