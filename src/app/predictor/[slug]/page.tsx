"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useSession, signIn } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import LoadingCard from "@/components/shared/LoadingCard";
import {
  Trophy,
  Calendar,
  Lock,
  CheckCircle2,
  ListChecks,
  ScrollText,
  Gift,
  BarChart3,
  Crown,
  Star,
  Award,
  Sparkles,
  LogIn,
  Save,
  AlertCircle,
  Swords,
  CalendarClock,
  MapPin,
  Flame,
  Clock,
  Unlock,
} from "lucide-react";
import type {
  PredictionCategory,
  PredictionOption,
  Tournament,
  TournamentReward,
  TournamentRule,
  UserPrediction,
  StandingsRow,
  CategoryType,
  Match,
  MatchPrediction,
  MatchStatus,
} from "@/types/predictor";
import { getLogoFilter } from "@/utils/predictor-logo";

type CategoryWithOptions = PredictionCategory & { options: PredictionOption[] };
type TournamentDetail = Tournament & {
  categories: CategoryWithOptions[];
  rules: TournamentRule[];
  rewards: TournamentReward[];
};

type PageTab = "predictions" | "matches" | "rules" | "rewards" | "standings";

const ACCENT_BORDER: Record<string, string> = {
  amber: "border-l-amber-500",
  gold: "border-l-amber-500",
  purple: "border-l-purple-600",
  blue: "border-l-blue-600",
  red: "border-l-red-600",
  green: "border-l-emerald-600",
};
const ACCENT_TEXT: Record<string, string> = {
  amber: "text-amber-500 dark:text-amber-400",
  gold: "text-amber-500 dark:text-amber-400",
  purple: "text-purple-600 dark:text-purple-400",
  blue: "text-blue-600 dark:text-blue-400",
  red: "text-red-600 dark:text-red-400",
  green: "text-emerald-600 dark:text-emerald-400",
};
const ACCENT_RING: Record<string, string> = {
  amber: "ring-amber-500",
  gold: "ring-amber-500",
  purple: "ring-purple-600",
  blue: "ring-blue-600",
  red: "ring-red-600",
  green: "ring-emerald-600",
};
const ACCENT_BG: Record<string, string> = {
  amber: "bg-amber-500 hover:bg-amber-400",
  gold: "bg-amber-500 hover:bg-amber-400",
  purple: "bg-purple-600 hover:bg-purple-500",
  blue: "bg-blue-600 hover:bg-blue-500",
  red: "bg-red-600 hover:bg-red-500",
  green: "bg-emerald-600 hover:bg-emerald-500",
};

function isLockedClient(
  t: Pick<Tournament, "registration_lock_at" | "status">,
  cat: Pick<PredictionCategory, "lock_at">,
): boolean {
  if (t.status === "locked" || t.status === "finished") return true;
  const now = Date.now();
  if (cat.lock_at && now >= Date.parse(cat.lock_at)) return true;
  if (t.registration_lock_at && now >= Date.parse(t.registration_lock_at))
    return true;
  return false;
}

export default function TournamentDetailPage() {
  const { theme } = useTheme();
  const { t, ready } = useTranslation("predictor");
  const { slug } = useParams<{ slug: string }>();
  const { data: session, status: authStatus } = useSession();
  const currentUserId = (session?.user as any)?.id as string | undefined;

  const [tab, setTab] = useState<PageTab>("predictions");
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [myPredictions, setMyPredictions] = useState<UserPrediction[]>([]);
  const [standings, setStandings] = useState<StandingsRow[]>([]);
  const [draft, setDraft] = useState<Record<string, DraftEntry>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  // matches state
  const [matches, setMatches] = useState<Match[]>([]);
  const [myMatchPredictions, setMyMatchPredictions] = useState<
    MatchPrediction[]
  >([]);
  // membership (approval)
  const [membership, setMembership] = useState<{
    require_approval: boolean;
    member: { status: string } | null;
    can_predict: boolean;
  } | null>(null);
  const [joining, setJoining] = useState(false);

  const loadTournament = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/predictor/tournaments/${slug}`);
      if (res.ok) {
        setTournament((await res.json()) as TournamentDetail);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const loadMyPredictions = useCallback(async () => {
    if (authStatus !== "authenticated") {
      setMyPredictions([]);
      return;
    }
    const res = await fetch(
      `/api/predictor/tournaments/${slug}/my-predictions`,
    );
    if (res.ok) setMyPredictions(await res.json());
  }, [slug, authStatus]);

  const loadStandings = useCallback(async () => {
    const res = await fetch(`/api/predictor/tournaments/${slug}/standings`);
    if (res.ok) setStandings(await res.json());
  }, [slug]);

  const loadMatches = useCallback(async () => {
    const res = await fetch(`/api/predictor/tournaments/${slug}/matches`);
    if (res.ok) setMatches(await res.json());
  }, [slug]);

  const loadMyMatchPredictions = useCallback(async () => {
    if (authStatus !== "authenticated") {
      setMyMatchPredictions([]);
      return;
    }
    const res = await fetch(
      `/api/predictor/tournaments/${slug}/my-match-predictions`,
    );
    if (res.ok) setMyMatchPredictions(await res.json());
  }, [slug, authStatus]);

  const loadMembership = useCallback(async () => {
    if (authStatus !== "authenticated") {
      setMembership(null);
      return;
    }
    const res = await fetch(`/api/predictor/tournaments/${slug}/membership`);
    if (res.ok) setMembership(await res.json());
  }, [slug, authStatus]);

  const requestJoin = async () => {
    if (authStatus !== "authenticated") {
      signIn();
      return;
    }
    setJoining(true);
    try {
      await fetch(`/api/predictor/tournaments/${slug}/join`, {
        method: "POST",
      });
      await loadMembership();
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    loadTournament();
    loadStandings();
    loadMatches();
  }, [loadTournament, loadStandings, loadMatches]);

  useEffect(() => {
    loadMyPredictions();
    loadMyMatchPredictions();
    loadMembership();
  }, [loadMyPredictions, loadMyMatchPredictions, loadMembership]);

  // seed draft from saved predictions
  useEffect(() => {
    const seeded: Record<string, DraftEntry> = {};
    for (const p of myPredictions) {
      seeded[p.category_id] = {
        selected: p.selected_option_ids ?? [],
        text: p.text_value ?? "",
        numeric: p.numeric_value ?? null,
        scoreHome: p.score_home ?? null,
        scoreAway: p.score_away ?? null,
      };
    }
    setDraft(seeded);
  }, [myPredictions]);

  const completion = useMemo(() => {
    if (!tournament) return { done: 0, total: 0 };
    const total = tournament.categories.length;
    let done = 0;
    for (const c of tournament.categories) {
      const d = draft[c.id];
      if (!d) continue;
      const filled = hasEntry(c.category_type, d);
      if (filled) done += 1;
    }
    return { done, total };
  }, [tournament, draft]);

  const submit = async () => {
    if (!tournament) return;
    setSaving(true);
    setError(null);
    try {
      const items = tournament.categories
        .filter((c) => !isLockedClient(tournament, c))
        .map((c) => {
          const d = draft[c.id];
          if (!d || !hasEntry(c.category_type, d)) return null;
          return {
            category_id: c.id,
            selected_option_ids: d.selected,
            text_value: d.text || undefined,
            numeric_value: d.numeric ?? undefined,
            score_home: d.scoreHome ?? undefined,
            score_away: d.scoreAway ?? undefined,
          };
        })
        .filter(Boolean);
      if (items.length === 0) {
        setError(
          t("noPredictionsToSave", "Nothing to save — make a pick first."),
        );
        setSaving(false);
        return;
      }
      const res = await fetch(
        `/api/predictor/tournaments/${slug}/predict`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || t("saveFailed", "Save failed"));
      }
      setSavedAt(new Date());
      await loadMyPredictions();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !ready) {
    return (
      <main className="w-full min-h-screen bg-theme-background">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingCard
            title={t("loading", "Loading…")}
            description={t("loadingDesc", "Fetching tournament")}
            className="w-full max-w-md mx-auto"
          />
        </div>
      </main>
    );
  }

  if (!tournament) {
    return (
      <main className="w-full min-h-screen bg-theme-background">
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold mb-2">
            {t("notFound.title", "Tournament not found")}
          </h1>
          <p className="text-sm text-theme-text-secondary mb-6">
            {t(
              "notFound.subtitle",
              "This tournament does not exist or is not yet public.",
            )}
          </p>
          <Link
            href="/predictor"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-black font-semibold"
          >
            ← {t("backToList", "Back to tournaments")}
          </Link>
        </div>
      </main>
    );
  }

  const accent = tournament.accent_color || "amber";
  const accentBorder = ACCENT_BORDER[accent] ?? "border-l-amber-500";
  const accentText = ACCENT_TEXT[accent] ?? "text-amber-500 dark:text-amber-400";
  const accentBg = ACCENT_BG[accent] ?? "bg-amber-500 hover:bg-amber-400";
  const accentRing = ACCENT_RING[accent] ?? "ring-amber-500";

  const isFullyLocked =
    tournament.status === "locked" || tournament.status === "finished";

  return (
    <main className="w-full min-h-screen overflow-x-hidden bg-theme-background">
      {/* Hero */}
      <section className="relative overflow-hidden pb-8 px-4 pt-6 md:pt-10">
        {tournament.hero_image_url && (
          <div className="absolute inset-0 pointer-events-none opacity-10">
            <Image
              src={tournament.hero_image_url}
              alt=""
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3 text-sm">
            <Link
              href="/predictor"
              className="text-theme-text-secondary hover:text-theme-foreground transition-colors"
            >
              ← {t("backToList", "All tournaments")}
            </Link>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {tournament.logo_url ? (
              <Image
                src={tournament.logo_url}
                alt={tournament.name}
                width={64}
                height={64}
                className="w-14 h-14 md:w-16 md:h-16 object-contain"
                style={{
                  filter: getLogoFilter(
                    tournament.logo_url,
                    tournament.accent_color,
                  ),
                }}
              />
            ) : (
              <Trophy className={`w-12 h-12 ${accentText}`} />
            )}
            <div className="flex-1 min-w-0">
              <h1
                className={`text-2xl md:text-4xl font-black ${
                  theme === "dark" ? "text-white" : "text-gray-800"
                }`}
              >
                {tournament.name}
              </h1>
              {tournament.short_description && (
                <p
                  className={`text-sm md:text-base mt-1 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {tournament.short_description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-5 text-sm text-theme-text-secondary">
            {tournament.starts_at && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(tournament.starts_at).toLocaleDateString()}
                {tournament.ends_at &&
                  ` → ${new Date(tournament.ends_at).toLocaleDateString()}`}
              </span>
            )}
            {tournament.registration_lock_at && (
              <span className="inline-flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                {t("locksAt", "Locks")}{" "}
                {new Date(tournament.registration_lock_at).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            {tournament.prize_pool_amount != null && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-amber-500">
                <Trophy className="w-4 h-4" />
                {tournament.prize_pool_amount} {tournament.prize_pool_currency}
              </span>
            )}
            {tournament.sponsor_name && (
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                {t("sponsor", "Sponsor")}: {tournament.sponsor_name}
              </span>
            )}
          </div>

          {/* Membership / Join banner */}
          {membership?.require_approval && (
            <div className="mt-5">
              {!membership.member ? (
                <div
                  className={`rounded-lg p-4 flex items-center gap-3 flex-wrap border-l-4 border-amber-500 ${
                    theme === "dark"
                      ? "bg-amber-950/30 border border-amber-900/40"
                      : "bg-amber-50 border border-amber-200"
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold ${theme === "dark" ? "text-amber-100" : "text-amber-900"}`}>
                      Ovaj turnir je zatvoreni — admin odobrava učesnike
                    </p>
                    <p className="text-xs text-theme-text-secondary mt-0.5">
                      Zatraži učešće da bi mogao predviđati. Standings ostaju javni za sve.
                    </p>
                  </div>
                  <button
                    onClick={requestJoin}
                    disabled={joining}
                    className={`px-4 py-2 rounded-md text-sm font-bold text-black ${accentBg} disabled:opacity-60 inline-flex items-center gap-2`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {joining ? "Slanje…" : "Zatraži učešće"}
                  </button>
                </div>
              ) : membership.member.status === "pending" ? (
                <div
                  className={`rounded-lg p-3 flex items-center gap-3 ${
                    theme === "dark"
                      ? "bg-amber-950/30 border border-amber-900/40 text-amber-200"
                      : "bg-amber-50 border border-amber-200 text-amber-900"
                  }`}
                >
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-semibold">
                    Tvoj zahtjev za učešće čeka odobrenje admina.
                  </span>
                </div>
              ) : membership.member.status === "approved" ? (
                <div
                  className={`rounded-lg p-3 flex items-center gap-3 ${
                    theme === "dark"
                      ? "bg-emerald-950/30 border border-emerald-900/40 text-emerald-200"
                      : "bg-emerald-50 border border-emerald-200 text-emerald-900"
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-semibold">
                    Odobren si — možeš predviđati u ovom turniru!
                  </span>
                </div>
              ) : (
                <div
                  className={`rounded-lg p-3 flex items-center gap-3 ${
                    theme === "dark"
                      ? "bg-red-950/30 border border-red-900/40 text-red-200"
                      : "bg-red-50 border border-red-200 text-red-900"
                  }`}
                >
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-semibold">
                    Tvoj zahtjev je odbijen ili je nalog blokiran.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* progress */}
          {!isFullyLocked && tournament.categories.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-theme-text-secondary mb-1.5">
                <span>{t("progress", "Predictions completed")}</span>
                <span className="font-semibold">
                  {completion.done} / {completion.total}
                </span>
              </div>
              <div
                className={`h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"}`}
              >
                <motion.div
                  className={`h-full ${accentBg}`}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${completion.total > 0 ? (completion.done / completion.total) * 100 : 0}%`,
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Tabs */}
      <section className="px-4 sticky top-0 z-30 bg-theme-background/95 backdrop-blur-md border-b border-theme-border">
        <div className="max-w-5xl mx-auto flex overflow-x-auto -mx-1">
          {(
            [
              {
                id: "predictions",
                label: t("tabs.predictions", "Predikcije"),
                icon: ListChecks,
              },
              {
                id: "matches",
                label: t("tabs.matches", "Utakmice"),
                icon: Swords,
              },
              {
                id: "standings",
                label: t("tabs.standings", "Tabela"),
                icon: BarChart3,
              },
              {
                id: "rules",
                label: t("tabs.rules", "Pravila"),
                icon: ScrollText,
              },
              {
                id: "rewards",
                label: t("tabs.rewards", "Nagrade"),
                icon: Gift,
              },
            ] as const
          ).map((it) => {
            const Icon = it.icon;
            const active = tab === it.id;
            return (
              <button
                key={it.id}
                onClick={() => setTab(it.id as PageTab)}
                className={`py-3 px-3 md:px-4 border-b-2 font-semibold text-xs md:text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${
                  active
                    ? `${accentText} ${accentBorder.replace("border-l-", "border-b-")}`
                    : "border-transparent text-theme-text-secondary hover:text-theme-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {it.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Content */}
      <section className="px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {tab === "predictions" && (
            <PredictionsTab
              tournament={tournament}
              draft={draft}
              setDraft={setDraft}
              authStatus={authStatus}
              accentBorder={accentBorder}
              accentText={accentText}
              accentBg={accentBg}
              accentRing={accentRing}
              theme={theme}
              saving={saving}
              error={error}
              savedAt={savedAt}
              submit={submit}
            />
          )}

          {tab === "matches" && (
            <MatchesPublicTab
              matches={matches}
              myMatchPredictions={myMatchPredictions}
              slug={String(slug)}
              authStatus={authStatus}
              theme={theme}
              accentText={accentText}
              accentBg={accentBg}
              accentBorder={accentBorder}
              onSaved={loadMyMatchPredictions}
            />
          )}

          {tab === "rules" && (
            <RulesTab
              tournament={tournament}
              theme={theme}
              accentText={accentText}
            />
          )}
          {tab === "rewards" && (
            <RewardsTab
              tournament={tournament}
              theme={theme}
              accentText={accentText}
            />
          )}
          {tab === "standings" && (
            <StandingsTab
              standings={standings}
              theme={theme}
              accentText={accentText}
              accentBg={accentBg}
              currentUserId={currentUserId}
            />
          )}
        </div>
      </section>
    </main>
  );
}

// =============================================================
// Predictions tab
// =============================================================
type DraftEntry = {
  selected: string[];
  text: string;
  numeric: number | null;
  scoreHome: number | null;
  scoreAway: number | null;
};

function emptyDraft(): DraftEntry {
  return {
    selected: [],
    text: "",
    numeric: null,
    scoreHome: null,
    scoreAway: null,
  };
}

function hasEntry(type: CategoryType, d: DraftEntry): boolean {
  switch (type) {
    case "exact_score":
      return d.scoreHome != null && d.scoreAway != null;
    case "numeric":
      return d.numeric != null;
    case "free_text":
      return !!d.text.trim();
    default:
      return d.selected.length > 0;
  }
}

function PredictionsTab({
  tournament,
  draft,
  setDraft,
  authStatus,
  accentBorder,
  accentText,
  accentBg,
  accentRing,
  theme,
  saving,
  error,
  savedAt,
  submit,
}: {
  tournament: TournamentDetail;
  draft: Record<string, DraftEntry>;
  setDraft: React.Dispatch<React.SetStateAction<Record<string, DraftEntry>>>;
  authStatus: string;
  accentBorder: string;
  accentText: string;
  accentBg: string;
  accentRing: string;
  theme: string;
  saving: boolean;
  error: string | null;
  savedAt: Date | null;
  submit: () => void;
}) {
  const update = (catId: string, patch: Partial<DraftEntry>) =>
    setDraft((d) => ({
      ...d,
      [catId]: { ...(d[catId] ?? emptyDraft()), ...patch },
    }));

  const isFinished = tournament.status === "finished";

  return (
    <div className="space-y-5">
      {authStatus !== "authenticated" && !isFinished && (
        <div
          className={`rounded-lg border p-4 flex items-center gap-3 ${
            theme === "dark"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <LogIn className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 text-sm">
            Prijavi se da bi mogao podnijeti predikcije i takmičiti se za nagrade.
          </div>
          <button
            onClick={() => signIn()}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold text-black ${accentBg}`}
          >
            Prijavi se
          </button>
        </div>
      )}

      {tournament.categories.length === 0 && (
        <div
          className={`rounded-lg border border-dashed p-10 text-center text-sm ${
            theme === "dark"
              ? "border-gray-700 text-gray-400"
              : "border-gray-300 text-gray-500"
          }`}
        >
          Još nema kategorija predikcija.
        </div>
      )}

      {tournament.categories.map((cat) => {
        const d = draft[cat.id] ?? emptyDraft();
        const locked = isLockedClient(tournament, cat);
        const disabled = locked || authStatus !== "authenticated";
        return (
          <div
            key={cat.id}
            className={`rounded-lg border-l-4 ${accentBorder} ${
              theme === "dark"
                ? "bg-gray-800/60 border border-gray-700"
                : "bg-white/80 border border-gray-200"
            } p-5`}
          >
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <div className="min-w-0">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  {cat.name}
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${accentText} ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"}`}
                  >
                    {cat.points_correct} pts
                  </span>
                </h3>
                {cat.description && (
                  <p
                    className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {cat.description}
                  </p>
                )}
              </div>
              {locked && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Locked
                </span>
              )}
            </div>

            <CategoryInput
              category={cat}
              draft={d}
              onChange={(patch) => update(cat.id, patch)}
              disabled={disabled}
              showResults={isFinished}
              theme={theme}
              accentRing={accentRing}
              accentBg={accentBg}
              accentText={accentText}
            />

            {cat.lock_at && !locked && (
              <p className="mt-3 text-xs text-theme-text-secondary inline-flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Locks at {new Date(cat.lock_at).toLocaleString()}
              </p>
            )}
          </div>
        );
      })}

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 text-red-400 text-sm p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {!isFinished && tournament.categories.length > 0 && (
        <div
          className={`sticky bottom-4 mt-6 rounded-lg p-4 flex items-center justify-between gap-3 backdrop-blur-md ${
            theme === "dark"
              ? "bg-gray-900/85 border border-gray-700"
              : "bg-white/90 border border-gray-200 shadow-md"
          }`}
        >
          <div className="text-sm">
            {savedAt && (
              <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Sačuvano {savedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
          <button
            disabled={saving || authStatus !== "authenticated"}
            onClick={submit}
            className={`px-5 py-2.5 rounded-md font-bold text-sm text-black ${accentBg} disabled:opacity-50 inline-flex items-center gap-2`}
          >
            <Save className="w-4 h-4" />
            {saving ? "Čuvanje…" : "Sačuvaj predikcije"}
          </button>
        </div>
      )}
    </div>
  );
}

// renders the right control per category type
function CategoryInput({
  category,
  draft,
  onChange,
  disabled,
  showResults,
  theme,
  accentRing,
  accentBg,
  accentText,
}: {
  category: CategoryWithOptions;
  draft: DraftEntry;
  onChange: (patch: Partial<DraftEntry>) => void;
  disabled: boolean;
  showResults: boolean;
  theme: string;
  accentRing: string;
  accentBg: string;
  accentText: string;
}) {
  const toggleOption = (id: string) => {
    if (disabled) return;
    if (
      category.category_type === "single_choice" ||
      category.category_type === "team_selection" ||
      category.category_type === "player_selection"
    ) {
      onChange({ selected: [id] });
      return;
    }
    const cur = draft.selected.slice();
    const idx = cur.indexOf(id);
    if (idx >= 0) {
      cur.splice(idx, 1);
    } else {
      if (cur.length >= (category.max_selections || 1)) {
        if (category.category_type === "ranked_top_n") {
          cur.push(id);
          if (cur.length > category.max_selections) cur.shift();
        } else {
          return;
        }
      } else {
        cur.push(id);
      }
    }
    onChange({ selected: cur });
  };

  if (
    category.category_type === "single_choice" ||
    category.category_type === "multiple_choice" ||
    category.category_type === "ranked_top_n" ||
    category.category_type === "team_selection" ||
    category.category_type === "player_selection"
  ) {
    // group by group_label if present
    const groups = new Map<string, PredictionOption[]>();
    for (const o of category.options) {
      const key = o.group_label ?? "";
      const arr = groups.get(key) ?? [];
      arr.push(o);
      groups.set(key, arr);
    }
    const orderedGroups = Array.from(groups.entries());

    return (
      <div className="space-y-3">
        {orderedGroups.map(([groupName, opts]) => (
          <div key={groupName} className="space-y-2">
            {groupName && (
              <div className="text-xs uppercase font-bold tracking-wide text-theme-text-secondary">
                {groupName}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {opts.map((opt) => {
                const selectedIdx = draft.selected.indexOf(opt.id);
                const isSelected = selectedIdx >= 0;
                const rankBadge =
                  category.category_type === "ranked_top_n" && isSelected
                    ? selectedIdx + 1
                    : null;
                const showCorrect = showResults && opt.is_correct;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleOption(opt.id)}
                    className={`relative text-left rounded-md border p-3 transition-all duration-200 ${
                      isSelected
                        ? `ring-2 ${accentRing} ${theme === "dark" ? "bg-gray-900" : "bg-white shadow-sm"}`
                        : theme === "dark"
                          ? "border-gray-700 bg-gray-900/40 hover:bg-gray-900"
                          : "border-gray-200 bg-white hover:border-gray-300"
                    } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${
                      showCorrect ? "ring-2 ring-emerald-500" : ""
                    }`}
                  >
                    {rankBadge != null && (
                      <span
                        className={`absolute -top-2 -left-2 w-6 h-6 rounded-full ${accentBg} text-black text-xs font-bold flex items-center justify-center`}
                      >
                        {rankBadge}
                      </span>
                    )}
                    {showCorrect && (
                      <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-emerald-500" />
                    )}
                    <div className="flex items-center gap-2">
                      {opt.image_url && (
                        <Image
                          src={opt.image_url}
                          alt={opt.label}
                          width={24}
                          height={24}
                          className="w-6 h-6 object-contain"
                        />
                      )}
                      <span
                        className={`text-sm font-medium ${isSelected ? accentText : theme === "dark" ? "text-gray-200" : "text-gray-800"}`}
                      >
                        {opt.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {category.category_type === "ranked_top_n" && (
          <p className="text-xs text-theme-text-secondary">
            Izaberi {category.max_selections} po tačnom redoslijedu. Brojevi prikazuju
            tvoj rang.
          </p>
        )}
        {category.category_type === "multiple_choice" && (
          <p className="text-xs text-theme-text-secondary">
            Izaberi do {category.max_selections}.
          </p>
        )}
      </div>
    );
  }

  if (category.category_type === "exact_score") {
    return (
      <div className="flex items-center gap-3">
        <NumInput
          value={draft.scoreHome}
          onChange={(v) => onChange({ scoreHome: v })}
          disabled={disabled}
          placeholder="Domaćin"
        />
        <span className="text-xl font-bold text-theme-text-secondary">:</span>
        <NumInput
          value={draft.scoreAway}
          onChange={(v) => onChange({ scoreAway: v })}
          disabled={disabled}
          placeholder="Gost"
        />
      </div>
    );
  }

  if (category.category_type === "numeric") {
    return (
      <NumInput
        value={draft.numeric}
        onChange={(v) => onChange({ numeric: v })}
        disabled={disabled}
        placeholder="Your guess"
        wide
      />
    );
  }

  if (category.category_type === "free_text") {
    return (
      <input
        type="text"
        disabled={disabled}
        value={draft.text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Your answer"
        className={`w-full px-3 py-2 rounded-md border outline-none text-sm ${
          theme === "dark"
            ? "bg-gray-900 border-gray-700 focus:border-amber-500"
            : "bg-white border-gray-300 focus:border-amber-500"
        } disabled:opacity-60`}
      />
    );
  }

  return null;
}

function NumInput({
  value,
  onChange,
  disabled,
  placeholder,
  wide,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
  wide?: boolean;
}) {
  return (
    <input
      type="number"
      disabled={disabled}
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : Number(e.target.value))
      }
      placeholder={placeholder}
      className={`${wide ? "w-full" : "w-20 text-center"} px-3 py-2 rounded-md border outline-none text-sm bg-theme-background border-theme-border focus:border-amber-500 disabled:opacity-60`}
    />
  );
}

// =============================================================
// Rules tab
// =============================================================
function RulesTab({
  tournament,
  theme,
  accentText,
}: {
  tournament: TournamentDetail;
  theme: string;
  accentText: string;
}) {
  return (
    <div className="space-y-4 max-w-3xl">
      {tournament.rules_md && (
        <div
          className={`rounded-lg border p-5 ${theme === "dark" ? "bg-gray-800/60 border-gray-700" : "bg-white/80 border-gray-200"}`}
        >
          <h3 className={`font-bold mb-2 ${accentText}`}>Overview</h3>
          <p className="whitespace-pre-wrap text-sm text-theme-text-secondary">
            {tournament.rules_md}
          </p>
        </div>
      )}
      {tournament.point_system_md && (
        <div
          className={`rounded-lg border p-5 ${theme === "dark" ? "bg-gray-800/60 border-gray-700" : "bg-white/80 border-gray-200"}`}
        >
          <h3 className={`font-bold mb-2 ${accentText}`}>Point system</h3>
          <p className="whitespace-pre-wrap text-sm text-theme-text-secondary">
            {tournament.point_system_md}
          </p>
        </div>
      )}
      {tournament.eligibility_md && (
        <div
          className={`rounded-lg border p-5 ${theme === "dark" ? "bg-gray-800/60 border-gray-700" : "bg-white/80 border-gray-200"}`}
        >
          <h3 className={`font-bold mb-2 ${accentText}`}>Eligibility</h3>
          <p className="whitespace-pre-wrap text-sm text-theme-text-secondary">
            {tournament.eligibility_md}
          </p>
        </div>
      )}
      {tournament.rules.length === 0 &&
      !tournament.rules_md &&
      !tournament.point_system_md &&
      !tournament.eligibility_md ? (
        <div
          className={`rounded-lg border border-dashed p-10 text-center text-sm ${
            theme === "dark"
              ? "border-gray-700 text-gray-400"
              : "border-gray-300 text-gray-500"
          }`}
        >
          No rules published yet.
        </div>
      ) : (
        <div className="space-y-3">
          {tournament.rules.map((r) => (
            <div
              key={r.id}
              className={`rounded-lg border p-4 ${theme === "dark" ? "bg-gray-800/60 border-gray-700" : "bg-white/80 border-gray-200"}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{r.title}</h4>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    r.kind === "bonus"
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-300"
                      : r.kind === "deadline"
                        ? "bg-red-500/20 text-red-600 dark:text-red-300"
                        : "bg-gray-500/20 text-gray-500 dark:text-gray-300"
                  }`}
                >
                  {r.kind}
                </span>
              </div>
              {r.body_md && (
                <p className="whitespace-pre-wrap text-sm text-theme-text-secondary">
                  {r.body_md}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================
// Rewards tab
// =============================================================
function RewardsTab({
  tournament,
  theme,
  accentText,
}: {
  tournament: TournamentDetail;
  theme: string;
  accentText: string;
}) {
  if (tournament.rewards.length === 0) {
    return (
      <div
        className={`rounded-lg border border-dashed p-10 text-center text-sm ${
          theme === "dark"
            ? "border-gray-700 text-gray-400"
            : "border-gray-300 text-gray-500"
        }`}
      >
        No rewards configured yet.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tournament.rewards.map((r) => {
        const RankIcon =
          r.rank_position === 1
            ? Crown
            : r.rank_position === 2
              ? Award
              : r.rank_position === 3
                ? Star
                : Gift;
        return (
          <div
            key={r.id}
            className={`rounded-lg border p-5 ${theme === "dark" ? "bg-gray-800/60 border-gray-700" : "bg-white/80 border-gray-200"}`}
          >
            <div className="flex items-start gap-3">
              <RankIcon className={`w-7 h-7 ${accentText} flex-shrink-0 mt-1`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold">{r.title}</h4>
                  {r.rank_position && (
                    <span className={`text-xs font-bold ${accentText}`}>
                      #{r.rank_position}
                    </span>
                  )}
                </div>
                {r.description && (
                  <p className="text-sm text-theme-text-secondary mt-1">
                    {r.description}
                  </p>
                )}
                {r.prize_value != null && (
                  <p className={`text-lg font-black mt-2 ${accentText}`}>
                    {r.prize_value} {r.prize_currency}
                  </p>
                )}
                {r.sponsor_name && (
                  <p className="text-xs text-theme-text-secondary mt-2">
                    Sponzor:{" "}
                    <span className="font-semibold">{r.sponsor_name}</span>
                  </p>
                )}
              </div>
              {r.image_url && (
                <Image
                  src={r.image_url}
                  alt={r.title}
                  width={64}
                  height={64}
                  className="w-16 h-16 object-contain"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================
// Standings tab
// =============================================================
function StandingsTab({
  standings,
  theme,
  accentText,
  accentBg,
  currentUserId,
}: {
  standings: StandingsRow[];
  theme: string;
  accentText: string;
  accentBg: string;
  currentUserId?: string;
}) {
  const dark = theme === "dark";

  if (standings.length === 0) {
    return (
      <div
        className={`rounded-lg border border-dashed p-12 text-center ${
          dark
            ? "border-gray-700 text-gray-400"
            : "border-gray-300 text-gray-500"
        }`}
      >
        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="text-base font-semibold mb-1">Tabela još prazna</p>
        <p className="text-sm">
          Pojavit će se čim prvi učesnici podnesu predikcije.
        </p>
      </div>
    );
  }

  const top3 = standings.slice(0, 3);
  const rest = standings.slice(3);
  const me = currentUserId
    ? standings.find((s) => s.user_id === currentUserId)
    : null;

  return (
    <div className="space-y-6">
      {/* Stats header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          theme={theme}
          label="Učesnika"
          value={standings.length}
          icon={Trophy}
        />
        <StatCard
          theme={theme}
          label="Tvoj plasman"
          value={me ? `#${me.rank}` : "—"}
          icon={Award}
          highlight={!!me}
        />
        <StatCard
          theme={theme}
          label="Tvoji poeni"
          value={me ? me.total_points : "—"}
          icon={Star}
          highlight={!!me}
        />
        <StatCard
          theme={theme}
          label="Lider"
          value={standings[0].total_points}
          icon={Crown}
        />
      </div>

      {/* Top 3 podium */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {/* 2nd place — left */}
          <PodiumCard
            row={top3[1]}
            place={2}
            theme={theme}
            accentText={accentText}
            currentUserId={currentUserId}
            heightClass="h-32 md:h-40"
          />
          {/* 1st place — center, taller */}
          <PodiumCard
            row={top3[0]}
            place={1}
            theme={theme}
            accentText={accentText}
            currentUserId={currentUserId}
            heightClass="h-40 md:h-52"
          />
          {/* 3rd place — right */}
          <PodiumCard
            row={top3[2]}
            place={3}
            theme={theme}
            accentText={accentText}
            currentUserId={currentUserId}
            heightClass="h-28 md:h-36"
          />
        </div>
      )}

      {/* Full table */}
      <div
        className={`rounded-lg border overflow-hidden ${
          dark ? "bg-gray-800/40 border-gray-700" : "bg-white/80 border-gray-200"
        }`}
      >
        <div
          className={`flex items-center gap-2 px-4 py-3 border-b ${
            dark ? "bg-gray-900/60 border-gray-700" : "bg-gray-50 border-gray-200"
          }`}
        >
          <Trophy className={`w-4 h-4 ${accentText}`} />
          <h3 className={`font-bold ${dark ? "text-white" : "text-gray-900"}`}>
            Kompletna tabela
          </h3>
          <span className={`text-xs ml-auto ${dark ? "text-gray-400" : "text-gray-500"}`}>
            sortirano po ukupnim poenima
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead
              className={`text-[10px] uppercase tracking-wider ${
                dark ? "bg-gray-900/40 text-gray-400" : "bg-gray-50/60 text-gray-600"
              }`}
            >
              <tr>
                <th className="py-2.5 px-3 text-left w-12">#</th>
                <th className="py-2.5 px-3 text-left">Igrač</th>
                <th
                  className="py-2.5 px-3 text-right hidden sm:table-cell"
                  title="Poeni iz kategorija (pobjednik turnira, top 4…)"
                >
                  Kategorije
                </th>
                <th
                  className="py-2.5 px-3 text-right hidden sm:table-cell"
                  title="Poeni iz pogađanja rezultata utakmica"
                >
                  Utakmice
                </th>
                <th className="py-2.5 px-3 text-right">Ukupno</th>
              </tr>
            </thead>
            <tbody>
              {(rest.length > 0 ? rest : standings).map((s) => {
                const isMe = currentUserId === s.user_id;
                const medal =
                  s.rank === 1 ? "🥇" : s.rank === 2 ? "🥈" : s.rank === 3 ? "🥉" : null;
                return (
                  <tr
                    key={s.user_id}
                    className={`border-t transition-colors ${
                      dark ? "border-gray-700/50" : "border-gray-100"
                    } ${
                      isMe
                        ? dark
                          ? "bg-amber-500/10"
                          : "bg-amber-50"
                        : ""
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold tabular-nums">
                      {medal ?? s.rank}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isMe
                              ? "bg-amber-500 text-black"
                              : dark
                                ? "bg-gray-700 text-gray-300"
                                : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {(s.user_display_name || s.user_email || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div
                            className={`font-semibold truncate ${
                              dark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {s.user_display_name ||
                              s.user_email?.split("@")[0] ||
                              "Igrač"}
                            {isMe && (
                              <span
                                className={`ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  dark
                                    ? "bg-amber-500/20 text-amber-300"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                ti
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-[11px] sm:hidden ${
                              dark ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            kat {s.category_points} · utakmice {s.match_points}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right tabular-nums hidden sm:table-cell ${
                        dark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {s.category_points}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right tabular-nums hidden sm:table-cell ${
                        dark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {s.match_points}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-black text-base tabular-nums ${accentText}`}
                    >
                      {s.total_points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  theme,
  label,
  value,
  icon: Icon,
  highlight,
}: {
  theme: string;
  label: string;
  value: number | string;
  icon: any;
  highlight?: boolean;
}) {
  const dark = theme === "dark";
  return (
    <div
      className={`rounded-lg p-4 border transition-colors ${
        highlight
          ? dark
            ? "bg-amber-500/10 border-amber-500/40"
            : "bg-amber-50 border-amber-200"
          : dark
            ? "bg-gray-800/60 border-gray-700"
            : "bg-white/80 border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-[10px] uppercase font-bold tracking-wider ${
            dark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {label}
        </span>
        <Icon
          className={`w-4 h-4 ${highlight ? "text-amber-500" : dark ? "text-gray-500" : "text-gray-400"}`}
        />
      </div>
      <div
        className={`text-2xl font-black tabular-nums ${
          highlight ? "text-amber-500" : dark ? "text-white" : "text-gray-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function PodiumCard({
  row,
  place,
  theme,
  accentText,
  currentUserId,
  heightClass,
}: {
  row: StandingsRow;
  place: 1 | 2 | 3;
  theme: string;
  accentText: string;
  currentUserId?: string;
  heightClass: string;
}) {
  const dark = theme === "dark";
  const isMe = currentUserId === row.user_id;
  const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";
  const colors = {
    1: dark
      ? "bg-gradient-to-b from-amber-500/30 to-amber-500/10 border-amber-500/50"
      : "bg-gradient-to-b from-amber-100 to-amber-50 border-amber-300",
    2: dark
      ? "bg-gradient-to-b from-gray-400/20 to-gray-400/5 border-gray-400/40"
      : "bg-gradient-to-b from-gray-200 to-gray-100 border-gray-300",
    3: dark
      ? "bg-gradient-to-b from-orange-600/20 to-orange-600/5 border-orange-700/40"
      : "bg-gradient-to-b from-orange-100 to-orange-50 border-orange-300",
  }[place];

  return (
    <div
      className={`relative rounded-lg border-2 p-3 md:p-4 ${colors} ${heightClass} flex flex-col justify-end ${
        isMe ? "ring-2 ring-amber-500/60" : ""
      }`}
    >
      <div className="text-3xl md:text-4xl mb-1">{medal}</div>
      <div
        className={`font-bold text-sm md:text-base truncate ${
          dark ? "text-white" : "text-gray-900"
        }`}
      >
        {row.user_display_name || row.user_email?.split("@")[0] || "Igrač"}
        {isMe && <span className="text-[10px] ml-1.5 text-amber-500">★</span>}
      </div>
      <div className={`text-2xl md:text-3xl font-black tabular-nums ${accentText}`}>
        {row.total_points}
        <span className="text-[10px] font-normal ml-1 text-theme-text-secondary">
          pts
        </span>
      </div>
      <div className={`text-[10px] uppercase tracking-wider mt-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>
        kat {row.category_points} · utakmice {row.match_points}
      </div>
    </div>
  );
}

// =============================================================
// Matches public tab — score predictions per fixture (UEFA-style)
// =============================================================
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

function isMatchLockedClient(
  m: Pick<Match, "kickoff_at" | "status" | "force_unlocked">,
): boolean {
  // Admin je ručno otključao — predikcije ostaju otvorene
  if (m.force_unlocked) return false;
  if (m.status !== "scheduled") return true;
  if (!m.kickoff_at) return false;
  return Date.now() >= Date.parse(m.kickoff_at);
}

function MatchesPublicTab({
  matches,
  myMatchPredictions,
  slug,
  authStatus,
  theme,
  accentText,
  accentBg,
  accentBorder,
  onSaved,
}: {
  matches: Match[];
  myMatchPredictions: MatchPrediction[];
  slug: string;
  authStatus: string;
  theme: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  onSaved: () => void;
}) {
  // local draft state — key: match_id, val: {home, away}
  type Draft = { home: number | null; away: number | null };
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0); // for re-rendering countdown

  // seed drafts from existing predictions
  useEffect(() => {
    const seeded: Record<string, Draft> = {};
    for (const p of myMatchPredictions) {
      seeded[p.match_id] = { home: p.home_score, away: p.away_score };
    }
    setDrafts(seeded);
  }, [myMatchPredictions]);

  // tick every 30s for countdown updates
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // group matches by stage
  const byStage = useMemo(() => {
    const m = new Map<string, Match[]>();
    for (const match of matches) {
      const arr = m.get(match.stage) ?? [];
      arr.push(match);
      m.set(match.stage, arr);
    }
    return Array.from(m.entries()).sort(
      (a, b) => STAGE_ORDER_PUB.indexOf(a[0]) - STAGE_ORDER_PUB.indexOf(b[0]),
    );
  }, [matches]);

  const update = (mid: string, patch: Partial<Draft>) =>
    setDrafts((d) => ({
      ...d,
      [mid]: { ...(d[mid] ?? { home: null, away: null }), ...patch },
    }));

  const completion = useMemo(() => {
    const total = matches.filter((m) => !isMatchLockedClient(m)).length;
    let done = 0;
    for (const m of matches) {
      if (isMatchLockedClient(m)) continue;
      const d = drafts[m.id];
      if (d?.home != null && d?.away != null) done += 1;
    }
    return { done, total };
  }, [matches, drafts, tick]);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const items = matches
        .filter((m) => !isMatchLockedClient(m))
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
        setError("Nema predikcija za snimanje. Unesi rezultate prvo.");
        setSaving(false);
        return;
      }
      const res = await fetch(`/api/predictor/tournaments/${slug}/match-predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Greška pri čuvanju");
      }
      setSavedAt(new Date());
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (matches.length === 0) {
    return (
      <div
        className={`rounded-lg border border-dashed p-10 text-center text-sm ${
          theme === "dark" ? "border-gray-700 text-gray-400" : "border-gray-300 text-gray-500"
        }`}
      >
        <Swords className="w-10 h-10 mx-auto mb-3 opacity-50" />
        Još nema rasporeda utakmica. Provjeri kasnije.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {authStatus !== "authenticated" && (
        <div
          className={`rounded-lg border p-4 flex items-center gap-3 ${
            theme === "dark"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <LogIn className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 text-sm">
            Prijavi se da bi predviđao rezultate utakmica i borio se za nagrade.
          </div>
          <button
            onClick={() => signIn()}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold text-black ${accentBg}`}
          >
            Prijava
          </button>
        </div>
      )}

      {/* progress */}
      {completion.total > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs text-theme-text-secondary mb-1.5">
            <span>Tvoje predikcije utakmica</span>
            <span className="font-semibold">
              {completion.done} / {completion.total}
            </span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"}`}>
            <motion.div
              className={`h-full ${accentBg}`}
              initial={{ width: 0 }}
              animate={{
                width: `${completion.total > 0 ? (completion.done / completion.total) * 100 : 0}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {byStage.map(([stage, list]) => (
        <div key={stage}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-1.5 h-6 rounded-full ${accentBg}`} />
            <h3
              className={`text-base font-black uppercase tracking-wide ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              {STAGE_LABELS_PUB[stage] ?? stage}
            </h3>
            <span className="text-xs text-theme-text-secondary">
              ({list.length} utakmica)
            </span>
          </div>
          <div className="space-y-2">
            {list.map((m) => {
              const d = drafts[m.id] ?? { home: null, away: null };
              const locked = isMatchLockedClient(m);
              const isFinished = m.status === "finished";
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
                  accentText={accentText}
                  accentBorder={accentBorder}
                  accentBg={accentBg}
                />
              );
            })}
          </div>
        </div>
      ))}

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 text-red-400 text-sm p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {completion.total > 0 && (
        <div
          className={`sticky bottom-4 mt-6 rounded-lg p-4 flex items-center justify-between gap-3 backdrop-blur-md ${
            theme === "dark"
              ? "bg-gray-900/85 border border-gray-700"
              : "bg-white/90 border border-gray-200 shadow-md"
          }`}
        >
          <div className="text-sm">
            {savedAt && (
              <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Snimljeno {savedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
          <button
            disabled={saving || authStatus !== "authenticated"}
            onClick={submit}
            className={`px-5 py-2.5 rounded-md font-bold text-sm text-black ${accentBg} disabled:opacity-50 inline-flex items-center gap-2`}
          >
            <Save className="w-4 h-4" />
            {saving ? "Čuvanje…" : "Sačuvaj predikcije"}
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
  accentText,
  accentBorder,
  accentBg,
}: {
  match: Match;
  draft: { home: number | null; away: number | null };
  onChange: (patch: { home?: number | null; away?: number | null }) => void;
  locked: boolean;
  disabled: boolean;
  isFinished: boolean;
  userPred: MatchPrediction | undefined;
  theme: string;
  accentText: string;
  accentBorder: string;
  accentBg: string;
}) {
  const dark = theme === "dark";

  // compute countdown to kickoff
  let countdown = "";
  let liveNow = match.status === "live";
  if (match.kickoff_at && match.status === "scheduled") {
    const ms = Date.parse(match.kickoff_at) - Date.now();
    if (ms > 0) {
      const minutes = Math.floor(ms / 60_000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      if (days > 0) countdown = `${days}d ${hours % 24}h`;
      else if (hours > 0) countdown = `${hours}h ${minutes % 60}m`;
      else if (minutes > 0) countdown = `${minutes}m`;
      else countdown = "uskoro";
    }
  }

  // user's prediction outcome
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
      ? { text: "Tačan rezultat", cls: "bg-emerald-500 text-black" }
      : predOutcome === "diff"
        ? { text: "Tačna razlika", cls: "bg-blue-500 text-white" }
        : predOutcome === "winner"
          ? { text: "Tačan pobjednik", cls: "bg-amber-500 text-black" }
          : predOutcome === "wrong"
            ? { text: "Pogrešno", cls: "bg-red-500 text-white" }
            : null;

  return (
    <div
      className={`rounded-lg p-4 transition-colors ${
        liveNow
          ? "border-2 border-red-500 ring-1 ring-red-500/40 " +
            (dark ? "bg-red-950/20" : "bg-red-50/40")
          : isFinished
            ? dark
              ? "bg-gray-800/40 border border-gray-700"
              : "bg-gray-50 border border-gray-200"
            : dark
              ? "bg-gray-800/60 border border-gray-700 hover:border-gray-600"
              : "bg-white border border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {liveNow && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-500 text-white animate-pulse inline-flex items-center gap-1">
              <Flame className="w-3 h-3" /> UŽIVO
            </span>
          )}
          {match.kickoff_at && (
            <span className="text-xs text-theme-text-secondary inline-flex items-center gap-1">
              <CalendarClock className="w-3.5 h-3.5" />
              {new Date(match.kickoff_at).toLocaleString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {match.venue && (
            <span className="text-xs text-theme-text-secondary inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {match.venue}
            </span>
          )}
        </div>
        {match.force_unlocked && !isFinished && !liveNow && (
          <span
            className={`text-[10px] uppercase font-bold inline-flex items-center gap-1 px-2 py-0.5 rounded ${
              dark
                ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/60"
                : "bg-emerald-100 text-emerald-700 border border-emerald-300"
            }`}
            title="Admin je produžio rok za predviđanje"
          >
            <Unlock className="w-3 h-3" /> Produženo
          </span>
        )}
        {locked && !isFinished && !liveNow && !match.force_unlocked && (
          <span className="text-xs inline-flex items-center gap-1 text-amber-500">
            <Lock className="w-3.5 h-3.5" /> Zaključano
          </span>
        )}
        {countdown && (
          <span className="text-xs inline-flex items-center gap-1 text-theme-text-secondary">
            <Clock className="w-3.5 h-3.5" /> {countdown}
          </span>
        )}
      </div>

      {/* MOBILE LAYOUT — stack vertically (<sm) */}
      <div className="sm:hidden">
        {/* Home row */}
        <div className="flex items-center gap-3">
          {match.home_logo_url && (
            <div
              className={`flex-shrink-0 rounded-sm overflow-hidden ring-1 ${dark ? "ring-gray-700" : "ring-gray-200"}`}
            >
              <Image
                src={match.home_logo_url}
                alt={match.home_team}
                width={40}
                height={28}
                className="w-10 h-7 object-cover"
                unoptimized
              />
            </div>
          )}
          <div
            className={`font-bold text-base flex-1 min-w-0 ${dark ? "text-white" : "text-gray-900"}`}
          >
            {match.home_team}
          </div>
          {isFinished && match.home_score != null ? (
            <div
              className={`text-2xl font-black tabular-nums flex-shrink-0 ${dark ? "text-white" : "text-gray-900"}`}
            >
              {match.home_score}
            </div>
          ) : (
            <input
              type="number"
              min={0}
              disabled={disabled}
              value={draft.home ?? ""}
              onChange={(e) =>
                onChange({
                  home: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="0"
              inputMode="numeric"
              className={`w-14 h-14 text-center text-2xl font-black tabular-nums leading-none rounded-lg border-2 outline-none transition-all flex-shrink-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                disabled
                  ? dark
                    ? "bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed placeholder-gray-700"
                    : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed placeholder-gray-300"
                  : draft.home != null
                    ? dark
                      ? "bg-amber-500/15 border-amber-500 text-amber-300"
                      : "bg-amber-50 border-amber-500 text-amber-700"
                    : dark
                      ? "bg-gray-900 border-gray-700 text-white placeholder-gray-600 focus:border-amber-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-300 focus:border-amber-500"
              }`}
            />
          )}
        </div>
        {/* Divider */}
        <div className="my-2 flex items-center gap-2">
          <div
            className={`flex-1 h-px ${dark ? "bg-gray-700" : "bg-gray-200"}`}
          />
          <span
            className={`text-[10px] uppercase font-bold tracking-widest ${dark ? "text-gray-500" : "text-gray-400"}`}
          >
            vs
          </span>
          <div
            className={`flex-1 h-px ${dark ? "bg-gray-700" : "bg-gray-200"}`}
          />
        </div>
        {/* Away row */}
        <div className="flex items-center gap-3">
          {match.away_logo_url && (
            <div
              className={`flex-shrink-0 rounded-sm overflow-hidden ring-1 ${dark ? "ring-gray-700" : "ring-gray-200"}`}
            >
              <Image
                src={match.away_logo_url}
                alt={match.away_team}
                width={40}
                height={28}
                className="w-10 h-7 object-cover"
                unoptimized
              />
            </div>
          )}
          <div
            className={`font-bold text-base flex-1 min-w-0 ${dark ? "text-white" : "text-gray-900"}`}
          >
            {match.away_team}
          </div>
          {isFinished && match.away_score != null ? (
            <div
              className={`text-2xl font-black tabular-nums flex-shrink-0 ${dark ? "text-white" : "text-gray-900"}`}
            >
              {match.away_score}
            </div>
          ) : (
            <input
              type="number"
              min={0}
              disabled={disabled}
              value={draft.away ?? ""}
              onChange={(e) =>
                onChange({
                  away: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="0"
              inputMode="numeric"
              className={`w-14 h-14 text-center text-2xl font-black tabular-nums leading-none rounded-lg border-2 outline-none transition-all flex-shrink-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                disabled
                  ? dark
                    ? "bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed placeholder-gray-700"
                    : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed placeholder-gray-300"
                  : draft.away != null
                    ? dark
                      ? "bg-amber-500/15 border-amber-500 text-amber-300"
                      : "bg-amber-50 border-amber-500 text-amber-700"
                    : dark
                      ? "bg-gray-900 border-gray-700 text-white placeholder-gray-600 focus:border-amber-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-300 focus:border-amber-500"
              }`}
            />
          )}
        </div>
        {isFinished && userPred && (
          <div className="mt-2 text-[11px] text-theme-text-secondary text-center">
            tvoja predikcija: {userPred.home_score} − {userPred.away_score}
          </div>
        )}
      </div>

      {/* TABLET+ LAYOUT — side by side (sm+) */}
      <div className="hidden sm:grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* Home team */}
        <div className="flex items-center gap-3 justify-end min-w-0">
          <div className="text-right min-w-0">
            <div className={`font-bold text-base md:text-lg truncate ${dark ? "text-white" : "text-gray-900"}`}>
              {match.home_team}
            </div>
          </div>
          {match.home_logo_url && (
            <div className={`flex-shrink-0 rounded-sm overflow-hidden ring-1 ${dark ? "ring-gray-700" : "ring-gray-200"}`}>
              <Image
                src={match.home_logo_url}
                alt={match.home_team}
                width={48}
                height={36}
                className="w-12 h-9 object-cover"
                unoptimized
              />
            </div>
          )}
        </div>

        {/* Score area */}
        <div className="flex items-center justify-center gap-2">
          {isFinished && match.home_score != null && match.away_score != null ? (
            <div className="text-center">
              <div className={`text-3xl font-black tabular-nums ${dark ? "text-white" : "text-gray-900"}`}>
                {match.home_score}
                <span className={dark ? "mx-2 text-gray-500" : "mx-2 text-gray-400"}>:</span>
                {match.away_score}
              </div>
              {userPred && (
                <div className="text-[11px] text-theme-text-secondary mt-1">
                  tvoja: {userPred.home_score} − {userPred.away_score}
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
                className={`w-16 h-16 text-center text-3xl font-black tabular-nums leading-none rounded-xl border-2 outline-none transition-all duration-200 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                  disabled
                    ? dark
                      ? "bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed placeholder-gray-700"
                      : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed placeholder-gray-300"
                    : draft.home != null
                      ? dark
                        ? "bg-amber-500/15 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10"
                        : "bg-amber-50 border-amber-500 text-amber-700 shadow-md shadow-amber-500/20"
                      : dark
                        ? "bg-gray-900 border-gray-700 text-white placeholder-gray-600 hover:border-gray-600 focus:border-amber-500 focus:shadow-lg focus:shadow-amber-500/10"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-300 hover:border-gray-400 focus:border-amber-500 focus:shadow-md focus:shadow-amber-500/10"
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
                className={`w-16 h-16 text-center text-3xl font-black tabular-nums leading-none rounded-xl border-2 outline-none transition-all duration-200 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                  disabled
                    ? dark
                      ? "bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed placeholder-gray-700"
                      : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed placeholder-gray-300"
                    : draft.away != null
                      ? dark
                        ? "bg-amber-500/15 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10"
                        : "bg-amber-50 border-amber-500 text-amber-700 shadow-md shadow-amber-500/20"
                      : dark
                        ? "bg-gray-900 border-gray-700 text-white placeholder-gray-600 hover:border-gray-600 focus:border-amber-500 focus:shadow-lg focus:shadow-amber-500/10"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-300 hover:border-gray-400 focus:border-amber-500 focus:shadow-md focus:shadow-amber-500/10"
                }`}
              />
            </>
          )}
        </div>

        {/* Away team */}
        <div className="flex items-center gap-3 min-w-0">
          {match.away_logo_url && (
            <div className={`flex-shrink-0 rounded-sm overflow-hidden ring-1 ${dark ? "ring-gray-700" : "ring-gray-200"}`}>
              <Image
                src={match.away_logo_url}
                alt={match.away_team}
                width={48}
                height={36}
                className="w-12 h-9 object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="min-w-0">
            <div className={`font-bold text-base md:text-lg truncate ${dark ? "text-white" : "text-gray-900"}`}>
              {match.away_team}
            </div>
          </div>
        </div>
      </div>

      {/* outcome badge for finished matches */}
      {outcomeBadge && (
        <div className="mt-3 pt-3 border-t border-theme-border flex items-center justify-between flex-wrap gap-2">
          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${outcomeBadge.cls}`}
          >
            {outcomeBadge.text}
          </span>
          {userPred && (
            <span className={`text-sm font-bold ${accentText}`}>
              +{userPred.points_awarded} pts
            </span>
          )}
        </div>
      )}

      {/* points info */}
      {!isFinished && !liveNow && !disabled && (
        <div className="mt-3 pt-2 border-t border-theme-border flex items-center justify-end gap-3 text-[10px] uppercase tracking-wide text-theme-text-secondary">
          <span>
            tačno = <span className={accentText}>{match.points_exact}</span>
          </span>
          <span>
            razlika = <span className={accentText}>{match.points_diff}</span>
          </span>
          <span>
            pobjednik = <span className={accentText}>{match.points_winner}</span>
          </span>
        </div>
      )}
    </div>
  );
}
