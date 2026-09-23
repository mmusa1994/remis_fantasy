"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, Loader2, ChevronRight, ExternalLink } from "lucide-react";

interface TeamSearchInputProps {
  onManagerIdFound: (managerId: number) => void;
  placeholder?: string;
  className?: string;
}

interface ManagerResult {
  id: number;
  name: string;
  team_name: string;
  overall_rank: number;
  total_points: number;
  country: string;
}

export default function TeamSearchInput({
  onManagerIdFound,
  placeholder,
  className = "",
}: TeamSearchInputProps) {
  const { t } = useTranslation("fpl");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    found?: boolean;
    manager?: ManagerResult;
    teams?: ManagerResult[];
    message?: string;
    searchResults?: boolean;
    searchInfo?: string;
  } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setIsDropdownOpen(true);

    try {
      const response = await fetch(
        `/api/fpl/search-team?q=${encodeURIComponent(searchQuery)}`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success) setSearchResults(result.data);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectManager = (managerId: number) => {
    onManagerIdFound(managerId);
    setSearchQuery("");
    setSearchResults(null);
    setIsDropdownOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
    if (e.key === "Escape") {
      setIsDropdownOpen(false);
      inputRef.current?.blur();
    }
  };

  const renderManagerRow = (m: ManagerResult) => (
    <button
      key={m.id}
      type="button"
      onClick={() => handleSelectManager(m.id)}
      className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-theme-card-secondary"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-theme-heading-primary">
          {m.team_name || m.name}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-theme-text-muted">
          {m.name} · ID {m.id}
          {m.overall_rank ? ` · #${m.overall_rank.toLocaleString("en-US")}` : ""}
        </p>
      </div>
      {typeof m.total_points === "number" && m.total_points > 0 && (
        <span className="shrink-0 text-xs font-semibold tabular-nums text-theme-text-secondary">
          {m.total_points} {t("fplLive.ui.shell.pts", "pts")}
        </span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-theme-text-muted" />
    </button>
  );

  const externalLinks = [
    {
      href: `https://www.google.com/search?q=${encodeURIComponent(
        `"${searchQuery}" FPL manager ID fantasy premier league`
      )}`,
      label: "Google",
    },
    {
      href: `https://www.reddit.com/r/FantasyPL/search/?q=${encodeURIComponent(searchQuery)}`,
      label: "r/FantasyPL",
    },
  ];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchQuery && searchResults && setIsDropdownOpen(true)}
          placeholder={placeholder || t("fplLive.search.searchInputPlaceholder", "Search team name or manager ID...")}
          enterKeyHint="search"
          className="w-full rounded-xl border border-theme-border bg-theme-card-secondary py-2.5 pl-10 pr-10 text-sm text-theme-heading-primary placeholder:text-theme-text-muted transition-colors focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        />
        {isSearching ? (
          <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-theme-text-muted" />
        ) : (
          searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResults(null);
                setIsDropdownOpen(false);
              }}
              aria-label={t("fplLive.ui.shell.clear", "Clear")}
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-theme-text-muted hover:bg-theme-card-secondary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )
        )}
      </div>

      {isDropdownOpen && searchResults && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-theme-border bg-theme-card shadow-xl">
          {/* Exact manager ID match */}
          {searchResults.found && searchResults.manager && !searchResults.searchResults && (
            <div className="py-1">
              <p className="px-3.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-text-muted">
                {t("fplLive.ui.shell.managerFound", "Manager found")}
              </p>
              {renderManagerRow(searchResults.manager)}
            </div>
          )}

          {/* Team name matches */}
          {searchResults.found && searchResults.teams && searchResults.searchResults && (
            <div className="py-1">
              {/* The search API's own message/info text is English-only */}
              <p className="px-3.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-text-muted">
                {t("fplLive.ui.shell.teamsFound", {
                  count: searchResults.teams.length,
                  defaultValue: "{{count}} teams found",
                })}
              </p>
              <div className="divide-y divide-theme-border">
                {searchResults.teams.map(renderManagerRow)}
              </div>
            </div>
          )}

          {/* Nothing found */}
          {!searchResults.found && (
            <div className="px-3.5 py-3">
              <p className="text-sm font-medium text-theme-heading-secondary">
                {t("fplLive.ui.shell.noTeamFound", "No team found")}
              </p>
              <p className="mt-1 text-xs text-theme-text-muted">
                {t(
                  "fplLive.ui.shell.searchHint",
                  "Try the exact team name, or enter your Manager ID below."
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {externalLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-theme-border px-2.5 py-1 text-xs font-medium text-theme-text-secondary hover:bg-theme-card-secondary"
                  >
                    {link.label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
