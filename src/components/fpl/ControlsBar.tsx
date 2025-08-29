"use client";

import { useState } from "react";
import { MdDownload, MdPlayArrow, MdStop } from "react-icons/md";
import { useTranslation } from "react-i18next";
import TeamSearchInput from "./TeamSearchInput";

interface ControlsBarProps {
  managerId: number | null;
  gameweek: number;
  isPolling: boolean;
  onManagerIdChange: (id: number) => void;
  onGameweekChange: (gw: number) => void;
  onLoadTeam: (managerId?: number, gameweek?: number) => void; // Optional params
  onStartPolling: () => void;
  onStopPolling: () => void;
  loading: boolean;
}

export default function ControlsBar({
  managerId,
  isPolling,
  onManagerIdChange,
  onGameweekChange,
  onLoadTeam,
  onStartPolling,
  onStopPolling,
  loading,
}: ControlsBarProps) {
  const { t } = useTranslation("fpl");

  // Simple state - only prefill from localStorage on initial load
  const [localManagerId, setLocalManagerId] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("fpl-manager-id");
      return stored || "";
    }
    return "";
  });

  const [localGameweek, setLocalGameweek] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("fpl-gameweek");
      return stored || "";
    }
    return "";
  });

  // Simple handlers - update state and localStorage
  const handleManagerIdChange = (value: string) => {
    setLocalManagerId(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("fpl-manager-id", value);
    }
  };

  const handleGameweekChange = (value: string) => {
    setLocalGameweek(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("fpl-gameweek", value);
    }
  };

  const handleLoadTeam = () => {
    const managerIdNum = parseInt(localManagerId, 10);
    const gameweekNum = parseInt(localGameweek, 10);

    // Validate input values
    if (isNaN(managerIdNum) || managerIdNum <= 0) {
      return; // Button should be disabled, but just in case
    }

    if (isNaN(gameweekNum) || gameweekNum < 1 || gameweekNum > 38) {
      return; // Button should be disabled, but just in case
    }

    // Update parent state first
    onManagerIdChange(managerIdNum);
    onGameweekChange(gameweekNum);

    // Call load team with the actual values from input
    onLoadTeam(managerIdNum, gameweekNum);
  };

  const handleTeamSearchFound = (foundManagerId: number) => {
    const managerIdStr = foundManagerId.toString();
    setLocalManagerId(managerIdStr);
    if (typeof window !== "undefined") {
      localStorage.setItem("fpl-manager-id", managerIdStr);
    }
    onManagerIdChange(foundManagerId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (!loading) {
        handleLoadTeam();
      }
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-500/90 to-purple-600/90 rounded-xl shadow-lg p-4 md:p-6 border border-blue-300/30 backdrop-blur-sm">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-white mb-2">
          {t("fplLive.enterManagerId")}
        </h2>
        <p className="text-blue-100 text-sm">
          {managerId
            ? `${t("fplLive.currentManagerId")} ${managerId}`
            : t("pleaseEnterManagerId")}
        </p>
      </div>

      {/* Team Search */}
      <div className="mb-4">
        <div className="text-center mb-2">
          <p className="text-white/80 text-sm">{t("fplLive.search.orSearchByTeamName")}</p>
        </div>
        <TeamSearchInput
          onManagerIdFound={handleTeamSearchFound}
          placeholder={t("fplLive.search.searchInputPlaceholder")}
          className="max-w-md mx-auto"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-center bg-white/10 rounded-lg p-3 md:p-4 backdrop-blur">
        {/* Manager ID Input */}
        <div className="flex flex-col md:flex-row gap-2 items-center justify-center">
          <label
            htmlFor="manager-id-input"
            className="text-sm font-medium text-white/90 text-center w-full"
          >
            {t("fplLive.managerId")}
          </label>
          <input
            id="manager-id-input"
            type="number"
            value={localManagerId}
            onChange={(e) => handleManagerIdChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 text-center border-2 border-white/30 bg-white/20 text-white rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/50 placeholder-white/60 backdrop-blur transition-all duration-200"
            placeholder="133790"
            title="Press Enter to load team"
          />
        </div>

        {/* Gameweek Input */}
        <div className="flex flex-col md:flex-row gap-2 items-center justify-center">
          <label
            htmlFor="gameweek-input"
            className="text-sm font-medium text-white/90 text-center w-full"
          >
            {t("fplLive.gameweek")}
          </label>
          <input
            id="gameweek-input"
            type="number"
            min="1"
            max="38"
            step="1"
            inputMode="numeric"
            pattern="[0-9]*"
            value={localGameweek}
            onChange={(e) => handleGameweekChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 text-center border-2 border-white/30 bg-white/20 text-white rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/50 backdrop-blur transition-all duration-200"
            placeholder="1-38"
          />
        </div>

        {/* Load Team Button */}
        <button
          onClick={handleLoadTeam}
          disabled={
            loading ||
            isNaN(parseInt(localManagerId, 10)) ||
            parseInt(localManagerId, 10) <= 0 ||
            isNaN(parseInt(localGameweek, 10)) ||
            parseInt(localGameweek, 10) < 1 ||
            parseInt(localGameweek, 10) > 38
          }
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-medium py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">{t("fplLive.loading")}</span>
            </>
          ) : (
            <>
              <MdDownload className="text-lg" />
              <span className="text-sm">{t("fplLive.loadTeam")}</span>
            </>
          )}
        </button>

        {/* Start/Stop Live Button */}
        <button
          type="button"
          onClick={isPolling ? onStopPolling : onStartPolling}
          disabled={loading}
          className={`flex items-center justify-center gap-2 font-medium py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-white ${
            isPolling
              ? "bg-red-600 hover:bg-red-700 disabled:bg-gray-500"
              : "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500"
          }`}
        >
          {isPolling ? (
            <>
              <MdStop className="text-lg" />
              <span className="text-sm">{t("stopLive")}</span>
            </>
          ) : (
            <>
              <MdPlayArrow className="text-lg" />
              <span className="text-sm">{t("startLive")}</span>
            </>
          )}
        </button>

        {/* Status Indicator */}
        <div
          className="md:col-span-4 flex items-center justify-center gap-2 mt-2 md:mt-0"
          aria-live="polite"
          aria-atomic="true"
        >
          <div
            className={`w-3 h-3 rounded-full ${
              isPolling ? "bg-green-400" : "bg-gray-400"
            }`}
            aria-hidden="true"
          ></div>
          <span
            className={`text-sm ${
              isPolling ? "text-green-200" : "text-white/70"
            }`}
          >
            {isPolling ? t("fplLive.livePollingActive") : t("fplLive.offline")}
          </span>
        </div>
      </div>

      {isPolling && (
        <div className="mt-4 p-3 bg-green-500/20 border border-green-400/30 rounded-lg backdrop-blur">
          <p className="text-center text-sm font-medium text-green-200">
            🔴 {t("fplLive.livePollingActive")}
          </p>
        </div>
      )}
    </div>
  );
}
