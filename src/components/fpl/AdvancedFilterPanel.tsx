"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  X,
  ChevronUp,
  TrendingUp,
  AlertTriangle,
  Target,
  BarChart,
  Calendar,
} from "lucide-react";
import { PiTShirtFill } from "react-icons/pi";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { getTeamColors } from "@/lib/team-colors";
import type {
  EnhancedFilterState,
  EnhancedPlayerData,
} from "@/types/fpl-enhanced";

interface AdvancedFilterPanelProps {
  filters: EnhancedFilterState;
  onFiltersChange: (filters: EnhancedFilterState) => void;
  allPlayers: EnhancedPlayerData[];
  allTeams: any[];
  isVisible: boolean;
  onToggle: () => void;
}

export default function AdvancedFilterPanel({
  filters,
  onFiltersChange,
  allTeams,
  isVisible,
  onToggle,
}: AdvancedFilterPanelProps) {
  const { theme } = useTheme();
  const { t } = useTranslation("fpl");
  const [activeSection, setActiveSection] = useState<string | null>("basic");

  const tf = (key: string, defaultValue?: string, options?: any): string =>
    t(`fplLive.advancedFilters.${key}`, { defaultValue, ...options }) as string;

  const filterSections = {
    basic: {
      title: tf("sectionBasic", "Basic Filters"),
      icon: <Filter className="w-4 h-4" />,
      description: tf("sectionBasicDesc", "Position, Team, Price"),
    },
    performance: {
      title: tf("sectionPerformance", "Performance"),
      icon: <BarChart className="w-4 h-4" />,
      description: tf("sectionPerformanceDesc", "Points, Form, Value"),
    },
    market: {
      title: tf("sectionMarket", "Market Data"),
      icon: <TrendingUp className="w-4 h-4" />,
      description: tf("sectionMarketDesc", "Price Changes, Ownership"),
    },
    availability: {
      title: tf("sectionAvailability", "Availability"),
      icon: <AlertTriangle className="w-4 h-4" />,
      description: tf("sectionAvailabilityDesc", "Injury, Rotation Risk"),
    },
    fixtures: {
      title: tf("sectionFixtures", "Fixtures"),
      icon: <Calendar className="w-4 h-4" />,
      description: tf("sectionFixturesDesc", "Difficulty, Upcoming"),
    },
    advanced: {
      title: tf("sectionAdvanced", "Advanced"),
      icon: <Target className="w-4 h-4" />,
      description: tf("sectionAdvancedDesc", "Differentials, Captain Appeal"),
    },
  };

  const positions = [
    {
      id: 1,
      name: "GK",
      label: tf("positionGK", "Golmani"),
      accent: "from-amber-400 to-yellow-500",
      ring: "ring-amber-400/40",
      activeBg: "bg-amber-500",
    },
    {
      id: 2,
      name: "DEF",
      label: tf("positionDEF", "Odbrana"),
      accent: "from-sky-400 to-blue-500",
      ring: "ring-sky-400/40",
      activeBg: "bg-sky-500",
    },
    {
      id: 3,
      name: "MID",
      label: tf("positionMID", "Vezni"),
      accent: "from-emerald-400 to-teal-500",
      ring: "ring-emerald-400/40",
      activeBg: "bg-emerald-500",
    },
    {
      id: 4,
      name: "FWD",
      label: tf("positionFWD", "Napadači"),
      accent: "from-rose-400 to-red-500",
      ring: "ring-rose-400/40",
      activeBg: "bg-rose-500",
    },
  ];

  const sortOptions = [
    { value: "total_points", label: tf("sortTotalPoints", "Total Points") },
    { value: "event_points", label: tf("sortGwPoints", "GW Points") },
    { value: "now_cost", label: tf("sortPrice", "Price") },
    { value: "form", label: tf("sortForm", "Form") },
    { value: "selected_by_percent", label: tf("sortOwnership", "Ownership %") },
    { value: "value_season", label: tf("sortValueSeason", "Value (Season)") },
    { value: "value_form", label: tf("sortValueForm", "Value (Form)") },
    { value: "transfers_in_event", label: tf("sortTransfersIn", "Transfers In") },
    { value: "transfers_out_event", label: tf("sortTransfersOut", "Transfers Out") },
    { value: "ict_index", label: tf("sortIct", "ICT Index") },
    { value: "expected_goals", label: tf("sortXG", "Expected Goals") },
    { value: "expected_assists", label: tf("sortXA", "Expected Assists") },
  ];

  const quickFilterLabels: Record<string, string> = {
    differentials: tf("quickDifferentials", "Differentials"),
    value_picks: tf("quickValuePicks", "Value Picks"),
    form_players: tf("quickFormPlayers", "Form Players"),
    budget_gems: tf("quickBudgetGems", "Budget Gems"),
    premium_picks: tf("quickPremiumPicks", "Premium Picks"),
  };

  const updateFilter = useCallback(
    <K extends keyof EnhancedFilterState>(
      key: K,
      value: EnhancedFilterState[K]
    ) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  // Quick filter presets
  const quickFilters = {
    differentials: () => updateFilter("differentialMin", 15),
    value_picks: () => {
      onFiltersChange({
        ...filters,
        sortBy: "value_season",
        sortOrder: "desc",
        priceRange: [40, 80],
      });
    },
    form_players: () => {
      onFiltersChange({
        ...filters,
        sortBy: "form",
        sortOrder: "desc",
        formMin: 6,
      });
    },
    budget_gems: () => {
      onFiltersChange({
        ...filters,
        priceRange: [40, 60],
        sortBy: "total_points",
        sortOrder: "desc",
      });
    },
    premium_picks: () => {
      onFiltersChange({
        ...filters,
        priceRange: [100, 150],
        sortBy: "total_points",
        sortOrder: "desc",
      });
    },
  };

  const clearAllFilters = () => {
    onFiltersChange({
      position: [],
      teams: [],
      priceRange: [40, 150],
      formRating: 0,
      availability: ["a"],
      sortBy: "total_points",
      sortOrder: "desc",
      search: "",
      priceChangeMin: undefined,
      priceChangeMax: undefined,
      priceChangePeriod: "24h",
      ownershipMin: undefined,
      ownershipMax: undefined,
      ownershipTrend: [],
      ownershipChangePeriod: "24h",
      transfersInMin: undefined,
      transfersOutMin: undefined,
      netTransfersMin: undefined,
      transferMomentum: [],
      formMin: undefined,
      valueMin: undefined,
      differentialMin: undefined,
      nextFixtureDifficulty: [],
      fixtureCount: 3,
      fixtureHorizon: 5,
      rotationRisk: [],
      injuryStatus: ["available"],
      captaincyAppealMin: undefined,
      searchMode: "basic",
      includeInjured: false,
      includeSuspended: false,
    });
  };

  const getActiveFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.position.length > 0) count++;
    if (filters.teams.length > 0) count++;
    if (filters.priceRange[0] > 40 || filters.priceRange[1] < 150) count++;
    if (filters.formRating > 0) count++;
    if (filters.search) count++;
    if (filters.priceChangeMin !== undefined) count++;
    if (filters.ownershipMin !== undefined) count++;
    if (filters.transfersInMin !== undefined) count++;
    if (filters.formMin !== undefined) count++;
    if (filters.differentialMin !== undefined) count++;
    return count;
  }, [filters]);

  const renderBasicFilters = () => {
    const allTeamIds = allTeams.map((t) => t.id);
    const allSelected = filters.teams.length > 0 && filters.teams.length === allTeamIds.length;
    const minPrice = filters.priceRange[0];
    const maxPrice = filters.priceRange[1];
    const pricePctMin = ((minPrice - 40) / 110) * 100;
    const pricePctMax = ((maxPrice - 40) / 110) * 100;

    return (
      <div className="space-y-6">
        {/* Position Filter — visual toggle cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-100 block">{tf("position", "Pozicija")}</label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{tf("positionHint", "Klikni na jednu ili više da filtriraš")}</p>
            </div>
            {filters.position.length > 0 && (
              <button
                onClick={() => updateFilter("position", [])}
                className="text-[11px] font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> {tf("clear", "Očisti")}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {positions.map((pos) => {
              const isActive = filters.position.includes(pos.id);
              return (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => {
                    if (isActive) updateFilter("position", filters.position.filter((p) => p !== pos.id));
                    else updateFilter("position", [...filters.position, pos.id]);
                  }}
                  className={`relative overflow-hidden rounded-xl p-3 text-left transition-all border-2 ${
                    isActive
                      ? `bg-gradient-to-br ${pos.accent} text-white border-transparent shadow-lg ${pos.ring} ring-2`
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-white/80" : "text-slate-400 dark:text-slate-500"}`}>
                      {pos.name}
                    </span>
                    {isActive && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                  <p className={`mt-0.5 text-sm font-semibold ${isActive ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>
                    {pos.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Team Filter — clickable badge grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-100 block">{tf("clubs", "Klubovi")}</label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {filters.teams.length === 0
                  ? tf("clubsHintEmpty", "Klikni klubove koje želiš")
                  : tf("clubsHintSelected", "{{count}} od {{total}} odabrano", {
                      count: filters.teams.length,
                      total: allTeams.length,
                    })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (allSelected) updateFilter("teams", []);
                  else updateFilter("teams", allTeamIds);
                }}
                className="text-[11px] font-medium px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-200/60 dark:border-indigo-800/40"
              >
                {allSelected ? tf("deselectAll", "Poništi sve") : tf("selectAll", "Odaberi sve")}
              </button>
              {filters.teams.length > 0 && !allSelected && (
                <button
                  onClick={() => updateFilter("teams", [])}
                  className="text-[11px] font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> {tf("clear", "Očisti")}
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {allTeams.map((team) => {
              const isActive = filters.teams.includes(team.id);
              const colors = getTeamColors(team.id);
              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => {
                    if (isActive) updateFilter("teams", filters.teams.filter((id) => id !== team.id));
                    else updateFilter("teams", [...filters.teams, team.id]);
                  }}
                  title={team.name}
                  className={`relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all border ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-200 border-indigo-400 dark:border-indigo-600 shadow-sm scale-[0.98]"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                  }`}
                >
                  <PiTShirtFill
                    className="w-4 h-4 shrink-0"
                    style={{
                      color: colors.primary,
                      filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))",
                    } as React.CSSProperties}
                  />
                  <span className="flex-1 text-left">{team.short_name}</span>
                  {isActive && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[8px] shadow-sm">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price Range — dual handle visual */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-100 block">{tf("price", "Cijena")}</label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-indigo-700 dark:text-indigo-300">£{(minPrice / 10).toFixed(1)}m</span>
                {" — "}
                <span className="font-semibold text-indigo-700 dark:text-indigo-300">£{(maxPrice / 10).toFixed(1)}m</span>
              </p>
            </div>
            {(minPrice > 40 || maxPrice < 150) && (
              <button
                onClick={() => updateFilter("priceRange", [40, 150])}
                className="text-[11px] font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> {tf("reset", "Reset")}
              </button>
            )}
          </div>
          {/* Visual track with active region */}
          <div className="relative h-7 mb-2">
            <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div
              className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
              style={{ left: `${pricePctMin}%`, right: `${100 - pricePctMax}%` }}
            />
            <input
              type="range"
              min="40"
              max="150"
              step="1"
              value={minPrice}
              onChange={(e) => {
                const v = Math.min(parseInt(e.target.value), maxPrice - 1);
                updateFilter("priceRange", [v, maxPrice]);
              }}
              className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-indigo-500 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
            />
            <input
              type="range"
              min="40"
              max="150"
              step="1"
              value={maxPrice}
              onChange={(e) => {
                const v = Math.max(parseInt(e.target.value), minPrice + 1);
                updateFilter("priceRange", [minPrice, v]);
              }}
              className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-fuchsia-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-fuchsia-500 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
            />
          </div>
          {/* Quick-pick price chips */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "Budget", range: [40, 60], color: "emerald" },
              { label: "Mid", range: [55, 85], color: "sky" },
              { label: "Premium", range: [85, 130], color: "violet" },
              { label: "Top tier", range: [100, 150], color: "rose" },
            ].map((p) => {
              const colorMap: Record<string, string> = {
                emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40",
                sky: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800/40 hover:bg-sky-100 dark:hover:bg-sky-900/40",
                violet: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200 dark:border-violet-800/40 hover:bg-violet-100 dark:hover:bg-violet-900/40",
                rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/40 hover:bg-rose-100 dark:hover:bg-rose-900/40",
              };
              return (
                <button
                  key={p.label}
                  onClick={() => updateFilter("priceRange", p.range as [number, number])}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${colorMap[p.color]}`}
                >
                  {p.label} <span className="opacity-70 ml-1">£{p.range[0] / 10}–{p.range[1] / 10}m</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">{tf("sortBy", "Sortiraj po")}</label>
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter("sortBy", e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm p-2.5 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300 dark:focus:border-indigo-700 focus:outline-none transition-colors"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">{tf("sortOrder", "Redoslijed")}</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => updateFilter("sortOrder", "desc")}
                className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  filters.sortOrder === "desc"
                    ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                }`}
              >
                {tf("sortDescending", "↓ Veće prvo")}
              </button>
              <button
                onClick={() => updateFilter("sortOrder", "asc")}
                className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  filters.sortOrder === "asc"
                    ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                }`}
              >
                {tf("sortAscending", "↑ Manje prvo")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPerformanceFilters = () => (
    <div className="space-y-4">
      {/* Form Rating */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {tf("minForm", "Minimum Form Rating")}: {filters.formMin || 0}
        </label>
        <input
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={filters.formMin || 0}
          onChange={(e) => updateFilter("formMin", parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Value Rating */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {tf("minValue", "Minimum Value Rating")}: {filters.valueMin || 0}
        </label>
        <input
          type="range"
          min="0"
          max="20"
          step="0.5"
          value={filters.valueMin || 0}
          onChange={(e) => updateFilter("valueMin", parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );

  const renderMarketFilters = () => (
    <div className="space-y-4">
      {/* Price Changes */}
      <div>
        <label className="block text-sm font-medium mb-2">{tf("priceChanges", "Price Changes")}</label>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            placeholder={tf("minChange", "Min change")}
            value={filters.priceChangeMin || ""}
            onChange={(e) =>
              updateFilter(
                "priceChangeMin",
                e.target.value ? parseFloat(e.target.value) : undefined
              )
            }
            className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm p-2"
          />
          <input
            type="number"
            placeholder={tf("maxChange", "Max change")}
            value={filters.priceChangeMax || ""}
            onChange={(e) =>
              updateFilter(
                "priceChangeMax",
                e.target.value ? parseFloat(e.target.value) : undefined
              )
            }
            className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm p-2"
          />
          <select
            value={filters.priceChangePeriod}
            onChange={(e) =>
              updateFilter(
                "priceChangePeriod",
                e.target.value as "1h" | "24h" | "week"
              )
            }
            className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm p-2"
          >
            <option value="1h">{tf("hour", "1 Hour")}</option>
            <option value="24h">{tf("day", "24 Hours")}</option>
            <option value="week">{tf("week", "1 Week")}</option>
          </select>
        </div>
      </div>

      {/* Ownership */}
      <div>
        <label className="block text-sm font-medium mb-2">{tf("ownershipPct", "Ownership %")}</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder={tf("minPct", "Min %")}
            value={filters.ownershipMin || ""}
            onChange={(e) =>
              updateFilter(
                "ownershipMin",
                e.target.value ? parseFloat(e.target.value) : undefined
              )
            }
            className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm p-2"
          />
          <input
            type="number"
            placeholder={tf("maxPct", "Max %")}
            value={filters.ownershipMax || ""}
            onChange={(e) =>
              updateFilter(
                "ownershipMax",
                e.target.value ? parseFloat(e.target.value) : undefined
              )
            }
            className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm p-2"
          />
        </div>
      </div>

      {/* Transfer Activity */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {tf("transferActivity", "Transfer Activity")}
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder={tf("minTransfersIn", "Min transfers in")}
            value={filters.transfersInMin || ""}
            onChange={(e) =>
              updateFilter(
                "transfersInMin",
                e.target.value ? parseFloat(e.target.value) : undefined
              )
            }
            className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm p-2"
          />
          <input
            type="number"
            placeholder={tf("minTransfersOut", "Min transfers out")}
            value={filters.transfersOutMin || ""}
            onChange={(e) =>
              updateFilter(
                "transfersOutMin",
                e.target.value ? parseFloat(e.target.value) : undefined
              )
            }
            className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm p-2"
          />
        </div>
      </div>
    </div>
  );

  const renderAdvancedFilters = () => (
    <div className="space-y-4">
      {/* Differential Score */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {tf("differentialScore", "Minimum Differential Score")}: {filters.differentialMin || 0}
        </label>
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          value={filters.differentialMin || 0}
          onChange={(e) =>
            updateFilter("differentialMin", parseFloat(e.target.value))
          }
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          {tf("differentialHint", "Higher scores = better differentials (low ownership + high points)")}
        </p>
      </div>

      {/* Captaincy Appeal */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {tf("captaincyAppeal", "Minimum Captaincy Appeal")}: {filters.captaincyAppealMin || 0}
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={filters.captaincyAppealMin || 0}
          onChange={(e) =>
            updateFilter("captaincyAppealMin", parseFloat(e.target.value))
          }
          className="w-full"
        />
      </div>

      {/* Search Mode */}
      <div>
        <label className="block text-sm font-medium mb-2">{tf("searchMode", "Search Mode")}</label>
        <div className="flex gap-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="searchMode"
              value="basic"
              checked={filters.searchMode === "basic"}
              onChange={(e) =>
                updateFilter(
                  "searchMode",
                  e.target.value as "basic" | "advanced"
                )
              }
              className="mr-2"
            />
            {tf("basic", "Basic")}
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="searchMode"
              value="advanced"
              checked={filters.searchMode === "advanced"}
              onChange={(e) =>
                updateFilter(
                  "searchMode",
                  e.target.value as "basic" | "advanced"
                )
              }
              className="mr-2"
            />
            {tf("advanced", "Advanced")}
          </label>
        </div>
      </div>

      {/* Include Options */}
      <div>
        <label className="block text-sm font-medium mb-2">{tf("include", "Include")}</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.includeInjured}
              onChange={(e) => updateFilter("includeInjured", e.target.checked)}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            {tf("injuredPlayers", "Injured Players")}
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.includeSuspended}
              onChange={(e) =>
                updateFilter("includeSuspended", e.target.checked)
              }
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            {tf("suspendedPlayers", "Suspended Players")}
          </label>
        </div>
      </div>
    </div>
  );

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        } border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-md`}
      >
        {/* Header */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {tf("title", "Filters")}
                </h3>
                {getActiveFiltersCount > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {tf("activeCount", "{{count}} active", { count: getActiveFiltersCount })}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearAllFilters}
                className="px-3 py-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium"
              >
                {tf("clearAll", "Clear All")}
              </button>
              <button
                onClick={onToggle}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {tf("quickFilters", "Quick Filters:")}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(quickFilters).map(([key, action]) => (
                <button
                  key={key}
                  onClick={action}
                  className="px-2.5 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium border border-blue-200 dark:border-blue-800"
                >
                  {quickFilterLabels[key] ||
                    key.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Sections */}
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-2 mb-4">
            {Object.entries(filterSections).map(([key, section]) => (
              <button
                key={key}
                onClick={() =>
                  setActiveSection(activeSection === key ? null : key)
                }
                className={`p-3 rounded-lg text-left transition-all duration-200 border ${
                  activeSection === key
                    ? "bg-blue-500 text-white border-blue-500 shadow-md"
                    : "bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`p-1 rounded ${
                      activeSection === key
                        ? "bg-blue-400/20"
                        : "bg-gray-100 dark:bg-gray-700"
                    }`}
                  >
                    {section.icon}
                  </div>
                  <span className="font-medium text-sm">{section.title}</span>
                </div>
                <p className="text-xs opacity-75 line-clamp-2">
                  {section.description}
                </p>
              </button>
            ))}
          </div>

          {/* Active Section Content */}
          <AnimatePresence mode="wait">
            {activeSection && (
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium flex items-center gap-2">
                    {
                      filterSections[
                        activeSection as keyof typeof filterSections
                      ].icon
                    }
                    {
                      filterSections[
                        activeSection as keyof typeof filterSections
                      ].title
                    }
                  </h4>
                  <button
                    onClick={() => setActiveSection(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>

                {activeSection === "basic" && renderBasicFilters()}
                {activeSection === "performance" && renderPerformanceFilters()}
                {activeSection === "market" && renderMarketFilters()}
                {activeSection === "advanced" && renderAdvancedFilters()}
                {(activeSection === "availability" ||
                  activeSection === "fixtures") && (
                  <div className="text-center text-gray-500 py-8">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{tf("comingSoon", "Additional filters coming soon...")}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
