"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaExchangeAlt } from "react-icons/fa";
import { PiTShirtFill } from "react-icons/pi";
import { getTeamColors } from "@/lib/team-colors";
import {
  TrendingUp,
  Sparkles,
  Gem,
  Flame,
  Star,
  ShieldCheck,
  Target as TargetIcon,
  Home,
  Plane,
  Swords,
  AlertTriangle,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  HelpCircle,
  ChevronDown,
} from "lucide-react";

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

const POSITION_LABEL: Record<number, string> = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };
const POSITION_ACCENT: Record<number, string> = {
  1: "from-amber-400 to-yellow-500",
  2: "from-sky-400 to-blue-500",
  3: "from-emerald-400 to-teal-500",
  4: "from-rose-400 to-red-500",
};
const CHIP_LABEL: Record<string, string> = {
  wildcard: "Wildcard",
  bboost: "Bench Boost",
  "3xc": "Triple Captain",
  freehit: "Free Hit",
};
const ALL_CHIPS = ["wildcard", "freehit", "bboost", "3xc"];

type FilterKey = "all" | "form" | "value" | "differential" | "reliable" | "premium";
type SortKey = "score" | "xp" | "form" | "price" | "fdr";

interface Reason {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
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
  verdict: { label: string; color: string; icon: React.ComponentType<{ className?: string }> };
  fixtures: FixtureRun[];
  reasons: Reason[];
  badges: { form: boolean; value: boolean; differential: boolean; reliable: boolean; premium: boolean };
}

const num = (v: any): number => {
  if (typeof v === "number") return v;
  const parsed = parseFloat(v);
  return Number.isFinite(parsed) ? parsed : 0;
};

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

function teamMotivation(pos: number | undefined, t: (key: string, fallback: string) => string): Reason | null {
  if (!pos) return null;
  if (pos <= 4)
    return {
      label: t("fplDashboard.smartReplace.topFourFight", "Top-4 fight"),
      icon: Swords,
      color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200/60 dark:border-violet-800/40",
    };
  if (pos >= 17)
    return {
      label: t("fplDashboard.smartReplace.relegationFight", "Relegation fight"),
      icon: AlertTriangle,
      color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200/60 dark:border-orange-800/40",
    };
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
  const ppg = num(p.points_per_game);
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
  t: (key: string, fallback: string, opts?: any) => string
): Reason[] {
  const reasons: Reason[] = [];
  // Double gameweek - highest signal value
  if ((ctx.fixturesInGw ?? 1) > 1) {
    reasons.push({
      label: t("fplDashboard.smartReplace.dgw", "DGW ×{{count}}", { count: ctx.fixturesInGw }),
      icon: Zap,
      color: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300 border-fuchsia-300/70 dark:border-fuchsia-800/40",
    });
  }
  // Penalty taker
  if (typeof p.penalties_order === "number" && p.penalties_order === 1) {
    reasons.push({
      label: t("fplDashboard.smartReplace.penaltyTaker", "Penalty taker"),
      icon: TargetIcon,
      color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40",
    });
  }
  const form = num(p.form);
  const ppg = num(p.points_per_game);
  const ownership = num(p.selected_by_percent);
  const priceChange = num(p.cost_change_event);
  const xgi90 = num(p.expected_goal_involvements_per_90) || num(p.expected_goals_per_90) + num(p.expected_assists_per_90);
  const minutes = num(p.minutes);
  const expectedMinutes = Math.max(ctx.currentGw, 1) * 90;
  const reliability = minutes / Math.max(expectedMinutes, 1);

  if (form >= 6) reasons.push({ label: t("fplDashboard.smartReplace.inForm", "In Form"), icon: Flame, color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40" });
  if (ppg > 0 && p.now_cost > 0) {
    const myRatio = ppg / (p.now_cost / 10);
    const selRatio = selected ? num(selected.points_per_game) / Math.max(num(selected.now_cost) / 10, 0.1) : 0;
    if (myRatio > selRatio && myRatio > 0.7)
      reasons.push({ label: t("fplDashboard.smartReplace.valuePick", "Value pick"), icon: Gem, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40" });
  }
  if (reliability >= 0.85) reasons.push({ label: t("fplDashboard.smartReplace.reliableStarter", "Reliable"), icon: ShieldCheck, color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/40" });
  if (xgi90 >= 0.55 && (p.element_type === 3 || p.element_type === 4))
    reasons.push({ label: t("fplDashboard.smartReplace.underlying", "Underlying"), icon: Activity, color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200/60 dark:border-teal-800/40" });
  if (priceChange > 0) reasons.push({ label: t("fplDashboard.smartReplace.priceRising", "Price rising"), icon: TrendingUp, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40" });
  if (ctx.fixture && ctx.fixture.difficulty <= 2) reasons.push({ label: t("fplDashboard.smartReplace.easyMatch", "Easy match"), icon: Zap, color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200/60 dark:border-green-800/40" });
  if (ownership > 25) reasons.push({ label: t("fplDashboard.smartReplace.popular", "Popular"), icon: Star, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200/60 dark:border-violet-800/40" });
  else if (ownership > 0 && ownership < 5 && form >= 4)
    reasons.push({ label: t("fplDashboard.smartReplace.differential", "Differential"), icon: Sparkles, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/40" });
  const mot = teamMotivation(ctx.team?.position, t);
  if (mot) reasons.push(mot);
  if (ctx.playChance > 0 && ctx.playChance < 100)
    reasons.push({ label: t("fplDashboard.smartReplace.playChance", "{{chance}}% chance", { chance: ctx.playChance }), icon: AlertTriangle, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200/60 dark:border-yellow-800/40" });
  return reasons.slice(0, 6);
}

function computeScore(
  p: any,
  selected: any,
  ctx: { fixture: FixtureRun | null; team?: TeamLite; currentGw: number; playChance: number; fixturesInGw: number }
): number {
  const form = num(p.form);
  const ppg = num(p.points_per_game);
  const total = num(p.total_points);
  const ict = num(p.ict_index);
  const xg90 = num(p.expected_goals_per_90);
  const xa90 = num(p.expected_assists_per_90);
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
  const isFwd = p.element_type === 4;

  let score = 0;
  score += form * 11;
  score += ppg * 6;
  score += total * 0.08;
  score += ict * 0.35;
  if (isAttacker) score += (xg90 + xa90) * 18;
  // FIX: penalize defenders with bad xGC (formerly capped at 0)
  if (isDefender) score += Math.max(-12, (4 - xgc90)) * 8;
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

function difficultyColor(d: number): string {
  if (d <= 2) return "bg-emerald-500";
  if (d === 3) return "bg-slate-400";
  if (d === 4) return "bg-orange-500";
  return "bg-rose-600";
}

function difficultyTextColor(d: number): string {
  if (d <= 2) return "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40";
  if (d === 3) return "text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800 border-slate-200/60 dark:border-slate-700/40";
  if (d === 4) return "text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-950/40 border-orange-200/60 dark:border-orange-800/40";
  return "text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/40";
}

function FixtureDots({ fixtures }: { fixtures: FixtureRun[] }) {
  if (fixtures.length === 0) return null;
  return (
    <div className="flex items-center gap-1">
      {fixtures.map((fx, i) => (
        <div key={i} className="group relative">
          <div
            className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[8px] font-bold text-white shadow-sm ${difficultyColor(fx.difficulty)}`}
            title={`GW${fx.event} ${fx.isHome ? "vs" : "@"} ${fx.opp} (FDR ${fx.difficulty})`}
          >
            {fx.isHome ? "H" : "A"}
          </div>
        </div>
      ))}
    </div>
  );
}

// Compact 3-GW fixture run with opponent short-name + difficulty colors
function FixtureRun3({ fixtures }: { fixtures: FixtureRun[] }) {
  const three = fixtures.slice(0, 3);
  if (three.length === 0) return null;
  return (
    <div className="flex items-center gap-1">
      {three.map((fx, i) => (
        <div
          key={i}
          className={`flex flex-col items-center justify-center min-w-[36px] px-1 py-0.5 rounded-md text-white shadow-sm ${difficultyColor(fx.difficulty)}`}
          title={`GW${fx.event} ${fx.isHome ? "vs" : "@"} ${fx.opp} · FDR ${fx.difficulty}`}
        >
          <span className="text-[8px] font-medium leading-none opacity-90">GW{fx.event}</span>
          <span className="text-[10px] font-bold leading-tight tracking-tight">
            {fx.isHome ? fx.opp : fx.opp.toLowerCase()}
          </span>
        </div>
      ))}
    </div>
  );
}

function buildVerdict(
  c: { xPDelta: number; player: any; selected: any; fixture: FixtureRun | null },
  t: (key: string, fallback: string) => string
) {
  const { xPDelta, player, selected, fixture } = c;
  const costDiff = (num(player.now_cost) - num(selected.now_cost)) / 10;
  const playChance = player.chance_of_playing_next_round;
  const lowChance = playChance !== null && playChance !== undefined && playChance < 75;
  const fdr = fixture?.difficulty ?? 3;

  if (lowChance) {
    return { label: t("fplDashboard.smartReplace.risk", "Risk"), color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200/60 dark:border-yellow-800/40", icon: AlertTriangle };
  }
  if (xPDelta >= 1.5 && costDiff <= 0) {
    return { label: t("fplDashboard.smartReplace.valueUpgrade", "Value upgrade"), color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40", icon: Gem };
  }
  if (xPDelta >= 2.5) {
    return { label: t("fplDashboard.smartReplace.premiumUpgrade", "Premium upgrade"), color: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40", icon: ArrowUpRight };
  }
  if (xPDelta >= 1.2) {
    return { label: t("fplDashboard.smartReplace.clearlyBetter", "Clearly better"), color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/40", icon: ArrowUpRight };
  }
  if (xPDelta <= -0.5) {
    return { label: t("fplDashboard.smartReplace.downgrade", "Downgrade"), color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/40", icon: ArrowDownRight };
  }
  if (fdr <= 2 && xPDelta >= 0.4) {
    return { label: t("fplDashboard.smartReplace.fixturePick", "Fixture pick"), color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200/60 dark:border-green-800/40", icon: Zap };
  }
  return { label: t("fplDashboard.smartReplace.sidegrade", "Sidegrade"), color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/40", icon: Info };
}

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
  const [burstId, setBurstId] = useState<number | null>(null);

  const handlePick = (p: any) => {
    if (!onPickReplacement) return;
    setBurstId(p.id);
    setTimeout(() => {
      onPickReplacement(p);
      setBurstId(null);
    }, 420);
  };

  const teamsById = useMemo(() => {
    const m = new Map<number, TeamLite>();
    allTeams.forEach((t) => m.set(t.id, t));
    return m;
  }, [allTeams]);

  const usedChipNames = useMemo(() => new Set(chipsUsed.map((c) => c.name)), [chipsUsed]);
  const availableChips = ALL_CHIPS.filter((c) => !usedChipNames.has(c));

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
        const ppg = num(p.points_per_game);
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

  const candidates = useMemo(() => {
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
    return sorted.slice(0, 8);
  }, [allCandidates, filter, sort]);

  const heroPick = allCandidates[0] || null;

  const positionLabel = selectedPlayer ? POSITION_LABEL[selectedPlayer.element_type] || "" : "";
  const positionAccent = selectedPlayer ? POSITION_ACCENT[selectedPlayer.element_type] || "from-slate-400 to-slate-500" : "from-slate-400 to-slate-500";

  const FILTERS: Array<{ key: FilterKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: "all", label: t("fplDashboard.smartReplace.all", "All"), icon: Sparkles },
    { key: "form", label: t("fplDashboard.smartReplace.inForm", "In Form"), icon: Flame },
    { key: "value", label: t("fplDashboard.smartReplace.value", "Value"), icon: Gem },
    { key: "differential", label: t("fplDashboard.smartReplace.differential", "Differential"), icon: Sparkles },
    { key: "reliable", label: t("fplDashboard.smartReplace.reliable", "Reliable"), icon: ShieldCheck },
    { key: "premium", label: t("fplDashboard.smartReplace.premium", "Premium"), icon: Star },
  ];

  const SORTS: Array<{ key: SortKey; label: string }> = [
    { key: "score", label: t("fplDashboard.smartReplace.sortScore", "Score") },
    { key: "xp", label: t("fplDashboard.smartReplace.sortXp", "xP") },
    { key: "form", label: t("fplDashboard.smartReplace.sortForm", "Form") },
    { key: "price", label: t("fplDashboard.smartReplace.sortPrice", "Price") },
    { key: "fdr", label: t("fplDashboard.smartReplace.sortFdr", "FDR") },
  ];

  return (
    <AnimatePresence>
      {open && selectedPlayer && (
        <>
          {/* Backdrop */}
          <motion.div
            key="smart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-[2px] z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            key="smart-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-16 sm:top-20 right-2 sm:right-4 bottom-2 sm:bottom-4 w-[calc(100%-1rem)] sm:w-[480px] z-50 bg-gradient-to-b from-white via-slate-50/80 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40 shadow-2xl border border-slate-200/70 dark:border-slate-700/60 rounded-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-5 pt-5 pb-3 border-b border-slate-200/70 dark:border-slate-700/60">
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${positionAccent}`} />
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br ${positionAccent} text-white shadow-sm shrink-0`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{t("fplDashboard.smartReplace.title", "Smart Recommendations")}</h3>
                      <button
                        onClick={() => setShowHelp((v) => !v)}
                        className="text-slate-400 hover:text-indigo-500 transition-colors"
                        title={t("fplDashboard.smartReplace.howCalculated", "How it's calculated")}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{t("fplDashboard.smartReplace.forGw", "For GW{{gw}}", { gw: nextGwNumber })} · {t("fplDashboard.smartReplace.subtitleMeta", "form, fixture, minutes, team, ICT")}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="shrink-0 w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <FaTimes className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Help expand */}
              <AnimatePresence>
                {showHelp && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 rounded-lg p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5">
                      <p><b className="text-indigo-700 dark:text-indigo-300">xP</b> = {t("fplDashboard.smartReplace.helpXp", "xP = expected points for GW{{gw}} (form + PPG, adjusted for fixture and play chance).", { gw: nextGwNumber })}</p>
                      <p><b className="text-indigo-700 dark:text-indigo-300">FDR</b> = {t("fplDashboard.smartReplace.helpFdr", "FDR = Fixture Difficulty Rating (1 easiest, 5 hardest). The square color indicates difficulty.")}</p>
                      <p><b className="text-indigo-700 dark:text-indigo-300">Verdikt</b>: {t("fplDashboard.smartReplace.helpVerdict", "Verdict: Premium / Value / Clearly better = recommended move; Sidegrade = same level; Risk = uncertain minutes.")}</p>
                      <p><b className="text-indigo-700 dark:text-indigo-300">Score</b> {t("fplDashboard.smartReplace.helpScore", "Score combines: form×11 + PPG×6 + xG/xA + minutes + FDR + team position.")}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Selected player card */}
              {(() => {
                const selColors = getTeamColors(selectedPlayer.team);
                return (
                  <div className="mt-3 rounded-lg p-3 bg-white/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/50 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center w-11 h-11 rounded-lg shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${selColors.primary}1a 0%, ${selColors.primary}0d 100%)`,
                        }}
                      >
                        <PiTShirtFill
                          className="w-7 h-7"
                          style={{
                            color: selColors.primary,
                            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
                          } as React.CSSProperties}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-gradient-to-br ${positionAccent} text-white`}>
                            {positionLabel}
                          </span>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{selectedPlayer.web_name}</p>
                          <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
                            {getTeamShortName(selectedPlayer.team)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="font-medium text-slate-700 dark:text-slate-200">£{(num(selectedPlayer.now_cost) / 10).toFixed(1)}m</span>
                          <span>F{num(selectedPlayer.form).toFixed(1)}</span>
                          <span>{num(selectedPlayer.total_points)}pts</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/40 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{t("fplDashboard.smartReplace.next5", "Next 5")}</span>
                        <FixtureDots fixtures={selectedFixtures} />
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mr-1">xP GW{nextGwNumber}</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedXP.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Chip status */}
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t("fplDashboard.smartReplace.budget", "Budget")}: <span className="font-semibold text-slate-700 dark:text-slate-200">£{((num(selectedPlayer.now_cost) + availableBudget) / 10).toFixed(1)}m</span>
                </span>
                <div className="flex items-center gap-1">
                  {ALL_CHIPS.map((c) => {
                    const used = usedChipNames.has(c);
                    return (
                      <span
                        key={c}
                        title={`${CHIP_LABEL[c]}: ${used ? t("fplDashboard.smartReplace.used", "used") : t("fplDashboard.smartReplace.availableShort", "available")}`}
                        className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                          used
                            ? "bg-slate-100 text-slate-400 line-through border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/50"
                        }`}
                      >
                        {c === "3xc" ? "TC" : c === "bboost" ? "BB" : c === "wildcard" ? "WC" : "FH"}
                      </span>
                    );
                  })}
                </div>
              </div>
              {availableChips.length > 0 && (
                <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">{t("fplDashboard.smartReplace.available", "Available")}: {availableChips.map((c) => CHIP_LABEL[c]).join(" · ")}</p>
              )}
            </div>

            {/* Hero verdict card */}
            {heroPick && (() => {
              const heroColors = getTeamColors(heroPick.player.team);
              return (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-3 mt-3 relative overflow-hidden rounded-xl p-3 bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50 dark:from-amber-950/30 dark:via-rose-950/20 dark:to-violet-950/30 border border-amber-200/60 dark:border-amber-800/40 shadow-sm"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 via-rose-400 to-violet-500" />
                <div className="flex items-start gap-2.5">
                  <div
                    className="flex items-center justify-center w-11 h-11 rounded-lg shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${heroColors.primary}22 0%, ${heroColors.primary}11 100%)`,
                    }}
                  >
                    <PiTShirtFill
                      className="w-7 h-7"
                      style={{
                        color: heroColors.primary,
                        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))",
                      } as React.CSSProperties}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-amber-700/80 dark:text-amber-300/80">
                      {t("fplDashboard.smartReplace.mainAdvantageForGw", "Main advantage for GW{{gw}}", { gw: nextGwNumber })}
                    </p>
                    <div className="mt-0.5 flex items-baseline gap-2">
                      <p className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">{heroPick.player.web_name}</p>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        {getTeamShortName(heroPick.player.team)}
                      </span>
                    </div>
                    {/* delta strip */}
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <div className="rounded-md p-1.5 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/40 text-center">
                        <p className="text-[9px] uppercase text-slate-500 dark:text-slate-400">xP</p>
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          {heroPick.xP.toFixed(1)}
                          <span className="ml-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                            ({heroPick.xPDelta > 0 ? "+" : ""}
                            {heroPick.xPDelta.toFixed(1)})
                          </span>
                        </p>
                      </div>
                      <div className="rounded-md p-1.5 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/40 text-center">
                        <p className="text-[9px] uppercase text-slate-500 dark:text-slate-400">{t("fplDashboard.smartReplace.sortForm", "Form")}</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {num(heroPick.player.form).toFixed(1)}
                          <span className="ml-1 text-[10px] text-slate-500">
                            ({num(heroPick.player.form) - num(selectedPlayer.form) >= 0 ? "+" : ""}
                            {(num(heroPick.player.form) - num(selectedPlayer.form)).toFixed(1)})
                          </span>
                        </p>
                      </div>
                      <div className="rounded-md p-1.5 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/40 text-center">
                        <p className="text-[9px] uppercase text-slate-500 dark:text-slate-400">FDR</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {heroPick.fixtures[0]?.difficulty ?? "—"}
                          {selectedNextFixture && heroPick.fixtures[0] && (
                            <span className="ml-1 text-[10px] text-slate-500">
                              ({selectedNextFixture.difficulty - heroPick.fixtures[0].difficulty > 0 ? "−" : "+"}
                              {Math.abs(selectedNextFixture.difficulty - heroPick.fixtures[0].difficulty)})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                      {(() => {
                        const reasons = [];
                        if (heroPick.xPDelta >= 1.5) reasons.push(t("fplDashboard.smartReplace.extraExpectedPoints", "+{{value}} expected points", { value: heroPick.xPDelta.toFixed(1) }));
                        if (heroPick.fixtures[0] && selectedNextFixture && heroPick.fixtures[0].difficulty < selectedNextFixture.difficulty)
                          reasons.push(t("fplDashboard.smartReplace.easierFixture", "easier fixture (FDR {{fdr}})", { fdr: heroPick.fixtures[0].difficulty }));
                        if (num(heroPick.player.form) > num(selectedPlayer.form) + 1) reasons.push(t("fplDashboard.smartReplace.betterForm", "better form"));
                        if (heroPick.fixtures[0]?.isHome) reasons.push(t("fplDashboard.smartReplace.playsAtHome", "plays at home"));
                        if (heroPick.badges.value) reasons.push(t("fplDashboard.smartReplace.betterValue", "better value"));
                        return reasons.length > 0 ? reasons.join(" · ") : t("fplDashboard.smartReplace.solidAlternative", "Solid alternative by overall score.");
                      })()}
                    </p>
                  </div>
                </div>
              </motion.div>
              );
            })()}

            {/* Filter chips - simpler without icons */}
            <div className="px-3 pt-3 flex flex-wrap gap-1.5">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                const count = filterCounts[f.key];
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                      active
                        ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                        : "bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                    }`}
                  >
                    {f.label}
                    {count > 0 && (
                      <span className={`text-[9px] px-1 rounded-full ${active ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sort */}
            <div className="px-3 pt-2 pb-1 flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">{t("fplDashboard.smartReplace.recommendations", "{{count}} recommendations", { count: candidates.length })}</span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="appearance-none text-[11px] font-medium pl-2 pr-6 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                >
                  {SORTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {t("fplDashboard.smartReplace.sortLabel", "Sort: {{label}}", { label: s.label })}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Candidates */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 pt-1 space-y-2.5">
              {candidates.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t("fplDashboard.smartReplace.noRecommendations", "No recommendations in this filter.")}</p>
                  <button onClick={() => setFilter("all")} className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                    {t("fplDashboard.smartReplace.showAll", "Show all")}
                  </button>
                </div>
              )}
              {candidates.map((c, idx) => {
                const p = c.player;
                const diff = num(p.now_cost) - num(selectedPlayer.now_cost);
                const diffSign = diff > 0 ? "+" : "";
                const isTop = idx === 0 && filter === "all" && sort === "score";
                const candColors = getTeamColors(p.team);
                // Keep only the 2 most important reason chips for a clean look
                const topReasons = c.reasons.slice(0, 2);
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`group rounded-xl p-3 bg-white dark:bg-slate-900/70 border ${
                      isTop
                        ? "border-amber-300/70 dark:border-amber-700/60 shadow-md shadow-amber-100/40 dark:shadow-amber-900/10"
                        : "border-slate-200/70 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-700"
                    } hover:shadow-md transition-all`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Jersey */}
                      <div
                        className="flex items-center justify-center w-11 h-11 rounded-lg shrink-0 relative"
                        style={{
                          background: `linear-gradient(135deg, ${candColors.primary}1a 0%, ${candColors.primary}0d 100%)`,
                        }}
                      >
                        <PiTShirtFill
                          className="w-7 h-7"
                          style={{
                            color: candColors.primary,
                            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
                          } as React.CSSProperties}
                        />
                        {isTop && (
                          <span className="absolute -top-1 -left-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-white text-[8px] font-bold shadow-sm">
                            ★
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        {/* Top row: name + team */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{p.web_name}</p>
                          <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                            {getTeamShortName(p.team)}
                          </span>
                        </div>
                        {/* xP and price row */}
                        <div className="mt-1 flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className={`font-bold ${c.xPDelta >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600 dark:text-rose-400"}`}>
                            xP {c.xP.toFixed(1)}
                            <span className="ml-0.5 opacity-80">
                              ({c.xPDelta > 0 ? "+" : ""}
                              {c.xPDelta.toFixed(1)})
                            </span>
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="font-medium text-slate-700 dark:text-slate-200">£{(num(p.now_cost) / 10).toFixed(1)}m</span>
                          {diff !== 0 && (
                            <span className={`text-[10px] ${diff > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                              {diffSign}£{(Math.abs(diff) / 10).toFixed(1)}
                            </span>
                          )}
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span>F{num(p.form).toFixed(1)}</span>
                        </div>
                        {/* Next 3 GWs fixture run */}
                        {c.fixtures.length > 0 && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">{t("fplDashboard.smartReplace.nextThree", "Next 3:")}</span>
                            <FixtureRun3 fixtures={c.fixtures} />
                          </div>
                        )}
                        {/* Reason chips - max 2 + verdict if notable */}
                        {(topReasons.length > 0 || (c.xPDelta >= 1.2 || c.xPDelta <= -0.5)) && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {(c.xPDelta >= 1.2 || c.xPDelta <= -0.5) && (
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${c.verdict.color}`}>
                                {c.verdict.label}
                              </span>
                            )}
                            {topReasons.map((r, i) => (
                              <span key={i} className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${r.color}`}>
                                {r.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {onPickReplacement && (
                        <div className="relative shrink-0">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePick(p)}
                            className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all overflow-hidden"
                            title={isTransferMode ? "Add to transfer" : "Start transfer with this player"}
                          >
                            <motion.span
                              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                              animate={{ x: ["-150%", "350%"] }}
                              transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
                            />
                            <FaExchangeAlt className="relative w-3 h-3" />
                            <span className="relative">{isTransferMode ? t("fplDashboard.smartReplace.swap", "Swap") : t("fplDashboard.smartReplace.transfer", "Transfer")}</span>
                          </motion.button>
                          {burstId === p.id && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                              {Array.from({ length: 10 }).map((_, k) => (
                                <motion.span
                                  key={k}
                                  className="absolute text-emerald-400"
                                  style={{ fontSize: 10 + (k % 3) * 3 }}
                                  initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                                  animate={{
                                    opacity: 0,
                                    x: Math.cos((k / 10) * Math.PI * 2) * 40,
                                    y: Math.sin((k / 10) * Math.PI * 2) * 40,
                                    scale: 0.4,
                                  }}
                                  transition={{ duration: 0.6, ease: "easeOut" }}
                                >
                                  ✦
                                </motion.span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* FDR legend */}
            <div className="border-t border-slate-200/70 dark:border-slate-700/60 px-4 py-2 bg-white/60 dark:bg-slate-900/40">
              <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                <span>{t("fplDashboard.smartReplace.fdr", "FDR")}:</span>
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500" /> {t("fplDashboard.smartReplace.fdrEasy", "Easy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-slate-400" /> {t("fplDashboard.smartReplace.fdrMid", "Mid")}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-orange-500" /> {t("fplDashboard.smartReplace.fdrHard", "Hard")}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-rose-600" /> {t("fplDashboard.smartReplace.fdrVeryHard", "Very hard")}
                  </span>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
