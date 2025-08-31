"use client";

import React, { useState, useRef, useEffect } from "react";
import { MdSearch, MdClose } from "react-icons/md";
// import { useTranslation } from "react-i18next";

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
        if (result.success) {
          setSearchResults(result.data);
          
          // If we found a manager directly, show it
          if (result.data.found && result.data.manager) {
            // Don't auto-load, let user choose
          }
        }
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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchQuery && setIsDropdownOpen(true)}
          placeholder={placeholder || "Search team name or manager ID..."}
          className="w-full pl-10 pr-10 py-2 text-sm border-2 border-white/30 bg-white/20 text-white rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/50 placeholder-white/60 backdrop-blur transition-all duration-200"
        />
        
        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
        
        {(searchQuery || isSearching) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSearchResults(null);
              setIsDropdownOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80"
          >
            <MdClose className="w-4 h-4" />
          </button>
        )}
        
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Search Dropdown */}
      {isDropdownOpen && searchResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
          {/* Direct Manager Found (Manager ID search) */}
          {searchResults.found && searchResults.manager && !searchResults.searchResults && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-3 transition-colors"
                onClick={() => handleSelectManager(searchResults.manager!.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-green-600 dark:text-green-400 text-sm">
                    ✅ Manager Found
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Click to select
                  </span>
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Player:</span>
                    <span className="text-gray-600 dark:text-gray-400">{searchResults.manager.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Team:</span>
                    <span className="text-gray-600 dark:text-gray-400">{searchResults.manager.team_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Manager ID:</span>
                    <span className="text-gray-600 dark:text-gray-400">{searchResults.manager.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Points:</span>
                    <span className="text-gray-600 dark:text-gray-400">{searchResults.manager.total_points}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Multiple Teams Found (Team name search) */}
          {searchResults.found && searchResults.teams && searchResults.searchResults && (
            <div className="p-3">
              <div className="mb-3">
                <h4 className="font-semibold text-green-600 dark:text-green-400 text-sm mb-1">
                  ✅ {searchResults.message}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Click on a team to select:</p>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.teams.map((team) => (
                  <div
                    key={team.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 transition-colors"
                    onClick={() => handleSelectManager(team.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                        {team.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {team.id}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Team: <span className="font-medium">{team.team_name}</span>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
                      <span>Points: {team.total_points || 'N/A'}</span>
                      <span>Rank: {team.overall_rank ? `#${team.overall_rank}` : 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Search Info */}
              {searchResults.searchInfo && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {searchResults.searchInfo}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* No Results Found - Show search info */}
          {searchResults.found === false && searchResults.searchInfo && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="mb-2">
                <h4 className="font-medium text-yellow-600 dark:text-yellow-400 text-sm">
                  ⚠️ {searchResults.message}
                </h4>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {searchResults.searchInfo}
              </div>
            </div>
          )}

          {/* Search Suggestions */}
          {!searchResults.found && !searchResults.hasOwnProperty('found') && (
            <div className="p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {searchResults.message}
              </p>
              
              <div className="space-y-2">
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(
                    `"${searchQuery}" FPL manager ID fantasy premier league`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                >
                  🔍 Search Google for &quot;{searchQuery}&quot;
                </a>
                
                <a
                  href={`https://www.reddit.com/r/FantasyPL/search/?q=${encodeURIComponent(
                    searchQuery
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                >
                  🏆 Search FPL Reddit
                </a>
                
                <a
                  href="https://www.fplgameweek.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                >
                  🎯 Try FPLGameweek
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}