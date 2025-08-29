"use client";

import React, { useState } from "react";
import { MdSearch, MdInfo, MdHelp, MdClose } from "react-icons/md";
import { useTranslation } from "react-i18next";

interface TeamSearchHelperProps {
  onManagerIdFound: (managerId: number) => void;
  currentManagerId?: number | null;
}

export default function TeamSearchHelper({
  onManagerIdFound,
  currentManagerId,
}: TeamSearchHelperProps) {
  const { t } = useTranslation("fpl");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/fpl/search-team?q=${encodeURIComponent(searchQuery)}`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSearchResults(result.data);
          
          // If we found a manager directly, auto-load it
          if (result.data.found && result.data.manager) {
            onManagerIdFound(result.data.manager.id);
            setSearchQuery("");
            setSearchResults(null);
          }
        }
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleManagerIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const managerId = parseInt(formData.get("managerId") as string, 10);

    if (!isNaN(managerId) && managerId > 0) {
      onManagerIdFound(managerId);
      setIsOpen(false);
    }
  };

  return (
    <div className="bg-theme-card rounded-lg shadow-sm border border-theme-border">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-theme-primary flex items-center">
            <MdSearch className="mr-2" />
            {t("fplLive.search.searchHelper")}
          </h3>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-theme-muted hover:text-theme-primary"
          >
            {isOpen ? <MdClose size={20} /> : <MdHelp size={20} />}
          </button>
        </div>

        {/* Direct Team Name Search - Always Visible */}
        <div className="mb-4 bg-theme-accent border border-theme-border rounded-lg p-4">
          <h4 className="font-medium text-theme-primary mb-2">
            🔍{t("fplLive.search.searchPlaceholder")}
          </h4>
          <p className="text-sm text-theme-secondary mb-3">
            {t("fplLive.search.searchDescription")}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={t("fplLive.search.teamNamePlaceholder")}
              className="flex-1 px-3 py-2 input-theme rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md text-sm font-medium transition-colors"
            >
              {isSearching ? t("fplLive.search.searching") : t("fplLive.search.findTeam")}
            </button>
          </div>
        </div>

        {/* Search Results - Always Visible if Available */}
        {searchResults && (
          <div className="mb-4 space-y-4">
            {/* Direct Manager Found */}
            {searchResults.found && searchResults.manager && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 flex items-center">
                    ✅ Manager Found!
                  </h4>
                  <button
                    onClick={() => onManagerIdFound(searchResults.manager.id)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
                  >
                    Load Team
                  </button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-green-900 dark:text-green-100">Player: </span>
                      <span className="text-green-800 dark:text-green-200">{searchResults.manager.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-900 dark:text-green-100">Team: </span>
                      <span className="text-green-800 dark:text-green-200">{searchResults.manager.team_name}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-green-900 dark:text-green-100">Manager ID: </span>
                      <span className="text-green-800 dark:text-green-200">{searchResults.manager.id}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-900 dark:text-green-100">Points: </span>
                      <span className="text-green-800 dark:text-green-200">{searchResults.manager.total_points}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-theme-secondary font-medium">
              {searchResults.message}
            </p>

            {/* Search Suggestions with Direct Links */}
            {searchResults.searchSuggestions && (
              <div className="space-y-3">
                <h5 className="font-semibold text-theme-primary text-sm">
                  🔍 {t("fplLive.search.tryTheseSearchMethods")}
                </h5>
                {searchResults.searchSuggestions.map(
                  (suggestion: any, index: number) => (
                    <div
                      key={index}
                      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h6 className="font-medium text-blue-900 dark:text-blue-100">
                          {suggestion.title}
                        </h6>
                        {suggestion.searchUrl && (
                          <a
                            href={suggestion.searchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors"
                          >
                            {t("fplLive.search.searchNow")}
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                        {suggestion.description}
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-xs text-blue-700 dark:text-blue-300">
                        {suggestion.steps?.map(
                          (step: string, stepIndex: number) => (
                            <li key={stepIndex}>{step}</li>
                          )
                        )}
                      </ol>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Specific Tips */}
            {searchResults.specificTips && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <h6 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  💡 {t("fplLive.search.tipsFor")} &quot;{searchResults.query}&quot;:
                </h6>
                <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                  {searchResults.specificTips.map(
                    (tip: string, tipIndex: number) => (
                      <li key={tipIndex} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{tip}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {currentManagerId && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center">
              <MdInfo className="text-green-600 dark:text-green-400 mr-2" />
              <span className="text-green-800 dark:text-green-200 text-sm">
                {t("fplLive.currentManagerId")}{" "}
                <strong>{currentManagerId}</strong>
              </span>
            </div>
          </div>
        )}

        {isOpen && (
          <div className="space-y-4">
            {/* Quick Manager ID Input */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                {t("fplLive.search.quickLoadByManagerId")}
              </h4>
              <form onSubmit={handleManagerIdSubmit} className="flex gap-2">
                <input
                  type="number"
                  name="managerId"
                  placeholder="e.g., 133444"
                  className="flex-1 px-3 py-2 input-theme rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  {t("fplLive.search.loadTeam")}
                </button>
              </form>
            </div>

            {/* Additional Help Section */}
            <div className="bg-theme-secondary border border-theme-border rounded-lg p-4">
              <h4 className="font-medium text-theme-primary mb-2">
                📚 {t("fplLive.search.additionalHelp")}
              </h4>
              <p className="text-sm text-theme-muted mb-3">
                {t("fplLive.search.moreTraditionalMethods")}
              </p>

              {/* Show Traditional Methods and Emergency Methods from Search Results */}
              {searchResults && (
                <div className="space-y-3">
                  {/* Traditional Methods */}
                  {searchResults.traditionalMethods && (
                    <div className="space-y-3">
                      <h5 className="font-semibold text-theme-primary text-sm">
                        📋 {t("fplLive.search.traditionalMethods")}
                      </h5>
                      {searchResults.traditionalMethods.map(
                        (method: any, index: number) => (
                          <div
                            key={index}
                            className="bg-theme-card border border-theme-border rounded-lg p-3"
                          >
                            <h6 className="font-medium text-theme-primary mb-2">
                              {method.title}
                            </h6>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-theme-muted">
                              {method.steps?.map(
                                (step: string, stepIndex: number) => (
                                  <li key={stepIndex}>{step}</li>
                                )
                              )}
                            </ol>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Emergency Methods */}
                  {searchResults.emergencyMethods && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <h6 className="font-medium text-red-900 dark:text-red-100 mb-2">
                        🆘 {searchResults.emergencyMethods.title}:
                      </h6>
                      <ul className="space-y-1 text-sm text-red-800 dark:text-red-200">
                        {searchResults.emergencyMethods.options?.map(
                          (option: string, optionIndex: number) => (
                            <li key={optionIndex} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{option}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                {t("fplLive.search.quickTips")}
              </h4>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <li>• {t("fplLive.search.managerIdIsNumber")}</li>
                <li>• {t("fplLive.search.findInProfileURL")}</li>
                <li>• {t("fplLive.search.visibleInLeagueStandings")}</li>
                <li>• {t("fplLive.search.teamWillBeSaved")}</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
