"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { LogOut, Mail, CheckCircle, Send } from "lucide-react";

interface Registration {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  team_name: string;
  league_type: string;
  h2h_league: boolean;
  payment_method?: string;
  cash_status?: "paid" | "pending" | "unpaid" | "confirmed" | "rejected";
  payment_proof_url: string | null;
  payment_amount?: number;
  payment_date?: string;
  admin_notes?: string;
  admin_confirmed_by?: string;
  admin_confirmed_at?: string;
  package_type?: string;
  registration_email_sent?: boolean;
  codes_email_sent?: boolean;
  email_template_type?: string;
  registration_email_sent_at?: string;
  codes_email_sent_at?: string;
  league_entry_status?: "entered" | "not_entered" | null;
  created_at: string;
  updated_at?: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<
    Registration[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    league_type: "all",
    h2h_league: "all",
    payment_status: "all",
    payment_method: "all",
    cash_status: "all",
    codes_email_status: "all",
    league_entry_status: "all",
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    url: string;
    filename: string;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingFile, setLoadingFile] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState<string>("");
  const [editingLeagueStatus, setEditingLeagueStatus] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin");
    } else if (status === "authenticated" && session) {
      console.log("User authenticated:", session.user);
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [registrations, filters]);

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from("registration_25_26")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getSignedUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error("Error getting signed URL:", error);
      return null;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRegistrations();
  };

  const sendCodesEmail = async (registration: Registration) => {
    try {
      setSendingEmail(registration.id);

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailType: "codes",
          registrationId: registration.id,
          userData: {
            first_name: registration.first_name,
            last_name: registration.last_name,
            email: registration.email,
            phone: registration.phone,
            team_name: registration.team_name,
            league_type: registration.league_type,
            h2h_league: registration.h2h_league,
            payment_method: registration.payment_method,
            cash_status: registration.cash_status,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      // Refresh registrations to update email status
      await fetchRegistrations();

      // Show success message (you can add a toast notification here)
      alert("Email sa kodovima je uspešno poslat!");
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Greška pri slanju emaila. Pokušajte ponovo.");
    } finally {
      setSendingEmail(null);
    }
  };

  const applyFilters = () => {
    let filtered = [...registrations];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (reg) =>
          reg.first_name.toLowerCase().includes(searchLower) ||
          reg.last_name.toLowerCase().includes(searchLower) ||
          reg.email.toLowerCase().includes(searchLower) ||
          reg.team_name.toLowerCase().includes(searchLower) ||
          reg.phone.includes(searchLower)
      );
    }

    // League type filter
    if (filters.league_type !== "all") {
      filtered = filtered.filter(
        (reg) => reg.league_type === filters.league_type
      );
    }

    // H2H filter
    if (filters.h2h_league !== "all") {
      filtered = filtered.filter(
        (reg) => reg.h2h_league === (filters.h2h_league === "yes")
      );
    }

    // Payment status filter
    if (filters.payment_status !== "all") {
      filtered = filtered.filter((reg) =>
        filters.payment_status === "paid"
          ? reg.payment_proof_url !== null
          : reg.payment_proof_url === null
      );
    }

    // Payment method filter
    if (filters.payment_method !== "all") {
      filtered = filtered.filter(
        (reg) => reg.payment_method === filters.payment_method
      );
    }

    // Cash status filter
    if (filters.cash_status !== "all") {
      filtered = filtered.filter(
        (reg) => reg.cash_status === filters.cash_status
      );
    }

    // Codes email status filter
    if (filters.codes_email_status !== "all") {
      filtered = filtered.filter((reg) =>
        filters.codes_email_status === "sent"
          ? reg.codes_email_sent === true
          : reg.codes_email_sent !== true
      );
    }

    // League entry status filter
    if (filters.league_entry_status !== "all") {
      filtered = filtered.filter((reg) => {
        if (filters.league_entry_status === "entered") {
          return reg.league_entry_status === "entered";
        } else if (filters.league_entry_status === "not_entered") {
          return reg.league_entry_status === "not_entered";
        } else if (filters.league_entry_status === "not_set") {
          return !reg.league_entry_status;
        }
        return true;
      });
    }

    setFilteredRegistrations(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/admin" });
  };

  // Pagination functions
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRegistrations = filteredRegistrations.slice(
    startIndex,
    endIndex
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
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
                  REMIS Fantasy Admin
                </h1>
                <p className="text-xs sm:text-sm opacity-75 truncate">
                  Welcome, {session?.user?.email}
                </p>
              </div>
            </div>
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
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Refresh Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Total Registrations
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  {registrations.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Standard League
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {
                    registrations.filter((r) => r.league_type === "standard")
                      .length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Premium League
                </h3>
                <p className="text-3xl font-bold text-yellow-600">
                  {
                    registrations.filter((r) => r.league_type === "premium")
                      .length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  H2H Participants
                </h3>
                <p className="text-3xl font-bold text-red-900">
                  {registrations.filter((r) => r.h2h_league).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-red-800 to-red-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-red-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Filters</h2>
          </div>

          {/* Search Bar - Full Width */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Name, email, team..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
            />
          </div>

          {/* Filter Dropdowns - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                League Type
              </label>
              <select
                value={filters.league_type}
                onChange={(e) =>
                  setFilters({ ...filters, league_type: e.target.value })
                }
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 text-sm transition-all duration-200"
              >
                <option value="all">All Leagues</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                H2H Status
              </label>
              <select
                value={filters.h2h_league}
                onChange={(e) =>
                  setFilters({ ...filters, h2h_league: e.target.value })
                }
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 text-sm transition-all duration-200"
              >
                <option value="all">All</option>
                <option value="yes">H2H Yes</option>
                <option value="no">H2H No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                value={filters.payment_status}
                onChange={(e) =>
                  setFilters({ ...filters, payment_status: e.target.value })
                }
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 text-sm transition-all duration-200"
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={filters.payment_method}
                onChange={(e) =>
                  setFilters({ ...filters, payment_method: e.target.value })
                }
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 text-sm transition-all duration-200"
              >
                <option value="all">All Methods</option>
                <option value="bank">Bank Transfer</option>
                <option value="wise">Wise</option>
                <option value="cash">Cash</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cash Status
              </label>
              <select
                value={filters.cash_status}
                onChange={(e) =>
                  setFilters({ ...filters, cash_status: e.target.value })
                }
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 text-sm transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Status
              </label>
              <select
                value={filters.codes_email_status}
                onChange={(e) =>
                  setFilters({ ...filters, codes_email_status: e.target.value })
                }
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 text-sm transition-all duration-200"
              >
                <option value="all">All</option>
                <option value="sent">Codes Sent</option>
                <option value="pending">Codes Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Liga Status
              </label>
              <select
                value={filters.league_entry_status}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    league_entry_status: e.target.value,
                  })
                }
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 text-sm transition-all duration-200"
              >
                <option value="all">Svi</option>
                <option value="entered">Ušao u ligu</option>
                <option value="not_entered">Nije ušao</option>
                <option value="not_set">Nije postavljeno</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={() =>
                setFilters({
                  search: "",
                  league_type: "all",
                  h2h_league: "all",
                  payment_status: "all",
                  payment_method: "all",
                  cash_status: "all",
                  codes_email_status: "all",
                  league_entry_status: "all",
                })
              }
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">
              Registrations
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing {startIndex + 1}-
              {Math.min(endIndex, filteredRegistrations.length)} of{" "}
              {filteredRegistrations.length} registrations
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[160px]">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    League
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    H2H
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cash Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Proof
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Liga Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentRegistrations.map((reg) => {
                  // Determine row background color based on league entry status
                  let rowBgClass = "hover:bg-gray-50 group";
                  if (reg.league_entry_status === "entered") {
                    rowBgClass = "bg-green-50 hover:bg-green-100 group";
                  } else if (reg.league_entry_status === "not_entered") {
                    rowBgClass = "bg-yellow-50 hover:bg-yellow-100 group";
                  }

                  return (
                    <tr key={reg.id} className={rowBgClass}>
                      <td
                        className={`sticky left-0 z-10 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200 min-w-[160px] ${
                          reg.league_entry_status === "entered"
                            ? "bg-green-50 group-hover:bg-green-100"
                            : reg.league_entry_status === "not_entered"
                            ? "bg-yellow-50 group-hover:bg-yellow-100"
                            : "bg-white group-hover:bg-gray-50"
                        }`}
                      >
                        {reg.first_name} {reg.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reg.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reg.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reg.team_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            reg.league_type === "premium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {reg.league_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            reg.h2h_league
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {reg.h2h_league ? "✓" : "✗"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            reg.payment_method === "cash"
                              ? "bg-yellow-100 text-yellow-800"
                              : reg.payment_method === "wise"
                              ? "bg-purple-100 text-purple-800"
                              : reg.payment_method === "paypal"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {reg.payment_method || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            reg.cash_status === "paid"
                              ? "bg-green-100 text-green-800"
                              : reg.cash_status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : reg.cash_status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : reg.cash_status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {reg.cash_status || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {reg.payment_proof_url ? (
                          <button
                            onClick={async () => {
                              if (!reg.payment_proof_url) return;

                              setLoadingFile(reg.payment_proof_url);
                              const isPDF = reg.payment_proof_url
                                .toLowerCase()
                                .endsWith(".pdf");

                              try {
                                if (isPDF) {
                                  const signedUrl = await getSignedUrl(
                                    reg.payment_proof_url
                                  );
                                  if (signedUrl) {
                                    setSelectedFile({
                                      url: signedUrl,
                                      filename: reg.payment_proof_url,
                                    });
                                    setSelectedImage(null);
                                  }
                                } else {
                                  const signedUrl = await getSignedUrl(
                                    reg.payment_proof_url
                                  );
                                  if (signedUrl) {
                                    setSelectedImage(signedUrl);
                                    setSelectedFile(null);
                                  }
                                }
                              } finally {
                                setLoadingFile(null);
                              }
                            }}
                            disabled={loadingFile === reg.payment_proof_url}
                            className="text-green-600 hover:text-green-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loadingFile === reg.payment_proof_url ? (
                              <span className="flex items-center gap-1">
                                <svg
                                  className="w-4 h-4 animate-spin"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                </svg>
                                Loading...
                              </span>
                            ) : reg.payment_proof_url
                                ?.toLowerCase()
                                .endsWith(".pdf") ? (
                              "Download PDF"
                            ) : (
                              "View Proof"
                            )}
                          </button>
                        ) : (
                          <span className="text-red-600 text-sm">No proof</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            {reg.registration_email_sent ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3" />
                                Registration
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                <Mail className="w-3 h-3" />
                                Not sent
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {reg.codes_email_sent ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                <CheckCircle className="w-3 h-3" />
                                Codes sent
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                <Mail className="w-3 h-3" />
                                Codes pending
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!reg.codes_email_sent && (
                          <button
                            onClick={() => sendCodesEmail(reg)}
                            disabled={sendingEmail === reg.id}
                            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                              sendingEmail === reg.id
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl"
                            }`}
                          >
                            {sendingEmail === reg.id ? (
                              <>
                                <svg
                                  className="w-4 h-4 animate-spin"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                </svg>
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                Send Codes
                              </>
                            )}
                          </button>
                        )}
                        {reg.codes_email_sent && (
                          <div className="text-xs text-gray-500">
                            Sent on{" "}
                            {reg.codes_email_sent_at &&
                              new Date(
                                reg.codes_email_sent_at
                              ).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 min-w-[300px]">
                        {editingNotes === reg.id ? (
                          <div className="flex gap-2 items-start">
                            <textarea
                              value={notesValue}
                              onChange={(e) => setNotesValue(e.target.value)}
                              className="w-full min-w-[250px] p-3 text-sm border border-gray-300 rounded-md resize-vertical"
                              rows={4}
                              placeholder="Dodaj napomenu..."
                            />
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <button
                                onClick={async () => {
                                  try {
                                    const { error } = await supabase
                                      .from("registration_25_26")
                                      .update({ admin_notes: notesValue })
                                      .eq("id", reg.id);

                                    if (error) throw error;

                                    setEditingNotes(null);
                                    setNotesValue("");
                                    await fetchRegistrations();
                                  } catch (error) {
                                    console.error(
                                      "Error updating notes:",
                                      error
                                    );
                                    alert("Greška pri ažuriranju napomene");
                                  }
                                }}
                                className="px-3 py-2 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => {
                                  setEditingNotes(null);
                                  setNotesValue("");
                                }}
                                className="px-3 py-2 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                              >
                                ✗
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <div
                              className="flex-1 max-w-[250px] break-words"
                              title={reg.admin_notes || "Nema napomena"}
                            >
                              {reg.admin_notes || (
                                <span className="inline-flex items-center justify-center w-6 h-6 border-2 border-red-500 text-red-500 font-bold text-sm">
                                  ✗
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setEditingNotes(reg.id);
                                setNotesValue(reg.admin_notes || "");
                              }}
                              className="text-blue-500 hover:text-blue-700 text-xs underline flex-shrink-0 mt-1"
                            >
                              Uredi
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingLeagueStatus === reg.id ? (
                          <div className="flex gap-2 items-center">
                            <select
                              value={reg.league_entry_status || ""}
                              onChange={async (e) => {
                                const newStatus = e.target.value || null;
                                try {
                                  const { error } = await supabase
                                    .from("registration_25_26")
                                    .update({ league_entry_status: newStatus })
                                    .eq("id", reg.id);

                                  if (error) throw error;

                                  setEditingLeagueStatus(null);
                                  await fetchRegistrations();
                                } catch (error) {
                                  console.error(
                                    "Error updating league status:",
                                    error
                                  );
                                  alert("Greška pri ažuriranju statusa lige");
                                }
                              }}
                              className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                              <option value="">Nije postavljeno</option>
                              <option value="entered">Ušao u ligu</option>
                              <option value="not_entered">Nije ušao</option>
                            </select>
                            <button
                              onClick={() => setEditingLeagueStatus(null)}
                              className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                            >
                              ✗
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                reg.league_entry_status === "entered"
                                  ? "bg-green-100 text-green-800"
                                  : reg.league_entry_status === "not_entered"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {reg.league_entry_status === "entered"
                                ? "Ušao"
                                : reg.league_entry_status === "not_entered"
                                ? "Nije ušao"
                                : "Nije postavljeno"}
                            </span>
                            <button
                              onClick={() => setEditingLeagueStatus(reg.id)}
                              className="text-blue-500 hover:text-blue-700 text-xs underline"
                            >
                              Uredi
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(reg.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-6 py-4 border-t border-gray-200 rounded-b-xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredRegistrations.length)} of{" "}
                  {filteredRegistrations.length} registrations
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => goToPage(pageNumber)}
                          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            currentPage === pageNumber
                              ? "bg-amber-500 text-white"
                              : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg z-10"
            >
              <svg
                className="w-6 h-6 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <Image
              src={selectedImage}
              alt="Payment proof"
              width={800}
              height={600}
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </div>
      )}

      {/* PDF Modal */}
      {selectedFile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedFile(null)}
        >
          <div className="relative max-w-2xl bg-white rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  PDF Document
                </h3>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="text-center py-8">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-12 h-12 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedFile.filename}
                </h4>
                <p className="text-gray-600 mb-6">Payment proof document</p>

                <div className="flex gap-3 justify-center">
                  <a
                    href={selectedFile.url}
                    download={selectedFile.filename}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download PDF
                  </a>
                  <a
                    href={selectedFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-200"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Open in New Tab
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
