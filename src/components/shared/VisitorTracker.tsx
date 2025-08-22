"use client";

import { useVisitorTracking } from "@/hooks/useVisitorTracking";

export default function VisitorTracker() {
  useVisitorTracking();
  return null; // This component doesn't render anything visible
}
