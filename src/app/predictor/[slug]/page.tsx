"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import LoadingCard from "@/components/shared/LoadingCard";
import WCBackground from "@/components/shared/WCBackground";
import WCMusicPlayer from "@/components/shared/WCMusicPlayer";
import ConfettiBurst from "@/components/shared/ConfettiBurst";
import QuickScoreChips from "@/components/shared/QuickScoreChips";
import StreakBadge from "@/components/shared/StreakBadge";
import SaveToast, {
  type SaveToastState,
} from "@/components/shared/SaveToast";
import { isWorldCupTheme } from "@/utils/wc-theme";
import { localizeTeamName } from "@/utils/country-names";
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
  X,
  ShieldCheck,
  Hourglass,
  UserCheck,
  Ban,
  Send,
  Edit3,
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
import {
  localizedTournamentName,
  localizedTournamentShort,
  localizedTournamentLong,
  localizedCategoryName,
  localizedCategoryDescription,
  localizedOptionLabel,
  localizedOptionGroup,
  localizedRuleTitle,
  localizedRuleBody,
  localizedRewardTitle,
  localizedRewardDescription,
  localizedMatchHomeTeam,
  localizedMatchAwayTeam,
  localizedMatchVenue,
  localizedMatchStageLabel,
  pickLocalizedNullable,
} from "@/utils/predictor-i18n";

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
  const { t, i18n, ready } = useTranslation("predictor");
  const lang = (i18n.language?.startsWith("en") ? "en" : "bs") as "en" | "bs";
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
  const [toast, setToast] = useState<SaveToastState>(null);
  const [categoryConfetti, setCategoryConfetti] = useState(0);
  // matches state
  const [matches, setMatches] = useState<Match[]>([]);
  const [myMatchPredictions, setMyMatchPredictions] = useState<
    MatchPrediction[]
  >([]);
  // membership (approval)
  const [membership, setMembership] = useState<{
    require_approval: boolean;
    member: { status: "pending" | "approved" | "rejected" | "banned" } | null;
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
      const editableCategories = tournament.categories.filter(
        (c) => !isLockedClient(tournament, c),
      );
      const items = editableCategories
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

      // Categories the user had previously saved but cleared in this
      // session — server should drop those rows, otherwise the old
      // value sticks because the upsert payload no longer mentions them.
      const previouslySavedIds = new Set(
        myPredictions.map((p) => p.category_id),
      );
      const delete_category_ids = editableCategories
        .filter((c) => {
          if (!previouslySavedIds.has(c.id)) return false;
          const d = draft[c.id];
          return !d || !hasEntry(c.category_type, d);
        })
        .map((c) => c.id);

      if (items.length === 0 && delete_category_ids.length === 0) {
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
          body: JSON.stringify({ items, delete_category_ids }),
        },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || t("saveFailed", "Save failed"));
      }
      setSavedAt(new Date());
      setCategoryConfetti((n) => n + 1);
      setToast({
        kind: "success",
        text: lang === "en" ? "Predictions saved" : "Predikcije sačuvane",
      });
      await loadMyPredictions();
    } catch (e: any) {
      setError(e.message);
      setToast({
        kind: "error",
        text:
          e?.message ||
          (lang === "en" ? "Save failed" : "Greška pri čuvanju"),
      });
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-sm"
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

  // WC theme is now driven explicitly by admin-picked fields on the
  // tournament — the slug-based auto-detect is only a fallback in case
  // older tournaments haven't been migrated yet.
  const themeBg = tournament.theme_background_image ?? null;
  const themeMusicEnabled = !!tournament.theme_music_enabled;
  const isWC = !!themeBg || themeMusicEnabled || isWorldCupTheme(tournament);

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden bg-theme-background">
      <SaveToast
        toast={toast}
        onDismiss={() => setToast(null)}
        anchor="bottom"
      />
      <ConfettiBurst trigger={categoryConfetti} />
      {themeBg && (
        <WCBackground
          variant="hero"
          src={themeBg}
          opacity={0.45}
          overlay={0.45}
          fixed
        />
      )}
      {themeMusicEnabled && <WCMusicPlayer />}
      {/* Hero */}
      <section className="relative z-10 overflow-hidden pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 md:pt-12">
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
              <div
                className={`flex-shrink-0 inline-flex items-center justify-center rounded-3xl w-20 h-20 md:w-24 md:h-24 ${
                  theme === "dark"
                    ? "bg-gray-900/60 border border-gray-700 shadow-lg shadow-black/20"
                    : "bg-white/90 border border-gray-200 shadow-md"
                }`}
              >
                <Image
                  src={tournament.logo_url}
                  alt={localizedTournamentName(tournament, lang)}
                  width={96}
                  height={96}
                  className="w-16 h-16 md:w-20 md:h-20 object-contain"
                  style={{
                    filter: getLogoFilter(
                      tournament.logo_url,
                      tournament.accent_color,
                    ),
                  }}
                />
              </div>
            ) : (
              <div
                className={`flex-shrink-0 inline-flex items-center justify-center rounded-3xl w-20 h-20 md:w-24 md:h-24 ${
                  theme === "dark"
                    ? "bg-gray-900/60 border border-gray-700"
                    : "bg-white/90 border border-gray-200 shadow-md"
                }`}
              >
                <Trophy className={`w-12 h-12 ${accentText}`} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1
                className={`text-2xl md:text-4xl font-black ${
                  theme === "dark" ? "text-white" : "text-gray-800"
                }`}
              >
                {localizedTournamentName(tournament, lang)}
              </h1>
              {localizedTournamentShort(tournament, lang) && (
                <p
                  className={`text-sm md:text-base mt-1 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {localizedTournamentShort(tournament, lang)}
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

        </div>
      </section>

      {/* Tabs — pill style, scrollable on mobile */}
      <section className="relative z-30 sticky top-0 bg-theme-background/90 backdrop-blur-md border-b border-theme-border">
        <div className="max-w-5xl mx-auto relative px-3 py-2.5">
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
                  className={`snap-start inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0 border ${
                    active
                      ? `${accentBg} text-black border-transparent shadow-md`
                      : theme === "dark"
                        ? "bg-gray-900/60 text-gray-300 border-gray-700 hover:border-amber-500/60 hover:text-amber-300"
                        : "bg-white/80 text-gray-700 border-gray-200 hover:border-amber-500/60 hover:text-amber-700"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {it.label}
                </button>
              );
            })}
          </div>
          <div
            className={`pointer-events-none absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-theme-background via-theme-background/70 to-transparent`}
          />
        </div>
      </section>

      {/* Content */}
      <section className="relative z-10 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {tab === "predictions" &&
            (membership?.require_approval && !membership?.can_predict ? (
              <MembershipWall
                membership={membership}
                authStatus={authStatus}
                joining={joining}
                theme={theme}
                accentBg={accentBg}
                onRequestJoin={requestJoin}
              />
            ) : (
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
                completion={completion}
                isFullyLocked={isFullyLocked}
                hasSavedPredictions={myPredictions.length > 0}
              />
            ))}

          {tab === "matches" &&
            (membership?.require_approval && !membership?.can_predict ? (
              <MembershipWall
                membership={membership}
                authStatus={authStatus}
                joining={joining}
                theme={theme}
                accentBg={accentBg}
                onRequestJoin={requestJoin}
              />
            ) : (
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
                notify={setToast}
                isWC={isWC}
                themeBgSrc={themeBg}
              />
            ))}

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
              isWC={isWC}
              themeBgSrc={themeBg}
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

// Hard validation — runs on save to catch incomplete categories. Returns a
// localized message per offending category so the user gets a clear list
// of what still needs to be filled in.
function collectIncompleteIssues(
  tournament: TournamentDetail,
  draft: Record<string, DraftEntry>,
  lang: "en" | "bs",
): { id: string; msg: string }[] {
  const issues: { id: string; msg: string }[] = [];
  const t = (bs: string, en: string) => (lang === "en" ? en : bs);

  for (const cat of tournament.categories) {
    const name = localizedCategoryName(cat, lang);
    const d = draft[cat.id];
    const sel = d?.selected ?? [];

    switch (cat.category_type) {
      case "single_choice":
      case "team_selection":
      case "player_selection":
        if (sel.length === 0) {
          issues.push({
            id: cat.id,
            msg: t(`„${name}" — odaberi ekipu`, `"${name}" — pick a team`),
          });
        }
        break;
      case "multiple_choice": {
        const need = cat.max_selections || 0;
        if (need > 0 && sel.length < need) {
          issues.push({
            id: cat.id,
            msg: t(
              `„${name}" — izabrao si ${sel.length}, treba ${need}`,
              `"${name}" — you picked ${sel.length}, need ${need}`,
            ),
          });
        } else if (need === 0 && sel.length === 0) {
          issues.push({
            id: cat.id,
            msg: t(`„${name}" je nepotpun`, `"${name}" is incomplete`),
          });
        }
        // Per-group hard rules (Šesnaestina finala): min 2 per group
        if (
          cat.slug === "sesnaestina-finala-32" ||
          cat.slug === "osmina-finala-16" ||
          cat.slug === "round-of-32" ||
          (cat.max_selections ?? 0) >= 24
        ) {
          const groupCount = new Map<string, number>();
          for (const o of cat.options) {
            if (sel.includes(o.id)) {
              const g = localizedOptionGroup(o, lang) ?? "";
              groupCount.set(g, (groupCount.get(g) ?? 0) + 1);
            }
          }
          // Make sure every group that exists in options has at least 2 picks
          const groupsSeen = new Set<string>();
          for (const o of cat.options) {
            const g = localizedOptionGroup(o, lang) ?? "";
            if (g) groupsSeen.add(g);
          }
          for (const g of groupsSeen) {
            const cnt = groupCount.get(g) ?? 0;
            if (cnt < 2) {
              issues.push({
                id: `${cat.id}-${g}`,
                msg: t(
                  `„${name}" — iz ${g} treba bar 2 ekipe (imaš ${cnt})`,
                  `"${name}" — group ${g} needs at least 2 picks (you have ${cnt})`,
                ),
              });
            }
          }
        }
        // 1-per-group hard rule (Pobjednici grupa): every group needs exactly 1
        if (cat.slug === "pobjednici-grupa") {
          const groupCount = new Map<string, number>();
          for (const o of cat.options) {
            if (sel.includes(o.id)) {
              const g = localizedOptionGroup(o, lang) ?? "";
              groupCount.set(g, (groupCount.get(g) ?? 0) + 1);
            }
          }
          const groupsSeen = new Set<string>();
          for (const o of cat.options) {
            const g = localizedOptionGroup(o, lang) ?? "";
            if (g) groupsSeen.add(g);
          }
          for (const g of groupsSeen) {
            const cnt = groupCount.get(g) ?? 0;
            if (cnt !== 1) {
              issues.push({
                id: `${cat.id}-${g}`,
                msg: t(
                  `„${name}" — ${g} treba tačno 1 pobjednika (imaš ${cnt})`,
                  `"${name}" — ${g} needs exactly 1 winner (you have ${cnt})`,
                ),
              });
            }
          }
        }
        break;
      }
      case "ranked_top_n": {
        const need = cat.max_selections || 0;
        if (need > 0 && sel.length < need) {
          issues.push({
            id: cat.id,
            msg: t(
              `„${name}" — rangiraj svih ${need} (imaš ${sel.length})`,
              `"${name}" — rank all ${need} (you have ${sel.length})`,
            ),
          });
        }
        break;
      }
      case "exact_score":
        if (d?.scoreHome == null || d?.scoreAway == null) {
          issues.push({
            id: cat.id,
            msg: t(
              `„${name}" — unesi oba rezultata`,
              `"${name}" — enter both scores`,
            ),
          });
        }
        break;
      case "numeric":
        if (d?.numeric == null || Number.isNaN(d.numeric)) {
          issues.push({
            id: cat.id,
            msg: t(`„${name}" — unesi broj`, `"${name}" — enter a number`),
          });
        }
        break;
      case "free_text":
        if (!d?.text?.trim()) {
          issues.push({
            id: cat.id,
            msg: t(`„${name}" — unesi odgovor`, `"${name}" — enter an answer`),
          });
        }
        break;
    }
  }
  return issues;
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
  completion,
  isFullyLocked,
  hasSavedPredictions,
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
  completion: { done: number; total: number };
  isFullyLocked: boolean;
  hasSavedPredictions: boolean;
}) {
  const { t, i18n } = useTranslation("predictor");
  const lang = (i18n.language?.startsWith("en") ? "en" : "bs") as "en" | "bs";

  const isFinished = tournament.status === "finished";
  const isComplete =
    completion.total > 0 && completion.done === completion.total;

  // Edit mode lets the user re-open the form after the summary view shows.
  // - If they already have saved predictions, default to summary view.
  // - Once they touch any option (or start with no saved data), stay in edit
  //   mode until they explicitly click Save. The summary never replaces the
  //   form mid-edit — the user keeps full control of when to commit.
  const [editMode, setEditMode] = useState(!hasSavedPredictions);

  // Sync editMode to saved-state on first load (if predictions arrive after
  // mount, switch to summary by default — but not once user has touched).
  const userTouchedRef = useRef(false);
  useEffect(() => {
    if (!userTouchedRef.current) {
      setEditMode(!hasSavedPredictions);
    }
  }, [hasSavedPredictions]);

  const update = (catId: string, patch: Partial<DraftEntry>) => {
    userTouchedRef.current = true;
    setEditMode(true);
    setDraft((d) => ({
      ...d,
      [catId]: { ...(d[catId] ?? emptyDraft()), ...patch },
    }));
  };

  const showSummary = !editMode && hasSavedPredictions && !isFullyLocked;

  // Validation state — slides in from the top when user tries to save with
  // incomplete categories. Holds the list of human-readable issues.
  const [validationErrors, setValidationErrors] = useState<
    { id: string; msg: string }[]
  >([]);

  // Wrap submit so that after saving we collapse back to the summary view.
  // Runs soft client-side validation: incomplete categories surface a
  // sticky warning banner, but we still save whatever IS complete so the
  // user never loses progress when working in partial passes.
  const handleSubmit = useCallback(() => {
    const issues = collectIncompleteIssues(tournament, draft, lang);
    setValidationErrors(issues);
    submit();
    userTouchedRef.current = false;
    if (issues.length === 0) {
      setEditMode(false);
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [tournament, draft, lang, submit]);

  if (showSummary) {
    return (
      <PredictionsSummary
        tournament={tournament}
        draft={draft}
        theme={theme}
        accentText={accentText}
        accentBg={accentBg}
        accentBorder={accentBorder}
        lang={lang}
        completion={completion}
        onEdit={() => setEditMode(true)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Validation banner — slides in from the top of the viewport when
          user tries to save with incomplete predictions. Fixed position so
          it floats over the page chrome and is impossible to miss. */}
      <AnimatePresence>
        {validationErrors.length > 0 && (
          <motion.div
            key="validation-banner"
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            className="fixed top-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-full sm:max-w-lg z-[60]"
          >
            <div
              role="alert"
              aria-live="polite"
              className={`rounded-2xl p-4 shadow-2xl border backdrop-blur-xl ${
                theme === "dark"
                  ? "bg-red-950/90 border-red-800/80 text-red-100"
                  : "bg-red-50/95 border-red-300 text-red-900"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center ${
                    theme === "dark"
                      ? "bg-red-900/60 text-red-200"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-tight">
                    {lang === "en"
                      ? "Saved — but these picks aren't complete yet"
                      : "Sačuvano — ali ove predikcije još nisu kompletne"}
                  </p>
                  <ul className="mt-1.5 space-y-1 text-[12px] leading-snug">
                    {validationErrors.slice(0, 6).map((e) => (
                      <li
                        key={e.id}
                        className="flex items-start gap-1.5 break-words"
                      >
                        <span
                          aria-hidden
                          className="flex-shrink-0 mt-1 w-1 h-1 rounded-full bg-current opacity-60"
                        />
                        <span>{e.msg}</span>
                      </li>
                    ))}
                    {validationErrors.length > 6 && (
                      <li
                        className={`text-[11px] italic ${theme === "dark" ? "text-red-300/70" : "text-red-700/70"}`}
                      >
                        +{validationErrors.length - 6} {lang === "en" ? "more" : "još"}
                      </li>
                    )}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => setValidationErrors([])}
                  aria-label={lang === "en" ? "Dismiss" : "Zatvori"}
                  className={`flex-shrink-0 p-1.5 rounded-xl transition-colors ${
                    theme === "dark"
                      ? "hover:bg-red-900/60 text-red-300"
                      : "hover:bg-red-100 text-red-700"
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isFullyLocked && completion.total > 0 && (
        <div
          className={`relative z-10 rounded-2xl p-5 sm:p-6 backdrop-blur-md ${
            theme === "dark"
              ? "bg-gray-900/70 border border-gray-700/60 shadow-lg shadow-black/20"
              : "bg-white/80 border border-gray-200/80 shadow-md"
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <span
              className={`text-sm font-semibold tracking-wide ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}
            >
              {t("progress", "Predictions completed")}
            </span>
            <span
              className={`text-sm font-black tabular-nums ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              {completion.done}
              <span
                className={`mx-1 font-medium ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
              >
                /
              </span>
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
                width: `${(completion.done / completion.total) * 100}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}
      {authStatus !== "authenticated" && !isFinished && (
        <div
          className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 ${
            theme === "dark"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <LogIn className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 text-sm">
            {t(
              "signInBanner.message",
              "Prijavi se da bi mogao podnijeti predikcije i takmičiti se za nagrade.",
            )}
          </div>
          <button
            onClick={() => signIn()}
            className={`px-4 py-2 rounded-2xl text-sm font-bold text-black ${accentBg} shadow-sm w-full sm:w-auto`}
          >
            {t("signIn", "Prijavi se")}
          </button>
        </div>
      )}

      {tournament.categories.length === 0 && (
        <div
          className={`rounded-2xl border border-dashed p-10 text-center text-sm ${
            theme === "dark"
              ? "border-gray-700 text-gray-400"
              : "border-gray-300 text-gray-500"
          }`}
        >
          {t("noCategories", "Još nema kategorija predikcija.")}
        </div>
      )}

      {tournament.categories.map((cat) => {
        const d = draft[cat.id] ?? emptyDraft();
        const locked = isLockedClient(tournament, cat);
        const disabled = locked || authStatus !== "authenticated";
        return (
          <div
            key={cat.id}
            className={`rounded-2xl border-l-4 ${accentBorder} ${
              theme === "dark"
                ? "bg-gray-800/60 border border-gray-700 shadow-md shadow-black/10"
                : "bg-white/80 border border-gray-200 shadow-sm"
            } p-3.5 sm:p-5`}
          >
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div className="min-w-0 flex-1">
                <h3 className={`text-[15px] sm:text-base font-bold leading-snug ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {localizedCategoryName(cat, lang)}
                </h3>
                {localizedCategoryDescription(cat, lang) && (
                  <p
                    className={`text-[12px] sm:text-sm mt-0.5 leading-snug ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {localizedCategoryDescription(cat, lang)}
                  </p>
                )}
              </div>
              <span
                className={`flex-shrink-0 inline-flex items-baseline gap-1 px-2 py-0.5 rounded-full whitespace-nowrap ${accentText} ${theme === "dark" ? "bg-gray-900 border border-gray-700" : "bg-amber-50 border border-amber-200"}`}
              >
                <span className="text-[13px] font-black tabular-nums leading-none">
                  {cat.points_correct}
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider leading-none">
                  pts
                </span>
              </span>
              {locked && (
                <span className="flex-shrink-0 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 inline-flex items-center gap-1 whitespace-nowrap">
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
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm p-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Spacer so content doesn't slide under the floating save bar */}
      {!isFinished && tournament.categories.length > 0 && (
        <div aria-hidden className="h-40 md:h-0" />
      )}

      {!isFinished && tournament.categories.length > 0 && (
        <div
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)",
          }}
          className={`fixed md:sticky md:!bottom-4 left-3 right-3 md:left-auto md:right-auto z-40 md:z-auto md:mt-6 rounded-3xl p-3 md:p-4 flex items-center justify-between gap-3 backdrop-blur-xl shadow-2xl md:shadow-md ${
            theme === "dark"
              ? "bg-gray-900/95 border border-gray-700"
              : "bg-white/95 border border-gray-200"
          }`}
        >
          <div className="text-xs text-theme-text-secondary hidden md:block">
            {savedAt && (
              <span className="flex items-center gap-1.5 opacity-70">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {savedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            {isComplete && (
              <button
                onClick={() => setEditMode(false)}
                className={`px-3 md:px-4 py-3 md:py-2.5 rounded-2xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors flex-shrink-0 ${
                  theme === "dark"
                    ? "bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
                aria-label="Otkaži"
              >
                <X className="w-4 h-4" />
                <span className="hidden md:inline">Otkaži</span>
              </button>
            )}
            <button
              disabled={saving || authStatus !== "authenticated"}
              onClick={handleSubmit}
              className={`flex-1 md:flex-initial px-5 py-3.5 md:py-3 rounded-2xl font-bold text-base text-black ${accentBg} disabled:opacity-50 inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-amber-500/20`}
            >
              <Save className="w-4 h-4" />
              {saving ? "Čuvanje…" : "Sačuvaj predikcije"}
            </button>
          </div>
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
  const { i18n, t } = useTranslation("predictor");
  const lang = (i18n.language?.startsWith("en") ? "en" : "bs") as "en" | "bs";

  // Transient validation message — appears for ~2.4s when a rule blocks
  // (e.g. trying to pick a 4th team from one group in Round of 32).
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null);
  const blockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashBlock = useCallback((msg: string) => {
    setBlockedMsg(msg);
    if (blockTimerRef.current) clearTimeout(blockTimerRef.current);
    blockTimerRef.current = setTimeout(() => setBlockedMsg(null), 2400);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.(28);
      } catch {
        /* ignore */
      }
    }
  }, []);

  // Build option-id → group-label map once per render so group-aware rules
  // can quickly resolve "which group does this pick belong to".
  const optGroupMap = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const o of category.options) {
      map.set(o.id, localizedOptionGroup(o, lang));
    }
    return map;
  }, [category.options, lang]);

  // Group-aware selection rules tied to specific template categories:
  // - pobjednici-grupa: EXACTLY 1 pick per group (replace previous on tap).
  // - sesnaestina-finala-32 (or similar ≥24-cap multi-choice): MAX 3 per
  //   group (block 4th tap), soft min 2 enforced via UI warning.
  const oneToOnePerGroup = category.slug === "pobjednici-grupa";
  const capPerGroup =
    category.category_type === "multiple_choice" &&
    (category.slug === "sesnaestina-finala-32" ||
      category.slug === "osmina-finala-16" ||
      category.slug === "round-of-32" ||
      (category.max_selections ?? 0) >= 24)
      ? 3
      : null;

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
      onChange({ selected: cur });
      return;
    }
    // Adding a new pick — apply group-aware rules first.
    const optGroup = optGroupMap.get(id) ?? null;
    if (oneToOnePerGroup && optGroup) {
      // Replace any previous pick from the same group (FIFO swap).
      const hadPrior = cur.some((pid) => optGroupMap.get(pid) === optGroup);
      const filtered = cur.filter((pid) => optGroupMap.get(pid) !== optGroup);
      filtered.push(id);
      while (filtered.length > (category.max_selections || filtered.length)) {
        filtered.shift();
      }
      onChange({ selected: filtered });
      if (hadPrior) {
        flashBlock(
          t("limits.groupOneHit", {
            defaultValue: "Iz svake grupe ide samo 1 — zamijenjeno",
          }) as string,
        );
      }
      return;
    }
    if (capPerGroup && optGroup) {
      const countInGroup = cur.filter(
        (pid) => optGroupMap.get(pid) === optGroup,
      ).length;
      if (countInGroup >= capPerGroup) {
        flashBlock(
          t("limits.groupCapHit", {
            group: optGroup,
            max: capPerGroup,
            defaultValue: `Iz grupe ${optGroup} maks. ${capPerGroup} ekipe`,
          }) as string,
        );
        return;
      }
    }
    if (cur.length >= (category.max_selections || 1)) {
      if (category.category_type === "ranked_top_n") {
        cur.push(id);
        if (cur.length > category.max_selections) {
          cur.shift();
          flashBlock(
            t("limits.rankedSwap", {
              max: category.max_selections,
              defaultValue: `Top ${category.max_selections} popunjen — prvi izbor zamijenjen`,
            }) as string,
          );
        }
      } else {
        flashBlock(
          t("limits.totalCapHit", {
            max: category.max_selections,
            defaultValue: `Maksimalno ${category.max_selections} ukupno`,
          }) as string,
        );
        return;
      }
    } else {
      cur.push(id);
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
    // group by group_label if present (localized)
    const groups = new Map<string, PredictionOption[]>();
    for (const o of category.options) {
      const key = localizedOptionGroup(o, lang) ?? "";
      const arr = groups.get(key) ?? [];
      arr.push(o);
      groups.set(key, arr);
    }
    const orderedGroups = Array.from(groups.entries());

    // Per-group rules for picker UI:
    //  - oneToOnePerGroup → exactly 1 must be picked from each group
    //  - capPerGroup      → min 2 / max 3 per group (Round of 32)
    const groupRule: "one" | "two-to-three" | null = oneToOnePerGroup
      ? "one"
      : capPerGroup
        ? "two-to-three"
        : null;
    const minPerGroup =
      groupRule === "one" ? 1 : groupRule === "two-to-three" ? 2 : 0;
    const maxPerGroup =
      groupRule === "one" ? 1 : groupRule === "two-to-three" ? 3 : null;

    // Pre-compute per-group selected counts so we can decorate group headers.
    const groupCounts = new Map<string, number>();
    if (groupRule) {
      const optIdToGroup = new Map<string, string>();
      for (const [gName, gOpts] of orderedGroups) {
        for (const o of gOpts) optIdToGroup.set(o.id, gName);
      }
      for (const id of draft.selected) {
        const gName = optIdToGroup.get(id);
        if (!gName) continue;
        groupCounts.set(gName, (groupCounts.get(gName) ?? 0) + 1);
      }
    }
    const ruleHint =
      groupRule === "one"
        ? lang === "en"
          ? "1 pick per group (auto-replaces previous)"
          : "Po 1 izbor iz svake grupe (auto-zamjena)"
        : groupRule === "two-to-three"
          ? lang === "en"
            ? "Min 2 · max 3 per group (32 total)"
            : "Min 2 · maks 3 po grupi (32 ukupno)"
          : null;

    return (
      <div className="space-y-2.5">
        {ruleHint && (
          <p
            className={`text-[11px] font-semibold px-0.5 ${theme === "dark" ? "text-amber-400" : "text-amber-700"}`}
          >
            {ruleHint}
          </p>
        )}
        {blockedMsg && (
          <div
            role="alert"
            aria-live="polite"
            className={`relative overflow-hidden rounded-xl px-3 py-2 text-[12px] font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${
              theme === "dark"
                ? "bg-red-950/40 text-red-200 border border-red-800/60"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="leading-tight">{blockedMsg}</span>
          </div>
        )}
        {orderedGroups.map(([groupName, opts]) => {
          const groupCount = groupCounts.get(groupName) ?? 0;
          const groupBelowMin =
            groupRule && groupName && groupCount < minPerGroup;
          const groupAtCap =
            groupRule && groupName && maxPerGroup != null && groupCount >= maxPerGroup;
          return (
          <div key={groupName} className="space-y-1.5">
            {groupName && (
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-theme-text-secondary">
                  {groupName}
                </span>
                {groupRule && (
                  <span
                    className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${
                      groupBelowMin
                        ? theme === "dark"
                          ? "bg-red-950/40 text-red-300 border border-red-800/60"
                          : "bg-red-50 text-red-700 border border-red-200"
                        : groupAtCap
                          ? theme === "dark"
                            ? "bg-amber-950/40 text-amber-300 border border-amber-800/60"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                          : theme === "dark"
                            ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/60"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {groupRule === "one"
                      ? `${groupCount}/1`
                      : `${groupCount}/${maxPerGroup} (min ${minPerGroup})`}
                  </span>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2">
              {opts.map((opt) => {
                const selectedIdx = draft.selected.indexOf(opt.id);
                const isSelected = selectedIdx >= 0;
                const rankBadge =
                  category.category_type === "ranked_top_n" && isSelected
                    ? selectedIdx + 1
                    : null;
                const showCorrect = showResults && opt.is_correct;
                const dark = theme === "dark";
                // Try to derive a country code from the image URL (flagcdn) when value is empty
                const codeFromUrl =
                  opt.image_url && /flagcdn\.com\/[^/]+\/([a-z-]+)\.png/i.exec(
                    opt.image_url,
                  )?.[1];
                const baseLabel = localizedOptionLabel(opt, lang);
                const localizedLabel =
                  // If admin provided an explicit EN label, prefer it as-is.
                  lang === "en" && opt.label_en?.trim()
                    ? opt.label_en
                    : opt.value || codeFromUrl
                      ? localizeTeamName(baseLabel, opt.value || codeFromUrl, lang)
                      : baseLabel;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleOption(opt.id)}
                    className={`group relative overflow-hidden text-left rounded-xl border p-2 sm:p-2.5 transition-all duration-200 active:scale-[0.98] ${
                      isSelected
                        ? dark
                          ? "border-amber-500/80 bg-gradient-to-br from-amber-500/15 via-amber-500/8 to-transparent shadow-md shadow-amber-500/15"
                          : "border-amber-500 bg-gradient-to-br from-amber-50 via-white to-white shadow-sm shadow-amber-500/20"
                        : dark
                          ? "border-gray-700/70 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-900/80"
                          : "border-gray-200 bg-white/90 hover:border-gray-300 hover:shadow-sm"
                    } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${
                      showCorrect ? "!ring-2 !ring-emerald-500" : ""
                    }`}
                  >
                    {/* selection halo */}
                    {isSelected && (
                      <span
                        aria-hidden
                        className={`pointer-events-none absolute -top-6 -right-6 w-16 h-16 rounded-full opacity-30 blur-2xl ${accentBg.split(" ")[0]}`}
                      />
                    )}
                    {rankBadge != null && (
                      <span
                        className={`absolute top-1 right-1 z-20 min-w-[20px] h-[20px] px-1 rounded-full ${accentBg} text-black text-[11px] font-black leading-none flex items-center justify-center shadow-md ring-2 ring-white dark:ring-gray-900 tabular-nums`}
                      >
                        {rankBadge}
                      </span>
                    )}
                    {isSelected && rankBadge == null && (
                      <CheckCircle2
                        className={`absolute top-1 right-1 z-10 w-3.5 h-3.5 ${accentText}`}
                      />
                    )}
                    {showCorrect && (
                      <CheckCircle2 className="absolute top-1 right-1 z-10 w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <div className="relative z-10 flex items-center gap-2">
                      {opt.image_url && (
                        <div
                          className={`flex-shrink-0 w-7 h-5 sm:w-8 sm:h-6 rounded-md overflow-hidden ring-1 ${
                            isSelected
                              ? dark
                                ? "ring-amber-500/60"
                                : "ring-amber-400"
                              : dark
                                ? "ring-gray-700"
                                : "ring-gray-200"
                          }`}
                        >
                          <Image
                            src={opt.image_url}
                            alt={localizedLabel}
                            width={32}
                            height={24}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <span
                        className={`text-[12px] sm:text-[13px] font-semibold leading-tight flex-1 min-w-0 break-words ${
                          isSelected
                            ? accentText
                            : dark
                              ? "text-gray-100"
                              : "text-gray-900"
                        }`}
                      >
                        {localizedLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          );
        })}
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
      <div className="flex items-center justify-center gap-2.5">
        <NumInput
          value={draft.scoreHome}
          onChange={(v) => onChange({ scoreHome: v })}
          disabled={disabled}
          placeholder="0"
        />
        <span className={`text-2xl font-black ${theme === "dark" ? "text-gray-600" : "text-gray-400"}`}>
          :
        </span>
        <NumInput
          value={draft.scoreAway}
          onChange={(v) => onChange({ scoreAway: v })}
          disabled={disabled}
          placeholder="0"
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
        placeholder="Tvoj odgovor"
        className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-[15px] font-semibold ${
          theme === "dark"
            ? "bg-gray-900 border-gray-700 focus:border-amber-500 placeholder-gray-600"
            : "bg-white border-gray-300 focus:border-amber-500 placeholder-gray-400"
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
      className={`${wide ? "w-full max-w-[10rem] text-center mx-auto block" : "w-20 text-center"} px-3 py-2.5 rounded-xl border outline-none text-lg font-black tabular-nums bg-theme-background border-theme-border focus:border-amber-500 disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
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
  const { i18n, t } = useTranslation("predictor");
  const lang = (i18n.language?.startsWith("en") ? "en" : "bs") as "en" | "bs";
  const rulesMd = pickLocalizedNullable(
    lang,
    tournament.rules_md,
    tournament.rules_md_en,
  );
  const pointMd = pickLocalizedNullable(
    lang,
    tournament.point_system_md,
    tournament.point_system_md_en,
  );
  const eligibilityMd = pickLocalizedNullable(
    lang,
    tournament.eligibility_md,
    tournament.eligibility_md_en,
  );
  return (
    <div className="space-y-4 max-w-3xl">
      {rulesMd && (
        <div
          className={`rounded-3xl border p-5 sm:p-6 ${theme === "dark" ? "bg-gray-800/60 border-gray-700 shadow-lg shadow-black/10" : "bg-white/80 border-gray-200 shadow-sm"}`}
        >
          <h3 className={`font-bold mb-2 ${accentText}`}>
            {t("rules.overview", "Overview")}
          </h3>
          <p className="whitespace-pre-wrap text-sm text-theme-text-secondary">
            {rulesMd}
          </p>
        </div>
      )}
      {pointMd && (
        <div
          className={`rounded-3xl border p-5 sm:p-6 ${theme === "dark" ? "bg-gray-800/60 border-gray-700 shadow-lg shadow-black/10" : "bg-white/80 border-gray-200 shadow-sm"}`}
        >
          <h3 className={`font-bold mb-2 ${accentText}`}>
            {t("rules.pointSystem", "Point system")}
          </h3>
          <p className="whitespace-pre-wrap text-sm text-theme-text-secondary">
            {pointMd}
          </p>
        </div>
      )}
      {eligibilityMd && (
        <div
          className={`rounded-3xl border p-5 sm:p-6 ${theme === "dark" ? "bg-gray-800/60 border-gray-700 shadow-lg shadow-black/10" : "bg-white/80 border-gray-200 shadow-sm"}`}
        >
          <h3 className={`font-bold mb-2 ${accentText}`}>
            {t("rules.eligibility", "Eligibility")}
          </h3>
          <p className="whitespace-pre-wrap text-sm text-theme-text-secondary">
            {eligibilityMd}
          </p>
        </div>
      )}
      {tournament.rules.length === 0 && !rulesMd && !pointMd && !eligibilityMd ? (
        <div
          className={`rounded-3xl border border-dashed p-10 text-center text-sm ${
            theme === "dark"
              ? "border-gray-700 text-gray-400"
              : "border-gray-300 text-gray-500"
          }`}
        >
          {t("rules.emptyState", "No rules published yet.")}
        </div>
      ) : (
        <div className="space-y-3">
          {tournament.rules.map((r) => {
            const ruleBody = localizedRuleBody(r, lang);
            return (
              <div
                key={r.id}
                className={`rounded-2xl border p-4 ${theme === "dark" ? "bg-gray-800/60 border-gray-700" : "bg-white/80 border-gray-200"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{localizedRuleTitle(r, lang)}</h4>
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
                {ruleBody && (
                  <p className="whitespace-pre-wrap text-sm text-theme-text-secondary">
                    {ruleBody}
                  </p>
                )}
              </div>
            );
          })}
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
  const { i18n, t } = useTranslation("predictor");
  const lang = (i18n.language?.startsWith("en") ? "en" : "bs") as "en" | "bs";
  if (tournament.rewards.length === 0) {
    return (
      <div
        className={`rounded-3xl border border-dashed p-10 text-center text-sm ${
          theme === "dark"
            ? "border-gray-700 text-gray-400"
            : "border-gray-300 text-gray-500"
        }`}
      >
        {t("rewards.emptyState", "No rewards configured yet.")}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tournament.rewards.map((r) => {
        const rewardTitle = localizedRewardTitle(r, lang);
        const rewardDesc = localizedRewardDescription(r, lang);
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
            className={`rounded-3xl border p-5 sm:p-6 ${theme === "dark" ? "bg-gray-800/60 border-gray-700 shadow-lg shadow-black/10" : "bg-white/80 border-gray-200 shadow-sm"}`}
          >
            <div className="flex items-start gap-3">
              <RankIcon className={`w-7 h-7 ${accentText} flex-shrink-0 mt-1`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold">{rewardTitle}</h4>
                  {r.rank_position && (
                    <span className={`text-xs font-bold ${accentText}`}>
                      #{r.rank_position}
                    </span>
                  )}
                </div>
                {rewardDesc && (
                  <p className="text-sm text-theme-text-secondary mt-1">
                    {rewardDesc}
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
                  alt={rewardTitle}
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
  isWC = false,
  themeBgSrc = null,
}: {
  standings: StandingsRow[];
  theme: string;
  accentText: string;
  accentBg: string;
  currentUserId?: string;
  isWC?: boolean;
  themeBgSrc?: string | null;
}) {
  const dark = theme === "dark";

  if (standings.length === 0) {
    return (
      <div
        className={`rounded-3xl border border-dashed p-12 text-center ${
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
    <div className="relative space-y-6">

      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3">
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
        <div className="relative z-10 grid grid-cols-3 gap-2 md:gap-4">
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

      {/* Full leaderboard — card-style rows */}
      <div
        className={`relative z-10 rounded-2xl border overflow-hidden backdrop-blur-sm ${
          dark ? "bg-gray-800/60 border-gray-700 shadow-md shadow-black/10" : "bg-white/85 border-gray-200 shadow-sm"
        }`}
      >
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 border-b ${
            dark ? "bg-gray-900/60 border-gray-700" : "bg-gray-50/80 border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Trophy className={`w-4 h-4 flex-shrink-0 ${accentText}`} />
            <h3 className={`text-sm font-bold leading-tight whitespace-nowrap ${dark ? "text-white" : "text-gray-900"}`}>
              Kompletna tabela
            </h3>
          </div>
          <span
            className={`text-[10px] uppercase tracking-wider font-bold flex-shrink-0 ${dark ? "text-gray-500" : "text-gray-500"}`}
          >
            po poenima
          </span>
        </div>
        <ul
          className={`divide-y ${dark ? "divide-gray-700/50" : "divide-gray-100"}`}
        >
          {(rest.length > 0 ? rest : standings).map((s) => {
            const isMe = currentUserId === s.user_id;
            const isTop3 = s.rank <= 3;
            const medal =
              s.rank === 1 ? "🥇" : s.rank === 2 ? "🥈" : s.rank === 3 ? "🥉" : null;
            const initial = (s.user_display_name || s.user_email || "?")
              .charAt(0)
              .toUpperCase();
            return (
              <li
                key={s.user_id}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 transition-colors ${
                  isMe
                    ? dark
                      ? "bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent"
                      : "bg-gradient-to-r from-amber-50 via-amber-50/40 to-transparent"
                    : dark
                      ? "hover:bg-gray-800/40"
                      : "hover:bg-gray-50/60"
                }`}
              >
                {isMe && (
                  <span
                    aria-hidden
                    className={`absolute left-0 top-0 bottom-0 w-1 ${accentBg.split(" ")[0]}`}
                  />
                )}
                {/* Rank + avatar combined */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span
                    className={`w-7 text-center text-[15px] font-black tabular-nums leading-none ${
                      isTop3
                        ? ""
                        : dark
                          ? "text-gray-500"
                          : "text-gray-400"
                    }`}
                  >
                    {medal ?? s.rank}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                      isMe
                        ? "bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-md shadow-amber-500/30"
                        : isTop3
                          ? dark
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                          : dark
                            ? "bg-gray-800 text-gray-300 border border-gray-700"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                    }`}
                  >
                    {initial}
                  </div>
                </div>
                {/* Name + sub-stats */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-sm font-bold break-words leading-tight ${
                        dark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {s.user_display_name ||
                        s.user_email?.split("@")[0] ||
                        "Igrač"}
                    </span>
                    {isMe && (
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          dark
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-amber-200/80 text-amber-900"
                        }`}
                      >
                        ti
                      </span>
                    )}
                  </div>
                  <div
                    className={`mt-0.5 text-[11px] flex items-center gap-2 ${dark ? "text-gray-500" : "text-gray-500"}`}
                  >
                    <span className="inline-flex items-baseline gap-1">
                      <span className="opacity-60">kategorije</span>
                      <span className={`font-bold tabular-nums ${dark ? "text-gray-300" : "text-gray-700"}`}>
                        {s.category_points}
                      </span>
                    </span>
                    <span className="opacity-30">·</span>
                    <span className="inline-flex items-baseline gap-1">
                      <span className="opacity-60">utakmice</span>
                      <span className={`font-bold tabular-nums ${dark ? "text-gray-300" : "text-gray-700"}`}>
                        {s.match_points}
                      </span>
                    </span>
                  </div>
                </div>
                {/* Total points */}
                <div className="flex-shrink-0 text-right">
                  <div
                    className={`inline-flex items-baseline gap-1 ${accentText}`}
                  >
                    <span className="text-xl font-black tabular-nums leading-none">
                      {s.total_points}
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-wider leading-none">
                      pts
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
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
      className={`relative overflow-hidden rounded-2xl p-3.5 border transition-colors ${
        highlight
          ? dark
            ? "bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/40 shadow-md shadow-amber-500/10"
            : "bg-gradient-to-br from-amber-50 via-white to-white border-amber-300 shadow-sm shadow-amber-500/10"
          : dark
            ? "bg-gray-800/60 border-gray-700"
            : "bg-white/85 border-gray-200 shadow-sm"
      }`}
    >
      {/* Decorative icon glow in the corner */}
      <Icon
        aria-hidden
        className={`absolute -right-2 -bottom-2 w-14 h-14 pointer-events-none ${
          highlight
            ? dark
              ? "text-amber-500/10"
              : "text-amber-400/15"
            : dark
              ? "text-gray-700/40"
              : "text-gray-200/70"
        }`}
        strokeWidth={1.5}
      />
      <div className="relative z-10 flex items-center gap-1.5 mb-1.5">
        <Icon
          className={`w-3 h-3 ${highlight ? "text-amber-500" : dark ? "text-gray-500" : "text-gray-400"}`}
        />
        <span
          className={`text-[10px] uppercase font-bold tracking-wider ${
            dark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {label}
        </span>
      </div>
      <div
        className={`relative z-10 text-2xl sm:text-3xl font-black tabular-nums leading-none ${
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
      className={`relative rounded-3xl border-2 p-3 md:p-4 ${colors} ${heightClass} flex flex-col justify-end ${
        isMe ? "ring-2 ring-amber-500/60" : ""
      }`}
    >
      <div className="text-3xl md:text-4xl mb-1">{medal}</div>
      <div
        className={`font-bold text-[13px] md:text-sm leading-tight break-words ${
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
  notify,
  isWC = false,
  themeBgSrc = null,
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
  notify?: (t: SaveToastState) => void;
  isWC?: boolean;
  themeBgSrc?: string | null;
}) {
  const { t, i18n } = useTranslation("predictor");
  const lang = (i18n.language?.startsWith("en") ? "en" : "bs") as
    | "en"
    | "bs";
  // local draft state — key: match_id, val: {home, away}
  type Draft = { home: number | null; away: number | null };
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0); // for re-rendering countdown
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [dirty, setDirty] = useState(false);

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

  const update = (mid: string, patch: Partial<Draft>) => {
    setDirty(true);
    setDrafts((d) => ({
      ...d,
      [mid]: { ...(d[mid] ?? { home: null, away: null }), ...patch },
    }));
  };

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
      if (authStatus !== "authenticated") {
        setError(t("errors.mustSignIn"));
        setSaving(false);
        return;
      }
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
        const reasons = skipped.map((s: any) => s.reason).join(", ");
        throw new Error(t("errors.matchSkipped", { reasons }));
      }
      setSavedAt(new Date());
      setDirty(false);
      setConfettiTrigger((n) => n + 1);
      notify?.({
        kind: "success",
        text:
          lang === "en"
            ? `${saved} match prediction${saved === 1 ? "" : "s"} saved`
            : `Sačuvano ${saved} predikcij${saved === 1 ? "a" : saved < 5 ? "e" : "a"}`,
      });
      onSaved();
      // Pull the user back to the top so they see their saved standings /
      // confetti instead of remaining buried at the save bar.
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (e: any) {
      const msg = e?.message || t("errors.unknown");
      setError(msg);
      notify?.({ kind: "error", text: msg });
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
              ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
              : "bg-amber-50 border-amber-200 text-amber-900"
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
            className={`px-4 py-2 rounded-2xl text-sm font-bold text-black ${accentBg} shadow-sm w-full sm:w-auto`}
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


      {byStage.map(([stage, list]) => (
        <div
          key={stage}
          className={`relative z-10 rounded-2xl p-3 sm:p-5 backdrop-blur-md ${
            theme === "dark"
              ? "bg-gray-900/60 border border-gray-700/50"
              : "bg-white/75 border border-gray-200/70 shadow-sm"
          }`}
        >
          <div
            className={`flex items-center gap-2 mb-3 pb-2.5 border-b ${
              theme === "dark" ? "border-gray-700/60" : "border-gray-200/80"
            }`}
          >
            <div className={`w-1 h-5 rounded-full ${accentBg}`} />
            <h3
              className={`text-sm font-black uppercase tracking-wider ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              {t(`stage.${stage}`, STAGE_LABELS_PUB[stage] ?? stage)}
            </h3>
            <span
              className={`text-[11px] font-medium ${
                theme === "dark" ? "text-gray-500" : "text-gray-500"
              }`}
            >
              {t("matchesCount", { count: list.length })}
            </span>
          </div>
          <div className="space-y-2.5">
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
                  lang={lang}
                />
              );
            })}
          </div>
        </div>
      ))}

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
      {completion.total > 0 && <div aria-hidden className="h-44 md:h-0" />}

      {completion.total > 0 && (
        <div
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)",
          }}
          className={`fixed md:sticky md:!bottom-4 left-3 right-3 md:left-auto md:right-auto z-40 md:z-20 md:mt-6 rounded-3xl p-3 md:p-4 backdrop-blur-xl shadow-2xl md:shadow-lg ${
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
                {savedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
          <button
            disabled={saving || authStatus !== "authenticated" || completion.done === 0}
            onClick={submit}
            className={`w-full px-5 py-4 sm:py-3.5 rounded-2xl font-black text-base sm:text-lg text-black ${accentBg} disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 active:scale-[0.99] transition-transform shadow-lg shadow-amber-500/30 ${dirty && completion.done > 0 && !saving ? "save-pulse" : ""}`}
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
                  0 10px 25px -5px rgba(245, 158, 11, 0.3),
                  0 0 0 0 rgba(245, 158, 11, 0.6);
              }
              50% {
                box-shadow:
                  0 12px 30px -5px rgba(245, 158, 11, 0.45),
                  0 0 0 10px rgba(245, 158, 11, 0);
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
}: {
  team: string;
  logo: string | null | undefined;
  finalScore: number | null;
  draft: number | null;
  disabled: boolean;
  onChange: (v: number | null) => void;
  dark: boolean;
}) {
  const showFinal = finalScore != null;
  const value = draft ?? 0;
  const inc = () => onChange(Math.min(99, (draft ?? 0) + 1));
  const dec = () => onChange(Math.max(0, (draft ?? 0) - 1));

  // Tap-team-to-score: tapping the team logo + name area increments by 1.
  // Long-press resets to 0 — same as the small "−" hammered to zero.
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
      {/* Team identity — tap to +1, hold to reset. Compact horizontal. */}
      <button
        type="button"
        onPointerDown={startHold}
        onPointerUp={() => endHold()}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onContextMenu={(e) => e.preventDefault()}
        disabled={disabled || showFinal}
        aria-label={`${team} — tap za +1 gol, drži za reset`}
        className={`flex-1 min-w-0 flex items-center gap-2 rounded-xl px-1.5 py-1 transition-all active:scale-[0.99] ${
          disabled || showFinal
            ? "cursor-default"
            : dark
              ? "cursor-pointer hover:bg-gray-700/40 active:bg-amber-500/15"
              : "cursor-pointer hover:bg-gray-100 active:bg-amber-50"
        } ${isWinner ? (dark ? "ring-1 ring-amber-500/40" : "ring-1 ring-amber-400/70") : ""}`}
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
      {/* Score controls — compact +/- with input */}
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
            aria-label="Smanji rezultat"
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black select-none transition-all active:scale-95 ${
              disabled || value === 0
                ? dark
                  ? "bg-gray-900/40 text-gray-600 cursor-not-allowed"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
                : dark
                  ? "bg-gray-800 text-amber-300 hover:bg-gray-700 active:bg-gray-700 border border-gray-700"
                  : "bg-white text-amber-600 hover:bg-amber-50 active:bg-amber-50 border border-gray-300"
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
                    ? "bg-amber-500/15 border-amber-500 text-amber-300"
                    : "bg-amber-50 border-amber-500 text-amber-700"
                  : dark
                    ? "bg-gray-900 border-gray-700 text-white placeholder-gray-600 focus:border-amber-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-300 focus:border-amber-500"
            }`}
          />
          <button
            type="button"
            onClick={inc}
            disabled={disabled || value >= 99}
            aria-label="Povećaj rezultat"
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black select-none transition-all active:scale-95 ${
              disabled
                ? dark
                  ? "bg-gray-900/40 text-gray-600 cursor-not-allowed"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-amber-500 text-black hover:bg-amber-400 active:bg-amber-400 border border-amber-400 shadow-sm shadow-amber-500/30"
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
  accentText,
  accentBorder,
  accentBg,
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
  accentText: string;
  accentBorder: string;
  accentBg: string;
  lang: "en" | "bs";
}) {
  const dark = theme === "dark";
  // Prefer admin-entered EN name when present; otherwise translate via code.
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

  // Tap-team-to-score handler (long-press = reset). Shared between home + away.
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

  // Winner glow ring derived from the draft scores.
  const homeLead =
    draft.home != null &&
    draft.away != null &&
    draft.home > draft.away;
  const awayLead =
    draft.home != null &&
    draft.away != null &&
    draft.away > draft.home;

  // compute countdown to kickoff
  let countdown = "";
  const liveNow = match.status === "live";
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
      className={`rounded-2xl p-3 sm:p-4 transition-colors ${
        liveNow
          ? "border-2 border-red-500 ring-1 ring-red-500/40 " +
            (dark ? "bg-red-950/20" : "bg-red-50/40")
          : isFinished
            ? dark
              ? "bg-gray-800/40 border border-gray-700"
              : "bg-gray-50 border border-gray-200"
            : dark
              ? "bg-gray-800/60 border border-gray-700 hover:border-gray-600 shadow-md shadow-black/10"
              : "bg-white border border-gray-200 hover:border-gray-300 shadow-sm"
      }`}
    >
      {/* Compact meta header — single inline row with the bits that matter */}
      <div className="flex items-center justify-between gap-2 mb-2.5 text-[11px]">
        <div className={`flex items-center gap-1.5 flex-wrap min-w-0 ${dark ? "text-gray-400" : "text-gray-500"}`}>
          {liveNow && (
            <span className="font-black uppercase px-1.5 py-0.5 rounded-md bg-red-500 text-white animate-pulse inline-flex items-center gap-1 text-[10px] shadow-sm shadow-red-500/30">
              <Flame className="w-2.5 h-2.5" /> UŽIVO
            </span>
          )}
          {stageLabel && (
            <span
              className={`uppercase font-bold tracking-wide ${dark ? "text-amber-400" : "text-amber-600"}`}
            >
              {stageLabel}
            </span>
          )}
          {match.kickoff_at && (
            <>
              {stageLabel && <span className="opacity-50">·</span>}
              <span className="inline-flex items-center gap-1 font-semibold">
                <CalendarClock className="w-3 h-3 opacity-70" />
                {new Date(match.kickoff_at).toLocaleString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {match.force_unlocked && !isFinished && !liveNow && (
            <span
              className={`text-[10px] uppercase font-bold inline-flex items-center gap-1 ${dark ? "text-emerald-400" : "text-emerald-600"}`}
              title="Admin je produžio rok za predviđanje"
            >
              <Unlock className="w-2.5 h-2.5" /> Produženo
            </span>
          )}
          {locked && !isFinished && !liveNow && !match.force_unlocked && (
            <span className="text-[10px] uppercase font-bold inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Lock className="w-2.5 h-2.5" /> Zaključano
            </span>
          )}
          {countdown && (
            <span
              className={`font-bold tabular-nums inline-flex items-center gap-1 ${dark ? "text-amber-400" : "text-amber-600"}`}
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

      {/* MOBILE LAYOUT — stack vertically (<sm) */}
      <div className="sm:hidden">
        {/* Home row */}
        <ScoreRow
          team={homeName}
          logo={match.home_logo_url}
          finalScore={isFinished ? match.home_score : null}
          draft={draft.home}
          disabled={disabled}
          onChange={(v) => onChange({ home: v })}
          dark={dark}
        />
        {/* Subtle divider between teams */}
        <div className="my-1.5 flex items-center justify-center">
          <span
            className={`text-[9px] uppercase font-bold tracking-[0.25em] ${dark ? "text-gray-600" : "text-gray-400"}`}
          >
            vs
          </span>
        </div>
        {/* Away row */}
        <ScoreRow
          team={awayName}
          logo={match.away_logo_url}
          finalScore={isFinished ? match.away_score : null}
          draft={draft.away}
          disabled={disabled}
          onChange={(v) => onChange({ away: v })}
          dark={dark}
        />
        {!isFinished && (
          <QuickScoreChips
            homeName={homeName}
            awayName={awayName}
            selected={draft}
            disabled={disabled}
            onPick={(h, a) => onChange({ home: h, away: a })}
            theme={theme}
          />
        )}
        {isFinished && userPred && (
          <div className="mt-2 text-[11px] text-theme-text-secondary text-center">
            tvoja predikcija: {userPred.home_score} − {userPred.away_score}
          </div>
        )}
      </div>

      {/* TABLET+ LAYOUT — side by side (sm+) */}
      <div className="hidden sm:grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* Home team — tap to add a goal, long-press to reset */}
        <button
          type="button"
          onPointerDown={() => startHold("home")}
          onPointerUp={() => endHold("home")}
          onPointerLeave={() => cancelHold("home")}
          onPointerCancel={() => cancelHold("home")}
          onContextMenu={(e) => e.preventDefault()}
          disabled={disabled || isFinished}
          aria-label={`${homeName} — tap za +1 gol, drži za reset`}
          className={`flex items-center gap-3 justify-end min-w-0 rounded-2xl px-3 py-2 transition-all active:scale-[0.98] ${
            disabled || isFinished
              ? "cursor-default"
              : dark
                ? "cursor-pointer hover:bg-gray-700/40 active:bg-amber-500/15"
                : "cursor-pointer hover:bg-gray-100 active:bg-amber-100"
          } ${homeLead ? (dark ? "ring-2 ring-amber-500/50 bg-amber-500/10" : "ring-2 ring-amber-400 bg-amber-50") : ""}`}
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

        {/* Score area */}
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
                className={`w-20 h-20 text-center text-4xl font-black tabular-nums leading-none rounded-2xl border-2 outline-none transition-all duration-200 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
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
                className={`w-20 h-20 text-center text-4xl font-black tabular-nums leading-none rounded-2xl border-2 outline-none transition-all duration-200 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
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

        {/* Away team — tap to add a goal, long-press to reset */}
        <button
          type="button"
          onPointerDown={() => startHold("away")}
          onPointerUp={() => endHold("away")}
          onPointerLeave={() => cancelHold("away")}
          onPointerCancel={() => cancelHold("away")}
          onContextMenu={(e) => e.preventDefault()}
          disabled={disabled || isFinished}
          aria-label={`${awayName} — tap za +1 gol, drži za reset`}
          className={`flex items-center gap-3 min-w-0 rounded-2xl px-3 py-2 transition-all active:scale-[0.98] ${
            disabled || isFinished
              ? "cursor-default"
              : dark
                ? "cursor-pointer hover:bg-gray-700/40 active:bg-amber-500/15"
                : "cursor-pointer hover:bg-gray-100 active:bg-amber-100"
          } ${awayLead ? (dark ? "ring-2 ring-amber-500/50 bg-amber-500/10" : "ring-2 ring-amber-400 bg-amber-50") : ""}`}
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

      {/* Quick score chips (tablet+ only — mobile renders them inside the stacked layout) */}
      {!isFinished && (
        <div className="hidden sm:block">
          <QuickScoreChips
            homeName={homeName}
            awayName={awayName}
            selected={draft}
            disabled={disabled}
            onPick={(h, a) => onChange({ home: h, away: a })}
            theme={theme}
          />
        </div>
      )}

      {/* outcome badge for finished matches */}
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

      {/* Compact points info — single inline strip, not chips */}
      {!isFinished && !liveNow && !disabled && (
        <div
          className={`mt-2.5 pt-2 border-t flex items-center justify-end gap-3 text-[10px] uppercase tracking-wider font-bold ${dark ? "border-gray-700/60 text-gray-500" : "border-gray-200/80 text-gray-500"}`}
        >
          <span>
            {lang === "en" ? "Exact" : "Tačno"}{" "}
            <span className={`${dark ? "text-amber-400" : "text-amber-600"} font-black`}>
              {match.points_exact}
            </span>
          </span>
          <span className="opacity-30">·</span>
          <span>
            {lang === "en" ? "Margin" : "Razlika"}{" "}
            <span className={`${dark ? "text-amber-400" : "text-amber-600"} font-black`}>
              {match.points_diff}
            </span>
          </span>
          <span className="opacity-30">·</span>
          <span>
            {lang === "en" ? "Winner" : "Pobjednik"}{" "}
            <span className={`${dark ? "text-amber-400" : "text-amber-600"} font-black`}>
              {match.points_winner}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Predictions summary card — shows when the user has filled in every
// category. Renders one row per category with the picked answer pretty
// printed (flag + label / score / value), plus a single Edit button that
// re-opens the full prediction form.
// ===========================================================================
function PredictionsSummary({
  tournament,
  draft,
  theme,
  accentText,
  accentBg,
  accentBorder,
  lang,
  completion,
  onEdit,
}: {
  tournament: TournamentDetail;
  draft: Record<string, DraftEntry>;
  theme: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  lang: "en" | "bs";
  completion: { done: number; total: number };
  onEdit: () => void;
}) {
  const dark = theme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Hero summary card — refined: no halos, single small check pill,
          horizontal layout on mobile too, edit button as a compact pill. */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 ${
          dark
            ? "bg-gray-950/60 border-gray-800/80"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className={`flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
              dark
                ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
            }`}
          >
            <CheckCircle2 className="w-6 h-6" strokeWidth={2.25} />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                dark ? "text-emerald-400" : "text-emerald-600"
              }`}
            >
              {lang === "en" ? "All set" : "Sve spremno"}
            </p>
            <h2
              className={`text-base sm:text-lg font-bold leading-tight mt-0.5 ${
                dark ? "text-white" : "text-gray-900"
              }`}
            >
              {lang === "en"
                ? "Predictions locked in"
                : "Predikcije su spremne"}
            </h2>
            <p
              className={`text-xs sm:text-sm mt-0.5 ${
                dark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {completion.done}/{completion.total}{" "}
              {lang === "en" ? "answered" : "odgovoreno"}
            </p>
          </div>
          <button
            onClick={onEdit}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-bold transition-colors ${
              dark
                ? "bg-gray-800 text-gray-100 hover:bg-gray-700 border border-gray-700"
                : "bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200"
            }`}
            aria-label={lang === "en" ? "Edit picks" : "Izmijeni"}
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">
              {lang === "en" ? "Edit" : "Izmijeni"}
            </span>
          </button>
        </div>
      </div>

      {/* One row per category — refined, less heavy, mobile-first */}
      <div className="space-y-2">
        {tournament.categories.map((cat, idx) => {
          const d = draft[cat.id] ?? emptyDraft();
          return (
            <div
              key={cat.id}
              className={`relative rounded-xl ${
                dark
                  ? "bg-gray-900/60 border border-gray-700/60"
                  : "bg-white/95 border border-gray-200/80"
              } px-3 py-2.5 sm:px-4 sm:py-3`}
            >
              <span
                aria-hidden
                className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${accentBg.split(" ")[0]}`}
              />
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
                  <span
                    className={`text-[10px] font-bold tabular-nums leading-none ${
                      dark ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {idx + 1}.
                  </span>
                  <h3
                    className={`text-[13px] sm:text-sm font-bold leading-snug break-words ${
                      dark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {localizedCategoryName(cat, lang)}
                  </h3>
                </div>
                <span
                  className={`flex-shrink-0 inline-flex items-baseline gap-0.5 ${accentText}`}
                >
                  <span className="text-[13px] font-black tabular-nums leading-none">
                    {cat.points_correct}
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-wider leading-none opacity-70">
                    pts
                  </span>
                </span>
              </div>
              <SummaryAnswer
                category={cat}
                draft={d}
                theme={theme}
                lang={lang}
                accentText={accentText}
              />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Renders the user's selected answer for a single category. Picks the
// right shape based on category_type (option pill / score / number / text).
function SummaryAnswer({
  category,
  draft,
  theme,
  lang,
  accentText,
}: {
  category: PredictionCategory & { options: PredictionOption[] };
  draft: DraftEntry;
  theme: string;
  lang: "en" | "bs";
  accentText: string;
}) {
  const dark = theme === "dark";

  const optionById = useMemo(() => {
    const m = new Map<string, PredictionOption>();
    for (const o of category.options) m.set(o.id, o);
    return m;
  }, [category.options]);

  const localizedOptionName = (opt: PredictionOption) => {
    const codeFromUrl =
      opt.image_url &&
      /flagcdn\.com\/[^/]+\/([a-z-]+)\.png/i.exec(opt.image_url)?.[1];
    const baseLabel = localizedOptionLabel(opt, lang);
    return lang === "en" && opt.label_en?.trim()
      ? opt.label_en
      : opt.value || codeFromUrl
        ? localizeTeamName(baseLabel, opt.value || codeFromUrl, lang)
        : baseLabel;
  };

  // Pill — kept for single_choice (one team highlighted as the pick).
  const renderOptionPill = (opt: PredictionOption) => {
    const localized = localizedOptionName(opt);
    return (
      <span
        key={opt.id}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold text-[12px] max-w-full ${
          dark
            ? "bg-gray-800/60 text-gray-100 ring-1 ring-gray-700"
            : "bg-gray-50 text-gray-800 ring-1 ring-gray-200"
        }`}
      >
        {opt.image_url && (
          <Image
            src={opt.image_url}
            alt=""
            width={20}
            height={14}
            className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0"
            unoptimized
          />
        )}
        <span className="truncate min-w-0">{localized}</span>
      </span>
    );
  };

  // Row — for multi-pick categories. Renders as a discreet table-like list
  // with a numbered badge so order is obvious (1, 2, 3, 4…).
  const renderOptionRow = (
    opt: PredictionOption,
    rank: number,
    showRank: boolean,
  ) => {
    const localized = localizedOptionName(opt);
    return (
      <li
        key={opt.id}
        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg ${
          dark
            ? "bg-gray-800/50 ring-1 ring-gray-700/60"
            : "bg-gray-50 ring-1 ring-gray-200/80"
        }`}
      >
        {showRank && (
          <span
            className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black tabular-nums bg-amber-500 text-black shadow-sm shadow-amber-500/30`}
          >
            {rank}
          </span>
        )}
        {opt.image_url && (
          <div
            className={`flex-shrink-0 rounded overflow-hidden ring-1 ${dark ? "ring-gray-700" : "ring-gray-200"}`}
          >
            <Image
              src={opt.image_url}
              alt=""
              width={22}
              height={16}
              className="w-[22px] h-4 object-cover"
              unoptimized
            />
          </div>
        )}
        <span
          className={`text-[12px] font-semibold leading-tight min-w-0 break-words ${dark ? "text-gray-100" : "text-gray-900"}`}
        >
          {localized}
        </span>
      </li>
    );
  };

  switch (category.category_type) {
    case "single_choice":
    case "team_selection":
    case "player_selection": {
      const picked = draft.selected[0]
        ? optionById.get(draft.selected[0])
        : null;
      if (!picked) return <EmptyAnswer dark={dark} lang={lang} />;
      return <div className="flex flex-wrap gap-1.5">{renderOptionPill(picked)}</div>;
    }
    case "multiple_choice": {
      const picks = draft.selected
        .map((id) => optionById.get(id))
        .filter(Boolean) as PredictionOption[];
      if (picks.length === 0) return <EmptyAnswer dark={dark} lang={lang} />;
      return (
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {picks.map((p, i) => renderOptionRow(p, i + 1, false))}
        </ol>
      );
    }
    case "ranked_top_n": {
      const picks = draft.selected
        .map((id) => optionById.get(id))
        .filter(Boolean) as PredictionOption[];
      if (picks.length === 0) return <EmptyAnswer dark={dark} lang={lang} />;
      return (
        <ol className="space-y-1.5">
          {picks.map((p, i) => renderOptionRow(p, i + 1, true))}
        </ol>
      );
    }
    case "exact_score": {
      if (draft.scoreHome == null || draft.scoreAway == null)
        return <EmptyAnswer dark={dark} lang={lang} />;
      return (
        <div className="inline-flex items-baseline gap-2">
          <span className={`text-xl font-black tabular-nums leading-none ${accentText}`}>
            {draft.scoreHome}
          </span>
          <span
            className={`text-base font-bold leading-none ${dark ? "text-gray-600" : "text-gray-400"}`}
          >
            :
          </span>
          <span className={`text-xl font-black tabular-nums leading-none ${accentText}`}>
            {draft.scoreAway}
          </span>
        </div>
      );
    }
    case "numeric": {
      if (draft.numeric == null) return <EmptyAnswer dark={dark} lang={lang} />;
      return (
        <span className={`text-xl font-black tabular-nums ${accentText}`}>
          {draft.numeric}
        </span>
      );
    }
    case "free_text": {
      if (!draft.text.trim()) return <EmptyAnswer dark={dark} lang={lang} />;
      return (
        <p
          className={`text-[13px] font-bold leading-snug break-words ${
            dark ? "text-white" : "text-gray-900"
          }`}
        >
          {draft.text}
        </p>
      );
    }
    default:
      return <EmptyAnswer dark={dark} lang={lang} />;
  }
}

function EmptyAnswer({ dark, lang }: { dark: boolean; lang: "en" | "bs" }) {
  return (
    <p
      className={`text-sm italic ${dark ? "text-gray-500" : "text-gray-400"}`}
    >
      {lang === "en" ? "No pick yet" : "Bez odgovora"}
    </p>
  );
}

// ===========================================================================
// Membership shape and a single refined gate component used in place of
// the prediction form when the tournament requires approval. One card,
// quiet styling — no glow halos, no shake animations.
// ===========================================================================
type MembershipShape = {
  require_approval: boolean;
  member: { status: "pending" | "approved" | "rejected" | "banned" } | null;
  can_predict: boolean;
};


// ===========================================================================
// MembershipWall — replaces the prediction form when require_approval=true
// and the user is not yet approved. Mirrors the banner styling but bigger
// so it owns the tab content area.
// ===========================================================================
function MembershipWall({
  membership,
  authStatus,
  joining,
  theme,
  accentBg,
  onRequestJoin,
}: {
  membership: MembershipShape;
  authStatus: string;
  joining: boolean;
  theme: string;
  accentBg: string;
  onRequestJoin: () => void;
}) {
  const dark = theme === "dark";
  const status = membership.member?.status;

  // Single quiet card. No gradients, no glow halos, no shake. Accent
  // colour shows up only on the icon and the kicker label — the rest
  // is plain card chrome so the message reads at a glance.
  let accent: "amber" | "red" = "amber";
  let kicker = "Zatvoreni turnir";
  let title = "Zatraži učešće u turniru";
  let subtitle =
    "Admin pregleda svaki zahtjev. Čim te odobri, predikcije se otključavaju automatski.";
  let Icon = ShieldCheck;
  let cta: React.ReactNode = (
    <button
      onClick={authStatus === "authenticated" ? onRequestJoin : () => signIn()}
      disabled={joining}
      className={`mt-2 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-black ${accentBg} disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] transition-all`}
    >
      {authStatus !== "authenticated" ? (
        <>
          <LogIn className="w-4 h-4" />
          Prijavi se da zatražiš
        </>
      ) : joining ? (
        <>
          <Hourglass className="w-4 h-4 animate-spin" />
          Slanje…
        </>
      ) : (
        <>
          <Send className="w-4 h-4" />
          Zatraži učešće
        </>
      )}
    </button>
  );

  if (status === "pending") {
    kicker = "Na čekanju";
    title = "Zahtjev poslan";
    subtitle =
      "Admin će pregledati tvoj zahtjev. Otključat ćemo predikcije čim odobri — nema potrebe da osvježavaš.";
    Icon = Hourglass;
    cta = null;
  } else if (status === "rejected" || status === "banned") {
    accent = "red";
    kicker = status === "banned" ? "Blokiran" : "Odbijen";
    title = status === "banned" ? "Nalog je blokiran" : "Zahtjev je odbijen";
    subtitle =
      "Kontaktiraj admina ako misliš da je greška. Tabela i pravila ostaju vidljivi.";
    Icon = Ban;
    cta = null;
  }

  const accentText =
    accent === "amber"
      ? dark
        ? "text-amber-300"
        : "text-amber-600"
      : dark
        ? "text-red-300"
        : "text-red-500";
  const accentIconBg =
    accent === "amber"
      ? dark
        ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/25"
        : "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
      : dark
        ? "bg-red-500/10 text-red-400 ring-1 ring-red-500/25"
        : "bg-red-50 text-red-500 ring-1 ring-red-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`rounded-2xl border px-6 py-10 sm:px-10 sm:py-14 ${
        dark
          ? "bg-gray-950/60 border-gray-800/80"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="mx-auto max-w-md flex flex-col items-center text-center gap-5">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${accentIconBg}`}
        >
          <Icon className="w-7 h-7" strokeWidth={2} />
        </div>
        <div className="space-y-2">
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.2em] ${accentText}`}
          >
            {kicker}
          </p>
          <h2
            className={`text-xl sm:text-2xl font-bold leading-tight ${
              dark ? "text-white" : "text-gray-900"
            }`}
          >
            {title}
          </h2>
          <p
            className={`text-sm leading-relaxed max-w-sm mx-auto ${
              dark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {subtitle}
          </p>
        </div>
        {cta}
      </div>
    </motion.div>
  );
}
