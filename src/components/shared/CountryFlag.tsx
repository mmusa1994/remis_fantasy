"use client";

import React from "react";
import { getCountryFlagCode } from "@/utils/countryMapping";

interface CountryFlagProps {
  country: string | null | undefined;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  title?: string;
}

const sizeClasses = {
  sm: "w-3 h-2",
  md: "w-4 h-3", 
  lg: "w-6 h-4",
  xl: "w-8 h-6",
};

export default function CountryFlag({ 
  country, 
  size = "md", 
  className = "",
  title
}: CountryFlagProps) {
  const flagCode = getCountryFlagCode(country);
  const sizeClass = sizeClasses[size];
  
  return (
    <span
      className={`fi fi-${flagCode} ${sizeClass} rounded-sm ${className}`}
      title={title || country || "Unknown country"}
    />
  );
}
