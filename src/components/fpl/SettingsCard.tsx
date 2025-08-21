'use client';

import { useState, useEffect } from 'react';

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
    default_manager_id: 133790,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fpl/settings');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSettings(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/fpl/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof FPLSettings, value: string | number | null) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Settings</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">FPL Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Default Manager ID
          </label>
          <input
            type="number"
            value={settings.default_manager_id}
            onChange={(e) => handleInputChange('default_manager_id', parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="133790"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Default Gameweek
          </label>
          <input
            type="number"
            min="1"
            max="38"
            value={settings.default_gw}
            onChange={(e) => handleInputChange('default_gw', parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            FPL Proxy URL (Optional)
          </label>
          <input
            type="url"
            value={settings.fpl_proxy_url || ''}
            onChange={(e) => handleInputChange('fpl_proxy_url', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="https://your-proxy.com"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Proxy server za FPL API pozive ako imaš problema sa CORS-om
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            CRON Secret (Optional)
          </label>
          <input
            type="password"
            value={settings.cron_secret || ''}
            onChange={(e) => handleInputChange('cron_secret', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Your secret key"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Sigurnosni ključ za automatsko ažuriranje (server-side CRON jobs)
          </p>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}