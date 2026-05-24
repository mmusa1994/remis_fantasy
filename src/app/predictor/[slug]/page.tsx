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
import { useToast } from "@/contexts/ToastContext";
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
} from "@/types/predictor";
import { getLogoFilter } from "@/utils/predictor-logo";
import {
  getAccentClasses,
  type AccentClasses,
} from "@/utils/predictor-accent";
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
  pickLocalizedNullable,
} from "@/utils/predictor-i18n";
import MatchesPublicTab from "./_components/MatchesPublicTab";

type CategoryWithOptions = PredictionCategory & { options: PredictionOption[] };
type TournamentDetail = Tournament & {
  categories: CategoryWithOptions[];
  rules: TournamentRule[];
  rewards: TournamentReward[];
};

type PageTab = "predictions" | "matches" | "rules" | "rewards" | "standings";

// Accent class bundles live in @/utils/predictor-accent so every
// surface on the page picks up the admin-chosen tournament color.

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
  const { showToast } = useToast();
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
      showToast(t("owner.toast.predictionsSaved", "Predictions saved"));
      await loadMyPredictions();
    } catch (e: any) {
      setError(e.message);
      showToast(
        e?.message || t("owner.toast.genericError", "Something went wrong"),
        "error",
      );
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
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold shadow-sm border ${
              theme === "dark"
                ? "bg-gray-800/80 text-gray-100 border-gray-700 hover:bg-gray-700/80"
                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
            }`}
          >
            ← {t("backToList", "Back to tournaments")}
          </Link>
        </div>
      </main>
    );
  }

  const ac = getAccentClasses(tournament.accent_color);
  const accentBorder = ac.border;
  const accentText = ac.text;
  const accentBg = ac.bg;
  const accentRing = ac.ring;

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
              <span
                className={`inline-flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-full border ${
                  theme === "dark"
                    ? "bg-white/5 text-theme-foreground/85 border-white/10"
                    : "bg-black/[0.03] text-theme-foreground/80 border-black/10"
                }`}
              >
                <Trophy className="w-4 h-4 opacity-70" />
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
                      ? `${accentBg} ${ac.textOn} ${ac.border500} shadow-md ${ac.shadow500_20}`
                      : theme === "dark"
                        ? `bg-gray-900/60 text-gray-300 border-gray-700 ${ac.hoverBorder500_60} ${ac.hoverTextDark}`
                        : `bg-white/80 text-gray-700 border-gray-200 ${ac.hoverBorder500_60} ${ac.hoverTextLight}`
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {it.label}
                </button>
              );
            })}
          </div>
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
                ac={ac}
                onRequestJoin={requestJoin}
              />
            ) : (
              <PredictionsTab
                tournament={tournament}
                draft={draft}
                setDraft={setDraft}
                authStatus={authStatus}
                ac={ac}
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
                ac={ac}
                onRequestJoin={requestJoin}
              />
            ) : (
              <MatchesPublicTab
                matches={matches}
                myMatchPredictions={myMatchPredictions}
                slug={String(slug)}
                authStatus={authStatus}
                theme={theme}
                ac={ac}
                onSaved={loadMyMatchPredictions}
                isWC={isWC}
                themeBgSrc={themeBg}
              />
            ))}

          {tab === "rules" && (
            <RulesTab
              tournament={tournament}
              theme={theme}
              ac={ac}
            />
          )}
          {tab === "rewards" && (
            <RewardsTab
              tournament={tournament}
              theme={theme}
              ac={ac}
            />
          )}
          {tab === "standings" && (
            <StandingsTab
              standings={standings}
              theme={theme}
              ac={ac}
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
  ac,
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
  ac: AccentClasses;
  theme: string;
  saving: boolean;
  error: string | null;
  savedAt: Date | null;
  submit: () => void;
  completion: { done: number; total: number };
  isFullyLocked: boolean;
  hasSavedPredictions: boolean;
}) {
  const accentBorder = ac.border;
  const accentText = ac.text;
  const accentBg = ac.bg;
  const accentRing = ac.ring;
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
        ac={ac}
        lang={lang}
        completion={completion}
        onEdit={() => setEditMode(true)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Validation banner — slides in below the navbar when user tries to
          save with incomplete predictions. Positioned with `top` offset that
          clears the fixed navbar (~64-72px tall) plus iOS safe-area inset. */}
      <AnimatePresence>
        {validationErrors.length > 0 && (
          <motion.div
            key="validation-banner"
            initial={{ y: -24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -24, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            style={{
              top: "calc(env(safe-area-inset-top, 0px) + 4.75rem)",
            }}
            className="fixed left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-full sm:max-w-md md:max-w-lg z-[60]"
          >
            <div
              role="alert"
              aria-live="polite"
              className={`relative overflow-hidden rounded-2xl shadow-2xl border backdrop-blur-2xl ${
                theme === "dark"
                  ? "bg-gray-900/95 border-red-500/30 text-gray-100 shadow-red-950/40"
                  : "bg-white/95 border-red-200 text-gray-900 shadow-red-200/40"
              }`}
            >
              {/* Soft accent strip on the left — signals "warning" without
                  drowning the whole card in red. */}
              <span
                aria-hidden
                className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 via-red-500 to-red-600"
              />
              {/* Subtle blurred glow in the corner — adds warmth in dark mode */}
              <span
                aria-hidden
                className={`pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl ${
                  theme === "dark" ? "bg-red-500/10" : "bg-red-400/15"
                }`}
              />
              <div className="relative flex items-start gap-3 p-3.5 sm:p-4 pl-4 sm:pl-5">
                <div
                  className={`flex-shrink-0 mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center ring-1 ${
                    theme === "dark"
                      ? "bg-red-500/15 text-red-300 ring-red-500/30"
                      : "bg-red-50 text-red-600 ring-red-200"
                  }`}
                >
                  <AlertCircle className="w-5 h-5" strokeWidth={2.25} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
                        theme === "dark" ? "text-red-300" : "text-red-600"
                      }`}
                    >
                      {lang === "en" ? "Incomplete" : "Nepotpuno"}
                    </p>
                    <span
                      className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${
                        theme === "dark"
                          ? "bg-red-500/15 text-red-200 ring-1 ring-red-500/25"
                          : "bg-red-50 text-red-700 ring-1 ring-red-200"
                      }`}
                    >
                      {validationErrors.length}
                    </span>
                  </div>
                  <p
                    className={`text-sm font-bold leading-tight mt-0.5 ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {lang === "en"
                      ? "Saved — but these picks aren't complete yet"
                      : "Sačuvano — ali ove predikcije još nisu kompletne"}
                  </p>
                  <ul
                    className={`mt-2 space-y-1 text-[12px] leading-snug ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {validationErrors.slice(0, 4).map((e) => (
                      <li
                        key={e.id}
                        className="flex items-start gap-2 break-words"
                      >
                        <span
                          aria-hidden
                          className={`flex-shrink-0 mt-1.5 w-1 h-1 rounded-full ${
                            theme === "dark" ? "bg-red-400" : "bg-red-500"
                          }`}
                        />
                        <span>{e.msg}</span>
                      </li>
                    ))}
                    {validationErrors.length > 4 && (
                      <li
                        className={`pl-3 text-[11px] italic ${
                          theme === "dark" ? "text-red-300/70" : "text-red-600/80"
                        }`}
                      >
                        +{validationErrors.length - 4}{" "}
                        {lang === "en" ? "more to fix" : "još za popraviti"}
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
                      ? "hover:bg-white/5 text-gray-400 hover:text-gray-200"
                      : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"
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
              ? `${ac.bg10} ${ac.border500_30} ${ac.textBrighter}`
              : `${ac.bgPale} ${ac.border200} ${ac.textDeeper}`
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
            className={`px-4 py-2 rounded-2xl text-sm font-bold ${ac.textOn} ${accentBg} shadow-sm w-full sm:w-auto`}
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
                className={`flex-shrink-0 inline-flex items-baseline gap-1 px-2 py-0.5 rounded-full whitespace-nowrap ${accentText} ${theme === "dark" ? "bg-gray-900 border border-gray-700" : `${ac.bgPale} border ${ac.border200}`}`}
              >
                <span className="text-[13px] font-black tabular-nums leading-none">
                  {cat.points_correct}
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider leading-none">
                  pts
                </span>
              </span>
              {locked && (
                <span className={`flex-shrink-0 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${ac.bgGhostInk} inline-flex items-center gap-1 whitespace-nowrap`}>
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
              ac={ac}
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
              className={`flex-1 md:flex-initial px-5 py-3.5 md:py-3 rounded-2xl font-bold text-base ${ac.textOn} ${accentBg} disabled:opacity-50 inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg ${ac.shadow500_20}`}
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
  ac,
}: {
  category: CategoryWithOptions;
  draft: DraftEntry;
  onChange: (patch: Partial<DraftEntry>) => void;
  disabled: boolean;
  showResults: boolean;
  theme: string;
  ac: AccentClasses;
}) {
  const accentBg = ac.bg;
  const accentText = ac.text;
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
            className={`text-[11px] font-semibold px-0.5 ${theme === "dark" ? ac.textBright : ac.textDeeper}`}
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
                            ? `${ac.bgDarkDeep} ${ac.textBrighter} border ${ac.border800}`
                            : `${ac.bgPale} ${ac.textDeeper} border ${ac.border200}`
                          : theme === "dark"
                            ? `${ac.bg15} ${ac.textBright} border ${ac.border500_30}`
                            : `${ac.bgPale} ${ac.textDeep} border ${ac.border200}`
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
                          ? `${ac.border500_80} bg-gradient-to-br ${ac.gradMiddleDark} shadow-md ${ac.shadow500_15}`
                          : `${ac.border500} bg-gradient-to-br ${ac.gradLightCard} shadow-sm ${ac.shadow500_20}`
                        : dark
                          ? "border-gray-700/70 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-900/80"
                          : "border-gray-200 bg-white/90 hover:border-gray-300 hover:shadow-sm"
                    } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${
                      showCorrect ? `!ring-2 !${ac.ring500}` : ""
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
                      <CheckCircle2 className={`absolute top-1 right-1 z-10 w-3.5 h-3.5 ${ac.textSolid}`} />
                    )}
                    <div className="relative z-10 flex items-center gap-2">
                      {opt.image_url && (
                        <div
                          className={`flex-shrink-0 w-7 h-5 sm:w-8 sm:h-6 rounded-md overflow-hidden ring-1 ${
                            isSelected
                              ? dark
                                ? ac.ring500_60
                                : ac.ring400
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
          ac={ac}
        />
        <span className={`text-2xl font-black ${theme === "dark" ? "text-gray-600" : "text-gray-400"}`}>
          :
        </span>
        <NumInput
          value={draft.scoreAway}
          onChange={(v) => onChange({ scoreAway: v })}
          disabled={disabled}
          placeholder="0"
          ac={ac}
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
        ac={ac}
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
        className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-[15px] font-semibold transition-colors ${
          theme === "dark"
            ? `bg-gray-900 border-gray-700 ${ac.hoverBorder500_60} ${ac.focusBorder500} placeholder-gray-600`
            : `bg-white border-gray-300 ${ac.hoverBorder500_60} ${ac.focusBorder500} placeholder-gray-400`
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
  ac,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
  wide?: boolean;
  ac: AccentClasses;
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
      className={`${wide ? "w-full max-w-[10rem] text-center mx-auto block" : "w-20 text-center"} px-3 py-2.5 rounded-xl border outline-none text-lg font-black tabular-nums bg-theme-background border-theme-border transition-colors ${ac.hoverBorder500_60} ${ac.focusBorder500} disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
    />
  );
}

// =============================================================
// Rules tab
// =============================================================
function RulesTab({
  tournament,
  theme,
  ac,
}: {
  tournament: TournamentDetail;
  theme: string;
  ac: AccentClasses;
}) {
  const accentText = ac.text;
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
                        ? ac.bgGhostInk
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
  ac,
}: {
  tournament: TournamentDetail;
  theme: string;
  ac: AccentClasses;
}) {
  const accentText = ac.text;
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
  ac,
  currentUserId,
  isWC = false,
  themeBgSrc = null,
}: {
  standings: StandingsRow[];
  theme: string;
  ac: AccentClasses;
  currentUserId?: string;
  isWC?: boolean;
  themeBgSrc?: string | null;
}) {
  const accentText = ac.text;
  const accentBg = ac.bg;
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
          ac={ac}
          label="Učesnika"
          value={standings.length}
          icon={Trophy}
        />
        <StatCard
          theme={theme}
          ac={ac}
          label="Tvoj plasman"
          value={me ? `#${me.rank}` : "—"}
          icon={Award}
          highlight={!!me}
        />
        <StatCard
          theme={theme}
          ac={ac}
          label="Tvoji poeni"
          value={me ? me.total_points : "—"}
          icon={Star}
          highlight={!!me}
        />
        <StatCard
          theme={theme}
          ac={ac}
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
            ac={ac}
            currentUserId={currentUserId}
            heightClass="h-32 md:h-40"
          />
          {/* 1st place — center, taller */}
          <PodiumCard
            row={top3[0]}
            place={1}
            theme={theme}
            ac={ac}
            currentUserId={currentUserId}
            heightClass="h-40 md:h-52"
          />
          {/* 3rd place — right */}
          <PodiumCard
            row={top3[2]}
            place={3}
            theme={theme}
            ac={ac}
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
                      ? `bg-gradient-to-r ${ac.gradRowDark}`
                      : `bg-gradient-to-r ${ac.gradRowLight}`
                    : dark
                      ? "hover:bg-gray-800/40"
                      : "hover:bg-gray-50/60"
                }`}
              >
                {isMe && (
                  <span
                    aria-hidden
                    className={`absolute left-0 top-0 bottom-0 w-1 ${ac.bgSolid}`}
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
                        ? `bg-gradient-to-br ${ac.gradAvatarMe} ${ac.textOn} shadow-md ${ac.shadow500_30}`
                        : isTop3
                          ? dark
                            ? `${ac.bg15} ${ac.textBrighter} border ${ac.border500_30}`
                            : `${ac.bgPale} ${ac.textDeeper} border ${ac.border200}`
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
                          dark ? ac.bgGhostDark : ac.bgGhostLight
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
  ac,
  label,
  value,
  icon: Icon,
  highlight,
}: {
  theme: string;
  ac: AccentClasses;
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
            ? `bg-gradient-to-br ${ac.gradStatDark} ${ac.border500_40} shadow-md ${ac.shadow500_10}`
            : `bg-gradient-to-br ${ac.gradStatLight} ${ac.border300} shadow-sm ${ac.shadow500_10}`
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
              ? ac.text500_10
              : ac.text400_15
            : dark
              ? "text-gray-700/40"
              : "text-gray-200/70"
        }`}
        strokeWidth={1.5}
      />
      <div className="relative z-10 flex items-center gap-1.5 mb-1.5">
        <Icon
          className={`w-3 h-3 ${highlight ? ac.textSolid : dark ? "text-gray-500" : "text-gray-400"}`}
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
          highlight ? ac.textSolid : dark ? "text-white" : "text-gray-900"
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
  ac,
  currentUserId,
  heightClass,
}: {
  row: StandingsRow;
  place: 1 | 2 | 3;
  theme: string;
  ac: AccentClasses;
  currentUserId?: string;
  heightClass: string;
}) {
  const dark = theme === "dark";
  const isMe = currentUserId === row.user_id;
  const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";
  // 1st place wears the tournament accent — that's the winner's
  // halo and should always echo the admin-picked theme. 2nd/3rd
  // keep their universal silver/bronze gradients.
  const colors = {
    1: dark
      ? `bg-gradient-to-b ${ac.gradPodiumDark} ${ac.border500_60}`
      : `bg-gradient-to-b ${ac.gradPodiumLight} ${ac.border300}`,
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
        isMe ? `ring-2 ${ac.ring500_60}` : ""
      }`}
    >
      <div className="text-3xl md:text-4xl mb-1">{medal}</div>
      <div
        className={`font-bold text-[13px] md:text-sm leading-tight break-words ${
          dark ? "text-white" : "text-gray-900"
        }`}
      >
        {row.user_display_name || row.user_email?.split("@")[0] || "Igrač"}
        {isMe && <span className={`text-[10px] ml-1.5 ${ac.textSolid}`}>★</span>}
      </div>
      <div className={`text-2xl md:text-3xl font-black tabular-nums ${ac.text}`}>
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
  ac,
  lang,
  completion,
  onEdit,
}: {
  tournament: TournamentDetail;
  draft: Record<string, DraftEntry>;
  theme: string;
  ac: AccentClasses;
  lang: "en" | "bs";
  completion: { done: number; total: number };
  onEdit: () => void;
}) {
  const accentText = ac.text;
  const accentBg = ac.bg;
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
                ? `${ac.bg15} ${ac.textBright} ring-1 ${ac.border500_30}`
                : `${ac.bgPale} ${ac.textDeep} ring-1 ${ac.border200}`
            }`}
          >
            <CheckCircle2 className="w-6 h-6" strokeWidth={2.25} />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-[10px] font-bold uppercase tracking-[0.2em] ${ac.textPair600_400}`}
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
                ac={ac}
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
  ac,
}: {
  category: PredictionCategory & { options: PredictionOption[] };
  draft: DraftEntry;
  theme: string;
  lang: "en" | "bs";
  ac: AccentClasses;
}) {
  const accentText = ac.text;
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
            className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black tabular-nums ${ac.bgSolid} ${ac.textOn} shadow-sm ${ac.shadow500_30}`}
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
  ac,
  onRequestJoin,
}: {
  membership: MembershipShape;
  authStatus: string;
  joining: boolean;
  theme: string;
  ac: AccentClasses;
  onRequestJoin: () => void;
}) {
  const accentBg = ac.bg;
  const dark = theme === "dark";
  const status = membership.member?.status;

  // Single quiet card. No gradients, no glow halos, no shake. Open/
  // pending states echo the tournament accent so the gate visually
  // belongs to *this* tournament; rejected/banned stays red since
  // that's a universal warning state, not a brand color.
  let useAccent: "tournament" | "red" = "tournament";
  let kicker = "Zatvoreni turnir";
  let title = "Zatraži učešće u turniru";
  let subtitle =
    "Admin pregleda svaki zahtjev. Čim te odobri, predikcije se otključavaju automatski.";
  let Icon = ShieldCheck;
  let cta: React.ReactNode = (
    <button
      onClick={authStatus === "authenticated" ? onRequestJoin : () => signIn()}
      disabled={joining}
      className={`mt-2 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold ${ac.textOn} ${accentBg} disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] transition-all`}
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
    useAccent = "red";
    kicker = status === "banned" ? "Blokiran" : "Odbijen";
    title = status === "banned" ? "Nalog je blokiran" : "Zahtjev je odbijen";
    subtitle =
      "Kontaktiraj admina ako misliš da je greška. Tabela i pravila ostaju vidljivi.";
    Icon = Ban;
    cta = null;
  }

  const accentText =
    useAccent === "tournament"
      ? dark
        ? ac.textBrighter
        : ac.textDeep
      : dark
        ? "text-red-300"
        : "text-red-500";
  const accentIconBg =
    useAccent === "tournament"
      ? dark
        ? `${ac.bg10} ${ac.textBright} ring-1 ${ac.ring500_40}`
        : `${ac.bgPale} ${ac.textDeep} ring-1 ${ac.border200}`
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
