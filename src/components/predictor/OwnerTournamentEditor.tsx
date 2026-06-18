"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Unlock, Check, X, Ban, Trash2, ChevronDown, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import {
  TEMPLATE_PICKER_META,
  getTemplate,
} from "@/data/predictor-templates";
import {
  normalizeLang,
  localizedMatchHomeTeam,
  localizedMatchAwayTeam,
  localizedMatchStageLabel,
  localizedCategoryName,
  localizedCategoryDescription,
  localizedRuleTitle,
  localizedRuleBody,
  localizedRewardTitle,
  localizedRewardDescription,
} from "@/utils/predictor-i18n";
import EternalTableOwnerTab from "@/components/predictor/EternalTableOwnerTab";

// ─────────────────────────────────────────────────────────────────────────────
// Types (kept loose to match supabase response shapes — full typing lives in
// /types/predictor; the editor only consumes the fields it actually renders).
// ─────────────────────────────────────────────────────────────────────────────
type Tournament = any;
type Category = any;
type Option = any;
type Match = any;
type Rule = any;
type Reward = any;
type Member = any;
type Prediction = any;

const ACCENT = [
  { v: "amber", c: "from-amber-400 to-orange-500" },
  { v: "purple", c: "from-purple-500 to-fuchsia-600" },
  { v: "blue", c: "from-blue-500 to-indigo-600" },
  { v: "red", c: "from-red-500 to-rose-600" },
  { v: "green", c: "from-emerald-500 to-green-600" },
];

const STATUS_KEYS = ["draft", "published", "locked", "finished"] as const;
type StatusKey = (typeof STATUS_KEYS)[number];

const TAB_IDS = [
  "settings",
  "categories",
  "matches",
  "rules",
  "rewards",
  "members",
  "players",
  "scoring",
  "eternal",
] as const;
type TabId = (typeof TAB_IDS)[number];

const CAT_TYPE_KEYS = [
  "single_choice",
  "multiple_choice",
  "ranked_top_n",
  "exact_score",
  "numeric",
  "free_text",
] as const;

const STAGE_KEYS = ["group", "knockout", "friendly"] as const;
const MATCH_STATUS_KEYS = [
  "scheduled",
  "live",
  "finished",
  "postponed",
  "cancelled",
] as const;
const RULE_KINDS = ["rule", "bonus", "info", "deadline", "eligibility"] as const;
const PRIZE_TYPES = [
  "cash",
  "physical",
  "voucher",
  "vip",
  "sponsor",
  "fantasy_points",
  "other",
] as const;
const MEMBER_FILTERS = [
  "all",
  "pending",
  "approved",
  "rejected",
  "banned",
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Shared theme-aware class helpers. Centralised so every tab + modal pulls
// the same look, and so flipping a colour means one edit.
// ─────────────────────────────────────────────────────────────────────────────
const cls = {
  card: (dark: boolean) =>
    dark
      ? "border-white/10 bg-white/[0.025]"
      : "border-gray-200 bg-white",
  cardSubtle: (dark: boolean) =>
    dark
      ? "border-white/8 bg-white/[0.015]"
      : "border-gray-200 bg-white/70",
  divider: (dark: boolean) => (dark ? "bg-white/10" : "bg-gray-200"),
  input: (dark: boolean) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors ${
      dark
        ? "border-white/10 bg-black/30 text-white placeholder-gray-600 focus:border-predictor-primary/60 focus:bg-black/40"
        : "border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-predictor-primary focus:bg-white"
    }`,
  modalShell: (dark: boolean) =>
    dark
      ? "border-white/10 bg-[#0f0f12]"
      : "border-gray-200 bg-white",
  primaryBtn:
    "inline-flex items-center gap-2 rounded-full bg-predictor-primary px-4 py-2 text-xs font-bold text-gray-900 transition-colors hover:bg-predictor-primary-hover disabled:opacity-50",
  primaryBtnLg:
    "inline-flex items-center gap-2 rounded-full bg-predictor-primary px-5 py-2.5 text-sm font-bold text-gray-900 transition-colors hover:bg-predictor-primary-hover disabled:opacity-50",
  secondaryBtn: (dark: boolean) =>
    `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
      dark
        ? "border-white/15 text-gray-300 hover:border-white/35 hover:text-white"
        : "border-gray-300 text-gray-700 hover:border-gray-500 hover:text-gray-900"
    }`,
  dangerBtn: (dark: boolean) =>
    `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
      dark
        ? "border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
        : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
    }`,
  iconBtnGhost: (dark: boolean) =>
    dark ? "text-gray-500 hover:text-gray-200" : "text-gray-400 hover:text-gray-700",
  eyebrow: (dark: boolean) =>
    `text-[10px] font-semibold uppercase tracking-[0.3em] ${
      dark ? "text-gray-400" : "text-gray-500"
    }`,
  accentText: (dark: boolean) =>
    dark ? "text-predictor-accent-dark" : "text-predictor-accent-light",
  badgeAccent: (dark: boolean) =>
    `inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
      dark
        ? "bg-predictor-primary/15 text-predictor-accent-dark"
        : "bg-predictor-primary/25 text-predictor-accent-light"
    }`,
};

function statusTone(status: string, dark: boolean): string {
  switch (status) {
    case "published":
      return dark
        ? "bg-emerald-500/15 text-emerald-200"
        : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "locked":
      return dark
        ? "bg-predictor-primary/15 text-predictor-accent-dark"
        : "bg-predictor-primary/25 text-predictor-accent-light";
    case "finished":
      return dark
        ? "bg-blue-500/15 text-blue-200"
        : "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    default:
      return dark
        ? "bg-zinc-500/15 text-zinc-300"
        : "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────
export default function OwnerTournamentEditor({
  initialTournament,
}: {
  initialTournament: Tournament;
}) {
  const { t } = useTranslation("predictor");
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [tournament, setTournament] = useState<Tournament>(initialTournament);
  const [tab, setTab] = useState<TabId>("settings");
  const { showToast: globalToast } = useToast();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  // How many people are waiting for the owner to approve them. Surfaced as a
  // badge on the "Članovi" tab + a callout so approvals don't require /admin.
  const [pendingCount, setPendingCount] = useState(0);

  const showToast = useCallback((msg: string, ok = true) => {
    globalToast(msg, ok ? "success" : "error");
  }, [globalToast]);

  const refreshPending = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/predictor/owner/members?tournament_id=${tournament.id}&status=pending`,
      );
      if (res.ok) {
        const rows = await res.json();
        setPendingCount(Array.isArray(rows) ? rows.length : 0);
      }
    } catch {
      /* non-fatal — badge just won't show */
    }
  }, [tournament.id]);

  useEffect(() => {
    refreshPending();
    // Re-check on every tab switch so the badge/callout stay current as new
    // join requests arrive while the owner is working.
  }, [refreshPending, tab]);

  // Quick-switch tournament status from the always-visible banner.
  const setStatus = useCallback(
    async (next: StatusKey) => {
      if (updatingStatus) return;
      setUpdatingStatus(true);
      try {
        const res = await fetch("/api/predictor/owner/tournaments", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: tournament.id, status: next }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Status update failed");
        setTournament(data);
        const statusMsg =
          next === "published"
            ? t("owner.toast.tournamentPublished")
            : next === "locked"
              ? t("owner.toast.tournamentLocked")
              : next === "finished"
                ? t("owner.toast.tournamentFinished")
                : t("owner.toast.statusChanged");
        showToast(statusMsg);
      } catch (e: any) {
        showToast(e.message || t("owner.toast.genericError"), false);
      } finally {
        setUpdatingStatus(false);
      }
    },
    [tournament.id, updatingStatus, showToast, t],
  );

  // Independent master locks: predictions (categories) vs matches. These let
  // the owner freeze the championship-winner / finalist picks while matches
  // stay predictable on their own kickoff schedule (and vice-versa).
  const [lockBusy, setLockBusy] = useState<null | "predictions" | "matches">(
    null,
  );
  const setLock = useCallback(
    async (field: "predictions_locked" | "matches_locked", value: boolean) => {
      if (lockBusy) return;
      setLockBusy(field === "predictions_locked" ? "predictions" : "matches");
      try {
        const payload: Record<string, unknown> = {
          id: tournament.id,
          [field]: value,
        };
        // Eksplicitni "Otključaj" za kategorije mora stvarno otvoriti predikcije
        // i kad su lock_at / registration_lock_at već prošli (force unlock).
        // Ali prije početka događaja samo vraća automatsko vremensko
        // zaključavanje, da rok i dalje odradi svoje kad dođe vrijeme.
        if (field === "predictions_locked") {
          const now = Date.now();
          const timeLockEngaged =
            (!!tournament.registration_lock_at &&
              now >= Date.parse(tournament.registration_lock_at)) ||
            (!!tournament.starts_at && now >= Date.parse(tournament.starts_at)) ||
            (!tournament.registration_lock_at && !tournament.starts_at);
          payload.predictions_force_unlocked = !value && timeLockEngaged;
        }
        const res = await fetch("/api/predictor/owner/tournaments", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Lock update failed");
        setTournament(data);
        showToast(
          value
            ? t("owner.locks.toast.locked", "Locked")
            : t("owner.locks.toast.unlocked", "Unlocked"),
        );
      } catch (e: any) {
        showToast(e.message || t("owner.toast.genericError"), false);
      } finally {
        setLockBusy(null);
      }
    },
    [tournament.id, lockBusy, showToast, t],
  );

  return (
    <main className="relative min-h-screen w-full bg-theme-background theme-transition">
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-[420px] ${
          dark
            ? "bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(253,230,138,0.05),transparent_70%)]"
            : "bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(253,230,138,0.10),transparent_70%)]"
        }`}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 sm:pt-10 lg:px-8">
        {/* Top nav */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/predictor/my-tournaments"
            className={`inline-flex items-center gap-1.5 text-xs transition-colors ${
              dark
                ? "text-gray-500 hover:text-gray-200"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span aria-hidden>←</span>
            {t("owner.nav.back", "My tournaments")}
          </Link>
          {tournament.status === "published" && (
            <Link
              href={`/predictor/${tournament.slug}`}
              target="_blank"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                dark
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                  : "border-emerald-500/50 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <span aria-hidden>↗</span>
              {t("owner.nav.openPublic", "Public page")}
            </Link>
          )}
        </div>

        {/* Header — name, slug, badges */}
        <header className="mb-8">
          <div className="mb-2 flex flex-wrap items-baseline gap-3">
            <h1 className="text-2xl font-black tracking-tight text-theme-heading-primary sm:text-3xl">
              {tournament.name}
            </h1>
            <span className="font-mono text-xs text-theme-text-secondary">
              /{tournament.slug}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone(
                tournament.status,
                dark,
              )}`}
            >
              {String(t(`owner.status.${tournament.status}`, tournament.status))}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                tournament.visibility === "private"
                  ? dark
                    ? "bg-rose-500/15 text-rose-200"
                    : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                  : dark
                    ? "bg-sky-500/15 text-sky-200"
                    : "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
              }`}
            >
              {t(
                `owner.visibility.${
                  tournament.visibility === "private" ? "private" : "public"
                }`,
              )}
            </span>
          </div>
        </header>

        {/* Tabs — horizontal scroll on mobile, single row */}
        <div
          className={`mb-6 -mx-1 overflow-x-auto rounded-2xl border p-1 ${
            dark
              ? "border-white/8 bg-white/[0.02]"
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex min-w-max gap-1">
            {TAB_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`relative whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:flex-1 sm:min-w-[80px] ${
                  tab === id
                    ? dark
                      ? "bg-predictor-primary/15 text-predictor-accent-dark ring-1 ring-predictor-primary/30"
                      : "bg-predictor-primary/30 text-gray-900 ring-1 ring-predictor-primary/60"
                    : dark
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {t(`owner.tabs.${id}`, id)}
                  {id === "members" && pendingCount > 0 && (
                    <span
                      className="inline-flex min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
                      aria-label={`${pendingCount} na čekanju`}
                    >
                      {pendingCount}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Single owner-control card: lifecycle status + independent locks. */}
        <OwnerControls
          dark={dark}
          status={(tournament.status || "draft") as StatusKey}
          statusBusy={updatingStatus}
          onChangeStatus={setStatus}
          predictionsLocked={!!tournament.predictions_locked}
          matchesLocked={!!tournament.matches_locked}
          busy={lockBusy}
          onToggle={setLock}
        />

        {/* Pending join requests — impossible-to-miss callout so the owner can
            approve members straight from here, without going to /admin. */}
        {pendingCount > 0 && tab !== "members" && (
          <PendingApprovalsCallout
            dark={dark}
            count={pendingCount}
            onReview={() => setTab("members")}
          />
        )}

        {/* Tab body */}
        <div
          className={`rounded-2xl border p-4 sm:p-7 ${cls.card(dark)}`}
        >
          {tab === "settings" && (
            <SettingsTab
              tournament={tournament}
              dark={dark}
              onSaved={(t) => setTournament(t)}
              showToast={showToast}
              onTabSwitch={setTab}
            />
          )}
          {tab === "categories" && (
            <CategoriesTab
              tournament={tournament}
              dark={dark}
              showToast={showToast}
            />
          )}
          {tab === "matches" && (
            <MatchesTab tournament={tournament} dark={dark} showToast={showToast} />
          )}
          {tab === "rules" && (
            <RulesTab tournament={tournament} dark={dark} showToast={showToast} />
          )}
          {tab === "rewards" && (
            <RewardsTab tournament={tournament} dark={dark} showToast={showToast} />
          )}
          {tab === "members" && (
            <MembersTab
              tournament={tournament}
              dark={dark}
              showToast={showToast}
              onChanged={refreshPending}
            />
          )}
          {tab === "players" && (
            <PlayersTab tournament={tournament} dark={dark} showToast={showToast} />
          )}
          {tab === "scoring" && (
            <ScoringTab tournament={tournament} dark={dark} showToast={showToast} />
          )}
          {tab === "eternal" && (
            <EternalTableOwnerTab tournament={tournament} />
          )}
        </div>

        {/* Footer */}
        <p className={`mt-6 text-center text-[11px] ${dark ? "text-gray-600" : "text-gray-500"}`}>
          {t("owner.nav.supportPrefix", "Need help?")}{" "}
          <a
            className={cls.accentText(dark) + " underline-offset-2 hover:underline"}
            href="mailto:remis.fantasy@gmail.com"
          >
            remis.fantasy@gmail.com
          </a>
        </p>
      </div>

    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Owner controls — one card holding everything: the tournament lifecycle
// status (draft → published → finished) plus two independent master locks so
// the owner can freeze the category predictions (winner / finalist) separately
// from the match-by-match predictions. Consolidated into a single card so it
// no longer looks like several competing banners.
// ─────────────────────────────────────────────────────────────────────────────
function OwnerControls({
  dark,
  status,
  statusBusy,
  onChangeStatus,
  predictionsLocked,
  matchesLocked,
  busy,
  onToggle,
}: {
  dark: boolean;
  status: StatusKey;
  statusBusy: boolean;
  onChangeStatus: (next: StatusKey) => void;
  predictionsLocked: boolean;
  matchesLocked: boolean;
  busy: null | "predictions" | "matches";
  onToggle: (
    field: "predictions_locked" | "matches_locked",
    value: boolean,
  ) => void;
}) {
  const { t } = useTranslation("predictor");

  // Lifecycle advance: draft → published → finished. Locking is NOT here — it
  // lives in the two toggles below. (Legacy "locked" status still → finished.)
  const nextStatus: StatusKey =
    status === "draft"
      ? "published"
      : status === "published"
        ? "finished"
        : status === "locked"
          ? "finished"
          : "draft";
  const isDraft = status === "draft";
  const isPublished = status === "published";
  const isLockedStatus = status === "locked";
  const dotColor = isDraft
    ? "bg-predictor-primary"
    : isPublished
      ? "bg-emerald-500"
      : isLockedStatus
        ? "bg-amber-400"
        : "bg-gray-400";
  const chipColor = isDraft
    ? dark
      ? "text-predictor-accent-dark"
      : "text-predictor-accent-light"
    : isPublished
      ? dark
        ? "text-emerald-300"
        : "text-emerald-700"
      : isLockedStatus
        ? dark
          ? "text-amber-300"
          : "text-amber-700"
        : dark
          ? "text-gray-400"
          : "text-gray-600";
  const advanceCls = isDraft
    ? "inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-predictor-primary px-4 py-2 text-xs font-bold text-gray-900 transition-colors hover:bg-predictor-primary-hover disabled:opacity-50"
    : `inline-flex flex-shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
        dark
          ? "border-white/20 text-gray-200 hover:border-white/40"
          : "border-gray-300 text-gray-800 hover:border-gray-500"
      }`;

  const Row = ({
    kind,
    field,
    locked,
  }: {
    kind: "predictions" | "matches";
    field: "predictions_locked" | "matches_locked";
    locked: boolean;
  }) => {
    const isBusy = busy === kind;
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 ${
          locked
            ? dark
              ? "border-amber-400/30 bg-amber-500/10"
              : "border-amber-300/70 bg-amber-50"
            : dark
              ? "border-emerald-400/25 bg-emerald-500/[0.07]"
              : "border-emerald-400/50 bg-emerald-50/70"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
              locked
                ? dark
                  ? "bg-amber-500/15 text-amber-300"
                  : "bg-amber-100 text-amber-700"
                : dark
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {locked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-theme-heading-primary">
              {t(`owner.locks.${kind}.title`, kind)}
            </p>
            <p className="mt-0.5 text-xs leading-snug text-theme-text-secondary">
              {locked
                ? t(`owner.locks.${kind}.lockedDesc`, "Locked")
                : t(`owner.locks.${kind}.openDesc`, "Open")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggle(field, !locked)}
          disabled={isBusy}
          className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
            dark
              ? "border-white/20 text-gray-200 hover:border-white/40"
              : "border-gray-300 text-gray-800 hover:border-gray-500"
          }`}
        >
          {isBusy
            ? t("owner.common.saving")
            : locked
              ? t("owner.locks.unlockCta", "Unlock")
              : t("owner.locks.lockCta", "Lock")}
        </button>
      </div>
    );
  };

  return (
    <div
      className={`mb-6 rounded-2xl border p-4 ${
        dark ? "border-white/10 bg-white/[0.03]" : "border-gray-200 bg-gray-50"
      }`}
    >
      {/* Lifecycle status — compact single row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className={`inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${dotColor} ${
              isPublished ? "animate-pulse" : ""
            }`}
          />
          <span
            className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${chipColor}`}
          >
            {t(`owner.status.${status}`, status)}
          </span>
          <span className="truncate text-sm font-bold text-theme-heading-primary">
            {t(`owner.statusBanner.${status}.title`, status)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onChangeStatus(nextStatus)}
          disabled={statusBusy}
          className={advanceCls}
        >
          {statusBusy
            ? t("owner.common.saving")
            : t(`owner.statusBanner.${status}.cta`, "")}
          {!statusBusy && <span aria-hidden>→</span>}
        </button>
      </div>

      {/* Divider */}
      <div
        className={`my-4 h-px w-full ${dark ? "bg-white/10" : "bg-gray-200"}`}
      />

      {/* Independent locks */}
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-theme-text-secondary">
        {t("owner.locks.heading", "Locks")}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Row
          kind="predictions"
          field="predictions_locked"
          locked={predictionsLocked}
        />
        <Row kind="matches" field="matches_locked" locked={matchesLocked} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────
function Section({
  dark,
  title,
  desc,
  children,
}: {
  dark: boolean;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-7">
      <div className="mb-4">
        <h2 className={`text-base font-bold ${cls.accentText(dark)}`}>{title}</h2>
        {desc && (
          <p className="mt-0.5 text-xs text-theme-text-secondary">{desc}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-theme-text-secondary">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-[11px] leading-relaxed text-theme-text-secondary/80">
          {hint}
        </p>
      )}
    </div>
  );
}

function OptionEnToggle({
  dark,
  value,
  onChange,
  placeholder,
}: {
  dark: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const { i18n } = useTranslation("predictor");
  const isEn = i18n.language?.startsWith("en");
  const hasValue = !!(value && value.trim());
  const [open, setOpen] = useState(isEn || hasValue);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${
          dark
            ? "text-gray-500 hover:text-gray-300"
            : "text-gray-400 hover:text-gray-700"
        }`}
      >
        <span className={`inline-block transition-transform duration-200 ${open ? "rotate-90" : ""}`}>›</span>
        EN
        {hasValue && (
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${
            dark ? "bg-emerald-400/70" : "bg-emerald-500/70"
          }`} />
        )}
      </button>
      {open && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`mt-1 ${cls.input(dark)}`}
        />
      )}
    </div>
  );
}

function BilingualPair({
  dark,
  bsLabel,
  enLabel,
  bsValue,
  enValue,
  onBs,
  onEn,
  textarea,
  rows = 3,
  bsPlaceholder,
  enPlaceholder,
  required,
}: {
  dark: boolean;
  bsLabel: string;
  enLabel: string;
  bsValue?: string | null;
  enValue?: string | null;
  onBs: (v: string) => void;
  onEn: (v: string) => void;
  textarea?: boolean;
  rows?: number;
  bsPlaceholder?: string;
  enPlaceholder?: string;
  required?: boolean;
}) {
  const { t, i18n } = useTranslation("predictor");
  const isEnLang = i18n.language?.startsWith("en");

  const primaryLabel = isEnLang ? enLabel : bsLabel;
  const primaryValue = isEnLang ? (enValue ?? "") : (bsValue ?? "");
  const onPrimary = isEnLang ? onEn : onBs;
  const primaryPlaceholder = isEnLang ? enPlaceholder : bsPlaceholder;

  const secondaryTag = isEnLang ? "BS" : "EN";
  const secondaryLabel = isEnLang ? bsLabel : enLabel;
  const secondaryValue = isEnLang ? (bsValue ?? "") : (enValue ?? "");
  const onSecondary = isEnLang ? onBs : onEn;
  const secondaryPlaceholder = isEnLang ? bsPlaceholder : enPlaceholder;
  const hasSecondary = !!secondaryValue.trim();
  const [secOpen, setSecOpen] = useState(hasSecondary);

  return (
    <div className="space-y-2">
      <Field label={primaryLabel} required={required}>
        {textarea ? (
          <textarea
            value={primaryValue}
            onChange={(e) => onPrimary(e.target.value)}
            rows={rows}
            placeholder={primaryPlaceholder}
            className={cls.input(dark)}
          />
        ) : (
          <input
            value={primaryValue}
            onChange={(e) => onPrimary(e.target.value)}
            placeholder={primaryPlaceholder}
            className={cls.input(dark)}
          />
        )}
      </Field>
      <div>
        <button
          type="button"
          onClick={() => setSecOpen((o) => !o)}
          className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] transition-colors ${
            dark
              ? "text-gray-500 hover:text-gray-300"
              : "text-gray-400 hover:text-gray-700"
          }`}
        >
          <span
            className={`inline-block transition-transform duration-200 ${
              secOpen ? "rotate-90" : ""
            }`}
          >
            ›
          </span>
          {secondaryTag} {secondaryLabel}
          {hasSecondary && (
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${
              dark ? "bg-emerald-400/70" : "bg-emerald-500/70"
            }`} />
          )}
        </button>
        {secOpen && (
          <div className="mt-1.5">
            {textarea ? (
              <textarea
                value={secondaryValue}
                onChange={(e) => onSecondary(e.target.value)}
                rows={rows}
                placeholder={secondaryPlaceholder}
                className={cls.input(dark)}
              />
            ) : (
              <input
                value={secondaryValue}
                onChange={(e) => onSecondary(e.target.value)}
                placeholder={secondaryPlaceholder}
                className={cls.input(dark)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Modal({
  dark,
  title,
  onClose,
  children,
  footer,
}: {
  dark: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-3 py-20 backdrop-blur-sm sm:px-6 sm:py-24">
      <div
        className={`relative flex max-h-[calc(100vh-10rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${cls.modalShell(
          dark,
        )}`}
      >
        <div
          className={`flex items-center justify-between border-b px-5 py-4 ${
            dark ? "border-white/10" : "border-gray-200"
          }`}
        >
          <h3 className={`text-base font-bold ${cls.accentText(dark)}`}>
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={`text-xl leading-none ${cls.iconBtnGhost(dark)}`}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        <div
          className={`flex flex-wrap items-center justify-end gap-2 border-t px-5 py-4 ${
            dark ? "border-white/10" : "border-gray-200"
          }`}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings tab (with template-reset cards at top)
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Access banner — the owner-facing twin of the admin's "Pristup turniru"
// control. One prominent toggle for Otvoren (open) vs Zatvoren (closed/approval
// required). Writes the SAME db prop the admin uses (require_approval).
// ─────────────────────────────────────────────────────────────────────────────
function AccessBanner({
  dark,
  closed,
  busy,
  onChange,
  onGoToApprovals,
}: {
  dark: boolean;
  closed: boolean;
  busy: boolean;
  onChange: (closed: boolean) => void;
  onGoToApprovals?: () => void;
}) {
  const { t } = useTranslation("predictor");
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 ${
        closed
          ? dark
            ? "border-amber-700/50 bg-gradient-to-br from-amber-950/50 via-amber-900/20 to-transparent"
            : "border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50 to-white"
          : dark
            ? "border-emerald-800/40 bg-gradient-to-br from-emerald-950/40 via-gray-900/40 to-transparent"
            : "border-emerald-200 bg-gradient-to-br from-emerald-50 via-green-50 to-white"
      }`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${
          closed ? "bg-amber-500/20" : "bg-emerald-500/15"
        }`}
      />
      <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl shadow-lg ${
            closed ? "bg-amber-500 text-black" : "bg-emerald-500 text-white"
          }`}
        >
          {closed ? (
            <Lock className="h-6 w-6" strokeWidth={2.5} />
          ) : (
            <Unlock className="h-6 w-6" strokeWidth={2.5} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`text-[11px] font-black uppercase tracking-[0.18em] ${
              closed
                ? dark
                  ? "text-amber-300"
                  : "text-amber-600"
                : dark
                  ? "text-emerald-300"
                  : "text-emerald-600"
            }`}
          >
            {t("owner.settings.access.eyebrow")}
          </p>
          <h4 className="mt-0.5 text-base font-black text-theme-heading-primary sm:text-lg">
            {closed
              ? t("owner.settings.access.titleClosed")
              : t("owner.settings.access.titleOpen")}
          </h4>
          <p className="mt-1 text-xs text-theme-text-secondary sm:text-sm">
            {closed
              ? t("owner.settings.access.descClosed")
              : t("owner.settings.access.descOpen")}
          </p>
          {closed && onGoToApprovals && (
            <button
              type="button"
              onClick={onGoToApprovals}
              className={`mt-2.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                dark
                  ? "bg-amber-400/15 text-amber-200 hover:bg-amber-400/25"
                  : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"
              }`}
            >
              {t("owner.settings.access.goToApprovals")}
              <span aria-hidden>→</span>
            </button>
          )}
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onChange(false)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all disabled:opacity-60 ${
              !closed
                ? "bg-emerald-500 text-white shadow-md ring-2 ring-emerald-400/50"
                : dark
                  ? "border border-gray-700 bg-gray-900/60 text-gray-400 hover:border-emerald-500/50"
                  : "border border-gray-300 bg-white text-gray-600 hover:border-emerald-400"
            }`}
          >
            {t("owner.settings.access.open")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onChange(true)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all disabled:opacity-60 ${
              closed
                ? "bg-amber-500 text-black shadow-md ring-2 ring-amber-400/50"
                : dark
                  ? "border border-gray-700 bg-gray-900/60 text-gray-400 hover:border-amber-500/50"
                  : "border border-gray-300 bg-white text-gray-600 hover:border-amber-400"
            }`}
          >
            {t("owner.settings.access.closed")}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({
  tournament,
  dark,
  onSaved,
  showToast,
  onTabSwitch,
}: {
  tournament: Tournament;
  dark: boolean;
  onSaved: (t: Tournament) => void;
  showToast: (msg: string, ok?: boolean) => void;
  onTabSwitch: (tab: TabId) => void;
}) {
  const { t } = useTranslation("predictor");
  const router = useRouter();
  const [form, setForm] = useState<Tournament>(tournament);
  const [saving, setSaving] = useState(false);
  const [savingAccess, setSavingAccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);

  const set = (k: string, v: any) => setForm((p: Tournament) => ({ ...p, [k]: v }));

  // Open/Closed toggle persists instantly — no separate "Save" needed — so the
  // approval gate (and the Members approvals queue) takes effect right away.
  async function saveAccess(closed: boolean) {
    set("require_approval", closed);
    setSavingAccess(true);
    try {
      const res = await fetch("/api/predictor/owner/tournaments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tournament.id, require_approval: closed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");
      onSaved(data);
      setForm((p: Tournament) => ({ ...p, require_approval: closed }));
      showToast(
        closed
          ? t("owner.toast.tournamentClosed", "Turnir je zatvoren — odobravaš učesnike")
          : t("owner.toast.tournamentOpened", "Turnir je otvoren za sve"),
      );
    } catch (e: any) {
      showToast(e.message || t("owner.toast.genericError"), false);
      setForm((p: Tournament) => ({ ...p, require_approval: !closed }));
    } finally {
      setSavingAccess(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      // Brave se mijenjaju instant-toggleom iznad tabova, a `form` je snapshot
      // od mounta — slanje tih polja bi tiho pregazilo svježije stanje
      // (npr. poništilo "Otključaj").
      const {
        predictions_locked: _pl,
        predictions_force_unlocked: _pfu,
        matches_locked: _ml,
        ...body
      } = form as Tournament & Record<string, unknown>;
      const res = await fetch("/api/predictor/owner/tournaments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, id: tournament.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");
      onSaved(data);
      showToast(t("owner.toast.settingsSaved"));
    } catch (e: any) {
      showToast(e.message || t("owner.toast.genericError"), false);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTournament() {
    if (!confirm(t("owner.settings.deleteConfirm"))) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/predictor/owner/tournaments?id=${tournament.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d?.error || "Delete failed");
      }
      showToast(t("owner.toast.tournamentDeleted"));
      router.push("/predictor/my-tournaments");
    } catch (e: any) {
      showToast(e.message || t("owner.toast.genericError"), false);
      setDeleting(false);
    }
  }

  async function applyTemplate(
    templateId: string,
    mode: "merge" | "reset",
    applyBranding: boolean,
  ) {
    setApplyingTemplate(templateId);
    try {
      const res = await fetch("/api/predictor/owner/apply-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournament_id: tournament.id,
          template_id: templateId,
          mode,
          applyBranding,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Apply failed");
      // Pull the freshly updated tournament so branding (logo, banner, accent)
      // reflects in the editor immediately — and also re-sync local form state.
      if (applyBranding) {
        const fresh = await fetch(
          `/api/predictor/owner/tournaments?id=${tournament.id}`,
        );
        if (fresh.ok) {
          const updated = await fresh.json();
          onSaved(updated);
          setForm(updated);
        }
      }
      showToast(t("owner.toast.templateApplied"));
      router.refresh();
      onTabSwitch("categories");
    } catch (e: any) {
      showToast(e.message || t("owner.toast.genericError"), false);
    } finally {
      setApplyingTemplate(null);
    }
  }

  return (
    <>
      {/* Tournament access — open vs closed (approval). Mirrors /admin so the
          owner controls the SAME require_approval prop, right here. */}
      <div className="mb-6">
        <AccessBanner
          dark={dark}
          closed={!!form.require_approval}
          busy={savingAccess}
          onChange={saveAccess}
          onGoToApprovals={() => onTabSwitch("members")}
        />
      </div>

      {/* Template reset/merge cards */}
      <TemplateResetSection
        dark={dark}
        applyingId={applyingTemplate}
        onApply={applyTemplate}
      />

      <Section
        dark={dark}
        title={t("owner.settings.basics.title")}
        desc={t("owner.settings.basics.desc")}
      >
        <div className="space-y-4">
          <BilingualPair
            dark={dark}
            bsLabel={t("owner.settings.fields.name")}
            enLabel={t("owner.settings.fields.nameEn")}
            bsValue={form.name}
            enValue={form.name_en}
            onBs={(v) => set("name", v)}
            onEn={(v) => set("name_en", v)}
            required
          />
          <Field
            label={t("owner.settings.fields.slug")}
            hint={t("owner.settings.fields.slugHint", { slug: form.slug || "your-slug" })}
          >
            <input
              value={form.slug ?? ""}
              onChange={(e) =>
                set(
                  "slug",
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "")
                    .slice(0, 80),
                )
              }
              className={cls.input(dark) + " font-mono text-sm"}
            />
          </Field>
          <BilingualPair
            dark={dark}
            bsLabel={t("owner.settings.fields.shortDesc")}
            enLabel={t("owner.settings.fields.shortDescEn")}
            bsValue={form.short_description}
            enValue={form.short_description_en}
            onBs={(v) => set("short_description", v)}
            onEn={(v) => set("short_description_en", v)}
            textarea
            rows={2}
          />
          <BilingualPair
            dark={dark}
            bsLabel={t("owner.settings.fields.longDesc")}
            enLabel={t("owner.settings.fields.longDescEn")}
            bsValue={form.long_description}
            enValue={form.long_description_en}
            onBs={(v) => set("long_description", v)}
            onEn={(v) => set("long_description_en", v)}
            textarea
            rows={5}
          />
        </div>
      </Section>

      <Section
        dark={dark}
        title={t("owner.settings.visibility.title")}
        desc={t("owner.settings.visibility.desc")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label={t("owner.settings.visibility.statusLabel")}
            hint={t("owner.settings.visibility.statusHint")}
          >
            <select
              value={form.status || "draft"}
              onChange={(e) => set("status", e.target.value)}
              className={cls.input(dark)}
            >
              {STATUS_KEYS.map((s) => (
                <option key={s} value={s}>
                  {t(`owner.status.${s}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={t("owner.settings.visibility.visibilityLabel")}
            hint={t("owner.settings.visibility.visibilityHint")}
          >
            <div className="grid grid-cols-2 gap-2">
              {(["public", "private"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    set("visibility", v);
                    // Picking "private" implies a closed tournament — you choose
                    // who gets in — so flip the approval gate on automatically.
                    if (v === "private" && !form.require_approval) saveAccess(true);
                  }}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                    (form.visibility || "public") === v
                      ? dark
                        ? "border-predictor-primary/60 bg-predictor-primary/10 text-predictor-accent-dark"
                        : "border-predictor-primary bg-predictor-primary/20 text-predictor-accent-light"
                      : dark
                        ? "border-white/10 bg-black/20 text-gray-400 hover:border-white/30"
                        : "border-gray-300 bg-white text-gray-600 hover:border-gray-500"
                  }`}
                >
                  {t(`owner.visibility.${v}`)}
                </button>
              ))}
            </div>
            {form.visibility === "private" && (
              <p className="mt-1.5 text-[11px] text-theme-text-secondary">
                {t("owner.settings.access.privateNote")}
              </p>
            )}
          </Field>
          <Field label={t("owner.settings.visibility.accentLabel")}>
            <div className="flex flex-wrap gap-2">
              {ACCENT.map((a) => (
                <button
                  key={a.v}
                  type="button"
                  onClick={() => set("accent_color", a.v)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all ${
                    form.accent_color === a.v
                      ? dark
                        ? "border-predictor-primary/60 bg-predictor-primary/10 text-predictor-accent-dark"
                        : "border-predictor-primary bg-predictor-primary/20 text-predictor-accent-light"
                      : dark
                        ? "border-white/10 bg-black/20 text-gray-400 hover:border-white/30"
                        : "border-gray-300 bg-white text-gray-600 hover:border-gray-500"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 rounded-full bg-gradient-to-br ${a.c}`}
                  />
                  {a.v}
                </button>
              ))}
            </div>
          </Field>
          <Field
            label={t("owner.settings.visibility.approvalLabel")}
            hint={t("owner.settings.visibility.approvalHint")}
          >
            <div
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                form.require_approval
                  ? dark
                    ? "border-amber-700/40 bg-amber-950/20 text-amber-200"
                    : "border-amber-300 bg-amber-50 text-amber-800"
                  : dark
                    ? "border-emerald-800/40 bg-emerald-950/20 text-emerald-200"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {form.require_approval ? (
                <Lock className="h-4 w-4 flex-shrink-0" />
              ) : (
                <Unlock className="h-4 w-4 flex-shrink-0" />
              )}
              <span>
                {form.require_approval
                  ? t("owner.settings.visibility.approvalOn")
                  : t("owner.settings.visibility.approvalOff")}
              </span>
            </div>
          </Field>
        </div>
      </Section>

      <Section
        dark={dark}
        title={t("owner.settings.timestamps.title")}
        desc={t("owner.settings.timestamps.desc")}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label={t("owner.settings.timestamps.startsAt")}>
            <input
              type="datetime-local"
              value={toLocal(form.starts_at)}
              onChange={(e) => set("starts_at", fromLocal(e.target.value))}
              className={cls.input(dark)}
            />
          </Field>
          <Field label={t("owner.settings.timestamps.endsAt")}>
            <input
              type="datetime-local"
              value={toLocal(form.ends_at)}
              onChange={(e) => set("ends_at", fromLocal(e.target.value))}
              className={cls.input(dark)}
            />
          </Field>
          <Field
            label={t("owner.settings.timestamps.lockAt")}
            hint={t("owner.settings.timestamps.lockHint")}
          >
            <input
              type="datetime-local"
              value={toLocal(form.registration_lock_at)}
              onChange={(e) => set("registration_lock_at", fromLocal(e.target.value))}
              className={cls.input(dark)}
            />
          </Field>
        </div>
      </Section>

      {/* Branding: logo + background + music + lock mode */}
      <Section
        dark={dark}
        title={t("owner.settings.branding.title", "Branding & theme")}
        desc={t("owner.settings.theme.desc", "Logo, background and music for the tournament page.")}
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Logo */}
          <ImageUpload
            dark={dark}
            tournamentId={tournament.id}
            kind="logo"
            label={t("owner.settings.branding.logoUrl", "Logo")}
            value={form.logo_url}
            onChange={(url) => set("logo_url", url || null)}
            onError={(msg) => showToast(msg, false)}
          />

          {/* Banner */}
          <ImageUpload
            dark={dark}
            tournamentId={tournament.id}
            kind="banner"
            label={t("owner.settings.branding.bannerUrl", "Banner")}
            value={form.banner_image_url}
            onChange={(url) => set("banner_image_url", url || null)}
            onError={(msg) => showToast(msg, false)}
          />

          {/* Music toggle */}
          <Field label={t("owner.settings.theme.music", "Music player")}>
            <label
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 ${
                dark ? "border-white/10 bg-black/20" : "border-gray-300 bg-white"
              }`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-predictor-primary"
                checked={!!form.theme_music_enabled}
                onChange={(e) => set("theme_music_enabled", e.target.checked)}
              />
              <span className="text-sm text-theme-heading-primary">
                {form.theme_music_enabled
                  ? t("owner.settings.theme.musicOn", "Music enabled")
                  : t("owner.settings.theme.musicOff", "Music disabled")}
              </span>
            </label>
          </Field>
        </div>

        {/* Background gallery */}
        <div className="mt-5">
          <p className={`mb-2 text-[11px] font-semibold uppercase tracking-wider ${dark ? "text-gray-400" : "text-gray-500"}`}>
            {t("owner.settings.theme.background", "Background image")}
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-8 gap-2">
            <button
              type="button"
              onClick={() => set("theme_background_image", null)}
              className={`relative flex items-center justify-center h-14 rounded-lg border-2 text-[10px] font-semibold transition-all ${
                !form.theme_background_image
                  ? dark
                    ? "border-predictor-primary/60 bg-predictor-primary/10 text-predictor-accent-dark"
                    : "border-predictor-primary bg-predictor-primary/20 text-predictor-accent-light"
                  : dark
                    ? "border-white/10 bg-white/[0.03] text-gray-500 hover:border-white/25"
                    : "border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-400"
              }`}
            >
              {t("owner.settings.theme.noBg", "None")}
            </button>
            {[
              "/wc2026/wc-bg-2.webp",
              "/wc2026/wc-bg-3.webp",
              "/wc2026/wc-bg.jpg",
              "/wc2026/wc-bg1.jpg",
              "/wc2026/bg-full-wc-2026.jpg",
              "/wc2026/wc-5.webp",
              "/wc2026/wc-6.jpg",
            ].map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => set("theme_background_image", src)}
                className={`relative h-14 overflow-hidden rounded-lg border-2 transition-all ${
                  form.theme_background_image === src
                    ? "border-predictor-primary ring-1 ring-predictor-primary/40"
                    : dark
                      ? "border-white/10 hover:border-white/30 opacity-70 hover:opacity-100"
                      : "border-gray-200 hover:border-gray-400 opacity-75 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                {form.theme_background_image === src && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-predictor-primary text-gray-900 flex items-center justify-center text-[9px] font-black">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Lock mode */}
        <div className="mt-5">
          <p className={`mb-2 text-[11px] font-semibold uppercase tracking-wider ${dark ? "text-gray-400" : "text-gray-500"}`}>
            {t("owner.settings.lockMode.title", "Prediction locking")}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(["per_match", "per_round"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => set("prediction_lock_mode", mode)}
                className={`flex flex-col gap-1 rounded-lg border px-4 py-3 text-left transition-all ${
                  (form.prediction_lock_mode || "per_match") === mode
                    ? dark
                      ? "border-predictor-primary/60 bg-predictor-primary/10 text-predictor-accent-dark"
                      : "border-predictor-primary bg-predictor-primary/20 text-predictor-accent-light"
                    : dark
                      ? "border-white/10 bg-black/20 text-gray-400 hover:border-white/30"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-500"
                }`}
              >
                <span className="text-sm font-bold">
                  {t(`owner.settings.lockMode.${mode}.label`, mode === "per_match" ? "Per match" : "Per round")}
                </span>
                <span className={`text-[11px] leading-snug ${dark ? "text-gray-500" : "text-gray-500"}`}>
                  {t(`owner.settings.lockMode.${mode}.desc`,
                    mode === "per_match"
                      ? "Each match locks at its own kickoff time"
                      : "All matches in a round lock when the first match starts"
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section dark={dark} title={t("owner.settings.prize.title")}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label={t("owner.settings.prize.amount")}>
            <input
              type="number"
              step="0.01"
              value={form.prize_pool_amount ?? ""}
              onChange={(e) =>
                set(
                  "prize_pool_amount",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              className={cls.input(dark)}
            />
          </Field>
          <Field label={t("owner.settings.prize.currency")}>
            <input
              value={form.prize_pool_currency ?? "EUR"}
              onChange={(e) =>
                set("prize_pool_currency", e.target.value.toUpperCase())
              }
              maxLength={4}
              className={cls.input(dark)}
            />
          </Field>
          <Field label={t("owner.settings.prize.sponsorName", "Sponsor name")}>
            <input
              value={form.sponsor_name ?? ""}
              onChange={(e) => set("sponsor_name", e.target.value)}
              className={cls.input(dark)}
            />
          </Field>
          <Field label={t("owner.settings.prize.sponsorUrl", "Sponsor link")}>
            <input
              value={form.sponsor_url ?? ""}
              onChange={(e) => set("sponsor_url", e.target.value)}
              placeholder="https://..."
              className={cls.input(dark)}
            />
          </Field>
          <ImageUpload
            dark={dark}
            tournamentId={tournament.id}
            kind="logo"
            label={t("owner.settings.prize.sponsorLogoUrl", "Sponsor logo")}
            value={form.sponsor_logo_url}
            onChange={(url) => set("sponsor_logo_url", url || null)}
            onError={(msg) => showToast(msg, false)}
          />
        </div>
      </Section>

      <Section dark={dark} title={t("owner.settings.rules.title")}>
        <div className="space-y-4">
          <BilingualPair
            dark={dark}
            bsLabel={t("owner.settings.rules.general")}
            enLabel={t("owner.settings.rules.generalEn")}
            bsValue={form.rules_md}
            enValue={form.rules_md_en}
            onBs={(v) => set("rules_md", v)}
            onEn={(v) => set("rules_md_en", v)}
            textarea
            rows={5}
          />
          <BilingualPair
            dark={dark}
            bsLabel={t("owner.settings.rules.pointSystem")}
            enLabel={t("owner.settings.rules.pointSystemEn")}
            bsValue={form.point_system_md}
            enValue={form.point_system_md_en}
            onBs={(v) => set("point_system_md", v)}
            onEn={(v) => set("point_system_md_en", v)}
            textarea
            rows={4}
          />
          <BilingualPair
            dark={dark}
            bsLabel={t("owner.settings.rules.eligibility")}
            enLabel={t("owner.settings.rules.eligibilityEn")}
            bsValue={form.eligibility_md}
            enValue={form.eligibility_md_en}
            onBs={(v) => set("eligibility_md", v)}
            onEn={(v) => set("eligibility_md_en", v)}
            textarea
            rows={3}
          />
        </div>
      </Section>

      <div
        className={`flex flex-wrap items-center justify-between gap-3 border-t pt-5 ${
          dark ? "border-white/10" : "border-gray-200"
        }`}
      >
        <button
          type="button"
          onClick={deleteTournament}
          disabled={deleting}
          className={cls.dangerBtn(dark)}
        >
          {deleting ? t("owner.common.loading") : t("owner.settings.deleteBtn")}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className={cls.primaryBtnLg}
        >
          {saving ? t("owner.common.saving") : t("owner.settings.saveBtn")}
        </button>
      </div>
    </>
  );
}

function TemplateResetSection({
  dark,
  applyingId,
  onApply,
}: {
  dark: boolean;
  applyingId: string | null;
  onApply: (
    templateId: string,
    mode: "merge" | "reset",
    applyBranding: boolean,
  ) => void;
}) {
  const { t } = useTranslation("predictor");
  const [confirm, setConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);

  return (
    <Section
      dark={dark}
      title={t("create.templates.title", "Templates")}
      desc={t("create.templates.subtitle")}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {TEMPLATE_PICKER_META.map((meta) => {
          const tmpl = getTemplate(meta.id);
          if (!tmpl) return null;
          const name = t(
            `create.templates.items.${meta.i18nKey}.name`,
            tmpl.name,
          );
          return (
            <button
              key={meta.id}
              type="button"
              disabled={applyingId === meta.id}
              onClick={() => setConfirm({ id: meta.id, name })}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border p-3 text-left transition-all ${
                applyingId === meta.id ? "opacity-60" : ""
              } ${
                dark
                  ? "border-white/8 bg-white/[0.02] hover:border-predictor-primary/40 hover:bg-white/[0.04]"
                  : "border-gray-200 bg-white hover:border-predictor-primary hover:bg-predictor-primary/10"
              }`}
            >
              <div
                className="relative mb-2 flex h-16 w-full items-center justify-center overflow-hidden rounded-xl"
                style={
                  meta.brandBg
                    ? { backgroundColor: meta.brandBg }
                    : undefined
                }
              >
                {meta.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={meta.logo}
                    alt=""
                    className="h-12 w-auto max-w-[80%] object-contain"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${meta.gradient || "from-gray-400 to-gray-600"}`}
                  >
                    <span className="text-xl font-black text-white">
                      {meta.monogram}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="line-clamp-1 text-xs font-bold text-theme-heading-primary">
                {name}
              </h3>
              {applyingId === meta.id && (
                <p className={`mt-1 text-[10px] ${cls.accentText(dark)}`}>
                  {t("owner.common.loading")}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {confirm && (
        <Modal
          dark={dark}
          title={confirm.name}
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className={cls.secondaryBtn(dark)}
              >
                {t("owner.common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(confirm.id, "merge", false);
                  setConfirm(null);
                }}
                className={cls.secondaryBtn(dark)}
              >
                + {t("owner.common.add")}
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(confirm.id, "reset", true);
                  setConfirm(null);
                }}
                className={cls.primaryBtn}
              >
                ↺ Reset
              </button>
            </>
          }
        >
          <p className="text-sm text-theme-text-secondary">
            <strong className="text-theme-heading-primary">+ Add:</strong>{" "}
            adds template categories alongside existing ones.
          </p>
          <p className="mt-3 text-sm text-theme-text-secondary">
            <strong className="text-theme-heading-primary">↺ Reset:</strong>{" "}
            clears all existing categories/options/matches/rules/rewards and applies the
            template fresh (with branding).
          </p>
        </Modal>
      )}
    </Section>
  );
}

function toLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocal(local: string): string | null {
  if (!local) return null;
  return new Date(local).toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Categories tab
// ─────────────────────────────────────────────────────────────────────────────
function CategoriesTab({
  tournament,
  dark,
  showToast,
}: {
  tournament: Tournament;
  dark: boolean;
  showToast: (m: string, ok?: boolean) => void;
}) {
  const { t, i18n } = useTranslation("predictor");
  const lang = normalizeLang(i18n.language);
  const [list, setList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/predictor/owner/categories?tournament_id=${tournament.id}`,
    );
    if (res.ok) setList(await res.json());
    setLoading(false);
  }, [tournament.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm(t("owner.categoriesTab.deleteConfirm"))) return;
    const res = await fetch(`/api/predictor/owner/categories?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      showToast(t("owner.toast.categoryDeleted"));
      load();
    } else showToast(t("owner.toast.genericError"), false);
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={`text-base font-bold ${cls.accentText(dark)}`}>
            {t("owner.categoriesTab.title")}
          </h2>
          <p className="mt-0.5 text-xs text-theme-text-secondary">
            {t("owner.categoriesTab.desc")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className={cls.primaryBtnLg}
        >
          + {t("owner.categoriesTab.new")}
        </button>
      </div>

      {loading ? (
        <p className={`py-10 text-center text-sm ${dark ? "text-gray-500" : "text-gray-500"}`}>
          {t("owner.common.loading")}
        </p>
      ) : list.length === 0 ? (
        <div
          className={`rounded-xl border border-dashed p-8 text-center text-sm text-theme-text-secondary ${
            dark ? "border-white/15 bg-white/[0.02]" : "border-gray-300 bg-gray-50"
          }`}
        >
          {t("owner.categoriesTab.empty")}
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((c) => (
            <div
              key={c.id}
              className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${cls.cardSubtle(dark)}`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-theme-heading-primary">
                    {localizedCategoryName(c, lang)}
                  </span>
                  {c.name_en && (
                    <span className={cls.badgeAccent(dark)}>
                      {t("owner.common.languageEn")}
                    </span>
                  )}
                  <span className={cls.badgeAccent(dark)}>
                    {String(t(`owner.categoryTypes.${c.category_type}.label`, c.category_type))}
                  </span>
                  <span className="text-[10px] text-theme-text-secondary">
                    {t("owner.categoriesTab.optionCount", {
                      count: c.predictor_options?.length ?? 0,
                    })}
                  </span>
                </div>
                {localizedCategoryDescription(c, lang) && (
                  <p className="mt-1 truncate text-xs text-theme-text-secondary">
                    {localizedCategoryDescription(c, lang)}
                  </p>
                )}
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(c)}
                  className={cls.secondaryBtn(dark)}
                >
                  {t("owner.common.edit")}
                </button>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className={cls.dangerBtn(dark)}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <CategoryEditor
          tournamentId={tournament.id}
          category={editing}
          dark={dark}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
            showToast(t("owner.toast.categorySaved"));
          }}
          showToast={showToast}
        />
      )}
    </>
  );
}

function CategoryEditor({
  tournamentId,
  category,
  dark,
  onClose,
  onSaved,
  showToast,
}: {
  tournamentId: string;
  category: Category | null;
  dark: boolean;
  onClose: () => void;
  onSaved: () => void;
  showToast: (m: string, ok?: boolean) => void;
}) {
  const { t } = useTranslation("predictor");
  const isEdit = !!category;
  const [form, setForm] = useState<any>(
    category || {
      name: "",
      name_en: "",
      description: "",
      description_en: "",
      category_type: "single_choice",
      max_selections: 1,
      points_correct: 10,
      points_partial: 0,
      points_ranked_bonus: 0,
      visibility: "public",
      is_active: true,
      sort_order: 0,
      icon: "",
    },
  );
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState<Option[]>(category?.predictor_options || []);
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const needsOptions = ["single_choice", "multiple_choice", "ranked_top_n"].includes(
    form.category_type,
  );

  async function save() {
    if (!form.name?.trim()) {
      showToast(t("owner.categoriesTab.editor.nameRequired"), false);
      return;
    }
    setSaving(true);
    try {
      const body = isEdit
        ? { ...form, id: category!.id }
        : { ...form, tournament_id: tournamentId };
      const res = await fetch("/api/predictor/owner/categories", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");
      if (needsOptions) {
        const catId = isEdit ? category!.id : data.id;
        await fetch("/api/predictor/owner/options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category_id: catId,
            replace: true,
            options: options.map((o, idx) => ({ ...o, sort_order: idx })),
          }),
        });
      }
      onSaved();
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      dark={dark}
      title={
        isEdit
          ? t("owner.categoriesTab.editor.editTitle")
          : t("owner.categoriesTab.editor.createTitle")
      }
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={cls.secondaryBtn(dark)}>
            {t("owner.common.cancel")}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={cls.primaryBtnLg}
          >
            {saving ? t("owner.common.saving") : t("owner.common.save")}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <BilingualPair
          dark={dark}
          bsLabel={t("owner.categoriesTab.editor.name")}
          enLabel={t("owner.categoriesTab.editor.nameEn")}
          bsValue={form.name}
          enValue={form.name_en}
          onBs={(v) => set("name", v)}
          onEn={(v) => set("name_en", v)}
          bsPlaceholder={t("owner.categoriesTab.editor.namePlaceholder")}
          enPlaceholder={t("owner.categoriesTab.editor.nameEnPlaceholder")}
          required
        />
        <BilingualPair
          dark={dark}
          bsLabel={t("owner.categoriesTab.editor.description")}
          enLabel={t("owner.categoriesTab.editor.descriptionEn")}
          bsValue={form.description}
          enValue={form.description_en}
          onBs={(v) => set("description", v)}
          onEn={(v) => set("description_en", v)}
          textarea
          rows={2}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label={t("owner.categoriesTab.editor.categoryType")}
            hint={t(`owner.categoryTypes.${form.category_type}.desc`)}
          >
            <select
              value={form.category_type}
              onChange={(e) => set("category_type", e.target.value)}
              className={cls.input(dark)}
            >
              {CAT_TYPE_KEYS.map((k) => (
                <option key={k} value={k}>
                  {t(`owner.categoryTypes.${k}.label`)}
                </option>
              ))}
            </select>
          </Field>
          {form.category_type === "ranked_top_n" ||
          form.category_type === "multiple_choice" ? (
            <Field label={t("owner.categoriesTab.editor.maxSelections")}>
              <input
                type="number"
                min={1}
                max={20}
                value={form.max_selections || 1}
                onChange={(e) => set("max_selections", Number(e.target.value))}
                className={cls.input(dark)}
              />
            </Field>
          ) : (
            <Field label={t("owner.categoriesTab.editor.sortOrder")}>
              <input
                type="number"
                value={form.sort_order || 0}
                onChange={(e) => set("sort_order", Number(e.target.value))}
                className={cls.input(dark)}
              />
            </Field>
          )}
          <Field label={t("owner.categoriesTab.editor.pointsCorrect")}>
            <input
              type="number"
              value={form.points_correct ?? 10}
              onChange={(e) => set("points_correct", Number(e.target.value))}
              className={cls.input(dark)}
            />
          </Field>
          <Field label={t("owner.categoriesTab.editor.pointsPartial")}>
            <input
              type="number"
              value={form.points_partial ?? 0}
              onChange={(e) => set("points_partial", Number(e.target.value))}
              className={cls.input(dark)}
            />
          </Field>
          {form.category_type === "ranked_top_n" && (
            <Field label={t("owner.categoriesTab.editor.pointsRankedBonus")}>
              <input
                type="number"
                value={form.points_ranked_bonus ?? 0}
                onChange={(e) => set("points_ranked_bonus", Number(e.target.value))}
                className={cls.input(dark)}
              />
            </Field>
          )}
          <Field label={t("owner.categoriesTab.editor.isActive")}>
            <label
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 ${
                dark ? "border-white/10 bg-black/20" : "border-gray-300 bg-white"
              }`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-predictor-primary"
                checked={form.is_active !== false}
                onChange={(e) => set("is_active", e.target.checked)}
              />
              <span className="text-sm text-theme-heading-primary">
                {t("owner.categoriesTab.editor.isActiveHint")}
              </span>
            </label>
          </Field>
        </div>

        {needsOptions && (
          <div
            className={`rounded-xl border p-4 ${
              dark ? "border-white/10 bg-black/20" : "border-gray-300 bg-gray-50"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className={`text-xs font-bold ${cls.accentText(dark)}`}>
                {t("owner.categoriesTab.editor.options")}
              </h4>
              <button
                type="button"
                onClick={() =>
                  setOptions((o) => [...o, { label: "", label_en: "", is_correct: false }])
                }
                className={cls.secondaryBtn(dark)}
              >
                + {t("owner.categoriesTab.editor.addOption")}
              </button>
            </div>
            {options.length === 0 ? (
              <p className="text-xs text-theme-text-secondary">
                {t("owner.categoriesTab.editor.noOptions")}
              </p>
            ) : (
              <div className="space-y-2">
                {options.map((o: any, i: number) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-2 ${
                      dark
                        ? "border-white/8 bg-white/[0.02]"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        placeholder={t("owner.categoriesTab.editor.optionBs")}
                        value={o.label}
                        onChange={(e) =>
                          setOptions((cur) =>
                            cur.map((x, j) =>
                              j === i ? { ...x, label: e.target.value } : x,
                            ),
                          )
                        }
                        className={`flex-1 ${cls.input(dark)}`}
                      />
                      <label
                        className={`inline-flex items-center gap-1 flex-shrink-0 rounded-lg border px-2 py-2 text-[11px] ${
                          dark
                            ? "border-white/10 bg-black/20 text-gray-300"
                            : "border-gray-300 bg-white text-gray-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 accent-emerald-500"
                          checked={!!o.is_correct}
                          onChange={(e) =>
                            setOptions((cur) =>
                              cur.map((x, j) =>
                                j === i ? { ...x, is_correct: e.target.checked } : x,
                              ),
                            )
                          }
                        />
                        {t("owner.categoriesTab.editor.optionCorrect")}
                      </label>
                      <button
                        type="button"
                        onClick={() => setOptions((cur) => cur.filter((_, j) => j !== i))}
                        className={cls.dangerBtn(dark) + " !px-2"}
                      >
                        ×
                      </button>
                    </div>
                    <OptionEnToggle
                      dark={dark}
                      value={o.label_en || ""}
                      onChange={(v) =>
                        setOptions((cur) =>
                          cur.map((x, j) =>
                            j === i ? { ...x, label_en: v } : x,
                          ),
                        )
                      }
                      placeholder={t("owner.categoriesTab.editor.optionEn")}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Matches tab
// ─────────────────────────────────────────────────────────────────────────────
function ImageUpload({
  dark,
  tournamentId,
  kind,
  label,
  value,
  onChange,
  onError,
}: {
  dark: boolean;
  tournamentId: string;
  kind: "banner" | "hero" | "logo";
  label: string;
  value: string | null | undefined;
  onChange: (url: string) => void;
  onError: (msg: string) => void;
}) {
  const { t } = useTranslation("predictor");
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("tournament_id", tournamentId);
      fd.append("kind", kind);
      const res = await fetch("/api/predictor/owner/upload-image", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      onChange(data.url);
    } catch (e: any) {
      onError(
        e?.message
          ? `${t("owner.settings.branding.uploadError")}: ${e.message}`
          : t("owner.settings.branding.uploadError"),
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <Field label={label}>
      <div className="space-y-2">
        {value ? (
          <div
            className={`relative flex items-center gap-3 overflow-hidden rounded-lg border p-2 ${
              dark ? "border-white/10 bg-black/20" : "border-gray-200 bg-gray-50"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              className={`h-12 w-12 flex-shrink-0 rounded object-cover ring-1 ${
                dark ? "ring-white/10" : "ring-gray-200"
              }`}
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            <span className="truncate text-[11px] text-theme-text-secondary">
              {value}
            </span>
            <button
              type="button"
              onClick={() => onChange("")}
              className={`ml-auto rounded-full px-2 py-1 text-[11px] font-medium transition-colors ${
                dark
                  ? "text-gray-400 hover:bg-white/5 hover:text-red-300"
                  : "text-gray-500 hover:bg-red-50 hover:text-red-700"
              }`}
            >
              {t("owner.settings.branding.remove")}
            </button>
          </div>
        ) : null}

        <label
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-xs font-semibold transition-colors ${
            uploading
              ? "opacity-60"
              : dark
                ? "border-white/15 bg-white/[0.02] text-gray-300 hover:border-predictor-primary/60 hover:bg-predictor-primary/[0.05]"
                : "border-gray-300 bg-white text-gray-700 hover:border-predictor-primary hover:bg-predictor-primary/10"
          }`}
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
            className="hidden"
          />
          <span aria-hidden>↑</span>
          {uploading
            ? t("owner.settings.branding.uploading")
            : t("owner.settings.branding.uploadCta")}
        </label>

        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className={`${cls.input(dark)} text-xs`}
        />
        <p className="text-[11px] text-theme-text-secondary/80">
          {t("owner.settings.branding.orUseUrl")}
        </p>
      </div>
    </Field>
  );
}

function TeamChip({
  logoUrl,
  name,
}: {
  logoUrl?: string | null;
  name: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          width={16}
          height={12}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-3 w-auto rounded-sm object-cover ring-1 ring-white/10"
        />
      ) : null}
      <span>{name}</span>
    </span>
  );
}

function MatchesTab({
  tournament,
  dark,
  showToast,
}: {
  tournament: Tournament;
  dark: boolean;
  showToast: (m: string, ok?: boolean) => void;
}) {
  const { t, i18n } = useTranslation("predictor");
  const lang = normalizeLang(i18n.language);
  const [list, setList] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Match | null>(null);
  const [lockingRound, setLockingRound] = useState(false);
  const [roundConfirm, setRoundConfirm] = useState<{ md: number; action: "lock" | "unlock" } | null>(null);
  const [rescoring, setRescoring] = useState(false);
  // Utakmica za koju owner upisuje tip u ime igrača (propušten/zakašnjeli tip).
  const [pickFor, setPickFor] = useState<Match | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/predictor/owner/matches?tournament_id=${tournament.id}`);
    if (res.ok) setList(await res.json());
    setLoading(false);
  }, [tournament.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm(t("owner.matchesTab.deleteConfirm"))) return;
    const res = await fetch(`/api/predictor/owner/matches?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      load();
      showToast(t("owner.toast.matchDeleted"));
    } else showToast(t("owner.toast.genericError"), false);
  }

  async function toggleRound(matchday: number, action: "lock" | "unlock") {
    const targets = list.filter((m) =>
      m.matchday === matchday &&
      (action === "lock" ? m.status === "scheduled" : m.status === "live"),
    );
    if (targets.length === 0) return;
    setLockingRound(true);
    setRoundConfirm(null);
    try {
      const newStatus = action === "lock" ? "live" : "scheduled";
      for (const m of targets) {
        await fetch("/api/predictor/owner/matches", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: m.id, status: newStatus }),
        });
      }
      showToast(
        action === "lock"
          ? (lang === "bs"
              ? `${matchday}. kolo zakljucano (${targets.length})`
              : `Matchday ${matchday} locked (${targets.length})`)
          : (lang === "bs"
              ? `${matchday}. kolo otkljucano (${targets.length})`
              : `Matchday ${matchday} unlocked (${targets.length})`),
      );
      load();
    } catch {
      showToast(t("owner.toast.genericError"), false);
    } finally {
      setLockingRound(false);
    }
  }

  async function rescoreAll() {
    setRescoring(true);
    try {
      const res = await fetch("/api/predictor/owner/scoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournament_id: tournament.id, action: "rescore" }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(
          lang === "bs"
            ? `Bodovanje ažurirano (${data.scored ?? 0} predikcija)`
            : `Scoring updated (${data.scored ?? 0} predictions)`,
        );
      } else {
        showToast(t("owner.toast.genericError"), false);
      }
    } catch {
      showToast(t("owner.toast.genericError"), false);
    } finally {
      setRescoring(false);
    }
  }

  const matchdays = useMemo(() => {
    const mds = new Map<number, { total: number; open: number; locked: number }>();
    for (const m of list) {
      if (m.matchday == null) continue;
      const cur = mds.get(m.matchday) ?? { total: 0, open: 0, locked: 0 };
      cur.total++;
      if (m.status === "scheduled") cur.open++;
      if (m.status === "live") cur.locked++;
      mds.set(m.matchday, cur);
    }
    return Array.from(mds.entries()).sort((a, b) => a[0] - b[0]);
  }, [list]);

  // ── Grouping: split matches into upcoming (no result yet) and finished
  // (result entered), each grouped by round (kolo). Avoids an endless flat
  // scroll — upcoming rounds open by default, finished rounds collapsed and
  // tucked below so they stay one click away.
  const hasResult = (m: Match) => m.home_score != null && m.away_score != null;
  const { upcomingGroups, finishedGroups, hasMatchdays } = useMemo(() => {
    const hasMd = list.some((m) => m.matchday != null);
    const byKickoff = (a: Match, b: Match) => {
      const ta = a.kickoff_at ? Date.parse(a.kickoff_at) : Infinity;
      const tb = b.kickoff_at ? Date.parse(b.kickoff_at) : Infinity;
      return ta - tb;
    };
    const group = (arr: Match[]) => {
      const m = new Map<string, Match[]>();
      for (const match of arr) {
        const key = hasMd ? String(match.matchday ?? 0) : "all";
        const g = m.get(key) ?? [];
        g.push(match);
        m.set(key, g);
      }
      for (const g of m.values()) g.sort(byKickoff);
      return Array.from(m.entries()).sort((a, b) => Number(a[0]) - Number(b[0]));
    };
    return {
      upcomingGroups: group(list.filter((m) => !hasResult(m))),
      finishedGroups: group(list.filter(hasResult)),
      hasMatchdays: hasMd,
    };
  }, [list]);

  // Open-section state. `null` = use defaults; once the owner toggles anything
  // we honour their set.
  const [openSections, setOpenSections] = useState<Set<string> | null>(null);
  // Default: samo aktuelno (prvo predstojeće) kolo je otvoreno; ostala
  // predstojeća kola i sva završena su sklopljena — owner upisuje rezultate bez
  // beskonačnog skrolanja. upcomingGroups su sortirane po kolu rastuće, pa je
  // [0] najranije kolo koje još ima utakmice bez rezultata = aktuelno kolo.
  const defaultOpen = useMemo(
    () => new Set(upcomingGroups.length ? [`u:${upcomingGroups[0][0]}`] : []),
    [upcomingGroups],
  );
  const openSet = openSections ?? defaultOpen;
  const toggleSection = (key: string) =>
    setOpenSections((prev) => {
      const next = new Set(prev ?? defaultOpen);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const renderRow = (m: Match) => {
    const homeName = localizedMatchHomeTeam(m, lang);
    const awayName = localizedMatchAwayTeam(m, lang);
    const stageName = localizedMatchStageLabel(m, lang) || m.stage;
    return (
      <div
        key={m.id}
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${cls.cardSubtle(dark)}`}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-theme-heading-primary">
            <TeamChip logoUrl={m.home_logo_url} name={homeName} />
            {m.home_score != null ? (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-xs font-black tabular-nums ${
                  dark ? "bg-white/8 text-white" : "bg-gray-100 text-gray-900"
                }`}
              >
                {m.home_score}
                <span className={dark ? "text-gray-500" : "text-gray-400"}>:</span>
                {m.away_score}
              </span>
            ) : (
              <span className="text-theme-text-secondary text-xs">vs</span>
            )}
            <TeamChip logoUrl={m.away_logo_url} name={awayName} />
          </div>
          <div className="mt-0.5 text-[11px] text-theme-text-secondary">
            {m.kickoff_at
              ? new Date(m.kickoff_at).toLocaleString(lang === "bs" ? "sr-Latn" : "en-GB", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
              : t("owner.matchesTab.noKickoff")}{" "}
            · {stageName}
            {m.matchday != null && (
              <span className={cls.badgeAccent(dark) + " ml-1"}>
                {lang === "bs" ? `${m.matchday}. kolo` : `MD${m.matchday}`}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPickFor(m)}
            title={lang === "bs" ? "Upiši tip u ime igrača" : "Enter a pick for a player"}
            className={`inline-flex items-center gap-1.5 ${cls.secondaryBtn(dark)}`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            {lang === "bs" ? "Tip igrača" : "Player pick"}
          </button>
          <button type="button" onClick={() => setEditing(m)} className={cls.secondaryBtn(dark)}>
            {t("owner.common.edit")}
          </button>
          <button type="button" onClick={() => remove(m.id)} className={cls.dangerBtn(dark)}>
            ×
          </button>
        </div>
      </div>
    );
  };

  const renderSection = (
    prefix: "u" | "f",
    key: string,
    label: string,
    ms: Match[],
  ) => {
    const sKey = `${prefix}:${key}`;
    const isOpen = openSet.has(sKey);
    return (
      <div
        key={sKey}
        className={`overflow-hidden rounded-xl border ${dark ? "border-white/8" : "border-gray-200"}`}
      >
        <button
          type="button"
          onClick={() => toggleSection(sKey)}
          className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left transition-colors ${
            dark ? "bg-white/[0.02] hover:bg-white/[0.04]" : "bg-gray-50/60 hover:bg-gray-100/70"
          }`}
        >
          <span className="flex items-center gap-2 text-sm font-bold text-theme-heading-primary">
            {label}
            <span className="text-[11px] font-medium text-theme-text-secondary">
              {ms.length}
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 flex-shrink-0 text-theme-text-secondary transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        {isOpen && <div className="space-y-2 p-2">{ms.map(renderRow)}</div>}
      </div>
    );
  };

  const roundLabel = (key: string) =>
    lang === "bs" ? `${key}. kolo` : `MD${key}`;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={`text-base font-bold ${cls.accentText(dark)}`}>
            {t("owner.matchesTab.title")}
          </h2>
          <p className="mt-0.5 text-xs text-theme-text-secondary">
            {t("owner.matchesTab.desc")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={rescoreAll}
            disabled={rescoring}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors ${
              dark
                ? "border-white/12 text-gray-400 hover:border-white/25 hover:text-gray-200 disabled:opacity-50"
                : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800 disabled:opacity-50"
            }`}
          >
            {rescoring
              ? (lang === "bs" ? "Ažuriram…" : "Updating…")
              : (lang === "bs" ? "Ažuriraj bodovanje" : "Update scores")}
          </button>
          <button type="button" onClick={() => setCreating(true)} className={cls.primaryBtnLg}>
            + {t("owner.matchesTab.new")}
          </button>
        </div>
      </div>

      {/* Lock/unlock round controls */}
      {matchdays.length > 0 && (
        <div className={`mb-4 rounded-xl border p-3 ${
          dark ? "border-white/8 bg-white/[0.02]" : "border-gray-200 bg-gray-50/50"
        }`}>
          <div className="flex flex-wrap items-center gap-2">
            {matchdays.map(([md, info]) => {
              const allLocked = info.open === 0 && info.locked > 0;
              const allOpen = info.locked === 0;
              return (
                <button
                  key={md}
                  type="button"
                  disabled={lockingRound}
                  onClick={() =>
                    setRoundConfirm({
                      md,
                      action: allLocked ? "unlock" : "lock",
                    })
                  }
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    allLocked
                      ? dark
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : allOpen
                        ? dark
                          ? "border-predictor-primary/40 bg-predictor-primary/10 text-predictor-accent-dark hover:bg-predictor-primary/20"
                          : "border-predictor-primary/60 bg-predictor-primary/15 text-predictor-accent-light hover:bg-predictor-primary/25"
                        : dark
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                          : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  {lang === "bs" ? `${md}. kolo` : `MD${md}`}
                  <span className="text-[10px] opacity-70">
                    {allLocked
                      ? (lang === "bs" ? "zaključano" : "locked")
                      : `${info.open}/${info.total}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Round lock/unlock confirmation modal */}
      {roundConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setRoundConfirm(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-sm rounded-2xl p-5 ${
              dark ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-200 shadow-2xl"
            }`}
          >
            <h3 className={`text-base font-black mb-2 ${dark ? "text-white" : "text-gray-900"}`}>
              {roundConfirm.action === "lock"
                ? (lang === "bs" ? `Zaključaj ${roundConfirm.md}. kolo?` : `Lock matchday ${roundConfirm.md}?`)
                : (lang === "bs" ? `Otključaj ${roundConfirm.md}. kolo?` : `Unlock matchday ${roundConfirm.md}?`)}
            </h3>
            <p className={`text-sm mb-4 ${dark ? "text-gray-400" : "text-gray-600"}`}>
              {roundConfirm.action === "lock"
                ? (lang === "bs"
                    ? "Korisnici vise nece moci mijenjati predikcije za ovo kolo."
                    : "Users will no longer be able to change predictions for this round.")
                : (lang === "bs"
                    ? "Korisnici ce ponovo moci mijenjati predikcije za ovo kolo."
                    : "Users will be able to change predictions for this round again.")}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRoundConfirm(null)}
                className={cls.secondaryBtn(dark)}
              >
                {t("owner.common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                disabled={lockingRound}
                onClick={() => toggleRound(roundConfirm.md, roundConfirm.action)}
                className={roundConfirm.action === "lock" ? cls.primaryBtn : cls.dangerBtn(dark)}
              >
                {lockingRound
                  ? "..."
                  : roundConfirm.action === "lock"
                    ? (lang === "bs" ? "Zaključaj" : "Lock")
                    : (lang === "bs" ? "Otključaj" : "Unlock")}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-theme-text-secondary">
          {t("owner.common.loading")}
        </p>
      ) : list.length === 0 ? (
        <div
          className={`rounded-xl border border-dashed p-8 text-center text-sm text-theme-text-secondary ${
            dark ? "border-white/15 bg-white/[0.02]" : "border-gray-300 bg-gray-50"
          }`}
        >
          {t("owner.matchesTab.empty")}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Predstojeće utakmice — bez upisanog rezultata, po kolima, otvorena */}
          {upcomingGroups.length > 0 && (
            <div className="space-y-2">
              <h3 className="px-1 text-xs font-bold uppercase tracking-wide text-theme-text-secondary">
                {lang === "bs" ? "Predstojeće utakmice" : "Upcoming matches"}
              </h3>
              {hasMatchdays
                ? upcomingGroups.map(([k, ms]) =>
                    renderSection("u", k, roundLabel(k), ms),
                  )
                : (
                    <div className="space-y-2">
                      {upcomingGroups[0]?.[1].map(renderRow)}
                    </div>
                  )}
            </div>
          )}

          {/* Završene utakmice — rezultat upisan, po kolima, sklopljeno (accordion) */}
          {finishedGroups.length > 0 && (
            <div className="space-y-2">
              <h3 className="px-1 text-xs font-bold uppercase tracking-wide text-theme-text-secondary">
                {lang === "bs" ? "Završene utakmice" : "Finished matches"}
              </h3>
              {finishedGroups.map(([k, ms]) =>
                renderSection(
                  "f",
                  k,
                  hasMatchdays
                    ? roundLabel(k)
                    : lang === "bs"
                      ? "Završene"
                      : "Finished",
                  ms,
                ),
              )}
            </div>
          )}
        </div>
      )}

      {(creating || editing) && (
        <MatchEditor
          tournamentId={tournament.id}
          match={editing}
          dark={dark}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
            showToast(t("owner.toast.matchSaved"));
          }}
          showToast={showToast}
        />
      )}

      {pickFor && (
        <OnBehalfPredictionForm
          match={pickFor}
          tournamentId={tournament.id}
          dark={dark}
          lang={lang}
          onClose={() => setPickFor(null)}
          onSaved={(msg) => {
            setPickFor(null);
            load();
            showToast(msg);
          }}
        />
      )}
    </>
  );
}

function OnBehalfPredictionForm({
  match,
  tournamentId,
  dark,
  lang,
  onClose,
  onSaved,
}: {
  match: Match;
  tournamentId: string;
  dark: boolean;
  lang: "bs" | "en";
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [participants, setParticipants] = useState<
    Array<{ user_id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/predictor/owner/participants?tournament_id=${tournamentId}`,
        );
        if (res.ok && active) {
          const rows = await res.json();
          setParticipants(
            (rows ?? []).map((r: any) => ({
              user_id: r.user_id,
              name: r.user_display_name || r.user_email || "Nepoznat igrač",
            })),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [tournamentId]);

  const homeName = localizedMatchHomeTeam(match, lang);
  const awayName = localizedMatchAwayTeam(match, lang);
  const hasResult = match.home_score != null && match.away_score != null;

  const save = async () => {
    setErr(null);
    if (!userId) {
      setErr(lang === "bs" ? "Izaberi igrača." : "Pick a player.");
      return;
    }
    if (home === "" || away === "") {
      setErr(lang === "bs" ? "Unesi rezultat." : "Enter a score.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/predictor/owner/match-predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: match.id,
          user_id: userId,
          home_score: Number(home),
          away_score: Number(away),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Greška pri upisu");
      onSaved(
        j.scored
          ? lang === "bs"
            ? `Tip upisan i bodovan (+${j.points})`
            : `Pick saved and scored (+${j.points})`
          : lang === "bs"
            ? "Tip upisan"
            : "Pick saved",
      );
    } catch (e) {
      setErr((e as Error)?.message || "Greška");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md rounded-2xl p-5 ${
          dark
            ? "bg-gray-900 border border-gray-700"
            : "bg-white border border-gray-200 shadow-2xl"
        }`}
      >
        <h3 className={`text-base font-black ${dark ? "text-white" : "text-gray-900"}`}>
          {lang === "bs" ? "Upiši tip u ime igrača" : "Enter a pick for a player"}
        </h3>
        <p className="mt-1 mb-4 text-xs text-theme-text-secondary">
          {homeName} <span className="opacity-60">vs</span> {awayName}
          {hasResult && (
            <span className="ml-1">
              · {lang === "bs" ? "rezultat" : "result"}{" "}
              <b>
                {match.home_score}:{match.away_score}
              </b>
            </span>
          )}
        </p>

        <div className="space-y-3">
          <Field label={lang === "bs" ? "Igrač" : "Player"}>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={loading}
              className={cls.input(dark)}
            >
              <option value="">
                {loading
                  ? lang === "bs"
                    ? "Učitavam…"
                    : "Loading…"
                  : lang === "bs"
                    ? "— izaberi igrača —"
                    : "— pick a player —"}
              </option>
              {participants.map((p) => (
                <option key={p.user_id} value={p.user_id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={homeName}>
              <input
                type="number"
                min={0}
                value={home}
                onChange={(e) => setHome(e.target.value)}
                placeholder="0"
                className={`${cls.input(dark)} text-center text-lg font-bold`}
              />
            </Field>
            <Field label={awayName}>
              <input
                type="number"
                min={0}
                value={away}
                onChange={(e) => setAway(e.target.value)}
                placeholder="0"
                className={`${cls.input(dark)} text-center text-lg font-bold`}
              />
            </Field>
          </div>

          {err && <p className="text-xs font-semibold text-red-500">{err}</p>}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className={cls.secondaryBtn(dark)}>
            {lang === "bs" ? "Otkaži" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={cls.primaryBtn}
          >
            {saving
              ? lang === "bs"
                ? "Upisujem…"
                : "Saving…"
              : lang === "bs"
                ? "Upiši i boduj"
                : "Save & score"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MatchEditor({
  tournamentId,
  match,
  dark,
  onClose,
  onSaved,
  showToast,
}: {
  tournamentId: string;
  match: Match | null;
  dark: boolean;
  onClose: () => void;
  onSaved: () => void;
  showToast: (m: string, ok?: boolean) => void;
}) {
  const { t } = useTranslation("predictor");
  const isEdit = !!match;
  const [form, setForm] = useState<any>(
    match || {
      stage: "group",
      stage_label: "",
      stage_label_en: "",
      home_team: "",
      home_team_en: "",
      away_team: "",
      away_team_en: "",
      kickoff_at: null,
      status: "scheduled",
      // Default scoring: exact 3 / correct outcome 1 / miss 0.
      points_exact: 3,
      points_diff: 1,
      points_winner: 1,
      home_score: null,
      away_score: null,
      matchday: null,
    },
  );
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  async function save() {
    if (!form.home_team || !form.away_team) {
      showToast(t("owner.matchesTab.editor.teamsRequired"), false);
      return;
    }
    setSaving(true);
    try {
      const body = isEdit
        ? { ...form, id: match!.id }
        : { ...form, tournament_id: tournamentId };
      const res = await fetch("/api/predictor/owner/matches", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d?.error || "Save failed");
      }
      onSaved();
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      dark={dark}
      title={
        isEdit
          ? t("owner.matchesTab.editor.editTitle")
          : t("owner.matchesTab.editor.createTitle")
      }
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={cls.secondaryBtn(dark)}>
            {t("owner.common.cancel")}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={cls.primaryBtnLg}
          >
            {saving ? t("owner.common.saving") : t("owner.common.save")}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <BilingualPair
          dark={dark}
          bsLabel={t("owner.matchesTab.editor.home")}
          enLabel={t("owner.matchesTab.editor.homeEn")}
          bsValue={form.home_team}
          enValue={form.home_team_en}
          onBs={(v) => set("home_team", v)}
          onEn={(v) => set("home_team_en", v)}
          required
        />
        <BilingualPair
          dark={dark}
          bsLabel={t("owner.matchesTab.editor.away")}
          enLabel={t("owner.matchesTab.editor.awayEn")}
          bsValue={form.away_team}
          enValue={form.away_team_en}
          onBs={(v) => set("away_team", v)}
          onEn={(v) => set("away_team_en", v)}
          required
        />
        <BilingualPair
          dark={dark}
          bsLabel={t("owner.matchesTab.editor.stageLabel")}
          enLabel={t("owner.matchesTab.editor.stageLabelEn")}
          bsValue={form.stage_label}
          enValue={form.stage_label_en}
          onBs={(v) => set("stage_label", v)}
          onEn={(v) => set("stage_label_en", v)}
          bsPlaceholder={t("owner.matchesTab.editor.stageBsPlaceholder")}
          enPlaceholder={t("owner.matchesTab.editor.stageEnPlaceholder")}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label={t("owner.matchesTab.editor.kickoff")}>
            <input
              type="datetime-local"
              value={toLocal(form.kickoff_at)}
              onChange={(e) => set("kickoff_at", fromLocal(e.target.value))}
              className={cls.input(dark)}
            />
          </Field>
          <Field label={t("owner.matchesTab.editor.status")}>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className={cls.input(dark)}
            >
              {MATCH_STATUS_KEYS.map((s) => (
                <option key={s} value={s}>
                  {t(`owner.matchesTab.editor.statusOptions.${s}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("owner.matchesTab.editor.type")}>
            <select
              value={form.stage}
              onChange={(e) => set("stage", e.target.value)}
              className={cls.input(dark)}
            >
              {STAGE_KEYS.map((s) => (
                <option key={s} value={s}>
                  {t(`owner.matchesTab.editor.typeOptions.${s}`)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Field label={t("owner.matchesTab.editor.pointsExact", "Exact score pts")}>
            <input
              type="number"
              value={form.points_exact ?? 3}
              onChange={(e) => set("points_exact", Number(e.target.value))}
              className={cls.input(dark)}
            />
          </Field>
          <Field label={t("owner.matchesTab.editor.pointsDiff", "Goal diff pts")}>
            <input
              type="number"
              value={form.points_diff ?? 1}
              onChange={(e) => set("points_diff", Number(e.target.value))}
              className={cls.input(dark)}
            />
          </Field>
          <Field label={t("owner.matchesTab.editor.pointsWinner", "Winner pts")}>
            <input
              type="number"
              value={form.points_winner ?? 1}
              onChange={(e) => set("points_winner", Number(e.target.value))}
              className={cls.input(dark)}
            />
          </Field>
          <Field
            label={t("owner.matchesTab.editor.matchday", "Matchday / Round")}
            hint={t("owner.matchesTab.editor.matchdayHint", "Used for per-round locking")}
          >
            <input
              type="number"
              min={1}
              value={form.matchday ?? ""}
              onChange={(e) =>
                set("matchday", e.target.value ? Number(e.target.value) : null)
              }
              placeholder="1, 2, 3..."
              className={cls.input(dark)}
            />
          </Field>
        </div>

        <div
          className={`rounded-xl border p-4 ${
            dark
              ? "border-predictor-primary/30 bg-predictor-primary/[0.05]"
              : "border-predictor-primary/50 bg-predictor-primary/10"
          }`}
        >
          <h4 className={`mb-2 text-xs font-bold ${cls.accentText(dark)}`}>
            {t("owner.matchesTab.editor.finalScore")}
          </h4>
          <p className="mb-3 text-[11px] text-theme-text-secondary">
            {t("owner.matchesTab.editor.finalScoreHint")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("owner.matchesTab.editor.homeScore")}>
              <input
                type="number"
                min={0}
                value={form.home_score ?? ""}
                onChange={(e) =>
                  set("home_score", e.target.value === "" ? null : Number(e.target.value))
                }
                className={cls.input(dark)}
              />
            </Field>
            <Field label={t("owner.matchesTab.editor.awayScore")}>
              <input
                type="number"
                min={0}
                value={form.away_score ?? ""}
                onChange={(e) =>
                  set("away_score", e.target.value === "" ? null : Number(e.target.value))
                }
                className={cls.input(dark)}
              />
            </Field>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rules tab
// ─────────────────────────────────────────────────────────────────────────────
function RulesTab({
  tournament,
  dark,
  showToast,
}: {
  tournament: Tournament;
  dark: boolean;
  showToast: (m: string, ok?: boolean) => void;
}) {
  const { t, i18n } = useTranslation("predictor");
  const lang = normalizeLang(i18n.language);
  const [list, setList] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/predictor/owner/rules?tournament_id=${tournament.id}`);
    if (res.ok) setList(await res.json());
    setLoading(false);
  }, [tournament.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm(t("owner.rulesTab.deleteConfirm"))) return;
    const res = await fetch(`/api/predictor/owner/rules?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      load();
      showToast(t("owner.toast.ruleDeleted"));
    } else showToast(t("owner.toast.genericError"), false);
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={`text-base font-bold ${cls.accentText(dark)}`}>
            {t("owner.rulesTab.title")}
          </h2>
          <p className="mt-0.5 text-xs text-theme-text-secondary">
            {t("owner.rulesTab.desc")}
          </p>
        </div>
        <button type="button" onClick={() => setCreating(true)} className={cls.primaryBtnLg}>
          + {t("owner.rulesTab.new")}
        </button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-theme-text-secondary">
          {t("owner.common.loading")}
        </p>
      ) : list.length === 0 ? (
        <div
          className={`rounded-xl border border-dashed p-8 text-center text-sm text-theme-text-secondary ${
            dark ? "border-white/15 bg-white/[0.02]" : "border-gray-300 bg-gray-50"
          }`}
        >
          {t("owner.rulesTab.empty")}
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((r) => (
            <div
              key={r.id}
              className={`flex items-start justify-between gap-3 rounded-xl border p-4 ${cls.cardSubtle(dark)}`}
            >
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className={cls.badgeAccent(dark) + " uppercase"}>
                    {String(t(`owner.rulesTab.kinds.${r.kind}`, r.kind))}
                  </span>
                  <span className="text-sm font-bold text-theme-heading-primary">
                    {localizedRuleTitle(r, lang)}
                  </span>
                </div>
                {localizedRuleBody(r, lang) && (
                  <p className="line-clamp-2 text-xs text-theme-text-secondary">
                    {localizedRuleBody(r, lang)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(r)}
                  className={cls.secondaryBtn(dark)}
                >
                  {t("owner.common.edit")}
                </button>
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  className={cls.dangerBtn(dark)}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <RuleEditor
          tournamentId={tournament.id}
          rule={editing}
          dark={dark}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
            showToast(t("owner.toast.ruleSaved"));
          }}
          showToast={showToast}
        />
      )}
    </>
  );
}

function RuleEditor({
  tournamentId,
  rule,
  dark,
  onClose,
  onSaved,
  showToast,
}: {
  tournamentId: string;
  rule: Rule | null;
  dark: boolean;
  onClose: () => void;
  onSaved: () => void;
  showToast: (m: string, ok?: boolean) => void;
}) {
  const { t } = useTranslation("predictor");
  const isEdit = !!rule;
  const [form, setForm] = useState<any>(
    rule || {
      kind: "rule",
      title: "",
      title_en: "",
      body_md: "",
      body_md_en: "",
      sort_order: 0,
    },
  );
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  async function save() {
    if (!form.title?.trim()) {
      showToast(t("owner.rulesTab.editor.titleRequired"), false);
      return;
    }
    setSaving(true);
    try {
      const body = isEdit
        ? { ...form, id: rule!.id }
        : { ...form, tournament_id: tournamentId };
      const res = await fetch("/api/predictor/owner/rules", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d?.error || "Save failed");
      }
      onSaved();
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      dark={dark}
      title={
        isEdit
          ? t("owner.rulesTab.editor.editTitle")
          : t("owner.rulesTab.editor.createTitle")
      }
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={cls.secondaryBtn(dark)}>
            {t("owner.common.cancel")}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={cls.primaryBtnLg}
          >
            {saving ? t("owner.common.saving") : t("owner.common.save")}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t("owner.rulesTab.editor.kind")}>
          <select
            value={form.kind}
            onChange={(e) => set("kind", e.target.value)}
            className={cls.input(dark)}
          >
            {RULE_KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`owner.rulesTab.kinds.${k}`)}
              </option>
            ))}
          </select>
        </Field>
        <BilingualPair
          dark={dark}
          bsLabel={t("owner.rulesTab.editor.title")}
          enLabel={t("owner.rulesTab.editor.titleEn")}
          bsValue={form.title}
          enValue={form.title_en}
          onBs={(v) => set("title", v)}
          onEn={(v) => set("title_en", v)}
          required
        />
        <BilingualPair
          dark={dark}
          bsLabel={t("owner.rulesTab.editor.body")}
          enLabel={t("owner.rulesTab.editor.bodyEn")}
          bsValue={form.body_md}
          enValue={form.body_md_en}
          onBs={(v) => set("body_md", v)}
          onEn={(v) => set("body_md_en", v)}
          textarea
          rows={6}
        />
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rewards tab
// ─────────────────────────────────────────────────────────────────────────────
function RewardsTab({
  tournament,
  dark,
  showToast,
}: {
  tournament: Tournament;
  dark: boolean;
  showToast: (m: string, ok?: boolean) => void;
}) {
  const { t, i18n } = useTranslation("predictor");
  const lang = normalizeLang(i18n.language);
  const [list, setList] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/predictor/owner/rewards?tournament_id=${tournament.id}`);
    if (res.ok) setList(await res.json());
    setLoading(false);
  }, [tournament.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm(t("owner.rewardsTab.deleteConfirm"))) return;
    const res = await fetch(`/api/predictor/owner/rewards?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      load();
      showToast(t("owner.toast.rewardDeleted"));
    } else showToast(t("owner.toast.genericError"), false);
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={`text-base font-bold ${cls.accentText(dark)}`}>
            {t("owner.rewardsTab.title")}
          </h2>
          <p className="mt-0.5 text-xs text-theme-text-secondary">
            {t("owner.rewardsTab.desc")}
          </p>
        </div>
        <button type="button" onClick={() => setCreating(true)} className={cls.primaryBtnLg}>
          + {t("owner.rewardsTab.new")}
        </button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-theme-text-secondary">
          {t("owner.common.loading")}
        </p>
      ) : list.length === 0 ? (
        <div
          className={`rounded-xl border border-dashed p-8 text-center text-sm text-theme-text-secondary ${
            dark ? "border-white/15 bg-white/[0.02]" : "border-gray-300 bg-gray-50"
          }`}
        >
          {t("owner.rewardsTab.empty")}
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((r) => (
            <div
              key={r.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${cls.cardSubtle(dark)}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {r.rank_position && (
                    <span className={cls.badgeAccent(dark) + " font-bold"}>
                      #{r.rank_position}
                    </span>
                  )}
                  <span className="text-sm font-bold text-theme-heading-primary">
                    {localizedRewardTitle(r, lang)}
                  </span>
                  <span className={cls.badgeAccent(dark)}>
                    {String(t(`owner.rewardsTab.prizeTypes.${r.prize_type}`, r.prize_type))}
                  </span>
                  {r.prize_value && (
                    <span className={`text-xs ${cls.accentText(dark)}`}>
                      {r.prize_value} {r.prize_currency || "EUR"}
                    </span>
                  )}
                </div>
                {localizedRewardDescription(r, lang) && (
                  <p className="mt-1 text-xs text-theme-text-secondary">
                    {localizedRewardDescription(r, lang)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(r)}
                  className={cls.secondaryBtn(dark)}
                >
                  {t("owner.common.edit")}
                </button>
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  className={cls.dangerBtn(dark)}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <RewardEditor
          tournamentId={tournament.id}
          reward={editing}
          dark={dark}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
            showToast(t("owner.toast.rewardSaved"));
          }}
          showToast={showToast}
        />
      )}
    </>
  );
}

function RewardEditor({
  tournamentId,
  reward,
  dark,
  onClose,
  onSaved,
  showToast,
}: {
  tournamentId: string;
  reward: Reward | null;
  dark: boolean;
  onClose: () => void;
  onSaved: () => void;
  showToast: (m: string, ok?: boolean) => void;
}) {
  const { t } = useTranslation("predictor");
  const isEdit = !!reward;
  const [form, setForm] = useState<any>(
    reward || {
      rank_position: 1,
      title: "",
      title_en: "",
      description: "",
      description_en: "",
      prize_type: "cash",
      prize_value: null,
      prize_currency: "EUR",
    },
  );
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  async function save() {
    if (!form.title?.trim()) {
      showToast(t("owner.rewardsTab.editor.titleRequired"), false);
      return;
    }
    setSaving(true);
    try {
      const body = isEdit
        ? { ...form, id: reward!.id }
        : { ...form, tournament_id: tournamentId };
      const res = await fetch("/api/predictor/owner/rewards", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d?.error || "Save failed");
      }
      onSaved();
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      dark={dark}
      title={
        isEdit
          ? t("owner.rewardsTab.editor.editTitle")
          : t("owner.rewardsTab.editor.createTitle")
      }
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={cls.secondaryBtn(dark)}>
            {t("owner.common.cancel")}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={cls.primaryBtnLg}
          >
            {saving ? t("owner.common.saving") : t("owner.common.save")}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label={t("owner.rewardsTab.editor.rankPosition")}
            hint={t("owner.rewardsTab.editor.rankHint")}
          >
            <input
              type="number"
              value={form.rank_position ?? ""}
              onChange={(e) =>
                set(
                  "rank_position",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              className={cls.input(dark)}
            />
          </Field>
          <Field label={t("owner.rewardsTab.editor.prizeType")}>
            <select
              value={form.prize_type}
              onChange={(e) => set("prize_type", e.target.value)}
              className={cls.input(dark)}
            >
              {PRIZE_TYPES.map((p) => (
                <option key={p} value={p}>
                  {t(`owner.rewardsTab.prizeTypes.${p}`)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <BilingualPair
          dark={dark}
          bsLabel={t("owner.rewardsTab.editor.title")}
          enLabel={t("owner.rewardsTab.editor.titleEn")}
          bsValue={form.title}
          enValue={form.title_en}
          onBs={(v) => set("title", v)}
          onEn={(v) => set("title_en", v)}
          required
        />
        <BilingualPair
          dark={dark}
          bsLabel={t("owner.rewardsTab.editor.description")}
          enLabel={t("owner.rewardsTab.editor.descriptionEn")}
          bsValue={form.description}
          enValue={form.description_en}
          onBs={(v) => set("description", v)}
          onEn={(v) => set("description_en", v)}
          textarea
          rows={2}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label={t("owner.rewardsTab.editor.value")}>
            <input
              type="number"
              step="0.01"
              value={form.prize_value ?? ""}
              onChange={(e) =>
                set("prize_value", e.target.value === "" ? null : Number(e.target.value))
              }
              className={cls.input(dark)}
            />
          </Field>
          <Field label={t("owner.rewardsTab.editor.currency")}>
            <input
              value={form.prize_currency ?? "EUR"}
              onChange={(e) => set("prize_currency", e.target.value.toUpperCase())}
              className={cls.input(dark)}
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pending approvals callout — shown above the tab body whenever people are
// waiting to be let into a closed/approval tournament. One tap jumps the owner
// to the Members tab so they never need the global /admin panel.
// ─────────────────────────────────────────────────────────────────────────────
function PendingApprovalsCallout({
  dark,
  count,
  onReview,
}: {
  dark: boolean;
  count: number;
  onReview: () => void;
}) {
  const { t } = useTranslation("predictor");
  return (
    <div
      className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 ${
        dark ? "border-amber-400/30 bg-amber-500/10" : "border-amber-300 bg-amber-50"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-black ${
            dark ? "bg-amber-400/20 text-amber-200" : "bg-amber-200/70 text-amber-800"
          }`}
        >
          {count}
        </span>
        <div className="min-w-0">
          <p className={`text-sm font-bold ${dark ? "text-amber-100" : "text-amber-900"}`}>
            {t("owner.pendingCallout.title")}
          </p>
          <p className={`mt-0.5 text-xs ${dark ? "text-amber-200/80" : "text-amber-800/90"}`}>
            {t("owner.pendingCallout.desc", { count })}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReview}
        className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
          dark
            ? "bg-amber-400 text-gray-900 hover:bg-amber-300"
            : "bg-amber-500 text-white hover:bg-amber-600"
        }`}
      >
        {t("owner.pendingCallout.cta")}
        <span aria-hidden>→</span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Members tab
// ─────────────────────────────────────────────────────────────────────────────
function MembersTab({
  tournament,
  dark,
  showToast,
  onChanged,
}: {
  tournament: Tournament;
  dark: boolean;
  showToast: (m: string, ok?: boolean) => void;
  onChanged?: () => void;
}) {
  const { t, i18n } = useTranslation("predictor");
  const lang = normalizeLang(i18n.language);
  const [list, setList] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  // For closed tournaments, foreground the approval queue by default.
  const [filter, setFilter] = useState<string>(
    tournament.require_approval ? "pending" : "all",
  );

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ tournament_id: tournament.id });
    if (filter !== "all") q.set("status", filter);
    const res = await fetch(`/api/predictor/owner/members?${q.toString()}`);
    if (res.ok) setList(await res.json());
    setLoading(false);
  }, [tournament.id, filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(id: string, status: string) {
    const res = await fetch("/api/predictor/owner/members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      load();
      onChanged?.();
      showToast(t("owner.toast.memberUpdated"));
    } else showToast(t("owner.toast.genericError"), false);
  }

  async function remove(id: string) {
    if (!confirm(t("owner.membersTab.removeConfirm"))) return;
    const res = await fetch(`/api/predictor/owner/members?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      load();
      onChanged?.();
      showToast(t("owner.toast.memberRemoved"));
    } else showToast(t("owner.toast.genericError"), false);
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={`text-base font-bold ${cls.accentText(dark)}`}>
            {t("owner.membersTab.title")}
          </h2>
          <p className="mt-0.5 text-xs text-theme-text-secondary">
            {tournament.require_approval
              ? t("owner.membersTab.approvalsOn")
              : t("owner.membersTab.approvalsOff")}
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={cls.input(dark) + " max-w-[200px]"}
        >
          {MEMBER_FILTERS.map((f) => (
            <option key={f} value={f}>
              {f === "all"
                ? t("owner.membersTab.filterAll")
                : t(`owner.membersTab.filters.${f}`)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-theme-text-secondary">
          {t("owner.common.loading")}
        </p>
      ) : list.length === 0 ? (
        <div
          className={`rounded-xl border border-dashed p-8 text-center text-sm text-theme-text-secondary ${
            dark ? "border-white/15 bg-white/[0.02]" : "border-gray-300 bg-gray-50"
          }`}
        >
          {t("owner.membersTab.empty")}
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((m) => {
            const initial = (m.user_display_name || m.user_email || "?")
              .charAt(0)
              .toUpperCase();
            const circle =
              "inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition-colors active:scale-95";
            return (
              <div
                key={m.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 ${cls.cardSubtle(dark)}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  {/* Circular avatar — keeps the whole row in one round language */}
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-black ${
                      dark
                        ? "bg-predictor-primary/15 text-predictor-accent-dark ring-1 ring-predictor-primary/25"
                        : "bg-predictor-primary/20 text-predictor-accent-light ring-1 ring-predictor-primary/40"
                    }`}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm text-theme-heading-primary">
                      <span className="truncate font-medium">
                        {m.user_display_name || t("owner.membersTab.noName")}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-theme-text-secondary">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone(
                          m.status === "approved" ? "published" : m.status,
                          dark,
                        )}`}
                      >
                        {String(t(`owner.membersTab.statuses.${m.status}`, m.status))}
                      </span>
                      <span className="truncate">{m.user_email}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  {m.status !== "approved" && (
                    <button
                      type="button"
                      title={t("owner.membersTab.approve")}
                      aria-label={t("owner.membersTab.approve")}
                      onClick={() => changeStatus(m.id, "approved")}
                      className={`${circle} border-emerald-500 bg-emerald-500 text-white shadow-sm hover:bg-emerald-600`}
                    >
                      <Check className="h-4 w-4" strokeWidth={2.6} />
                    </button>
                  )}
                  {m.status !== "rejected" && (
                    <button
                      type="button"
                      title={t("owner.membersTab.reject")}
                      aria-label={t("owner.membersTab.reject")}
                      onClick={() => changeStatus(m.id, "rejected")}
                      className={`${circle} ${
                        dark
                          ? "border-white/15 text-gray-300 hover:border-white/35 hover:text-white"
                          : "border-gray-300 text-gray-600 hover:border-gray-500 hover:text-gray-900"
                      }`}
                    >
                      <X className="h-4 w-4" strokeWidth={2.6} />
                    </button>
                  )}
                  {m.status !== "banned" && (
                    <button
                      type="button"
                      title={t("owner.membersTab.ban")}
                      aria-label={t("owner.membersTab.ban")}
                      onClick={() => changeStatus(m.id, "banned")}
                      className={`${circle} ${
                        dark
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
                          : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      }`}
                    >
                      <Ban className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                  )}
                  <button
                    type="button"
                    title={t("owner.membersTab.remove")}
                    aria-label={t("owner.membersTab.remove")}
                    onClick={() => remove(m.id)}
                    className={`${circle} ${
                      dark
                        ? "border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                        : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Players tab — everyone who actually participates (made predictions) or holds
// a member row. Lets the owner fully purge a player — membership + ALL their
// predictions — e.g. when the tournament was left open and an unwanted user
// already predicted. Irreversible.
// ─────────────────────────────────────────────────────────────────────────────
type Participant = {
  user_id: string;
  user_display_name: string | null;
  user_email: string | null;
  category_count: number;
  category_points: number;
  match_count: number;
  match_points: number;
  total_points: number;
  member_status: string | null;
};

function PlayersTab({
  tournament,
  dark,
  showToast,
}: {
  tournament: Tournament;
  dark: boolean;
  showToast: (m: string, ok?: boolean) => void;
}) {
  const { t } = useTranslation("predictor");
  const [list, setList] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/predictor/owner/participants?tournament_id=${tournament.id}`,
      );
      if (res.ok) setList(await res.json());
    } finally {
      setLoading(false);
    }
  }, [tournament.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function purge(p: Participant) {
    const name =
      p.user_display_name || p.user_email || t("owner.playersTab.noName");
    if (!confirm(t("owner.playersTab.deleteConfirm", { name }))) return;
    setBusyId(p.user_id);
    try {
      const res = await fetch(
        `/api/predictor/owner/participants?tournament_id=${tournament.id}&user_id=${encodeURIComponent(
          p.user_id,
        )}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      setList((prev) => prev.filter((x) => x.user_id !== p.user_id));
      showToast(t("owner.playersTab.deleted", { name }));
    } catch {
      showToast(t("owner.toast.genericError"), false);
    } finally {
      setBusyId(null);
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? list.filter(
        (p) =>
          (p.user_display_name || "").toLowerCase().includes(q) ||
          (p.user_email || "").toLowerCase().includes(q),
      )
    : list;

  const badge = (text: string, accent = false) => (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        accent
          ? cls.badgeAccent(dark)
          : dark
            ? "bg-white/5 text-gray-300"
            : "bg-gray-100 text-gray-600"
      }`}
    >
      {text}
    </span>
  );

  return (
    <>
      <div className="mb-5">
        <h2 className={`text-base font-bold ${cls.accentText(dark)}`}>
          {t("owner.playersTab.title")}
        </h2>
        <p className="mt-0.5 text-xs text-theme-text-secondary">
          {t("owner.playersTab.subtitle")}
        </p>
      </div>

      {list.length > 0 && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("owner.playersTab.searchPlaceholder")}
          className={cls.input(dark) + " mb-4"}
        />
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-theme-text-secondary">
          {t("owner.common.loading")}
        </p>
      ) : filtered.length === 0 ? (
        <div
          className={`rounded-xl border border-dashed p-8 text-center text-sm text-theme-text-secondary ${
            dark ? "border-white/15 bg-white/[0.02]" : "border-gray-300 bg-gray-50"
          }`}
        >
          {t("owner.playersTab.empty")}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const name = p.user_display_name || t("owner.playersTab.noName");
            const initial = (p.user_display_name || p.user_email || "?")
              .charAt(0)
              .toUpperCase();
            return (
              <div
                key={p.user_id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 ${cls.cardSubtle(dark)}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-black ${
                      dark
                        ? "bg-predictor-primary/15 text-predictor-accent-dark ring-1 ring-predictor-primary/25"
                        : "bg-predictor-primary/20 text-predictor-accent-light ring-1 ring-predictor-primary/40"
                    }`}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm text-theme-heading-primary">
                      <span className="truncate font-medium">{name}</span>
                      {p.member_status && (
                        <span
                          className={`inline-flex flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone(
                            p.member_status === "approved" ? "published" : p.member_status,
                            dark,
                          )}`}
                        >
                          {String(
                            t(`owner.membersTab.statuses.${p.member_status}`, p.member_status),
                          )}
                        </span>
                      )}
                    </div>
                    {p.user_email && (
                      <div className="mt-0.5 truncate text-[11px] text-theme-text-secondary">
                        {p.user_email}
                      </div>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {badge(t("owner.playersTab.tournamentPreds", { count: p.category_count }))}
                      {badge(t("owner.playersTab.matchPreds", { count: p.match_count }))}
                      {badge(t("owner.playersTab.points", { count: p.total_points }), true)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busyId === p.user_id}
                  onClick={() => purge(p)}
                  title={t("owner.playersTab.delete")}
                  className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-colors active:scale-95 disabled:opacity-50 ${
                    dark
                      ? "border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                      : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                  }`}
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                  {t("owner.playersTab.delete")}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring tab — leaderboard + manual override + auto rescore
// ─────────────────────────────────────────────────────────────────────────────
function ScoringTab({
  tournament,
  dark,
  showToast,
}: {
  tournament: Tournament;
  dark: boolean;
  showToast: (m: string, ok?: boolean) => void;
}) {
  const { t } = useTranslation("predictor");
  const [view, setView] = useState<"leaderboard" | "manual">("leaderboard");
  const [standings, setStandings] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescoring, setRescoring] = useState(false);
  const [search, setSearch] = useState("");

  const loadStandings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/predictor/tournaments/${tournament.slug}/standings`);
      if (res.ok) {
        const d = await res.json();
        setStandings(Array.isArray(d) ? d : d.standings || []);
      }
    } finally {
      setLoading(false);
    }
  }, [tournament.slug]);

  const loadCategories = useCallback(async () => {
    const res = await fetch(`/api/predictor/owner/categories?tournament_id=${tournament.id}`);
    if (res.ok) {
      const data = await res.json();
      setCategories(data);
      if (data[0]?.id && !selectedCatId) setSelectedCatId(data[0].id);
    }
  }, [tournament.id, selectedCatId]);

  const loadPredictions = useCallback(async () => {
    if (!selectedCatId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/predictor/owner/scoring?tournament_id=${tournament.id}&category_id=${selectedCatId}`,
      );
      if (res.ok) setPredictions(await res.json());
    } finally {
      setLoading(false);
    }
  }, [tournament.id, selectedCatId]);

  useEffect(() => {
    if (view === "leaderboard") loadStandings();
    else loadCategories();
  }, [view, loadStandings, loadCategories]);

  useEffect(() => {
    if (view === "manual" && selectedCatId) loadPredictions();
  }, [view, selectedCatId, loadPredictions]);

  async function rescore() {
    if (!confirm(t("owner.scoringTab.rescoreConfirm"))) return;
    setRescoring(true);
    try {
      const res = await fetch("/api/predictor/owner/scoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournament_id: tournament.id, action: "rescore" }),
      });
      const d = await res.json();
      if (res.ok) {
        showToast(t("owner.scoringTab.rescoredCount", { count: d.updated || 0 }));
        if (view === "leaderboard") loadStandings();
        else loadPredictions();
      } else {
        showToast(d.error || t("owner.toast.genericError"), false);
      }
    } finally {
      setRescoring(false);
    }
  }

  async function setPoints(predictionId: string, points: number) {
    const res = await fetch("/api/predictor/owner/scoring", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prediction_id: predictionId, points_awarded: points }),
    });
    if (res.ok) {
      showToast(t("owner.toast.scoringUpdated"));
      loadPredictions();
    } else {
      showToast(t("owner.toast.genericError"), false);
    }
  }

  async function toggleLock(predictionId: string, locked: boolean) {
    const res = await fetch("/api/predictor/owner/scoring", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prediction_id: predictionId, locked }),
    });
    if (res.ok) loadPredictions();
  }

  const filtered = useMemo<Prediction[]>(() => {
    if (!search.trim()) return predictions;
    const s = search.toLowerCase();
    return predictions.filter(
      (p: Prediction) =>
        (p.user_email || "").toLowerCase().includes(s) ||
        (p.user_display_name || "").toLowerCase().includes(s),
    );
  }, [predictions, search]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div
          className={`inline-flex rounded-full border p-1 ${
            dark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white"
          }`}
        >
          {(["leaderboard", "manual"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                view === v
                  ? dark
                    ? "bg-predictor-primary/20 text-predictor-accent-dark"
                    : "bg-predictor-primary/30 text-gray-900"
                  : dark
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t(`owner.scoringTab.${v}View`)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={rescore}
          disabled={rescoring}
          className={cls.secondaryBtn(dark)}
        >
          ↻ {rescoring ? t("owner.scoringTab.rescoring") : t("owner.scoringTab.rescore")}
        </button>
      </div>

      {view === "leaderboard" ? (
        loading ? (
          <p className="py-10 text-center text-sm text-theme-text-secondary">
            {t("owner.common.loading")}
          </p>
        ) : standings.length === 0 ? (
          <div
            className={`rounded-xl border border-dashed p-8 text-center text-sm text-theme-text-secondary ${
              dark ? "border-white/15 bg-white/[0.02]" : "border-gray-300 bg-gray-50"
            }`}
          >
            {t("owner.scoringTab.leaderboardEmpty")}
          </div>
        ) : (
          <div className="space-y-1.5">
            {standings.map((s: any, i: number) => {
              const rank = i + 1;
              const isTop3 = rank <= 3;
              const medalColors = [
                "from-amber-400 to-amber-500",
                "from-gray-300 to-gray-400",
                "from-amber-600 to-amber-700",
              ];
              return (
                <div
                  key={s.user_id || i}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                    dark
                      ? "border-white/8 bg-white/[0.02] hover:bg-white/[0.05]"
                      : "border-gray-200/80 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                      isTop3
                        ? `bg-gradient-to-br ${medalColors[rank - 1]} text-white shadow-sm`
                        : dark
                          ? "bg-white/5 text-gray-500"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-theme-heading-primary">
                      {s.user_display_name || s.display_name || "-"}
                    </p>
                    <p className="truncate text-[11px] text-theme-text-secondary">
                      {s.user_email}
                    </p>
                  </div>
                  <div
                    className={`flex-shrink-0 rounded-lg px-2.5 py-1 text-right font-mono text-sm font-black ${
                      dark
                        ? "bg-predictor-primary/10 text-predictor-accent-dark"
                        : "bg-predictor-primary/15 text-predictor-accent-light"
                    }`}
                  >
                    {s.total_points ?? s.points ?? 0}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label={t("owner.scoringTab.categoryLabel")}>
              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                className={cls.input(dark)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("owner.scoringTab.searchLabel")}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("owner.scoringTab.searchPlaceholder")}
                className={cls.input(dark)}
              />
            </Field>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-theme-text-secondary">
              {t("owner.common.loading")}
            </p>
          ) : filtered.length === 0 ? (
            <div
              className={`rounded-xl border border-dashed p-8 text-center text-sm text-theme-text-secondary ${
                dark ? "border-white/15 bg-white/[0.02]" : "border-gray-300 bg-gray-50"
              }`}
            >
              {t("owner.scoringTab.manualEmpty")}
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((p: any) => {
                const predValue =
                  p.text_value ||
                  (p.numeric_value != null ? String(p.numeric_value) : null) ||
                  (p.score_home != null ? `${p.score_home}:${p.score_away}` : null) ||
                  (Array.isArray(p.selected_option_ids) && p.selected_option_ids.length > 0
                    ? t("owner.scoringTab.selectionsCount", { count: p.selected_option_ids.length })
                    : "-");
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border px-3 py-2.5 ${
                      dark
                        ? "border-white/8 bg-white/[0.02]"
                        : "border-gray-200/80 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-theme-heading-primary">
                          {p.user_display_name || "-"}
                        </p>
                        <p className="truncate text-[11px] text-theme-text-secondary">
                          {p.user_email}
                        </p>
                      </div>
                      <label className="flex flex-shrink-0 items-center gap-1.5">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 accent-predictor-primary"
                          checked={!!p.locked}
                          onChange={(e) => toggleLock(p.id, e.target.checked)}
                        />
                        <span className={`text-[10px] ${dark ? "text-gray-500" : "text-gray-400"}`}>
                          {t("owner.scoringTab.lockedHeader", "Locked")}
                        </span>
                      </label>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <p className={`text-xs ${dark ? "text-gray-400" : "text-gray-500"}`}>
                        {predValue}
                      </p>
                      <input
                        type="number"
                        defaultValue={p.points_awarded ?? 0}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (v !== (p.points_awarded ?? 0)) setPoints(p.id, v);
                        }}
                        className={`w-16 rounded-lg border px-2 py-1 text-right font-mono text-sm font-bold outline-none ${
                          dark
                            ? "border-white/10 bg-black/30 text-predictor-accent-dark focus:border-predictor-primary/60"
                            : "border-gray-300 bg-white text-predictor-accent-light focus:border-predictor-primary"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-3 text-[11px] text-theme-text-secondary">
            ✦ {t("owner.scoringTab.footerHint")}
          </p>
        </>
      )}
    </>
  );
}
