"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { HiXMark, HiShieldCheck } from "react-icons/hi2";
import { BiUser, BiSave } from "react-icons/bi";
import { FaQuestionCircle } from "react-icons/fa";

interface ManagerIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (managerId: string) => void;
  isLoading?: boolean;
}

export default function ManagerIdModal({ 
  isOpen, 
  onClose, 
  onSave, 
  isLoading = false 
}: ManagerIdModalProps) {
  const { t } = useTranslation("ai");
  const [managerId, setManagerId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!managerId.trim()) {
      setError("Manager ID je obavezan");
      return;
    }

    if (!/^\d{1,10}$/.test(managerId.trim())) {
      setError("Manager ID mora biti broj (1-10 cifara)");
      return;
    }

    setError("");
    onSave(managerId.trim());
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
                  Manager ID potreban
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Za personaliziranu FPL analizu
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
                    Zašto trebam Manager ID?
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Da analiziram tvoj tim, potreban mi je pristup tvojim igračima, kapitenu i rangovima.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  FPL Manager ID
                </label>
                <input
                  type="text"
                  value={managerId}
                  onChange={(e) => {
                    setManagerId(e.target.value);
                    setError("");
                  }}
                  placeholder="npr. 1234567"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                {error && (
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
                  <span>Kako naći Manager ID?</span>
                </button>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !managerId.trim()}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <BiSave className="w-4 h-4" />
                  )}
                  <span>Spremi ID</span>
                </button>
              </div>
            </form>
          </div>

          {/* Help text */}
          <div className="px-6 pb-6 text-xs text-gray-500 dark:text-gray-400">
            <p>
              💡 Manager ID možeš naći na svojoj FPL stranici u URL-u nakon "/entry/"
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}