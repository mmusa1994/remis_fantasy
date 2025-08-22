"use client";

import { useState, useEffect } from "react";
import { MdExpandMore, MdExpandLess, MdSettings } from "react-icons/md";

interface SettingsCardProps {
  onSettingsSaved: (settings: FPLSettings) => void;
}

interface FPLSettings {
  fpl_proxy_url: string | null;
  cron_secret: string | null;
  default_gw: number;
  default_manager_id: number;
}

export default function SettingsCard({ onSettingsSaved }: SettingsCardProps) {
  const [settings, setSettings] = useState<FPLSettings>({
    fpl_proxy_url: null,
    cron_secret: null,
    default_gw: 1,
    default_manager_id: 133444,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/fpl/settings");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSettings(result.data);
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/fpl/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          onSettingsSaved(result.data);
        }
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof FPLSettings,
    value: string | number | null
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <button className="w-full p-3 text-left flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MdSettings className="text-gray-400 w-4 h-4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 animate-pulse"></div>
          </div>
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <MdSettings className="text-gray-500 w-4 h-4" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            FPL Settings
          </span>
        </div>
        {isExpanded ? (
          <MdExpandLess className="text-gray-500 w-4 h-4" />
        ) : (
          <MdExpandMore className="text-gray-500 w-4 h-4" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Manager ID
              </label>
              <input
                type="number"
                value={settings.default_manager_id}
                onChange={(e) =>
                  handleInputChange(
                    "default_manager_id",
                    parseInt(e.target.value, 10)
                  )
                }
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="133444"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Gameweek
              </label>
              <input
                type="number"
                min="1"
                max="38"
                value={settings.default_gw}
                onChange={(e) =>
                  handleInputChange("default_gw", parseInt(e.target.value, 10))
                }
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Proxy URL
            </label>
            <input
              type="url"
              value={settings.fpl_proxy_url || ""}
              onChange={(e) =>
                handleInputChange("fpl_proxy_url", e.target.value || null)
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="https://proxy.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              CRON Secret
            </label>
            <input
              type="password"
              value={settings.cron_secret || ""}
              onChange={(e) =>
                handleInputChange("cron_secret", e.target.value || null)
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Secret key"
            />
          </div>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-1.5 px-3 text-sm rounded transition-colors duration-200"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </span>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
