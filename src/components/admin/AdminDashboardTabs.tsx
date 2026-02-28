"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  LogOut,
  Mail,
  CheckCircle,
  Send,
  Edit,
  Trash2,
  Table2,
  Users,
  Trophy,
  Crown,
  Star,
  AlertCircle,
  Sun,
  Moon,
} from "lucide-react";
import Toast from "@/components/shared/Toast";
import LoadingCard from "@/components/shared/LoadingCard";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

interface Registration {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  team_name?: string;
  league_type?: string;
  league_tier?: string;
  h2h_league?: boolean;
  payment_method?: string;
  payment_status?: "paid" | "pending" | null;
  cash_status?: "paid" | "pending" | null;
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
  codes_email_sent_at?: string | null;
  league_entry_status?: "entered" | "not_entered" | null;
  notes?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

type LeagueTab = "premier" | "champions" | "f1";

interface AdminDashboardTabsProps {
  initialTab?: LeagueTab;
}

export default function AdminDashboardTabs({ 
  initialTab = "premier" 
}: AdminDashboardTabsProps) {
  const { t } = useTranslation("navigation");
  const { theme, toggleTheme } = useTheme();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<LeagueTab>(initialTab);
  const [season, setSeason] = useState<"25_26" | "26_27">("26_27");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<
    Registration[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    league_type: "all",
    h2h_league: "all", 
    payment_method: "all",
    payment_status: "all",
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
  const [editingRecord, setEditingRecord] = useState<Registration | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Registration>>({});
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });
  const [showLoginRedirect, setShowLoginRedirect] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      setShowLoginRedirect(true);
    } else if (status === "authenticated" && session) {
      console.info("User authenticated:", session.user);
    }
  }, [status, session]);

  const applyFilters = useCallback(() => {
    let filtered = [...registrations];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (reg) =>
          reg.first_name.toLowerCase().includes(searchLower) ||
          reg.last_name.toLowerCase().includes(searchLower) ||
          reg.email.toLowerCase().includes(searchLower) ||
          (reg.team_name && reg.team_name.toLowerCase().includes(searchLower)) ||
          reg.phone.includes(searchLower)
      );
    }

    // League type filter (only for Premier League)
    if (activeTab === "premier" && filters.league_type !== "all") {
      filtered = filtered.filter(
        (reg) => (reg.league_type || reg.league_tier) === filters.league_type
      );
    }

    // H2H filter (only for Premier League)
    if (activeTab === "premier" && filters.h2h_league !== "all") {
      filtered = filtered.filter(
        (reg) => reg.h2h_league === (filters.h2h_league === "yes")
      );
    }

    // Payment method filter
    if (filters.payment_method !== "all") {
      filtered = filtered.filter(
        (reg) => reg.payment_method === filters.payment_method
      );
    }

    // Payment status filter
    if (filters.payment_status !== "all") {
      filtered = filtered.filter((reg) => {
        if (filters.payment_status === "paid") {
          return reg.payment_status === "paid";
        } else if (filters.payment_status === "pending") {
          return reg.payment_status === "pending";
        } else if (filters.payment_status === "null") {
          return (
            reg.payment_status === null || reg.payment_status === undefined
          );
        }
        return false;
      });
    }

    // Cash status filter (only for Premier League)
    if (activeTab === "premier" && filters.cash_status !== "all") {
      filtered = filtered.filter((reg) => {
        if (filters.cash_status === "paid") {
          return reg.cash_status === "paid";
        } else if (filters.cash_status === "pending") {
          return reg.cash_status === "pending";
        } else if (filters.cash_status === "null") {
          return reg.cash_status === null || reg.cash_status === undefined;
        }
        return false;
      });
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
    setCurrentPage(1);
  }, [registrations, filters, activeTab]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, league_type: "all" }));
    fetchRegistrations();
  }, [activeTab, season]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const seasonParam = activeTab !== "f1" ? `?season=${season}` : "";
      const apiEndpoint = activeTab === "premier"
        ? `/api/admin/registrations${seasonParam}`
        : activeTab === "champions"
        ? `/api/admin/champions-registrations${seasonParam}`
        : "/api/admin/f1-registrations";

      const response = await fetch(apiEndpoint);

      if (!response.ok) {
        throw new Error("Failed to fetch registrations");
      }

      const { registrations } = await response.json();
      setRegistrations(registrations || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getSignedUrl = async (filePath?: string): Promise<string | null> => {
    if (!filePath) {
      return null;
    }

    try {
      const response = await fetch("/api/admin/storage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) {
        throw new Error("Failed to get signed URL");
      }

      const { signedUrl } = await response.json();
      return signedUrl;
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

      const emailEndpoint = activeTab === "premier" ? "/api/send-email" : "/api/send-champions-email";
      const emailType = activeTab === "premier" ? "codes" : "champions_codes";

      const response = await fetch(emailEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailType: emailType,
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

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage =
          responseData.error || responseData.details || "Failed to send email";
        const errorDetails = responseData.details
          ? ` (${responseData.details})`
          : "";

        console.error("Error sending email:", {
          status: response.status,
          statusText: response.statusText,
          error: responseData.error,
          details: responseData.details,
          fullResponse: responseData,
        });

        throw new Error(`${errorMessage}${errorDetails}`);
      }

      if (responseData.registration) {
        setRegistrations((prevRegistrations) =>
          prevRegistrations.map((reg) =>
            reg.id === registration.id ? responseData.registration : reg
          )
        );
      }

      const message = responseData.alreadySent
        ? "Email sa kodovima je već poslat ranije."
        : `Email sa kodovima je uspešno poslat ${activeTab === "premier" ? "(Premier League)" : "(Champions League)"}!`;

      setToast({
        show: true,
        message,
        type: "success",
      });
    } catch (error) {
      console.error("Error sending email:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Greška pri slanju emaila. Pokušajte ponovo.";

      setToast({
        show: true,
        message: errorMessage,
        type: "error",
      });
    } finally {
      setSendingEmail(null);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/admin" });
  };

  const handleEditRecord = (registration: Registration) => {
    setEditingRecord(registration);
    setEditFormData(registration);
  };

  const saveEditedRecord = async () => {
    if (!editingRecord) return;

    try {
      const seasonParam = activeTab !== "f1" ? `?season=${season}` : "";
      const apiEndpoint = activeTab === "premier"
        ? `/api/admin/registrations${seasonParam}`
        : activeTab === "champions"
        ? `/api/admin/champions-registrations${seasonParam}`
        : "/api/admin/f1-registrations";

      const response = await fetch(apiEndpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingRecord.id,
          updates: {
            first_name: editFormData.first_name,
            last_name: editFormData.last_name,
            email: editFormData.email,
            phone: editFormData.phone,
            team_name: editFormData.team_name,
            league_type: editFormData.league_type,
            h2h_league: editFormData.h2h_league,
            payment_method: editFormData.payment_method,
            payment_status: editFormData.payment_status,
            cash_status: editFormData.cash_status,
            admin_notes: editFormData.admin_notes,
            email_template_type: editFormData.email_template_type,
            codes_email_sent: editFormData.codes_email_sent,
            codes_email_sent_at: editFormData.codes_email_sent_at || null,
            notes: editFormData.notes,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update registration");
      }

      setEditingRecord(null);
      setEditFormData({});
      await fetchRegistrations();
      setToast({
        show: true,
        message: "Registracija je uspešno ažurirana!",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating registration:", error);
      setToast({
        show: true,
        message: "Greška pri ažuriranju registracije",
        type: "error",
      });
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Da li ste sigurni da želite da obrišete ovu registraciju?")) {
      return;
    }

    try {
      const seasonParam = activeTab !== "f1" ? `&season=${season}` : "";
      const apiEndpoint = activeTab === "premier"
        ? `/api/admin/registrations?id=${id}${seasonParam}`
        : activeTab === "champions"
        ? `/api/admin/champions-registrations?id=${id}${seasonParam}`
        : `/api/admin/f1-registrations?id=${id}`;

      const response = await fetch(apiEndpoint, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete registration");
      }

      await fetchRegistrations();
      setToast({
        show: true,
        message: "Registracija je uspešno obrisana!",
        type: "success",
      });
    } catch (error) {
      console.error("Error deleting registration:", error);
      setToast({
        show: true,
        message: "Greška pri brisanju registracije",
        type: "error",
      });
    }
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

  // Tab-specific stats calculation
  const getTabStats = () => {
    if (activeTab === "premier") {
      return [
        {
          label: "Total Registrations",
          value: registrations.length,
          icon: "Users",
          color: "from-gray-500 to-gray-600",
        },
        {
          label: "Standard League",
          value: registrations.filter((r) => r.league_type === "standard").length,
          icon: "Trophy",
          color: "from-blue-400 to-blue-500",
        },
        {
          label: "Premium League",
          value: registrations.filter((r) => r.league_type === "premium").length,
          icon: "Star",
          color: "from-yellow-500 to-yellow-600",
        },
        {
          label: "H2H Participants",
          value: registrations.filter((r) => r.h2h_league).length,
          icon: "Crown",
          color: "from-red-800 to-red-900",
        },
      ];
    } else {
      return [
        {
          label: "Champions League",
          value: registrations.length,
          icon: "Trophy",
          color: "from-blue-500 to-purple-600",
        },
        {
          label: "Paid Registrations",
          value: registrations.filter((r) => r.payment_status === "paid").length,
          icon: "CheckCircle",
          color: "from-green-500 to-green-600",
        },
        {
          label: "Pending Payments",
          value: registrations.filter((r) => r.payment_status === "pending").length,
          icon: "AlertCircle",
          color: "from-yellow-500 to-orange-500",
        },
        {
          label: "Codes Sent",
          value: registrations.filter((r) => r.codes_email_sent).length,
          icon: "Mail",
          color: "from-purple-500 to-purple-600",
        },
      ];
    }
  };

  if (showLoginRedirect) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black" : "bg-gray-50"}`}>
        <div className="text-center">
          <p className="mb-4 text-gray-800">Redirecting to admin login...</p>
          <Link
            href="/admin"
            className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  if (status === "loading" || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black" : "bg-gray-50"}`}>
        <LoadingCard
          title="Loading Admin Dashboard"
          description="Please wait while we fetch the registration data"
          className="w-full max-w-md mx-auto"
        />
      </div>
    );
  }

  const tabStats = getTabStats();

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black" : "bg-gray-50"}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-900 to-red-900 text-white border-b border-amber-950">
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
                <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold truncate tracking-tight">
                  Admin Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-white/60 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/visitors"
                className="text-white/70 hover:text-white hover:bg-white/10 p-2 sm:px-3 sm:py-2 rounded-md transition-colors flex items-center gap-2 flex-shrink-0 text-sm"
                title="Visitor Analytics"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Visitors</span>
              </Link>
              <Link
                href="/admin/dashboard/tables"
                className="text-white/70 hover:text-white hover:bg-white/10 p-2 sm:px-3 sm:py-2 rounded-md transition-colors flex items-center gap-2 flex-shrink-0 text-sm"
                title="Upravljanje tabelama"
              >
                <Table2 className="w-4 h-4" />
                <span className="hidden sm:inline">Tabele</span>
              </Link>
              <button
                onClick={toggleTheme}
                className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-md transition-colors flex-shrink-0"
                title={theme === "dark" ? "Light mode" : "Dark mode"}
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={handleSignOut}
                className="text-white/70 hover:text-white hover:bg-white/10 p-2 sm:px-3 sm:py-2 rounded-md transition-colors flex items-center gap-2 flex-shrink-0 text-sm"
                title={t("signOut")}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t("signOut")}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* League Tabs + Season Selector */}
        <div className={`mb-8 border-b ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`}>
          <div className="flex items-center justify-between">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab("premier")}
              className={`py-2.5 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "premier"
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : theme === "dark" ? "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Image src="/images/logos/pl-logo.png" alt="Premier League" width={18} height={18} className="w-[18px] h-[18px] object-contain" style={{
                  opacity: activeTab === "premier" ? 1 : 0.5,
                  filter: activeTab === "premier"
                    ? "brightness(0) saturate(100%) invert(25%) sepia(80%) saturate(4000%) hue-rotate(260deg) brightness(95%)"
                    : theme === "dark" ? "brightness(0) invert(1) opacity(0.5)" : "brightness(0) opacity(0.5)"
                }} />
                Premier League
              </div>
            </button>
            <button
              onClick={() => setActiveTab("champions")}
              className={`py-2.5 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "champions"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : theme === "dark" ? "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Image src="/images/logos/cl-logo.png" alt="Champions League" width={18} height={18} className="w-[18px] h-[18px] object-contain" style={{
                  opacity: activeTab === "champions" ? 1 : 0.5,
                  filter: activeTab === "champions"
                    ? "brightness(0) saturate(100%) invert(35%) sepia(80%) saturate(3000%) hue-rotate(200deg) brightness(95%)"
                    : theme === "dark" ? "brightness(0) invert(1) opacity(0.5)" : "brightness(0) opacity(0.5)"
                }} />
                Champions League
              </div>
            </button>
            <button
              onClick={() => setActiveTab("f1")}
              className={`py-2.5 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "f1"
                  ? "border-red-500 text-red-600 dark:text-red-400"
                  : theme === "dark" ? "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Image src="/images/logos/f1.png" alt="F1 Fantasy" width={18} height={18} className="w-[18px] h-[18px] object-contain" style={{
                  opacity: activeTab === "f1" ? 1 : 0.5,
                  filter: activeTab === "f1"
                    ? "brightness(0) saturate(100%) invert(20%) sepia(80%) saturate(5000%) hue-rotate(350deg) brightness(95%)"
                    : theme === "dark" ? "brightness(0) invert(1) opacity(0.5)" : "brightness(0) opacity(0.5)"
                }} />
                F1 Fantasy
              </div>
            </button>
          </nav>
          {/* Season Selector */}
          <div className="flex items-center gap-2 mb-1">
            <label className={`text-xs font-medium uppercase tracking-wide ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
              Season
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value as "25_26" | "26_27")}
              className={`px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 ${
                theme === "dark" ? "bg-gray-900 border border-gray-700 text-white" : "bg-white border border-gray-200 text-gray-900"
              }`}
            >
              <option value="26_27">2026/27</option>
              <option value="25_26">2025/26</option>
            </select>
          </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === "dark" ? "text-gray-400 bg-gray-900 border border-gray-800 hover:bg-gray-800" : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <svg
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
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
          {tabStats.map((stat, index) => {
            const cardBg = (() => {
              switch (stat.icon) {
                case "Users": return theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-gray-50/80 border-gray-200";
                case "Trophy": return theme === "dark" ? "bg-blue-950/40 border-blue-900/50" : "bg-blue-50/60 border-blue-200/60";
                case "Star": return theme === "dark" ? "bg-amber-950/40 border-amber-900/50" : "bg-amber-50/60 border-amber-200/60";
                case "Crown": return theme === "dark" ? "bg-red-950/40 border-red-900/50" : "bg-red-50/60 border-red-200/60";
                case "CheckCircle": return theme === "dark" ? "bg-emerald-950/40 border-emerald-900/50" : "bg-emerald-50/60 border-emerald-200/60";
                case "AlertCircle": return theme === "dark" ? "bg-amber-950/40 border-amber-900/50" : "bg-amber-50/60 border-amber-200/60";
                case "Mail": return theme === "dark" ? "bg-purple-950/40 border-purple-900/50" : "bg-purple-50/60 border-purple-200/60";
                default: return theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";
              }
            })();
            return (
            <div key={index} className={`rounded-md p-5 border ${cardBg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {stat.label}
                  </p>
                  <p className={`text-2xl font-semibold mt-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    {stat.value}
                  </p>
                </div>
                <div>
                  {stat.icon === "Users" && <Users className="w-5 h-5 text-gray-400" />}
                  {stat.icon === "Trophy" && <Trophy className="w-5 h-5 text-blue-500" />}
                  {stat.icon === "Star" && <Star className="w-5 h-5 text-amber-500" />}
                  {stat.icon === "Crown" && <Crown className="w-5 h-5 text-red-500" />}
                  {stat.icon === "CheckCircle" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                  {stat.icon === "AlertCircle" && <AlertCircle className="w-5 h-5 text-amber-500" />}
                  {stat.icon === "Mail" && <Mail className="w-5 h-5 text-purple-500" />}
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className={`rounded-md p-5 mb-8 border ${
          theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
        }`}>
          <div className="flex items-center gap-2 mb-5">
            <svg
              className={`w-4 h-4 ${theme === "dark" ? "text-gray-600" : "text-gray-400"}`}
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
            <h2 className={`text-sm font-semibold uppercase tracking-wide ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}>
              Filters
            </h2>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}>
              Search
            </label>
            <input
              type="text"
              placeholder="Name, email, team..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className={`w-full px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 ${
                theme === "dark" ? "bg-gray-800 border border-gray-700 text-white placeholder-gray-500" : "bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500"
              }`}
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
            {/* League Type (Premier League only) */}
            {activeTab === "premier" && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}>
                  {season === "26_27" ? "League Tier" : "League Type"}
                </label>
                <select
                  value={filters.league_type}
                  onChange={(e) =>
                    setFilters({ ...filters, league_type: e.target.value })
                  }
                  className={`w-full px-3 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm transition-all duration-200 ${
                      theme === "dark" ? "bg-gray-800 border border-gray-700 text-white" : "bg-gray-50 border border-gray-200 text-gray-900"
                    }`}
                >
                  <option value="all">All Leagues</option>
                  {season === "26_27" ? (
                    <>
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                      <option value="h2h_only">H2H Only</option>
                      <option value="standard_h2h">Standard + H2H</option>
                      <option value="premium_h2h">Premium + H2H</option>
                    </>
                  ) : (
                    <>
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                      <option value="h2h">H2H</option>
                      <option value="n/a">N/A</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {/* H2H Status (Premier League only) */}
            {activeTab === "premier" && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}>
                  H2H Status
                </label>
                <select
                  value={filters.h2h_league}
                  onChange={(e) =>
                    setFilters({ ...filters, h2h_league: e.target.value })
                  }
                  className={`w-full px-3 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm transition-all duration-200 ${
                      theme === "dark" ? "bg-gray-800 border border-gray-700 text-white" : "bg-gray-50 border border-gray-200 text-gray-900"
                    }`}
                >
                  <option value="all">All</option>
                  <option value="yes">H2H Yes</option>
                  <option value="no">H2H No</option>
                </select>
              </div>
            )}

            {/* Payment Method */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}>
                Payment Method
              </label>
              <select
                value={filters.payment_method}
                onChange={(e) =>
                  setFilters({ ...filters, payment_method: e.target.value })
                }
                className={`w-full px-3 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm transition-all duration-200 ${
                      theme === "dark" ? "bg-gray-800 border border-gray-700 text-white" : "bg-gray-50 border border-gray-200 text-gray-900"
                    }`}
              >
                <option value="all">All Methods</option>
                <option value="bank">Bank Transfer</option>
                <option value="wise">Wise</option>
                <option value="cash">Cash</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>

            {/* Payment Status */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}>
                Payment Status
              </label>
              <select
                value={filters.payment_status}
                onChange={(e) =>
                  setFilters({ ...filters, payment_status: e.target.value })
                }
                className={`w-full px-3 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm transition-all duration-200 ${
                      theme === "dark" ? "bg-gray-800 border border-gray-700 text-white" : "bg-gray-50 border border-gray-200 text-gray-900"
                    }`}
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="null">NULL</option>
              </select>
            </div>

            {/* Cash Status (Premier League only) */}
            {activeTab === "premier" && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}>
                  Cash Status
                </label>
                <select
                  value={filters.cash_status}
                  onChange={(e) =>
                    setFilters({ ...filters, cash_status: e.target.value })
                  }
                  className={`w-full px-3 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm transition-all duration-200 ${
                      theme === "dark" ? "bg-gray-800 border border-gray-700 text-white" : "bg-gray-50 border border-gray-200 text-gray-900"
                    }`}
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="null">NULL</option>
                </select>
              </div>
            )}

            {/* Email Status */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}>
                Email Status
              </label>
              <select
                value={filters.codes_email_status}
                onChange={(e) =>
                  setFilters({ ...filters, codes_email_status: e.target.value })
                }
                className={`w-full px-3 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm transition-all duration-200 ${
                      theme === "dark" ? "bg-gray-800 border border-gray-700 text-white" : "bg-gray-50 border border-gray-200 text-gray-900"
                    }`}
              >
                <option value="all">All</option>
                <option value="sent">Codes Sent</option>
                <option value="pending">Codes Pending</option>
              </select>
            </div>

            {/* League Entry Status */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}>
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
                className={`w-full px-3 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm transition-all duration-200 ${
                      theme === "dark" ? "bg-gray-800 border border-gray-700 text-white" : "bg-gray-50 border border-gray-200 text-gray-900"
                    }`}
              >
                <option value="all">Svi</option>
                <option value="entered">Ušao u ligu</option>
                <option value="not_entered">Nije ušao</option>
                <option value="not_set">Nije postavljeno</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={() =>
                setFilters({
                  search: "",
                  league_type: "all",
                  h2h_league: "all",
                  payment_method: "all",
                  payment_status: "all",
                  cash_status: "all",
                  codes_email_status: "all",
                  league_entry_status: "all",
                })
              }
              className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 ${
                theme === "dark" ? "text-gray-400 bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:text-gray-300" : "text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Registrations Table */}
        <div className={`rounded-md overflow-hidden border ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
          <div className={`px-6 py-4 border-b ${theme === "dark" ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-gray-50"}`}>
            <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
              {activeTab === "premier" ? "Premier League Registrations" : "Champions League Registrations"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing {startIndex + 1}-
              {Math.min(endIndex, filteredRegistrations.length)} of{" "}
              {filteredRegistrations.length} registrations
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </p>
          </div>

          {/* Table content would continue here... */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={theme === "dark" ? "bg-gray-800" : "bg-gray-50"}>
                <tr>
                  <th className={`sticky left-0 z-10 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px] ${theme === "dark" ? "bg-gray-800 border-r border-gray-700" : "bg-gray-50 border-r border-gray-200"}`}>
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  {activeTab === "premier" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team Name
                    </th>
                  )}
                  {activeTab === "premier" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      League
                    </th>
                  )}
                  {activeTab === "premier" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      H2H
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  {activeTab === "premier" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cash Status
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Edit/Delete
                  </th>
                </tr>
              </thead>
              <tbody className={theme === "dark" ? "bg-gray-900 divide-y divide-gray-800" : "bg-white divide-y divide-gray-200"}>
                {currentRegistrations.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={activeTab === "premier" ? 16 : 13} 
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No registrations found for {activeTab === "premier" ? "Premier League" : "Champions League"}
                    </td>
                  </tr>
                ) : (
                  currentRegistrations.map((reg) => {
                    // Determine row background color based on league entry status
                    let rowBgClass = theme === "dark" ? "hover:bg-gray-800 group" : "hover:bg-gray-50 group";
                    if (reg.league_entry_status === "entered") {
                      rowBgClass = theme === "dark" ? "bg-[#0a1f0a] hover:bg-[#0f2a0f] group" : "bg-green-50 hover:bg-green-100 group";
                    } else if (reg.league_entry_status === "not_entered") {
                      rowBgClass = theme === "dark" ? "bg-[#1a1700] hover:bg-[#241f00] group" : "bg-yellow-50 hover:bg-yellow-100 group";
                    }

                    return (
                      <tr key={reg.id} className={rowBgClass}>
                        <td
                          className={`sticky left-0 z-10 px-6 py-4 whitespace-nowrap text-sm font-medium border-r min-w-[160px] ${
                            theme === "dark" ? "text-white border-gray-700" : "text-gray-900 border-gray-200"
                          } ${
                            reg.league_entry_status === "entered"
                              ? theme === "dark" ? "bg-[#0a1f0a] group-hover:bg-[#0f2a0f]" : "bg-green-50 group-hover:bg-green-100"
                              : reg.league_entry_status === "not_entered"
                              ? theme === "dark" ? "bg-[#1a1700] group-hover:bg-[#241f00]" : "bg-yellow-50 group-hover:bg-yellow-100"
                              : theme === "dark" ? "bg-gray-900 group-hover:bg-gray-800" : "bg-white group-hover:bg-gray-50"
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
                        {activeTab === "premier" && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {reg.team_name}
                          </td>
                        )}
                        {activeTab === "premier" && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-md ${
                                reg.league_type === "premium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : reg.league_type === "h2h"
                                  ? "bg-red-100 text-red-800"
                                  : reg.league_type === "standard"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {reg.league_type || "N/A"}
                            </span>
                          </td>
                        )}
                        {activeTab === "premier" && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-md ${
                                reg.h2h_league
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {reg.h2h_league ? "✓" : "✗"}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-md ${
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
                        {activeTab === "premier" && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-md ${
                                reg.cash_status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : reg.cash_status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {reg.cash_status || "N/A"}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-md ${
                              reg.payment_status === "paid"
                                ? "bg-green-100 text-green-800"
                                : reg.payment_status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {reg.payment_status || "N/A"}
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
                                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
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
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3" />
                                  Registration
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600">
                                  <Mail className="w-3 h-3" />
                                  Not sent
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {reg.codes_email_sent ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800">
                                  <CheckCircle className="w-3 h-3" />
                                  Codes sent
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-yellow-100 text-yellow-800">
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
                              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                sendingEmail === reg.id
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : activeTab === "premier"
                                  ? "bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl"
                                  : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl"
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
                                      const apiEndpoint = activeTab === "premier"
                                        ? "/api/admin/registrations"
                                        : activeTab === "champions"
                                        ? "/api/admin/champions-registrations"
                                        : "/api/admin/f1-registrations";

                                      const response = await fetch(
                                        apiEndpoint,
                                        {
                                          method: "PATCH",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            id: reg.id,
                                            field: "admin_notes",
                                            value: notesValue,
                                          }),
                                        }
                                      );

                                      if (!response.ok) {
                                        throw new Error("Failed to update notes");
                                      }

                                      setEditingNotes(null);
                                      setNotesValue("");
                                      await fetchRegistrations();
                                    } catch (error) {
                                      console.error(
                                        "Error updating notes:",
                                        error
                                      );
                                      setToast({
                                        show: true,
                                        message: "Greška pri ažuriranju napomene",
                                        type: "error",
                                      });
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
                                    const apiEndpoint = activeTab === "premier"
                                      ? "/api/admin/registrations"
                                      : activeTab === "champions"
                                      ? "/api/admin/champions-registrations"
                                      : "/api/admin/f1-registrations";

                                    const response = await fetch(
                                      apiEndpoint,
                                      {
                                        method: "PATCH",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          id: reg.id,
                                          field: "league_entry_status",
                                          value: newStatus,
                                        }),
                                      }
                                    );

                                    if (!response.ok) {
                                      throw new Error(
                                        "Failed to update league status"
                                      );
                                    }

                                    setEditingLeagueStatus(null);
                                    await fetchRegistrations();
                                  } catch (error) {
                                    console.error(
                                      "Error updating league status:",
                                      error
                                    );
                                    setToast({
                                      show: true,
                                      message:
                                        "Greška pri ažuriranju statusa lige",
                                      type: "error",
                                    });
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
                                className={`px-2 py-1 text-xs font-medium rounded-md ${
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditRecord(reg)}
                              className="inline-flex items-center px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 transition-colors"
                              title="Edit registration"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(reg.id)}
                              className="inline-flex items-center px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-md hover:bg-red-600 transition-colors"
                              title="Delete registration"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`px-6 py-4 border-t rounded-b-md ${
              theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
            }`}>
              <div className="flex items-center justify-between">
                <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}>
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredRegistrations.length)} of{" "}
                  {filteredRegistrations.length} registrations
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                      theme === "dark" ? "text-gray-400 bg-gray-800 border border-gray-700 hover:bg-gray-700" : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
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
                              : theme === "dark"
                              ? "text-gray-400 bg-gray-800 border border-gray-700 hover:bg-gray-700"
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
                    className={`px-3 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                      theme === "dark" ? "text-gray-400 bg-gray-800 border border-gray-700 hover:bg-gray-700" : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
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
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-md overflow-hidden">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white rounded-md p-2 shadow-lg z-10"
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
          <div className="relative max-w-2xl bg-white rounded-md overflow-hidden shadow-2xl">
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
                <div className="w-24 h-24 bg-red-100 rounded-md flex items-center justify-center mx-auto mb-4">
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
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-md font-medium transition-all duration-200 shadow-lg"
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
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-all duration-200"
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

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  Edit Registration - {activeTab === "premier" ? "Premier League" : "Champions League"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRecord(null);
                    setEditFormData({});
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>Close</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="edit-first-name"
                    className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}
                  >
                    First Name
                  </label>
                  <input
                    id="edit-first-name"
                    type="text"
                    value={editFormData.first_name || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        first_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-last-name"
                    className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Last Name
                  </label>
                  <input
                    id="edit-last-name"
                    type="text"
                    value={editFormData.last_name || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        last_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-email"
                    className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Email
                  </label>
                  <input
                    id="edit-email"
                    type="email"
                    value={editFormData.email || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-phone"
                    className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Phone
                  </label>
                  <input
                    id="edit-phone"
                    type="text"
                    value={editFormData.phone || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                  />
                </div>

                {activeTab === "premier" && (
                  <>
                    <div>
                      <label
                        htmlFor="edit-team-name"
                        className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}
                      >
                        Team Name
                      </label>
                      <input
                        id="edit-team-name"
                        type="text"
                        value={editFormData.team_name || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            team_name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="edit-league-type"
                        className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}
                      >
                        League Type
                      </label>
                      <select
                        id="edit-league-type"
                        value={editFormData.league_type || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            league_type: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                      >
                        <option value="">N/A</option>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="h2h">H2H</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="edit-h2h-league"
                        className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}
                      >
                        H2H League
                      </label>
                      <select
                        id="edit-h2h-league"
                        value={editFormData.h2h_league ? "true" : "false"}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            h2h_league: e.target.value === "true",
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="edit-cash-status"
                        className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}
                      >
                        Cash Status
                      </label>
                      <select
                        id="edit-cash-status"
                        value={editFormData.cash_status || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            cash_status: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                      >
                        <option value="">NULL</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label
                    htmlFor="edit-payment-method"
                    className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Payment Method
                  </label>
                  <select
                    id="edit-payment-method"
                    value={editFormData.payment_method || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        payment_method: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                  >
                    <option value="bank">Bank Transfer</option>
                    <option value="wise">Wise</option>
                    <option value="cash">Cash</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="edit-payment-status"
                    className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Payment Status
                  </label>
                  <select
                    id="edit-payment-status"
                    value={editFormData.payment_status || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        payment_status: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                  >
                    <option value="">NULL</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="edit-email-template-type"
                    className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Email Template Type
                  </label>
                  <select
                    id="edit-email-template-type"
                    value={editFormData.email_template_type || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        email_template_type: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                  >
                    <option value="">Select template</option>
                    {activeTab === "premier" ? (
                      <>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="standard_h2h">Standard + H2H</option>
                        <option value="premium_h2h">Premium + H2H</option>
                      </>
                    ) : (
                      <option value="champions">Champions League</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}>
                    Reset Email Status
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditFormData({
                        ...editFormData,
                        codes_email_sent: false,
                        codes_email_sent_at: null,
                      })
                    }
                    className="w-full px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
                  >
                    Reset Email Status (Allow Resend)
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Current:{" "}
                    {editFormData.codes_email_sent ? "Sent" : "Not sent"}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="edit-admin-notes"
                    className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Admin Notes
                  </label>
                  <textarea
                    id="edit-admin-notes"
                    value={editFormData.admin_notes || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        admin_notes: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                    rows={3}
                    placeholder="Add admin notes..."
                  />
                </div>

                {activeTab === "champions" && (
                  <div className="md:col-span-2">
                    <label
                      htmlFor="edit-notes"
                      className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}
                    >
                      User Notes
                    </label>
                    <textarea
                      id="edit-notes"
                      value={editFormData.notes || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          notes: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                      rows={3}
                      placeholder="User additional notes..."
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRecord(null);
                    setEditFormData({});
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEditedRecord}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                    activeTab === "premier"
                      ? "bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600"
                      : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  }`}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Component */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}
