"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Globe,
  Monitor,
  Calendar,
  TrendingUp,
  Eye,
  MapPin,
  Clock,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ArrowLeft,
  Sun,
  Moon,
} from "lucide-react";
import LoadingCard from "@/components/shared/LoadingCard";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

import CountryFlag from "@/components/shared/CountryFlag";

interface Visitor {
  id: number;
  ip_address: string;
  user_agent: string;
  referrer: string;
  page_url: string;
  country: string | null;
  city: string | null;
  device_type: string;
  browser: string;
  os: string;
  language: string;
  screen_resolution: string;
  timestamp: string;
  session_id: string;
  is_returning_visitor: boolean;
}

interface VisitorStats {
  total: number;
  today: number;
  week: number;
  month: number;
  topCountries: [string, number][];
  topPages: [string, number][];
}

interface VisitorData {
  visitors: Visitor[];
  stats: VisitorStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function VisitorsPage() {
  const { t } = useTranslation("navigation");
  const { theme, toggleTheme } = useTheme();
  const { data: session, status } = useSession();
  const [data, setData] = useState<VisitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(50);
  const [showLoginRedirect, setShowLoginRedirect] = useState(false);

  const fetchVisitorData = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/visitors?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch visitor data");
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      setShowLoginRedirect(true);
    } else if (status === "authenticated" && session) {
      fetchVisitorData(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, status, session]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/admin" });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("bs-BA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case "mobile":
        return <Smartphone className="w-4 h-4" />;
      case "tablet":
        return <Monitor className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const isDark = theme === "dark";

  if (showLoginRedirect) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-black" : "bg-gray-50"}`}>
        <div className="text-center">
          <p className={`mb-4 ${isDark ? "text-gray-300" : "text-gray-800"}`}>Preusmjeravanje na admin prijavu...</p>
          <Link
            href="/admin"
            className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Admin Prijava
          </Link>
        </div>
      </div>
    );
  }

  if (status === "loading" || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-black" : "bg-gray-50"}`}>
        <LoadingCard
          title="Učitavanje analitike posjetilaca"
          description="Molimo sačekajte dok učitamo podatke o posjetiocima"
          className="w-full max-w-md mx-auto"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-black" : "bg-gray-50"}`}>
        <div className="text-center">
          <p className="text-red-500 mb-4">Greška: {error}</p>
          <button
            onClick={() => fetchVisitorData(currentPage)}
            className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            Pokušaj ponovo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-black" : "bg-gray-50"}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-red-950 to-red-900 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Link
                href="/admin/dashboard"
                className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 sm:p-2 rounded-md transition-colors flex-shrink-0"
                title="Nazad na kontrolnu ploču"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Image
                src="/images/rf-logo.svg"
                alt="REMIS Fantasy Logo"
                width={32}
                height={32}
                className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex-shrink-0"
                priority
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg lg:text-xl font-semibold truncate tracking-tight">
                  Analitika Posjetilaca
                </h1>
                <p className="text-xs sm:text-sm text-white/60 truncate hidden sm:block">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-md transition-colors"
                title={isDark ? "Svijetli mod" : "Tamni mod"}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={handleSignOut}
                className="text-white/70 hover:text-white hover:bg-white/10 p-2 sm:px-3 sm:py-2 rounded-md transition-colors flex items-center gap-2 flex-shrink-0 text-sm"
                title={t("signOut")}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">{t("signOut")}</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {data?.stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-md border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ukupno posjeta</p>
                  <p className={`text-2xl font-semibold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                    {data.stats.total.toLocaleString()}
                  </p>
                </div>
                <Eye className="w-5 h-5 text-blue-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`p-5 rounded-md border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Danas</p>
                  <p className={`text-2xl font-semibold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                    {data.stats.today.toLocaleString()}
                  </p>
                </div>
                <Calendar className="w-5 h-5 text-emerald-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`p-5 rounded-md border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ova sedmica</p>
                  <p className={`text-2xl font-semibold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                    {data.stats.week.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-5 h-5 text-red-700" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`p-5 rounded-md border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ovaj mjesec</p>
                  <p className={`text-2xl font-semibold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                    {data.stats.month.toLocaleString()}
                  </p>
                </div>
                <Clock className="w-5 h-5 text-purple-500" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Top Countries and Pages */}
        {data?.stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-5 rounded-md border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
            >
              <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2 ${isDark ? "text-gray-400" : "text-gray-700"}`}>
                <Globe className="w-4 h-4 text-blue-500" />
                Top Zemlje
              </h3>
              <div className="space-y-2">
                {data.stats.topCountries
                  .slice(0, 5)
                  .map(([country, count]) => (
                    <div
                      key={country}
                      className={`flex justify-between items-center p-3 rounded-md ${isDark ? "bg-gray-800/50 hover:bg-gray-800" : "bg-gray-50 hover:bg-gray-100"} transition-colors`}
                    >
                      <span className={`flex items-center gap-3 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        <CountryFlag country={country} size="xl" />
                        {country || "Nepoznato"}
                      </span>
                      <span className="text-blue-500 font-semibold text-sm">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-5 rounded-md border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
            >
              <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2 ${isDark ? "text-gray-400" : "text-gray-700"}`}>
                <MapPin className="w-4 h-4 text-emerald-500" />
                Top Stranice
              </h3>
              <div className="space-y-2">
                {data.stats.topPages.slice(0, 5).map(([page, count]) => (
                  <div
                    key={page}
                    className={`flex justify-between items-center p-3 rounded-md ${isDark ? "bg-gray-800/50 hover:bg-gray-800" : "bg-gray-50 hover:bg-gray-100"} transition-colors`}
                  >
                    <span className={`truncate max-w-48 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {page}
                    </span>
                    <span className="text-emerald-500 font-semibold text-sm">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Visitors Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-md border overflow-hidden ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
        >
          <div className={`px-5 py-4 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
            <h3 className={`text-sm font-semibold uppercase tracking-wide flex items-center gap-2 ${isDark ? "text-gray-400" : "text-gray-700"}`}>
              <Users className="w-4 h-4 text-blue-500" />
              Nedavni posjetioci
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? "bg-gray-800" : "bg-gray-50"}>
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vrijeme</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokacija</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stranica</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uređaj</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preglednik</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Izvor</th>
                </tr>
              </thead>
              <tbody className={isDark ? "divide-y divide-gray-800" : "divide-y divide-gray-100"}>
                {data?.visitors.map((visitor) => (
                  <tr
                    key={visitor.id}
                    className={`${isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"} transition-colors`}
                  >
                    <td className={`px-5 py-3 whitespace-nowrap text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {formatDate(visitor.timestamp)}
                    </td>
                    <td className={`px-5 py-3 whitespace-nowrap text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      <div className="flex items-center gap-2">
                        <CountryFlag country={visitor.country} size="lg" />
                        <span>
                          {visitor.country
                            ? `${visitor.country}${
                                visitor.city ? `, ${visitor.city}` : ""
                              }`
                            : "Nepoznato"}
                        </span>
                      </div>
                    </td>
                    <td className={`px-5 py-3 text-sm max-w-48 truncate ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {visitor.page_url}
                    </td>
                    <td className={`px-5 py-3 whitespace-nowrap text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(visitor.device_type)}
                        <span className="capitalize">{visitor.device_type}</span>
                      </div>
                    </td>
                    <td className={`px-5 py-3 whitespace-nowrap text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {visitor.browser}
                    </td>
                    <td className={`px-5 py-3 text-sm max-w-32 truncate ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {visitor.referrer === "direct" ? "Direktno" : visitor.referrer}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className={`px-3 sm:px-5 py-3 sm:py-4 border-t flex items-center justify-between ${isDark ? "border-gray-800" : "border-gray-200"}`}>
              <p className={`text-[11px] sm:text-sm ${isDark ? "text-gray-500" : "text-gray-600"}`}>
                Stranica <span className="font-medium">{data.pagination.page}</span> od <span className="font-medium">{data.pagination.totalPages}</span>{" "}
                (<span className="font-medium">{data.pagination.total}</span> ukupno)
              </p>
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-sm rounded-md flex items-center gap-0.5 sm:gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark ? "text-gray-400 bg-gray-800 border border-gray-700 hover:bg-gray-700" : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  Prethodna
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(
                      Math.min(data.pagination.totalPages, currentPage + 1)
                    )
                  }
                  disabled={currentPage === data.pagination.totalPages}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-sm rounded-md flex items-center gap-0.5 sm:gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark ? "text-gray-400 bg-gray-800 border border-gray-700 hover:bg-gray-700" : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Sljedeća
                  <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
