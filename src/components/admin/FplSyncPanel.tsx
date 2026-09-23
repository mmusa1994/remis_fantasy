"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  DownloadCloud,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  Trash2,
} from "lucide-react";

// Admin FPL sync za PL 26/27. ID-jevi liga se unose ovdje (ili se biraju
// preko FPL ID-ja menadžera) i čuvaju u browseru. Sync piše samo u
// standings tabele — tabele prijava se nikad ne diraju.

type Season = "25_26" | "26_27";
type LeagueKey = "premium" | "standard" | "h2h";

interface LeagueDef {
  key: LeagueKey;
  name: string;
  kind: "classic" | "h2h";
  accent: string; // hex
}

const LEAGUES: LeagueDef[] = [
  { key: "premium", name: "Premium", kind: "classic", accent: "#f59e0b" },
  { key: "standard", name: "Standard", kind: "classic", accent: "#3b82f6" },
  { key: "h2h", name: "H2H", kind: "h2h", accent: "#ef4444" },
];

const STORAGE_KEY = "remis_admin_fpl_league_ids_26_27";

interface Preview {
  name: string;
  players: number;
  leader: { name: string; team: string; total: number } | null;
}

interface SyncResult {
  mode: "full_sync" | "update";
  leagueName?: string;
  totalFPLPlayers: number;
  inserted?: number;
  updated: number;
  errors: number;
  notFound?: string[];
  notInFpl?: string[];
  matchedByEntryId?: boolean;
  message: string;
}

interface ManagerLeague {
  id: number;
  name: string;
  type: "classic" | "h2h";
}

interface Props {
  season: Season;
  isDark: boolean;
  disabled?: boolean;
  onSynced: () => Promise<void> | void;
  onToast: (message: string, type: "success" | "error") => void;
}

const readIds = (): Partial<Record<LeagueKey, string>> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

export default function FplSyncPanel({ season, isDark, disabled, onSynced, onToast }: Props) {
  const [ids, setIds] = useState<Partial<Record<LeagueKey, string>>>({});
  const [previews, setPreviews] = useState<Partial<Record<LeagueKey, Preview | { error: string }>>>({});
  const [checking, setChecking] = useState<LeagueKey | null>(null);
  const [busy, setBusy] = useState<{ key: LeagueKey | "all"; mode: "update" | "full" } | null>(null);
  const [results, setResults] = useState<Partial<Record<LeagueKey, SyncResult | { error: string }>>>({});
  const [managerId, setManagerId] = useState("");
  const [managerLeagues, setManagerLeagues] = useState<ManagerLeague[] | null>(null);
  const [finding, setFinding] = useState(false);
  const [openDetails, setOpenDetails] = useState<LeagueKey | null>(null);

  useEffect(() => {
    setIds(readIds());
  }, []);

  const saveId = (key: LeagueKey, value: string) => {
    const clean = value.replace(/[^\d]/g, "");
    setIds((prev) => {
      const next = { ...prev, [key]: clean };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    setPreviews((p) => ({ ...p, [key]: undefined }));
  };

  // Accept a pasted FPL URL too: .../leagues/123456/standings/c
  const handleIdInput = (key: LeagueKey, raw: string) => {
    const fromUrl = raw.match(/leagues\/(\d+)/);
    saveId(key, fromUrl ? fromUrl[1] : raw);
  };

  const checkLeague = async (league: LeagueDef) => {
    const id = ids[league.key];
    if (!id) return;
    setChecking(league.key);
    try {
      const res = await fetch(`/api/admin/update-from-fpl?leagueId=${id}&type=${league.kind}`);
      const data = await res.json();
      setPreviews((p) => ({ ...p, [league.key]: res.ok ? data : { error: data.error || "Greška" } }));
    } catch {
      setPreviews((p) => ({ ...p, [league.key]: { error: "FPL nije dostupan" } }));
    } finally {
      setChecking(null);
    }
  };

  const findLeagues = async () => {
    if (!managerId) return;
    setFinding(true);
    try {
      const res = await fetch(`/api/admin/update-from-fpl?managerId=${managerId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setManagerLeagues(data.leagues || []);
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Menadžer nije pronađen", "error");
      setManagerLeagues(null);
    } finally {
      setFinding(false);
    }
  };

  const runSync = async (league: LeagueDef, full: boolean): Promise<SyncResult | null> => {
    const id = ids[league.key];
    if (!id) {
      setResults((r) => ({ ...r, [league.key]: { error: "Nedostaje FPL ID lige" } }));
      return null;
    }
    const res = await fetch("/api/admin/update-from-fpl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leagueType: league.key, fullSync: full, season, fplLeagueId: Number(id) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setResults((r) => ({ ...r, [league.key]: { error: data.error || "Sync nije uspio" } }));
      return null;
    }
    setResults((r) => ({ ...r, [league.key]: data }));
    return data;
  };

  const syncOne = async (league: LeagueDef, full: boolean) => {
    setBusy({ key: league.key, mode: full ? "full" : "update" });
    try {
      const r = await runSync(league, full);
      await onSynced();
      if (r) onToast(`${league.name}: ${r.message}`, r.errors > 0 ? "error" : "success");
      else onToast(`${league.name}: sync nije uspio`, "error");
    } finally {
      setBusy(null);
    }
  };

  const clearLeague = async (league: LeagueDef) => {
    const ok = confirm(
      `Obrisati SVE igrače iz ${league.name} tabele (sezona 26/27)?\n\nPrijave (registracije) ostaju netaknute. Ovo se ne može poništiti.`
    );
    if (!ok) return;
    setBusy({ key: league.key, mode: "full" });
    try {
      const res = await fetch(`/api/admin/update-from-fpl?leagueType=${league.key}&season=${season}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Brisanje nije uspjelo");
      setResults((r) => ({ ...r, [league.key]: undefined }));
      await onSynced();
      onToast(`${league.name}: obrisano ${data.deleted} igrača`, "success");
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Brisanje nije uspjelo", "error");
    } finally {
      setBusy(null);
    }
  };

  const syncAll = async () => {
    setBusy({ key: "all", mode: "full" });
    let ok = 0;
    try {
      for (const league of LEAGUES) {
        if (!ids[league.key]) continue;
        if (await runSync(league, true)) ok++;
      }
      await onSynced();
      onToast(`Full sync završen: ${ok}/${LEAGUES.filter((l) => ids[l.key]).length} liga`, ok ? "success" : "error");
    } finally {
      setBusy(null);
    }
  };

  const surface = isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";
  const sub = isDark ? "text-gray-400" : "text-gray-500";
  const strong = isDark ? "text-white" : "text-gray-900";
  const inputCls = isDark
    ? "bg-gray-950 border-gray-700 text-white placeholder-gray-600 focus:border-purple-500"
    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500";

  if (season === "25_26") {
    return (
      <div className={`px-3 sm:px-4 lg:px-6 py-4 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
        <div className={`flex items-start gap-3 text-sm ${sub}`}>
          <Lock className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            Sezona 25/26 je završena i zaključana. FPL je te ID-jeve liga reciklirao, pa je sync
            isključen da se arhivske tabele ne pokvare. Ručne izmjene i grupno ažuriranje i dalje rade.
          </p>
        </div>
      </div>
    );
  }

  const anyBusy = busy !== null || disabled;
  const configuredCount = LEAGUES.filter((l) => ids[l.key]).length;

  return (
    <div className={`px-3 sm:px-4 lg:px-6 py-4 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-purple-500" />
            <h3 className={`text-sm font-bold uppercase tracking-wide ${strong}`}>FPL Sync · 26/27</h3>
          </div>
          <p className={`mt-1 text-xs flex items-center gap-1.5 ${sub}`}>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            Sigurno: ažurira i dodaje igrače, ništa ne briše. Prijave (registracije) se nikad ne mijenjaju.
          </p>
        </div>
        <button
          onClick={syncAll}
          disabled={anyBusy || configuredCount === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-lg shadow-purple-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <DownloadCloud className={`w-4 h-4 ${busy?.key === "all" ? "animate-bounce" : ""}`} />
          {busy?.key === "all" ? "Sinhronizujem…" : `Full sync sve lige (${configuredCount})`}
        </button>
      </div>

      {/* Find leagues by manager ID */}
      <div className={`mb-4 rounded-lg border p-3 ${surface}`}>
        <label className={`block text-xs font-semibold mb-2 ${sub}`}>
          Ne znaš ID liga? Unesi FPL ID svog tima (broj iz linka fantasy.premierleague.com/entry/<b>XXXX</b>/…)
        </label>
        <div className="flex gap-2">
          <input
            value={managerId}
            onChange={(e) => setManagerId(e.target.value.replace(/[^\d]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && findLeagues()}
            inputMode="numeric"
            placeholder="npr. 1234567"
            className={`flex-1 min-w-0 rounded-md border px-3 py-1.5 text-sm outline-none ${inputCls}`}
          />
          <button
            onClick={findLeagues}
            disabled={!managerId || finding}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold disabled:opacity-40 ${
              isDark ? "bg-gray-800 text-gray-200 hover:bg-gray-700" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            <Search className={`w-3.5 h-3.5 ${finding ? "animate-pulse" : ""}`} />
            Pronađi lige
          </button>
        </div>
        {managerLeagues && (
          <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto">
            {managerLeagues.length === 0 && <p className={`text-xs ${sub}`}>Nema privatnih liga.</p>}
            {managerLeagues.map((ml) => (
              <div
                key={`${ml.type}-${ml.id}`}
                className={`flex flex-wrap items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ${
                  isDark ? "bg-gray-950" : "bg-gray-50"
                }`}
              >
                <span className={`font-semibold ${strong}`}>{ml.name}</span>
                <span className={sub}>
                  #{ml.id} · {ml.type === "h2h" ? "H2H" : "Classic"}
                </span>
                <div className="ml-auto flex gap-1">
                  {LEAGUES.filter((l) => l.kind === ml.type).map((l) => (
                    <button
                      key={l.key}
                      onClick={() => saveId(l.key, String(ml.id))}
                      className="rounded px-2 py-0.5 font-semibold text-white"
                      style={{ backgroundColor: l.accent }}
                    >
                      → {l.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* League cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {LEAGUES.map((league) => {
          const preview = previews[league.key];
          const result = results[league.key];
          const isBusy = busy?.key === league.key;
          const id = ids[league.key] || "";
          return (
            <div
              key={league.key}
              className={`relative overflow-hidden rounded-xl border p-3.5 ${surface}`}
              style={{ borderTopColor: league.accent, borderTopWidth: 3 }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className={`text-sm font-bold ${strong}`}>{league.name}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${sub}`}>
                  {league.kind === "h2h" ? "Head-to-head" : "Classic"}
                </span>
              </div>

              <div className="flex gap-1.5">
                <input
                  value={id}
                  onChange={(e) => handleIdInput(league.key, e.target.value)}
                  onBlur={() => id && !preview && checkLeague(league)}
                  inputMode="numeric"
                  placeholder="FPL ID lige ili link"
                  className={`flex-1 min-w-0 rounded-md border px-2.5 py-1.5 text-sm font-mono outline-none ${inputCls}`}
                />
                {id && (
                  <a
                    href={`https://fantasy.premierleague.com/leagues/${id}/${league.kind === "h2h" ? "matches/h" : "standings/c"}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center rounded-md px-2 ${isDark ? "text-gray-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-100"}`}
                    title="Otvori na FPL-u"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Preview line */}
              <div className="mt-2 min-h-[34px] text-xs">
                {checking === league.key ? (
                  <span className={sub}>Provjeravam ligu…</span>
                ) : preview && "error" in preview ? (
                  <span className="flex items-center gap-1 text-red-500">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {preview.error}
                  </span>
                ) : preview ? (
                  <div>
                    <div className={`flex items-center gap-1 font-semibold ${strong}`}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{preview.name}</span>
                    </div>
                    <div className={sub}>
                      {preview.players} igrača
                      {preview.leader && ` · 1. ${preview.leader.team} (${preview.leader.total})`}
                    </div>
                  </div>
                ) : id ? (
                  <button onClick={() => checkLeague(league)} className="text-purple-500 font-semibold hover:underline">
                    Provjeri ligu
                  </button>
                ) : (
                  <span className={sub}>Unesi ID ili ga izaberi preko menadžera.</span>
                )}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => syncOne(league, false)}
                  disabled={anyBusy || !id}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold border disabled:opacity-40 ${
                    isDark ? "border-gray-700 text-gray-200 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                  title="Ažurira bodove postojećim igračima"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBusy && busy?.mode === "update" ? "animate-spin" : ""}`} />
                  Bodovi
                </button>
                <button
                  onClick={() => syncOne(league, true)}
                  disabled={anyBusy || !id}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                  style={{ backgroundColor: league.accent }}
                  title="Uvozi sve igrače iz FPL lige (bez brisanja)"
                >
                  <DownloadCloud className={`w-3.5 h-3.5 ${isBusy && busy?.mode === "full" ? "animate-bounce" : ""}`} />
                  Full sync
                </button>
              </div>

              <button
                onClick={() => clearLeague(league)}
                disabled={anyBusy}
                className={`mt-1.5 inline-flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold disabled:opacity-40 ${
                  isDark ? "text-red-400 hover:bg-red-500/10" : "text-red-600 hover:bg-red-50"
                }`}
                title="Briše sve igrače ove lige iz tabele 26/27 (ne dira prijave)"
              >
                <Trash2 className="w-3 h-3" />
                Očisti ligu
              </button>

              {/* Result */}
              {result && (
                <div
                  className={`mt-2.5 rounded-md px-2.5 py-2 text-xs ${
                    "error" in result
                      ? "bg-red-500/10 text-red-500"
                      : isDark
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-emerald-50 text-emerald-800"
                  }`}
                >
                  {"error" in result ? (
                    result.error
                  ) : (
                    <>
                      <div className="font-semibold">{result.message}</div>
                      {((result.notFound?.length ?? 0) > 0 || (result.notInFpl?.length ?? 0) > 0) && (
                        <button
                          onClick={() => setOpenDetails(openDetails === league.key ? null : league.key)}
                          className="mt-1 inline-flex items-center gap-1 underline-offset-2 hover:underline"
                        >
                          Detalji
                          <ChevronDown className={`w-3 h-3 transition-transform ${openDetails === league.key ? "rotate-180" : ""}`} />
                        </button>
                      )}
                      {openDetails === league.key && (
                        <div className={`mt-1.5 space-y-1.5 ${sub}`}>
                          {(result.notFound?.length ?? 0) > 0 && (
                            <div>
                              <div className="font-semibold">Na FPL-u, nema u tabeli ({result.notFound!.length}):</div>
                              <ul className="list-disc pl-4">
                                {result.notFound!.map((n) => <li key={n}>{n}</li>)}
                              </ul>
                            </div>
                          )}
                          {(result.notInFpl?.length ?? 0) > 0 && (
                            <div>
                              <div className="font-semibold">U tabeli, nema na FPL-u (zadržano) ({result.notInFpl!.length}):</div>
                              <ul className="list-disc pl-4">
                                {result.notInFpl!.map((n) => <li key={n}>{n}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
