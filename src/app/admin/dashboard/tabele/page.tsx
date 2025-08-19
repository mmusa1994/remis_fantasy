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

  const handleSignOut = () => {
    signOut({ callbackUrl: "/admin" });
  };

  const currentLeague = leagueTypes.find(
    (league) => league.key === selectedLeague
  );
  const currentPlayers = (tables?.[selectedLeague] || [])
    .sort((a, b) => {
      // H2H leagues sort by H2H points first, then by overall points
      if (selectedLeague === 'h2hLeague' || selectedLeague === 'h2h2League') {
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
      position: index + 1 // Recalculate positions based on sorted order
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
      <header className="bg-gradient-to-r from-amber-900 to-red-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => router.push("/admin/dashboard")}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors flex-shrink-0"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
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
                  Premier League Tabele
                </h1>
                <p className="text-xs sm:text-sm opacity-75 truncate">
                  Upravljanje ligama i rangiranjem
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
        {/* Control Panel */}
        <div className="bg-white rounded-xl shadow-lg mb-8 border border-gray-100 overflow-hidden">
          {/* Header Info */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Server className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Premier League Tabele
                  </h2>
                  {source && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                        {source === "clean_table"
                          ? "Ažurirana Tabela"
                          : "Registraciona Tabela"}
                      </span>
                      {lastUpdated && (
                        <span className="text-xs text-gray-500">
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
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg shadow transition-all duration-200 text-sm font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Bulk Update
                </button>
                <button
                  onClick={refreshTables}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                  {loading ? "Učitavam" : "Osveži"}
                </button>
              </div>
            </div>
          </div>

          {/* League Filters */}
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Filteri Liga
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
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
                    className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                      isSelected
                        ? `bg-gradient-to-r from-${league.color}-500 to-${league.color}-600 text-white shadow-lg transform scale-105`
                        : `bg-${league.color}-100 text-${league.color}-800 hover:bg-${league.color}-200 border-2 border-${league.color}-300 hover:border-${league.color}-400`
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? "bg-white" : `bg-${league.color}-600`
                      }`}
                    ></div>
                    <span className="text-sm font-bold">{league.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : `bg-${league.color}-300 text-${league.color}-900`
                      }`}
                    >
                      {playerCount}
                    </span>
                    {isSelected && (
                      <div className={`absolute -top-1 -right-1 w-3 h-3 ${getIndicatorColor(league.color)} rounded-full border-2 border-white`}></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Current League Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {currentLeague?.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Ukupno igrača: {currentPlayers.length}
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Automatsko sortiranje i pozicioniranje
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-gray-600">Učitavam tabele...</p>
                </div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pozicija
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ime i prezime
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tim
                    </th>
                    {(selectedLeague === 'h2hLeague' || selectedLeague === 'h2h2League') ? (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          W/D/L
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Overall Poeni
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          H2H Poeni
                        </th>
                      </>
                    ) : (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Poeni
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Akcije
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentPlayers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={(selectedLeague === 'h2hLeague' || selectedLeague === 'h2h2League') ? 8 : 6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center">
                          <Users className="w-12 h-12 text-gray-400 mb-2" />
                          <p>Nema igrača u ovoj ligi</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentPlayers.map((player, index) => (
                      <tr
                        key={player.id}
                        className={`hover:bg-gray-100 transition-colors ${getRowBackgroundColor(player.position, selectedLeague)}`}
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
                            <span className="text-sm font-medium text-gray-900">
                              {player.firstName} {player.lastName}
                            </span>
                            <div className="text-xs text-gray-500">
                              {player.league_type}{" "}
                              {player.h2h_category &&
                                `+ ${player.h2h_category.toUpperCase()}`}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {player.email}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {player.teamName}
                          </span>
                        </td>
                        {(selectedLeague === 'h2hLeague' || selectedLeague === 'h2h2League') ? (
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
                            {editingPlayer === player.id ? (
                              <input
                                type="number"
                                value={player.points}
                                onChange={(e) =>
                                  updatePlayer(player.id, {
                                    points: parseInt(e.target.value) || 0,
                                  })
                                }
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
                      Bulk Update
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
                    <p>• Za H2H statistike koristite w, d, l (win/draw/loss) i h2h_pts</p>
                    <p>• score predstavlja overall poene, a h2h_pts H2H poene</p>
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
