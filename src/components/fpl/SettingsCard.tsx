"use client";

import { useState, useEffect } from "react";
import { MdExpandMore, MdExpandLess, MdSettings } from "react-icons/md";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
      <div className="bg-gradient-to-r from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm">
        <button className="w-full p-4 text-left flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <MdSettings className="text-white w-4 h-4 animate-pulse" />
            </div>
            <div className="h-4 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-gray-600 dark:to-gray-500 rounded-lg w-20 animate-pulse"></div>
          </div>
          <div className="w-4 h-4 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-gray-600 dark:to-gray-500 rounded animate-pulse"></div>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:bg-gradient-to-r rounded-xl shadow-lg border border-gray-200/60 dark:border-gray-600/50 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left flex items-center justify-between hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-blue-50/30 dark:hover:from-gray-700/50 dark:hover:to-blue-900/20 transition-all duration-300 group"
      >
        <div className="flex items-center space-x-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
              isExpanded
                ? "bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 shadow-md"
                : "bg-gradient-to-br from-gray-400 via-blue-500 to-purple-600 group-hover:from-blue-500 group-hover:to-purple-600"
            }`}
          >
            <MdSettings
              className={`w-4 h-4 text-white transition-transform duration-300 ${
                isExpanded ? "rotate-90" : "group-hover:rotate-45"
              }`}
            />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
            {t("fplLive.settingsCardTitle")}
          </span>
        </div>
        <div
          className={`transition-all duration-300 ${
            isExpanded
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
          }`}
        >
          {isExpanded ? (
            <MdExpandLess className="w-5 h-5" />
          ) : (
            <MdExpandMore className="w-5 h-5" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800/50 dark:via-gray-700/30 dark:to-gray-800/50 px-4 pb-4 space-y-4 border-t border-gray-200/50 dark:border-gray-600/30 pt-4 backdrop-blur-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                {t("fplLive.settingsCardManagerId")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={settings.default_manager_id}
                  onChange={(e) =>
                    handleInputChange(
                      "default_manager_id",
                      parseInt(e.target.value, 10)
                    )
                  }
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-400"
                  placeholder="133444"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/10 to-transparent dark:via-blue-900/10 rounded-lg pointer-events-none"></div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {t("fplLive.settingsCardGameweek")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="38"
                  value={settings.default_gw}
                  onChange={(e) =>
                    handleInputChange(
                      "default_gw",
                      parseInt(e.target.value, 10)
                    )
                  }
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:text-white transition-all duration-200 hover:border-green-300 dark:hover:border-green-400"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-50/10 to-transparent dark:via-green-900/10 rounded-lg pointer-events-none"></div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              {t("fplLive.settingsCardProxyUrl")}
            </label>
            <div className="relative">
              <input
                type="url"
                value={settings.fpl_proxy_url || ""}
                onChange={(e) =>
                  handleInputChange("fpl_proxy_url", e.target.value || null)
                }
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-400"
                placeholder="https://proxy.com"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-50/10 to-transparent dark:via-purple-900/10 rounded-lg pointer-events-none"></div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              {t("fplLive.settingsCardCronSecret")}
            </label>
            <div className="relative">
              <input
                type="password"
                value={settings.cron_secret || ""}
                onChange={(e) =>
                  handleInputChange("cron_secret", e.target.value || null)
                }
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:text-white transition-all duration-200 hover:border-orange-300 dark:hover:border-orange-400"
                placeholder="Secret key"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-50/10 to-transparent dark:via-orange-900/10 rounded-lg pointer-events-none"></div>
            </div>
          </div>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 disabled:from-gray-300 disabled:via-gray-400 disabled:to-gray-500 dark:disabled:from-gray-600 dark:disabled:via-gray-700 dark:disabled:to-gray-800 text-white font-bold py-3 px-4 text-sm rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium">
                  {t("fplLive.settingsCardSaving")}
                </span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <MdSettings className="w-4 h-4" />
                {t("fplLive.settingsCardSaveSettings")}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
