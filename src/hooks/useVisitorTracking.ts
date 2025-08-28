"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface VisitorData {
  pageUrl: string;
  referrer: string;
  deviceType: string;
  browser: string;
  os: string;
  language: string;
  screenResolution: string;
  sessionId: string;
  isReturningVisitor: boolean;
  country?: string;
  city?: string;
}

// Get device type
function getDeviceType(): string {
  const userAgent = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return "tablet";
  }
  if (
    /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(
      userAgent
    )
  ) {
    return "mobile";
  }
  return "desktop";
}

// Get browser info
function getBrowser(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  if (userAgent.includes("Opera")) return "Opera";
  return "Unknown";
}

// Get OS info
function getOS(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac")) return "macOS";
  if (userAgent.includes("Linux")) return "Linux";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iOS")) return "iOS";
  return "Unknown";
}

// Check if returning visitor
function isReturningVisitor(): boolean {
  return localStorage.getItem("visitor_id") !== null;
}

// Get or create visitor ID
function getVisitorId(): string {
  let visitorId = localStorage.getItem("visitor_id");
  if (!visitorId) {
    visitorId =
      "visitor_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("visitor_id", visitorId);
  }
  return visitorId;
}

export function useVisitorTracking() {
  const pathname = usePathname();
  const hasTracked = useRef<Set<string>>(new Set());

  const trackVisit = async (pageUrl: string) => {
    hasTracked.current.add(pageUrl);

    try {
      const sessionId = getVisitorId();
      const returning = isReturningVisitor();

      const visitorData: VisitorData = {
        pageUrl,
        referrer: document.referrer || "direct",
        deviceType: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        sessionId,
        isReturningVisitor: returning,
      };

      // Skip geolocation API calls in development to avoid CORS issues
      if (process.env.NODE_ENV === "production") {
        // Try to get location data from a geolocation API (optional)
        try {
          const geoResponse = await fetch("https://ipapi.co/json/");
          if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            visitorData.country = geoData.country_name;
            visitorData.city = geoData.city;
          }
        } catch (error) {
          // Geolocation is optional, continue without it
          console.error("Could not fetch location data:", error);
        }
      } else {
        // In development, use mock data
        visitorData.country = "Development";
        visitorData.city = "Local";
      }

      // Send tracking data to our API
      await fetch("/api/visitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(visitorData),
      });
    } catch (error) {
      console.error("Error tracking visitor:", error);
    }
  };

  useEffect(() => {
    // Track the current page
    trackVisit(pathname);
  }, [pathname]);

  return { trackVisit };
}

export default useVisitorTracking;
