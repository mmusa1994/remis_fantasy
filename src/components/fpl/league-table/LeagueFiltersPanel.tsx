"use client";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdSearch } from "react-icons/md";
import type { FilterState, LeagueElementSummary } from "./types";

interface LeagueFiltersPanelProps {
  elements: LeagueElementSummary[];
  filter: FilterState;
  onChange: (filter: FilterState) => void;
}

export default function LeagueFiltersPanel({
  elements,
  filter,
  onChange,
}: LeagueFiltersPanelProps) {
  const { t } = useTranslation("fpl");
  const [draft, setDraft] = useState<FilterState>(filter);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState(filter.playerQuery);

  useEffect(() => {
    const id = setTimeout(
      () => setDebouncedQuery(draft.playerQuery),
      100
    );
    return () => clearTimeout(id);
  }, [draft.playerQuery]);

  const allPlayers = useMemo(
    () =>
      elements
        .map((el) => ({ id: el.id, label: el.web_name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [elements]
  );

  const filteredPlayers = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return allPlayers.slice(0, 200);
    return allPlayers
      .filter((p) => p.label.toLowerCase().includes(q))
      .slice(0, 200);
  }, [allPlayers, debouncedQuery]);

  const applyFilter = (next: FilterState) => {
    setDraft(next);
    onChange(next);
  };

  return (
    <div className="bg-theme-card rounded-lg border border-theme-border p-4">
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium text-theme-foreground mb-1">
            {t("leagueTables.filters.searchPlayer", "Search Player")}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-theme-text-secondary">
              <MdSearch className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={draft.playerQuery}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setDraft({ ...draft, playerQuery: e.target.value });
                setOpen(true);
                setActiveIdx(0);
              }}
              onKeyDown={(e) => {
                if (!open) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIdx((idx) =>
                    Math.min(idx + 1, filteredPlayers.length - 1)
                  );
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIdx((idx) => Math.max(idx - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  const item = filteredPlayers[activeIdx];
                  if (item) {
                    applyFilter({
                      ...draft,
                      playerId: item.id,
                      playerQuery: item.label,
                    });
                    setOpen(false);
                  }
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
              className="w-full pl-8 pr-8 py-2 border border-theme-border rounded-md bg-theme-card text-theme-foreground focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              placeholder={t(
                "leagueTables.filters.searchPlaceholder",
                "Search player..."
              )}
            />
            {draft.playerId && (
              <button
                type="button"
                onClick={() =>
                  applyFilter({
                    playerId: null,
                    playerQuery: "",
                    scope: draft.scope,
                  })
                }
                className="absolute inset-y-0 right-2 flex items-center text-theme-text-secondary hover:text-theme-foreground"
                aria-label={t("leagueTables.filters.clear", "Clear")}
              >
                ×
              </button>
            )}
            {open && (
              <div
                role="listbox"
                className="absolute z-10 mt-2 max-h-64 w-full overflow-auto rounded-md border border-theme-border bg-theme-card shadow-xl"
              >
                {filteredPlayers.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-theme-text-secondary">
                    {t("leagueTables.filters.noResults", "No players found")}
                  </div>
                ) : (
                  filteredPlayers.map((p, idx) => (
                    <button
                      type="button"
                      key={p.id}
                      role="option"
                      aria-selected={idx === activeIdx}
                      onClick={() => {
                        applyFilter({
                          ...draft,
                          playerId: p.id,
                          playerQuery: p.label,
                        });
                        setOpen(false);
                      }}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        idx === activeIdx
                          ? "bg-purple-600 text-white"
                          : "text-theme-foreground hover:bg-theme-card-secondary"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <div className="text-xs font-medium text-theme-text-secondary mb-1">
              {t("leagueTables.filters.scope", "Match")}
            </div>
            <div className="inline-flex rounded-md border border-theme-border overflow-hidden">
              <button
                type="button"
                className={`px-3 py-1.5 text-sm ${
                  draft.scope === "startingXI"
                    ? "bg-purple-600 text-white"
                    : "bg-theme-card text-theme-foreground"
                }`}
                onClick={() =>
                  applyFilter({ ...draft, scope: "startingXI" })
                }
              >
                {t("leagueTables.filters.scopeStartingXI", "Starting XI")}
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-sm border-l border-theme-border ${
                  draft.scope === "own"
                    ? "bg-purple-600 text-white"
                    : "bg-theme-card text-theme-foreground"
                }`}
                onClick={() => applyFilter({ ...draft, scope: "own" })}
              >
                {t("leagueTables.filters.scopeOwn", "Own (any)")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
