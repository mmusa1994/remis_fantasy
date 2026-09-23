"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { dateLocale } from "@/components/fpl/live/ui";
import { getTeamColors, registerFplTeams } from "@/lib/team-colors";
import TeamJersey from "@/components/fpl/TeamJersey";
import TeamSelect from "@/components/fpl/TeamSelect";
import { TrendingUp, TrendingDown, Search, Clock } from "lucide-react";

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
  percent: number; // official FPL progress, signed (±100 = change)
  delta: number; // |percent| capped at 100, for the bar
  likelihood: number; // tonight's official likelihood (-5..5)
  change_time: string; // prices.* key
  target_reached: boolean; // FPL says (very) likely tonight
  locked_until: string | null;
  calibrating: boolean;
  status: "a" | "d" | "i" | "n" | "s" | "u";
  news: string;
}

// ─── Official FPL price-change data ─────────────────────────────────────────
//
// FPL now publishes its own predictions in bootstrap-static (same data as
// fantasy.premierleague.com/price-changes): price_change_percent is the
// progress towards a change, price_change_projections gives a likelihood for
// tonight / tomorrow / the day after (±4 likely, ±5 very likely).

const TIMING_KEYS = ["tonight", "tomorrow", "twoDays"];

interface Projection {
  offset: number;
  projected_percent: string;
  likelihood: number;
}

function officialTiming(projections: Projection[], rising: boolean): string {
  const idx = projections.findIndex((p) =>
    rising ? p.likelihood >= 4 : p.likelihood <= -4
  );
  return idx >= 0 && idx < TIMING_KEYS.length ? TIMING_KEYS[idx] : "moreThan2Days";
}

function likelihoodKey(likelihood: number): string {
  if (likelihood >= 5) return "veryLikelyRise";
  if (likelihood === 4) return "likelyRise";
  if (likelihood <= -5) return "veryLikelyDrop";
  if (likelihood === -4) return "likelyDrop";
  return "unlikelyChange";
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

// ─── Component ──────────────────────────────────────────────────────────────

export default function PricesPage() {
  const { t, i18n } = useTranslation("fpl");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [risers, setRisers] = useState<PricePlayer[]>([]);
  const [fallers, setFallers] = useState<PricePlayer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [timeRemaining, setTimeRemaining] = useState("");
  const [teams, setTeams] = useState<{ id: number; short_name: string; name: string }[]>([]);
  const [deadlines, setDeadlines] = useState<string[]>([]);

  // ─── Data Fetching ──────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const bootstrapRes = await fetch("/api/fpl/bootstrap-static");
      if (!bootstrapRes.ok) {
        throw new Error("Failed to fetch FPL data");
      }

      const bootstrapData = await bootstrapRes.json();
      if (!bootstrapData.success) {
        throw new Error("FPL API returned an error");
      }

      const elements: any[] = bootstrapData.data.elements || [];
      const teamsList: any[] = bootstrapData.data.teams || [];
      setDeadlines(bootstrapData.data.game_config?.settings?.price_change_deadlines || []);

      // Team ids are season-scoped in the FPL API — register the live list so
      // club colours resolve correctly after every promotion/relegation.
      registerFplTeams(teamsList);

      // Build team list for filter
      const sortedTeams = teamsList
        .map((t: any) => ({ id: t.id, short_name: t.short_name, name: t.name }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
      setTeams(sortedTeams);

      const teamShortMap = new Map<number, string>();
      for (const t of teamsList) {
        teamShortMap.set(t.id, t.short_name);
      }

      const riserList: PricePlayer[] = [];
      const fallerList: PricePlayer[] = [];

      for (const el of elements) {
        const percent = parseFloat(el.price_change_percent) || 0;
        if (percent === 0) continue;

        const rising = percent > 0;
        const projections: Projection[] = el.price_change_projections || [];
        const likelihood = projections[0]?.likelihood ?? 0;
        const netIn = el.transfers_in_event || 0;
        const netOut = el.transfers_out_event || 0;

        const player: PricePlayer = {
          id: el.id,
          web_name: el.web_name,
          team: el.team,
          team_short: teamShortMap.get(el.team) || "?",
          element_type: el.element_type,
          now_cost: el.now_cost,
          cost_change_start: el.cost_change_start || 0,
          selected_by_percent: parseFloat(el.selected_by_percent) || 0,
          form: parseFloat(el.form) || 0,
          transfers_in_event: netIn,
          transfers_out_event: netOut,
          net_transfers: netIn - netOut,
          percent,
          delta: Math.min(100, Math.abs(percent)),
          likelihood,
          change_time: officialTiming(projections, rising),
          target_reached: rising ? likelihood >= 4 : likelihood <= -4,
          locked_until: el.price_change_locked_until || null,
          calibrating: Boolean(el.price_change_calibrating),
          status: el.status,
          news: el.news || "",
        };

        (rising ? riserList : fallerList).push(player);
      }

      // Sort by delta descending
      riserList.sort((a, b) => b.delta - a.delta);
      fallerList.sort((a, b) => b.delta - a.delta);

      setRisers(riserList);
      setFallers(fallerList);
    } catch (err) {
      console.error("Price data failed:", err);
      setError(t("fplLive.ui.pages.loadError", "Couldn't load the data. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Countdown Timer ────────────────────────────────────────────────────

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const next = deadlines
        .map((d) => new Date(d).getTime())
        .find((ts) => ts > now);
      if (!next) {
        setTimeRemaining("—");
        return;
      }
      const diff = next - now;
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadlines]);

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
      const sorted = [...filtered].sort((a, b) => b.delta - a.delta);
      return sorted;
    },
    [searchQuery, selectedTeam]
  );

  const filteredRisers = useMemo(
    () => applyFilters(risers),
    [risers, applyFilters]
  );
  const filteredFallers = useMemo(
    () => applyFilters(fallers),
    [fallers, applyFilters]
  );

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
              {t("fplLive.ui.pages.errorTitle", "Something went wrong")}
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
            <TeamSelect
              teams={teams}
              value={selectedTeam}
              onChange={setSelectedTeam}
              allLabel={t("prices.allTeams")}
              className="w-full sm:w-[13.5rem]"
            />
          </div>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <PriceTable
            title={t("prices.priceRisers")}
            players={filteredRisers}
            isRiser={true}
            t={t}
          />
          <PriceTable
            title={t("prices.priceFallers")}
            players={filteredFallers}
            isRiser={false}
            t={t}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-theme-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-theme-text-secondary">
            <p>{t("prices.updateInfo")}</p>
            <p>
              {t("prices.lastUpdated")}:{" "}
              {new Date().toLocaleTimeString(dateLocale(i18n.language), {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Price list ───────────────────────────────────────────────────────────

const VISIBLE_ROWS = 12;

function PriceTable({
  title,
  players,
  isRiser,
  t,
}: {
  title: string;
  players: PricePlayer[];
  isRiser: boolean;
  t: any;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? players : players.slice(0, VISIBLE_ROWS);
  const likelyCount = players.filter((p) => p.target_reached).length;

  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              isRiser
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}
          >
            {isRiser ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </span>
          <h2 className="text-sm font-semibold text-theme-foreground">{title}</h2>
        </div>
        <span className="text-xs text-theme-text-secondary tabular-nums">
          {likelyCount > 0 && (
            <span className={isRiser ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
              {likelyCount} {t("prices.tonight").toLowerCase()} ·{" "}
            </span>
          )}
          {players.length} {t("prices.players")}
        </span>
      </div>

      <div className="divide-y divide-theme-border border-t border-theme-border">
        {shown.map((player) => (
          <PlayerRow key={player.id} player={player} isRiser={isRiser} />
        ))}
      </div>

      {players.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-theme-text-secondary">
            {isRiser ? t("prices.noRisersFound") : t("prices.noFallersFound")}
          </p>
        </div>
      )}

      {players.length > VISIBLE_ROWS && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full border-t border-theme-border py-2.5 text-xs font-semibold text-theme-text-secondary transition-colors hover:text-theme-foreground"
        >
          {expanded
            ? t("prices.showLess", "Prikaži manje")
            : t("prices.showAll", { count: players.length, defaultValue: "Prikaži sve ({{count}})" })}
        </button>
      )}
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────

function PlayerRow({ player, isRiser }: { player: PricePlayer; isRiser: boolean }) {
  const teamColors = getTeamColors(player.team);
  const seasonChange = player.cost_change_start;

  return (
    <div className="px-4 py-2.5 transition-colors hover:bg-theme-card-secondary">
      <div className="flex items-center gap-3">
        <TeamJersey
          kit={teamColors}
          isGoalkeeper={player.element_type === 1}
          title={teamColors.name}
          className="w-6 h-6 shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]"
        />

        <div className="min-w-0 flex-1 sm:w-[30%] sm:flex-none">
          <div className="truncate text-sm font-semibold text-theme-foreground">{player.web_name}</div>
          <div className="flex items-center gap-1 text-[11px] text-theme-text-secondary tabular-nums">
            <span>{player.team_short}</span>
            <span className="opacity-50">·</span>
            <span>{POS_LABELS[player.element_type] || "?"}</span>
            <span className="opacity-50">·</span>
            <span className="font-medium text-theme-foreground">{formatPrice(player.now_cost)}</span>
            {seasonChange !== 0 && (
              <span className={seasonChange > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                {seasonChange > 0 ? "+" : ""}
                {(seasonChange / 10).toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 sm:block">
          <DeltaBar player={player} isRiser={isRiser} />
        </div>
        <span className="text-xs font-semibold tabular-nums text-theme-foreground sm:hidden">
          {player.percent > 0 ? "+" : ""}
          {player.percent.toFixed(1)}%
        </span>

        <div className="w-[76px] shrink-0 sm:w-28">
          <StatusCell player={player} />
        </div>
      </div>

      {/* mobile: full-width bar under the name */}
      <div className="mt-2 pl-9 sm:hidden">
        <div className="h-1 overflow-hidden rounded-full bg-theme-card-secondary">
          <div
            className={`h-full rounded-full ${barColor(player, isRiser)}`}
            style={{ width: `${Math.min(100, Math.max(2, player.delta))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Official status ──────────────────────────────────────────────────────

function StatusCell({ player }: { player: PricePlayer }) {
  const { t } = useTranslation("fpl");

  if (player.locked_until) {
    const days = Math.max(
      1,
      Math.ceil((new Date(player.locked_until).getTime() - Date.now()) / 86_400_000)
    );
    return (
      <div className="text-right">
        <span className="text-xs font-medium text-theme-text-secondary">{t("prices.locked")}</span>
        <div className="text-[11px] text-theme-text-secondary">{t("prices.lockedDays", { count: days })}</div>
      </div>
    );
  }

  if (player.calibrating) {
    return (
      <span className="block text-right text-xs font-medium text-theme-text-secondary">
        {t("prices.calibrating")}
      </span>
    );
  }

  const strong = Math.abs(player.likelihood) >= 5;
  const likely = Math.abs(player.likelihood) >= 4;
  const rising = player.percent > 0;
  const tone = !likely
    ? "text-theme-text-secondary"
    : rising
      ? strong
        ? "text-green-600 dark:text-green-400"
        : "text-green-600/80 dark:text-green-400/80"
      : strong
        ? "text-red-600 dark:text-red-400"
        : "text-red-600/80 dark:text-red-400/80";

  return (
    <div className="text-right leading-tight">
      <span className={`text-xs font-semibold ${likely ? "text-theme-foreground" : "text-theme-text-secondary"}`}>
        {t(`prices.${player.change_time}`)}
      </span>
      <div className={`text-[11px] font-medium leading-tight ${tone} ${likely ? "" : "hidden sm:block"}`}>
        {t(`prices.${likelihoodKey(player.likelihood)}`)}
      </div>
    </div>
  );
}

// ─── Delta Bar Component ──────────────────────────────────────────────────

function barColor(player: PricePlayer, isRiser: boolean): string {
  const l = Math.abs(player.likelihood);
  if (l >= 5) return isRiser ? "bg-green-500" : "bg-red-500";
  if (l >= 4) return isRiser ? "bg-green-400" : "bg-red-400";
  return isRiser ? "bg-green-500/35" : "bg-red-500/35";
}

function DeltaBar({ player, isRiser }: { player: PricePlayer; isRiser: boolean }) {
  const pct = Math.min(100, Math.max(2, player.delta));

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-theme-card-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor(player, isRiser)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-14 text-right">
        <span
          className={`text-xs font-medium tabular-nums ${
            player.target_reached ? "text-theme-foreground" : "text-theme-text-secondary"
          }`}
        >
          {player.percent > 0 ? "+" : ""}
          {player.percent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
