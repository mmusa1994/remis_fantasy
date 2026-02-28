"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  LogOut,
  RefreshCw,
  Edit3,
  ArrowLeft,
  Users,
  Mail,
  Server,
  Upload,
  FileText,
  Check,
  X,
  Sun,
  Moon,
  Image as ImageIcon,
  Trophy,
} from "lucide-react";
import AdminGalleryManager from "@/components/admin/AdminGalleryManager";
import AdminChampionsManager from "@/components/admin/AdminChampionsManager";
import Toast from "@/components/shared/Toast";
import LoadingCard from "@/components/shared/LoadingCard";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

interface LeaguePlayer {
  id: string;
  firstName: string;
  lastName: string;
  teamName: string;
  email: string;
  points: number;
  position: number;
  league_type: string;
  h2h_category: "h2h" | "h2h2" | null;
  h2h_points: number | null;
  h2h_stats: { w: number; d: number; l: number } | null;
}

interface LeagueTables {
  premiumLeague: LeaguePlayer[];
  standardLeague: LeaguePlayer[];
  h2hLeague: LeaguePlayer[];
  h2h2League: LeaguePlayer[];
  freeLeague: LeaguePlayer[];
}

interface PremierLeagueResponse {
  tables: LeagueTables;
  totalPlayers: number;
  lastUpdated: string;
  source: string;
}

const leagueTypes = [
  { key: "premiumLeague", name: "Premium League", color: "yellow" },
  { key: "standardLeague", name: "Standard League", color: "blue" },
  { key: "h2hLeague", name: "H2H League", color: "red" },
  { key: "h2h2League", name: "H2H2 League", color: "red" },
  { key: "freeLeague", name: "Free League", color: "purple" },
];

// Function to get indicator color based on league color
const getIndicatorColor = (color: string) => {
  switch (color) {
    case "yellow":
      return "bg-yellow-400";
    case "blue":
      return "bg-blue-400";
    case "red":
      return "bg-red-400";
    case "purple":
      return "bg-purple-400";
    default:
      return "bg-yellow-400";
  }
};

export default function AdminTablesCleanPage() {
  const { t } = useTranslation("navigation");
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const { status } = useSession();
  const [season, setSeason] = useState<"25_26" | "26_27">("25_26");
  const [mainTab, setMainTab] = useState<"premier" | "champions" | "f1">(
    "premier"
  );
  const [activeSection, setActiveSection] = useState<
    "tables" | "gallery" | "champions-wall"
  >("tables");
  const [tables, setTables] = useState<LeagueTables | null>(null);
  const [selectedLeague, setSelectedLeague] =
    useState<keyof LeagueTables>("premiumLeague");
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editingFreePlayer, setEditingFreePlayer] = useState<string | null>(
    null
  );
  const [freeEditData, setFreeEditData] = useState({
    firstName: "",
    lastName: "",
    teamName: "",
    points: "",
  });
  const [loading, setLoading] = useState(true);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkUpdateData, setBulkUpdateData] = useState<string>("");
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [source, setSource] = useState<string>("");
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });
  const [updatingFromFPL, setUpdatingFromFPL] = useState<string | null>(null);
  const [fullSyncing, setFullSyncing] = useState<string | null>(null);
  const [showLoginRedirect, setShowLoginRedirect] = useState(false);

  // Load tables when component mounts and session is ready
  useEffect(() => {
    if (status === "loading") return; // Wait for session to load

    if (status === "unauthenticated") {
      setShowLoginRedirect(true);
      return;
    }

    if (status === "authenticated" && mainTab === "premier") {
      loadTables();
    }
  }, [status, mainTab, season]);

  const loadTables = async () => {
    try {
      const response = await fetch(`/api/admin/tables?season=${season}`);
      const data: PremierLeagueResponse = await response.json();
      setTables(data.tables);
      setLastUpdated(data.lastUpdated);
      setSource(data.source);
    } catch (error) {
      console.error("Error loading tables:", error);
      setToast({
        show: true,
        message: "Error loading tables",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePlayer = async (
    playerId: string,
    updates: { points?: number; h2h_category?: "h2h" | "h2h2" | null }
  ) => {
    try {
      const response = await fetch("/api/admin/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId, ...updates, season }),
      });

      if (!response.ok) {
        throw new Error("Failed to update player");
      }

      // Refresh the tables after update
      await loadTables();

      setToast({
        show: true,
        message: "Player updated successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating player:", error);
      setToast({
        show: true,
        message: "Greška pri ažuriranju igrača",
        type: "error",
      });
    }
  };

  const handleSaveFreePlayer = async (playerId: string) => {
    try {
      const response = await fetch("/api/admin/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId,
          firstName: freeEditData.firstName,
          lastName: freeEditData.lastName,
          teamName: freeEditData.teamName,
          points: parseInt(freeEditData.points) || 0,
          league_type: "free", // Explicitly set league_type for Free Liga
          season,
        }),
      });

      if (response.ok) {
        setToast({
          show: true,
          message: "Free League player updated successfully!",
          type: "success",
        });
        setEditingFreePlayer(null);
        setFreeEditData({
          firstName: "",
          lastName: "",
          teamName: "",
          points: "",
        });
        loadTables();
      } else {
        throw new Error("Failed to update player");
      }
    } catch (error) {
      console.error("Error updating free player:", error);
      setToast({
        show: true,
        message: "Error updating player",
        type: "error",
      });
    }
  };

  const bulkUpdatePlayers = async () => {
    if (!bulkUpdateData.trim()) {
      setToast({
        show: true,
        message: "Please enter JSON data for bulk update",
        type: "error",
      });
      return;
    }

    try {
      const updatesData = JSON.parse(bulkUpdateData);

      if (!updatesData.updates || !Array.isArray(updatesData.updates)) {
        throw new Error("Invalid JSON format");
      }

      setBulkUpdating(true);

      const response = await fetch("/api/admin/tables", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...updatesData, season }),
      });

      if (!response.ok) {
        throw new Error("Failed to bulk update");
      }

      const result = await response.json();

      // Refresh tables after update
      await loadTables();

      let message = `Bulk update completed! Updated ${result.updatedCount}/${result.totalUpdates} players.`;
      if (result.notFound && result.notFound.length > 0) {
        message += ` Not found: ${result.notFound.slice(0, 3).join(", ")}${
          result.notFound.length > 3 ? "..." : ""
        }`;
      }

      setToast({
        show: true,
        message,
        type: "success",
      });

      setShowBulkUpdate(false);
      setBulkUpdateData("");
    } catch (error) {
      console.error("Error during bulk update:", error);
      setToast({
        show: true,
        message: "Error during bulk update - check JSON format",
        type: "error",
      });
    } finally {
      setBulkUpdating(false);
    }
  };

  const refreshTables = async () => {
    setLoading(true);
    await loadTables();
  };

  // FPL League configurations with hardcoded IDs
  const fplLeagues = [
    {
      key: "premium",
      name: "Premium",
      id: 277005,
      color: "yellow",
      url: "https://fantasy.premierleague.com/leagues/277005/standings/c",
    },
    {
      key: "standard",
      name: "Standard",
      id: 277449,
      color: "blue",
      url: "https://fantasy.premierleague.com/leagues/277449/standings/c",
    },
    {
      key: "h2h",
      name: "H2H",
      id: 277479,
      color: "red",
      url: "https://fantasy.premierleague.com/leagues/277479/matches/h",
    },
    {
      key: "h2h2",
      name: "H2H2",
      id: 451227,
      color: "red",
      url: "https://fantasy.premierleague.com/leagues/451227/matches/h",
    },
  ];

  const updateFromFPL = async (leagueType: string) => {
    try {
      setUpdatingFromFPL(leagueType);

      const response = await fetch("/api/admin/update-from-fpl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leagueType, season }),
      });

      if (!response.ok) {
        throw new Error("Failed to update from FPL");
      }

      const result = await response.json();

      // Refresh the tables after update
      await loadTables();

      const totalInLeague =
        result.totalFPLPlayers ||
        result.updatedPlayers + (result.notFoundPlayers?.length || 0);
      let message = `${result.leagueType.toUpperCase()} league updated! Updated ${
        result.updated || result.updatedPlayers || 0
      } out of ${totalInLeague} players.`;
      if (result.notFound && result.notFound.length > 0) {
        message += ` Not found: ${result.notFound.length}`;
      }

      setToast({
        show: true,
        message,
        type: "success",
      });
    } catch (error) {
      console.error("Error updating from FPL:", error);
      setToast({
        show: true,
        message: `Error updating ${leagueType} league from FPL API`,
        type: "error",
      });
    } finally {
      setUpdatingFromFPL(null);
    }
  };

  // FULL SYNC - Briše postojeće i uvozi sve s FPL-a
  const fullSyncFromFPL = async (leagueType: string) => {
    if (!confirm(`FULL SYNC za ${leagueType.toUpperCase()}?\n\nOvo će OBRISATI sve postojeće podatke za ovu ligu i uvesti sve igrače direktno s FPL-a.\n\nNastavi?`)) {
      return;
    }

    try {
      setFullSyncing(leagueType);

      const response = await fetch("/api/admin/update-from-fpl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leagueType, fullSync: true, season }),
      });

      if (!response.ok) {
        throw new Error("Failed to full sync from FPL");
      }

      const result = await response.json();

      // Refresh the tables after sync
      await loadTables();

      setToast({
        show: true,
        message: `FULL SYNC ${leagueType.toUpperCase()}: ${result.inserted || 0} inserted, ${result.updated || 0} updated, ${result.errors || 0} errors`,
        type: result.errors > 0 ? "error" : "success",
      });
    } catch (error) {
      console.error("Error full syncing from FPL:", error);
      setToast({
        show: true,
        message: `Error full syncing ${leagueType} league`,
        type: "error",
      });
    } finally {
      setFullSyncing(null);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/admin" });
  };

  const currentLeague = leagueTypes.find(
    (league) => league.key === selectedLeague
  );
  const currentPlayers = (tables?.[selectedLeague] || [])
    .sort((a, b) => {
      // H2H leagues sort by H2H points first, then by overall points
      if (selectedLeague === "h2hLeague" || selectedLeague === "h2h2League") {
        const aH2HPoints = a.h2h_points || 0;
        const bH2HPoints = b.h2h_points || 0;

        // First sort by H2H points
        if (bH2HPoints !== aH2HPoints) {
          return bH2HPoints - aH2HPoints;
        }

        // If H2H points are equal, sort by overall points
        return b.points - a.points;
      } else {
        // Regular leagues sort by overall points only
        return b.points - a.points;
      }
    })
    .map((player, index) => ({
      ...player,
      position: index + 1, // Recalculate positions based on sorted order
    }));

  // Function to get row background color based on league and position
  const getRowBackgroundColor = (position: number, leagueKey: string) => {
    if (position === 1) {
      return isDark
        ? "bg-yellow-900/20 border-l-4 border-yellow-500"
        : "bg-gradient-to-r from-yellow-100 to-amber-100 border-l-4 border-yellow-500";
    }

    switch (leagueKey) {
      case "premiumLeague":
        if (position >= 2 && position <= 5) {
          return isDark ? "bg-yellow-900/10" : "bg-gradient-to-r from-yellow-50 to-amber-50";
        }
        break;
      case "standardLeague":
        if (position >= 2 && position <= 11) {
          return isDark ? "bg-blue-900/10" : "bg-gradient-to-r from-blue-50 to-sky-50";
        }
        break;
      case "h2hLeague":
      case "h2h2League":
        if (position >= 2 && position <= 4) {
          return isDark ? "bg-red-900/10" : "bg-gradient-to-r from-red-50 to-rose-50";
        }
        break;
    }

    return ""; // Default - no special background
  };

  if (showLoginRedirect) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-black" : "bg-gray-50"}`}>
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

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-black" : "bg-gray-50"}`}>
        <LoadingCard
          title="Loading Tables Management"
          description="Please wait while we authenticate and load the table data"
          className="w-full max-w-md mx-auto"
        />
      </div>
    );
  }

  // Redirect if not authenticated (this shouldn't render due to useEffect redirect)
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-black" : "bg-gray-50"}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-900 to-red-900 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Link
                href="/admin/dashboard"
                className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 sm:p-2 rounded-md transition-colors flex-shrink-0"
                title="Back to dashboard"
                aria-label="Back to dashboard"
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
                  Premier League Tables
                </h1>
                <p className="text-xs sm:text-sm text-white/60 truncate hidden sm:block">
                  League and ranking management
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-md transition-colors"
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleSignOut}
              className="text-white/70 hover:text-white hover:bg-white/10 p-2 sm:px-3 sm:py-2 rounded-md transition-colors flex items-center gap-2 flex-shrink-0 text-sm"
              title={t("signOut")}
              aria-label={t("signOut")}
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden lg:inline text-sm">{t("signOut")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Top-level League Tabs */}
        <div className={`mb-6 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
          <nav className="-mb-px flex">
            <button
              onClick={() => { setMainTab("premier"); setActiveSection("tables"); }}
              className={`py-2.5 px-4 border-b-2 font-medium text-sm transition-colors ${
                mainTab === "premier"
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : isDark ? "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Image src="/images/logos/pl-logo.png" alt="Premier League" width={18} height={18} className="w-[18px] h-[18px] object-contain" style={{
                  opacity: mainTab === "premier" ? 1 : 0.5,
                  filter: mainTab === "premier"
                    ? "brightness(0) saturate(100%) invert(25%) sepia(80%) saturate(4000%) hue-rotate(260deg) brightness(95%)"
                    : isDark ? "brightness(0) invert(1) opacity(0.5)" : "brightness(0) opacity(0.5)"
                }} />
                Premier League
              </div>
            </button>
            <button
              onClick={() => { setMainTab("champions"); setActiveSection("tables"); }}
              className={`py-2.5 px-4 border-b-2 font-medium text-sm transition-colors ${
                mainTab === "champions"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : isDark ? "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Image src="/images/logos/cl-logo.png" alt="Champions League" width={18} height={18} className="w-[18px] h-[18px] object-contain" style={{
                  opacity: mainTab === "champions" ? 1 : 0.5,
                  filter: mainTab === "champions"
                    ? "brightness(0) saturate(100%) invert(35%) sepia(80%) saturate(3000%) hue-rotate(200deg) brightness(95%)"
                    : isDark ? "brightness(0) invert(1) opacity(0.5)" : "brightness(0) opacity(0.5)"
                }} />
                Champions League
              </div>
            </button>
            <button
              onClick={() => { setMainTab("f1"); setActiveSection("tables"); }}
              className={`py-2.5 px-4 border-b-2 font-medium text-sm transition-colors ${
                mainTab === "f1"
                  ? "border-red-500 text-red-600 dark:text-red-400"
                  : isDark ? "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Image src="/images/logos/f1.png" alt="F1 Fantasy" width={18} height={18} className="w-[18px] h-[18px] object-contain" style={{
                  opacity: mainTab === "f1" ? 1 : 0.5,
                  filter: mainTab === "f1"
                    ? "brightness(0) saturate(100%) invert(20%) sepia(80%) saturate(5000%) hue-rotate(350deg) brightness(95%)"
                    : isDark ? "brightness(0) invert(1) opacity(0.5)" : "brightness(0) opacity(0.5)"
                }} />
                F1 Fantasy
              </div>
            </button>
          </nav>
        </div>

        {/* Sub-section Tabs */}
        <div className={`mb-6 rounded-md p-1 inline-flex gap-1 border ${isDark ? "bg-gray-900 border-gray-800" : "bg-gray-100 border-gray-200"}`}>
          <button
            onClick={() => setActiveSection("tables")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              activeSection === "tables"
                ? "bg-amber-600 text-white shadow-sm"
                : isDark ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-white"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Tabele
          </button>
          <button
            onClick={() => setActiveSection("gallery")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              activeSection === "gallery"
                ? "bg-amber-600 text-white shadow-sm"
                : isDark ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-white"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Galerija
          </button>
          <button
            onClick={() => setActiveSection("champions-wall")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              activeSection === "champions-wall"
                ? "bg-amber-600 text-white shadow-sm"
                : isDark ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-white"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Zid Šampiona
          </button>
        </div>

        {/* Gallery Manager */}
        {activeSection === "gallery" && (
          <AdminGalleryManager
            league={mainTab === "premier" ? "pl" : mainTab === "champions" ? "cl" : "f1"}
            isDark={isDark}
            onToast={(message, type) => setToast({ show: true, message, type })}
          />
        )}

        {/* Champions Wall Manager */}
        {activeSection === "champions-wall" && (
          <AdminChampionsManager
            league={mainTab === "premier" ? "pl" : mainTab === "champions" ? "cl" : "f1"}
            isDark={isDark}
            onToast={(message, type) => setToast({ show: true, message, type })}
          />
        )}

        {/* Champions League Bulk Updater */}
        {activeSection === "tables" && mainTab === "champions" && (
          <div className={`${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} rounded-md overflow-hidden border`}>
            <div className={`px-6 py-4 border-b ${isDark ? "border-gray-800 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
              <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>
                Champions League Bulk Updater (2025/26)
              </h3>
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Paste UEFA Champions League HTML content and update the
                cl_table_25_26 table.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                className={`${isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-800"} w-full min-h-[300px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
                placeholder={`Paste UEFA Champions League HTML content here. Example:\n<div class="si-data-row si-row si-cursor--pointer">\n  <div class="si-block si-name-wrp">\n    <div class="si-cell">\n      <div class="si-rank"><span>1</span><span class="si-rank-icons euro-drop-down si-winner"></span></div>\n      <div class="si-plyr-info-wrap">\n        <div class="si-plyr-info">\n          <div class="si-badge-wrap">\n            <img src="https://gaming.uefa.com/assets/avatars/scarf_19_45@2x.png">\n            <div class="si-member-num"><span>15</span></div>\n          </div>\n          <div class="si-names">\n            <span class="si-name-one">Lightbringer</span>\n            <span class="si-user-name">AmmarĆosović</span>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n  <div class="si-block si-right-data">\n    <div class="si-cell">\n      <div class="si-cell--top"><span>112</span></div>\n    </div>\n  </div>\n</div>`}
                value={bulkUpdateData}
                onChange={(e) => setBulkUpdateData(e.target.value)}
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    if (!bulkUpdateData.trim()) {
                      setToast({
                        show: true,
                        message: "Please paste Champions League HTML content",
                        type: "error",
                      });
                      return;
                    }
                    setBulkUpdating(true);
                    try {
                      const res = await fetch(
                        "/api/admin/champions-league/bulk-update",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ htmlContent: bulkUpdateData }),
                        }
                      );
                      const json = await res.json();
                      if (!res.ok || !json.success)
                        throw new Error(json.error || "Update failed");
                      setToast({
                        show: true,
                        message: `Successfully updated ${json.count} Champions League entries`,
                        type: "success",
                      });
                      setBulkUpdateData(""); // Clear the textarea after successful update
                    } catch (e: any) {
                      setToast({
                        show: true,
                        message:
                          e.message || "Champions League bulk update failed",
                        type: "error",
                      });
                    } finally {
                      setBulkUpdating(false);
                    }
                  }}
                  disabled={bulkUpdating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
                >
                  {bulkUpdating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Parse & Update
                    </>
                  )}
                </button>
                <a
                  href="/champions-league/tables"
                  className={`px-4 py-2 border rounded-md ${isDark ? "border-gray-700 text-gray-400 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Public Table
                </a>
              </div>
              <div className={`${isDark ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-200"} border rounded-md p-4`}>
                <h4 className={`font-semibold ${isDark ? "text-blue-400" : "text-blue-800"} mb-2 flex items-center gap-2`}>
                  <FileText className="w-4 h-4" />
                  Instructions:
                </h4>
                <div className={`text-sm ${isDark ? "text-blue-300" : "text-blue-700"} space-y-2`}>
                  <p>1. Go to the UEFA Champions League fantasy page</p>
                  <p>
                    2. Right-click on the leaderboard section and select
                    &quot;Inspect Element&quot;
                  </p>
                  <p>
                    3. Find the div with class &quot;si-leagues__lb&quot;
                    containing all player rows
                  </p>
                  <p>4. Copy the entire HTML content of that section</p>
                  <p>
                    5. Paste it in the textarea above and click &quot;Parse
                    &amp; Update&quot;
                  </p>
                  <p>
                    <strong>Note:</strong> The parser will extract rank, team
                    name, user name, avatar, member number, points, and status
                    (winner/loser/tie) from the HTML.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* F1 Bulk Updater */}
        {activeSection === "tables" && mainTab === "f1" && (
          <div className={`${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} rounded-md overflow-hidden border`}>
            <div className={`px-6 py-4 border-b ${isDark ? "border-gray-800 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
              <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>
                F1 Bulk Updater (2025)
              </h3>
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Paste standings text (Rank, Team, Manager, Points) and update
                Supabase table f1_table_25.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                className={`${isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-800"} w-full min-h-[220px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
                placeholder={`Paste here. Example:\nRank\tName\tPoints\n1\nSainz & Conquer\nAlmir Softic\n3377\n2\nCosine kamikaze\nAmmar Cosovic\n3307`}
                value={bulkUpdateData}
                onChange={(e) => setBulkUpdateData(e.target.value)}
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    if (!bulkUpdateData.trim()) {
                      setToast({
                        show: true,
                        message: "Please paste standings text",
                        type: "error",
                      });
                      return;
                    }
                    setBulkUpdating(true);
                    try {
                      const res = await fetch("/api/admin/f1/bulk-update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text: bulkUpdateData }),
                      });
                      const json = await res.json();
                      if (!res.ok || !json.success)
                        throw new Error(json.error || "Update failed");
                      setToast({
                        show: true,
                        message: `Updated ${json.count} entries`,
                        type: "success",
                      });
                      setBulkUpdateData(""); // Clear after success
                    } catch (e: any) {
                      setToast({
                        show: true,
                        message: e.message || "Bulk update failed",
                        type: "error",
                      });
                    } finally {
                      setBulkUpdating(false);
                    }
                  }}
                  disabled={bulkUpdating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
                >
                  {bulkUpdating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Parse & Update
                    </>
                  )}
                </button>
                <a
                  href="/f1-fantasy/tables"
                  className={`px-4 py-2 border rounded-md ${isDark ? "border-gray-700 text-gray-400 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  target="_blank"
                >
                  Open Public Table
                </a>
              </div>
            </div>

            {/* Race Info Updater */}
            <div className={`px-6 py-4 border-t ${isDark ? "border-gray-800 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
              <h4 className={`text-md font-semibold ${isDark ? "text-white" : "text-gray-800"} mb-3`}>
                Race Info (Next & Last Race)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-700"} mb-2`}>
                    Next Race
                  </label>
                  <input
                    type="text"
                    id="f1-next-race"
                    className={`${isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-800"} w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
                    placeholder="e.g., Austin"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-700"} mb-2`}>
                    Last Race
                  </label>
                  <input
                    type="text"
                    id="f1-last-race"
                    className={`${isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-800"} w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
                    placeholder="e.g., Singapore"
                  />
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={async () => {
                    const nextRaceInput = document.getElementById(
                      "f1-next-race"
                    ) as HTMLInputElement;
                    const lastRaceInput = document.getElementById(
                      "f1-last-race"
                    ) as HTMLInputElement;

                    const nextRace = nextRaceInput?.value.trim();
                    const lastRace = lastRaceInput?.value.trim();

                    if (!nextRace || !lastRace) {
                      setToast({
                        show: true,
                        message: "Please fill in both race fields",
                        type: "error",
                      });
                      return;
                    }

                    try {
                      const res = await fetch("/api/admin/f1/race-info", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ nextRace, lastRace }),
                      });
                      const json = await res.json();
                      if (!res.ok || !json.success)
                        throw new Error(json.error || "Update failed");
                      setToast({
                        show: true,
                        message: "Race info updated successfully",
                        type: "success",
                      });
                      // Clear inputs
                      nextRaceInput.value = "";
                      lastRaceInput.value = "";
                    } catch (e: any) {
                      setToast({
                        show: true,
                        message: e.message || "Race info update failed",
                        type: "error",
                      });
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Upload className="w-4 h-4" /> Update Race Info
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wrap Premier content to toggle visibility via tab */}
        <div className={mainTab !== "premier" || activeSection !== "tables" ? "hidden" : "block"}>
          {/* Season Selector Bar */}
          <div className={`flex items-center gap-3 mb-4 px-4 py-3 rounded-lg border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
            <span className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Sezona:</span>
            <div className="flex gap-1">
              <button
                onClick={() => { setSeason("25_26"); setLoading(true); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  season === "25_26"
                    ? "bg-amber-600 text-white shadow-sm"
                    : isDark ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200" : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                25/26
              </button>
              <button
                onClick={() => { setSeason("26_27"); setLoading(true); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  season === "26_27"
                    ? "bg-amber-600 text-white shadow-sm"
                    : isDark ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200" : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                26/27
              </button>
            </div>
          </div>

          {/* Control Panel */}
          <div className={`${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} rounded-md mb-4 sm:mb-6 lg:mb-8 border overflow-hidden`}>
            {/* Header Info */}
            <div className={`px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b ${isDark ? "border-gray-800 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                    <Server className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <h2 className={`text-base sm:text-lg font-bold ${isDark ? "text-white" : "text-gray-800"} truncate`}>
                      Premier League Tables
                    </h2>
                    {source && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 ${isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"} rounded-md font-medium whitespace-nowrap`}>
                          {source === "clean_table"
                            ? "Updated Table"
                            : "Registration Table"}
                        </span>
                        {lastUpdated && (
                          <span className="text-xs text-gray-500 hidden sm:inline truncate">
                            • {new Date(lastUpdated).toLocaleString("sr-RS")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBulkUpdate(true)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium"
                    aria-label="Bulk Update"
                  >
                    <Upload className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Bulk Update</span>
                    <span className="sm:hidden">Bulk</span>
                  </button>
                  <button
                    onClick={refreshTables}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium"
                    aria-label={loading ? "Loading tables" : "Refresh tables"}
                  >
                    <RefreshCw
                      className={`w-4 h-4 flex-shrink-0 ${
                        loading ? "animate-spin" : ""
                      }`}
                    />
                    <span>{loading ? "Loading" : "Refresh"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* FPL Sync Section */}
            <div className={`px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                <h3 className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  FPL Sync
                </h3>
              </div>
              <div className="space-y-3">
                {/* Update Row */}
                <div className="flex items-start sm:items-center gap-3">
                  <span className={`text-xs font-semibold w-20 shrink-0 pt-1.5 sm:pt-0 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Update:
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {fplLeagues.map((league) => (
                      <button
                        key={league.key}
                        onClick={() => updateFromFPL(league.key)}
                        disabled={updatingFromFPL === league.key || fullSyncing !== null || loading}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all duration-150 text-xs ${
                          updatingFromFPL === league.key
                            ? "bg-gray-300 cursor-not-allowed text-gray-500"
                            : league.color === "yellow"
                            ? "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-300"
                            : league.color === "blue"
                            ? "bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300"
                            : "bg-red-100 hover:bg-red-200 text-red-800 border border-red-300"
                        }`}
                        title={`Update ${league.name}`}
                      >
                        <RefreshCw
                          className={`w-3 h-3 ${
                            updatingFromFPL === league.key ? "animate-spin" : ""
                          }`}
                        />
                        <span>{updatingFromFPL === league.key ? "..." : league.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className={`border-t ${isDark ? "border-gray-800" : "border-gray-200"}`} />

                {/* Full Sync Row */}
                <div className="flex items-start sm:items-center gap-3">
                  <span className={`text-xs font-bold w-20 shrink-0 pt-1.5 sm:pt-0 ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                    Full Sync:
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {fplLeagues.map((league) => (
                      <button
                        key={`full-${league.key}`}
                        onClick={() => fullSyncFromFPL(league.key)}
                        disabled={fullSyncing === league.key || updatingFromFPL !== null || loading}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all duration-150 text-xs shadow-sm ${
                          fullSyncing === league.key
                            ? "bg-gray-400 cursor-not-allowed text-white"
                            : league.color === "yellow"
                            ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                            : league.color === "blue"
                            ? "bg-blue-500 hover:bg-blue-600 text-white"
                            : "bg-red-500 hover:bg-red-600 text-white"
                        }`}
                        title={`FULL SYNC ${league.name} - Briše i uvozi sve s FPL-a`}
                      >
                        <Upload
                          className={`w-3 h-3 ${
                            fullSyncing === league.key ? "animate-pulse" : ""
                          }`}
                        />
                        <span>{fullSyncing === league.key ? "..." : league.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* League Filters */}
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className={`text-xs sm:text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-700"} uppercase tracking-wide`}>
                  Filteri Liga
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                {leagueTypes.map((league) => {
                  const isSelected = selectedLeague === league.key;
                  const playerCount =
                    tables?.[league.key as keyof LeagueTables]?.length || 0;
                  return (
                    <button
                      key={league.key}
                      onClick={() => {
                        setSelectedLeague(league.key as keyof LeagueTables);
                        setEditingPlayer(null);
                      }}
                      className={`group relative flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-md sm:rounded-md font-semibold transition-all duration-200 touch-manipulation ${
                        isSelected
                          ? `bg-${league.color}-500 text-white shadow-lg scale-105`
                          : `bg-${league.color}-100 text-${league.color}-800 hover:bg-${league.color}-200 active:bg-${league.color}-300 border-2 border-${league.color}-300 hover:border-${league.color}-400`
                      }`}
                      aria-label={`Prikaži ${league.name} tabelu`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? "bg-white" : `bg-${league.color}-600`
                        }`}
                      ></div>
                      <span className="text-xs sm:text-sm font-bold text-center sm:text-left">
                        {league.name}
                      </span>
                      <span
                        className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-md font-bold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : `bg-${league.color}-300 text-${league.color}-900`
                        }`}
                      >
                        {playerCount}
                      </span>
                      {isSelected && (
                        <div
                          className={`absolute -top-1 -right-1 w-3 h-3 ${getIndicatorColor(
                            league.color
                          )} rounded-full border-2 border-white`}
                        ></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Current League Table */}
          <div className={`${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} rounded-md overflow-hidden border`}>
            <div className={`px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b ${isDark ? "border-gray-800 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div>
                  <h3 className={`text-base sm:text-lg font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>
                    {currentLeague?.name}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                    <p className="text-sm text-gray-600">
                      Total players:{" "}
                      <span className="font-semibold">
                        {currentPlayers.length}
                      </span>
                    </p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                      <span className="hidden sm:inline">
                        Automatic sorting and positioning
                      </span>
                      <span className="sm:hidden">Auto sort</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {loading ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <LoadingCard
                    title="Loading Tables"
                    description="Please wait while we fetch the table data"
                    className="w-full max-w-md mx-auto"
                  />
                </div>
              ) : (
                <table
                  className="min-w-full divide-y divide-gray-200"
                  role="table"
                  aria-label={`${currentLeague?.name} tabela`}
                >
                  <thead className={isDark ? "bg-gray-800" : "bg-gray-50"}>
                    <tr>
                      <th
                        className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        scope="col"
                      >
                        <span className="hidden sm:inline">Position</span>
                        <span className="sm:hidden">Pos.</span>
                      </th>
                      <th
                        className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        scope="col"
                      >
                        <span className="hidden sm:inline">Name</span>
                        <span className="sm:hidden">Name</span>
                      </th>
                      {selectedLeague !== "freeLeague" && (
                        <th
                          className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell"
                          scope="col"
                        >
                          Email
                        </th>
                      )}
                      <th
                        className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        scope="col"
                      >
                        Team
                      </th>
                      {selectedLeague === "h2hLeague" ||
                      selectedLeague === "h2h2League" ? (
                        <>
                          <th
                            className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
                            scope="col"
                          >
                            W/D/L
                          </th>
                          <th
                            className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            scope="col"
                          >
                            <span className="hidden sm:inline">
                              Overall Points
                            </span>
                            <span className="sm:hidden">Overall</span>
                          </th>
                          <th
                            className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            scope="col"
                          >
                            <span className="hidden sm:inline">H2H Points</span>
                            <span className="sm:hidden">H2H</span>
                          </th>
                        </>
                      ) : (
                        <th
                          className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          scope="col"
                        >
                          Points
                        </th>
                      )}
                      <th
                        className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        scope="col"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={isDark ? "bg-gray-900 divide-y divide-gray-800" : "bg-white divide-y divide-gray-200"}>
                    {currentPlayers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={
                            selectedLeague === "h2hLeague" ||
                            selectedLeague === "h2h2League"
                              ? 8
                              : selectedLeague === "freeLeague"
                              ? 5 // Free Liga has one less column (no email)
                              : 6
                          }
                          className="px-3 sm:px-6 py-6 sm:py-8 text-center text-gray-500"
                        >
                          <div className="flex flex-col items-center">
                            <Users className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mb-2" />
                            <p className="text-sm sm:text-base">
                              Nema igrača u ovoj ligi
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentPlayers.map((player, index) => (
                        <tr
                          key={player.id}
                          className={`${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"} transition-colors ${getRowBackgroundColor(
                            player.position,
                            selectedLeague
                          )}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-md ${
                                index === 0
                                  ? "bg-yellow-500 text-white"
                                  : index === 1
                                  ? "bg-gray-400 text-white"
                                  : index === 2
                                  ? "bg-amber-600 text-white"
                                  : `${isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"}`
                              }`}
                            >
                              <span className="font-bold text-sm">
                                {player.position}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              {selectedLeague === "freeLeague" &&
                              editingFreePlayer === player.id ? (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={freeEditData.firstName}
                                    onChange={(e) =>
                                      setFreeEditData({
                                        ...freeEditData,
                                        firstName: e.target.value,
                                      })
                                    }
                                    className={`w-20 px-2 py-1 border rounded text-sm ${isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                                    placeholder="Ime"
                                  />
                                  <input
                                    type="text"
                                    value={freeEditData.lastName}
                                    onChange={(e) =>
                                      setFreeEditData({
                                        ...freeEditData,
                                        lastName: e.target.value,
                                      })
                                    }
                                    className={`w-24 px-2 py-1 border rounded text-sm ${isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                                    placeholder="Prezime"
                                  />
                                </div>
                              ) : (
                                <span className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                                  {player.firstName} {player.lastName}
                                </span>
                              )}
                              {selectedLeague !== "freeLeague" && (
                                <div className="text-xs text-gray-500">
                                  {player.league_type}{" "}
                                  {player.h2h_category &&
                                    `+ ${player.h2h_category.toUpperCase()}`}
                                </div>
                              )}
                            </div>
                          </td>
                          {selectedLeague !== "freeLeague" && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {player.email}
                              </span>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {selectedLeague === "freeLeague" &&
                            editingFreePlayer === player.id ? (
                              <input
                                type="text"
                                value={freeEditData.teamName}
                                onChange={(e) =>
                                  setFreeEditData({
                                    ...freeEditData,
                                    teamName: e.target.value,
                                  })
                                }
                                className={`w-32 px-2 py-1 border rounded text-sm ${isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                                placeholder="Naziv tima"
                              />
                            ) : (
                              <span className="text-sm text-gray-500">
                                {player.teamName}
                              </span>
                            )}
                          </td>
                          {selectedLeague === "h2hLeague" ||
                          selectedLeague === "h2h2League" ? (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded font-bold">
                                    W: {player.h2h_stats?.w || 0}
                                  </span>
                                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded font-bold">
                                    D: {player.h2h_stats?.d || 0}
                                  </span>
                                  <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded font-bold">
                                    L: {player.h2h_stats?.l || 0}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-600">
                                  {player.points}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-bold text-blue-600">
                                  {player.h2h_points || 0}
                                </span>
                              </td>
                            </>
                          ) : (
                            <td className="px-6 py-4 whitespace-nowrap">
                              {(editingPlayer === player.id &&
                                selectedLeague !== "freeLeague") ||
                              (editingFreePlayer === player.id &&
                                selectedLeague === "freeLeague") ? (
                                <input
                                  type="number"
                                  value={
                                    selectedLeague === "freeLeague"
                                      ? freeEditData.points
                                      : player.points
                                  }
                                  onChange={(e) => {
                                    if (selectedLeague === "freeLeague") {
                                      setFreeEditData({
                                        ...freeEditData,
                                        points: e.target.value,
                                      });
                                    } else {
                                      updatePlayer(player.id, {
                                        points: parseInt(e.target.value) || 0,
                                      });
                                    }
                                  }}
                                  className={`px-2 py-1 border rounded text-sm w-20 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold ${isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                                />
                              ) : (
                                <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                                  {player.points}
                                </span>
                              )}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {selectedLeague === "freeLeague" ? (
                              <div className="flex gap-2">
                                {editingFreePlayer === player.id ? (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleSaveFreePlayer(player.id)
                                      }
                                      className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors"
                                    >
                                      <Check className="w-3 h-3 mr-1" />
                                      Sačuvaj
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingFreePlayer(null);
                                        setFreeEditData({
                                          firstName: "",
                                          lastName: "",
                                          teamName: "",
                                          points: "",
                                        });
                                      }}
                                      className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                                    >
                                      <X className="w-3 h-3 mr-1" />
                                      Otkaži
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingFreePlayer(player.id);
                                      setFreeEditData({
                                        firstName: player.firstName,
                                        lastName: player.lastName,
                                        teamName: player.teamName,
                                        points: player.points.toString(),
                                      });
                                    }}
                                    className="inline-flex items-center px-4 py-2 text-xs font-medium rounded-md bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                                  >
                                    <Edit3 className="w-3 h-3 mr-1" />
                                    Uredi sve
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  setEditingPlayer(
                                    editingPlayer === player.id
                                      ? null
                                      : player.id
                                  )
                                }
                                className={`inline-flex items-center px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                                  editingPlayer === player.id
                                    ? "bg-green-500 text-white hover:bg-green-600"
                                    : "bg-blue-500 text-white hover:bg-blue-600"
                                }`}
                              >
                                <Edit3 className="w-3 h-3 mr-1" />
                                {editingPlayer === player.id
                                  ? "Finish"
                                  : "Edit Points"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Bulk Update Modal */}
          {showBulkUpdate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className={`${isDark ? "bg-gray-900 border-gray-800" : "bg-white"} rounded-md shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
                <div className={`p-6 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-800"} flex items-center gap-2`}>
                        <Upload className="w-6 h-6 text-green-600" />
                        Bulk Update
                      </h3>
                      <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"} mt-1`}>
                        Update points or H2H categories for multiple players at
                        once using JSON format
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowBulkUpdate(false);
                        setBulkUpdateData("");
                      }}
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
                </div>

                <div className="p-6">
                  {/* Format Example */}
                  <div className="mb-6">
                    <h4 className={`font-semibold ${isDark ? "text-gray-300" : "text-gray-700"} mb-3 flex items-center gap-2`}>
                      <FileText className="w-4 h-4" />
                      Data Format:
                    </h4>
                    <div className={`${isDark ? "bg-gray-800" : "bg-gray-100"} rounded-md p-4 text-xs`}>
                      <h5 className={`font-semibold mb-2 ${isDark ? "text-white" : "text-gray-800"}`}>
                        For updating points:
                      </h5>
                      <pre className={isDark ? "text-gray-300 mb-4" : "text-gray-700 mb-4"}>{`{
  "updates": [
    {
      "rank": 1,
      "team": "Team name",
      "manager": "Manager name",
      "gw": 81,
      "total": 81
    },
    {
      "rank": 2,
      "team": "Second team",
      "manager": "Second manager",
      "gw": 79,
      "total": 79
    }
  ]
}`}</pre>

                      <h5 className={`font-semibold mb-2 ${isDark ? "text-white" : "text-gray-800"}`}>
                        For updating H2H statistics (W/D/L and H2H points):
                      </h5>
                      <pre className={isDark ? "text-gray-300" : "text-gray-700"}>{`{
  "updates": [
    { 
      "rank": 1, 
      "team": "Šala Mala", 
      "manager": "Maid Suljakovic", 
      "w": 1, 
      "d": 0, 
      "l": 0, 
      "score": 83, 
      "h2h_pts": 3 
    },
    { 
      "rank": 2, 
      "team": "Zrinjski", 
      "manager": "Matej Džalto", 
      "w": 1, 
      "d": 0, 
      "l": 0, 
      "score": 81, 
      "h2h_pts": 3 
    },
    { 
      "rank": 21, 
      "team": "Visocki zeleni", 
      "manager": "Enes Skopljak", 
      "w": 0, 
      "d": 0, 
      "l": 1, 
      "score": 70, 
      "h2h_pts": 0 
    }
  ]
}`}</pre>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                      <p>
                        • System searches for players by team name and manager
                      </p>
                      <p>• For points use total field</p>
                      <p>
                        • For H2H statistics use w, d, l (win/draw/loss) and
                        h2h_pts
                      </p>
                      <p>
                        • score represents overall points, and h2h_pts H2H
                        points
                      </p>
                      <p>
                        • You can combine different types in the same request
                      </p>
                    </div>
                  </div>

                  {/* JSON Input */}
                  <div className="mb-6">
                    <label className={`block text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-700"} mb-2`}>
                      JSON Data:
                    </label>
                    <textarea
                      value={bulkUpdateData}
                      onChange={(e) => setBulkUpdateData(e.target.value)}
                      className={`w-full h-64 px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-mono ${isDark ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                      placeholder="Enter JSON data here..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => {
                        setShowBulkUpdate(false);
                        setBulkUpdateData("");
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={bulkUpdatePlayers}
                      disabled={bulkUpdating || !bulkUpdateData.trim()}
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload
                        className={`w-4 h-4 ${
                          bulkUpdating ? "animate-pulse" : ""
                        }`}
                      />
                      {bulkUpdating ? "Updating..." : "Update"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

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
