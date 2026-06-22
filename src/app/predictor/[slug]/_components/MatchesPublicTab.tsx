"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Flame,
  Lock,
  LogIn,
  MapPin,
  Save,
  Swords,
  Unlock,
  X,
} from "lucide-react";
import ConfettiBurst from "@/components/shared/ConfettiBurst";
import QuickScoreChips from "@/components/shared/QuickScoreChips";
import StreakBadge from "@/components/shared/StreakBadge";
import { useToast } from "@/contexts/ToastContext";
import { localizeTeamName } from "@/utils/country-names";
import type { Match, MatchPrediction } from "@/types/predictor";
import type { AccentClasses } from "@/utils/predictor-accent";
import {
  MATCHDAY_LABELS,
  localizedMatchAwayTeam,
  localizedMatchHomeTeam,
  localizedMatchStageLabel,
  localizedMatchVenue,
  matchdayLabel,
} from "@/utils/predictor-i18n";

const STAGE_LABELS_PUB: Record<string, string> = {
  group: "Grupna faza",
  group_a: "Grupa A",
  group_b: "Grupa B",
  group_c: "Grupa C",
  group_d: "Grupa D",
  group_e: "Grupa E",
  group_f: "Grupa F",
  group_g: "Grupa G",
  group_h: "Grupa H",
  group_i: "Grupa I",
  group_j: "Grupa J",
  group_k: "Grupa K",
  group_l: "Grupa L",
  round_of_32: "Šesnaestina finala",
  round_of_16: "Osmina finala",
  quarter_final: "Četvrtfinale",
  semi_final: "Polufinale",
  third_place: "Utakmica za 3. mjesto",
  final: "FINALE",
  other: "Ostalo",
};

const STAGE_ORDER_PUB = [
  "group_a","group_b","group_c","group_d","group_e","group_f",
  "group_g","group_h","group_i","group_j","group_k","group_l",
  "group","round_of_32","round_of_16","quarter_final","semi_final",
  "third_place","final","other",
];

export function isMatchLockedClient(
  m: Pick<Match, "kickoff_at" | "status" | "force_unlocked" | "matchday">,
  opts?: {
    lockMode?: "per_match" | "per_round";
    allMatches?: Pick<Match, "kickoff_at" | "matchday">[];
  },
): boolean {
  if (m.force_unlocked) return false;
  if (m.status !== "scheduled") return true;
  if (!m.kickoff_at) return false;
  const now = Date.now();
  if (opts?.lockMode === "per_round" && m.matchday != null && opts.allMatches) {
    const roundMatches = opts.allMatches.filter(
      (rm) => rm.matchday === m.matchday && rm.kickoff_at,
    );
    if (roundMatches.length > 0) {
      const earliest = Math.min(
        ...roundMatches.map((rm) => Date.parse(rm.kickoff_at!)),
      );
      return now >= earliest;
    }
  }
  return now >= Date.parse(m.kickoff_at);
}

export default function MatchesPublicTab({
  matches,
  myMatchPredictions,
  slug,
  authStatus,
  theme,
  ac,
  onSaved,
  isWC: _isWC = false,
  themeBgSrc: _themeBgSrc = null,
  lockMode = "per_match",
  matchesLocked = false,
}: {
  matches: Match[];
  myMatchPredictions: MatchPrediction[];
  slug: string;
  authStatus: string;
  theme: string;
  ac: AccentClasses;
  onSaved: () => void;
  isWC?: boolean;
  themeBgSrc?: string | null;
  lockMode?: "per_match" | "per_round";
  /** Owner master lock for all matches — overrides per-match kickoff rules. */
  matchesLocked?: boolean;
}) {
  const { showToast: notify } = useToast();
  const accentBg = ac.bg;
  const { t, i18n } = useTranslation("predictor");
  const lang = (i18n.language?.startsWith("en") ? "en" : "bs") as
    | "en"
    | "bs";
  type Draft = { home: number | null; away: number | null };
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const seeded: Record<string, Draft> = {};
    for (const p of myMatchPredictions) {
      seeded[p.match_id] = { home: p.home_score, away: p.away_score };
    }
    setDrafts(seeded);
  }, [myMatchPredictions]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const byStage = useMemo(() => {
    const hasMatchdays = lockMode === "per_round" && matches.some((m) => m.matchday != null);
    if (hasMatchdays) {
      const m = new Map<string, Match[]>();
      for (const match of matches) {
        const key = String(match.matchday ?? 0);
        const arr = m.get(key) ?? [];
        arr.push(match);
        m.set(key, arr);
      }
      return Array.from(m.entries()).sort(
        (a, b) => Number(a[0]) - Number(b[0]),
      );
    }
    const m = new Map<string, Match[]>();
    for (const match of matches) {
      const arr = m.get(match.stage) ?? [];
      arr.push(match);
      m.set(match.stage, arr);
    }
    return Array.from(m.entries()).sort(
      (a, b) => STAGE_ORDER_PUB.indexOf(a[0]) - STAGE_ORDER_PUB.indexOf(b[0]),
    );
  }, [matches, lockMode]);

  // Utakmica sa upisanim rezultatom se više ne može tipovati, bez obzira na
  // status/kickoff (npr. službeni rezultat uz pogrešan datum).
  const hasResult = (m: Match) => m.home_score != null && m.away_score != null;

  // A match accepts (late) predictions when the owner has force-unlocked it —
  // even if it already has a result, has kicked off, or is finished. That one
  // switch is the owner's "let this person enter their pick" override and beats
  // both the master lock and the per-match kickoff/result lock. Otherwise a
  // match is editable only while it isn't locked and has no result yet.
  // Declared here — above roundIsPast and the activeSectionKey/orderedSections
  // useMemos that call it during render — to avoid a temporal-dead-zone
  // ReferenceError ("Cannot access 'isEditable' before initialization").
  const isEditable = (m: Match) =>
    !!m.force_unlocked ||
    (!matchesLocked && !isMatchLockedClient(m) && !hasResult(m));

  // --- Round accordion (collapsible kola) --------------------------------
  // A round is "past" once no match in it still accepts predictions. A
  // force-unlocked match keeps its round open (isEditable === true) even with a
  // final result, so a late pick stays reachable instead of being folded away.
  // The first round that still has a predictable match is the "active" round and
  // opens by default; past rounds stay collapsed, so the user can fold away a
  // finished round (1. kolo) and predict the next (2. kolo).
  const roundIsPast = (list: Match[]) => list.every((m) => !isEditable(m));

  const activeSectionKey = useMemo(() => {
    for (const [key, list] of byStage) {
      if (!roundIsPast(list)) return key;
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byStage, tick, matchesLocked]);

  // Display order: aktuelno kolo na vrh, predstojeća kola ispod, a završena
  // (past) kola na dno. Ako NEMA aktivnog kola (sve zaključano ili gotovo),
  // prikazujemo prirodan redoslijed po matchdayu — Finale ostaje na dnu.
  const orderedSections = useMemo(() => {
    if (activeSectionKey == null) return byStage;
    const active: [string, Match[]][] = [];
    const upcoming: [string, Match[]][] = [];
    const past: [string, Match[]][] = [];
    for (const entry of byStage) {
      if (entry[0] === activeSectionKey) active.push(entry);
      else if (roundIsPast(entry[1])) past.push(entry);
      else upcoming.push(entry);
    }
    return [...active, ...upcoming, ...past];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byStage, activeSectionKey, tick, matchesLocked]);

  // `null` until the user manually toggles a section. While null, the open set
  // is DERIVED from the active round, so the correct round is already expanded
  // on first paint (no async-load flash) and auto-advances as rounds settle —
  // without ever yanking shut a round the user is still editing (an editable
  // round is by definition not yet "past", so it stays the active one). Once
  // the user toggles, their explicit set takes over and we stop auto-managing.
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const update = (mid: string, patch: Partial<Draft>) => {
    setDirty(true);
    setDrafts((d) => ({
      ...d,
      [mid]: { ...(d[mid] ?? { home: null, away: null }), ...patch },
    }));
  };

  const completion = useMemo(() => {
    const total = matches.filter((m) => isEditable(m)).length;
    let done = 0;
    for (const m of matches) {
      if (!isEditable(m)) continue;
      const d = drafts[m.id];
      if (d?.home != null && d?.away != null) done += 1;
    }
    return { done, total };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, drafts, tick]);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      if (authStatus !== "authenticated") {
        setError(t("errors.mustSignIn"));
        setSaving(false);
        return;
      }
      const items = matches
        .filter((m) => isEditable(m))
        .map((m) => {
          const d = drafts[m.id];
          if (!d || d.home == null || d.away == null) return null;
          return {
            match_id: m.id,
            home_score: d.home,
            away_score: d.away,
          };
        })
        .filter(Boolean) as { match_id: string; home_score: number; away_score: number }[];

      if (items.length === 0) {
        setError(t("errors.nothingToSave"));
        setSaving(false);
        return;
      }
      const res = await fetch(`/api/predictor/tournaments/${slug}/match-predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        let msg = payload?.message || payload?.error;
        if (!msg) {
          if (res.status === 401) msg = t("errors.sessionExpired");
          else if (res.status === 403) msg = t("errors.notAllowed");
          else if (res.status === 404) msg = t("errors.tournamentNotFound");
          else if (res.status === 409)
            msg = t("errors.tournamentNotAcceptingPredictions");
          else msg = t("errors.genericHttp", { status: res.status });
        } else if (payload?.error === "draft") {
          msg = t("errors.draftMessage");
        } else if (payload?.error === "locked") {
          msg = t("errors.lockedMessage");
        }
        throw new Error(msg);
      }
      const saved = payload?.saved ?? items.length;
      const skipped = Array.isArray(payload?.skipped) ? payload.skipped : [];
      if (saved === 0 && skipped.length > 0) {
        const reasons = skipped.map((s: { reason: string }) => s.reason).join(", ");
        throw new Error(t("errors.matchSkipped", { reasons }));
      }
      setSavedAt(new Date());
      setDirty(false);
      setConfettiTrigger((n) => n + 1);
      notify(t("owner.toast.matchPredictionsSaved", "Match predictions saved"));
      onSaved();
    } catch (e) {
      const msg = (e as Error)?.message || t("errors.unknown");
      setError(msg);
      notify(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (matches.length === 0) {
    return (
      <div
        className={`rounded-3xl border border-dashed p-10 text-center text-sm ${
          theme === "dark" ? "border-gray-700 text-gray-400" : "border-gray-300 text-gray-500"
        }`}
      >
        <Swords className="w-10 h-10 mx-auto mb-3 opacity-50" />
        {t("noMatches")}
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {authStatus !== "authenticated" && (
        <div
          className={`relative z-10 rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 ${
            theme === "dark"
              ? `${ac.bg10} ${ac.border500_30} ${ac.textBrighter}`
              : `${ac.bgPale} ${ac.border200} ${ac.textDeeper}`
          }`}
        >
          <LogIn className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 text-sm">
            {t(
              "auth.signInToPredict",
              lang === "en"
                ? "Sign in to predict match results and compete for rewards."
                : "Prijavi se da bi predviđao rezultate utakmica i borio se za nagrade.",
            )}
          </div>
          <button
            onClick={() => signIn()}
            className={`px-4 py-2 rounded-2xl text-sm font-bold ${ac.textOn} ${accentBg} shadow-sm w-full sm:w-auto`}
          >
            {t("signIn")}
          </button>
        </div>
      )}

      {/* progress */}
      {completion.total > 0 && (
        <div
          className={`relative z-10 rounded-3xl p-5 sm:p-6 backdrop-blur-md ${
            theme === "dark"
              ? "bg-gray-900/70 border border-gray-700/60 shadow-lg shadow-black/20"
              : "bg-white/80 border border-gray-200/80 shadow-md"
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className={`text-sm font-semibold tracking-wide ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}
              >
                {t("matchPredictions")}
              </span>
              <StreakBadge
                done={completion.done}
                total={completion.total}
                theme={theme}
              />
            </div>
            <span
              className={`text-sm font-black tabular-nums ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              {completion.done}
              <span className={`mx-1 font-medium ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>/</span>
              {completion.total}
            </span>
          </div>
          <div
            className={`h-2.5 rounded-full overflow-hidden ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"}`}
          >
            <motion.div
              className={`h-full ${accentBg} rounded-full`}
              initial={{ width: 0 }}
              animate={{
                width: `${completion.total > 0 ? (completion.done / completion.total) * 100 : 0}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      <ConfettiBurst trigger={confettiTrigger} />

      {matchesLocked && (
        <div
          role="status"
          className={`relative z-10 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${
            theme === "dark"
              ? "bg-amber-500/10 border border-amber-400/30 text-amber-200"
              : "bg-amber-50 border border-amber-300/70 text-amber-800"
          }`}
        >
          <Lock className="h-4 w-4 flex-shrink-0" />
          <span>
            {t(
              "matchesLockedNotice",
              "Utakmice su zaključane od strane organizatora.",
            )}
          </span>
        </div>
      )}

      {orderedSections.map(([stage, list]) => {
        const open = openSections.has(stage);
        const past = roundIsPast(list);
        const label = MATCHDAY_LABELS[Number(stage)]
          ? matchdayLabel(Number(stage), lang)
          : t(`stage.${stage}`, STAGE_LABELS_PUB[stage] ?? stage);
        return (
          <div
            key={stage}
            className={`relative z-10 rounded-2xl backdrop-blur-md overflow-hidden ${
              theme === "dark"
                ? "bg-gray-900/60 border border-gray-700/50"
                : "bg-white/75 border border-gray-200/70 shadow-sm"
            }`}
          >
            <button
              type="button"
              onClick={() => toggleSection(stage)}
              aria-expanded={open}
              aria-controls={`round-panel-${stage}`}
              className={`w-full flex items-center gap-2 p-3 sm:p-5 text-left transition-colors ${
                theme === "dark" ? "hover:bg-gray-800/40" : "hover:bg-gray-50"
              }`}
            >
              <div
                className={`w-1 h-5 rounded-full ${
                  past
                    ? theme === "dark"
                      ? "bg-gray-600"
                      : "bg-gray-300"
                    : accentBg
                }`}
              />
              <h3
                className={`text-sm font-black uppercase tracking-wider ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                {label}
              </h3>
              <span
                className={`text-[11px] font-medium ${
                  theme === "dark" ? "text-gray-500" : "text-gray-500"
                }`}
              >
                {t("matchesCount", { count: list.length })}
              </span>
              {past && (
                <CheckCircle2
                  className={`w-3.5 h-3.5 flex-shrink-0 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
                />
              )}
              <ChevronDown
                aria-hidden
                className={`ml-auto w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                  open ? "rotate-180" : ""
                } ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="panel"
                  id={`round-panel-${stage}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div
                    className={`space-y-2.5 px-3 sm:px-5 pb-3 sm:pb-5 pt-3 border-t ${
                      theme === "dark" ? "border-gray-700/60" : "border-gray-200/80"
                    }`}
                  >
                    {list.map((m) => {
                      const d = drafts[m.id] ?? { home: null, away: null };
                      const editable = isEditable(m);
                      const locked = !editable;
                      // Rezultat upisan = utakmica završena, čak i ako admin nije
                      // promijenio status (često ostane "scheduled"/"live"). Ali
                      // ako je vlasnik ručno otključao utakmicu (force_unlocked),
                      // prikazujemo polja za unos a NE konačan rezultat, da
                      // zakašnjeli učesnik može upisati svoju predikciju.
                      const isFinished =
                        !editable &&
                        (m.status === "finished" ||
                          (m.home_score != null && m.away_score != null));
                      const userPred = myMatchPredictions.find(
                        (p) => p.match_id === m.id,
                      );
                      return (
                        <MatchCard
                          key={m.id}
                          match={m}
                          draft={d}
                          onChange={(patch) => update(m.id, patch)}
                          locked={locked}
                          disabled={locked || authStatus !== "authenticated"}
                          isFinished={isFinished}
                          userPred={userPred}
                          theme={theme}
                          ac={ac}
                          lang={lang}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {error && (
        <div
          role="alert"
          className={`relative z-10 rounded-xl border-l-4 border-l-red-500 p-4 flex items-start gap-3 shadow-lg ${
            theme === "dark"
              ? "bg-red-950/40 border-y border-r border-red-900/50 text-red-200"
              : "bg-red-50 border-y border-r border-red-200 text-red-900"
          }`}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold mb-0.5">{t("errors.title")}</p>
            <p className="text-sm leading-relaxed break-words">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label={t("errors.close")}
            className={`flex-shrink-0 p-1.5 rounded-xl transition-colors ${
              theme === "dark"
                ? "hover:bg-red-900/50 text-red-300"
                : "hover:bg-red-100 text-red-700"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Spacer so content doesn't slide under the floating save bar */}
      {completion.total > 0 && <div aria-hidden className="h-44 md:h-28" />}

      {completion.total > 0 && (
        <div
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)",
          }}
          className={`fixed md:!bottom-4 left-3 right-3 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[calc(100%-2rem)] md:max-w-5xl z-40 rounded-3xl p-3 md:p-4 backdrop-blur-xl shadow-2xl ${
            theme === "dark"
              ? "bg-gray-900/95 border border-gray-700"
              : "bg-white/95 border border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
            <span className="text-xs text-theme-text-secondary">
              {completion.done} / {completion.total} {t("filled")}
            </span>
            {savedAt && (
              <span className="text-xs text-theme-text-secondary flex items-center gap-1 opacity-70">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {savedAt.toLocaleTimeString(lang === "bs" ? "sr-Latn" : "en-GB", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <button
            disabled={saving || authStatus !== "authenticated" || completion.done === 0}
            onClick={submit}
            className={`w-full px-5 py-4 sm:py-3.5 rounded-2xl font-black text-base sm:text-lg ${ac.textOn} ${accentBg} disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 active:scale-[0.99] transition-transform shadow-lg ${ac.shadow500_30} ${dirty && completion.done > 0 && !saving ? "save-pulse" : ""}`}
          >
            <Save className="w-4 h-4 sm:w-5 sm:h-5" />
            {saving
              ? t("saving")
              : completion.done === 0
                ? lang === "en"
                  ? "Enter scores first"
                  : "Unesi prvo rezultate"
                : lang === "en"
                  ? `Save ${completion.done} prediction${completion.done === 1 ? "" : "s"}`
                  : `Sačuvaj ${completion.done} predikcij${completion.done === 1 ? "u" : completion.done < 5 ? "e" : "a"}`}
          </button>
          <style jsx>{`
            .save-pulse {
              animation: save-pulse 1.4s ease-in-out infinite;
            }
            @keyframes save-pulse {
              0%,
              100% {
                box-shadow:
                  0 10px 25px -5px rgb(${ac.rgb} / 0.3),
                  0 0 0 0 rgb(${ac.rgb} / 0.6);
              }
              50% {
                box-shadow:
                  0 12px 30px -5px rgb(${ac.rgb} / 0.45),
                  0 0 0 10px rgb(${ac.rgb} / 0);
              }
            }
            @media (prefers-reduced-motion: reduce) {
              .save-pulse {
                animation: none;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

function ScoreRow({
  team,
  logo,
  finalScore,
  draft,
  disabled,
  onChange,
  dark,
  ac,
}: {
  team: string;
  logo: string | null | undefined;
  finalScore: number | null;
  draft: number | null;
  disabled: boolean;
  onChange: (v: number | null) => void;
  dark: boolean;
  ac: AccentClasses;
}) {
  const { t } = useTranslation("predictor");
  const showFinal = finalScore != null;
  const value = draft ?? 0;
  const inc = () => onChange(Math.min(99, (draft ?? 0) + 1));
  const dec = () => onChange(Math.max(0, (draft ?? 0) - 1));

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldRef = useRef(false);
  const startHold = () => {
    if (disabled || showFinal) return;
    heldRef.current = false;
    holdTimer.current = setTimeout(() => {
      heldRef.current = true;
      onChange(0);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate?.(18);
        } catch {
          /* ignore */
        }
      }
    }, 420);
  };
  const endHold = (skipTap?: boolean) => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (skipTap || disabled || showFinal) return;
    if (!heldRef.current) inc();
  };
  const cancelHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const isWinner = value > 0 && !showFinal;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onPointerDown={startHold}
        onPointerUp={() => endHold()}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onContextMenu={(e) => e.preventDefault()}
        disabled={disabled || showFinal}
        aria-label={`${team}. ${t("tapTeamHint")}`}
        className={`flex-1 min-w-0 flex items-center gap-2 rounded-xl px-1.5 py-1 transition-all active:scale-[0.99] ${
          disabled || showFinal
            ? "cursor-default"
            : dark
              ? `cursor-pointer hover:bg-gray-700/40 active:${ac.bg15}`
              : `cursor-pointer hover:bg-gray-100 active:${ac.bgPale}`
        } ${isWinner ? (dark ? `ring-1 ${ac.ring500_40}` : `ring-1 ${ac.ring400_70}`) : ""}`}
      >
        {logo && (
          <div
            className={`flex-shrink-0 rounded-md overflow-hidden ring-1 ${dark ? "ring-gray-700" : "ring-gray-200"}`}
          >
            <Image
              src={logo}
              alt={team}
              width={36}
              height={28}
              className="w-9 h-7 object-cover"
              unoptimized
            />
          </div>
        )}
        <div
          className={`font-bold text-[13px] leading-[1.15] flex-1 min-w-0 text-left ${dark ? "text-white" : "text-gray-900"}`}
        >
          {team}
        </div>
      </button>
      {showFinal ? (
        <div
          className={`flex-shrink-0 text-2xl font-black tabular-nums px-3 ${dark ? "text-white" : "text-gray-900"}`}
        >
          {finalScore}
        </div>
      ) : (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={dec}
            disabled={disabled || value === 0}
            aria-label={t("incDec.dec")}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black select-none transition-all active:scale-95 ${
              disabled || value === 0
                ? dark
                  ? "bg-gray-900/40 text-gray-600 cursor-not-allowed"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
                : dark
                  ? `bg-gray-800 ${ac.textBrighter} hover:bg-gray-700 active:bg-gray-700 border border-gray-700`
                  : `bg-white ${ac.textDeep} hover:${ac.bgPale} active:${ac.bgPale} border border-gray-300`
            }`}
          >
            −
          </button>
          <input
            type="number"
            min={0}
            max={99}
            disabled={disabled}
            value={draft ?? ""}
            onChange={(e) =>
              onChange(e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder="0"
            inputMode="numeric"
            className={`w-11 h-9 text-center text-xl font-black tabular-nums leading-none rounded-xl border outline-none transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
              disabled
                ? dark
                  ? "bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed placeholder-gray-700"
                  : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed placeholder-gray-300"
                : draft != null
                  ? dark
                    ? `${ac.bg15} ${ac.border500} ${ac.textBrighter}`
                    : `${ac.bgPale} ${ac.border500} ${ac.textDeeper}`
                  : dark
                    ? `bg-gray-900 border-gray-700 text-white placeholder-gray-600 transition-colors ${ac.hoverBorder500_60} ${ac.focusBorder500}`
                    : `bg-white border-gray-300 text-gray-900 placeholder-gray-300 transition-colors ${ac.hoverBorder500_60} ${ac.focusBorder500}`
            }`}
          />
          <button
            type="button"
            onClick={inc}
            disabled={disabled || value >= 99}
            aria-label={t("incDec.inc")}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black select-none transition-all active:scale-95 ${
              disabled
                ? dark
                  ? "bg-gray-900/40 text-gray-600 cursor-not-allowed"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
                : `${ac.bg} ${ac.textOn} active:bg-opacity-90 border ${ac.border500} shadow-sm ${ac.shadow500_30}`
            }`}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

function MatchCard({
  match,
  draft,
  onChange,
  locked,
  disabled,
  isFinished,
  userPred,
  theme,
  ac,
  lang,
}: {
  match: Match;
  draft: { home: number | null; away: number | null };
  onChange: (patch: { home?: number | null; away?: number | null }) => void;
  locked: boolean;
  disabled: boolean;
  isFinished: boolean;
  userPred: MatchPrediction | undefined;
  theme: string;
  ac: AccentClasses;
  lang: "en" | "bs";
}) {
  const { t } = useTranslation("predictor");
  const accentText = ac.text;
  const dark = theme === "dark";
  const homeName =
    lang === "en" && match.home_team_en?.trim()
      ? match.home_team_en
      : localizeTeamName(
          localizedMatchHomeTeam(match, lang),
          match.home_team_code,
          lang,
        );
  const awayName =
    lang === "en" && match.away_team_en?.trim()
      ? match.away_team_en
      : localizeTeamName(
          localizedMatchAwayTeam(match, lang),
          match.away_team_code,
          lang,
        );
  const venueName = localizedMatchVenue(match, lang);
  const stageLabel = localizedMatchStageLabel(match, lang);

  const holdTimers = useRef<Record<"home" | "away", ReturnType<typeof setTimeout> | null>>({
    home: null,
    away: null,
  });
  const heldRef = useRef<{ home: boolean; away: boolean }>({
    home: false,
    away: false,
  });
  const startHold = (side: "home" | "away") => {
    if (disabled || isFinished) return;
    heldRef.current[side] = false;
    holdTimers.current[side] = setTimeout(() => {
      heldRef.current[side] = true;
      onChange({ [side]: 0 } as { home?: number | null; away?: number | null });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate?.(18);
        } catch {
          /* ignore */
        }
      }
    }, 420);
  };
  const endHold = (side: "home" | "away") => {
    if (holdTimers.current[side]) {
      clearTimeout(holdTimers.current[side]!);
      holdTimers.current[side] = null;
    }
    if (disabled || isFinished) return;
    if (!heldRef.current[side]) {
      const cur = side === "home" ? draft.home : draft.away;
      const next = Math.min(99, (cur ?? 0) + 1);
      onChange({ [side]: next } as { home?: number | null; away?: number | null });
    }
  };
  const cancelHold = (side: "home" | "away") => {
    if (holdTimers.current[side]) {
      clearTimeout(holdTimers.current[side]!);
      holdTimers.current[side] = null;
    }
  };

  const homeLead =
    !isFinished &&
    draft.home != null &&
    draft.away != null &&
    draft.home > draft.away;
  const awayLead =
    !isFinished &&
    draft.home != null &&
    draft.away != null &&
    draft.away > draft.home;

  let countdown = "";
  // "Uživo" se prikazuje tek kad stvarno dođe vrijeme odigravanja utakmice.
  // Utakmice koje je admin zaključao (status !== scheduled) prije kick-offa
  // se NE prikazuju kao uživo — dobijaju suptilni katanac umjesto crvenog stila.
  const kickoffReached =
    match.kickoff_at != null && Date.now() >= Date.parse(match.kickoff_at);
  // "Uživo" traje najviše 3 sata od početka utakmice.
  const withinLiveWindow =
    match.kickoff_at != null &&
    Date.now() < Date.parse(match.kickoff_at) + 3 * 3_600_000;
  const liveNow = !isFinished && kickoffReached && withinLiveWindow;
  if (match.kickoff_at && match.status === "scheduled" && !isFinished) {
    const ms = Date.parse(match.kickoff_at) - Date.now();
    if (ms > 0) {
      const minutes = Math.floor(ms / 60_000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      if (days > 0) countdown = `${days}d ${hours % 24}h`;
      else if (hours > 0) countdown = `${hours}h ${minutes % 60}m`;
      else if (minutes > 0) countdown = `${minutes}m`;
      else countdown = t("soon", lang === "en" ? "soon" : "uskoro");
    }
  }

  let predOutcome: "correct" | "diff" | "winner" | "wrong" | null = null;
  if (isFinished && userPred && match.home_score != null && match.away_score != null) {
    if (
      userPred.home_score === match.home_score &&
      userPred.away_score === match.away_score
    ) {
      predOutcome = "correct";
    } else if (
      userPred.home_score - userPred.away_score ===
      match.home_score - match.away_score
    ) {
      predOutcome = "diff";
    } else if (
      Math.sign(userPred.home_score - userPred.away_score) ===
      Math.sign(match.home_score - match.away_score)
    ) {
      predOutcome = "winner";
    } else {
      predOutcome = "wrong";
    }
  }

  const outcomeBadge =
    predOutcome === "correct"
      ? { text: t("outcome.exact"), cls: `${ac.bgSolid} ${ac.textOn}` }
      : predOutcome === "diff"
        ? { text: t("outcome.diff"), cls: `${ac.bgPaleStrongPair} ${ac.textPair700_400}` }
        : predOutcome === "winner"
          ? { text: t("outcome.winner"), cls: `${ac.bgGhostInk}` }
          : predOutcome === "wrong"
            ? { text: t("outcome.wrong"), cls: "bg-red-500 text-white" }
            : null;

  // Suptilni "zaključano" izgled: sivi okvir + blagi sivi sloj preko kartice.
  const lockedView = locked && !isFinished && !liveNow && !match.force_unlocked;

  return (
    <div
      className={`relative rounded-2xl p-3 sm:p-4 transition-colors ${
        liveNow
          ? "border-2 border-orange-500 ring-1 ring-orange-500/40 " +
            (dark ? "bg-orange-950/20" : "bg-orange-50/40")
          : isFinished
            ? predOutcome === "correct"
              ? "border-2 border-green-500 ring-1 ring-green-500/40 " +
                (dark ? "bg-green-950/20" : "bg-green-50/40")
              : predOutcome === "diff" || predOutcome === "winner"
                ? "border-2 border-yellow-500 ring-1 ring-yellow-500/40 " +
                  (dark ? "bg-yellow-950/20" : "bg-yellow-50/40")
                : predOutcome === "wrong"
                  ? "border-2 border-red-500 ring-1 ring-red-500/40 " +
                    (dark ? "bg-red-950/20" : "bg-red-50/40")
                  : dark
                    ? "bg-gray-800/40 border border-gray-700"
                    : "bg-gray-50 border border-gray-200"
            : lockedView
              ? dark
                ? "bg-gray-800/40 border border-gray-600/70 ring-1 ring-gray-700/50"
                : "bg-gray-50 border border-gray-300 ring-1 ring-gray-200"
              : dark
                ? "bg-gray-800/60 border border-gray-700 hover:border-gray-600 shadow-md shadow-black/10"
                : "bg-white border border-gray-200 hover:border-gray-300 shadow-sm"
      }`}
    >
      {lockedView && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-10 rounded-2xl ${
            dark ? "bg-gray-950/25" : "bg-gray-500/[0.07]"
          }`}
        />
      )}
      <div className="flex items-center justify-between gap-2 mb-2.5 text-[11px]">
        <div className={`flex items-center gap-1.5 flex-wrap min-w-0 ${dark ? "text-gray-400" : "text-gray-500"}`}>
          {liveNow && (
            <span className="font-black uppercase px-1.5 py-0.5 rounded-md bg-orange-500 text-white animate-pulse inline-flex items-center gap-1 text-[10px] shadow-sm shadow-orange-500/30">
              <Flame className="w-2.5 h-2.5" /> {t("live")}
            </span>
          )}
          {isFinished && (
            <span
              className={`font-black uppercase px-1.5 py-0.5 rounded-md text-white inline-flex items-center gap-1 text-[10px] shadow-sm ${
                predOutcome === "correct"
                  ? "bg-green-500 shadow-green-500/30"
                  : predOutcome === "diff" || predOutcome === "winner"
                    ? "bg-yellow-500 shadow-yellow-500/30"
                    : predOutcome === "wrong"
                      ? "bg-red-500 shadow-red-500/30"
                      : "bg-gray-500 shadow-gray-500/30"
              }`}
            >
              <CheckCircle2 className="w-2.5 h-2.5" />{" "}
              {t("matchStatusBadge.finished", lang === "en" ? "FINISHED" : "ZAVRŠENO")}
            </span>
          )}
          {stageLabel && (
            <span
              className={`uppercase font-bold tracking-wide ${ac.textPair600_400}`}
            >
              {stageLabel}
            </span>
          )}
          {match.kickoff_at && (
            <>
              {stageLabel && <span className="opacity-50">·</span>}
              <span className="inline-flex items-center gap-1 font-semibold">
                <CalendarClock className="w-3 h-3 opacity-70" />
                {new Date(match.kickoff_at).toLocaleString(
                  lang === "bs" ? "sr-Latn" : "en-GB",
                  {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {match.force_unlocked && !isFinished && !liveNow && (
            <span
              className={`text-[10px] uppercase font-bold inline-flex items-center gap-1 ${ac.textPair600_400}`}
              title={t("extendedTitle", lang === "en" ? "Admin extended the deadline" : "Admin je produžio rok za predviđanje")}
            >
              <Unlock className="w-2.5 h-2.5" /> {t("unlockedExtended")}
            </span>
          )}
          {locked && !isFinished && !liveNow && !match.force_unlocked && (
            <span
              className={`text-[10px] font-medium tracking-wide inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md ${
                dark
                  ? "bg-gray-800/70 text-gray-400 ring-1 ring-gray-700/60"
                  : "bg-gray-100 text-gray-500 ring-1 ring-gray-200/80"
              }`}
            >
              <Lock className="w-2.5 h-2.5 opacity-80" /> {t("locked")}
            </span>
          )}
          {countdown && (
            <span
              className={`font-bold tabular-nums inline-flex items-center gap-1 ${ac.textPair600_400}`}
            >
              <Clock className="w-3 h-3" /> {countdown}
            </span>
          )}
        </div>
      </div>
      {venueName && (
        <div
          className={`flex items-center gap-1 text-[11px] mb-2.5 ${dark ? "text-gray-500" : "text-gray-500"}`}
        >
          <MapPin className="w-3 h-3 opacity-60 flex-shrink-0" />
          <span className="truncate">{venueName}</span>
        </div>
      )}

      {/* MOBILE LAYOUT. stack vertically (<sm) */}
      <div className="sm:hidden">
        <ScoreRow
          team={homeName}
          logo={match.home_logo_url}
          finalScore={isFinished ? match.home_score : null}
          draft={draft.home}
          disabled={disabled}
          onChange={(v) => onChange({ home: v })}
          dark={dark}
          ac={ac}
        />
        <div className="my-1.5 flex items-center justify-center">
          <span
            className={`text-[9px] uppercase font-bold tracking-[0.25em] ${dark ? "text-gray-600" : "text-gray-400"}`}
          >
            vs
          </span>
        </div>
        <ScoreRow
          team={awayName}
          logo={match.away_logo_url}
          finalScore={isFinished ? match.away_score : null}
          draft={draft.away}
          disabled={disabled}
          onChange={(v) => onChange({ away: v })}
          dark={dark}
          ac={ac}
        />
        {!isFinished && (
          <QuickScoreChips
            homeName={homeName}
            awayName={awayName}
            selected={draft}
            disabled={disabled}
            onPick={(h, a) => onChange({ home: h, away: a })}
            theme={theme}
            ac={ac}
          />
        )}
        {isFinished && userPred && (
          <div className="mt-2 text-[11px] text-theme-text-secondary text-center">
            {t("yourPrediction")}: {userPred.home_score} − {userPred.away_score}
          </div>
        )}
      </div>

      {/* TABLET+ LAYOUT. side by side (sm+) */}
      <div className="hidden sm:grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <button
          type="button"
          onPointerDown={() => startHold("home")}
          onPointerUp={() => endHold("home")}
          onPointerLeave={() => cancelHold("home")}
          onPointerCancel={() => cancelHold("home")}
          onContextMenu={(e) => e.preventDefault()}
          disabled={disabled || isFinished}
          aria-label={`${homeName}. ${t("tapTeamHint")}`}
          className={`flex items-center gap-3 justify-end min-w-0 rounded-2xl px-3 py-2 transition-all active:scale-[0.98] ${
            disabled || isFinished
              ? "cursor-default"
              : dark
                ? `cursor-pointer hover:bg-gray-700/40 active:${ac.bg15}`
                : `cursor-pointer hover:bg-gray-100 active:${ac.bgPaleStrong}`
          } ${homeLead ? (dark ? `ring-2 ${ac.ring500_50} ${ac.bg10}` : `ring-2 ${ac.ring400} ${ac.bgPale}`) : ""}`}
        >
          <div className="text-right min-w-0">
            <div className={`font-black text-base md:text-lg leading-tight break-words ${dark ? "text-white" : "text-gray-900"}`}>
              {homeName}
            </div>
          </div>
          {match.home_logo_url && (
            <div className={`flex-shrink-0 rounded-xl overflow-hidden ring-1 ${dark ? "ring-gray-700" : "ring-gray-200"}`}>
              <Image
                src={match.home_logo_url}
                alt={homeName}
                width={56}
                height={42}
                className="w-14 h-10 object-cover"
                unoptimized
              />
            </div>
          )}
        </button>

        <div className="flex items-center justify-center gap-2.5">
          {isFinished && match.home_score != null && match.away_score != null ? (
            <div className="text-center">
              <div className={`text-3xl font-black tabular-nums ${dark ? "text-white" : "text-gray-900"}`}>
                {match.home_score}
                <span className={dark ? "mx-2 text-gray-500" : "mx-2 text-gray-400"}>:</span>
                {match.away_score}
              </div>
              {userPred && (
                <div className="text-[11px] text-theme-text-secondary mt-1">
                  {t("yourPredictionShort", lang === "en" ? "yours" : "tvoja")}: {userPred.home_score} − {userPred.away_score}
                </div>
              )}
            </div>
          ) : (
            <>
              <input
                type="number"
                min={0}
                disabled={disabled}
                value={draft.home ?? ""}
                onChange={(e) =>
                  onChange({ home: e.target.value === "" ? null : Number(e.target.value) })
                }
                placeholder="0"
                inputMode="numeric"
                className={`w-20 h-20 text-center text-4xl font-black tabular-nums leading-none rounded-2xl border-2 outline-none transition-all duration-200 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                  disabled
                    ? dark
                      ? "bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed placeholder-gray-700"
                      : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed placeholder-gray-300"
                    : draft.home != null
                      ? dark
                        ? `${ac.bg15} ${ac.border500} ${ac.textBrighter} shadow-lg ${ac.shadow500_10}`
                        : `${ac.bgPale} ${ac.border500} ${ac.textDeeper} shadow-md ${ac.shadow500_20}`
                      : dark
                        ? `bg-gray-900 border-gray-700 text-white placeholder-gray-600 ${ac.hoverBorder500_60} ${ac.focusBorder500} focus:shadow-lg focus:${ac.shadow500_10}`
                        : `bg-white border-gray-300 text-gray-900 placeholder-gray-300 ${ac.hoverBorder500_60} ${ac.focusBorder500} focus:shadow-md focus:${ac.shadow500_10}`
                }`}
              />
              <span className={`text-3xl font-black ${dark ? "text-gray-600" : "text-gray-400"}`}>
                :
              </span>
              <input
                type="number"
                min={0}
                disabled={disabled}
                value={draft.away ?? ""}
                onChange={(e) =>
                  onChange({ away: e.target.value === "" ? null : Number(e.target.value) })
                }
                placeholder="0"
                inputMode="numeric"
                className={`w-20 h-20 text-center text-4xl font-black tabular-nums leading-none rounded-2xl border-2 outline-none transition-all duration-200 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                  disabled
                    ? dark
                      ? "bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed placeholder-gray-700"
                      : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed placeholder-gray-300"
                    : draft.away != null
                      ? dark
                        ? `${ac.bg15} ${ac.border500} ${ac.textBrighter} shadow-lg ${ac.shadow500_10}`
                        : `${ac.bgPale} ${ac.border500} ${ac.textDeeper} shadow-md ${ac.shadow500_20}`
                      : dark
                        ? `bg-gray-900 border-gray-700 text-white placeholder-gray-600 ${ac.hoverBorder500_60} ${ac.focusBorder500} focus:shadow-lg focus:${ac.shadow500_10}`
                        : `bg-white border-gray-300 text-gray-900 placeholder-gray-300 ${ac.hoverBorder500_60} ${ac.focusBorder500} focus:shadow-md focus:${ac.shadow500_10}`
                }`}
              />
            </>
          )}
        </div>

        <button
          type="button"
          onPointerDown={() => startHold("away")}
          onPointerUp={() => endHold("away")}
          onPointerLeave={() => cancelHold("away")}
          onPointerCancel={() => cancelHold("away")}
          onContextMenu={(e) => e.preventDefault()}
          disabled={disabled || isFinished}
          aria-label={`${awayName}. ${t("tapTeamHint")}`}
          className={`flex items-center gap-3 min-w-0 rounded-2xl px-3 py-2 transition-all active:scale-[0.98] ${
            disabled || isFinished
              ? "cursor-default"
              : dark
                ? `cursor-pointer hover:bg-gray-700/40 active:${ac.bg15}`
                : `cursor-pointer hover:bg-gray-100 active:${ac.bgPaleStrong}`
          } ${awayLead ? (dark ? `ring-2 ${ac.ring500_50} ${ac.bg10}` : `ring-2 ${ac.ring400} ${ac.bgPale}`) : ""}`}
        >
          {match.away_logo_url && (
            <div className={`flex-shrink-0 rounded-xl overflow-hidden ring-1 ${dark ? "ring-gray-700" : "ring-gray-200"}`}>
              <Image
                src={match.away_logo_url}
                alt={awayName}
                width={56}
                height={42}
                className="w-14 h-10 object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="min-w-0">
            <div className={`font-black text-base md:text-lg leading-tight break-words ${dark ? "text-white" : "text-gray-900"}`}>
              {awayName}
            </div>
          </div>
        </button>
      </div>

      {/* Quick score chips (tablet+ only. mobile renders them inside the stacked layout) */}
      {!isFinished && (
        <div className="hidden sm:block">
          <QuickScoreChips
            homeName={homeName}
            awayName={awayName}
            selected={draft}
            disabled={disabled}
            onPick={(h, a) => onChange({ home: h, away: a })}
            theme={theme}
            ac={ac}
          />
        </div>
      )}

      {outcomeBadge && (
        <div className="mt-2.5 pt-2 border-t border-theme-border flex items-center justify-between gap-2">
          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${outcomeBadge.cls}`}
          >
            {outcomeBadge.text}
          </span>
          {userPred && (
            <span
              className={`inline-flex items-baseline gap-1 ${accentText}`}
            >
              <span className="text-sm font-black tabular-nums leading-none">
                +{userPred.points_awarded}
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold leading-none">
                pts
              </span>
            </span>
          )}
        </div>
      )}

      {!isFinished && !liveNow && !disabled && (
        <div
          className={`mt-2.5 pt-2 border-t flex items-center justify-end gap-3 text-[10px] uppercase tracking-wider font-bold ${dark ? "border-gray-700/60 text-gray-500" : "border-gray-200/80 text-gray-500"}`}
        >
          <span>
            {lang === "en" ? "Exact" : "Tačno"}{" "}
            <span className={`${ac.textPair600_400} font-black`}>
              {match.points_exact}
            </span>
          </span>
          <span className="opacity-30">·</span>
          <span>
            {lang === "en" ? "Margin" : "Razlika"}{" "}
            <span className={`${ac.textPair600_400} font-black`}>
              {match.points_diff}
            </span>
          </span>
          <span className="opacity-30">·</span>
          <span>
            {lang === "en" ? "Winner" : "Pobjednik"}{" "}
            <span className={`${ac.textPair600_400} font-black`}>
              {match.points_winner}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
