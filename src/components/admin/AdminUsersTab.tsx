"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Sparkles,
  Users,
  Star,
  Plus,
  Minus,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Mail,
  Calendar,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { UserAvatar } from "@/components/shared/UserAvatar";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  avatar_url?: string | null;
  provider?: string | null;
  email_verified?: boolean | null;
  last_login?: string | null;
  created_at?: string | null;
  tournament_create_credits: number;
  tournaments_owned?: number;
}

export default function AdminUsersTab() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 25;
  const [granting, setGranting] = useState<UserRow | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [migrationApplied, setMigrationApplied] = useState(true);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const qs = new URLSearchParams({
        q: debouncedSearch,
        page: String(page),
        page_size: String(pageSize),
      });
      const res = await fetch(`/api/admin/users?${qs.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFetchError(
          (data && data.error) ||
            `Greška ${res.status}: ne mogu dohvatiti korisnike.`,
        );
        setUsers([]);
        setTotal(0);
        return;
      }
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setMigrationApplied(data.migration_applied !== false);
    } catch (e: any) {
      setFetchError(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className={dark ? "text-white" : "text-gray-900"}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={`text-lg font-bold ${dark ? "text-white" : "text-gray-900"}`}>
            Korisnici platforme
          </h2>
          <p className={`text-xs ${dark ? "text-gray-400" : "text-gray-600"}`}>
            Pretraži sve registrovane korisnike. Daj im besplatne kredite za kreiranje turnira ako
            želiš da ih nagradiš.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div
            className={`rounded-lg border px-3 py-1.5 ${
              dark ? "border-gray-800 bg-gray-900 text-gray-400" : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            <Users className="mr-1 inline h-3 w-3" /> Ukupno: <b className={dark ? "text-white" : "text-gray-900"}>{total}</b>
          </div>
        </div>
      </div>

      {/* Migration warning */}
      {!migrationApplied && !fetchError && !loading && (
        <div
          className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
            dark
              ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
              : "border-amber-400 bg-amber-50 text-amber-900"
          }`}
        >
          <div className="font-semibold mb-1">
            ⚠ Migracija nije pokrenuta — dodaj kolonu prije dodjele kredita
          </div>
          <div className={`text-xs ${dark ? "text-amber-200/80" : "text-amber-800/80"}`}>
            Pokreni{" "}
            <code className={`rounded px-1 py-0.5 font-mono ${dark ? "bg-amber-950/60" : "bg-amber-100"}`}>
              db/sql/tournament-creation-public-migration.sql
            </code>{" "}
            u Supabase SQL editoru. Lista korisnika radi i bez migracije, ali dugme "Daj kredite" će puknuti dok ne dodaš kolonu{" "}
            <code className={`rounded px-1 py-0.5 font-mono ${dark ? "bg-amber-950/60" : "bg-amber-100"}`}>
              tournament_create_credits
            </code>
            .
          </div>
        </div>
      )}

      {/* Fetch error */}
      {fetchError && (
        <div
          className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
            dark
              ? "border-red-500/30 bg-red-500/10 text-red-100"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          <div className="font-semibold mb-1">Greška pri dohvaćanju korisnika</div>
          <div className={`text-xs font-mono ${dark ? "text-red-200/80" : "text-red-700/80"}`}>
            {fetchError}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-5">
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 ${
            dark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"
          }`}
        >
          <Search className={`h-4 w-4 ${dark ? "text-gray-500" : "text-gray-400"}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Pretraži po email-u ili imenu..."
            className={`flex-1 bg-transparent text-sm outline-none ${dark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"}`}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className={`text-xs ${dark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-lg border ${dark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className={`h-6 w-6 animate-spin ${dark ? "text-gray-500" : "text-gray-400"}`} />
          </div>
        ) : users.length === 0 ? (
          <div className={`py-16 text-center text-sm ${dark ? "text-gray-500" : "text-gray-500"}`}>
            Nema rezultata.
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className={dark ? "bg-gray-800/50 text-xs uppercase tracking-wider text-gray-400" : "bg-gray-50 text-xs uppercase tracking-wider text-gray-500"}>
              <tr>
                <th className="px-4 py-3 text-left">Korisnik</th>
                <th className="px-4 py-3 text-left">Provider</th>
                <th className="px-4 py-3 text-center">Krediti</th>
                <th className="px-4 py-3 text-center">Turnira</th>
                <th className="px-4 py-3 text-left">Registracija</th>
                <th className="px-4 py-3 text-right">Akcija</th>
              </tr>
            </thead>
            <tbody className={dark ? "divide-y divide-gray-800" : "divide-y divide-gray-200"}>
              {users.map((u) => (
                <tr key={u.id} className={dark ? "hover:bg-gray-800/30" : "hover:bg-gray-50"}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        url={u.avatar_url}
                        name={u.name}
                        email={u.email}
                        size={32}
                        dark={dark}
                      />
                      <div className="min-w-0">
                        <div className={`truncate font-medium ${dark ? "text-white" : "text-gray-900"}`}>
                          {u.name || "(bez imena)"}
                        </div>
                        <div className={`truncate text-[11px] ${dark ? "text-gray-500" : "text-gray-500"}`}>
                          {u.email}
                          {u.email_verified && (
                            <ShieldCheck className="ml-1 inline h-3 w-3 text-emerald-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      u.provider === "google"
                        ? "bg-blue-500/10 text-blue-500"
                        : dark
                          ? "bg-gray-800 text-gray-400"
                          : "bg-gray-100 text-gray-600"
                    }`}>
                      {u.provider || "email"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {u.tournament_create_credits > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                        <Star className="h-3 w-3" />
                        {u.tournament_create_credits}
                      </span>
                    ) : (
                      <span className={`text-xs ${dark ? "text-gray-600" : "text-gray-400"}`}>0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {u.tournaments_owned ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-300">
                        <Trophy className="h-3 w-3" />
                        {u.tournaments_owned}
                      </span>
                    ) : (
                      <span className={`text-xs ${dark ? "text-gray-600" : "text-gray-400"}`}>–</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-xs ${dark ? "text-gray-400" : "text-gray-600"}`}>
                    {u.created_at && new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setGranting(u)}
                      className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-bold text-[#1a1004] shadow shadow-amber-500/25 transition-transform hover:scale-105"
                    >
                      <Sparkles className="h-3 w-3" /> Daj kredite
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between border-t px-4 py-3 text-xs ${
            dark ? "border-gray-800" : "border-gray-200"
          }`}>
            <span className={dark ? "text-gray-500" : "text-gray-600"}>
              Stranica {page} / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={`rounded-md px-3 py-1.5 disabled:opacity-40 ${
                  dark ? "border border-gray-700 text-gray-300 hover:bg-gray-800" : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                ←
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={`rounded-md px-3 py-1.5 disabled:opacity-40 ${
                  dark ? "border border-gray-700 text-gray-300 hover:bg-gray-800" : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {granting && (
        <GrantCreditsModal
          user={granting}
          onClose={() => setGranting(null)}
          onDone={(newCredits) => {
            setUsers((cur) =>
              cur.map((u) =>
                u.id === granting.id ? { ...u, tournament_create_credits: newCredits } : u,
              ),
            );
            setGranting(null);
            showToast("Krediti ažurirani");
          }}
          onError={(msg) => showToast(msg, false)}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium shadow-2xl ${
            toast.ok
              ? "border border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
              : "border border-red-500/30 bg-red-500/20 text-red-100"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.ok ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}

function GrantCreditsModal({
  user,
  onClose,
  onDone,
  onError,
}: {
  user: UserRow;
  onClose: () => void;
  onDone: (newCredits: number) => void;
  onError: (msg: string) => void;
}) {
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(delta: number) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, grant_credits: delta, reason: reason || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Greška");
      onDone(data.tournament_create_credits);
    } catch (e: any) {
      onError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-amber-400/30 bg-gradient-to-b from-[#241a08] to-[#160e02] p-6 text-white shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-amber-500/15 p-2 ring-1 ring-amber-400/30">
            <Sparkles className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <h3 className="text-base font-bold">Daj kredite za turnire</h3>
            <div className="text-xs text-white/55">
              {user.name || user.email} · trenutno: <b className="text-amber-200">{user.tournament_create_credits}</b>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/70">
            Količina (može biti negativna za oduzimanje)
          </label>
          <div className="flex gap-2">
            {[1, 3, 5, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setAmount(n)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
                  amount === n
                    ? "border-amber-400/60 bg-amber-500/20 text-amber-100"
                    : "border-white/10 bg-black/20 text-white/60 hover:border-white/30"
                }`}
              >
                +{n}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/50"
          />
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/70">
            Razlog (opcionalno, ide u audit log)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="npr. nagrada za rezultate, partner..."
            className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-amber-400/50"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/10"
          >
            Otkaži
          </button>
          {user.tournament_create_credits > 0 && (
            <button
              type="button"
              onClick={() => submit(-Math.abs(amount))}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-500/20"
            >
              <Minus className="h-3 w-3" /> Oduzmi {Math.abs(amount)}
            </button>
          )}
          <button
            type="button"
            onClick={() => submit(Math.abs(amount))}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-[#1a1004]"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3 w-3" />}
            Dodaj {Math.abs(amount)}
          </button>
        </div>
      </div>
    </div>
  );
}
