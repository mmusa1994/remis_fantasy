"use client";

import { useState, useEffect } from 'react';
import { 
  loadLeagueConfig, 
  loadLeaguePrizes, 
  loadAllLeagueConfigs,
  getGlobalStats,
  getHomepageLeagues,
  validateLeagueData,
  type LeagueConfig, 
  type Prize 
} from '../utils/data-loader';

/**
 * Hook for loading specific league data
 */
export const useLeagueData = (leagueId: string) => {
  const [data, setData] = useState<{
    config: LeagueConfig | null;
    prizes: Prize[];
  }>({ config: null, prizes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate data first
        const validation = validateLeagueData(leagueId);
        if (!validation.isValid) {
          throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
        }

        const config = loadLeagueConfig(leagueId);
        const prizes = loadLeaguePrizes(leagueId);

        setData({ config, prizes });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load league data');
        console.error('Error loading league data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (leagueId) {
      loadData();
    }
  }, [leagueId]);

  return { data, loading, error };
};

/**
 * Hook for loading all leagues data
 */
export const useAllLeaguesData = () => {
  const [data, setData] = useState<LeagueConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const allConfigs = loadAllLeagueConfigs();
        setData(allConfigs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leagues data');
        console.error('Error loading all leagues data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { data, loading, error };
};

/**
 * Hook for loading homepage data
 */
export const useHomepageData = () => {
  const [data, setData] = useState<{
    leagues: ReturnType<typeof getHomepageLeagues>;
    globalStats: ReturnType<typeof getGlobalStats>;
  }>({ leagues: [], globalStats: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const leagues = getHomepageLeagues();
        const globalStats = getGlobalStats();

        setData({ leagues, globalStats });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load homepage data');
        console.error('Error loading homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { data, loading, error };
};

/**
 * Hook for loading specific page content
 */
export const usePageContent = (leagueId: string, page: 'main' | 'prizes' | 'gallery' | 'tables' | 'registration') => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const config = loadLeagueConfig(leagueId);
        if (!config) {
          throw new Error(`League configuration not found for ${leagueId}`);
        }

        let pageData;
        switch (page) {
          case 'main':
            pageData = config.pageContent.hero;
            break;
          case 'prizes':
            pageData = config.pageContent.sections.prizes;
            break;
          case 'gallery':
            pageData = config.pageContent.sections.gallery;
            break;
          case 'tables':
            pageData = config.pageContent.sections.tables;
            break;
          case 'registration':
            // For registration, we might need additional data
            pageData = {
              title: `${config.name} Registracija`,
              subtitle: config.subtitle,
              description: config.description,
            };
            break;
          default:
            throw new Error(`Unknown page type: ${page}`);
        }

        setData(pageData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load page content');
        console.error('Error loading page content:', err);
      } finally {
        setLoading(false);
      }
    };

    if (leagueId && page) {
      loadData();
    }
  }, [leagueId, page]);

  return { data, loading, error };
};

/**
 * Hook for loading league prizes
 */
export const useLeaguePrizes = (leagueId: string) => {
  const [data, setData] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const prizes = loadLeaguePrizes(leagueId);
        setData(prizes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load league prizes');
        console.error('Error loading league prizes:', err);
      } finally {
        setLoading(false);
      }
    };

    if (leagueId) {
      loadData();
    }
  }, [leagueId]);

  return { data, loading, error };
};