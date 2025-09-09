"use client";

import React from "react";

interface FplStatusBannerProps {
  message?: string;
  className?: string;
}

export default function FplStatusBanner({
  message = "FPL API is currently unavailable. Please try again shortly.",
  className = "",
}: FplStatusBannerProps) {
  return (
    <div
      className={`rounded-md border border-yellow-300 bg-yellow-50 text-yellow-900 px-3 py-2 text-sm flex items-start gap-2 ${className}`}
      role="status"
      aria-live="polite"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-4 h-4 mt-0.5 flex-shrink-0"
      >
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}

