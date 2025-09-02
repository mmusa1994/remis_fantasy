import { getSession, signOut } from "next-auth/react";

export interface SessionCheckResult {
  isValid: boolean;
  shouldRedirect: boolean;
  redirectTo?: string;
}

/**
 * Check if the current session is still valid
 * Handles expired sessions and clears localStorage
 */
export async function checkSessionValidity(): Promise<SessionCheckResult> {
  try {
    const session = await getSession();
    
    if (!session) {
      // No session found, clear any local storage
      clearUserData();
      return {
        isValid: false,
        shouldRedirect: true,
        redirectTo: "/login"
      };
    }

    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires && new Date(session.expires).getTime() < Date.now()) {
      // Session is expired
      await performLogout();
      return {
        isValid: false,
        shouldRedirect: true,
        redirectTo: "/login"
      };
    }

    return {
      isValid: true,
      shouldRedirect: false
    };
  } catch (error) {
    console.error("Session validation error:", error);
    await performLogout();
    return {
      isValid: false,
      shouldRedirect: true,
      redirectTo: "/login"
    };
  }
}

/**
 * Perform a complete logout with cleanup
 */
export async function performLogout(redirectUrl: string = "/"): Promise<void> {
  try {
    // Clear user data from localStorage
    clearUserData();
    
    // Sign out from NextAuth
    await signOut({ 
      callbackUrl: redirectUrl,
      redirect: true 
    });
  } catch (error) {
    console.error("Logout error:", error);
    // Fallback: clear data and redirect manually
    clearUserData();
    if (typeof window !== 'undefined') {
      window.location.href = redirectUrl;
    }
  }
}

/**
 * Clear all user-related data from localStorage
 */
export function clearUserData(): void {
  if (typeof window !== 'undefined') {
    // Clear any user-specific localStorage items
    const keysToRemove = [
      'user-preferences',
      'fpl-data-cache',
      'ai-query-cache',
      'theme-preference-user', // Keep general theme, but clear user-specific
      'language-preference-user',
      'dashboard-settings',
      'team-selection-cache'
    ];

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove ${key} from localStorage:`, error);
      }
    });

    // Clear sessionStorage as well
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn("Failed to clear sessionStorage:", error);
    }
  }
}

/**
 * Safe logout that handles errors gracefully
 */
export async function safeLogout(redirectUrl: string = "/"): Promise<void> {
  try {
    await performLogout(redirectUrl);
  } catch (error) {
    console.error("Safe logout failed:", error);
    // Force redirect even if logout fails
    if (typeof window !== 'undefined') {
      clearUserData();
      window.location.href = redirectUrl;
    }
  }
}

/**
 * Check if user should be automatically logged out due to inactivity
 */
export function checkInactivityTimeout(lastActivity: number, timeoutMinutes: number = 60): boolean {
  const now = Date.now();
  const timeSinceLastActivity = now - lastActivity;
  const timeoutMs = timeoutMinutes * 60 * 1000;
  
  return timeSinceLastActivity > timeoutMs;
}

/**
 * Update last activity timestamp
 */
export function updateLastActivity(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('lastActivity', Date.now().toString());
    } catch (error) {
      console.warn("Failed to update last activity:", error);
    }
  }
}

/**
 * Get last activity timestamp
 */
export function getLastActivity(): number {
  if (typeof window !== 'undefined') {
    try {
      const lastActivity = localStorage.getItem('lastActivity');
      return lastActivity ? parseInt(lastActivity, 10) : Date.now();
    } catch (error) {
      console.warn("Failed to get last activity:", error);
      return Date.now();
    }
  }
  return Date.now();
}