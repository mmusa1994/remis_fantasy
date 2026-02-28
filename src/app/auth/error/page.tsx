"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

const authErrors: { [key: string]: string } = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification token has expired or has already been used.",
  Default: "Unable to sign in.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const error = searchParams.get("error");
  const errorMessage = authErrors[error as string] || authErrors.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-background px-4">
      <div className={`max-w-md w-full p-8 rounded-xl border text-center ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="mb-6">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-md bg-red-100 dark:bg-red-900/50">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        
        <h1 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Authentication Error
        </h1>
        
        <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          {errorMessage}
        </p>

        {error && (
          <div className={`text-xs p-3 rounded-lg mb-6 ${
            theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            Error code: {error}
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/login"
            className="w-full inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors"
          >
            Try Again
          </Link>
          
          <Link
            href="/"
            className={`w-full inline-flex justify-center px-4 py-2 border text-sm font-medium rounded-lg transition-colors ${
              theme === 'dark'
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}