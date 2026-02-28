"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Activity,
  RefreshCw,
  BarChart3,
  Smartphone,
  Settings,
  Monitor,
  Sparkles,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import { FaRobot } from "react-icons/fa";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  initialStep?: number;
}

const OnboardingModal = ({
  isOpen,
  onClose,
  onComplete,
  initialStep = 0,
}: OnboardingModalProps) => {
  const { theme } = useTheme();
  const { t } = useTranslation("onboarding");
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [managerIdInput, setManagerIdInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const managerIdInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = 4;

  // Load existing Manager ID from database when modal opens
  useEffect(() => {
    const loadExistingManagerId = async () => {
      if (!isOpen) return;

      try {
        const response = await fetch("/api/user/manager-id");
        if (response.ok) {
          const data = await response.json();
          if (data.managerId) {
            setManagerIdInput(data.managerId);
          }
        }
      } catch (error) {
        console.error("Failed to load existing Manager ID:", error);
      }
    };

    loadExistingManagerId();
  }, [isOpen]);

  // Focus input when manager ID step is loaded
  useEffect(() => {
    if (currentStep === 1 && managerIdInputRef.current) {
      const timeoutId = setTimeout(() => {
        managerIdInputRef.current?.focus();
      }, 300); // Small delay to ensure animation is complete

      return () => clearTimeout(timeoutId);
    }
  }, [currentStep]);

  const handleManagerIdSave = async () => {
    if (!managerIdInput.trim()) {
      setError(t("managerIdStep.error"));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/user/manager-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          managerId: managerIdInput.trim(),
        }),
      });

      if (response.ok) {
        setCurrentStep(currentStep + 1);
      } else {
        const data = await response.json();
        setError(data.error || t("managerIdStep.error"));
      }
    } catch {
      setError(t("managerIdStep.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: true }),
      });

      if (!response.ok) {
        console.log("⚠️ Onboarding API failed, but continuing anyway");
      }

      // Always complete, regardless of API response
      onComplete();
    } catch (error) {
      console.error("Failed to mark onboarding as complete:", error);
      // Continue anyway - don't block user experience
      onComplete();
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    handleComplete();
  };

  const handleDontShowAgain = async () => {
    try {
      await fetch("/api/user/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: true }),
      });
      onComplete();
    } catch (error) {
      console.error("Error marking onboarding as completed:", error);
      onComplete(); // Still close modal even if API fails
    }
  };

  // Step components
  const WelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="relative">
        <div
          className={`w-52 h-48 mx-auto flex items-center justify-center border border-red-800 overflow-hidden`}
        >
          <Image
            src="/sc/fantasy_command_center.png"
            alt="REMIS Fantasy Logo"
            width={250}
            height={250}
            priority
          />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-md flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-yellow-900" />
        </div>
      </div>

      <div>
        <h2
          className={`text-2xl md:text-3xl font-bold mb-3 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          {t("welcome.title")}
        </h2>
        <p
          className={`text-lg mb-4 ${
            theme === "dark" ? "text-red-400" : "text-red-600"
          }`}
        >
          {t("welcome.subtitle")}
        </p>
        <p
          className={`text-sm leading-relaxed ${
            theme === "dark" ? "text-gray-300" : "text-gray-600"
          }`}
        >
          {t("welcome.description")}
        </p>
      </div>

      <button
        onClick={nextStep}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
          theme === "dark"
            ? "bg-red-700 hover:bg-red-600 text-white"
            : "bg-red-600 hover:bg-red-700 text-white"
        }`}
      >
        {t("welcome.getStarted")}
      </button>
    </div>
  );

  const ManagerIdStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className={`w-52 h-52 mx-auto flex items-center justify-center`}>
          <Image
            src="/images/path.png"
            alt="path"
            width={1000}
            height={1000}
            priority
          />
        </div>
        <h2
          className={`text-xl md:text-2xl font-bold mb-2 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          {t("managerIdStep.title")}
        </h2>
        <p
          className={`text-sm ${
            theme === "dark" ? "text-red-400" : "text-red-600"
          }`}
        >
          {t("managerIdStep.subtitle")}
        </p>
      </div>

      <div
        className={`p-4 rounded-lg ${
          theme === "dark"
            ? "bg-blue-900/20 border border-blue-800"
            : "bg-blue-50 border border-blue-200"
        }`}
      >
        <p
          className={`text-sm font-medium mb-2 ${
            theme === "dark" ? "text-blue-300" : "text-blue-800"
          }`}
        >
          {t("managerIdStep.whyNeeded")}
        </p>
        <p
          className={`text-xs ${
            theme === "dark" ? "text-blue-200" : "text-blue-700"
          }`}
        >
          {t("managerIdStep.whyDescription")}
        </p>
      </div>

      <div>
        <label
          className={`block text-sm font-medium mb-2 ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}
        >
          FPL Manager ID
        </label>
        <input
          ref={managerIdInputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={managerIdInput}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, ""); // Only allow numbers
            setManagerIdInput(value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && managerIdInput.trim()) {
              e.preventDefault();
              handleManagerIdSave();
            }
          }}
          onBlur={(e) => {
            // Prevent losing focus unless clicking on buttons
            const relatedTarget = e.relatedTarget as HTMLElement;
            if (relatedTarget && relatedTarget.tagName === "BUTTON") {
              return;
            }
            setTimeout(() => {
              if (currentStep === 1 && managerIdInputRef.current) {
                managerIdInputRef.current.focus();
              }
            }, 100);
          }}
          placeholder={t("managerIdStep.placeholder")}
          autoFocus
          autoComplete="off"
          className={`w-full px-4 py-3 rounded-lg border text-lg text-center font-mono transition-colors ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:bg-gray-750"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:bg-gray-50"
          } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
        />
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>

      <div
        className={`text-xs space-y-2 p-3 rounded-lg overflow-hidden ${
          theme === "dark"
            ? "bg-gray-800 border border-gray-700"
            : "bg-gray-50 border border-gray-200"
        }`}
      >
        <p
          className={`font-medium ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}
        >
          {t("managerIdStep.howToFind")}
        </p>
        <p
          className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
        >
          {t("managerIdStep.howToFindDescription")}
        </p>
        <p
          className={`font-mono text-xs break-all ${
            theme === "dark" ? "text-blue-400" : "text-blue-600"
          }`}
        >
          {t("managerIdStep.urlExample")}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setCurrentStep(currentStep + 1)}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            theme === "dark"
              ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          }`}
        >
          {t("managerIdStep.cancel")}
        </button>
        <button
          onClick={handleManagerIdSave}
          disabled={isLoading || !managerIdInput.trim()}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 ${
            theme === "dark"
              ? "bg-red-700 hover:bg-red-600 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {isLoading ? "..." : t("managerIdStep.save")}
        </button>
      </div>

      <div
        className={`text-xs p-3 rounded-lg flex items-start gap-2 ${
          theme === "dark"
            ? "bg-yellow-900/20 border border-yellow-800"
            : "bg-yellow-50 border border-yellow-200"
        }`}
      >
        <span className="text-yellow-500">💡</span>
        <p
          className={`${
            theme === "dark" ? "text-yellow-300" : "text-yellow-700"
          }`}
        >
          {t("managerIdStep.tip")}
        </p>
      </div>
    </div>
  );

  const FeaturesStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2
          className={`text-xl md:text-2xl font-bold mb-2 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          {t("featuresStep.title")}
        </h2>
        <p
          className={`text-sm ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {t("featuresStep.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`p-4 rounded-lg border ${
            theme === "dark"
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <FaRobot className="w-6 h-6 text-blue-500" />
            <h3
              className={`font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              AI Team Analysis
            </h3>
          </div>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {t("featuresStep.features.aiAnalysis.description")}
          </p>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            theme === "dark"
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-6 h-6 text-green-500" />
            <h3
              className={`font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              FPL Live Tracking
            </h3>
          </div>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {t("featuresStep.features.liveTracking.description")}
          </p>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            theme === "dark"
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <RefreshCw className="w-6 h-6 text-orange-500" />
            <h3
              className={`font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              Transfer Planner
            </h3>
          </div>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {t("featuresStep.features.transfers.description")}
          </p>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            theme === "dark"
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-6 h-6 text-purple-500" />
            <h3
              className={`font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              Performance Widgets
            </h3>
          </div>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {t("featuresStep.features.widgets.description")}
          </p>
        </div>
      </div>

      <button
        onClick={nextStep}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
          theme === "dark"
            ? "bg-red-700 hover:bg-red-600 text-white"
            : "bg-red-600 hover:bg-red-700 text-white"
        }`}
      >
        {t("featuresStep.next")}
      </button>
    </div>
  );

  const NavigationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2
          className={`text-xl md:text-2xl font-bold mb-2 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          {t("navigationStep.title")}
        </h2>
        <p
          className={`text-sm ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {t("navigationStep.subtitle")}
        </p>
      </div>

      <div className="space-y-4">
        <div
          className={`p-4 rounded-lg border flex items-start gap-4 ${
            theme === "dark"
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div
            className={`p-2 rounded-lg ${
              theme === "dark" ? "bg-red-900/50" : "bg-red-100"
            }`}
          >
            <Monitor
              className={`w-6 h-6 ${
                theme === "dark" ? "text-red-400" : "text-red-600"
              }`}
            />
          </div>
          <div>
            <h3
              className={`font-semibold mb-1 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {t("navigationStep.tips.commandCenter.title")}
            </h3>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {t("navigationStep.tips.commandCenter.description")}
            </p>
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border flex items-start gap-4 ${
            theme === "dark"
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div
            className={`p-2 rounded-lg ${
              theme === "dark" ? "bg-blue-900/50" : "bg-blue-100"
            }`}
          >
            <Settings
              className={`w-6 h-6 ${
                theme === "dark" ? "text-blue-400" : "text-blue-600"
              }`}
            />
          </div>
          <div>
            <h3
              className={`font-semibold mb-1 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {t("navigationStep.tips.quickAccess.title")}
            </h3>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {t("navigationStep.tips.quickAccess.description")}
            </p>
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border flex items-start gap-4 ${
            theme === "dark"
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div
            className={`p-2 rounded-lg ${
              theme === "dark" ? "bg-green-900/50" : "bg-green-100"
            }`}
          >
            <Smartphone
              className={`w-6 h-6 ${
                theme === "dark" ? "text-green-400" : "text-green-600"
              }`}
            />
          </div>
          <div>
            <h3
              className={`font-semibold mb-1 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {t("navigationStep.tips.mobileReady.title")}
            </h3>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {t("navigationStep.tips.mobileReady.description")}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={nextStep}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
          theme === "dark"
            ? "bg-red-700 hover:bg-red-600 text-white"
            : "bg-red-600 hover:bg-red-700 text-white"
        }`}
      >
        {t("navigationStep.next")}
      </button>
    </div>
  );

  const CompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="relative">
        <div
          className={`w-20 h-20 mx-auto rounded-md flex items-center justify-center ${
            theme === "dark"
              ? "bg-gradient-to-r from-green-800 to-green-700"
              : "bg-gradient-to-r from-green-500 to-green-600"
          }`}
        >
          <Trophy className="w-10 h-10 text-white" />
        </div>
      </div>

      <div>
        <h2
          className={`text-2xl md:text-3xl font-bold mb-3 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          {t("completeStep.title")}
        </h2>
        <p
          className={`text-lg mb-4 ${
            theme === "dark" ? "text-green-400" : "text-green-600"
          }`}
        >
          {t("completeStep.subtitle")}
        </p>
        <p
          className={`text-sm leading-relaxed ${
            theme === "dark" ? "text-gray-300" : "text-gray-600"
          }`}
        >
          {t("completeStep.message")}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={async () => {
            try {
              await fetch("/api/user/onboarding", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ completed: true }),
              });
            } catch (error) {
              console.error("Error marking onboarding as completed:", error);
            }
            onComplete();
            window.location.href = "/";
          }}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
            theme === "dark"
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-gray-200 hover:bg-gray-300 text-gray-800"
          }`}
        >
          {t("completeStep.actions.dashboard")}
        </button>
        <button
          onClick={async () => {
            try {
              await fetch("/api/user/onboarding", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ completed: true }),
              });
            } catch (error) {
              console.error("Error marking onboarding as completed:", error);
            }
            onComplete();
            window.location.href = "/premier-league/ai-team-analysis";
          }}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
            theme === "dark"
              ? "bg-red-700 hover:bg-red-600 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {t("completeStep.actions.aiAnalysis")}
        </button>
      </div>
    </div>
  );

  const steps = [
    WelcomeStep,
    ManagerIdStep,
    FeaturesStep,
    NavigationStep,
    CompleteStep,
  ];
  const CurrentStepComponent = steps[currentStep];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-2xl max-h-[95vh] overflow-y-auto mx-2 sm:mx-4 rounded-lg shadow-lg ${
              theme === "dark"
                ? "bg-gray-900 border border-gray-700"
                : "bg-white border border-gray-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between p-3 sm:p-6 border-b ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <div
                  className={`text-xs sm:text-sm font-medium ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {t("navigation.stepOf", {
                    current: currentStep + 1,
                    total: totalSteps + 1,
                  })}
                </div>

                <div className="flex gap-1">
                  {Array.from({ length: totalSteps + 1 }).map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                        index <= currentStep
                          ? theme === "dark"
                            ? "bg-red-500"
                            : "bg-red-600"
                          : theme === "dark"
                          ? "bg-gray-700"
                          : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <button
                  onClick={skipTour}
                  className={`text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    theme === "dark"
                      ? "text-gray-400 hover:text-white hover:bg-gray-800"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {t("navigation.skip")}
                </button>
                <button
                  onClick={handleDontShowAgain}
                  className={`hidden sm:block text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    theme === "dark"
                      ? "text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      : "text-red-600 hover:text-red-700 hover:bg-red-50"
                  }`}
                >
                  {t("navigation.dontShowAgain")}
                </button>
                <button
                  onClick={onClose}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${
                    theme === "dark"
                      ? "text-gray-400 hover:text-white hover:bg-gray-800"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CurrentStepComponent />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            {currentStep !== 0 && currentStep < totalSteps && (
              <div
                className={`flex items-center justify-between p-4 sm:p-6 border-t ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                    theme === "dark"
                      ? "text-gray-400 hover:text-white hover:bg-gray-800"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t("navigation.back")}
                </button>

                <button
                  onClick={nextStep}
                  disabled={currentStep === totalSteps}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                    theme === "dark"
                      ? "bg-red-700 hover:bg-red-600 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  {t("navigation.next")}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;
