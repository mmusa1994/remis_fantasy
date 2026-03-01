"use client";

import { useEffect, useState, useRef } from "react";
import {
  Upload,
  Trash2,
  RefreshCw,
  Trophy,
  Edit3,
  X,
  Check,
} from "lucide-react";
import Image from "next/image";

interface ChampionEntry {
  id: string;
  league: string;
  season: string;
  name: string;
  team_name: string | null;
  image: string;
  achievement: string | null;
  sort_order: number;
  created_at: string;
}

interface AdminChampionsManagerProps {
  league: "pl" | "cl" | "f1";
  isDark: boolean;
  onToast: (message: string, type: "success" | "error") => void;
}

export default function AdminChampionsManager({
  league,
  isDark,
  onToast,
}: AdminChampionsManagerProps) {
  const [champions, setChampions] = useState<ChampionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ChampionEntry>>({});

  // Form state
  const [name, setName] = useState("");
  const [season, setSeason] = useState("");
  const [teamName, setTeamName] = useState("");
  const [achievement, setAchievement] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadChampions();
  }, [league]);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [selectedFile]);

  const loadChampions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/wall-of-champions?league=${league}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setChampions(data);
    } catch {
      onToast("Greška pri učitavanju šampiona", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !season.trim()) {
      onToast("Ime i sezona su obavezni", "error");
      return;
    }

    if (!selectedFile) {
      onToast("Slika je obavezna", "error");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload image
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("league", league);

      const uploadRes = await fetch("/api/admin/wall-of-champions/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "Upload failed");
      }

      const { url } = await uploadRes.json();
      setUploading(false);

      // 2. Create champion record
      const createRes = await fetch("/api/admin/wall-of-champions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          league,
          name: name.trim(),
          season: season.trim(),
          team_name: teamName.trim() || null,
          image: url,
          achievement: achievement.trim() || null,
        }),
      });

      if (!createRes.ok) throw new Error("Failed to save champion");

      onToast("Šampion uspješno dodan!", "success");
      resetForm();
      await loadChampions();
    } catch (e: any) {
      onToast(e.message || "Greška pri dodavanju šampiona", "error");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Da li ste sigurni da želite obrisati ovog šampiona?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/wall-of-champions?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      onToast("Šampion obrisan", "success");
      await loadChampions();
    } catch {
      onToast("Greška pri brisanju", "error");
    } finally {
      setDeleting(null);
    }
  };

  const startEdit = (champion: ChampionEntry) => {
    setEditing(champion.id);
    setEditData({
      name: champion.name,
      season: champion.season,
      team_name: champion.team_name,
      achievement: champion.achievement,
    });
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch("/api/admin/wall-of-champions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editData }),
      });
      if (!res.ok) throw new Error("Update failed");
      onToast("Šampion ažuriran", "success");
      setEditing(null);
      await loadChampions();
    } catch {
      onToast("Greška pri ažuriranju", "error");
    }
  };

  const resetForm = () => {
    setName("");
    setSeason("");
    setTeamName("");
    setAchievement("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Add Champion Form */}
      <div
        className={`rounded-md border p-4 sm:p-6 ${
          isDark
            ? "bg-gray-900 border-gray-800"
            : "bg-white border-gray-200"
        }`}
      >
        <h3
          className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
            isDark ? "text-white" : "text-gray-800"
          }`}
        >
          <Trophy className="w-5 h-5 text-red-800" />
          Dodaj novog šampiona
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? "text-gray-400" : "text-gray-700"
              }`}
            >
              Ime *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ime i prezime"
              className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-900 ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-800"
              }`}
            />
          </div>

          {/* Season */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? "text-gray-400" : "text-gray-700"
              }`}
            >
              Sezona *
            </label>
            <input
              type="text"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="npr. 2024/25"
              className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-900 ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-800"
              }`}
            />
          </div>

          {/* Team Name */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? "text-gray-400" : "text-gray-700"
              }`}
            >
              Tim (opcionalno)
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Naziv tima"
              className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-900 ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-800"
              }`}
            />
          </div>

          {/* Achievement */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? "text-gray-400" : "text-gray-700"
              }`}
            >
              Dostignuće (opcionalno)
            </label>
            <input
              type="text"
              value={achievement}
              onChange={(e) => setAchievement(e.target.value)}
              placeholder="npr. 1st Place"
              className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-900 ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-800"
              }`}
            />
          </div>

          {/* Image Upload */}
          <div className="sm:col-span-2">
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? "text-gray-400" : "text-gray-700"
              }`}
            >
              Slika šampiona *
            </label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className={`flex-1 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:cursor-pointer ${
                  isDark
                    ? "text-gray-400 file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600"
                    : "text-gray-700 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                }`}
              />
              {selectedFile && (
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="p-1.5 rounded-md text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {preview && (
              <div className="mt-2 relative w-24 h-24 rounded-md overflow-hidden border border-gray-600">
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-950 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {uploading ? "Uploading..." : "Saving..."}
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4" /> Dodaj šampiona
              </>
            )}
          </button>
          {(name || season || teamName || achievement || selectedFile) && (
            <button
              onClick={resetForm}
              className={`text-sm px-3 py-2 rounded-md ${
                isDark
                  ? "text-gray-400 hover:bg-gray-800"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Poništi
            </button>
          )}
        </div>
      </div>

      {/* Champions List */}
      <div
        className={`rounded-md border p-4 sm:p-6 ${
          isDark
            ? "bg-gray-900 border-gray-800"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-lg font-semibold flex items-center gap-2 ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            <Trophy className="w-5 h-5 text-red-800" />
            Šampioni ({champions.length})
          </h3>
          <button
            onClick={loadChampions}
            disabled={loading}
            className={`p-2 rounded-md transition-colors ${
              isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
            }`}
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""} ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-red-800" />
          </div>
        ) : champions.length === 0 ? (
          <div
            className={`text-center py-8 ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            <Trophy className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nema dodanih šampiona</p>
          </div>
        ) : (
          <div className="space-y-3">
            {champions.map((champion) => (
              <div
                key={champion.id}
                className={`flex items-center gap-4 p-3 rounded-md border ${
                  isDark
                    ? "border-gray-700 bg-gray-800/50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                {/* Image */}
                <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                  <Image
                    src={champion.image}
                    alt={champion.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {editing === champion.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editData.name || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, name: e.target.value })
                        }
                        className={`w-full p-1.5 text-sm border rounded ${
                          isDark
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-800"
                        }`}
                        placeholder="Ime"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editData.season || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              season: e.target.value,
                            })
                          }
                          className={`w-24 p-1.5 text-sm border rounded ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-800"
                          }`}
                          placeholder="Sezona"
                        />
                        <input
                          type="text"
                          value={editData.team_name || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              team_name: e.target.value,
                            })
                          }
                          className={`flex-1 p-1.5 text-sm border rounded ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-800"
                          }`}
                          placeholder="Tim"
                        />
                        <input
                          type="text"
                          value={editData.achievement || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              achievement: e.target.value,
                            })
                          }
                          className={`w-28 p-1.5 text-sm border rounded ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-800"
                          }`}
                          placeholder="Dostignuće"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p
                        className={`font-semibold text-sm truncate ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {champion.name}
                      </p>
                      <p
                        className={`text-xs ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {champion.season}
                        {champion.team_name && ` • ${champion.team_name}`}
                        {champion.achievement &&
                          ` • ${champion.achievement}`}
                      </p>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {editing === champion.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(champion.id)}
                        className="p-2 rounded-md text-green-500 hover:bg-green-500/10 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="p-2 rounded-md text-gray-400 hover:bg-gray-500/10 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(champion)}
                        className={`p-2 rounded-md transition-colors ${
                          isDark
                            ? "text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
                            : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        }`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(champion.id)}
                        disabled={deleting === champion.id}
                        className={`p-2 rounded-md transition-colors ${
                          isDark
                            ? "text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                            : "text-gray-500 hover:text-red-600 hover:bg-red-50"
                        }`}
                      >
                        {deleting === champion.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
