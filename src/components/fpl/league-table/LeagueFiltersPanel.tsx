"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import {
  Bar,
  cx,
  PlayerJersey,
  POSITION_SHORT,
  Segmented,
} from "@/components/fpl/live/ui";
import type { FilterState, LeagueElementSummary } from "./types";

export interface LeagueOwnership {
  starting: number;
  any: number;
}

interface LeagueFiltersPanelProps {
  elements: LeagueElementSummary[];
  filter: FilterState;
  onChange: (filter: FilterState) => void;
  /** Per player: how many managers in the table start / own him. */
  ownership: Map<number, LeagueOwnership>;
  teamCount: number;
}

/** "Ødegaard" and "Odegaard", "Groß" and "Gross" should match each other. */
const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/æ/g, "ae")
    .replace(/ß/g, "ss")
    .replace(/đ/g, "d")
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/**
 * League player filter: search any player to see who in the league has him,
 * plus one-tap chips for the league's most-owned players.
 */
export default function LeagueFiltersPanel({
  elements,
  filter,
  onChange,
  ownership,
  teamCount,
}: LeagueFiltersPanelProps) {
  const { t } = useTranslation("fpl");
  const [query, setQuery] = useState(filter.playerQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(filter.playerQuery);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 100);
    return () => clearTimeout(id);
  }, [query]);

  const countFor = (id: number) => {
    const own = ownership.get(id);
    if (!own) return 0;
    return filter.scope === "startingXI" ? own.starting : own.any;
  };

  const indexed = useMemo(
    () =>
      elements.map((el) => ({
        el,
        key: normalize(`${el.web_name} ${el.first_name} ${el.second_name}`),
      })),
    [elements]
  );

  const suggestions = useMemo(() => {
    const q = normalize(debouncedQuery.trim());
    if (!q) return [];
    return indexed
      .filter((item) => item.key.includes(q))
      .map((item) => item.el)
      .sort((a, b) => {
        const diff = (ownership.get(b.id)?.any ?? 0) - (ownership.get(a.id)?.any ?? 0);
        return diff !== 0 ? diff : a.web_name.localeCompare(b.web_name);
      })
      .slice(0, 8);
  }, [indexed, debouncedQuery, ownership]);

  const popular = useMemo(() => {
    const key = filter.scope === "startingXI" ? "starting" : "any";
    const byId = new Map(elements.map((el) => [el.id, el]));
    return Array.from(ownership.entries())
      .filter(([, own]) => own[key] > 0)
      .sort((a, b) => b[1][key] - a[1][key])
      .slice(0, 10)
      .map(([id, own]) => ({ el: byId.get(id), count: own[key] }))
      .filter((item): item is { el: LeagueElementSummary; count: number } => !!item.el);
  }, [ownership, elements, filter.scope]);

  const selected = filter.playerId
    ? elements.find((el) => el.id === filter.playerId) ?? null
    : null;

  const pick = (el: LeagueElementSummary) => {
    onChange({ ...filter, playerId: el.id, playerQuery: el.web_name });
    setQuery(el.web_name);
    setOpen(false);
  };

  const clear = () => {
    onChange({ ...filter, playerId: null, playerQuery: "" });
    setQuery("");
    setOpen(false);
  };

  const pct = (count: number) => (teamCount > 0 ? Math.round((count / teamCount) * 100) : 0);
  const selectedCount = selected ? countFor(selected.id) : 0;

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[11rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-theme-text-muted" />
          <input
            type="text"
            value={query}
            onFocus={() => setOpen(true)}
            // Delay so a tap on a suggestion lands before the list closes.
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIdx((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const item = suggestions[activeIdx];
                if (item) pick(item);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder={t("fplLive.ui.leagues.searchPlaceholder", "Who owns… (player)")}
            className="h-9 w-full rounded-xl border border-theme-border bg-theme-card-secondary pl-8 pr-8 text-sm text-theme-heading-primary placeholder:text-theme-text-muted focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
          {(query || filter.playerId) && (
            <button
              type="button"
              onClick={clear}
              aria-label={t("fplLive.ui.leagues.clear", "Clear")}
              className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-theme-text-muted hover:bg-theme-card hover:text-theme-text-secondary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Segmented
          value={filter.scope}
          onChange={(scope) => onChange({ ...filter, scope })}
          options={[
            { value: "startingXI", label: t("fplLive.ui.leagues.scopeStarting", "Starting XI") },
            { value: "own", label: t("fplLive.ui.leagues.scopeAny", "Anywhere") },
          ]}
        />
      </div>

      {open && suggestions.length > 0 && (
        <div
          role="listbox"
          className="overflow-hidden rounded-xl border border-theme-border bg-theme-card"
        >
          {suggestions.map((el, idx) => {
            const count = countFor(el.id);
            return (
              <button
                key={el.id}
                type="button"
                role="option"
                aria-selected={idx === activeIdx}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => pick(el)}
                className={cx(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
                  idx === activeIdx ? "bg-theme-card-secondary" : "hover:bg-theme-card-secondary"
                )}
              >
                <PlayerJersey player={el} size="xs" />
                <span className="min-w-0 flex-1 truncate text-theme-heading-primary">{el.web_name}</span>
                <span className="text-[10px] text-theme-text-muted">{POSITION_SHORT[el.element_type]}</span>
                <span className="w-12 text-right text-xs tabular-nums text-theme-text-secondary">
                  {count}/{teamCount}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {open && debouncedQuery.trim() && suggestions.length === 0 && (
        <p className="px-1 text-xs text-theme-text-muted">
          {t("fplLive.ui.leagues.noPlayers", "No players found")}
        </p>
      )}

      {selected ? (
        <div className="flex items-center gap-3 rounded-xl border border-theme-border bg-theme-card-secondary px-3 py-2.5">
          <PlayerJersey player={selected} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium text-theme-heading-primary">
                {selected.web_name}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-theme-text-secondary">
                {t("fplLive.ui.leagues.ownedBy", "{{count}} of {{total}} managers", {
                  count: selectedCount,
                  total: teamCount,
                })}{" "}
                <span className="font-semibold text-theme-heading-primary">{pct(selectedCount)}%</span>
              </span>
            </div>
            <Bar value={pct(selectedCount)} className="mt-1.5" />
          </div>
        </div>
      ) : (
        popular.length > 0 && (
          <div className="-mx-4 overflow-x-auto px-4 scrollbar-hide sm:-mx-5 sm:px-5">
            <div className="flex w-max items-center gap-1.5">
              <span className="mr-0.5 text-[10px] font-semibold uppercase tracking-wider text-theme-text-muted">
                {t("fplLive.ui.leagues.mostOwned", "Most owned")}
              </span>
              {popular.map(({ el, count }) => (
                <button
                  key={el.id}
                  type="button"
                  onClick={() => pick(el)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-theme-border bg-theme-card py-1 pl-1.5 pr-2.5 text-xs text-theme-text-secondary transition-colors hover:bg-theme-card-secondary"
                >
                  <PlayerJersey player={el} size="xs" className="!h-4 !w-4" />
                  <span className="font-medium text-theme-heading-primary">{el.web_name}</span>
                  <span className="tabular-nums text-theme-text-muted">{pct(count)}%</span>
                </button>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
