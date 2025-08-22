"use client";

import React, { useState } from "react";
import { MdSearch, MdInfo, MdHelp, MdClose } from "react-icons/md";

interface TeamSearchHelperProps {
  onManagerIdFound: (managerId: number) => void;
  currentManagerId?: number | null;
}

export default function TeamSearchHelper({
  onManagerIdFound,
  currentManagerId,
}: TeamSearchHelperProps) {
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <MdSearch className="mr-2" />
            Pomoćnik za traženje Manager ID-ja
          </h3>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {isOpen ? <MdClose size={20} /> : <MdHelp size={20} />}
          </button>
        </div>

        {/* Direct Team Name Search - Always Visible */}
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            🔍 Search by Team Name
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
            Enter your team name (e.g., &quot;FT Fantasy Team&quot;) to get
            personalized search suggestions
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g., FT Warriors, My Team Name..."
              className="flex-1 px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md text-sm font-medium transition-colors"
            >
              {isSearching ? "Searching..." : "Find Team"}
            </button>
          </div>
        </div>

        {/* Search Results - Always Visible if Available */}
        {searchResults && (
          <div className="mb-4 space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {searchResults.message}
            </p>

            {/* Search Suggestions with Direct Links */}
            {searchResults.searchSuggestions && (
              <div className="space-y-3">
                <h5 className="font-semibold text-gray-900 dark:text-white text-sm">
                  🔍 Try These Search Methods:
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
                            Search Now
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
                  💡 Tips for &quot;{searchResults.query}&quot;:
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
                Current Manager ID: <strong>{currentManagerId}</strong>
              </span>
            </div>
          </div>
        )}

        {isOpen && (
          <div className="space-y-4">
            {/* Quick Manager ID Input */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Quick Load by Manager ID
              </h4>
              <form onSubmit={handleManagerIdSubmit} className="flex gap-2">
                <input
                  type="number"
                  name="managerId"
                  placeholder="e.g., 133444"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Load Team
                </button>
              </form>
            </div>

            {/* Additional Help Section */}
            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                📚 Additional Help & Methods
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                More traditional methods if team name search doesn&apos;t work
              </p>

              {/* Show Traditional Methods and Emergency Methods from Search Results */}
              {searchResults && (
                <div className="space-y-3">
                  {/* Traditional Methods */}
                  {searchResults.traditionalMethods && (
                    <div className="space-y-3">
                      <h5 className="font-semibold text-gray-900 dark:text-white text-sm">
                        📋 Traditional Methods:
                      </h5>
                      {searchResults.traditionalMethods.map(
                        (method: any, index: number) => (
                          <div
                            key={index}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3"
                          >
                            <h6 className="font-medium text-gray-900 dark:text-white mb-2">
                              {method.title}
                            </h6>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
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
                Quick Tips
              </h4>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <li>• Manager ID is a number (e.g., 133444)</li>
                <li>• You can find it in your FPL profile URL</li>
                <li>
                  • It&apos;s visible in league standings when you click your
                  team
                </li>
                <li>• Once loaded, your team will be saved for quick access</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
