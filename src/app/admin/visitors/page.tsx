"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
} from "lucide-react";
// Note: flag-icons CSS will need to be imported in globals.css or layout
import LoadingCard from "@/components/shared/LoadingCard";

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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<VisitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(50);

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
      router.push("/admin");
    } else if (status === "authenticated" && session) {
      fetchVisitorData(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, status, session, router]);

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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingCard
          title="Loading Visitor Analytics"
          description="Please wait while we fetch the visitor data"
          className="w-full max-w-md mx-auto"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => fetchVisitorData(currentPage)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-900 to-red-900 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={() => router.push("/admin/dashboard")}
                className="bg-white/20 hover:bg-white/30 p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 touch-manipulation"
                title="Back to dashboard"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <Image
                src="/images/rf-logo.svg"
                alt="REMIS Fantasy Logo"
                width={32}
                height={32}
                className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex-shrink-0"
                priority
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-bold truncate">
                  Visitor Analytics Dashboard
                </h1>
                <p className="text-xs sm:text-sm opacity-75 truncate hidden sm:block">
                  Track and analyze visitor data
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-white/20 hover:bg-white/30 p-1.5 sm:p-2 lg:px-4 lg:py-2 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 flex-shrink-0 touch-manipulation"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden lg:inline text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Visitor Analytics
              </h1>
              <p className="text-gray-600 mt-1">
                Track and analyze visitor data
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {data?.stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">
                    Total Visits
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {data.stats.total.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform">
                  <Eye className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">
                    Today
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {data.stats.today.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl group-hover:scale-110 transition-transform">
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">
                    This Week
                  </p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {data.stats.week.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">
                    This Month
                  </p>
                  <p className="text-3xl font-bold text-purple-600">
                    {data.stats.month.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl group-hover:scale-110 transition-transform">
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Top Countries and Pages */}
        {data?.stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg"
            >
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-gray-800">Top Countries</span>
              </h3>
              <div className="space-y-4">
                {data.stats.topCountries
                  .slice(0, 5)
                  .map(([country, count]) => (
                    <div
                      key={country}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-gray-700 flex items-center gap-3 font-medium">
                        <CountryFlag country={country} size="xl" />
                        {country || "Unknown"}
                      </span>
                      <span className="text-blue-600 font-bold text-lg">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg"
            >
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-gray-800">Top Pages</span>
              </h3>
              <div className="space-y-4">
                {data.stats.topPages.slice(0, 5).map(([page, count]) => (
                  <div
                    key={page}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-gray-700 truncate max-w-48 font-medium">
                      {page}
                    </span>
                    <span className="text-green-600 font-bold text-lg">
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
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg"
        >
          <div className="px-6 py-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-gray-800">Recent Visitors</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Page
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Browser
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Referrer
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.visitors.map((visitor) => (
                  <tr
                    key={visitor.id}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {formatDate(visitor.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center gap-3">
                        <CountryFlag country={visitor.country} size="lg" />
                        <span className="font-medium">
                          {visitor.country
                            ? `${visitor.country}${
                                visitor.city ? `, ${visitor.city}` : ""
                              }`
                            : "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-48 truncate font-medium">
                      {visitor.page_url}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="p-1 bg-gray-100 rounded-lg">
                          {getDeviceIcon(visitor.device_type)}
                        </div>
                        <span className="capitalize font-medium">
                          {visitor.device_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {visitor.browser}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-32 truncate font-medium">
                      {visitor.referrer === "direct"
                        ? "Direct"
                        : visitor.referrer}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="px-6 py-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600 font-medium">
                Page{" "}
                <span className="text-blue-600 font-bold">
                  {data.pagination.page}
                </span>{" "}
                of{" "}
                <span className="text-blue-600 font-bold">
                  {data.pagination.totalPages}
                </span>{" "}
                (
                <span className="text-blue-600 font-bold">
                  {data.pagination.total}
                </span>{" "}
                total)
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-all duration-200 border border-gray-300 hover:border-gray-400 shadow-lg hover:shadow-xl"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(
                      Math.min(data.pagination.totalPages, currentPage + 1)
                    )
                  }
                  disabled={currentPage === data.pagination.totalPages}
                  className="px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-all duration-200 border border-gray-300 hover:border-gray-400 shadow-lg hover:shadow-xl"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
