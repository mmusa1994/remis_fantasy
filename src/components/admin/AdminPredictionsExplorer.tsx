"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  Trophy,
  Users,
  CalendarClock,
  ListChecks,
  ChevronRight,
  ArrowLeft,
  Search,
  CheckCircle2,
  Circle,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Pencil,
  Save as SaveIcon,
  X,
} from "lucide-react";
import type { Tournament } from "@/types/predictor";
import { normalizeLang } from "@/utils/predictor-i18n";

// -----------------------------------------------------------------------------
// Types (matches API responses)
// -----------------------------------------------------------------------------
export type AdminPredictionRow = {
  id: string;
  user_id: string;
  user_email: string | null;
  user_display_name: string | null;
  category_id: string;
  category_name: string;
  category_type: string;
  selected_option_ids: string[];
  text_value: string | null;
  numeric_value: number | null;
  score_home: number | null;
  score_away: number | null;
  points_awarded: number;
  is_scored: boolean;
  option_labels: string[];
  created_at: string;
  updated_at: string;
};

export type AdminMatchPredictionRow = {
  id: string;
  match_id: string;
  user_id: string;
  user_email: string | null;
  user_display_name: string | null;
  home_score: number;
  away_score: number;
  points_awarded: number;
  is_scored: boolean;
  created_at: string;
  updated_at: string;
  match_stage: string | null;
  match_stage_label: string | null;
  match_stage_label_en: string | null;
  match_label: string | null;
  match_label_en: string | null;
  match_kickoff_at: string | null;
  match_status: string | null;
  home_team: string | null;
  home_team_en: string | null;
  away_team: string | null;
  away_team_en: string | null;
  home_logo_url: string | null;
  away_logo_url: string | null;
  home_team_code: string | null;
  away_team_code: string | null;
  actual_home: number | null;
  actual_away: number | null;
};

type UserSummary = {
  user_id: string;
  user_display_name: string | null;
  user_email: string | null;
  category_count: number;
  match_count: number;
  total_points: number;
  rank: number;
};

type ExplorerMode = "leaderboard" | "matches" | "awards" | "user";

// -----------------------------------------------------------------------------
// Theme helpers
// -----------------------------------------------------------------------------
const card = (theme: string) =>
  theme === "dark"
    ? "bg-gray-900/70 border border-gray-800"
    : "bg-white border border-gray-200 shadow-sm";

const subCard = (theme: string) =>
  theme === "dark"
    ? "bg-gray-800/40 border border-gray-700/70"
    : "bg-gray-50 border border-gray-200";

const heading = (theme: string) =>
  theme === "dark" ? "text-white" : "text-gray-900";

const muted = (theme: string) =>
  theme === "dark" ? "text-gray-400" : "text-gray-600";

const subtle = (theme: string) =>
  theme === "dark" ? "text-gray-500" : "text-gray-500";

const inputCls = (theme: string) =>
  `w-full px-4 py-2.5 rounded-2xl outline-none text-sm transition-colors ${
    theme === "dark"
      ? "bg-gray-900 border border-gray-700 text-white focus:border-amber-500 placeholder-gray-500"
      : "bg-white border border-gray-300 text-gray-900 focus:border-amber-500 placeholder-gray-400"
  }`;

// -----------------------------------------------------------------------------
// MAIN EXPORT
// -----------------------------------------------------------------------------
export default function AdminPredictionsExplorer({
  tournament,
  theme,
}: {
  tournament: Tournament;
  theme: string;
}) {
  const { t, i18n } = useTranslation("predictor");
  const lang = normalizeLang(i18n.language);

  const [mode, setMode] = useState<ExplorerMode>("leaderboard");
  const [categoryRows, setCategoryRows] = useState<AdminPredictionRow[]>([]);
  const [matchRows, setMatchRows] = useState<AdminMatchPredictionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedUserId, setFocusedUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([
        fetch(
          `/api/admin/predictor/predictions?tournament_id=${tournament.id}`,
        ).then((r) => (r.ok ? r.json() : [])),
        fetch(
          `/api/admin/predictor/match-predictions?tournament_id=${tournament.id}`,
        ).then((r) => (r.ok ? r.json() : [])),
      ]);
      setCategoryRows(c ?? []);
      setMatchRows(m ?? []);
    } finally {
      setLoading(false);
    }
  }, [tournament.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Saves a manual score override for a single prediction.
  const saveScore = useCallback(
    async (
      kind: "category" | "match",
      id: string,
      points: number,
      isScored: boolean,
    ) => {
      const res = await fetch("/api/admin/predictor/score", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          id,
          points_awarded: points,
          is_scored: isScored,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setToast({
          kind: "err",
          msg:
            (j as { error?: string }).error ??
            t("admin.explorer.score.saveFailed"),
        });
        throw new Error("save failed");
      }
      if (kind === "category") {
        setCategoryRows((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, points_awarded: points, is_scored: isScored }
              : r,
          ),
        );
      } else {
        setMatchRows((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, points_awarded: points, is_scored: isScored }
              : r,
          ),
        );
      }
      setToast({ kind: "ok", msg: t("admin.explorer.score.saved") });
    },
    [t],
  );

  // Auto-dismiss toast after a moment.
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  // ---------------------------------------------------------------------------
  // Aggregate users (leaderboard summary)
  // ---------------------------------------------------------------------------
  const users: UserSummary[] = useMemo(() => {
    const map = new Map<string, UserSummary>();
    const seed = (
      uid: string,
      email: string | null,
      name: string | null,
    ) => {
      const cur = map.get(uid) ?? {
        user_id: uid,
        user_display_name: name,
        user_email: email,
        category_count: 0,
        match_count: 0,
        total_points: 0,
        rank: 0,
      };
      if (!cur.user_display_name && name) cur.user_display_name = name;
      if (!cur.user_email && email) cur.user_email = email;
      map.set(uid, cur);
      return cur;
    };
    for (const r of categoryRows) {
      const cur = seed(r.user_id, r.user_email, r.user_display_name);
      cur.category_count += 1;
      cur.total_points += r.points_awarded ?? 0;
    }
    for (const r of matchRows) {
      const cur = seed(r.user_id, r.user_email, r.user_display_name);
      cur.match_count += 1;
      cur.total_points += r.points_awarded ?? 0;
    }
    const arr = Array.from(map.values()).sort(
      (a, b) => b.total_points - a.total_points,
    );
    arr.forEach((u, idx) => (u.rank = idx + 1));
    return arr;
  }, [categoryRows, matchRows]);

  const focusedUser = focusedUserId
    ? users.find((u) => u.user_id === focusedUserId) ?? null
    : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div
        className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 ${card(theme)}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
                theme === "dark"
                  ? "bg-amber-500/15 border border-amber-500/30"
                  : "bg-amber-50 border border-amber-200"
              }`}
            >
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-lg sm:text-xl font-bold ${heading(theme)}`}>
                {t("admin.explorer.title")}
              </h3>
              <p className={`text-xs sm:text-sm mt-0.5 ${muted(theme)}`}>
                {t("admin.explorer.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`hidden sm:flex items-center gap-2 rounded-2xl px-4 py-2 ${subCard(theme)}`}
            >
              <Users className={`w-4 h-4 ${muted(theme)}`} />
              <span className={`text-sm font-semibold ${heading(theme)}`}>
                {users.length}
              </span>
              <span className={`text-xs ${muted(theme)}`}>
                {t("admin.explorer.users")}
              </span>
            </div>
            <div
              className={`hidden sm:flex items-center gap-2 rounded-2xl px-4 py-2 ${subCard(theme)}`}
            >
              <ListChecks className={`w-4 h-4 ${muted(theme)}`} />
              <span className={`text-sm font-semibold ${heading(theme)}`}>
                {categoryRows.length + matchRows.length}
              </span>
              <span className={`text-xs ${muted(theme)}`}>
                {t("admin.explorer.predictions")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mode switcher */}
      <div
        className={`flex gap-2 overflow-x-auto pb-1 pt-1 px-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      >
        {(
          [
            {
              id: "leaderboard",
              label: t("admin.explorer.tabs.leaderboard"),
              icon: Trophy,
            },
            {
              id: "matches",
              label: t("admin.explorer.tabs.matches"),
              icon: CalendarClock,
            },
            {
              id: "awards",
              label: t("admin.explorer.tabs.awards"),
              icon: Target,
            },
          ] as Array<{ id: ExplorerMode; label: string; icon: any }>
        ).map((it) => {
          const Icon = it.icon;
          const active = mode === it.id;
          return (
            <button
              key={it.id}
              onClick={() => {
                setMode(it.id);
                setFocusedUserId(null);
              }}
              className={`snap-start inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all whitespace-nowrap flex-shrink-0 border ${
                active
                  ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30"
                  : theme === "dark"
                    ? "bg-gray-900/60 text-gray-300 border-gray-700 hover:border-amber-500/60"
                    : "bg-white text-gray-700 border-gray-200 hover:border-amber-500/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              {it.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div
          className={`rounded-3xl p-12 flex flex-col items-center justify-center gap-3 ${card(theme)}`}
        >
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <p className={`text-sm ${muted(theme)}`}>
            {t("admin.explorer.loading")}
          </p>
        </div>
      ) : focusedUser ? (
        <UserDetailView
          user={focusedUser}
          categoryRows={categoryRows.filter(
            (r) => r.user_id === focusedUser.user_id,
          )}
          matchRows={matchRows.filter(
            (r) => r.user_id === focusedUser.user_id,
          )}
          tournament={tournament}
          theme={theme}
          lang={lang}
          onBack={() => setFocusedUserId(null)}
          onSaveScore={saveScore}
        />
      ) : mode === "leaderboard" ? (
        <LeaderboardView
          users={users}
          tournament={tournament}
          theme={theme}
          onSelect={setFocusedUserId}
        />
      ) : mode === "matches" ? (
        <MatchesByDayView
          matchRows={matchRows}
          tournament={tournament}
          theme={theme}
          lang={lang}
          onSaveScore={saveScore}
        />
      ) : (
        <AwardsTemplateView
          categoryRows={categoryRows}
          tournament={tournament}
          theme={theme}
        />
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-xl text-sm font-semibold border ${
            toast.kind === "ok"
              ? theme === "dark"
                ? "bg-emerald-950/80 text-emerald-200 border-emerald-800/60"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
              : theme === "dark"
                ? "bg-red-950/80 text-red-200 border-red-800/60"
                : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Inline score editor — admin can override points + scored flag per prediction
// -----------------------------------------------------------------------------
type SaveScoreFn = (
  kind: "category" | "match",
  id: string,
  points: number,
  isScored: boolean,
) => Promise<void>;

function ScoreEditor({
  kind,
  id,
  points,
  isScored,
  theme,
  onSave,
}: {
  kind: "category" | "match";
  id: string;
  points: number;
  isScored: boolean;
  theme: string;
  onSave: SaveScoreFn;
}) {
  const { t } = useTranslation("predictor");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(points);
  const [draftScored, setDraftScored] = useState(isScored);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(points);
    setDraftScored(isScored);
  }, [points, isScored, open]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(kind, id, Number(draft) || 0, draftScored);
      setOpen(false);
    } catch {
      /* toast surfaced by parent */
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${
          theme === "dark"
            ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
            : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
        }`}
        title={t("admin.explorer.score.edit") as string}
      >
        <Pencil className="w-3 h-3" />
        {t("admin.explorer.score.edit")}
      </button>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl ${
        theme === "dark"
          ? "bg-gray-900 border border-gray-700"
          : "bg-white border border-gray-300"
      }`}
    >
      <input
        type="number"
        value={Number.isFinite(draft) ? draft : 0}
        onChange={(e) =>
          setDraft(e.target.value === "" ? 0 : Number(e.target.value))
        }
        className={`w-16 px-2 py-1 rounded-xl text-sm font-bold text-center tabular-nums outline-none ${
          theme === "dark"
            ? "bg-gray-800 text-white border border-gray-700 focus:border-amber-500"
            : "bg-gray-50 text-gray-900 border border-gray-200 focus:border-amber-500"
        }`}
      />
      <button
        type="button"
        onClick={() => setDraftScored((v) => !v)}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold border transition-colors ${
          draftScored
            ? theme === "dark"
              ? "bg-emerald-950/50 text-emerald-300 border-emerald-800/60"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
            : theme === "dark"
              ? "bg-gray-800 text-gray-400 border-gray-700"
              : "bg-gray-100 text-gray-600 border-gray-300"
        }`}
        title={
          (draftScored
            ? t("admin.explorer.score.markUnscored")
            : t("admin.explorer.score.markScored")) as string
        }
      >
        {draftScored ? (
          <CheckCircle2 className="w-3 h-3" />
        ) : (
          <Circle className="w-3 h-3" />
        )}
        {draftScored
          ? t("admin.explorer.scored")
          : t("admin.explorer.notScored")}
      </button>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-60 shadow-sm shadow-amber-500/30"
      >
        {saving ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <SaveIcon className="w-3 h-3" />
        )}
        {t("admin.explorer.score.save")}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold transition-colors ${
          theme === "dark"
            ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        <X className="w-3 h-3" />
        {t("admin.explorer.score.cancel")}
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Leaderboard view — mobile-friendly cards (no table)
// -----------------------------------------------------------------------------
function LeaderboardView({
  users,
  tournament,
  theme,
  onSelect,
}: {
  users: UserSummary[];
  tournament: Tournament;
  theme: string;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation("predictor");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query) return users;
    const q = query.toLowerCase();
    return users.filter(
      (u) =>
        (u.user_display_name ?? "").toLowerCase().includes(q) ||
        (u.user_email ?? "").toLowerCase().includes(q),
    );
  }, [users, query]);

  if (users.length === 0) {
    return (
      <div
        className={`rounded-3xl border border-dashed p-10 text-center text-sm ${
          theme === "dark"
            ? "border-gray-700 text-gray-400"
            : "border-gray-300 text-gray-500"
        }`}
      >
        {t("admin.explorer.noPredictionsYet")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${subtle(theme)}`}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("admin.explorer.searchUser") as string}
          className={`${inputCls(theme)} pl-10`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((u) => (
          <UserCard
            key={u.user_id}
            user={u}
            tournament={tournament}
            theme={theme}
            onClick={() => onSelect(u.user_id)}
          />
        ))}
      </div>
    </div>
  );
}

function UserCard({
  user,
  tournament,
  theme,
  onClick,
}: {
  user: UserSummary;
  tournament: Tournament;
  theme: string;
  onClick: () => void;
}) {
  const { t } = useTranslation("predictor");
  const isTop3 = user.rank <= 3;
  const medal =
    user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : user.rank === 3 ? "🥉" : null;
  const accentText = tournamentAccentText(tournament.accent_color);
  const initials = (user.user_display_name || user.user_email || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group text-left rounded-3xl p-4 sm:p-5 transition-all hover:-translate-y-0.5 active:scale-[0.99] ${card(theme)} ${
        isTop3 ? "ring-1 ring-amber-500/30" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`relative flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${
              isTop3
                ? "bg-gradient-to-br from-amber-400 to-amber-600 text-black"
                : theme === "dark"
                  ? "bg-gray-800 text-gray-200 border border-gray-700"
                  : "bg-gray-100 text-gray-700 border border-gray-200"
            }`}
          >
            {medal ? (
              <span className="text-2xl leading-none">{medal}</span>
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <div className={`font-bold truncate ${heading(theme)}`}>
              {user.user_display_name ||
                user.user_email?.split("@")[0] ||
                "Korisnik"}
            </div>
            {user.user_email && (
              <div className={`text-xs truncate ${subtle(theme)}`}>
                {user.user_email}
              </div>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-2xl font-black ${accentText}`}>
            {user.total_points}
          </div>
          <div className={`text-[10px] uppercase tracking-wider ${subtle(theme)}`}>
            {t("admin.explorer.totalPoints")}
          </div>
        </div>
      </div>

      <div
        className={`mt-4 grid grid-cols-2 gap-2 rounded-2xl px-3 py-2.5 ${subCard(theme)}`}
      >
        <div className="text-center">
          <div className={`text-sm font-bold ${heading(theme)}`}>
            {user.category_count}
          </div>
          <div className={`text-[10px] uppercase tracking-wider ${subtle(theme)}`}>
            {t("admin.explorer.categoryPredictions")}
          </div>
        </div>
        <div className="text-center">
          <div className={`text-sm font-bold ${heading(theme)}`}>
            {user.match_count}
          </div>
          <div className={`text-[10px] uppercase tracking-wider ${subtle(theme)}`}>
            {t("admin.explorer.matchPredictions")}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold ${subtle(theme)}`}
        >
          #{user.rank} {t("admin.explorer.rank")}
        </span>
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold ${accentText} group-hover:gap-2 transition-all`}
        >
          {t("admin.explorer.openUser")}
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </button>
  );
}

// -----------------------------------------------------------------------------
// User detail — drill into all predictions of one user
// -----------------------------------------------------------------------------
function UserDetailView({
  user,
  categoryRows,
  matchRows,
  tournament,
  theme,
  lang,
  onBack,
  onSaveScore,
}: {
  user: UserSummary;
  categoryRows: AdminPredictionRow[];
  matchRows: AdminMatchPredictionRow[];
  tournament: Tournament;
  theme: string;
  lang: "bs" | "en";
  onBack: () => void;
  onSaveScore: SaveScoreFn;
}) {
  const { t } = useTranslation("predictor");
  const accentText = tournamentAccentText(tournament.accent_color);

  // Group match predictions by day
  const matchesByDay = useMemo(() => {
    const map = new Map<string, AdminMatchPredictionRow[]>();
    for (const r of matchRows) {
      const day = r.match_kickoff_at
        ? new Date(r.match_kickoff_at).toISOString().slice(0, 10)
        : "tbd";
      const arr = map.get(day) ?? [];
      arr.push(r);
      map.set(day, arr);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, list]) => ({
        day,
        list: list.sort((a, b) => {
          const ta = a.match_kickoff_at ? Date.parse(a.match_kickoff_at) : 0;
          const tb = b.match_kickoff_at ? Date.parse(b.match_kickoff_at) : 0;
          return ta - tb;
        }),
      }));
  }, [matchRows]);

  return (
    <div className="space-y-5">
      {/* Back + summary */}
      <div className={`rounded-3xl p-4 sm:p-5 ${card(theme)}`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={onBack}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-semibold ${
              theme === "dark"
                ? "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            {t("admin.explorer.back")}
          </button>
          <div className="text-right">
            <div className={`text-3xl font-black ${accentText}`}>
              {user.total_points}
            </div>
            <div className={`text-[10px] uppercase tracking-wider ${subtle(theme)}`}>
              {t("admin.explorer.totalPoints")}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-xl font-bold ${heading(theme)}`}>
            {user.user_display_name ||
              user.user_email?.split("@")[0] ||
              "Korisnik"}
          </div>
          {user.user_email && (
            <div className={`text-xs ${subtle(theme)}`}>{user.user_email}</div>
          )}
        </div>
      </div>

      {/* Tournament template (category) predictions */}
      {categoryRows.length > 0 && (
        <Section
          theme={theme}
          icon={Target}
          title={t("admin.explorer.categoryPredictions")}
          count={categoryRows.length}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categoryRows.map((r) => (
              <CategoryPredictionCard
                key={r.id}
                row={r}
                theme={theme}
                onSaveScore={onSaveScore}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Match predictions grouped by day */}
      {matchesByDay.length > 0 && (
        <Section
          theme={theme}
          icon={CalendarClock}
          title={t("admin.explorer.matchPredictions")}
          count={matchRows.length}
        >
          <div className="space-y-4">
            {matchesByDay.map(({ day, list }) => (
              <DayBlock
                key={day}
                day={day}
                count={list.length}
                theme={theme}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {list.map((m) => (
                    <UserMatchPredictionCard
                      key={m.id}
                      row={m}
                      theme={theme}
                      lang={lang}
                      onSaveScore={onSaveScore}
                    />
                  ))}
                </div>
              </DayBlock>
            ))}
          </div>
        </Section>
      )}

      {categoryRows.length === 0 && matchRows.length === 0 && (
        <div
          className={`rounded-3xl border border-dashed p-10 text-center text-sm ${
            theme === "dark"
              ? "border-gray-700 text-gray-400"
              : "border-gray-300 text-gray-500"
          }`}
        >
          {t("admin.explorer.noPredictionsYet")}
        </div>
      )}
    </div>
  );
}

function CategoryPredictionCard({
  row,
  theme,
  onSaveScore,
}: {
  row: AdminPredictionRow;
  theme: string;
  onSaveScore?: SaveScoreFn;
}) {
  const { t } = useTranslation("predictor");
  let answer: string | null = null;
  if (row.score_home != null && row.score_away != null) {
    answer = `${row.score_home} : ${row.score_away}`;
  } else if (row.numeric_value != null) {
    answer = String(row.numeric_value);
  } else if (row.text_value) {
    answer = row.text_value;
  } else if (row.option_labels?.length) {
    answer = row.option_labels.join(", ");
  }
  return (
    <div className={`rounded-2xl p-4 ${subCard(theme)}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div
          className={`text-[10px] uppercase tracking-wider font-bold ${muted(theme)}`}
        >
          {row.category_name}
        </div>
        <span
          className={`flex-shrink-0 inline-flex items-baseline gap-1 px-2 py-0.5 rounded-full whitespace-nowrap ${
            row.is_scored
              ? theme === "dark"
                ? "bg-emerald-950/50 text-emerald-300 border border-emerald-800/60"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : theme === "dark"
                ? "bg-gray-800 text-gray-400 border border-gray-700"
                : "bg-gray-100 text-gray-600 border border-gray-200"
          }`}
        >
          {row.is_scored ? (
            <>
              <span className="text-sm font-black tabular-nums leading-none">
                {row.points_awarded}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider leading-none">
                pts
              </span>
            </>
          ) : (
            <span className="text-[10px] uppercase font-bold tracking-wider leading-none inline-flex items-center gap-1">
              <Circle className="w-3 h-3" />
              {t("admin.explorer.notScored")}
            </span>
          )}
        </span>
      </div>
      <div className={`font-semibold ${heading(theme)} break-words mb-2.5`}>
        {answer || (
          <span className={subtle(theme)}>{t("admin.explorer.noPick")}</span>
        )}
      </div>
      {onSaveScore && (
        <div className="flex items-center justify-end pt-2 border-t border-dashed border-current/20">
          <ScoreEditor
            kind="category"
            id={row.id}
            points={row.points_awarded ?? 0}
            isScored={!!row.is_scored}
            theme={theme}
            onSave={onSaveScore}
          />
        </div>
      )}
    </div>
  );
}

function UserMatchPredictionCard({
  row,
  theme,
  lang,
  onSaveScore,
}: {
  row: AdminMatchPredictionRow;
  theme: string;
  lang: "bs" | "en";
  onSaveScore?: SaveScoreFn;
}) {
  const { t } = useTranslation("predictor");
  const home = lang === "en" && row.home_team_en ? row.home_team_en : row.home_team;
  const away = lang === "en" && row.away_team_en ? row.away_team_en : row.away_team;
  const stageLabel =
    (lang === "en" && row.match_stage_label_en) ||
    row.match_stage_label ||
    row.match_stage;
  const time = row.match_kickoff_at
    ? new Date(row.match_kickoff_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const hasActual = row.actual_home != null && row.actual_away != null;
  const outcomeColor =
    !hasActual
      ? subtle(theme)
      : row.home_score === row.actual_home && row.away_score === row.actual_away
        ? "text-emerald-500"
        : Math.sign(row.home_score - row.away_score) ===
            Math.sign((row.actual_home ?? 0) - (row.actual_away ?? 0))
          ? "text-amber-500"
          : "text-red-500";

  return (
    <div className={`rounded-2xl p-3.5 ${subCard(theme)}`}>
      <div className="flex items-center justify-between mb-2.5 text-[10px] uppercase tracking-wider font-bold gap-2">
        <span className={muted(theme)}>{stageLabel || "—"}</span>
        {time && <span className={subtle(theme)}>{time}</span>}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <TeamLabel
          name={home}
          logo={row.home_logo_url}
          theme={theme}
          align="right"
        />
        <div className="flex flex-col items-center gap-1">
          <div className={`text-xl font-black tabular-nums ${outcomeColor}`}>
            {row.home_score} : {row.away_score}
          </div>
          {hasActual && (
            <div
              className={`text-[10px] uppercase tracking-wider font-bold ${subtle(theme)}`}
            >
              {t("admin.explorer.actual")} {row.actual_home} : {row.actual_away}
            </div>
          )}
        </div>
        <TeamLabel
          name={away}
          logo={row.away_logo_url}
          theme={theme}
          align="left"
        />
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span
          className={`text-[10px] uppercase tracking-wider font-bold ${subtle(theme)}`}
        >
          {t("admin.explorer.tip")}
        </span>
        <span
          className={`flex-shrink-0 inline-flex items-baseline gap-1 px-2 py-0.5 rounded-full whitespace-nowrap ${
            row.is_scored
              ? theme === "dark"
                ? "bg-emerald-950/50 text-emerald-300 border border-emerald-800/60"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : theme === "dark"
                ? "bg-gray-800 text-gray-400 border border-gray-700"
                : "bg-gray-100 text-gray-600 border border-gray-200"
          }`}
        >
          <span className="text-sm font-black tabular-nums leading-none">
            {row.points_awarded}
          </span>
          <span className="text-[9px] uppercase font-bold tracking-wider leading-none">
            pts
          </span>
        </span>
      </div>
      {onSaveScore && (
        <div className="mt-2 flex items-center justify-end pt-2 border-t border-dashed border-current/20">
          <ScoreEditor
            kind="match"
            id={row.id}
            points={row.points_awarded ?? 0}
            isScored={!!row.is_scored}
            theme={theme}
            onSave={onSaveScore}
          />
        </div>
      )}
    </div>
  );
}

function TeamLabel({
  name,
  logo,
  theme,
  align,
}: {
  name: string | null;
  logo: string | null;
  theme: string;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex items-center gap-2 min-w-0 ${
        align === "right" ? "justify-end" : "justify-start"
      }`}
    >
      {align === "right" && (
        <span
          className={`truncate font-semibold text-sm ${heading(theme)}`}
        >
          {name || "—"}
        </span>
      )}
      {logo && (
        <div
          className={`flex-shrink-0 w-7 h-7 rounded-xl overflow-hidden flex items-center justify-center ${
            theme === "dark" ? "bg-gray-900/60" : "bg-white"
          }`}
        >
          <Image
            src={logo}
            alt={name || ""}
            width={24}
            height={24}
            className="w-6 h-6 object-contain"
          />
        </div>
      )}
      {align === "left" && (
        <span
          className={`truncate font-semibold text-sm ${heading(theme)}`}
        >
          {name || "—"}
        </span>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Matches-by-day view (all users' predictions per match)
// -----------------------------------------------------------------------------
function MatchesByDayView({
  matchRows,
  tournament: _tournament,
  theme,
  lang,
  onSaveScore,
}: {
  matchRows: AdminMatchPredictionRow[];
  tournament: Tournament;
  theme: string;
  lang: "bs" | "en";
  onSaveScore?: SaveScoreFn;
}) {
  const { t } = useTranslation("predictor");
  const [query, setQuery] = useState("");
  const [openMatch, setOpenMatch] = useState<string | null>(null);

  type MatchGroup = {
    match_id: string;
    home: string | null;
    away: string | null;
    home_logo: string | null;
    away_logo: string | null;
    stage: string | null;
    stage_label: string | null;
    stage_label_en: string | null;
    kickoff_at: string | null;
    actual_home: number | null;
    actual_away: number | null;
    predictions: AdminMatchPredictionRow[];
  };

  const groups = useMemo(() => {
    const map = new Map<string, MatchGroup>();
    for (const r of matchRows) {
      if (!r.match_id) continue;
      const g = map.get(r.match_id) ?? {
        match_id: r.match_id,
        home: r.home_team,
        away: r.away_team,
        home_logo: r.home_logo_url,
        away_logo: r.away_logo_url,
        stage: r.match_stage,
        stage_label: r.match_stage_label,
        stage_label_en: r.match_stage_label_en,
        kickoff_at: r.match_kickoff_at,
        actual_home: r.actual_home,
        actual_away: r.actual_away,
        predictions: [],
      };
      g.predictions.push(r);
      map.set(r.match_id, g);
    }
    let list = Array.from(map.values());
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (g) =>
          (g.home ?? "").toLowerCase().includes(q) ||
          (g.away ?? "").toLowerCase().includes(q) ||
          (g.stage_label ?? "").toLowerCase().includes(q) ||
          (g.stage ?? "").toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => {
      const ta = a.kickoff_at ? Date.parse(a.kickoff_at) : 0;
      const tb = b.kickoff_at ? Date.parse(b.kickoff_at) : 0;
      return ta - tb;
    });
  }, [matchRows, query]);

  const byDay = useMemo(() => {
    const m = new Map<string, MatchGroup[]>();
    for (const g of groups) {
      const key = g.kickoff_at
        ? new Date(g.kickoff_at).toISOString().slice(0, 10)
        : "tbd";
      const arr = m.get(key) ?? [];
      arr.push(g);
      m.set(key, arr);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [groups]);

  if (matchRows.length === 0) {
    return (
      <div
        className={`rounded-3xl border border-dashed p-10 text-center text-sm ${
          theme === "dark"
            ? "border-gray-700 text-gray-400"
            : "border-gray-300 text-gray-500"
        }`}
      >
        {t("admin.explorer.noPredictionsYet")}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search
          className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${subtle(theme)}`}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("admin.explorer.searchTeam") as string}
          className={`${inputCls(theme)} pl-10`}
        />
      </div>

      {byDay.length === 0 ? (
        <div
          className={`rounded-3xl border border-dashed p-10 text-center text-sm ${
            theme === "dark"
              ? "border-gray-700 text-gray-400"
              : "border-gray-300 text-gray-500"
          }`}
        >
          {t("admin.explorer.noMatchesYet")}
        </div>
      ) : (
        byDay.map(([day, list]) => (
          <DayBlock
            key={day}
            day={day}
            count={list.length}
            theme={theme}
            countLabel={t("admin.explorer.predictions")}
          >
            <div className="space-y-3">
              {list.map((g) => (
                <MatchGroupCard
                  key={g.match_id}
                  group={g}
                  theme={theme}
                  lang={lang}
                  open={openMatch === g.match_id}
                  onToggle={() =>
                    setOpenMatch(openMatch === g.match_id ? null : g.match_id)
                  }
                  onSaveScore={onSaveScore}
                />
              ))}
            </div>
          </DayBlock>
        ))
      )}
    </div>
  );
}

function MatchGroupCard({
  group,
  theme,
  lang,
  open,
  onToggle,
  onSaveScore,
}: {
  group: {
    match_id: string;
    home: string | null;
    away: string | null;
    home_logo: string | null;
    away_logo: string | null;
    stage: string | null;
    stage_label: string | null;
    stage_label_en: string | null;
    kickoff_at: string | null;
    actual_home: number | null;
    actual_away: number | null;
    predictions: AdminMatchPredictionRow[];
  };
  theme: string;
  lang: "bs" | "en";
  open: boolean;
  onToggle: () => void;
  onSaveScore?: SaveScoreFn;
}) {
  const { t } = useTranslation("predictor");
  const stageLabel =
    (lang === "en" && group.stage_label_en) || group.stage_label || group.stage;
  const time = group.kickoff_at
    ? new Date(group.kickoff_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const hasActual =
    group.actual_home != null && group.actual_away != null;

  return (
    <div className={`rounded-2xl ${card(theme)} overflow-hidden`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full text-left p-4 transition-colors ${
          theme === "dark" ? "hover:bg-gray-800/40" : "hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold ${muted(theme)}`}
          >
            {stageLabel || "—"}
          </span>
          <div className="flex items-center gap-2">
            {time && (
              <span
                className={`text-[10px] uppercase tracking-wider font-bold ${subtle(theme)}`}
              >
                {time}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                theme === "dark"
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {group.predictions.length} {t("admin.explorer.predictions")}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
          <TeamLabel
            name={group.home}
            logo={group.home_logo}
            theme={theme}
            align="right"
          />
          <div className="flex flex-col items-center gap-0.5">
            {hasActual ? (
              <>
                <div className="text-xl font-black tabular-nums text-emerald-500">
                  {group.actual_home} : {group.actual_away}
                </div>
                <div
                  className={`text-[10px] uppercase tracking-wider font-bold ${subtle(theme)}`}
                >
                  {t("admin.explorer.actual")}
                </div>
              </>
            ) : (
              <div
                className={`text-xl font-black tabular-nums ${subtle(theme)}`}
              >
                – : –
              </div>
            )}
          </div>
          <TeamLabel
            name={group.away}
            logo={group.away_logo}
            theme={theme}
            align="left"
          />
        </div>
        <div className="mt-2 flex items-center justify-end">
          {open ? (
            <ChevronUp className={`w-4 h-4 ${subtle(theme)}`} />
          ) : (
            <ChevronDown className={`w-4 h-4 ${subtle(theme)}`} />
          )}
        </div>
      </button>
      {open && (
        <div
          className={`border-t p-4 space-y-2 ${
            theme === "dark" ? "border-gray-800 bg-black/20" : "border-gray-200 bg-gray-50/60"
          }`}
        >
          {[...group.predictions]
            .sort((a, b) => b.points_awarded - a.points_awarded)
            .map((p) => (
              <PerUserRow
                key={p.id}
                p={p}
                theme={theme}
                actualHome={group.actual_home}
                actualAway={group.actual_away}
                onSaveScore={onSaveScore}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function PerUserRow({
  p,
  theme,
  actualHome,
  actualAway,
  onSaveScore,
}: {
  p: AdminMatchPredictionRow;
  theme: string;
  actualHome: number | null;
  actualAway: number | null;
  onSaveScore?: SaveScoreFn;
}) {
  const hasActual = actualHome != null && actualAway != null;
  const outcomeColor =
    !hasActual
      ? subtle(theme)
      : p.home_score === actualHome && p.away_score === actualAway
        ? "text-emerald-500"
        : Math.sign(p.home_score - p.away_score) ===
            Math.sign((actualHome ?? 0) - (actualAway ?? 0))
          ? "text-amber-500"
          : "text-red-500";
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl px-3 py-2.5 ${subCard(theme)}`}
    >
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-semibold truncate ${heading(theme)}`}>
          {p.user_display_name || p.user_email?.split("@")[0] || "Korisnik"}
        </div>
        {p.user_email && (
          <div className={`text-[11px] truncate ${subtle(theme)}`}>
            {p.user_email}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
        <div className={`text-base font-black tabular-nums ${outcomeColor}`}>
          {p.home_score} : {p.away_score}
        </div>
        <span
          className={`flex-shrink-0 inline-flex items-baseline gap-1 px-2 py-0.5 rounded-full whitespace-nowrap ${
            p.is_scored
              ? theme === "dark"
                ? "bg-emerald-950/50 text-emerald-300 border border-emerald-800/60"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : theme === "dark"
                ? "bg-gray-800 text-gray-400 border border-gray-700"
                : "bg-gray-100 text-gray-600 border border-gray-200"
          }`}
        >
          <span className="text-sm font-black tabular-nums leading-none">
            {p.points_awarded}
          </span>
          <span className="text-[9px] uppercase font-bold tracking-wider leading-none">
            pts
          </span>
        </span>
        {onSaveScore && (
          <ScoreEditor
            kind="match"
            id={p.id}
            points={p.points_awarded ?? 0}
            isScored={!!p.is_scored}
            theme={theme}
            onSave={onSaveScore}
          />
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Awards / Tournament Template — shows which user picked what per category
// -----------------------------------------------------------------------------
function AwardsTemplateView({
  categoryRows,
  tournament: _tournament,
  theme,
}: {
  categoryRows: AdminPredictionRow[];
  tournament: Tournament;
  theme: string;
}) {
  const { t } = useTranslation("predictor");

  // Group by category
  const categories = useMemo(() => {
    const map = new Map<
      string,
      {
        category_id: string;
        category_name: string;
        category_type: string;
        predictions: AdminPredictionRow[];
      }
    >();
    for (const r of categoryRows) {
      const cur = map.get(r.category_id) ?? {
        category_id: r.category_id,
        category_name: r.category_name,
        category_type: r.category_type,
        predictions: [],
      };
      cur.predictions.push(r);
      map.set(r.category_id, cur);
    }
    return Array.from(map.values());
  }, [categoryRows]);

  if (categoryRows.length === 0) {
    return (
      <div
        className={`rounded-3xl border border-dashed p-10 text-center text-sm ${
          theme === "dark"
            ? "border-gray-700 text-gray-400"
            : "border-gray-300 text-gray-500"
        }`}
      >
        {t("admin.explorer.noAwardsYet")}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {categories.map((cat) => (
        <AwardsCategoryBlock key={cat.category_id} cat={cat} theme={theme} />
      ))}
    </div>
  );
}

function AwardsCategoryBlock({
  cat,
  theme,
}: {
  cat: {
    category_id: string;
    category_name: string;
    category_type: string;
    predictions: AdminPredictionRow[];
  };
  theme: string;
}) {
  const { t } = useTranslation("predictor");
  // Histogram of answers
  const histogram = useMemo(() => {
    const map = new Map<string, AdminPredictionRow[]>();
    for (const r of cat.predictions) {
      let answer = "—";
      if (r.score_home != null && r.score_away != null) {
        answer = `${r.score_home} : ${r.score_away}`;
      } else if (r.numeric_value != null) {
        answer = String(r.numeric_value);
      } else if (r.text_value) {
        answer = r.text_value.trim();
      } else if (r.option_labels?.length) {
        answer = r.option_labels.join(", ");
      }
      const arr = map.get(answer) ?? [];
      arr.push(r);
      map.set(answer, arr);
    }
    return Array.from(map.entries())
      .map(([answer, list]) => ({ answer, list }))
      .sort((a, b) => b.list.length - a.list.length);
  }, [cat.predictions]);

  const total = cat.predictions.length;

  return (
    <div className={`rounded-3xl p-5 ${card(theme)}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h4 className={`text-base font-bold ${heading(theme)}`}>
            {cat.category_name}
          </h4>
          <p className={`text-xs ${muted(theme)}`}>
            {total} {t("admin.explorer.predictions")}
          </p>
        </div>
      </div>
      <div className="space-y-2.5">
        {histogram.map(({ answer, list }) => {
          const pct = total > 0 ? Math.round((list.length / total) * 100) : 0;
          return (
            <details
              key={answer}
              className={`rounded-2xl border ${
                theme === "dark"
                  ? "border-gray-800 bg-gray-900/50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <summary className="cursor-pointer list-none p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className={`font-semibold truncate ${heading(theme)}`}>
                    {answer || (
                      <span className={subtle(theme)}>
                        {t("admin.explorer.noPick")}
                      </span>
                    )}
                  </div>
                  <div
                    className={`mt-1 h-1.5 rounded-full overflow-hidden ${
                      theme === "dark" ? "bg-gray-800" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-lg font-black ${heading(theme)}`}>
                    {list.length}
                  </div>
                  <div
                    className={`text-[10px] uppercase tracking-wider ${subtle(theme)}`}
                  >
                    {pct}%
                  </div>
                </div>
              </summary>
              <div
                className={`px-3.5 pb-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t ${
                  theme === "dark" ? "border-gray-800" : "border-gray-200"
                }`}
              >
                <div className="col-span-full pt-2">
                  {list.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between gap-2 py-1.5 ${
                        subtle(theme)
                      }`}
                    >
                      <span className={`text-sm font-semibold ${heading(theme)} truncate`}>
                        {p.user_display_name ||
                          p.user_email?.split("@")[0] ||
                          "Korisnik"}
                      </span>
                      <span className={`text-[11px] ${subtle(theme)} flex-shrink-0`}>
                        {p.points_awarded} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Shared layout helpers
// -----------------------------------------------------------------------------
function Section({
  theme,
  icon: Icon,
  title,
  count,
  children,
}: {
  theme: string;
  icon: any;
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-amber-500" />
        <h4 className={`text-sm font-bold uppercase tracking-widest ${muted(theme)}`}>
          {title}
        </h4>
        {count != null && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              theme === "dark"
                ? "bg-gray-800 text-gray-300 border border-gray-700"
                : "bg-gray-100 text-gray-700 border border-gray-200"
            }`}
          >
            {count}
          </span>
        )}
        <div
          className={`flex-1 h-px ${
            theme === "dark" ? "bg-gray-800" : "bg-gray-200"
          }`}
        />
      </div>
      {children}
    </div>
  );
}

function DayBlock({
  day,
  count,
  countLabel,
  theme,
  children,
}: {
  day: string;
  count: number;
  countLabel?: string;
  theme: string;
  children: React.ReactNode;
}) {
  const { t, i18n } = useTranslation("predictor");
  const lang = normalizeLang(i18n.language);
  const date = day === "tbd" ? null : new Date(`${day}T00:00:00`);
  const formatted = date
    ? date.toLocaleDateString(lang === "en" ? "en-GB" : "bs-BA", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "TBD";
  return (
    <div>
      <div
        className={`sticky top-0 z-10 -mx-1 px-1 py-1 backdrop-blur ${
          theme === "dark" ? "bg-black/40" : "bg-white/60"
        }`}
      >
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-amber-500" />
          <h5 className={`text-sm font-bold ${heading(theme)} capitalize`}>
            {formatted}
          </h5>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              theme === "dark"
                ? "bg-gray-800 text-gray-300 border border-gray-700"
                : "bg-gray-100 text-gray-700 border border-gray-200"
            }`}
          >
            {count} {countLabel || t("admin.explorer.predictions")}
          </span>
          <div
            className={`flex-1 h-px ${
              theme === "dark" ? "bg-gray-800" : "bg-gray-200"
            }`}
          />
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function tournamentAccentText(accent: string): string {
  switch (accent) {
    case "purple":
      return "text-purple-500 dark:text-purple-300";
    case "blue":
      return "text-blue-500 dark:text-blue-300";
    case "red":
      return "text-red-500 dark:text-red-300";
    case "green":
      return "text-emerald-500 dark:text-emerald-300";
    default:
      return "text-amber-500 dark:text-amber-300";
  }
}
