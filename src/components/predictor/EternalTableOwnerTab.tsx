"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  Upload,
  Trophy,
  ArrowUp,
  ArrowDown,
  Check,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";

// ─────────────────────────────────────────────────────────────────────────────
// Owner-side admin tab for the per-tournament Eternal Table (Vječna tabela).
// Lets the owner add/edit/delete columns (e.g. SP 2014, Euro 2020) and
// player rows with a value per column. Logos can be uploaded via the existing
// /api/predictor/owner/upload-image endpoint or pasted as URL.
// ─────────────────────────────────────────────────────────────────────────────

type Tournament = { id: string; name: string };
type Column = {
  id: string;
  label: string;
  logo_url: string | null;
  sort_order: number;
};
type Entry = {
  id: string;
  player_name: string;
  values: Record<string, number | null>;
  sort_order: number;
};

export default function EternalTableOwnerTab({
  tournament,
}: {
  tournament: Tournament;
}) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const { showToast: globalToast } = useToast();
  const showToast = useCallback(
    (msg: string, ok = true) => {
      globalToast(msg, ok ? "success" : "error");
    },
    [globalToast]
  );
  const [columns, setColumns] = useState<Column[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  // Add-column row
  const [newColLabel, setNewColLabel] = useState("");
  const [newColLogoUrl, setNewColLogoUrl] = useState("");
  const [creatingCol, setCreatingCol] = useState(false);

  // Add-entry row
  const [newEntryName, setNewEntryName] = useState("");
  const [creatingEntry, setCreatingEntry] = useState(false);

  // Inline editing state for entries
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingEntryName, setEditingEntryName] = useState("");
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  // Inline editing state for columns
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColLabel, setEditingColLabel] = useState("");
  const [editingColLogoUrl, setEditingColLogoUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/predictor/owner/eternal-table?tournament_id=${tournament.id}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setColumns(data.columns || []);
      setEntries(data.entries || []);
    } catch (e: any) {
      showToast(e.message || "Greška pri učitavanju", false);
    } finally {
      setLoading(false);
    }
  }, [tournament.id, showToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ───── Column actions ───────────────────────────────────────────────────
  const uploadLogo = useCallback(
    async (file: File): Promise<string | null> => {
      try {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", file);
        fd.append("tournament_id", tournament.id);
        fd.append("kind", "logo");
        const res = await fetch("/api/predictor/owner/upload-image", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Upload failed");
        return data.url as string;
      } catch (e: any) {
        showToast(e.message || "Upload neuspješan", false);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [tournament.id, showToast]
  );

  const addColumn = useCallback(async () => {
    if (!newColLabel.trim()) return;
    setCreatingCol(true);
    try {
      const res = await fetch(
        "/api/predictor/owner/eternal-table?resource=columns",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tournament_id: tournament.id,
            label: newColLabel.trim(),
            logo_url: newColLogoUrl.trim() || null,
            sort_order: columns.length,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setColumns((prev) => [...prev, data]);
      setNewColLabel("");
      setNewColLogoUrl("");
      showToast("Kolona dodata");
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setCreatingCol(false);
    }
  }, [newColLabel, newColLogoUrl, tournament.id, columns.length, showToast]);

  const deleteColumn = useCallback(
    async (col: Column) => {
      if (
        !window.confirm(`Obrisati kolonu "${col.label}"? Sve vrijednosti će biti uklonjene.`)
      )
        return;
      try {
        const res = await fetch(
          `/api/predictor/owner/eternal-table?resource=columns&id=${col.id}`,
          { method: "DELETE" }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed");
        setColumns((prev) => prev.filter((c) => c.id !== col.id));
        // Strip the deleted column from each entry's values cache
        setEntries((prev) =>
          prev.map((e) => {
            const { [col.id]: _, ...rest } = e.values;
            return { ...e, values: rest };
          })
        );
        showToast("Kolona obrisana");
      } catch (e: any) {
        showToast(e.message, false);
      }
    },
    [showToast]
  );

  const startEditCol = (col: Column) => {
    setEditingColId(col.id);
    setEditingColLabel(col.label);
    setEditingColLogoUrl(col.logo_url || "");
  };
  const cancelEditCol = () => {
    setEditingColId(null);
    setEditingColLabel("");
    setEditingColLogoUrl("");
  };
  const saveEditCol = async () => {
    if (!editingColId) return;
    try {
      const res = await fetch(
        "/api/predictor/owner/eternal-table?resource=columns",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingColId,
            label: editingColLabel.trim(),
            logo_url: editingColLogoUrl.trim() || null,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setColumns((prev) => prev.map((c) => (c.id === editingColId ? data : c)));
      cancelEditCol();
      showToast("Kolona snimljena");
    } catch (e: any) {
      showToast(e.message, false);
    }
  };

  const moveColumn = async (col: Column, dir: -1 | 1) => {
    const idx = columns.findIndex((c) => c.id === col.id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= columns.length) return;
    const reordered = [...columns];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    setColumns(reordered);
    try {
      await Promise.all(
        reordered.map((c, i) =>
          fetch("/api/predictor/owner/eternal-table?resource=columns", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: c.id, sort_order: i }),
          })
        )
      );
    } catch {
      // Silently fallback — re-fetch authoritative order
      fetchAll();
    }
  };

  // ───── Entry actions ────────────────────────────────────────────────────
  const addEntry = useCallback(async () => {
    if (!newEntryName.trim()) return;
    setCreatingEntry(true);
    try {
      const res = await fetch(
        "/api/predictor/owner/eternal-table?resource=entries",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tournament_id: tournament.id,
            player_name: newEntryName.trim(),
            values: {},
            sort_order: entries.length,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setEntries((prev) => [...prev, data]);
      setNewEntryName("");
      showToast("Igrač dodat");
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setCreatingEntry(false);
    }
  }, [newEntryName, tournament.id, entries.length, showToast]);

  const startEditEntry = (entry: Entry) => {
    setEditingEntryId(entry.id);
    setEditingEntryName(entry.player_name);
    const strs: Record<string, string> = {};
    for (const c of columns) {
      const v = entry.values?.[c.id];
      strs[c.id] = v === undefined || v === null ? "" : String(v);
    }
    setEditingValues(strs);
  };

  const cancelEditEntry = () => {
    setEditingEntryId(null);
    setEditingEntryName("");
    setEditingValues({});
  };

  const saveEditEntry = async () => {
    if (!editingEntryId) return;
    const values: Record<string, number | null> = {};
    for (const [k, v] of Object.entries(editingValues)) {
      const trimmed = v.trim();
      if (trimmed === "") {
        values[k] = null;
      } else {
        const n = Number(trimmed);
        if (Number.isFinite(n)) values[k] = n;
      }
    }
    try {
      const res = await fetch(
        "/api/predictor/owner/eternal-table?resource=entries",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingEntryId,
            player_name: editingEntryName.trim(),
            values,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setEntries((prev) =>
        prev.map((e) => (e.id === editingEntryId ? data : e))
      );
      cancelEditEntry();
      showToast("Igrač snimljen");
    } catch (e: any) {
      showToast(e.message, false);
    }
  };

  const deleteEntry = async (entry: Entry) => {
    if (!window.confirm(`Obrisati igrača "${entry.player_name}"?`)) return;
    try {
      const res = await fetch(
        `/api/predictor/owner/eternal-table?resource=entries&id=${entry.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      showToast("Igrač obrisan");
    } catch (e: any) {
      showToast(e.message, false);
    }
  };

  const moveEntry = async (entry: Entry, dir: -1 | 1) => {
    const idx = entries.findIndex((e) => e.id === entry.id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= entries.length) return;
    const reordered = [...entries];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    setEntries(reordered);
    try {
      await Promise.all(
        reordered.map((e, i) =>
          fetch("/api/predictor/owner/eternal-table?resource=entries", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: e.id, sort_order: i }),
          })
        )
      );
    } catch {
      fetchAll();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Class helpers — match the rest of the owner editor's look-and-feel.
  // ─────────────────────────────────────────────────────────────────────────
  const inputCls = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
    dark
      ? "border-white/10 bg-black/30 text-white placeholder-gray-600 focus:border-predictor-primary/60"
      : "border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-predictor-primary"
  }`;
  const subtleBtn = `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
    dark
      ? "border-white/15 text-gray-300 hover:border-white/35 hover:text-white"
      : "border-gray-300 text-gray-700 hover:border-gray-500 hover:text-gray-900"
  }`;
  const primaryBtn =
    "inline-flex items-center gap-1.5 rounded-full bg-predictor-primary px-3 py-1.5 text-xs font-bold text-gray-900 transition-colors hover:bg-predictor-primary-hover disabled:opacity-50";
  const dangerIconBtn = `inline-flex items-center justify-center rounded-md p-1.5 transition-colors ${
    dark
      ? "text-red-300 hover:bg-red-500/10"
      : "text-red-600 hover:bg-red-50"
  }`;
  const ghostIconBtn = `inline-flex items-center justify-center rounded-md p-1.5 transition-colors ${
    dark
      ? "text-gray-400 hover:bg-white/5 hover:text-white"
      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
  }`;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            dark ? "bg-amber-500/15" : "bg-amber-50 ring-1 ring-amber-200"
          }`}
        >
          <Trophy className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h2
            className={`text-base font-bold ${dark ? "text-white" : "text-gray-900"}`}
          >
            Vječna tabela
          </h2>
          <p className={`text-xs ${dark ? "text-gray-500" : "text-gray-500"}`}>
            Konfigurabilne historijske kolone i osvojeni poeni po igraču
          </p>
        </div>
      </div>

      {/* Columns section */}
      <section
        className={`rounded-2xl border p-4 sm:p-5 ${
          dark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white"
        }`}
      >
        <h3
          className={`mb-3 text-xs font-semibold uppercase tracking-wider ${
            dark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Kolone (takmičenja)
        </h3>

        {/* Existing columns list */}
        <ul className="mb-4 space-y-2">
          {columns.map((c, i) => {
            const isEditing = editingColId === c.id;
            return (
              <li
                key={c.id}
                className={`flex flex-wrap items-center gap-3 rounded-xl border p-2.5 ${
                  dark
                    ? "border-white/8 bg-white/[0.015]"
                    : "border-gray-200 bg-gray-50/60"
                }`}
              >
                {/* Logo preview */}
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg ${
                    dark ? "bg-black/30" : "bg-white"
                  }`}
                >
                  {(isEditing ? editingColLogoUrl : c.logo_url) ? (
                    <Image
                      src={(isEditing ? editingColLogoUrl : c.logo_url) as string}
                      alt={c.label}
                      width={40}
                      height={40}
                      className="h-10 w-10 object-contain"
                      unoptimized
                    />
                  ) : (
                    <Trophy className="h-4 w-4 text-gray-400" />
                  )}
                </div>

                {isEditing ? (
                  <>
                    <input
                      value={editingColLabel}
                      onChange={(e) => setEditingColLabel(e.target.value)}
                      className={`${inputCls} flex-1 min-w-[140px]`}
                      placeholder="Naziv kolone"
                    />
                    <input
                      value={editingColLogoUrl}
                      onChange={(e) => setEditingColLogoUrl(e.target.value)}
                      className={`${inputCls} flex-1 min-w-[200px]`}
                      placeholder="URL loga (opciono)"
                    />
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const url = await uploadLogo(f);
                        if (url) setEditingColLogoUrl(url);
                        if (editFileInputRef.current)
                          editFileInputRef.current.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      disabled={uploading}
                      className={subtleBtn}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {uploading ? "..." : "Upload"}
                    </button>
                    <button
                      type="button"
                      onClick={saveEditCol}
                      className={primaryBtn}
                    >
                      <Save className="h-3.5 w-3.5" />
                      Snimi
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditCol}
                      className={ghostIconBtn}
                      title="Otkaži"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex flex-1 flex-col min-w-0">
                      <span
                        className={`text-sm font-semibold truncate ${
                          dark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {c.label}
                      </span>
                      {c.logo_url ? (
                        <span
                          className={`text-[10px] truncate ${
                            dark ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          {c.logo_url}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveColumn(c, -1)}
                        disabled={i === 0}
                        className={`${ghostIconBtn} disabled:opacity-30`}
                        title="Pomjeri gore"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveColumn(c, 1)}
                        disabled={i === columns.length - 1}
                        className={`${ghostIconBtn} disabled:opacity-30`}
                        title="Pomjeri dole"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditCol(c)}
                        className={ghostIconBtn}
                        title="Uredi"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteColumn(c)}
                        className={dangerIconBtn}
                        title="Obriši"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            );
          })}

          {columns.length === 0 && !loading ? (
            <li
              className={`rounded-xl border border-dashed p-4 text-center text-xs ${
                dark
                  ? "border-white/10 text-gray-500"
                  : "border-gray-300 text-gray-500"
              }`}
            >
              Još uvijek nema kolona. Dodaj prvu ispod.
            </li>
          ) : null}
        </ul>

        {/* Add-column row */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={newColLabel}
            onChange={(e) => setNewColLabel(e.target.value)}
            placeholder="Naziv kolone (npr. SP 2014)"
            className={`${inputCls} flex-1 min-w-[160px]`}
          />
          <input
            value={newColLogoUrl}
            onChange={(e) => setNewColLogoUrl(e.target.value)}
            placeholder="URL loga (opciono)"
            className={`${inputCls} flex-1 min-w-[200px]`}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const url = await uploadLogo(f);
              if (url) setNewColLogoUrl(url);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={subtleBtn}
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "..." : "Upload"}
          </button>
          <button
            type="button"
            onClick={addColumn}
            disabled={creatingCol || !newColLabel.trim()}
            className={primaryBtn}
          >
            <Plus className="h-3.5 w-3.5" />
            Dodaj kolonu
          </button>
        </div>
      </section>

      {/* Entries section */}
      <section
        className={`rounded-2xl border p-4 sm:p-5 ${
          dark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white"
        }`}
      >
        <h3
          className={`mb-3 text-xs font-semibold uppercase tracking-wider ${
            dark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Igrači
        </h3>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr
                className={`border-b ${
                  dark ? "border-white/10" : "border-gray-200"
                }`}
              >
                <th
                  className={`px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider ${
                    dark ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  #
                </th>
                <th
                  className={`px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider ${
                    dark ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  Igrač
                </th>
                {columns.map((c) => (
                  <th
                    key={c.id}
                    className={`px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider ${
                      dark ? "text-gray-500" : "text-gray-500"
                    }`}
                  >
                    {c.label}
                  </th>
                ))}
                <th
                  className={`px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider ${
                    dark ? "text-amber-400" : "text-amber-600"
                  }`}
                >
                  Ukupno
                </th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody
              className={
                dark ? "divide-y divide-white/5" : "divide-y divide-gray-100"
              }
            >
              {entries.map((e, i) => {
                const isEditing = editingEntryId === e.id;
                const total = columns.reduce((s, c) => {
                  const v = isEditing
                    ? Number(editingValues[c.id])
                    : (e.values?.[c.id] ?? 0);
                  return s + (Number.isFinite(v) ? (v as number) : 0);
                }, 0);
                return (
                  <tr
                    key={e.id}
                    className={
                      dark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50"
                    }
                  >
                    <td
                      className={`px-2 py-2 text-xs font-mono ${
                        dark ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      {i + 1}
                    </td>
                    <td className="px-2 py-2">
                      {isEditing ? (
                        <input
                          value={editingEntryName}
                          onChange={(ev) => setEditingEntryName(ev.target.value)}
                          className={`${inputCls} min-w-[120px]`}
                        />
                      ) : (
                        <span
                          className={`font-semibold ${
                            dark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {e.player_name}
                        </span>
                      )}
                    </td>
                    {columns.map((c) => (
                      <td key={c.id} className="px-2 py-2 text-center">
                        {isEditing ? (
                          <input
                            value={editingValues[c.id] ?? ""}
                            onChange={(ev) =>
                              setEditingValues((prev) => ({
                                ...prev,
                                [c.id]: ev.target.value,
                              }))
                            }
                            inputMode="numeric"
                            className={`${inputCls} w-16 px-2 py-1 text-center`}
                          />
                        ) : (
                          <span
                            className={
                              dark ? "text-gray-300" : "text-gray-700"
                            }
                          >
                            {e.values?.[c.id] ?? ""}
                          </span>
                        )}
                      </td>
                    ))}
                    <td
                      className={`px-2 py-2 text-center font-bold ${
                        dark ? "text-amber-300" : "text-amber-700"
                      }`}
                    >
                      {total}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={saveEditEntry}
                              className={primaryBtn}
                            >
                              <Check className="h-3.5 w-3.5" />
                              Snimi
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditEntry}
                              className={ghostIconBtn}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => moveEntry(e, -1)}
                              disabled={i === 0}
                              className={`${ghostIconBtn} disabled:opacity-30`}
                              title="Gore"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveEntry(e, 1)}
                              disabled={i === entries.length - 1}
                              className={`${ghostIconBtn} disabled:opacity-30`}
                              title="Dole"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => startEditEntry(e)}
                              className={ghostIconBtn}
                              title="Uredi"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteEntry(e)}
                              className={dangerIconBtn}
                              title="Obriši"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {entries.length === 0 && !loading ? (
            <div
              className={`rounded-xl border border-dashed p-4 text-center text-xs mt-2 ${
                dark
                  ? "border-white/10 text-gray-500"
                  : "border-gray-300 text-gray-500"
              }`}
            >
              Još uvijek nema igrača.
            </div>
          ) : null}
        </div>

        {/* Add-entry row */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            value={newEntryName}
            onChange={(e) => setNewEntryName(e.target.value)}
            placeholder="Ime igrača (npr. ČOSA)"
            className={`${inputCls} flex-1 min-w-[200px]`}
          />
          <button
            type="button"
            onClick={addEntry}
            disabled={creatingEntry || !newEntryName.trim()}
            className={primaryBtn}
          >
            <Plus className="h-3.5 w-3.5" />
            Dodaj igrača
          </button>
        </div>
      </section>
    </div>
  );
}
