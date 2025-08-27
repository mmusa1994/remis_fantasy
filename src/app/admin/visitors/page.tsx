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
  Table2,
} from "lucide-react";
// Note: flag-icons CSS will need to be imported in globals.css or layout
import LoadingCard from "@/components/shared/LoadingCard";

// Helper function to convert country names to ISO codes for flag-icons
const getCountryCode = (countryName: string): string => {
  const countryMap: { [key: string]: string } = {
    'United States': 'us',
    'United Kingdom': 'gb',
    'Germany': 'de',
    'France': 'fr',
    'Italy': 'it',
    'Spain': 'es',
    'Netherlands': 'nl',
    'Belgium': 'be',
    'Austria': 'at',
    'Switzerland': 'ch',
    'Sweden': 'se',
    'Norway': 'no',
    'Denmark': 'dk',
    'Finland': 'fi',
    'Poland': 'pl',
    'Czech Republic': 'cz',
    'Slovakia': 'sk',
    'Hungary': 'hu',
    'Romania': 'ro',
    'Bulgaria': 'bg',
    'Greece': 'gr',
    'Portugal': 'pt',
    'Ireland': 'ie',
    'Croatia': 'hr',
    'Slovenia': 'si',
    'Serbia': 'rs',
    'Bosnia and Herzegovina': 'ba',
    'Montenegro': 'me',
    'North Macedonia': 'mk',
    'Albania': 'al',
    'Russia': 'ru',
    'Ukraine': 'ua',
    'Belarus': 'by',
    'Lithuania': 'lt',
    'Latvia': 'lv',
    'Estonia': 'ee',
    'Canada': 'ca',
    'Australia': 'au',
    'New Zealand': 'nz',
    'Japan': 'jp',
    'South Korea': 'kr',
    'China': 'cn',
    'India': 'in',
    'Brazil': 'br',
    'Argentina': 'ar',
    'Mexico': 'mx',
    'Turkey': 'tr',
    'South Africa': 'za',
    'Egypt': 'eg',
    'Morocco': 'ma',
    'Nigeria': 'ng',
    'Kenya': 'ke',
    'Ghana': 'gh',
    'Israel': 'il',
    'United Arab Emirates': 'ae',
    'Saudi Arabia': 'sa',
    'Qatar': 'qa',
    'Kuwait': 'kw',
    'Bahrain': 'bh',
    'Oman': 'om',
    'Jordan': 'jo',
    'Lebanon': 'lb',
    'Syria': 'sy',
    'Iraq': 'iq',
    'Iran': 'ir',
    'Afghanistan': 'af',
    'Pakistan': 'pk',
    'Bangladesh': 'bd',
    'Sri Lanka': 'lk',
    'Myanmar': 'mm',
    'Thailand': 'th',
    'Vietnam': 'vn',
    'Cambodia': 'kh',
    'Laos': 'la',
    'Malaysia': 'my',
    'Singapore': 'sg',
    'Indonesia': 'id',
    'Philippines': 'ph',
    'Taiwan': 'tw',
    'Hong Kong': 'hk',
    'Macau': 'mo'
  };
  
  return countryMap[countryName] || countryName.toLowerCase().slice(0, 2);
};

interface Visitor {
  id: number;
  ip_address: string;
  user_agent: string;
  referrer: string;
  page_url: string;
  country: string;
  city: string;
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Greška: {error}</p>
          <button
            onClick={() => fetchVisitorData(currentPage)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Pokušaj Ponovo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Admin Header */}
      <header className="bg-gradient-to-r from-amber-900 to-red-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Image
                src="/images/rf-logo.svg"
                alt="REMIS Fantasy Logo"
                width={40}
                height={40}
                className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
                priority
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                  REMIS Fantasy Admin - Visitor Analytics
                </h1>
                <p className="text-xs sm:text-sm opacity-75 truncate">
                  Welcome, {session?.user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/dashboard")}
                className="bg-white/20 hover:bg-white/30 p-2 sm:px-4 sm:py-2 rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
                title="Admin Dashboard"
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => router.push("/admin/dashboard/tabele")}
                className="bg-white/20 hover:bg-white/30 p-2 sm:px-4 sm:py-2 rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
                title="Upravljanje tabelama"
              >
                <Table2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Tabele</span>
              </button>
              <button
                onClick={handleSignOut}
                className="bg-white/20 hover:bg-white/30 p-2 sm:px-4 sm:py-2 rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            Visitor Analytics
          </h1>
          <p className="text-gray-400">
            Pregled posjetilaca i njihove aktivnosti
          </p>
        </div>

        {/* Stats Cards */}
        {data?.stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 p-6 rounded-xl border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Ukupno Posjeta</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {data.stats.total.toLocaleString()}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-blue-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 p-6 rounded-xl border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Danas</p>
                  <p className="text-2xl font-bold text-green-400">
                    {data.stats.today.toLocaleString()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800 p-6 rounded-xl border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Ova Sedmica</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {data.stats.week.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800 p-6 rounded-xl border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Ovaj Mjesec</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {data.stats.month.toLocaleString()}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
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
              className="bg-gray-800 p-6 rounded-xl border border-gray-700"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                Top Zemlje
              </h3>
                                 <div className="space-y-3">
                     {data.stats.topCountries.slice(0, 5).map(([country, count]) => (
                       <div
                         key={country}
                         className="flex justify-between items-center"
                       >
                         <span className="text-gray-300 flex items-center gap-2">
                           <span className={`fi fi-${getCountryCode(country)} text-lg`}></span>
                           {country || "Nepoznato"}
                         </span>
                         <span className="text-blue-400 font-semibold">{count}</span>
                       </div>
                     ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-800 p-6 rounded-xl border border-gray-700"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-500" />
                Top Stranice
              </h3>
              <div className="space-y-3">
                {data.stats.topPages.slice(0, 5).map(([page, count]) => (
                  <div key={page} className="flex justify-between items-center">
                    <span className="text-gray-300 truncate max-w-48">
                      {page}
                    </span>
                    <span className="text-green-400 font-semibold">
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
          className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold">Nedavni Posjetioci</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Vrijeme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Lokacija
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Stranica
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Uređaj
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Browser
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Referrer
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {data?.visitors.map((visitor) => (
                  <tr key={visitor.id} className="hover:bg-gray-750/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(visitor.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <span className={`fi fi-${getCountryCode(visitor.country)} text-base`}></span>
                        <span>
                          {visitor.country
                            ? `${visitor.country}${
                                visitor.city ? `, ${visitor.city}` : ""
                              }`
                            : "Nepoznato"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 max-w-48 truncate">
                      {visitor.page_url}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(visitor.device_type)}
                        <span className="capitalize">
                          {visitor.device_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {visitor.browser}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 max-w-32 truncate">
                      {visitor.referrer === "direct"
                        ? "Direktan"
                        : visitor.referrer}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Stranica {data.pagination.page} od {data.pagination.totalPages}(
                {data.pagination.total} ukupno)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prethodna
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(
                      Math.min(data.pagination.totalPages, currentPage + 1)
                    )
                  }
                  disabled={currentPage === data.pagination.totalPages}
                  className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Sljedeća
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
