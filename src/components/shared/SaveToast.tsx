"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

export type SaveToastState = {
  kind: "success" | "error";
  text: string;
} | null;

type Props = {
  toast: SaveToastState;
  onDismiss: () => void;
  /** Auto-dismiss delay in ms. Pass 0 to disable auto-dismiss. */
  duration?: number;
  /**
   * Anchor — defaults to "top" (centered top of viewport).
   * Use "bottom" for forms whose save button sits low on the page
   * so the toast appears closer to the user's click.
   */
  anchor?: "top" | "bottom";
};

export default function SaveToast({
  toast,
  onDismiss,
  duration = 3200,
  anchor = "top",
}: Props) {
  const { t: tr } = useTranslation("predictor");
  useEffect(() => {
    if (!toast || duration <= 0) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [toast, duration, onDismiss]);

  const isSuccess = toast?.kind === "success";
  // Top-anchored, but pushed below the fixed Navbar (h-12 mobile / h-14
  // desktop, see src/components/shared/Navbar.tsx). top-16 leaves a small
  // gap on mobile, sm:top-20 leaves the same on desktop.
  const anchorCls =
    "top-16 left-3 right-3 sm:top-20 sm:left-auto sm:right-6 sm:max-w-md";
  const initialY = -40;
  const exitY = -20;

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.text + toast.kind}
          initial={{ opacity: 0, y: initialY, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: exitY, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 360, damping: 22, mass: 0.9 }}
          onClick={onDismiss}
          className={`fixed ${anchorCls} z-[100] cursor-pointer`}
          role="status"
          aria-live="polite"
        >
          <div
            className={`relative flex items-stretch gap-3 pr-6 py-3.5 rounded-2xl backdrop-blur-2xl border shadow-2xl overflow-hidden bg-gray-950/95 ${
              isSuccess ? "border-emerald-400/60" : "border-red-400/60"
            }`}
          >
            {/* outer glow halo */}
            <div
              aria-hidden
              className={`absolute -inset-1 -z-10 blur-2xl opacity-70 ${
                isSuccess ? "bg-emerald-400/50" : "bg-red-400/50"
              }`}
            />
            {/* left accent stripe */}
            <div
              aria-hidden
              className={`flex-shrink-0 w-1.5 rounded-l-2xl ${
                isSuccess ? "bg-emerald-400" : "bg-red-400"
              }`}
            />
            {/* tinted side wash so the icon area picks up the kind color */}
            <div
              aria-hidden
              className={`absolute left-0 top-0 bottom-0 w-24 ${
                isSuccess
                  ? "bg-gradient-to-r from-emerald-500/30 to-transparent"
                  : "bg-gradient-to-r from-red-500/30 to-transparent"
              } pointer-events-none`}
            />
            {isSuccess && (
              <motion.div
                aria-hidden
                initial={{ x: "-120%" }}
                animate={{ x: "220%" }}
                transition={{ duration: 1.4, ease: "easeOut" }}
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
              />
            )}
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 18,
                delay: 0.08,
              }}
              className={`relative z-10 flex-shrink-0 my-auto w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg ${
                isSuccess
                  ? "bg-emerald-500 shadow-emerald-500/50"
                  : "bg-red-500 shadow-red-500/50"
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-5 h-5" strokeWidth={2.75} />
              ) : (
                <AlertTriangle className="w-5 h-5" strokeWidth={2.75} />
              )}
            </motion.div>
            <div className="relative z-10 flex flex-col justify-center min-w-0">
              <span
                className={`text-[11px] font-black uppercase tracking-[0.15em] ${
                  isSuccess ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {isSuccess ? tr("toast.successLabel", "Success") : tr("toast.errorLabel", "Error")}
              </span>
              <span className="text-[13px] font-bold leading-snug text-white pr-2">
                {toast.text}
              </span>
            </div>
            {duration > 0 && (
              <motion.div
                aria-hidden
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: duration / 1000, ease: "linear" }}
                className={`absolute left-0 bottom-0 h-[3px] w-full origin-left ${
                  isSuccess ? "bg-emerald-400" : "bg-red-400"
                }`}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
