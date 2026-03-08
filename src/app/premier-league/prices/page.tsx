"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getTeamColors } from "@/lib/team-colors";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Clock,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PricePlayer {
  id: number;
  web_name: string;
  team: number;
  team_short: string;
  element_type: number;
  now_cost: number;
  cost_change_start: number;
  selected_by_percent: number;
  form: number;
  transfers_in_event: number;
  transfers_out_event: number;
  net_transfers: number;
  delta: number; // 0-100 progress toward price change
  change_time: string;
  target_reached: boolean;
  status: "a" | "d" | "i" | "n" | "s" | "u";
  news: string;
}

// ─── Probability-Based Price Prediction Algorithm ───────────────────────────
//
// Advanced algorithm using sigmoid probability, ownership-weighted thresholds,
// cooldown logic, and recent-change dampening. Matches LiveFPL-style behavior.

const K = {
  BASE_UP_THRESHOLD: 3.0,
  BASE_DOWN_THRESHOLD: 3.0,
  OWNERSHIP_UP_EXP: 0.8,
  OWNERSHIP_DOWN_EXP: 0.8,
  FLAG_DOWN_MULT: { none: 1.0, yellow: 0.8, red: 0.6 } as Record<string, number>,
  FLAG_UP_MULT: { none: 1.0, yellow: 0.9, red: 0.8 } as Record<string, number>,
  COOLDOWN_HOURS: 24,
  RECENT_DAYS_DAMP: 7,
  RECENT_UP_DAMP: 0.3,
  RECENT_DOWN_DAMP: 0.3,
  LAMBDA_SIGMOID: 2.0,
  TIME_WEIGHT_ENDGAME: 1.05,
  MIN_ACTIVE_MANAGERS: 6_000_000,
  MIN_NET_TRANSFERS: 1500,
};

function hoursSince(ts: number, now: number): number {
  return (now - ts) / 3600_000;
}

function isRecentChange(lastTs: number | null, now: number, days: number): boolean {
  if (!lastTs) return false;
  return (now - lastTs) <= days * 24 * 3600_000;
}

function logistic(x: number, lambda = K.LAMBDA_SIGMOID): number {
  return 1 / (1 + Math.exp(-lambda * x));
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function upThreshold(ownership_pct: number, flag: string): number {
  const own = Math.max(0.01, ownership_pct / 100);
  const base = K.BASE_UP_THRESHOLD * Math.pow(own, K.OWNERSHIP_UP_EXP);
  const flagMult = K.FLAG_UP_MULT[flag] || 1.0;
  return base * flagMult;
}

function downThreshold(ownership_pct: number, flag: string): number {
  const own = Math.max(0.01, ownership_pct / 100);
  const base = K.BASE_DOWN_THRESHOLD * Math.pow(own, K.OWNERSHIP_DOWN_EXP);
  const flagMult = K.FLAG_DOWN_MULT[flag] || 1.0;
  return base * flagMult;
}

function normalizedNTI(transfers_in_gw: number, active_managers: number, ownership_pct: number): number {
  const act = Math.max(K.MIN_ACTIVE_MANAGERS, active_managers);
  const own = Math.max(0.01, ownership_pct / 100);
  return (transfers_in_gw / act) / own;
}

function normalizedNTO(transfers_out_gw: number, active_managers: number, ownership_pct: number): number {
  const act = Math.max(K.MIN_ACTIVE_MANAGERS, active_managers);
  const own = Math.max(0.01, ownership_pct / 100);
  return (transfers_out_gw / act) / own;
}

function timeWeight(now: number, gw_start: number, gw_deadline: number): number {
  if (now <= gw_start || now >= gw_deadline) return 1.0;
  const p = (now - gw_start) / (gw_deadline - gw_start);
  return 1.0 + (K.TIME_WEIGHT_ENDGAME - 1.0) * p;
}

function estimatePriceChangeProb(inputs: {
  transfers_in_gw: number;
  transfers_out_gw: number;
  ownership_pct: number;
  flag: string;
  last_price_change_at: number | null;
  price_change_dir_last: "up" | "down" | null;
  active_managers_estimate: number;
  now: number;
  gw_start_at: number;
  gw_deadline_at: number;
}) {
  const ntiNorm = normalizedNTI(inputs.transfers_in_gw, inputs.active_managers_estimate, inputs.ownership_pct);
  const ntoNorm = normalizedNTO(inputs.transfers_out_gw, inputs.active_managers_estimate, inputs.ownership_pct);

  const thUp = upThreshold(inputs.ownership_pct, inputs.flag);
  const thDown = downThreshold(inputs.ownership_pct, inputs.flag);

  let scoreUp = (ntiNorm / thUp) - 1.0;
  let scoreDown = (ntoNorm / thDown) - 1.0;

  // Cooldown logic
  if (inputs.last_price_change_at && hoursSince(inputs.last_price_change_at, inputs.now) < K.COOLDOWN_HOURS) {
    scoreUp *= 0.25;
    scoreDown *= 0.25;
  }

  // Recent change dampening
  const recent = isRecentChange(inputs.last_price_change_at, inputs.now, K.RECENT_DAYS_DAMP);
  if (recent) {
    if (inputs.price_change_dir_last === "up") scoreUp *= K.RECENT_UP_DAMP;
    if (inputs.price_change_dir_last === "down") scoreDown *= K.RECENT_DOWN_DAMP;
  }

  // Time weighting
  const tw = timeWeight(inputs.now, inputs.gw_start_at, inputs.gw_deadline_at);
  scoreUp *= tw;
  scoreDown *= tw;

  // Convert to probabilities via sigmoid
  const prob_up = clamp01(logistic(scoreUp));
  const prob_down = clamp01(logistic(scoreDown));

  // Determine signal - conservative thresholds
  let signal: "likely_up" | "likely_down" | "neutral" = "neutral";
  if (prob_up >= 0.85 && prob_up - prob_down >= 0.25) signal = "likely_up";
  else if (prob_down >= 0.85 && prob_down - prob_up >= 0.25) signal = "likely_down";

  return { prob_up, prob_down, signal };
}

function calculatePrediction(
  transfers_in_gw: number,
  transfers_out_gw: number,
  ownership_pct: number,
  flag: string,
  isRiser: boolean,
  lastPriceChangeAt: number | null,
  priceChangeDirLast: "up" | "down" | null,
  gwStart: number,
  gwDeadline: number,
): { progress: number; change_time: string; target_reached: boolean } {
  const now = Date.now();

  const result = estimatePriceChangeProb({
    transfers_in_gw,
    transfers_out_gw,
    ownership_pct,
    flag,
    last_price_change_at: lastPriceChangeAt,
    price_change_dir_last: priceChangeDirLast,
    active_managers_estimate: K.MIN_ACTIVE_MANAGERS,
    now,
    gw_start_at: gwStart,
    gw_deadline_at: gwDeadline,
  });

  // Delta = probability * 100, directly maps to bar fill %
  const prob = isRiser ? result.prob_up : result.prob_down;
  const delta = Math.round(Math.min(100, Math.max(0, prob * 100)));

  let change_time: string;
  if (delta >= 90) {
    change_time = "Tonight";
  } else if (delta >= 75) {
    change_time = "Tomorrow";
  } else if (delta >= 55) {
    change_time = "2 days";
  } else {
    change_time = ">2 days";
  }

  const target_reached = result.signal !== "neutral";

  return { progress: delta, change_time, target_reached };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const POS_LABELS: Record<number, string> = {
  1: "GKP",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

function formatPrice(cost: number): string {
  return `£${(cost / 10).toFixed(1)}`;
}

function formatNet(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function getStatusFlag(status: string): string {
  if (status === "i" || status === "s" || status === "n") return "red";
  if (status === "d") return "yellow";
  return "none";
}

// ─── Component ──────────────────────────────────────────────────────────────

type SortKey = "delta" | "price" | "net" | "ownership" | "form";

export default function PricesPage() {
  const { t } = useTranslation("fpl");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [risers, setRisers] = useState<PricePlayer[]>([]);
  const [fallers, setFallers] = useState<PricePlayer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [timeRemaining, setTimeRemaining] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("delta");
  const [sortAsc, setSortAsc] = useState(false);
  const [teams, setTeams] = useState<{ id: number; short_name: string; name: string }[]>([]);

  // ─── Data Fetching ──────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch bootstrap data and price changes in parallel
      const [bootstrapRes, priceChangesRes] = await Promise.all([
        fetch("/api/fpl/bootstrap-static"),
        fetch("/api/fpl/price-changes").catch(() => null),
      ]);

      if (!bootstrapRes.ok) {
        throw new Error("Failed to fetch FPL data");
      }

      const bootstrapData = await bootstrapRes.json();
      if (!bootstrapData.success) {
        throw new Error("FPL API returned an error");
      }

      const priceChangesData = priceChangesRes && priceChangesRes.ok
        ? await priceChangesRes.json()
        : null;

      const elements: any[] = bootstrapData.data.elements || [];
      const teamsList: any[] = bootstrapData.data.teams || [];
      const events: any[] = bootstrapData.data.events || [];

      // Determine GW timing from events
      const now = Date.now();
      const currentEvent = events.find((e: any) => e.is_current) || events[0];
      const nextEvent = events.find((e: any) => e.is_next);
      const gwStart = currentEvent?.deadline_time
        ? new Date(currentEvent.deadline_time).getTime()
        : now - (2 * 24 * 60 * 60 * 1000);
      const gwDeadline = nextEvent?.deadline_time
        ? new Date(nextEvent.deadline_time).getTime()
        : now + (5 * 24 * 60 * 60 * 1000);

      // Build recent price changes lookup
      const recentChangesMap = new Map<number, { at: number; dir: "up" | "down" }>();
      if (priceChangesData?.success && priceChangesData.data) {
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        const allChanges = [
          ...(priceChangesData.data.risers || []),
          ...(priceChangesData.data.fallers || []),
        ];
        for (const change of allChanges) {
          const changeTime = new Date(change.change_time).getTime();
          if (changeTime > sevenDaysAgo) {
            recentChangesMap.set(change.player_id, {
              at: changeTime,
              dir: change.change_type === "rise" ? "up" : "down",
            });
          }
        }
      }

      // Build team list for filter
      const sortedTeams = teamsList
        .map((t: any) => ({ id: t.id, short_name: t.short_name, name: t.name }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
      setTeams(sortedTeams);

      // Build team short name lookup
      const teamShortMap = new Map<number, string>();
      for (const t of teamsList) {
        teamShortMap.set(t.id, t.short_name);
      }

      // Process ALL players with probability-based algorithm
      const riserList: PricePlayer[] = [];
      const fallerList: PricePlayer[] = [];

      for (const el of elements) {
        const netIn = el.transfers_in_event || 0;
        const netOut = el.transfers_out_event || 0;
        const ownership = parseFloat(el.selected_by_percent) || 0;
        const netTransfers = netIn - netOut;
        const flag = getStatusFlag(el.status || "a");

        // Lookup recent price change for this player
        const recentChange = recentChangesMap.get(el.id);
        const lastPriceChangeAt = recentChange?.at || null;
        const priceChangeDirLast = recentChange?.dir || null;

        if (netTransfers > 0 && netIn >= K.MIN_NET_TRANSFERS) {
          const prediction = calculatePrediction(
            netIn, netOut, ownership, flag, true,
            lastPriceChangeAt, priceChangeDirLast,
            gwStart, gwDeadline,
          );

          riserList.push({
            id: el.id,
            web_name: el.web_name,
            team: el.team,
            team_short: teamShortMap.get(el.team) || "?",
            element_type: el.element_type,
            now_cost: el.now_cost,
            cost_change_start: el.cost_change_start || 0,
            selected_by_percent: ownership,
            form: parseFloat(el.form) || 0,
            transfers_in_event: netIn,
            transfers_out_event: netOut,
            net_transfers: netTransfers,
            delta: prediction.progress,
            change_time: prediction.change_time,
            target_reached: prediction.target_reached,
            status: el.status,
            news: el.news || "",
          });
        } else if (netTransfers < 0 && netOut >= K.MIN_NET_TRANSFERS) {
          const prediction = calculatePrediction(
            netIn, netOut, ownership, flag, false,
            lastPriceChangeAt, priceChangeDirLast,
            gwStart, gwDeadline,
          );

          fallerList.push({
            id: el.id,
            web_name: el.web_name,
            team: el.team,
            team_short: teamShortMap.get(el.team) || "?",
            element_type: el.element_type,
            now_cost: el.now_cost,
            cost_change_start: el.cost_change_start || 0,
            selected_by_percent: ownership,
            form: parseFloat(el.form) || 0,
            transfers_in_event: netIn,
            transfers_out_event: netOut,
            net_transfers: netTransfers,
            delta: prediction.progress,
            change_time: prediction.change_time,
            target_reached: prediction.target_reached,
            status: el.status,
            news: el.news || "",
          });
        }
      }

      // Sort by delta descending
      riserList.sort((a, b) => b.delta - a.delta);
      fallerList.sort((a, b) => b.delta - a.delta);

      setRisers(riserList);
      setFallers(fallerList);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load price data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Countdown Timer ────────────────────────────────────────────────────

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const target = new Date();
      target.setUTCHours(1, 30, 0, 0);
      if (target.getTime() <= now.getTime()) {
        target.setUTCDate(target.getUTCDate() + 1);
      }
      const diff = target.getTime() - now.getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Filtering + Sorting ────────────────────────────────────────────────

  const applyFilters = useCallback(
    (players: PricePlayer[]) => {
      let filtered = players;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.web_name.toLowerCase().includes(q) ||
            p.team_short.toLowerCase().includes(q)
        );
      }
      if (selectedTeam !== "all") {
        filtered = filtered.filter(
          (p) => p.team_short === selectedTeam
        );
      }
      const sorted = [...filtered].sort((a, b) => {
        let va: number, vb: number;
        switch (sortKey) {
          case "delta":
            va = a.delta; vb = b.delta; break;
          case "price":
            va = a.now_cost; vb = b.now_cost; break;
          case "net":
            va = Math.abs(a.net_transfers); vb = Math.abs(b.net_transfers); break;
          case "ownership":
            va = a.selected_by_percent; vb = b.selected_by_percent; break;
          case "form":
            va = a.form; vb = b.form; break;
          default:
            va = a.delta; vb = b.delta;
        }
        return sortAsc ? va - vb : vb - va;
      });
      return sorted;
    },
    [searchQuery, selectedTeam, sortKey, sortAsc]
  );

  const filteredRisers = useMemo(
    () => applyFilters(risers),
    [risers, applyFilters]
  );
  const filteredFallers = useMemo(
    () => applyFilters(fallers),
    [fallers, applyFilters]
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  // ─── Stats ──────────────────────────────────────────────────────────────

  const risersAboveTarget = risers.filter((p) => p.target_reached).length;
  const fallersAboveTarget = fallers.filter((p) => p.target_reached).length;

  // ─── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-background theme-transition">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-theme-card-secondary rounded w-64" />
            <div className="h-4 bg-theme-card-secondary rounded w-96" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-theme-card-secondary rounded-lg" />
              ))}
            </div>
            <div className="h-96 bg-theme-card-secondary rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-theme-background theme-transition">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-theme-card border border-theme-border rounded-lg p-8 text-center">
            <p className="text-theme-foreground font-medium mb-2">
              {t("common.error")}
            </p>
            <p className="text-theme-text-secondary text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-theme-foreground text-theme-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {t("prices.retry") || "Retry"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-theme-background theme-transition">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-theme-foreground tracking-tight">
            {t("prices.title")}
          </h1>
          <p className="text-sm text-theme-text-secondary mt-1 max-w-xl">
            {t("prices.subtitle")}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-theme-card border border-theme-border rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-theme-text-secondary" />
              <span className="text-xs text-theme-text-secondary font-medium uppercase tracking-wider">
                {t("prices.predictedRises")}
              </span>
            </div>
            <p className="text-xl font-bold text-theme-foreground">
              {risersAboveTarget}
              <span className="text-sm font-normal text-theme-text-secondary ml-1">
                / {risers.length}
              </span>
            </p>
          </div>

          <div className="bg-theme-card border border-theme-border rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-theme-text-secondary" />
              <span className="text-xs text-theme-text-secondary font-medium uppercase tracking-wider">
                {t("prices.predictedFalls")}
              </span>
            </div>
            <p className="text-xl font-bold text-theme-foreground">
              {fallersAboveTarget}
              <span className="text-sm font-normal text-theme-text-secondary ml-1">
                / {fallers.length}
              </span>
            </p>
          </div>

          <div className="bg-theme-card border border-theme-border rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 text-theme-text-secondary" />
              <span className="text-xs text-theme-text-secondary font-medium uppercase tracking-wider">
                {t("prices.nextUpdate")}
              </span>
            </div>
            <p className="text-lg font-bold text-theme-foreground tabular-nums">
              {timeRemaining}
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-secondary" />
            <input
              type="text"
              placeholder={t("prices.searchPlayer")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-theme-card border border-theme-border rounded-lg text-sm text-theme-foreground placeholder:text-theme-text-secondary focus:outline-none focus:ring-1 focus:ring-theme-foreground/20"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 bg-theme-card border border-theme-border rounded-lg text-sm text-theme-foreground focus:outline-none focus:ring-1 focus:ring-theme-foreground/20 cursor-pointer"
              >
                <option value="all">{t("prices.allTeams")}</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.short_name}>
                    {team.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-text-secondary pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <PriceTable
            title={t("prices.priceRisers")}
            players={filteredRisers}
            isRiser={true}
            sortKey={sortKey}
            sortAsc={sortAsc}
            onSort={handleSort}
            t={t}
          />
          <PriceTable
            title={t("prices.priceFallers")}
            players={filteredFallers}
            isRiser={false}
            sortKey={sortKey}
            sortAsc={sortAsc}
            onSort={handleSort}
            t={t}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-theme-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-theme-text-secondary">
            <p>{t("prices.updateInfo")}</p>
            <p>
              {t("prices.lastUpdated")}:{" "}
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PriceTable Component ─────────────────────────────────────────────────

function PriceTable({
  title,
  players,
  isRiser,
  sortKey,
  sortAsc,
  onSort,
  t,
}: {
  title: string;
  players: PricePlayer[];
  isRiser: boolean;
  sortKey: SortKey;
  sortAsc: boolean;
  onSort: (key: SortKey) => void;
  t: any;
}) {
  const SortButton = ({
    label,
    sortKeyName,
    className = "",
  }: {
    label: string;
    sortKeyName: SortKey;
    className?: string;
  }) => (
    <button
      onClick={() => onSort(sortKeyName)}
      className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wider hover:text-theme-foreground transition-colors ${
        sortKey === sortKeyName
          ? "text-theme-foreground"
          : "text-theme-text-secondary"
      } ${className}`}
    >
      {label}
      {sortKey === sortKeyName && (
        <ArrowUpDown className="w-3 h-3" />
      )}
    </button>
  );

  return (
    <div className="bg-theme-card border border-theme-border rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border">
        <div className="flex items-center gap-2">
          {isRiser ? (
            <TrendingUp className="w-4 h-4 text-theme-text-secondary" />
          ) : (
            <TrendingDown className="w-4 h-4 text-theme-text-secondary" />
          )}
          <h2 className="text-sm font-semibold text-theme-foreground">
            {title}
          </h2>
        </div>
        <span className="text-xs text-theme-text-secondary">
          {players.length} {t("prices.players") || "players"}
        </span>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-theme-border bg-theme-card-secondary">
              <th className="px-4 py-2.5 text-left">
                <SortButton label={t("prices.player")} sortKeyName="delta" />
              </th>
              <th className="px-3 py-2.5 text-right">
                <SortButton
                  label={t("prices.price")}
                  sortKeyName="price"
                  className="justify-end"
                />
              </th>
              <th className="px-3 py-2.5 text-center w-36">
                <SortButton
                  label="Delta"
                  sortKeyName="delta"
                  className="justify-center"
                />
              </th>
              <th className="px-3 py-2.5 text-right">
                <SortButton
                  label={t("prices.transfers")}
                  sortKeyName="net"
                  className="justify-end"
                />
              </th>
              <th className="px-3 py-2.5 text-right">
                <SortButton
                  label={t("prices.ownership")}
                  sortKeyName="ownership"
                  className="justify-end"
                />
              </th>
              <th className="px-4 py-2.5 text-right">
                <span className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                  {t("prices.timing")}
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {players.slice(0, 25).map((player) => (
              <PlayerRowDesktop
                key={player.id}
                player={player}
                isRiser={isRiser}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden divide-y divide-theme-border">
        {players.slice(0, 25).map((player) => (
          <PlayerRowMobile
            key={player.id}
            player={player}
            isRiser={isRiser}
          />
        ))}
      </div>

      {/* Empty State */}
      {players.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-theme-text-secondary">
            {isRiser
              ? t("prices.noRisersFound") || "No predicted risers"
              : t("prices.noFallersFound") || "No predicted fallers"}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Desktop Row ──────────────────────────────────────────────────────────

function PlayerRowDesktop({
  player,
  isRiser,
}: {
  player: PricePlayer;
  isRiser: boolean;
}) {
  const teamColors = getTeamColors(player.team);
  const isTarget = player.target_reached;
  const seasonChange = player.now_cost - player.cost_change_start;

  return (
    <tr className="hover:bg-theme-card-secondary/50 transition-colors">
      {/* Player */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: teamColors.primary }}
          >
            {player.web_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-theme-foreground truncate">
                {player.web_name}
              </span>
              {isTarget && (
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isRiser ? "bg-green-500" : "bg-red-500"
                  }`}
                />
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-theme-text-secondary">
                {player.team_short}
              </span>
              <span className="text-xs text-theme-text-secondary opacity-50">
                ·
              </span>
              <span className="text-xs text-theme-text-secondary">
                {POS_LABELS[player.element_type] || "?"}
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* Price */}
      <td className="px-3 py-3 text-right">
        <span className="text-sm font-medium text-theme-foreground tabular-nums">
          {formatPrice(player.now_cost)}
        </span>
        {seasonChange !== 0 && (
          <div
            className={`text-xs tabular-nums ${
              seasonChange > 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {seasonChange > 0 ? "+" : ""}
            {(seasonChange / 10).toFixed(1)}
          </div>
        )}
      </td>

      {/* Delta Bar */}
      <td className="px-3 py-3">
        <DeltaBar delta={player.delta} isRiser={isRiser} isTarget={isTarget} />
      </td>

      {/* Net Transfers */}
      <td className="px-3 py-3 text-right">
        <span
          className={`text-sm font-medium tabular-nums ${
            isRiser
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {isRiser ? "+" : ""}
          {formatNet(player.net_transfers)}
        </span>
      </td>

      {/* Ownership */}
      <td className="px-3 py-3 text-right">
        <span className="text-sm text-theme-foreground tabular-nums">
          {player.selected_by_percent.toFixed(1)}%
        </span>
        <div className="text-xs text-theme-text-secondary tabular-nums">
          {player.form.toFixed(1)} form
        </div>
      </td>

      {/* Timing */}
      <td className="px-4 py-3 text-right">
        <span
          className={`text-xs font-medium ${
            isTarget ? "text-theme-foreground" : "text-theme-text-secondary"
          }`}
        >
          {player.change_time}
        </span>
      </td>
    </tr>
  );
}

// ─── Mobile Row ───────────────────────────────────────────────────────────

function PlayerRowMobile({
  player,
  isRiser,
}: {
  player: PricePlayer;
  isRiser: boolean;
}) {
  const teamColors = getTeamColors(player.team);
  const isTarget = player.target_reached;

  return (
    <div className="px-4 py-3 hover:bg-theme-card-secondary/50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: teamColors.primary }}
          >
            {player.web_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-theme-foreground truncate">
                {player.web_name}
              </span>
              {isTarget && (
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isRiser ? "bg-green-500" : "bg-red-500"
                  }`}
                />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-theme-text-secondary">
                {player.team_short}
              </span>
              <span className="text-xs text-theme-text-secondary opacity-50">
                ·
              </span>
              <span className="text-xs text-theme-text-secondary">
                {POS_LABELS[player.element_type] || "?"}
              </span>
              <span className="text-xs text-theme-text-secondary opacity-50">
                ·
              </span>
              <span className="text-xs text-theme-text-secondary tabular-nums">
                {formatPrice(player.now_cost)}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <span
            className={`text-sm font-medium tabular-nums ${
              isRiser
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {isRiser ? "+" : ""}
            {formatNet(player.net_transfers)}
          </span>
          <div className="text-xs text-theme-text-secondary">
            {player.selected_by_percent.toFixed(1)}% own
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <DeltaBar delta={player.delta} isRiser={isRiser} isTarget={isTarget} />
        </div>
        <span
          className={`text-xs font-medium w-16 text-right ${
            isTarget ? "text-theme-foreground" : "text-theme-text-secondary"
          }`}
        >
          {player.change_time}
        </span>
      </div>
    </div>
  );
}

// ─── Delta Bar Component ──────────────────────────────────────────────────

function getDeltaColor(delta: number, isRiser: boolean): string {
  if (isRiser) {
    if (delta >= 75) return "bg-green-500";
    if (delta >= 50) return "bg-yellow-500";
    return "bg-red-400";
  } else {
    if (delta >= 75) return "bg-red-500";
    if (delta >= 50) return "bg-yellow-500";
    return "bg-green-400";
  }
}

function DeltaBar({
  delta,
  isRiser,
  isTarget,
}: {
  delta: number;
  isRiser: boolean;
  isTarget: boolean;
}) {
  const pct = Math.min(100, Math.max(2, delta));

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-theme-card-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getDeltaColor(delta, isRiser)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-xs font-medium tabular-nums w-10 text-right ${
          isTarget ? "text-theme-foreground" : "text-theme-text-secondary"
        }`}
      >
        {Math.round(delta)}%
      </span>
    </div>
  );
}
