"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Crown,
  Upload,
  Eye,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Toast from "@/components/shared/Toast";
import LoadingCard from "@/components/shared/LoadingCard";
import Link from "next/link";
import Image from "next/image";

interface ChampionsLeaguePlayer {
  id: number;
  rank: number;
  team_name: string;
  user_name: string;
  avatar_url: string;
  member_number: number;
  points: number;
  last_md_points: number;
  is_winner: boolean;
  is_loser: boolean;
  is_tie: boolean;
}

export default function ChampionsLeagueAdmin() {
  const { status } = useSession();
  const [players, setPlayers] = useState<ChampionsLeaguePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [payloadText, setPayloadText] = useState("");
  const [parsedData, setParsedData] = useState<ChampionsLeaguePlayer[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  useEffect(() => {
    if (status === "authenticated") {
      fetchTableData();
    }
  }, [status]);

  const fetchTableData = async () => {
    try {
      const response = await fetch("/api/champions-league/table");
      if (!response.ok) {
        throw new Error("Failed to fetch table data");
      }
      const data = await response.json();
      setPlayers(data.data || []);
    } catch (error) {
      console.error("Error fetching table data:", error);
      setToast({
        show: true,
        message: "Greška pri učitavanju tabele",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const parseUEFAPayload = (htmlText: string): ChampionsLeaguePlayer[] => {
    const parsed: ChampionsLeaguePlayer[] = [];

    // Extract table rows using regex pattern for UEFA gaming structure
    const tableRowPattern =
      /<tr[^>]*data-testid="league-table-row"[^>]*>(.*?)<\/tr>/gi;
    const matches = htmlText.match(tableRowPattern);

    if (!matches) {
      throw new Error("No table rows found in payload");
    }

    matches.forEach((row, index) => {
      try {
        // Extract rank
        const rankMatch = row.match(
          /data-testid="league-table-rank"[^>]*>(\d+)/
        );
        const rank = rankMatch ? parseInt(rankMatch[1]) : index + 1;

        // Extract team name
        const teamNameMatch = row.match(
          /data-testid="league-table-team-name"[^>]*>([^<]+)/
        );
        const team_name = teamNameMatch
          ? teamNameMatch[1].trim()
          : `Team ${index + 1}`;

        // Extract user name
        const userNameMatch = row.match(
          /data-testid="league-table-manager-name"[^>]*>([^<]+)/
        );
        const user_name = userNameMatch
          ? userNameMatch[1].trim()
          : `User ${index + 1}`;

        // Extract points
        const pointsMatch = row.match(
          /data-testid="league-table-points"[^>]*>(\d+)/
        );
        const points = pointsMatch ? parseInt(pointsMatch[1]) : 0;

        // Extract avatar URL
        const avatarMatch =
          row.match(/src="([^"]*avatars[^"]*)"/) ||
          row.match(/src="([^"]*avatar[^"]*)"/) ||
          row.match(/src="([^"]*scarf[^"]*)"/);
        const avatar_url = avatarMatch
          ? avatarMatch[1]
          : "https://gaming.uefa.com/assets/avatars/scarf_19_45@2x.png";

        // Extract member number (if available)
        const memberMatch = row.match(/member[^>]*>(\d+)/i);
        const member_number = memberMatch
          ? parseInt(memberMatch[1])
          : Math.floor(Math.random() * 50) + 1;

        parsed.push({
          id: index + 1,
          rank,
          team_name,
          user_name,
          avatar_url,
          member_number,
          points,
          last_md_points: points, // Assuming current points are MD1 points for now
          is_winner: rank <= 3,
          is_loser: false,
          is_tie: false,
        });
      } catch (error) {
        console.error(`Error parsing row ${index + 1}:`, error);
      }
    });

    return parsed.sort((a, b) => a.rank - b.rank);
  };

  const handleParsePayload = () => {
    if (!payloadText.trim()) {
      setToast({
        show: true,
        message: "Molimo unesite UEFA payload",
        type: "error",
      });
      return;
    }

    try {
      const parsed = parseUEFAPayload(payloadText);
      if (parsed.length === 0) {
        throw new Error("No data could be parsed from payload");
      }

      setParsedData(parsed);
      setShowPreview(true);
      setToast({
        show: true,
        message: `Uspešno parsirano ${parsed.length} igrača`,
        type: "success",
      });
    } catch (error) {
      console.error("Error parsing payload:", error);
      setToast({
        show: true,
        message: `Greška pri parsiranju: ${
          error instanceof Error ? error.message : "Nepoznata greška"
        }`,
        type: "error",
      });
    }
  };

  const handleSaveData = async () => {
    if (parsedData.length === 0) {
      setToast({
        show: true,
        message: "Nema podataka za čuvanje",
        type: "error",
      });
      return;
    }

    setUploading(true);
    try {
      const response = await fetch("/api/champions-league/table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          players: parsedData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save data");
      }

      const result = await response.json();
      setToast({
        show: true,
        message: result.message || "Podaci su uspešno sačuvani!",
        type: "success",
      });

      // Refresh the table data
      await fetchTableData();

      // Clear the form
      setPayloadText("");
      setParsedData([]);
      setShowPreview(false);
    } catch (error) {
      console.error("Error saving data:", error);
      setToast({
        show: true,
        message: "Greška pri čuvanju podataka",
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClearTable = async () => {
    if (
      !confirm("Da li ste sigurni da želite da obrišete sve podatke iz tabele?")
    ) {
      return;
    }

    setUploading(true);
    try {
      const response = await fetch("/api/champions-league/table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          players: [],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to clear table");
      }

      setToast({
        show: true,
        message: "Tabela je uspešno obrisana!",
        type: "success",
      });

      setPlayers([]);
    } catch (error) {
      console.error("Error clearing table:", error);
      setToast({
        show: true,
        message: "Greška pri brisanju tabele",
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingCard title="Loading Champions League Admin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-gray-800">Access denied. Please login.</p>
          <Link
            href="/admin"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
          >
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Champions League Admin</h1>
                <p className="text-blue-100 text-sm">
                  Upravljanje Champions League tabelom
                </p>
              </div>
            </div>
            <Link
              href="/admin/dashboard"
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              ← Nazad na Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Table Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Ukupno igrača
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  {players.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Poslednja ažuriranja
                </h3>
                <p className="text-sm text-gray-900">
                  {players.length > 0 ? "Aktuelna sezona" : "Nema podataka"}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p
                  className={`text-sm font-medium ${
                    players.length > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {players.length > 0 ? "Aktivan" : "Prazan"}
                </p>
              </div>
              <div
                className={`w-12 h-12 bg-gradient-to-r ${
                  players.length > 0
                    ? "from-green-500 to-green-600"
                    : "from-red-500 to-red-600"
                } rounded-lg flex items-center justify-center`}
              >
                {players.length > 0 ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-white" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              UEFA Payload Import
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UEFA Gaming HTML Payload
              </label>
              <textarea
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-sm font-mono"
                placeholder="Ovde nalepite HTML kod sa UEFA gaming stranice..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Idite na UEFA gaming stranicu → Inspect Element → Copy outer
                HTML tabele
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleParsePayload}
                disabled={!payloadText.trim() || uploading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="w-4 h-4" />
                Parse & Preview
              </button>

              {showPreview && (
                <button
                  onClick={handleSaveData}
                  disabled={uploading || parsedData.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save to Database
                    </>
                  )}
                </button>
              )}

              {players.length > 0 && (
                <button
                  onClick={handleClearTable}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Table
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Preview Section */}
        {showPreview && parsedData.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Preview - {parsedData.length} igrača
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rang
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tim
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Igrač
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bodovi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member #
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parsedData.slice(0, 10).map((player) => (
                    <tr
                      key={player.id}
                      className={player.rank <= 3 ? "bg-yellow-50" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {player.rank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {player.team_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {player.user_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {player.points}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {player.member_number}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 10 && (
                <p className="text-center text-gray-500 py-4">
                  ... i još {parsedData.length - 10} igrača
                </p>
              )}
            </div>
          </div>
        )}

        {/* Current Table */}
        {players.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">
                Trenutna Champions League Tabela
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {players.length} igrača u bazi podataka
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rang
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tim
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Igrač
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MD1 Bodovi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ukupno Bodovi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member #
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {players.map((player) => (
                    <tr
                      key={player.id}
                      className={
                        player.rank === 1
                          ? "bg-yellow-50"
                          : player.rank === 2
                          ? "bg-gray-50"
                          : player.rank === 3
                          ? "bg-orange-50"
                          : "hover:bg-gray-50"
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {player.rank}
                          {player.rank === 1 && (
                            <span className="text-yellow-500">🏆</span>
                          )}
                          {player.rank === 2 && (
                            <span className="text-gray-400">🥈</span>
                          )}
                          {player.rank === 3 && (
                            <span className="text-orange-500">🥉</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {player.team_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-3">
                          <Image
                            src={player.avatar_url}
                            alt="Avatar"
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full"
                          />
                          {player.user_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {player.last_md_points}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                        {player.points}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {player.member_number}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Links
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/champions-league/tables"
              target="_blank"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-purple-100 transition-all duration-200"
            >
              <Eye className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-800">
                  Pregledaj javnu tabelu
                </div>
                <div className="text-sm text-blue-600">Otvori u novom tabu</div>
              </div>
            </Link>

            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
            >
              <Crown className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-800">Admin Dashboard</div>
                <div className="text-sm text-gray-600">
                  Nazad na glavni panel
                </div>
              </div>
            </Link>
          </div>
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
