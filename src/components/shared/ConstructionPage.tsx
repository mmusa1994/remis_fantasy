"use client";

import { useTheme } from "@/contexts/ThemeContext";

interface ConstructionPageProps {
  title: string;
  description?: string;
}

export default function ConstructionPage({
  title,
  description = "Ova stranica je trenutno u fazi izrade. Uskoro ćete moći pristupiti svim funkcionalnostima.",
}: ConstructionPageProps) {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen flex items-start justify-center px-4 mobile-nav-adjust bg-theme-background">
      <div
        className={`max-w-2xl mx-auto text-center p-6 md:p-8 rounded-lg shadow-xl ${
          theme === "dark"
            ? "bg-gray-800/80 border border-gray-700"
            : "bg-white/90 border border-gray-200"
        }`}
      >
        {/* Construction Icon */}
        <svg
          className={`w-10 h-10 md:w-12 md:h-12 mx-auto mb-6 ${
            theme === "dark" ? "text-amber-400" : "text-amber-600"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.78 0-2.674-2.155-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>

        {/* Title */}
        <h1
          className={`text-2xl md:text-4xl font-bold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          {title}
        </h1>

        {/* Construction Message */}
        <div
          className={`mb-6 ${
            theme === "dark" ? "text-amber-400" : "text-amber-600"
          }`}
        >
          <h2 className="text-lg md:text-xl font-semibold mb-2">
            Stranica u izgradnji
          </h2>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-current rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-current rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>

        {/* Description */}
        <p
          className={`text-base md:text-lg leading-relaxed mb-6 md:mb-8 ${
            theme === "dark" ? "text-gray-300" : "text-gray-600"
          }`}
        >
          {description}
        </p>

        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className={`inline-flex items-center px-6 py-3 rounded-md font-semibold transition-all duration-200 ${
            theme === "dark"
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-amber-500 hover:bg-amber-600 text-white"
          } transform hover:scale-105 shadow-lg hover:shadow-xl`}
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Nazad
        </button>
      </div>
    </div>
  );
}
