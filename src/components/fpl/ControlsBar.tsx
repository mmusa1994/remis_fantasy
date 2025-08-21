'use client';

import { useState } from 'react';

interface ControlsBarProps {
  managerId: number;
  gameweek: number;
  isPolling: boolean;
  onManagerIdChange: (id: number) => void;
  onGameweekChange: (gw: number) => void;
  onLoadTeam: () => void;
  onFetchNow: () => void;
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
  onFetchNow,
  onStartPolling,
  onStopPolling,
  loading,
}: ControlsBarProps) {
  const [localManagerId, setLocalManagerId] = useState(managerId.toString());
  const [localGameweek, setLocalGameweek] = useState(gameweek.toString());

  const handleManagerIdSubmit = () => {
    const id = parseInt(localManagerId, 10);
    if (!isNaN(id) && id > 0) {
      onManagerIdChange(id);
    }
  };

  const handleGameweekSubmit = () => {
    const gw = parseInt(localGameweek, 10);
    if (!isNaN(gw) && gw >= 1 && gw <= 38) {
      onGameweekChange(gw);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter') {
      action();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Controls</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Manager ID
          </label>
          <div className="flex">
            <input
              type="number"
              value={localManagerId}
              onChange={(e) => setLocalManagerId(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleManagerIdSubmit)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="133790"
            />
            <button
              onClick={handleManagerIdSubmit}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors text-gray-700 dark:text-gray-300"
            >
              Set
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Gameweek
          </label>
          <div className="flex">
            <input
              type="number"
              min="1"
              max="38"
              value={localGameweek}
              onChange={(e) => setLocalGameweek(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleGameweekSubmit)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handleGameweekSubmit}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors text-gray-700 dark:text-gray-300"
            >
              Set
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={onLoadTeam}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        >
          {loading ? 'Loading...' : 'Load Team'}
        </button>

        <button
          onClick={onFetchNow}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        >
          Fetch Now
        </button>

        <button
          onClick={isPolling ? onStopPolling : onStartPolling}
          disabled={loading}
          className={`font-medium py-2 px-4 rounded-md transition-colors duration-200 ${
            isPolling
              ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
              : 'bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-300'
          } text-white`}
        >
          {isPolling ? 'Stop Live' : 'Start Live'}
        </button>

        <div className="flex items-center justify-center">
          <div className={`w-3 h-3 rounded-full ${isPolling ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {isPolling ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {isPolling && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            🔴 Live polling active - updating every 15 seconds
          </p>
        </div>
      )}
    </div>
  );
}