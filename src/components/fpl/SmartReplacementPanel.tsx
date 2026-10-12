"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ArrowLeftRight, ChevronDown, HelpCircle, X } from "lucide-react";
import { Chip, Delta, PlayerJersey, PosTag, Segmented, cx, formatPrice } from "./live/ui";

interface ChipUsed {
  name: string;
  event: number;
}

interface FixtureLite {
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  event?: number;
  finished?: boolean;
}

interface TeamLite {
  id: number;
  short_name: string;
  position?: number;
  strength_attack_home?: number;
  strength_attack_away?: number;
  strength_defence_home?: number;
  strength_defence_away?: number;
  form?: string | null;
}

interface SmartReplacementPanelProps {
  open: boolean;
  selectedPlayer: any | null;
  allPlayers: any[];
  allTeams: TeamLite[];
  nextGwFixtures: FixtureLite[];
  upcomingFixtures: FixtureLite[];
  nextGwNumber: number;
  currentGameweek: number;
  chipsUsed: ChipUsed[];
  userTeamPlayerIds: number[];
  availableBudget: number;
  getTeamShortName: (teamId: number) => string;
  onClose: () => void;
  onPickReplacement?: (candidate: any) => void;
  isTransferMode: boolean;
}

const CHIP_LABEL: Record<string, string> = {
  wildcard: "Wildcard",
  bboost: "Bench Boost",
  "3xc": "Triple Captain",
  freehit: "Free Hit",
};
const CHIP_SHORT: Record<string, string> = { wildcard: "WC", freehit: "FH", bboost: "BB", "3xc": "TC" };
const ALL_CHIPS = ["wildcard", "freehit", "bboost", "3xc"];
const PAGE_SIZE = 8;

type FilterKey = "all" | "form" | "value" | "differential" | "reliable" | "premium";
type SortKey = "score" | "xp" | "form" | "price" | "fdr";
type Tone = "neutral" | "accent" | "positive" | "negative" | "warning";

interface Reason {
  label: string;
  tone: Tone;
}

interface FixtureRun {
  opp: string;
  isHome: boolean;
  difficulty: number;
  event: number;
}

interface ScoredCandidate {
  player: any;
  score: number;
  xP: number;
  xPDelta: number;
  verdict: Reason;
  fixtures: FixtureRun[];
  reasons: Reason[];
  badges: { form: boolean; value: boolean; differential: boolean; reliable: boolean; premium: boolean };
}

const num = (v: any): number => {
  if (typeof v === "number") return v;
  const parsed = parseFloat(v);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** One decimal, so Delta never prints float noise like 2.6000000001. */
const r1 = (v: number) => Math.round(v * 10) / 10;

/**
 * How much to trust per-game / per-90 numbers: 0 → 1 over the first ~4 full
 * games. A 7-minute cameo with one assist otherwise reads as xGI/90 ≈ 12.
 */
const sampleWeight = (p: any) => Math.min(1, num(p.minutes) / 360);
const MIN_MINUTES_PER90 = 180;
const xgiPer90 = (p: any) =>
  num(p.expected_goal_involvements_per_90) || num(p.expected_goals_per_90) + num(p.expected_assists_per_90);

function getFixtureRun(teamId: number, fixtures: FixtureLite[], teams: TeamLite[], maxCount = 5): FixtureRun[] {
  const teamFx = fixtures
    .filter((f) => (f.team_h === teamId || f.team_a === teamId) && !f.finished)
    .sort((a, b) => (a.event ?? 0) - (b.event ?? 0))
    .slice(0, maxCount);
  return teamFx.map((fx) => {
    const isHome = fx.team_h === teamId;
    const oppId = isHome ? fx.team_a : fx.team_h;
    const opp = teams.find((t) => t.id === oppId);
    const difficulty = isHome ? fx.team_h_difficulty : fx.team_a_difficulty;
    return { opp: opp?.short_name || "?", isHome, difficulty: difficulty || 3, event: fx.event ?? 0 };
  });
}

type TFn = (key: string, fallback: string, opts?: any) => any;

function teamMotivation(pos: number | undefined, t: TFn): Reason | null {
  if (!pos) return null;
  if (pos <= 4) return { label: t("fplDashboard.smartReplace.topFourFight", "Top-4 fight"), tone: "neutral" };
  if (pos >= 17) return { label: t("fplDashboard.smartReplace.relegationFight", "Relegation fight"), tone: "neutral" };
  return null;
}

function computeExpectedPoints(
  p: any,
  fixture: FixtureRun | null,
  playChance: number,
  fixturesInGw = 1
): number {
  // Blank gameweek: no fixture → 0 expected
  if (!fixture && fixturesInGw === 0) return 0;
  const form = num(p.form);
  const ppg = num(p.points_per_game) * sampleWeight(p);
  const baseRate = form * 0.55 + ppg * 0.45;
  const fdr = fixture?.difficulty ?? 3;
  const fxFactor = 1 + (3 - fdr) * 0.13;
  const homeMul = fixture ? (fixture.isHome ? 1.05 : 0.97) : 1;
  // Set-piece bonus: penalty taker (+0.6), direct FK taker (+0.3)
  const pkOrder = p.penalties_order;
  const fkOrder = p.direct_freekicks_order;
  let setPieceBonus = 0;
  if (typeof pkOrder === "number" && pkOrder === 1) setPieceBonus += 0.6;
  if (typeof fkOrder === "number" && fkOrder === 1) setPieceBonus += 0.3;
  const singleGwXp = Math.max(0, baseRate * (playChance / 100) * fxFactor * homeMul + setPieceBonus);
  // Double gameweek: roughly 1.85x (assists/goals not perfectly linear)
  return fixturesInGw > 1 ? singleGwXp * 1.85 : singleGwXp;
}

function buildReasons(
  p: any,
  selected: any,
  ctx: { fixture: FixtureRun | null; team?: TeamLite; currentGw: number; playChance: number; fixturesInGw?: number },
  t: TFn
): Reason[] {
  const reasons: Reason[] = [];
  // Double gameweek - highest signal value
  if ((ctx.fixturesInGw ?? 1) > 1) {
    reasons.push({ label: t("fplDashboard.smartReplace.dgw", "DGW ×{{count}}", { count: ctx.fixturesInGw }), tone: "accent" });
  }
  if (ctx.playChance > 0 && ctx.playChance < 100)
    reasons.push({ label: t("fplDashboard.smartReplace.playChance", "{{chance}}% chance", { chance: ctx.playChance }), tone: "warning" });
  if (typeof p.penalties_order === "number" && p.penalties_order === 1) {
    reasons.push({ label: t("fplDashboard.smartReplace.penaltyTaker", "Penalty taker"), tone: "neutral" });
  }
  const form = num(p.form);
  const ppg = num(p.points_per_game) * sampleWeight(p);
  const ownership = num(p.selected_by_percent);
  const priceChange = num(p.cost_change_event);
  const xgi90 = num(p.minutes) >= MIN_MINUTES_PER90 ? xgiPer90(p) : 0;
  const minutes = num(p.minutes);
  const expectedMinutes = Math.max(ctx.currentGw, 1) * 90;
  const reliability = minutes / Math.max(expectedMinutes, 1);

  if (form >= 6) reasons.push({ label: t("fplDashboard.smartReplace.inForm", "In Form"), tone: "positive" });
  if (ppg > 0 && p.now_cost > 0) {
    const myRatio = ppg / (p.now_cost / 10);
    const selRatio = selected ? num(selected.points_per_game) / Math.max(num(selected.now_cost) / 10, 0.1) : 0;
    if (myRatio > selRatio && myRatio > 0.7)
      reasons.push({ label: t("fplDashboard.smartReplace.valuePick", "Value pick"), tone: "neutral" });
  }
  if (ctx.fixture && ctx.fixture.difficulty <= 2) reasons.push({ label: t("fplDashboard.smartReplace.easyMatch", "Easy match"), tone: "positive" });
  if (reliability >= 0.85) reasons.push({ label: t("fplDashboard.smartReplace.reliableStarter", "Reliable"), tone: "neutral" });
  if (xgi90 >= 0.55 && (p.element_type === 3 || p.element_type === 4))
    reasons.push({ label: t("fplDashboard.smartReplace.underlying", "Underlying"), tone: "neutral" });
  if (priceChange > 0) reasons.push({ label: t("fplDashboard.smartReplace.priceRising", "Price rising"), tone: "positive" });
  if (ownership > 25) reasons.push({ label: t("fplDashboard.smartReplace.popular", "Popular"), tone: "neutral" });
  else if (ownership > 0 && ownership < 5 && form >= 4)
    reasons.push({ label: t("fplDashboard.smartReplace.differential", "Differential"), tone: "accent" });
  const mot = teamMotivation(ctx.team?.position, t);
  if (mot) reasons.push(mot);
  return reasons.slice(0, 6);
}

function computeScore(
  p: any,
  selected: any,
  ctx: { fixture: FixtureRun | null; team?: TeamLite; currentGw: number; playChance: number; fixturesInGw: number }
): number {
  const form = num(p.form);
  const sample = sampleWeight(p);
  const ppg = num(p.points_per_game) * sample;
  const total = num(p.total_points);
  const ict = num(p.ict_index);
  const xg90 = num(p.expected_goals_per_90) * sample;
  const xa90 = num(p.expected_assists_per_90) * sample;
  const xgc90 = num(p.expected_goals_conceded_per_90);
  const minutes = num(p.minutes);
  const priceChange = num(p.cost_change_event);
  const cost = num(p.now_cost) / 10;

  // Blank gameweek: no fixture this round, hard skip
  if (ctx.fixturesInGw === 0) return -500;

  // Reliability — guard for tiny-sample new players
  const playedMinSample = Math.max(num(p.minutes), 1);
  const expectedMinutes = Math.max(ctx.currentGw, 1) * 90;
  const reliability = playedMinSample < 90
    ? 0.6 // small-sample players: neutral baseline (don't penalize new buys)
    : Math.min(minutes / Math.max(expectedMinutes * 0.6, 1), 1.4);
  const fdr = ctx.fixture?.difficulty ?? 3;
  const fixtureScore = (6 - fdr) * 5;
  const homeBonus = ctx.fixture?.isHome ? 2 : 0;

  let motivation = 0;
  const pos = ctx.team?.position;
  if (pos) {
    if (pos <= 4) motivation = 4;
    else if (pos <= 8) motivation = 2;
    else if (pos >= 17) motivation = 5;
  }

  const isAttacker = p.element_type === 3 || p.element_type === 4;
  const isDefender = p.element_type === 1 || p.element_type === 2;
  const isMid = p.element_type === 3;

  let score = 0;
  score += form * 11;
  score += ppg * 6;
  score += total * 0.08;
  score += ict * 0.35;
  if (isAttacker) score += (xg90 + xa90) * 18;
  // FIX: penalize defenders with bad xGC (formerly capped at 0)
  if (isDefender) score += Math.max(-12, (4 - xgc90)) * 8 * sample;
  score += reliability * 14;
  score += fixtureScore + homeBonus;
  score += motivation;
  score += priceChange > 0 ? 5 : 0;

  // Set-piece taker bonuses (attackers benefit most)
  if (isAttacker || isMid) {
    const pkOrder = p.penalties_order;
    const fkOrder = p.direct_freekicks_order;
    if (typeof pkOrder === "number" && pkOrder === 1) score += 12;
    else if (typeof pkOrder === "number" && pkOrder === 2) score += 4;
    if (typeof fkOrder === "number" && fkOrder === 1) score += 5;
  }
  // Corners specifically help defenders (assist threat)
  if (isDefender || isMid) {
    const ckOrder = p.corners_and_indirect_freekicks_order;
    if (typeof ckOrder === "number" && ckOrder === 1) score += 3;
  }

  // Double gameweek boost
  if (ctx.fixturesInGw > 1) score += 25;

  if (cost > 0) score += (ppg / cost) * 3;

  // FIX: PlayChance is risk-adjustment, not multiplier. Soft penalty per % missing.
  if (ctx.playChance > 0 && ctx.playChance < 100) {
    score -= (100 - ctx.playChance) * 0.18;
  }

  if (selected && p.id === selected.id) score = -1000;
  return score;
}

function buildVerdict(
  c: { xPDelta: number; player: any; selected: any; fixture: FixtureRun | null },
  t: TFn
): Reason {
  const { xPDelta, player, selected, fixture } = c;
  const costDiff = (num(player.now_cost) - num(selected.now_cost)) / 10;
  const playChance = player.chance_of_playing_next_round;
  const lowChance = playChance !== null && playChance !== undefined && playChance < 75;
  const fdr = fixture?.difficulty ?? 3;

  if (lowChance) return { label: t("fplDashboard.smartReplace.risk", "Risk"), tone: "warning" };
  if (xPDelta >= 1.5 && costDiff <= 0) return { label: t("fplDashboard.smartReplace.valueUpgrade", "Value upgrade"), tone: "positive" };
  if (xPDelta >= 2.5) return { label: t("fplDashboard.smartReplace.premiumUpgrade", "Premium upgrade"), tone: "accent" };
  if (xPDelta >= 1.2) return { label: t("fplDashboard.smartReplace.clearlyBetter", "Clearly better"), tone: "positive" };
  if (xPDelta <= -0.5) return { label: t("fplDashboard.smartReplace.downgrade", "Downgrade"), tone: "neutral" };
  if (fdr <= 2 && xPDelta >= 0.4) return { label: t("fplDashboard.smartReplace.fixturePick", "Fixture pick"), tone: "positive" };
  return { label: t("fplDashboard.smartReplace.sidegrade", "Sidegrade"), tone: "neutral" };
}

/* ------------------------------------------------------------------ */
/* Presentational pieces                                               */
/* ------------------------------------------------------------------ */

const FDR_TONE = {
  easy: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  mid: "bg-theme-card text-theme-text-secondary ring-1 ring-inset ring-theme-border",
  hard: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  veryHard: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

function fdrTone(d: number) {
  if (d <= 2) return FDR_TONE.easy;
  if (d === 3) return FDR_TONE.mid;
  if (d === 4) return FDR_TONE.hard;
  return FDR_TONE.veryHard;
}

/** Next fixtures as opponent pills tinted by difficulty. */
function FixtureStrip({ fixtures, count, homeLabel, awayLabel }: { fixtures: FixtureRun[]; count: number; homeLabel: string; awayLabel: string }) {
  const list = fixtures.slice(0, count);
  if (list.length === 0) return <span className="text-[11px] text-theme-text-muted">—</span>;
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      {list.map((fx, i) => (
        <span
          key={`${fx.event}-${i}`}
          title={`GW${fx.event} · ${fx.isHome ? homeLabel : awayLabel} · FDR ${fx.difficulty}`}
          className={cx(
            "inline-flex h-[22px] min-w-[44px] items-center justify-center gap-0.5 rounded-md px-1.5 text-[10px] font-semibold leading-none tabular-nums",
            fdrTone(fx.difficulty)
          )}
        >
          {fx.opp}
          <span className="text-[8px] font-medium opacity-70">{fx.isHome ? "H" : "A"}</span>
        </span>
      ))}
    </div>
  );
}

/** Label over value — the compact stat grid used on every row. */
function StatCell({ label, value, delta, deltaSuffix, invert }: { label: ReactNode; value: ReactNode; delta?: number; deltaSuffix?: string; invert?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-[9px] font-medium uppercase tracking-wider text-theme-text-muted">{label}</div>
      <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
        <span className="whitespace-nowrap text-[13px] font-semibold leading-none tabular-nums text-theme-heading-primary">{value}</span>
        {typeof delta === "number" && <Delta value={r1(delta)} suffix={deltaSuffix} invert={invert} className="text-[10px]" />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export default function SmartReplacementPanel({
  open,
  selectedPlayer,
  allPlayers,
  allTeams,
  upcomingFixtures,
  nextGwNumber,
  currentGameweek,
  chipsUsed,
  userTeamPlayerIds,
  availableBudget,
  getTeamShortName,
  onClose,
  onPickReplacement,
  isTransferMode,
}: SmartReplacementPanelProps) {
  const { t } = useTranslation("fpl");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("score");
  const [showHelp, setShowHelp] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [isMobile, setIsMobile] = useState(false);
  // Sheet is dragged only by its handle, so the content can scroll freely
  const dragControls = useDragControls();

  // Detect mobile so we can render as bottom-sheet instead of right drawer
  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // New player → start from the first page again (state adjusted during render)
  const [limitFor, setLimitFor] = useState<number | undefined>(selectedPlayer?.id);
  if (limitFor !== selectedPlayer?.id) {
    setLimitFor(selectedPlayer?.id);
    setLimit(PAGE_SIZE);
  }
  const changeFilter = (value: FilterKey) => {
    setFilter(value);
    setLimit(PAGE_SIZE);
  };

  const teamsById = useMemo(() => {
    const m = new Map<number, TeamLite>();
    allTeams.forEach((t) => m.set(t.id, t));
    return m;
  }, [allTeams]);

  const usedChipNames = useMemo(() => new Set(chipsUsed.map((c) => c.name)), [chipsUsed]);

  const selectedFixtures = useMemo(() => {
    if (!selectedPlayer) return [];
    return getFixtureRun(selectedPlayer.team, upcomingFixtures, allTeams, 5);
  }, [selectedPlayer, upcomingFixtures, allTeams]);

  const selectedNextFixture = selectedFixtures[0] || null;
  const selectedFixturesInGw = useMemo(
    () => selectedFixtures.filter((f) => f.event === nextGwNumber).length,
    [selectedFixtures, nextGwNumber]
  );
  const selectedPlayChance =
    selectedPlayer?.chance_of_playing_next_round === null || selectedPlayer?.chance_of_playing_next_round === undefined
      ? 100
      : selectedPlayer.chance_of_playing_next_round;
  const selectedXP = useMemo(
    () =>
      selectedPlayer
        ? computeExpectedPoints(selectedPlayer, selectedNextFixture, selectedPlayChance, selectedFixturesInGw)
        : 0,
    [selectedPlayer, selectedNextFixture, selectedPlayChance, selectedFixturesInGw]
  );

  const allCandidates = useMemo<ScoredCandidate[]>(() => {
    if (!selectedPlayer) return [];
    const sameRole = allPlayers.filter(
      (p) => p && p.element_type === selectedPlayer.element_type && p.id !== selectedPlayer.id
    );
    const maxCost = num(selectedPlayer.now_cost) + availableBudget;
    const affordable = sameRole.filter((p) => num(p.now_cost) <= maxCost);
    // FIX: pre-filter injured/suspended/unavailable players so they don't show up
    // as "worst possible swap". They simply shouldn't be recommended.
    const available = affordable.filter((p) => {
      const status = p.status;
      return status !== "i" && status !== "s" && status !== "u" && status !== "n";
    });
    const filtered = available.filter((p) => !userTeamPlayerIds.includes(p.id));
    const expectedMinutes = Math.max(currentGameweek, 1) * 90;
    return filtered
      .map((p) => {
        const fixtures = getFixtureRun(p.team, upcomingFixtures, allTeams, 5);
        // Detect double gameweek: how many fixtures this team has in the next single GW
        const fixturesInGw = fixtures.filter((f) => f.event === nextGwNumber).length;
        const fixture = fixtures[0] || null;
        const team = teamsById.get(p.team);
        const chance = p.chance_of_playing_next_round;
        const playChance = chance === null || chance === undefined ? 100 : chance;
        const ctx = { fixture, team, currentGw: currentGameweek, playChance, fixturesInGw };
        const score = computeScore(p, selectedPlayer, ctx);
        const xP = computeExpectedPoints(p, fixture, playChance, fixturesInGw);
        const xPDelta = xP - selectedXP;
        const reasons = buildReasons(p, selectedPlayer, ctx, t);
        const verdict = buildVerdict({ xPDelta, player: p, selected: selectedPlayer, fixture }, t);

        const minutes = num(p.minutes);
        const reliability = minutes / Math.max(expectedMinutes, 1);
        const ppg = num(p.points_per_game) * sampleWeight(p);
        const cost = num(p.now_cost) / 10;
        const ownership = num(p.selected_by_percent);
        const form = num(p.form);

        const badges = {
          form: form >= 5.5,
          // FIX: differential threshold loosened; require non-tanking form
          value: cost > 0 && ppg / cost >= 0.85 && ownership < 25,
          differential: ownership > 0 && ownership < 5 && form >= 3,
          reliable: reliability >= 0.85,
          premium: cost >= 8 && form >= 5,
        };

        return { player: p, score, xP, xPDelta, verdict, fixtures, reasons, badges };
      })
      .sort((a, b) => b.score - a.score);
  }, [selectedPlayer, allPlayers, userTeamPlayerIds, availableBudget, upcomingFixtures, allTeams, teamsById, currentGameweek, selectedXP, nextGwNumber, t]);

  const filterCounts = useMemo(() => {
    return {
      all: allCandidates.length,
      form: allCandidates.filter((c) => c.badges.form).length,
      value: allCandidates.filter((c) => c.badges.value).length,
      differential: allCandidates.filter((c) => c.badges.differential).length,
      reliable: allCandidates.filter((c) => c.badges.reliable).length,
      premium: allCandidates.filter((c) => c.badges.premium).length,
    };
  }, [allCandidates]);

  const sortedCandidates = useMemo(() => {
    let list = allCandidates;
    if (filter !== "all") list = list.filter((c) => c.badges[filter]);
    const sorted = [...list];
    switch (sort) {
      case "xp":
        sorted.sort((a, b) => b.xP - a.xP);
        break;
      case "form":
        sorted.sort((a, b) => num(b.player.form) - num(a.player.form));
        break;
      case "price":
        sorted.sort((a, b) => num(a.player.now_cost) - num(b.player.now_cost));
        break;
      case "fdr":
        sorted.sort((a, b) => (a.fixtures[0]?.difficulty ?? 5) - (b.fixtures[0]?.difficulty ?? 5));
        break;
      default:
        sorted.sort((a, b) => b.score - a.score);
    }
    return sorted;
  }, [allCandidates, filter, sort]);

  const candidates = sortedCandidates.slice(0, limit);
  const heroPick = allCandidates[0] || null;

  const FILTERS: Array<{ value: FilterKey; label: string; count: number }> = [
    { value: "all", label: t("fplDashboard.smartReplace.all", "All"), count: filterCounts.all },
    { value: "form", label: t("fplDashboard.smartReplace.inForm", "In Form"), count: filterCounts.form },
    { value: "value", label: t("fplDashboard.smartReplace.value", "Value"), count: filterCounts.value },
    { value: "differential", label: t("fplDashboard.smartReplace.differential", "Differential"), count: filterCounts.differential },
    { value: "reliable", label: t("fplDashboard.smartReplace.reliable", "Reliable"), count: filterCounts.reliable },
    { value: "premium", label: t("fplDashboard.smartReplace.premium", "Premium"), count: filterCounts.premium },
  ];

  const SORTS: Array<{ key: SortKey; label: string }> = [
    { key: "score", label: t("fplDashboard.smartReplace.sortScore", "Score") },
    { key: "xp", label: t("fplDashboard.smartReplace.sortXp", "xP") },
    { key: "form", label: t("fplDashboard.smartReplace.sortForm", "Form") },
    { key: "price", label: t("fplDashboard.smartReplace.sortPrice", "Price") },
    { key: "fdr", label: t("fplDashboard.smartReplace.sortFdr", "FDR") },
  ];

  const homeLabel = t("fplDashboard.smartReplace.home", "Home");
  const awayLabel = t("fplDashboard.smartReplace.away", "Away");

  // Attackers are judged on xGI/90, defenders and keepers on clean sheets
  const isAttackerRole = selectedPlayer ? selectedPlayer.element_type >= 3 : false;
  const threatLabel = isAttackerRole ? "xGI/90" : t("fplDashboard.smartReplace.cleanSheets", "CS");
  const threatValue = (p: any) => {
    if (!isAttackerRole) return String(num(p.clean_sheets));
    // per-90 from a handful of minutes is noise, not signal
    return num(p.minutes) >= MIN_MINUTES_PER90 ? xgiPer90(p).toFixed(2) : "—";
  };

  const ownershipLabel = t("fplDashboard.smartReplace.ownership", "Owned");
  const priceLabel = t("fplDashboard.smartReplace.sortPrice", "Price");
  const formLabel = t("fplDashboard.smartReplace.sortForm", "Form");

  /** Five numbers every row shares, so rows read like one table. */
  const statGrid = (p: any) => (
    <div className="grid grid-cols-5 gap-2">
      <StatCell label={t("fplDashboard.smartReplace.points", "Points")} value={num(p.total_points)} />
      <StatCell label={formLabel} value={num(p.form).toFixed(1)} />
      <StatCell label="PPG" value={num(p.points_per_game).toFixed(1)} />
      <StatCell label={threatLabel} value={threatValue(p)} />
      <StatCell label={ownershipLabel} value={`${num(p.selected_by_percent).toFixed(1)}%`} />
    </div>
  );

  const transferButton = (p: any, size: "sm" | "md" = "sm") =>
    onPickReplacement ? (
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => onPickReplacement(p)}
        title={isTransferMode ? t("fplDashboard.smartReplace.addToTransfer") : t("fplDashboard.smartReplace.startTransfer")}
        className={cx(
          "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-violet-600 font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
          size === "md" ? "px-3.5 py-2 text-xs" : "px-3 py-1.5 text-[11px]"
        )}
      >
        <ArrowLeftRight className="h-3.5 w-3.5" />
        {isTransferMode ? t("fplDashboard.smartReplace.swap", "Swap") : t("fplDashboard.smartReplace.transfer", "Transfer")}
      </motion.button>
    ) : null;

  const heroReasons = (() => {
    if (!heroPick || !selectedPlayer) return "";
    const reasons: string[] = [];
    if (heroPick.xPDelta >= 1.5) reasons.push(t("fplDashboard.smartReplace.extraExpectedPoints", "+{{value}} expected points", { value: heroPick.xPDelta.toFixed(1) }));
    if (heroPick.fixtures[0] && selectedNextFixture && heroPick.fixtures[0].difficulty < selectedNextFixture.difficulty)
      reasons.push(t("fplDashboard.smartReplace.easierFixture", "easier fixture (FDR {{fdr}})", { fdr: heroPick.fixtures[0].difficulty }));
    if (num(heroPick.player.form) > num(selectedPlayer.form) + 1) reasons.push(t("fplDashboard.smartReplace.betterForm", "better form"));
    if (heroPick.fixtures[0]?.isHome) reasons.push(t("fplDashboard.smartReplace.playsAtHome", "plays at home"));
    if (heroPick.badges.value) reasons.push(t("fplDashboard.smartReplace.betterValue", "better value"));
    return reasons.length > 0 ? reasons.join(" · ") : t("fplDashboard.smartReplace.solidAlternative", "Solid alternative by overall score.");
  })();

  const budgetTenths = selectedPlayer ? num(selectedPlayer.now_cost) + availableBudget : 0;
  const selectedNews: string = selectedPlayer?.news || "";

  return (
    <AnimatePresence>
      {open && selectedPlayer && (
        <>
          <motion.div
            key="smart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-sm dark:bg-black/70"
            onClick={onClose}
          />

          {/* Bottom sheet on phones, right panel from sm up. One scroll area, so it works at any height. */}
          <motion.aside
            key="smart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t("fplDashboard.smartReplace.title", "Smart Recommendations")}
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag={isMobile ? "y" : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (isMobile && (info.offset.y > 120 || info.velocity.y > 600)) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[88dvh] flex-col overflow-hidden rounded-t-3xl border-t border-theme-border bg-theme-card pb-[env(safe-area-inset-bottom)] shadow-2xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-20 sm:max-h-none sm:w-[460px] sm:rounded-2xl sm:border sm:pb-0"
          >
            {isMobile && (
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="flex shrink-0 cursor-grab touch-none justify-center pb-1 pt-2.5 active:cursor-grabbing"
              >
                <span className="h-1 w-10 rounded-full bg-theme-border-strong" />
              </div>
            )}

            {/* Header */}
            <header className="shrink-0 border-b border-theme-border px-4 pb-3 pt-2 sm:px-5 sm:pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-base font-semibold leading-tight tracking-tight text-theme-heading-primary">
                      {t("fplDashboard.smartReplace.title", "Smart Recommendations")}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowHelp((v) => !v)}
                      aria-expanded={showHelp}
                      title={t("fplDashboard.smartReplace.howCalculated", "How it's calculated")}
                      className={cx(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
                        showHelp ? "bg-theme-card-secondary text-theme-heading-primary" : "text-theme-text-muted hover:text-theme-text-secondary"
                      )}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-theme-text-muted">
                    {t("fplDashboard.smartReplace.forGw", "For GW{{gw}}", { gw: nextGwNumber })} · {t("fplDashboard.smartReplace.subtitleMeta", "form, fixture, minutes, team, ICT")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t("fplDashboard.smartReplace.close", "Close")}
                  className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-theme-text-muted transition-colors hover:bg-theme-card-secondary hover:text-theme-text-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <AnimatePresence initial={false}>
                {showHelp && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <dl className="mt-3 space-y-1.5 rounded-xl bg-theme-card-secondary p-3 text-[11px] leading-snug text-theme-text-secondary">
                      <div><dt className="inline font-semibold text-theme-heading-primary">xP</dt> — {t("fplDashboard.smartReplace.helpXp", "expected points for GW{{gw}}.", { gw: nextGwNumber })}</div>
                      <div><dt className="inline font-semibold text-theme-heading-primary">FDR</dt> — {t("fplDashboard.smartReplace.helpFdr", "Fixture Difficulty Rating (1 easiest, 5 hardest).")}</div>
                      <div><dt className="inline font-semibold text-theme-heading-primary">{t("fplDashboard.smartReplace.verdictLabel")}</dt> — {t("fplDashboard.smartReplace.helpVerdict", "Recommended move, same level or risk.")}</div>
                      <div><dt className="inline font-semibold text-theme-heading-primary">{t("fplDashboard.smartReplace.scoreLabel")}</dt> — {t("fplDashboard.smartReplace.helpScore", "combines form, PPG, xG/xA, minutes, FDR and team position.")}</div>
                    </dl>
                  </motion.div>
                )}
              </AnimatePresence>
            </header>

            {/* Everything below the header scrolls together */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {/* Player being replaced */}
              <section className="px-4 pb-4 pt-3 sm:px-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-text-muted">
                  {t("fplDashboard.smartReplace.replacing", "Replacing")}
                </div>
                <div className="mt-2 rounded-xl border border-theme-border bg-theme-card-secondary p-3">
                  <div className="flex items-center gap-3">
                    <PlayerJersey player={selectedPlayer} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-theme-heading-primary">{selectedPlayer.web_name}</span>
                        <PosTag type={selectedPlayer.element_type} />
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-theme-text-muted">
                        {getTeamShortName(selectedPlayer.team)} · <span className="tabular-nums">{formatPrice(num(selectedPlayer.now_cost))}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[9px] font-medium uppercase tracking-wider text-theme-text-muted">xP GW{nextGwNumber}</div>
                      <div className="text-xl font-semibold leading-none tabular-nums text-theme-heading-primary">{selectedXP.toFixed(1)}</div>
                    </div>
                  </div>

                  {selectedNews && (
                    <p className="mt-2.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] leading-snug text-amber-700 dark:text-amber-300">
                      {selectedNews}
                    </p>
                  )}

                  <div className="mt-3 border-t border-theme-border pt-3">{statGrid(selectedPlayer)}</div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="w-[72px] shrink-0 text-[9px] font-medium uppercase tracking-wider text-theme-text-muted">
                      {t("fplDashboard.smartReplace.next5", "Next 5")}
                    </span>
                    <FixtureStrip fixtures={selectedFixtures} count={5} homeLabel={homeLabel} awayLabel={awayLabel} />
                  </div>
                </div>

                {/* Budget + chips */}
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-theme-text-muted">
                    {t("fplDashboard.smartReplace.budget", "Budget")}:{" "}
                    <span className="font-semibold tabular-nums text-theme-heading-primary">{formatPrice(budgetTenths)}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    {ALL_CHIPS.map((c) => {
                      const used = usedChipNames.has(c);
                      return (
                        <span
                          key={c}
                          title={`${CHIP_LABEL[c]}: ${used ? t("fplDashboard.smartReplace.used", "used") : t("fplDashboard.smartReplace.availableShort", "available")}`}
                          className={cx(
                            "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ring-inset",
                            used
                              ? "text-theme-text-muted line-through opacity-60 ring-theme-border"
                              : "text-theme-text-secondary ring-theme-border-strong"
                          )}
                        >
                          {CHIP_SHORT[c]}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Best overall pick, compared head-to-head */}
              {heroPick && (
                <section className="px-4 pb-4 sm:px-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-text-muted">
                    {t("fplDashboard.smartReplace.mainAdvantageForGw", "Top pick for GW{{gw}}", { gw: nextGwNumber })}
                  </div>
                  <div className="mt-2 rounded-xl border border-violet-500/30 bg-violet-500/[0.06] p-3">
                    <div className="flex items-center gap-3">
                      <PlayerJersey player={heroPick.player} size="lg" />
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate text-sm font-semibold text-theme-heading-primary">{heroPick.player.web_name}</span>
                          <span className="shrink-0 text-[10px] font-semibold uppercase text-theme-text-muted">{getTeamShortName(heroPick.player.team)}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Chip tone={heroPick.verdict.tone}>{heroPick.verdict.label}</Chip>
                          {heroPick.reasons.slice(0, 2).map((r) => (
                            <Chip key={r.label} tone={r.tone}>{r.label}</Chip>
                          ))}
                        </div>
                      </div>
                      {transferButton(heroPick.player, "md")}
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-2 border-t border-violet-500/20 pt-3">
                      <StatCell label="xP" value={heroPick.xP.toFixed(1)} delta={heroPick.xPDelta} />
                      <StatCell label={formLabel} value={num(heroPick.player.form).toFixed(1)} delta={num(heroPick.player.form) - num(selectedPlayer.form)} />
                      <StatCell label="PPG" value={num(heroPick.player.points_per_game).toFixed(1)} delta={num(heroPick.player.points_per_game) - num(selectedPlayer.points_per_game)} />
                      <StatCell
                        label={priceLabel}
                        value={formatPrice(num(heroPick.player.now_cost))}
                        delta={(num(heroPick.player.now_cost) - num(selectedPlayer.now_cost)) / 10}
                        deltaSuffix="m"
                        invert
                      />
                    </div>
                    <p className="mt-2.5 text-[11px] leading-snug text-theme-text-secondary">{heroReasons}</p>
                  </div>
                </section>
              )}

              {/* Filters stay reachable while the list scrolls */}
              <div className="sticky top-0 z-10 border-y border-theme-border bg-theme-card px-4 py-2.5 sm:px-5">
                <Segmented options={FILTERS} value={filter} onChange={changeFilter} />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-text-muted">
                    {t("fplDashboard.smartReplace.recommendations", "{{count}} recommendations", { count: sortedCandidates.length })}
                  </span>
                  <div className="relative">
                    <select
                      value={sort}
                      onChange={(e) => {
                        setSort(e.target.value as SortKey);
                        setLimit(PAGE_SIZE);
                      }}
                      className="appearance-none rounded-lg border border-theme-border bg-theme-card py-1 pl-2.5 pr-7 text-[11px] font-medium text-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-violet-400"
                    >
                      {SORTS.map((s) => (
                        <option key={s.key} value={s.key}>
                          {t("fplDashboard.smartReplace.sortLabel", "Sort: {{label}}", { label: s.label })}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-theme-text-muted" />
                  </div>
                </div>
              </div>

              {/* Candidates */}
              {candidates.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm text-theme-text-secondary">{t("fplDashboard.smartReplace.noRecommendations", "No recommendations in this filter.")}</p>
                  <button
                    type="button"
                    onClick={() => changeFilter("all")}
                    className="mt-2 text-xs font-medium text-violet-600 hover:underline dark:text-violet-300"
                  >
                    {t("fplDashboard.smartReplace.showAll", "Show all")}
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-theme-border">
                  {candidates.map((c, idx) => {
                    const p = c.player;
                    const isTop = p.id === heroPick?.player.id;
                    const priceDiff = (num(p.now_cost) - num(selectedPlayer.now_cost)) / 10;
                    const showVerdict = c.xPDelta >= 1.2 || c.xPDelta <= -0.5 || c.verdict.tone === "warning";
                    return (
                      <motion.li
                        key={p.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx, 8) * 0.03, duration: 0.2 }}
                        className={cx("px-4 py-3 sm:px-5", isTop && "bg-violet-500/[0.04]")}
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-2.5 w-4 shrink-0 text-right text-[11px] font-semibold tabular-nums text-theme-text-muted">
                            {idx + 1}
                          </span>
                          <PlayerJersey player={p} size="md" className="mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-baseline gap-1.5">
                              <span className="truncate text-sm font-semibold text-theme-heading-primary">{p.web_name}</span>
                              <span className="shrink-0 text-[10px] font-semibold uppercase text-theme-text-muted">{getTeamShortName(p.team)}</span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-theme-text-muted">
                              <span className="tabular-nums">{formatPrice(num(p.now_cost))}</span>
                              {priceDiff !== 0 && <Delta value={r1(priceDiff)} suffix="m" invert className="text-[10px]" />}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-[9px] font-medium uppercase tracking-wider text-theme-text-muted">xP</div>
                            <div className="text-lg font-semibold leading-none tabular-nums text-theme-heading-primary">{c.xP.toFixed(1)}</div>
                            <Delta value={r1(c.xPDelta)} showZero className="text-[10px]" />
                          </div>
                        </div>

                        <div className="mt-2.5 pl-7">
                          {statGrid(p)}
                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            <FixtureStrip fixtures={c.fixtures} count={3} homeLabel={homeLabel} awayLabel={awayLabel} />
                            {transferButton(p)}
                          </div>
                          {(showVerdict || c.reasons.length > 0) && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {showVerdict && <Chip tone={c.verdict.tone}>{c.verdict.label}</Chip>}
                              {c.reasons.slice(0, 3).map((r) => (
                                <Chip key={r.label} tone={r.tone}>{r.label}</Chip>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              )}

              {sortedCandidates.length > candidates.length && (
                <div className="px-4 pb-4 pt-1 sm:px-5">
                  <button
                    type="button"
                    onClick={() => setLimit((v) => v + PAGE_SIZE)}
                    className="w-full rounded-lg border border-theme-border py-2 text-xs font-medium text-theme-text-secondary transition-colors hover:bg-theme-card-secondary"
                  >
                    {t("fplDashboard.smartReplace.showMore", "Show {{count}} more", {
                      count: Math.min(PAGE_SIZE, sortedCandidates.length - candidates.length),
                    })}
                  </button>
                </div>
              )}
            </div>

            {/* FDR legend */}
            <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-theme-border px-4 py-2 text-[10px] text-theme-text-muted sm:px-5">
              <span className="font-semibold uppercase tracking-wider">{t("fplDashboard.smartReplace.fdr", "FDR")}</span>
              <div className="flex flex-wrap items-center justify-end gap-x-2.5 gap-y-1">
                {[
                  { tone: FDR_TONE.easy, label: t("fplDashboard.smartReplace.fdrEasy", "Easy") },
                  { tone: FDR_TONE.mid, label: t("fplDashboard.smartReplace.fdrMid", "Mid") },
                  { tone: FDR_TONE.hard, label: t("fplDashboard.smartReplace.fdrHard", "Hard") },
                  { tone: FDR_TONE.veryHard, label: t("fplDashboard.smartReplace.fdrVeryHard", "Very hard") },
                ].map((l) => (
                  <span key={l.label} className="inline-flex items-center gap-1">
                    <span className={cx("h-2.5 w-2.5 rounded-sm ring-1 ring-inset ring-theme-border", l.tone)} />
                    {l.label}
                  </span>
                ))}
              </div>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
