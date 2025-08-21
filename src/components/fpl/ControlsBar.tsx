"use client";

import { useState } from "react";
import { MdDownload, MdPlayArrow, MdStop } from "react-icons/md";

interface ControlsBarProps {
  managerId: number | null;
  gameweek: number;
  isPolling: boolean;
  onManagerIdChange: (id: number) => void;
  onGameweekChange: (gw: number) => void;
  onLoadTeam: () => void;
  onStartPolling: () => void;
  onStopPolling: () => void;
  loading: boolean;
}

export default function ControlsBar({
  managerId,
  gameweek,
  isPolling,
  onManagerIdChange,
  onGameweekChange,
  onLoadTeam,
  onStartPolling,
  onStopPolling,
  loading,
}: ControlsBarProps) {
  const [localManagerId, setLocalManagerId] = useState(
    managerId?.toString() || ""
  );
  const [localGameweek, setLocalGameweek] = useState(gameweek.toString());

  const handleManagerIdChange = (value: string) => {
    setLocalManagerId(value);
    const id = parseInt(value, 10);
    if (!isNaN(id) && id > 0) {
      onManagerIdChange(id);
    }
  };

  const handleGameweekChange = (value: string) => {
    setLocalGameweek(value);
    const gw = parseInt(value, 10);
    if (!isNaN(gw) && gw >= 1 && gw <= 38) {
      onGameweekChange(gw);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (!loading) {
        onLoadTeam();
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Manager ID Input */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Manager ID:
          </label>
          <input
            type="number"
            value={localManagerId}
            onChange={(e) => handleManagerIdChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="133790"
            title="Press Enter to load team"
          />
        </div>

        {/* Gameweek Input */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            GW:
          </label>
          <input
            type="number"
            min="1"
            max="38"
            value={localGameweek}
            onChange={(e) => handleGameweekChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Load Team Button */}
        <button
          onClick={onLoadTeam}
          disabled={loading}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Loading...
            </>
          ) : (
            <>
              <MdDownload className="text-base" />
              Load Team
            </>
          )}
        </button>

        {/* Start/Stop Live Button */}
        <button
          onClick={isPolling ? onStopPolling : onStartPolling}
          disabled={loading}
          className={`flex items-center gap-1 text-sm font-medium py-1.5 px-3 rounded transition-colors duration-200 ${
            isPolling
              ? "bg-red-600 hover:bg-red-700 disabled:bg-red-300"
              : "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
          } text-white`}
        >
          {isPolling ? (
            <><MdStop className="text-sm" />Stop Live</>
          ) : (
            <><MdPlayArrow className="text-sm" />Start Live</>
          )}
        </button>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isPolling ? "bg-green-500 animate-pulse" : "bg-gray-400"
            }`}
          ></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {isPolling ? "Live" : "Offline"}
          </span>
        </div>
      </div>

      {isPolling && (
        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            🔴 Live polling active - updating every 15 seconds
          </p>
        </div>
      )}
    </div>
  );
}
