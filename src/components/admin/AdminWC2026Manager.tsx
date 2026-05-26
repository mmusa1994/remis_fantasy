"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  Trophy,
  Calendar,
  Users,
  Table2,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Sun,
  Moon,
  LogOut,
  X,
  Check,
  Upload,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import Toast from "@/components/shared/Toast";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WCMatch {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  phase: string;
  group_name: string | null;
  venue: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  created_at?: string;
}

interface WCGroup {
  id?: string;
  group_name: string;
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

interface WCTableEntry {
  id?: string;
  rank?: number;
  team_name: string;
  user_name: string;
  points: number;
  [key: string]: unknown;
}

interface WCRegistration {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email: string;
  phone?: string;
  team_name?: string;
  payment_method?: string;
  payment_status?: string;
  created_at: string;
}

type TabKey = "matches" | "groups" | "standings" | "registrations";

const PHASES = [
  { value: "group_stage", label: "Group Stage" },
  { value: "round_of_32", label: "Round of 32" },
  { value: "round_of_16", label: "Round of 16" },
  { value: "quarter_finals", label: "Quarter Finals" },
  { value: "semi_finals", label: "Semi Finals" },
  { value: "third_place", label: "Third Place" },
  { value: "final", label: "Final" },
];

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const MATCH_STATUSES = [
  { value: "scheduled", label: "Scheduled" },
  { value: "live", label: "Live" },
  { value: "finished", label: "Finished" },
  { value: "postponed", label: "Postponed" },
];

// ---------------------------------------------------------------------------
// Default group data generator (placeholder 48-team WC2026 draw)
// ---------------------------------------------------------------------------

function generateDefaultGroups(): WCGroup[] {
  const groups: WCGroup[] = [];
  for (const g of GROUPS) {
    for (let i = 1; i <= 4; i++) {
      groups.push({
        group_name: g,
        team_name: `Team ${g}${i}`,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0,
      });
    }
  }
  return groups;
}

// ===========================================================================
// Component
// ===========================================================================

export default function AdminWC2026Manager() {
  const { theme, toggleTheme } = useTheme();
  const { data: session, status } = useSession();
  const isDark = theme === "dark";

  // ---- tabs ----
  const [activeTab, setActiveTab] = useState<TabKey>("matches");

  // ---- toast ----
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ show: true, message, type });
    },
    []
  );

  // ---- matches state ----
  const [matches, setMatches] = useState<WCMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchForm, setMatchForm] = useState({
    home_team: "",
    away_team: "",
    match_date: "",
    phase: "group_stage",
    group_name: "",
    venue: "",
  });
  const [submittingMatch, setSubmittingMatch] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editMatchData, setEditMatchData] = useState<{
    home_score: string;
    away_score: string;
    status: string;
  }>({ home_score: "", away_score: "", status: "scheduled" });
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);

  // ---- groups state ----
  const [groups, setGroups] = useState<WCGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupJson, setGroupJson] = useState("");
  const [submittingGroups, setSubmittingGroups] = useState(false);

  // ---- standings (fantasy table) state ----
  const [tableEntries, setTableEntries] = useState<WCTableEntry[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [tableHtml, setTableHtml] = useState("");
  const [parsedTable, setParsedTable] = useState<WCTableEntry[]>([]);
  const [submittingTable, setSubmittingTable] = useState(false);

  // ---- registrations state ----
  const [registrations, setRegistrations] = useState<WCRegistration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  // ---- fetch helpers ----

  const fetchMatches = useCallback(async () => {
    setLoadingMatches(true);
    try {
      const res = await fetch("/api/wc2026/matches");
      if (!res.ok) throw new Error("Failed to fetch matches");
      const data = await res.json();
      setMatches(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      showToast("Greska pri ucitavanju utakmica", "error");
    } finally {
      setLoadingMatches(false);
    }
  }, [showToast]);

  const fetchGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const res = await fetch("/api/wc2026/groups");
      if (!res.ok) throw new Error("Failed to fetch groups");
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      showToast("Greska pri ucitavanju grupa", "error");
    } finally {
      setLoadingGroups(false);
    }
  }, [showToast]);

  const fetchTable = useCallback(async () => {
    setLoadingTable(true);
    try {
      const res = await fetch("/api/wc2026/table");
      if (!res.ok) throw new Error("Failed to fetch table");
      const data = await res.json();
      setTableEntries(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      showToast("Greska pri ucitavanju tabele", "error");
    } finally {
      setLoadingTable(false);
    }
  }, [showToast]);

  const fetchRegistrations = useCallback(async () => {
    setLoadingRegistrations(true);
    try {
      const res = await fetch("/api/wc2026/register");
      if (!res.ok) throw new Error("Failed to fetch registrations");
      const data = await res.json();
      setRegistrations(
        Array.isArray(data) ? data : data.registrations ?? data.data ?? []
      );
    } catch {
      showToast("Greska pri ucitavanju registracija", "error");
    } finally {
      setLoadingRegistrations(false);
    }
  }, [showToast]);

  // ---- initial load based on active tab ----
  useEffect(() => {
    if (status !== "authenticated") return;
    if (activeTab === "matches") fetchMatches();
    else if (activeTab === "groups") fetchGroups();
    else if (activeTab === "standings") fetchTable();
    else if (activeTab === "registrations") fetchRegistrations();
  }, [
    activeTab,
    status,
    fetchMatches,
    fetchGroups,
    fetchTable,
    fetchRegistrations,
  ]);

  // ---- match CRUD ----

  const handleAddMatch = async () => {
    if (!matchForm.home_team.trim() || !matchForm.away_team.trim()) {
      showToast("Domaci i gostujuci tim su obavezni", "error");
      return;
    }
    setSubmittingMatch(true);
    try {
      const body: Record<string, unknown> = { ...matchForm };
      if (matchForm.phase !== "group_stage") {
        body.group_name = null;
      }
      const res = await fetch("/api/wc2026/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to add match");
      showToast("Utakmica uspjesno dodana!", "success");
      setMatchForm({
        home_team: "",
        away_team: "",
        match_date: "",
        phase: "group_stage",
        group_name: "",
        venue: "",
      });
      await fetchMatches();
    } catch {
      showToast("Greska pri dodavanju utakmice", "error");
    } finally {
      setSubmittingMatch(false);
    }
  };

  const handleSaveMatchEdit = async (id: string) => {
    try {
      const res = await fetch("/api/wc2026/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          home_score:
            editMatchData.home_score !== ""
              ? Number(editMatchData.home_score)
              : null,
          away_score:
            editMatchData.away_score !== ""
              ? Number(editMatchData.away_score)
              : null,
          status: editMatchData.status,
        }),
      });
      if (!res.ok) throw new Error("Failed to update match");
      showToast("Utakmica azurirana", "success");
      setEditingMatchId(null);
      await fetchMatches();
    } catch {
      showToast("Greska pri azuriranju utakmice", "error");
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm("Da li ste sigurni da zelite obrisati ovu utakmicu?")) return;
    setDeletingMatchId(id);
    try {
      const res = await fetch(`/api/wc2026/matches?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete match");
      showToast("Utakmica obrisana", "success");
      await fetchMatches();
    } catch {
      showToast("Greska pri brisanju utakmice", "error");
    } finally {
      setDeletingMatchId(null);
    }
  };

  // ---- groups upload ----

  const handleUploadGroups = async () => {
    if (!groupJson.trim()) {
      showToast("Unesite JSON podatke", "error");
      return;
    }
    let parsed: WCGroup[];
    try {
      parsed = JSON.parse(groupJson);
      if (!Array.isArray(parsed)) throw new Error("Must be an array");
    } catch {
      showToast("Neispravan JSON format", "error");
      return;
    }
    setSubmittingGroups(true);
    try {
      const res = await fetch("/api/wc2026/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups: parsed }),
      });
      if (!res.ok) throw new Error("Failed to upload groups");
      showToast(`Grupe uspjesno ucitane (${parsed.length} timova)!`, "success");
      setGroupJson("");
      await fetchGroups();
    } catch {
      showToast("Greska pri ucitavanju grupa", "error");
    } finally {
      setSubmittingGroups(false);
    }
  };

  const handlePrefillGroups = () => {
    const defaults = generateDefaultGroups();
    setGroupJson(JSON.stringify(defaults, null, 2));
    showToast("Default grupe popunjene (48 timova)", "success");
  };

  // ---- standings (fantasy table) ----

  const handleParseTable = () => {
    if (!tableHtml.trim()) {
      showToast("Unesite HTML podatke tabele", "error");
      return;
    }
    try {
      // Try to extract table rows from pasted HTML
      const rowPattern = /<tr[^>]*>(.*?)<\/tr>/gi;
      const rows = tableHtml.match(rowPattern);
      if (!rows || rows.length === 0) {
        // Try JSON parse as fallback
        const jsonData = JSON.parse(tableHtml);
        if (Array.isArray(jsonData)) {
          setParsedTable(jsonData);
          showToast(`Parsirano ${jsonData.length} unosa`, "success");
          return;
        }
        throw new Error("No rows found");
      }

      const entries: WCTableEntry[] = [];
      rows.forEach((row, idx) => {
        const cells = row.match(/<td[^>]*>(.*?)<\/td>/gi);
        if (cells && cells.length >= 3) {
          const cleanCell = (html: string) =>
            html.replace(/<[^>]*>/g, "").trim();
          entries.push({
            rank: idx + 1,
            team_name: cleanCell(cells[1] || ""),
            user_name: cleanCell(cells[0] || ""),
            points: parseInt(cleanCell(cells[cells.length - 1] || "0"), 10) || 0,
          });
        }
      });

      if (entries.length === 0) throw new Error("Could not parse entries");
      setParsedTable(entries);
      showToast(`Parsirano ${entries.length} unosa`, "success");
    } catch {
      showToast("Greska pri parsiranju. Pokusajte JSON format.", "error");
    }
  };

  const handleUploadTable = async () => {
    if (parsedTable.length === 0) {
      showToast("Nema parsiranih podataka za upload", "error");
      return;
    }
    setSubmittingTable(true);
    try {
      const res = await fetch("/api/wc2026/table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players: parsedTable }),
      });
      if (!res.ok) throw new Error("Failed to upload table");
      showToast("Tabela uspjesno ucitana!", "success");
      setTableHtml("");
      setParsedTable([]);
      await fetchTable();
    } catch {
      showToast("Greska pri ucitavanju tabele", "error");
    } finally {
      setSubmittingTable(false);
    }
  };

  // ---- sign out ----
  const handleSignOut = () => {
    signOut({ callbackUrl: "/admin" });
  };

  // ---- auth guard ----
  if (status === "loading") {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? "bg-black" : "bg-gray-50"
        }`}
      >
        <RefreshCw className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? "bg-black" : "bg-gray-50"
        }`}
      >
        <div className="text-center">
          <p className="mb-4 text-gray-800">
            Pristup odbijen. Molimo prijavite se.
          </p>
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

  // ---- shared styling helpers ----
  const cardCls = isDark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";
  const inputCls = isDark
    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500";
  const labelCls = isDark ? "text-gray-400" : "text-gray-700";
  const headingCls = isDark ? "text-white" : "text-gray-800";

  // ===========================================================================
  // Tab content renderers
  // ===========================================================================

  // --------------- MATCHES TAB ---------------
  const renderMatchesTab = () => (
    <div className="space-y-6">
      {/* Add Match Form */}
      <div className={`rounded-md border p-4 sm:p-6 ${cardCls}`}>
        <h3
          className={`text-lg font-semibold mb-4 flex items-center gap-2 ${headingCls}`}
        >
          <Plus className="w-5 h-5 text-red-600" />
          Dodaj novu utakmicu
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Home Team */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${labelCls}`}>
              Domaci tim *
            </label>
            <input
              type="text"
              value={matchForm.home_team}
              onChange={(e) =>
                setMatchForm({ ...matchForm, home_team: e.target.value })
              }
              placeholder="npr. Brazil"
              className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600 ${inputCls}`}
            />
          </div>

          {/* Away Team */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${labelCls}`}>
              Gostujuci tim *
            </label>
            <input
              type="text"
              value={matchForm.away_team}
              onChange={(e) =>
                setMatchForm({ ...matchForm, away_team: e.target.value })
              }
              placeholder="npr. Argentina"
              className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600 ${inputCls}`}
            />
          </div>

          {/* Match Date */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${labelCls}`}>
              Datum i vrijeme
            </label>
            <input
              type="datetime-local"
              value={matchForm.match_date}
              onChange={(e) =>
                setMatchForm({ ...matchForm, match_date: e.target.value })
              }
              className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600 ${inputCls}`}
            />
          </div>

          {/* Phase */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${labelCls}`}>
              Faza
            </label>
            <select
              value={matchForm.phase}
              onChange={(e) =>
                setMatchForm({ ...matchForm, phase: e.target.value })
              }
              className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600 ${inputCls}`}
            >
              {PHASES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Group Name (only if group_stage) */}
          {matchForm.phase === "group_stage" && (
            <div>
              <label className={`block text-sm font-medium mb-1 ${labelCls}`}>
                Grupa
              </label>
              <select
                value={matchForm.group_name}
                onChange={(e) =>
                  setMatchForm({ ...matchForm, group_name: e.target.value })
                }
                className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600 ${inputCls}`}
              >
                <option value="">-- Izaberi grupu --</option>
                {GROUPS.map((g) => (
                  <option key={g} value={g}>
                    Grupa {g}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Venue */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${labelCls}`}>
              Stadion
            </label>
            <input
              type="text"
              value={matchForm.venue}
              onChange={(e) =>
                setMatchForm({ ...matchForm, venue: e.target.value })
              }
              placeholder="npr. MetLife Stadium"
              className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600 ${inputCls}`}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="mt-4">
          <button
            onClick={handleAddMatch}
            disabled={submittingMatch}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-900 hover:bg-red-950 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {submittingMatch ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Cuvanje...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Dodaj utakmicu
              </>
            )}
          </button>
        </div>
      </div>

      {/* Matches List */}
      <div className={`rounded-md border p-4 sm:p-6 ${cardCls}`}>
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-lg font-semibold flex items-center gap-2 ${headingCls}`}
          >
            <Calendar className="w-5 h-5 text-red-600" />
            Utakmice ({matches.length})
          </h3>
          <button
            onClick={fetchMatches}
            disabled={loadingMatches}
            className={`p-2 rounded-md transition-colors ${
              isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
            }`}
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingMatches ? "animate-spin" : ""} ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            />
          </button>
        </div>

        {loadingMatches ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
          </div>
        ) : matches.length === 0 ? (
          <div
            className={`text-center py-8 ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nema dodanih utakmica</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr
                  className={`border-b ${
                    isDark ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  {[
                    "Domaci",
                    "Gosti",
                    "Datum",
                    "Faza",
                    "Grupa",
                    "Rezultat",
                    "Status",
                    "Akcije",
                  ].map((h) => (
                    <th
                      key={h}
                      className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody
                className={
                  isDark ? "divide-y divide-gray-800" : "divide-y divide-gray-100"
                }
              >
                {matches.map((m) => (
                  <tr key={m.id} className={isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-50"}>
                    <td className={`px-3 py-2 ${headingCls}`}>
                      {m.home_team}
                    </td>
                    <td className={`px-3 py-2 ${headingCls}`}>
                      {m.away_team}
                    </td>
                    <td className={`px-3 py-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {m.match_date
                        ? new Date(m.match_date).toLocaleString("bs-BA", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className={`px-3 py-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {PHASES.find((p) => p.value === m.phase)?.label ??
                        m.phase}
                    </td>
                    <td className={`px-3 py-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {m.group_name ?? "-"}
                    </td>

                    {/* Score / Edit inline */}
                    <td className="px-3 py-2">
                      {editingMatchId === m.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            value={editMatchData.home_score}
                            onChange={(e) =>
                              setEditMatchData({
                                ...editMatchData,
                                home_score: e.target.value,
                              })
                            }
                            className={`w-12 p-1 text-center border rounded text-xs ${inputCls}`}
                          />
                          <span className={isDark ? "text-gray-500" : "text-gray-400"}>
                            :
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={editMatchData.away_score}
                            onChange={(e) =>
                              setEditMatchData({
                                ...editMatchData,
                                away_score: e.target.value,
                              })
                            }
                            className={`w-12 p-1 text-center border rounded text-xs ${inputCls}`}
                          />
                        </div>
                      ) : (
                        <span className={headingCls}>
                          {m.home_score !== null && m.away_score !== null
                            ? `${m.home_score} : ${m.away_score}`
                            : "- : -"}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2">
                      {editingMatchId === m.id ? (
                        <select
                          value={editMatchData.status}
                          onChange={(e) =>
                            setEditMatchData({
                              ...editMatchData,
                              status: e.target.value,
                            })
                          }
                          className={`p-1 border rounded text-xs ${inputCls}`}
                        >
                          {MATCH_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-md ${
                            m.status === "finished"
                              ? "bg-green-100 text-green-800"
                              : m.status === "live"
                              ? "bg-red-100 text-red-800"
                              : m.status === "postponed"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {MATCH_STATUSES.find((s) => s.value === m.status)
                            ?.label ?? m.status}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {editingMatchId === m.id ? (
                          <>
                            <button
                              onClick={() => handleSaveMatchEdit(m.id)}
                              className="p-1.5 rounded-md text-green-500 hover:bg-green-500/10 transition-colors"
                              title="Sacuvaj"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingMatchId(null)}
                              className="p-1.5 rounded-md text-gray-400 hover:bg-gray-500/10 transition-colors"
                              title="Otkazi"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingMatchId(m.id);
                                setEditMatchData({
                                  home_score:
                                    m.home_score !== null
                                      ? String(m.home_score)
                                      : "",
                                  away_score:
                                    m.away_score !== null
                                      ? String(m.away_score)
                                      : "",
                                  status: m.status || "scheduled",
                                });
                              }}
                              className={`p-1.5 rounded-md transition-colors ${
                                isDark
                                  ? "text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
                                  : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                              }`}
                              title="Uredi"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMatch(m.id)}
                              disabled={deletingMatchId === m.id}
                              className={`p-1.5 rounded-md transition-colors ${
                                isDark
                                  ? "text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                  : "text-gray-500 hover:text-red-600 hover:bg-red-50"
                              }`}
                              title="Obrisi"
                            >
                              {deletingMatchId === m.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // --------------- GROUPS TAB ---------------
  const renderGroupsTab = () => (
    <div className="space-y-6">
      {/* Upload Form */}
      <div className={`rounded-md border p-4 sm:p-6 ${cardCls}`}>
        <h3
          className={`text-lg font-semibold mb-4 flex items-center gap-2 ${headingCls}`}
        >
          <Upload className="w-5 h-5 text-red-600" />
          Upload grupa
        </h3>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${labelCls}`}>
              JSON niz sa podacima grupa
            </label>
            <textarea
              value={groupJson}
              onChange={(e) => setGroupJson(e.target.value)}
              rows={8}
              placeholder={`[\n  {\n    "group_name": "A",\n    "team_name": "USA",\n    "played": 0,\n    "won": 0,\n    "drawn": 0,\n    "lost": 0,\n    "goals_for": 0,\n    "goals_against": 0,\n    "goal_difference": 0,\n    "points": 0\n  }\n]`}
              className={`w-full p-3 border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-600 ${inputCls}`}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleUploadGroups}
              disabled={submittingGroups || !groupJson.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-900 hover:bg-red-950 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {submittingGroups ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Ucitavanje...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload grupa
                </>
              )}
            </button>

            <button
              onClick={handlePrefillGroups}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isDark
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Table2 className="w-4 h-4" />
              Popuni default (48 timova)
            </button>
          </div>
        </div>
      </div>

      {/* Current Groups */}
      <div className={`rounded-md border p-4 sm:p-6 ${cardCls}`}>
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-lg font-semibold flex items-center gap-2 ${headingCls}`}
          >
            <Trophy className="w-5 h-5 text-red-600" />
            Trenutne grupe ({groups.length} timova)
          </h3>
          <button
            onClick={fetchGroups}
            disabled={loadingGroups}
            className={`p-2 rounded-md transition-colors ${
              isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
            }`}
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingGroups ? "animate-spin" : ""} ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            />
          </button>
        </div>

        {loadingGroups ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
          </div>
        ) : groups.length === 0 ? (
          <div
            className={`text-center py-8 ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            <Trophy className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nema podataka o grupama</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {GROUPS.filter((g) =>
              groups.some((row) => row.group_name === g)
            ).map((g) => {
              const groupTeams = groups
                .filter((row) => row.group_name === g)
                .sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference);
              return (
                <div
                  key={g}
                  className={`rounded-md border p-3 ${
                    isDark
                      ? "border-gray-700 bg-gray-800/50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <h4
                    className={`text-sm font-semibold mb-2 ${headingCls}`}
                  >
                    Grupa {g}
                  </h4>
                  <table className="w-full text-xs">
                    <thead>
                      <tr
                        className={`border-b ${
                          isDark ? "border-gray-700" : "border-gray-200"
                        }`}
                      >
                        <th className={`text-left py-1 ${labelCls}`}>Tim</th>
                        <th className={`text-center py-1 ${labelCls}`}>U</th>
                        <th className={`text-center py-1 ${labelCls}`}>P</th>
                        <th className={`text-center py-1 ${labelCls}`}>N</th>
                        <th className={`text-center py-1 ${labelCls}`}>I</th>
                        <th className={`text-center py-1 ${labelCls}`}>GR</th>
                        <th className={`text-center py-1 font-semibold ${labelCls}`}>
                          Bod
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupTeams.map((t, idx) => (
                        <tr
                          key={`${t.group_name}-${t.team_name}-${idx}`}
                          className={`border-b last:border-0 ${
                            isDark ? "border-gray-700/50" : "border-gray-100"
                          }`}
                        >
                          <td className={`py-1 ${headingCls}`}>
                            {t.team_name}
                          </td>
                          <td
                            className={`text-center py-1 ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {t.played}
                          </td>
                          <td
                            className={`text-center py-1 ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {t.won}
                          </td>
                          <td
                            className={`text-center py-1 ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {t.drawn}
                          </td>
                          <td
                            className={`text-center py-1 ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {t.lost}
                          </td>
                          <td
                            className={`text-center py-1 ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {t.goals_for}:{t.goals_against}
                          </td>
                          <td
                            className={`text-center py-1 font-semibold ${headingCls}`}
                          >
                            {t.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // --------------- STANDINGS TAB (Fantasy Table) ---------------
  const renderStandingsTab = () => (
    <div className="space-y-6">
      {/* Upload Form */}
      <div className={`rounded-md border p-4 sm:p-6 ${cardCls}`}>
        <h3
          className={`text-lg font-semibold mb-4 flex items-center gap-2 ${headingCls}`}
        >
          <Upload className="w-5 h-5 text-red-600" />
          Upload Fantasy Tabele
        </h3>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${labelCls}`}>
              HTML tabele ili JSON niz
            </label>
            <textarea
              value={tableHtml}
              onChange={(e) => setTableHtml(e.target.value)}
              rows={6}
              placeholder="Zalijepite HTML tabelu ili JSON niz sa podacima igraca..."
              className={`w-full p-3 border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-600 ${inputCls}`}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleParseTable}
              disabled={!tableHtml.trim()}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isDark
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              }`}
            >
              <Table2 className="w-4 h-4" />
              Parsiraj
            </button>

            {parsedTable.length > 0 && (
              <button
                onClick={handleUploadTable}
                disabled={submittingTable}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-900 hover:bg-red-950 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {submittingTable ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Ucitavanje...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Sacuvaj u bazu ({parsedTable.length})
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Parsed preview */}
        {parsedTable.length > 0 && (
          <div className="mt-4">
            <h4 className={`text-sm font-medium mb-2 ${labelCls}`}>
              Preview ({parsedTable.length} unosa)
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr
                    className={`border-b ${
                      isDark ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <th className={`px-2 py-1 text-left ${labelCls}`}>#</th>
                    <th className={`px-2 py-1 text-left ${labelCls}`}>Tim</th>
                    <th className={`px-2 py-1 text-left ${labelCls}`}>Igrac</th>
                    <th className={`px-2 py-1 text-right ${labelCls}`}>
                      Bodovi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parsedTable.slice(0, 10).map((entry, idx) => (
                    <tr
                      key={idx}
                      className={`border-b last:border-0 ${
                        isDark ? "border-gray-800" : "border-gray-100"
                      }`}
                    >
                      <td className={`px-2 py-1 ${headingCls}`}>
                        {entry.rank ?? idx + 1}
                      </td>
                      <td className={`px-2 py-1 ${headingCls}`}>
                        {entry.team_name}
                      </td>
                      <td
                        className={`px-2 py-1 ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {entry.user_name}
                      </td>
                      <td
                        className={`px-2 py-1 text-right font-medium ${headingCls}`}
                      >
                        {entry.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedTable.length > 10 && (
                <p
                  className={`text-xs text-center py-2 ${
                    isDark ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  ... i jos {parsedTable.length - 10} unosa
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Current Table */}
      <div className={`rounded-md border p-4 sm:p-6 ${cardCls}`}>
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-lg font-semibold flex items-center gap-2 ${headingCls}`}
          >
            <Table2 className="w-5 h-5 text-red-600" />
            Trenutna Fantasy Tabela ({tableEntries.length})
          </h3>
          <button
            onClick={fetchTable}
            disabled={loadingTable}
            className={`p-2 rounded-md transition-colors ${
              isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
            }`}
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingTable ? "animate-spin" : ""} ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            />
          </button>
        </div>

        {loadingTable ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
          </div>
        ) : tableEntries.length === 0 ? (
          <div
            className={`text-center py-8 ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            <Table2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nema podataka u tabeli</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr
                  className={`border-b ${
                    isDark ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <th
                    className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? "text-gray-500" : "text-gray-500"
                    }`}
                  >
                    #
                  </th>
                  <th
                    className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? "text-gray-500" : "text-gray-500"
                    }`}
                  >
                    Tim
                  </th>
                  <th
                    className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? "text-gray-500" : "text-gray-500"
                    }`}
                  >
                    Igrac
                  </th>
                  <th
                    className={`px-3 py-2 text-right text-xs font-medium uppercase tracking-wider ${
                      isDark ? "text-gray-500" : "text-gray-500"
                    }`}
                  >
                    Bodovi
                  </th>
                </tr>
              </thead>
              <tbody
                className={
                  isDark
                    ? "divide-y divide-gray-800"
                    : "divide-y divide-gray-100"
                }
              >
                {tableEntries.map((entry, idx) => (
                  <tr
                    key={entry.id ?? idx}
                    className={isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-50"}
                  >
                    <td className={`px-3 py-2 font-medium ${headingCls}`}>
                      {entry.rank ?? idx + 1}
                    </td>
                    <td className={`px-3 py-2 ${headingCls}`}>
                      {entry.team_name}
                    </td>
                    <td
                      className={`px-3 py-2 ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {entry.user_name}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-semibold text-green-600`}
                    >
                      {entry.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // --------------- REGISTRATIONS TAB ---------------
  const renderRegistrationsTab = () => (
    <div className="space-y-6">
      <div className={`rounded-md border p-4 sm:p-6 ${cardCls}`}>
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-lg font-semibold flex items-center gap-2 ${headingCls}`}
          >
            <Users className="w-5 h-5 text-red-600" />
            WC 2026 Registracije ({registrations.length})
          </h3>
          <button
            onClick={fetchRegistrations}
            disabled={loadingRegistrations}
            className={`p-2 rounded-md transition-colors ${
              isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
            }`}
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loadingRegistrations ? "animate-spin" : ""
              } ${isDark ? "text-gray-400" : "text-gray-600"}`}
            />
          </button>
        </div>

        {loadingRegistrations ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
          </div>
        ) : registrations.length === 0 ? (
          <div
            className={`text-center py-8 ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nema registracija</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr
                  className={`border-b ${
                    isDark ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  {[
                    "Ime",
                    "Email",
                    "Telefon",
                    "Tim",
                    "Nacin placanja",
                    "Status placanja",
                    "Datum",
                  ].map((h) => (
                    <th
                      key={h}
                      className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody
                className={
                  isDark
                    ? "divide-y divide-gray-800"
                    : "divide-y divide-gray-100"
                }
              >
                {registrations.map((reg) => (
                  <tr
                    key={reg.id}
                    className={isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-50"}
                  >
                    <td className={`px-3 py-2 font-medium ${headingCls}`}>
                      {reg.name ??
                        (`${reg.first_name ?? ""} ${reg.last_name ?? ""}`.trim() ||
                        "-")}
                    </td>
                    <td
                      className={`px-3 py-2 ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {reg.email}
                    </td>
                    <td
                      className={`px-3 py-2 ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {reg.phone ?? "-"}
                    </td>
                    <td className={`px-3 py-2 ${headingCls}`}>
                      {reg.team_name ?? "-"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-md ${
                          reg.payment_method === "cash"
                            ? "bg-yellow-100 text-yellow-800"
                            : reg.payment_method === "wise"
                            ? "bg-purple-100 text-purple-800"
                            : reg.payment_method === "paypal"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {reg.payment_method ?? "N/A"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-md ${
                          reg.payment_status === "paid"
                            ? "bg-green-100 text-green-800"
                            : reg.payment_status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {reg.payment_status ?? "N/A"}
                      </span>
                    </td>
                    <td
                      className={`px-3 py-2 ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {reg.created_at
                        ? new Date(reg.created_at).toLocaleDateString("bs-BA")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ===========================================================================
  // Main render
  // ===========================================================================

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    {
      key: "matches",
      label: "Utakmice",
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      key: "groups",
      label: "Grupe",
      icon: <Trophy className="w-4 h-4" />,
    },
    {
      key: "standings",
      label: "Tabela",
      icon: <Table2 className="w-4 h-4" />,
    },
    {
      key: "registrations",
      label: "Registracije",
      icon: <Users className="w-4 h-4" />,
    },
  ];

  return (
    <div className={`min-h-screen ${isDark ? "bg-black" : "bg-gray-50"}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-red-950 to-red-900 text-white border-b border-red-950">
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
                  WC 2026 Upravljanje
                </h1>
                <p className="text-xs sm:text-sm text-white/60 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/dashboard"
                className="text-white/70 hover:text-white hover:bg-white/10 p-2 sm:px-3 sm:py-2 rounded-md transition-colors flex items-center gap-2 flex-shrink-0 text-sm"
                title="Nazad na Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <button
                onClick={toggleTheme}
                className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-md transition-colors flex-shrink-0"
                title={isDark ? "Svijetli mod" : "Tamni mod"}
              >
                {isDark ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleSignOut}
                className="text-white/70 hover:text-white hover:bg-white/10 p-2 sm:px-3 sm:py-2 rounded-md transition-colors flex items-center gap-2 flex-shrink-0 text-sm"
                title="Odjavi se"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Odjava</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div
          className={`mb-8 border-b ${
            isDark ? "border-gray-800" : "border-gray-200"
          }`}
        >
          <nav className="-mb-px flex">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2.5 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                  activeTab === tab.key
                    ? "border-red-500 text-red-600 dark:text-red-400"
                    : isDark
                    ? "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {tab.icon}
                  {tab.label}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "matches" && renderMatchesTab()}
        {activeTab === "groups" && renderGroupsTab()}
        {activeTab === "standings" && renderStandingsTab()}
        {activeTab === "registrations" && renderRegistrationsTab()}
      </main>

      {/* Toast */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}
