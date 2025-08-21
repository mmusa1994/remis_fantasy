"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import Toast from "@/components/shared/Toast";

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
  { key: "premiumLeague", name: "Premium Liga", color: "yellow" },
  { key: "standardLeague", name: "Standard Liga", color: "blue" },
  { key: "h2hLeague", name: "H2H Liga", color: "red" },
  { key: "h2h2League", name: "H2H2 Liga", color: "red" },
  { key: "freeLeague", name: "Free Liga", color: "purple" },
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
  const { status } = useSession();
  const router = useRouter();
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

  // Load tables when component mounts and session is ready
  useEffect(() => {
    if (status === "loading") return; // Wait for session to load

    if (status === "unauthenticated") {
      router.push("/admin");
      return;
    }

    if (status === "authenticated") {
      loadTables();
    }
  }, [status, router]);

  const loadTables = async () => {
    try {
      const response = await fetch("/api/admin/tabele");
      const data: PremierLeagueResponse = await response.json();
      setTables(data.tables);
      setLastUpdated(data.lastUpdated);
      setSource(data.source);
    } catch (error) {
      console.error("Error loading tables:", error);
      setToast({
        show: true,
        message: "Greška pri učitavanju tabela",
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
      const response = await fetch("/api/admin/tabele", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId, ...updates }),
      });

      if (!response.ok) {
        throw new Error("Failed to update player");
      }

      // Refresh the tables after update
      await loadTables();

      setToast({
        show: true,
        message: "Igrač je uspešno ažuriran!",
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
      const response = await fetch("/api/admin/tabele", {
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
        }),
      });

      if (response.ok) {
        setToast({
          show: true,
          message: "Free Liga igrač uspešno ažuriran!",
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
        message: "Greška pri ažuriranju igrača",
        type: "error",
      });
    }
  };

  const bulkUpdatePlayers = async () => {
    if (!bulkUpdateData.trim()) {
      setToast({
        show: true,
        message: "Molimo unesite JSON podatke za bulk update",
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

      const response = await fetch("/api/admin/tabele", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatesData),
      });

      if (!response.ok) {
        throw new Error("Failed to bulk update");
      }

      const result = await response.json();

      // Refresh tables after update
      await loadTables();

      let message = `Bulk update završen! Ažurirano ${result.updatedCount}/${result.totalUpdates} igrača.`;
      if (result.notFound && result.notFound.length > 0) {
        message += ` Nisu pronađeni: ${result.notFound.slice(0, 3).join(", ")}${
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
        message: "Greška pri bulk update - proverite JSON format",
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
        body: JSON.stringify({ leagueType }),
      });

      if (!response.ok) {
        throw new Error("Failed to update from FPL");
      }

      const result = await response.json();

      // Refresh the tables after update
      await loadTables();

      let message = `${result.leagueType.toUpperCase()} liga ažurirana! Ažurirano ${
        result.updatedCount
      } igrača iz FPL API-ja.`;
      if (result.notFoundPlayers && result.notFoundPlayers.length > 0) {
        message += ` Nisu pronađeni: ${result.notFoundPlayers
          .slice(0, 3)
          .join(", ")}${result.notFoundPlayers.length > 3 ? "..." : ""}`;
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
        message: `Greška pri ažuriranju ${leagueType} lige iz FPL API-ja`,
        type: "error",
      });
    } finally {
      setUpdatingFromFPL(null);
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
      // First place is always gold for all leagues
      return "bg-gradient-to-r from-yellow-100 to-amber-100 border-l-4 border-yellow-500";
    }

    switch (leagueKey) {
      case "premiumLeague":
        if (position >= 2 && position <= 5) {
          return "bg-gradient-to-r from-yellow-50 to-amber-50";
        }
        break;
      case "standardLeague":
        if (position >= 2 && position <= 11) {
          return "bg-gradient-to-r from-blue-50 to-sky-50";
        }
        break;
      case "h2hLeague":
      case "h2h2League":
        if (position >= 2 && position <= 4) {
          return "bg-gradient-to-r from-red-50 to-rose-50";
        }
        break;
    }

    return ""; // Default - no special background
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Učitavam...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated (this shouldn't render due to useEffect redirect)
  if (status === "unauthenticated") {
    return null;
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
                title="Nazad na dashboard"
                aria-label="Nazad na dashboard"
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
                  Premier League Tabele
                </h1>
                <p className="text-xs sm:text-sm opacity-75 truncate hidden sm:block">
                  Upravljanje ligama i rangiranjem
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-white/20 hover:bg-white/30 p-1.5 sm:p-2 lg:px-4 lg:py-2 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 flex-shrink-0 touch-manipulation"
              title="Odjavi se"
              aria-label="Odjavi se"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden lg:inline text-sm">Odjavi se</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Control Panel */}
        <div className="bg-white rounded-xl shadow-lg mb-4 sm:mb-6 lg:mb-8 border border-gray-100 overflow-hidden">
          {/* Header Info */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
            <div className="space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Server className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-gray-800 truncate">
                    Premier League Tabele
                  </h2>
                  {source && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium whitespace-nowrap">
                        {source === "clean_table"
                          ? "Ažurirana Tabela"
                          : "Registraciona Tabela"}
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {/* Main Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBulkUpdate(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg shadow transition-all duration-200 text-xs sm:text-sm font-medium touch-manipulation"
                    aria-label="Grupno ažuriranje"
                  >
                    <Upload className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Grupno ažuriranje</span>
                    <span className="sm:hidden">Grupno</span>
                  </button>
                  <button
                    onClick={refreshTables}
                    disabled={loading}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium touch-manipulation"
                    aria-label={loading ? "Učitavam tabele" : "Osveži tabele"}
                  >
                    <RefreshCw
                      className={`w-4 h-4 flex-shrink-0 ${
                        loading ? "animate-spin" : ""
                      }`}
                    />
                    <span>{loading ? "Učitavam" : "Osveži"}</span>
                  </button>
                </div>

                {/* FPL Sync Buttons */}
                <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg sm:rounded-none sm:ml-2 sm:pl-3 sm:border-l sm:border-gray-300">
                  <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
                    FPL:
                  </span>
                  <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                    {fplLeagues.map((league) => (
                      <button
                        key={league.key}
                        onClick={() => updateFromFPL(league.key)}
                        disabled={updatingFromFPL === league.key || loading}
                        className={`relative flex items-center gap-1 px-2 py-1 rounded font-medium transition-all duration-150 whitespace-nowrap touch-manipulation ${
                          updatingFromFPL === league.key
                            ? "bg-gray-300 cursor-not-allowed text-gray-500"
                            : `bg-${league.color}-100 hover:bg-${league.color}-200 text-${league.color}-700 hover:text-${league.color}-800 active:bg-${league.color}-300`
                        } text-xs border border-${
                          league.color
                        }-200 hover:border-${league.color}-300`}
                        title={`Ažuriraj ${league.name} ligu (ID: ${league.id})`}
                        aria-label={`Ažuriraj ${league.name} ligu`}
                      >
                        <RefreshCw
                          className={`w-3 h-3 flex-shrink-0 ${
                            updatingFromFPL === league.key ? "animate-spin" : ""
                          }`}
                        />
                        <span className="font-semibold">
                          {updatingFromFPL === league.key ? "..." : league.name}
                        </span>
                        {updatingFromFPL !== league.key && (
                          <div
                            className="w-1.5 h-1.5 bg-green-500 rounded-full opacity-60 flex-shrink-0"
                            aria-hidden="true"
                          ></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* League Filters */}
          <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
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
                    className={`group relative flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 touch-manipulation ${
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
                      className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold ${
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
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                  {currentLeague?.name}
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                  <p className="text-sm text-gray-600">
                    Ukupno igrača:{" "}
                    <span className="font-semibold">
                      {currentPlayers.length}
                    </span>
                  </p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                    <span className="hidden sm:inline">
                      Automatsko sortiranje i pozicioniranje
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
                <div className="text-center">
                  <p className="text-sm sm:text-base text-gray-600">
                    Učitavam tabele...
                  </p>
                </div>
              </div>
            ) : (
              <table
                className="min-w-full divide-y divide-gray-200"
                role="table"
                aria-label={`${currentLeague?.name} tabela`}
              >
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      scope="col"
                    >
                      <span className="hidden sm:inline">Pozicija</span>
                      <span className="sm:hidden">Poz.</span>
                    </th>
                    <th
                      className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      scope="col"
                    >
                      <span className="hidden sm:inline">Ime i prezime</span>
                      <span className="sm:hidden">Ime</span>
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
                      Tim
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
                            Overall Poeni
                          </span>
                          <span className="sm:hidden">Overall</span>
                        </th>
                        <th
                          className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          scope="col"
                        >
                          <span className="hidden sm:inline">H2H Poeni</span>
                          <span className="sm:hidden">H2H</span>
                        </th>
                      </>
                    ) : (
                      <th
                        className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        scope="col"
                      >
                        Poeni
                      </th>
                    )}
                    <th
                      className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      scope="col"
                    >
                      Akcije
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
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
                        className={`hover:bg-gray-100 transition-colors ${getRowBackgroundColor(
                          player.position,
                          selectedLeague
                        )}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full ${
                              index === 0
                                ? "bg-yellow-500 text-white"
                                : index === 1
                                ? "bg-gray-400 text-white"
                                : index === 2
                                ? "bg-amber-600 text-white"
                                : "bg-gray-100 text-gray-700"
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
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
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
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                  placeholder="Prezime"
                                />
                              </div>
                            ) : (
                              <span className="text-sm font-medium text-gray-900">
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
                              className="w-32 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
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
                                className="px-2 py-1 border border-gray-300 rounded text-sm w-20 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-gray-900 font-semibold"
                              />
                            ) : (
                              <span className="text-sm font-semibold text-gray-900">
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
                                  editingPlayer === player.id ? null : player.id
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
                                ? "Završi"
                                : "Uredi poene"}
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
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <Upload className="w-6 h-6 text-green-600" />
                      Grupno ažuriranje
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Ažurirajte poene ili H2H kategorije za više igrača
                      odjednom koristeći JSON format
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
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Format podataka:
                  </h4>
                  <div className="bg-gray-100 rounded-lg p-4 text-xs">
                    <h5 className="font-semibold mb-2 text-gray-800">
                      Za ažuriranje poena:
                    </h5>
                    <pre className="text-gray-700 mb-4">{`{
  "updates": [
    {
      "rank": 1,
      "team": "Naziv tima",
      "manager": "Ime menadžera", 
      "gw": 81,
      "total": 81
    },
    {
      "rank": 2,
      "team": "Drugi tim",
      "manager": "Drugi menadžer",
      "gw": 79,
      "total": 79
    }
  ]
}`}</pre>

                    <h5 className="font-semibold mb-2 text-gray-800">
                      Za ažuriranje H2H statistika (W/D/L i H2H poeni):
                    </h5>
                    <pre className="text-gray-700">{`{
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
                    <p>• Sistem traži igrače po nazivu tima i menadžera</p>
                    <p>• Za poene koristite total field</p>
                    <p>
                      • Za H2H statistike koristite w, d, l (win/draw/loss) i
                      h2h_pts
                    </p>
                    <p>
                      • score predstavlja overall poene, a h2h_pts H2H poene
                    </p>
                    <p>• Možete kombinovati različite tipove u istom zahtev</p>
                  </div>
                </div>

                {/* JSON Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    JSON Podaci:
                  </label>
                  <textarea
                    value={bulkUpdateData}
                    onChange={(e) => setBulkUpdateData(e.target.value)}
                    className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-mono text-gray-900 bg-white placeholder-gray-500"
                    placeholder="Unesite JSON podatke ovde..."
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
                    Otkaži
                  </button>
                  <button
                    onClick={bulkUpdatePlayers}
                    disabled={bulkUpdating || !bulkUpdateData.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload
                      className={`w-4 h-4 ${
                        bulkUpdating ? "animate-pulse" : ""
                      }`}
                    />
                    {bulkUpdating ? "Ažuriram..." : "Ažuriraj"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
