"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { HiXMark, HiShieldCheck, HiExclamationTriangle } from "react-icons/hi2";
import { BiUser, BiSave, BiRefresh } from "react-icons/bi";
import { FaQuestionCircle, FaTimesCircle } from "react-icons/fa";
import { ValidationStatus, ErrorType } from "@/types/validation";
import { getErrorMessage } from "@/utils/error-messages";

interface ManagerIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (managerId: string, allowUnverified?: boolean) => void;
  onRetry?: (managerId: string) => void;
  onSaveUnverified?: (managerId: string) => void;
  isLoading?: boolean;
  validationStatus?: ValidationStatus;
}

export default function ManagerIdModal({
  isOpen,
  onClose,
  onSave,
  onRetry,
  onSaveUnverified,
  isLoading = false,
  validationStatus = {
    isValidating: false,
    isRetrying: false,
    retryCount: 0,
    errorDetails: null,
    showRetryOption: false,
    showFallbackOption: false,
  },
}: ManagerIdModalProps) {
  const { t } = useTranslation("manager");
  const [managerId, setManagerId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!managerId.trim()) {
      setError(t("errors.required"));
      return;
    }

    if (!/^\d{1,10}$/.test(managerId.trim())) {
      setError(t("errors.invalidFormat"));
      return;
    }

    setError("");
    onSave(managerId.trim());
  };

  const handleRetry = () => {
    if (onRetry && managerId.trim()) {
      setError("");
      onRetry(managerId.trim());
    }
  };

  const handleSaveUnverified = () => {
    if (onSaveUnverified && managerId.trim()) {
      setError("");
      onSaveUnverified(managerId.trim());
    }
  };

  const getValidationIcon = () => {
    if (validationStatus.isValidating || validationStatus.isRetrying) {
      return (
        <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
      );
    }
    
    if (validationStatus.errorDetails) {
      switch (validationStatus.errorDetails.type) {
        case ErrorType.INVALID_ID:
          return <FaTimesCircle className="w-5 h-5 text-red-500" />;
        case ErrorType.NETWORK_ERROR:
        case ErrorType.RATE_LIMIT:
        case ErrorType.TIMEOUT:
        case ErrorType.SERVER_ERROR:
          return <HiExclamationTriangle className="w-5 h-5 text-yellow-500" />;
        default:
          return <HiExclamationTriangle className="w-5 h-5 text-yellow-500" />;
      }
    }
    
    return null;
  };

  const getValidationMessage = () => {
    if (validationStatus.isValidating) {
      return "Validating Manager ID with FPL servers...";
    }
    
    if (validationStatus.isRetrying) {
      return `Retrying validation... (Attempt ${validationStatus.retryCount + 1})`;
    }
    
    if (validationStatus.errorDetails) {
      const errorInfo = getErrorMessage(validationStatus.errorDetails.type);
      return {
        title: errorInfo.title,
        description: errorInfo.description,
        suggestions: errorInfo.suggestions,
        userMessage: validationStatus.errorDetails.userMessage,
      };
    }
    
    return null;
  };

  const handleFindManagerId = () => {
    window.open("https://fantasy.premierleague.com/", "_blank");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <HiShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("modalTitle")}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("modalSubtitle")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <HiXMark className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <BiUser className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-800 dark:text-blue-200 font-medium">
                    {t("whyNeedTitle")}
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    {t("whyNeedDescription")}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("inputLabel")}
                </label>
                <input
                  type="text"
                  value={managerId}
                  onChange={(e) => {
                    setManagerId(e.target.value);
                    setError("");
                  }}
                  placeholder={t("inputPlaceholder")}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationStatus.errorDetails?.type === ErrorType.INVALID_ID
                      ? "border-red-300 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  disabled={isLoading || validationStatus.isValidating || validationStatus.isRetrying}
                />
                
                {/* Enhanced Validation Status */}
                {(validationStatus.isValidating || validationStatus.isRetrying || validationStatus.errorDetails) && (
                  <div className={`mt-3 p-4 rounded-lg border ${
                    validationStatus.errorDetails?.type === ErrorType.INVALID_ID
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      : validationStatus.errorDetails
                      ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                      : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  }`}>
                    <div className="flex items-start space-x-3">
                      {getValidationIcon()}
                      <div className="flex-1 min-w-0">
                        {typeof getValidationMessage() === 'string' ? (
                          <p className={`text-sm font-medium ${
                            validationStatus.errorDetails?.type === ErrorType.INVALID_ID
                              ? "text-red-800 dark:text-red-200"
                              : validationStatus.errorDetails
                              ? "text-yellow-800 dark:text-yellow-200"
                              : "text-blue-800 dark:text-blue-200"
                          }`}>
                            {(() => {
                              const message = getValidationMessage();
                              return typeof message === 'string' ? message : '';
                            })()}
                          </p>
                        ) : getValidationMessage() && typeof getValidationMessage() === 'object' ? (
                          <div>
                            <p className={`text-sm font-medium mb-2 ${
                              validationStatus.errorDetails?.type === ErrorType.INVALID_ID
                                ? "text-red-800 dark:text-red-200"
                                : "text-yellow-800 dark:text-yellow-200"
                            }`}>
                              {(getValidationMessage() as any).title}
                            </p>
                            <p className={`text-xs mb-2 ${
                              validationStatus.errorDetails?.type === ErrorType.INVALID_ID
                                ? "text-red-700 dark:text-red-300"
                                : "text-yellow-700 dark:text-yellow-300"
                            }`}>
                              {(getValidationMessage() as any).description}
                            </p>
                            {(getValidationMessage() as any).suggestions && (
                              <ul className={`text-xs space-y-1 list-disc list-inside ${
                                validationStatus.errorDetails?.type === ErrorType.INVALID_ID
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-yellow-600 dark:text-yellow-400"
                              }`}>
                                {(getValidationMessage() as any).suggestions.map((suggestion: string, index: number) => (
                                  <li key={index}>{suggestion}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Original error display for local validation */}
                {error && !validationStatus.errorDetails && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleFindManagerId}
                  className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <FaQuestionCircle className="w-4 h-4" />
                  <span>{t("findManagerIdHelp")}</span>
                </button>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  disabled={isLoading || validationStatus.isValidating || validationStatus.isRetrying}
                >
                  {t("cancel")}
                </button>
                
                {/* Show retry button if validation failed and retry is available */}
                {validationStatus.showRetryOption && validationStatus.errorDetails && !validationStatus.isValidating && !validationStatus.isRetrying && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={!managerId.trim()}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white rounded-lg transition-colors"
                  >
                    <BiRefresh className="w-4 h-4" />
                    <span>{getErrorMessage(validationStatus.errorDetails.type).retryText || 'Retry'}</span>
                  </button>
                )}
                
                {/* Show fallback save button if available */}
                {validationStatus.showFallbackOption && validationStatus.errorDetails && !validationStatus.isValidating && !validationStatus.isRetrying && (
                  <button
                    type="button"
                    onClick={handleSaveUnverified}
                    disabled={!managerId.trim()}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg transition-colors"
                  >
                    <BiSave className="w-4 h-4" />
                    <span>{getErrorMessage(validationStatus.errorDetails.type).fallbackText || 'Save Anyway'}</span>
                  </button>
                )}
                
                {/* Normal save/submit button */}
                {(!validationStatus.showRetryOption && !validationStatus.showFallbackOption) || validationStatus.isValidating || validationStatus.isRetrying ? (
                  <button
                    type="submit"
                    disabled={isLoading || validationStatus.isValidating || validationStatus.isRetrying || !managerId.trim()}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                  >
                    {(isLoading || validationStatus.isValidating || validationStatus.isRetrying) ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <BiSave className="w-4 h-4" />
                    )}
                    <span>
                      {validationStatus.isValidating 
                        ? t("validating")
                        : validationStatus.isRetrying 
                        ? t("retrying")
                        : t("saveId")
                      }
                    </span>
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          {/* Help text */}
          <div className="px-6 pb-6 text-xs text-gray-500 dark:text-gray-400">
            <p>
              {t("helpText")}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
