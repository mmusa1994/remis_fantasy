"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X, AlertCircle } from "lucide-react";

interface ToastProps {
  show: boolean;
  message: string;
  type: "success" | "error";
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  show,
  message,
  type,
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.5 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
            duration: 0.3,
          }}
          className="fixed top-[100px] right-4 z-50 max-w-lg w-[calc(100%-32px)] sm:w-auto sm:max-w-md"
        >
          <div
            className={`
            rounded-lg shadow-2xl backdrop-blur-sm border-2 p-4 
            ${
              type === "success"
                ? "bg-green-500/95 border-green-400 text-white"
                : "bg-red-500/95 border-red-400 text-white"
            }
          `}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {type === "success" ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{message}</p>
              </div>

              <button
                onClick={onClose}
                className="flex-shrink-0 p-1 rounded-md hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
