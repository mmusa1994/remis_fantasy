"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  LogOut,
  ArrowLeft,
  Sun,
  Moon,
  Users as UsersIcon,
  Sparkles,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import LoadingCard from "@/components/shared/LoadingCard";
import AdminUsersTab from "@/components/admin/AdminUsersTab";

export default function AdminUsersPage() {
  const { theme, toggleTheme } = useTheme();
  const { data: session, status } = useSession();
  const [showRedirect, setShowRedirect] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && !(session?.user as any)?.isAdmin)) {
      setShowRedirect(true);
    }
  }, [status, session]);

  if (status === "loading") {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black" : "bg-gray-50"}`}>
        <LoadingCard
          title="Učitavanje"
          description="Pripremam listu korisnika"
          className="w-full max-w-md mx-auto"
        />
      </div>
    );
  }

  if (showRedirect) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black" : "bg-gray-50"}`}>
        <div className="text-center">
          <p className="mb-4 text-gray-700 dark:text-gray-300">Potreban je admin pristup.</p>
          <Link
            href="/admin"
            className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800"
          >
            Admin prijava
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black" : "bg-gray-50"}`}>
      <header className="bg-gradient-to-r from-red-950 to-red-900 text-white border-b border-red-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3 min-w-0">
              <Image
                src="/images/rf-logo.svg"
                alt="REMIS Fantasy Logo"
                width={40}
                height={40}
                className="w-8 h-8 sm:w-10 sm:h-10"
                priority
              />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight flex items-center gap-2">
                  <UsersIcon className="w-5 h-5" />
                  Korisnici
                </h1>
                <p className="text-xs sm:text-sm text-white/60 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/dashboard"
                className="text-white/70 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md text-sm flex items-center gap-2"
                title="Nazad na dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <button
                onClick={toggleTheme}
                className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-md"
                title={theme === "dark" ? "Svijetli mod" : "Tamni mod"}
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/admin" })}
                className="text-white/70 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md text-sm flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Odjavi se</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`rounded-md border p-5 ${
          theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
        }`}>
          <AdminUsersTab />
        </div>
      </main>
    </div>
  );
}
