"use client";

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  X, 
  ChevronUp, 
  TrendingUp,
  AlertTriangle,
  Target,
  BarChart,
  Calendar
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import type { EnhancedFilterState, EnhancedPlayerData } from '@/types/fpl-enhanced';

interface AdvancedFilterPanelProps {
  filters: EnhancedFilterState;
  onFiltersChange: (filters: EnhancedFilterState) => void;
  allPlayers: EnhancedPlayerData[];
  allTeams: any[];
  isVisible: boolean;
  onToggle: () => void;
}

export default function AdvancedFilterPanel({
  filters,
  onFiltersChange,
  allTeams,
  isVisible,
  onToggle,
}: AdvancedFilterPanelProps) {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState<string | null>('basic');
  
  // Filter categories
  const filterSections = {
    basic: { 
      title: 'Basic Filters', 
      icon: <Filter className="w-4 h-4" />,
      description: 'Position, Team, Price'
    },
    performance: { 
      title: 'Performance', 
      icon: <BarChart className="w-4 h-4" />,
      description: 'Points, Form, Value'
    },
    market: { 
      title: 'Market Data', 
      icon: <TrendingUp className="w-4 h-4" />,
      description: 'Price Changes, Ownership'
    },
    availability: { 
      title: 'Availability', 
      icon: <AlertTriangle className="w-4 h-4" />,
      description: 'Injury, Rotation Risk'
    },
    fixtures: { 
      title: 'Fixtures', 
      icon: <Calendar className="w-4 h-4" />,
      description: 'Difficulty, Upcoming'
    },
    advanced: { 
      title: 'Advanced', 
      icon: <Target className="w-4 h-4" />,
      description: 'Differentials, Captain Appeal'
    },
  };

  const positions = [
    { id: 1, name: 'GK', label: 'Goalkeepers' },
    { id: 2, name: 'DEF', label: 'Defenders' },
    { id: 3, name: 'MID', label: 'Midfielders' },
    { id: 4, name: 'FWD', label: 'Forwards' },
  ];

  const sortOptions = [
    { value: 'total_points', label: 'Total Points' },
    { value: 'event_points', label: 'GW Points' },
    { value: 'now_cost', label: 'Price' },
    { value: 'form', label: 'Form' },
    { value: 'selected_by_percent', label: 'Ownership %' },
    { value: 'value_season', label: 'Value (Season)' },
    { value: 'value_form', label: 'Value (Form)' },
    { value: 'transfers_in_event', label: 'Transfers In' },
    { value: 'transfers_out_event', label: 'Transfers Out' },
    { value: 'ict_index', label: 'ICT Index' },
    { value: 'expected_goals', label: 'Expected Goals' },
    { value: 'expected_assists', label: 'Expected Assists' },
  ];

  const updateFilter = useCallback(<K extends keyof EnhancedFilterState>(
    key: K,
    value: EnhancedFilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  // Quick filter presets
  const quickFilters = {
    differentials: () => updateFilter('differentialMin', 15),
    value_picks: () => {
      onFiltersChange({
        ...filters,
        sortBy: 'value_season',
        sortOrder: 'desc',
        priceRange: [40, 80],
      });
    },
    form_players: () => {
      onFiltersChange({
        ...filters,
        sortBy: 'form',
        sortOrder: 'desc',
        formMin: 6,
      });
    },
    budget_gems: () => {
      onFiltersChange({
        ...filters,
        priceRange: [40, 60],
        sortBy: 'total_points',
        sortOrder: 'desc',
      });
    },
    premium_picks: () => {
      onFiltersChange({
        ...filters,
        priceRange: [100, 150],
        sortBy: 'total_points',
        sortOrder: 'desc',
      });
    },
  };

  const clearAllFilters = () => {
    onFiltersChange({
      position: [],
      teams: [],
      priceRange: [40, 150],
      formRating: 0,
      availability: ['a'],
      sortBy: 'total_points',
      sortOrder: 'desc',
      search: '',
      priceChangeMin: undefined,
      priceChangeMax: undefined,
      priceChangePeriod: '24h',
      ownershipMin: undefined,
      ownershipMax: undefined,
      ownershipTrend: [],
      ownershipChangePeriod: '24h',
      transfersInMin: undefined,
      transfersOutMin: undefined,
      netTransfersMin: undefined,
      transferMomentum: [],
      formMin: undefined,
      valueMin: undefined,
      differentialMin: undefined,
      nextFixtureDifficulty: [],
      fixtureCount: 3,
      fixtureHorizon: 5,
      rotationRisk: [],
      injuryStatus: ['available'],
      captaincyAppealMin: undefined,
      searchMode: 'basic',
      includeInjured: false,
      includeSuspended: false,
    });
  };

  const getActiveFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.position.length > 0) count++;
    if (filters.teams.length > 0) count++;
    if (filters.priceRange[0] > 40 || filters.priceRange[1] < 150) count++;
    if (filters.formRating > 0) count++;
    if (filters.search) count++;
    if (filters.priceChangeMin !== undefined) count++;
    if (filters.ownershipMin !== undefined) count++;
    if (filters.transfersInMin !== undefined) count++;
    if (filters.formMin !== undefined) count++;
    if (filters.differentialMin !== undefined) count++;
    return count;
  }, [filters]);

  const renderBasicFilters = () => (
    <div className="space-y-4">
      {/* Position Filter */}
      <div>
        <label className="block text-sm font-medium mb-2">Position</label>
        <div className="grid grid-cols-2 gap-2">
          {positions.map(pos => (
            <label key={pos.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.position.includes(pos.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateFilter('position', [...filters.position, pos.id]);
                  } else {
                    updateFilter('position', filters.position.filter(p => p !== pos.id));
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">{pos.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Team Filter */}
      <div>
        <label className="block text-sm font-medium mb-2">Teams</label>
        <select
          multiple
          value={filters.teams.map(String)}
          onChange={(e) => {
            const values = Array.from(e.target.selectedOptions, option => parseInt(option.value));
            updateFilter('teams', values);
          }}
          className="w-full h-32 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm p-2"
        >
          {allTeams.map(team => (
            <option key={team.id} value={team.id}>
              {team.short_name} - {team.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Price Range: £{(filters.priceRange[0] / 10).toFixed(1)}m - £{(filters.priceRange[1] / 10).toFixed(1)}m
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="40"
            max="150"
            step="1"
            value={filters.priceRange[0]}
            onChange={(e) => updateFilter('priceRange', [parseInt(e.target.value), filters.priceRange[1]])}
            className="w-full"
          />
          <input
            type="range"
            min="40"
            max="150"
            step="1"
            value={filters.priceRange[1]}
            onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
            className="w-full"
          />
        </div>
      </div>

      {/* Sort Options */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-2">Sort by</label>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm p-2"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Order</label>
          <select
            value={filters.sortOrder}
            onChange={(e) => updateFilter('sortOrder', e.target.value as 'asc' | 'desc')}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm p-2"
          >
            <option value="desc">Highest First</option>
            <option value="asc">Lowest First</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderPerformanceFilters = () => (
    <div className="space-y-4">
      {/* Form Rating */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Minimum Form Rating: {filters.formMin || 0}
        </label>
        <input
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={filters.formMin || 0}
          onChange={(e) => updateFilter('formMin', parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Value Rating */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Minimum Value Rating: {filters.valueMin || 0}
        </label>
        <input
          type="range"
          min="0"
          max="20"
          step="0.5"
          value={filters.valueMin || 0}
          onChange={(e) => updateFilter('valueMin', parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Points thresholds */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-2">Min Points</label>
          <input
            type="number"
            placeholder="e.g. 50"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Min GW Points</label>
          <input
            type="number"
            placeholder="e.g. 6"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm p-2"
          />
        </div>
      </div>
    </div>
  );

  const renderMarketFilters = () => (
    <div className="space-y-4">
      {/* Price Changes */}
      <div>
        <label className="block text-sm font-medium mb-2">Price Changes</label>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            placeholder="Min change"
            value={filters.priceChangeMin || ''}
            onChange={(e) => updateFilter('priceChangeMin', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm p-2"
          />
          <input
            type="number"
            placeholder="Max change"
            value={filters.priceChangeMax || ''}
            onChange={(e) => updateFilter('priceChangeMax', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm p-2"
          />
          <select
            value={filters.priceChangePeriod}
            onChange={(e) => updateFilter('priceChangePeriod', e.target.value as '1h' | '24h' | 'week')}
            className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm p-2"
          >
            <option value="1h">1 Hour</option>
            <option value="24h">24 Hours</option>
            <option value="week">1 Week</option>
          </select>
        </div>
      </div>

      {/* Ownership */}
      <div>
        <label className="block text-sm font-medium mb-2">Ownership %</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min %"
            value={filters.ownershipMin || ''}
            onChange={(e) => updateFilter('ownershipMin', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm p-2"
          />
          <input
            type="number"
            placeholder="Max %"
            value={filters.ownershipMax || ''}
            onChange={(e) => updateFilter('ownershipMax', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm p-2"
          />
        </div>
      </div>

      {/* Transfer Activity */}
      <div>
        <label className="block text-sm font-medium mb-2">Transfer Activity</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min transfers in"
            value={filters.transfersInMin || ''}
            onChange={(e) => updateFilter('transfersInMin', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm p-2"
          />
          <input
            type="number"
            placeholder="Min transfers out"
            value={filters.transfersOutMin || ''}
            onChange={(e) => updateFilter('transfersOutMin', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm p-2"
          />
        </div>
      </div>
    </div>
  );

  const renderAdvancedFilters = () => (
    <div className="space-y-4">
      {/* Differential Score */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Minimum Differential Score: {filters.differentialMin || 0}
        </label>
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          value={filters.differentialMin || 0}
          onChange={(e) => updateFilter('differentialMin', parseFloat(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">Higher scores = better differentials (low ownership + high points)</p>
      </div>

      {/* Captaincy Appeal */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Minimum Captaincy Appeal: {filters.captaincyAppealMin || 0}
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={filters.captaincyAppealMin || 0}
          onChange={(e) => updateFilter('captaincyAppealMin', parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Search Mode */}
      <div>
        <label className="block text-sm font-medium mb-2">Search Mode</label>
        <div className="flex gap-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="searchMode"
              value="basic"
              checked={filters.searchMode === 'basic'}
              onChange={(e) => updateFilter('searchMode', e.target.value as 'basic' | 'advanced')}
              className="mr-2"
            />
            Basic
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="searchMode"
              value="advanced"
              checked={filters.searchMode === 'advanced'}
              onChange={(e) => updateFilter('searchMode', e.target.value as 'basic' | 'advanced')}
              className="mr-2"
            />
            Advanced
          </label>
        </div>
      </div>

      {/* Include Options */}
      <div>
        <label className="block text-sm font-medium mb-2">Include</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.includeInjured}
              onChange={(e) => updateFilter('includeInjured', e.target.checked)}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Injured Players
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.includeSuspended}
              onChange={(e) => updateFilter('includeSuspended', e.target.checked)}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Suspended Players
          </label>
        </div>
      </div>
    </div>
  );

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-lg`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">Advanced Filters</h3>
              {getActiveFiltersCount > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {getActiveFiltersCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Clear All
              </button>
              <button
                onClick={onToggle}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(quickFilters).map(([key, action]) => (
              <button
                key={key}
                onClick={action}
                className="px-3 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Sections */}
        <div className="p-4">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 mb-4">
            {Object.entries(filterSections).map(([key, section]) => (
              <button
                key={key}
                onClick={() => setActiveSection(activeSection === key ? null : key)}
                className={`p-3 rounded-lg text-left transition-all ${
                  activeSection === key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {section.icon}
                  <span className="font-medium text-sm">{section.title}</span>
                </div>
                <p className="text-xs opacity-75">{section.description}</p>
              </button>
            ))}
          </div>

          {/* Active Section Content */}
          <AnimatePresence mode="wait">
            {activeSection && (
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium flex items-center gap-2">
                    {filterSections[activeSection as keyof typeof filterSections].icon}
                    {filterSections[activeSection as keyof typeof filterSections].title}
                  </h4>
                  <button
                    onClick={() => setActiveSection(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>

                {activeSection === 'basic' && renderBasicFilters()}
                {activeSection === 'performance' && renderPerformanceFilters()}
                {activeSection === 'market' && renderMarketFilters()}
                {activeSection === 'advanced' && renderAdvancedFilters()}
                {(activeSection === 'availability' || activeSection === 'fixtures') && (
                  <div className="text-center text-gray-500 py-8">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Additional filters coming soon...</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}