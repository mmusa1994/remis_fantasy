"use client";

import { useEffect } from "react";

export default function FlagLoader() {
  useEffect(() => {
    // Dynamically load flag-icons CSS on client side
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.5.0/css/flag-icons.min.css';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  }, []);

  return null; // This component doesn't render anything
}