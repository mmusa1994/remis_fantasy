"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        action: "login_admin",
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
      } else if (result?.ok) {
        setLoginSuccess(true);
      } else {
        setError("An error occurred. Please try again.");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loginSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 via-red-900 to-amber-900">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Login successful! Redirecting...</p>
          <div className="mt-4">
            <Link 
              href="/admin/dashboard"
              className="bg-white/20 px-6 py-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-900 via-red-900 to-amber-900">
      {/* Logo above the login panel */}
      <div className="mb-8">
        <Image
          src="/images/rf-logo.svg"
          alt="REMIS Fantasy Logo"
          width={200}
          height={200}
          className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48"
          priority
        />
      </div>

      <div className="max-w-md w-full mx-4">
        <div className="bg-transparent md:bg-white/10 md:backdrop-blur-md md:rounded-2xl p-8 md:shadow-2xl border-0 md:border md:border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
            <p className="text-white/60">REMIS Fantasy Admin Panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="admin@remisfantasy.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-600 to-red-600 text-white font-bold py-3 px-4 rounded-lg hover:from-amber-700 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
