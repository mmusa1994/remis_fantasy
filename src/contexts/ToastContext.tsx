"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import SaveToast, { type SaveToastState } from "@/components/shared/SaveToast";

interface ToastContextValue {
  showToast: (text: string, kind?: "success" | "error") => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<SaveToastState>(null);

  const showToast = useCallback(
    (text: string, kind: "success" | "error" = "success") => {
      setToast({ kind, text });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <SaveToast toast={toast} onDismiss={() => setToast(null)} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
