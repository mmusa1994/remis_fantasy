"use client";

import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import { FaCheckCircle } from "react-icons/fa";

export default function PaymentSuccessPage() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-background px-4">
      <div
        className={`text-center max-w-md p-8 rounded-2xl border ${
          theme === "dark"
            ? "bg-gray-800/50 border-gray-700"
            : "bg-white border-gray-200"
        } shadow-xl`}
      >
        <FaCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h1
          className={`text-2xl font-bold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          Payment Successful!
        </h1>
        <p
          className={`mb-8 ${
            theme === "dark" ? "text-gray-300" : "text-gray-600"
          }`}
        >
          Your subscription has been activated. You now have access to all
          premium features.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/premier-league/tables"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold transition-all"
          >
            Go to Tables
          </Link>
          <Link
            href="/billing-plans"
            className={`px-6 py-3 rounded-lg font-semibold transition-all border ${
              theme === "dark"
                ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            View Plans
          </Link>
        </div>
      </div>
    </div>
  );
}
