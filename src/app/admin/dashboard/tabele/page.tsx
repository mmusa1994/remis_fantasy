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
  RotateCcw,
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
  { key: "h2h2League", name: "H2H2 Liga", color: "purple" },
];

export default function AdminTablesCleanPage() {
  const { data: status } = useSession();
  const router = useRouter();
  const [tables, setTables] = useState<LeagueTables | null>(null);
  const [selectedLeague, setSelectedLeague] =
    useState<keyof LeagueTables>("premiumLeague");
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
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

  const migrateData = async () => {
    if (
      !confirm(
        "Da li ste sigurni da želite da migrirate podatke iz registracione tabele? Ovo će prepisati postojeće podatke."
      )
    ) {
      return;
    }

    setMigrating(true);
    try {
      const response = await fetch("/api/admin/tabele", {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Failed to migrate data");
      }

      const result = await response.json();

      // Refresh tables after migration
      await loadTables();

      setToast({
        show: true,
        message: `Migracija završena! Migrirano je ${result.migratedRecords} igrača.`,
        type: "success",
      });
    } catch (error) {
      console.error("Error during migration:", error);
      setToast({
        show: true,
        message: "Greška pri migraciji podataka",
        type: "error",
      });
    } finally {
      setMigrating(false);
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
  const currentPlayers = tables?.[selectedLeague] || [];

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
                  Premier League - Tabele
                </h1>
                <p className="text-xs sm:text-sm opacity-75 truncate">
                  Optimizovana tabela za upravljanje ligama
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
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-bold text-gray-800">
                  Premier League Čista Tabela
                </h2>
                {source && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    {source === "clean_table"
                      ? "Čista Tabela"
                      : "Registraciona Tabela"}
                  </span>
                )}
              </div>
              {lastUpdated && (
                <p className="text-sm text-gray-500 mb-4">
                  Poslednje ažurirano:{" "}
                  {new Date(lastUpdated).toLocaleString("sr-RS")}
                </p>
              )}

              {/* League Selector */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {leagueTypes.map((league) => (
                  <button
                    key={league.key}
                    onClick={() => {
                      setSelectedLeague(league.key as keyof LeagueTables);
                      setEditingPlayer(null);
                    }}
                    className={`p-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                      selectedLeague === league.key
                        ? `bg-${league.color}-500 text-white shadow-lg`
                        : `bg-${league.color}-100 text-${league.color}-700 hover:bg-${league.color}-200`
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{league.name}</span>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {tables?.[league.key as keyof LeagueTables]?.length || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkUpdate(true)}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg shadow-lg transition-all duration-200"
              >
                <Upload className="w-5 h-5" />
                Bulk Update
              </button>
              <button
                onClick={migrateData}
                disabled={migrating}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw
                  className={`w-5 h-5 ${migrating ? "animate-spin" : ""}`}
                />
                {migrating ? "Migriram..." : "Migracija"}
              </button>
              <button
                onClick={refreshTables}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Učitavam..." : "Osveži"}
              </button>
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
                <p className="text-xs text-green-600 mt-1">
                  💎 Optimizovana tabela sa automatskim sortiranjem pozicija
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Poeni
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    H2H Kategorija
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPlayers.map((player, index) => (
                  <tr
                    key={player.id}
                    className={`hover:bg-gray-50 ${
                      index < 3
                        ? "bg-gradient-to-r from-yellow-50 to-amber-50"
                        : ""
                    }`}
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
                          className="px-2 py-1 border border-gray-300 rounded text-sm w-20 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-gray-900">
                          {player.points}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={player.h2h_category || ""}
                        onChange={(e) =>
                          updatePlayer(player.id, {
                            h2h_category:
                              e.target.value === ""
                                ? null
                                : (e.target.value as "h2h" | "h2h2"),
                          })
                        }
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Nema H2H</option>
                        <option value="h2h">H2H Liga</option>
                        <option value="h2h2">H2H2 Liga</option>
                      </select>
                    </td>
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
                        {editingPlayer === player.id ? "Završi" : "Uredi poene"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                      Bulk Update Poena
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Ažurirajte poene za više igrača odjednom koristeći JSON
                      format
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
                    <pre className="text-gray-700">{`{
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
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * Sistem traži igrače po nazivu tima i ažurira njihove
                    ukupne poene
                  </p>
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
                    {bulkUpdating ? "Ažuriram..." : "Ažuriraj Poene"}
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
