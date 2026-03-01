"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
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
        setError("Pogrešan email ili lozinka.");
      } else if (result?.ok) {
        setLoginSuccess(true);
      } else {
        setError("Došlo je do greške. Pokušajte ponovo.");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      setError("Došlo je do greške. Pokušajte ponovo.");
    } finally {
      setLoading(false);
    }
  };

  // Redirect automatically on successful admin login
  useEffect(() => {
    if (loginSuccess) {
      // Use replace to avoid back navigation to login
      router.replace("/admin/dashboard");
    }
  }, [loginSuccess, router]);

  if (loginSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-950 via-red-900 to-red-950">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Prijava uspješna! Preusmjeravanje...</p>
          <div className="mt-4">
            <Link
              href="/admin/dashboard"
              className="bg-white/20 px-6 py-2 rounded-md hover:bg-white/30 transition-colors"
            >
              Idi na kontrolnu ploču
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-950 via-red-900 to-red-950">
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
        <div className="bg-transparent md:bg-white/10 md:backdrop-blur-md md:rounded-md p-8 md:shadow-2xl border-0 md:border md:border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Admin Prijava</h1>
            <p className="text-white/60">REMIS Fantasy Admin Panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white mb-2"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-900 focus:border-transparent"
                placeholder="admin@remisfantasy.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white mb-2"
              >
                Lozinka
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-900 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-800 to-red-900 text-white font-bold py-3 px-4 rounded-md hover:from-red-900 hover:to-red-950 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Prijavljivanje..." : "Prijavi se"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              ← Nazad na početnu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
