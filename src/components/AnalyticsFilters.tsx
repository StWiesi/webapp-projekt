'use client';

import React, { useMemo, useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

interface AnalyticsFiltersProps {
  data: any[][];
  filters: {
    network: string[];
    region: string[];
    city: string[];
    site: string[];
    screenIds: string[];
  };
  onFiltersChange: (filters: {
    network: string[];
    region: string[];
    city: string[];
    site: string[];
    screenIds: string[];
  }) => void;
  columnMapping: {
    date: number;
    cost: number;
    total_impressions: number;
    plays: number;
    auction_wins: number;
    ad_requests: number;
    network: number;
    region: number;
    city: number;
    site: number;
    screenIds: number;
  };
}

const FILTER_DIMENSIONS = [
  { key: 'network', label: 'Network', icon: '🌐' },
  { key: 'region', label: 'Region', icon: '🗺️' },
  { key: 'city', label: 'City', icon: '🏙️' },
  { key: 'site', label: 'Site', icon: '📍' },
  { key: 'screenIds', label: 'Screen IDs', icon: '📺' }
];

export default function AnalyticsFilters({ data, filters, onFiltersChange, columnMapping }: AnalyticsFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['network']));
  const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});

  // Verwende die übergebene Spalten-Zuordnung
  const headers = data[0] || [];
  const rows = data.slice(1);

  const columnIndices = useMemo(() => {
    return {
      network: columnMapping.network,
      region: columnMapping.region,
      city: columnMapping.city,
      site: columnMapping.site,
      screenIds: columnMapping.screenIds
    };
  }, [columnMapping]);

  // Extrahiere eindeutige Werte für jede Dimension
  const availableOptions = useMemo(() => {
    const options: { [key: string]: string[] } = {};

    FILTER_DIMENSIONS.forEach(dimension => {
      const columnIndex = columnIndices[dimension.key as keyof typeof columnIndices];
      if (columnIndex === -1) {
        options[dimension.key] = [];
        return;
      }

      const uniqueValues = new Set<string>();
      rows.forEach(row => {
        const value = row[columnIndex]?.toString()?.trim();
        if (value && value !== '') {
          uniqueValues.add(value);
        }
      });

      options[dimension.key] = Array.from(uniqueValues).sort();
    });

    return options;
  }, [rows, columnIndices]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleFilter = (dimension: string, value: string) => {
    const currentFilters = filters[dimension as keyof typeof filters];
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter(f => f !== value)
      : [...currentFilters, value];

    onFiltersChange({
      ...filters,
      [dimension]: newFilters
    });
  };

  const clearFilter = (dimension: string) => {
    onFiltersChange({
      ...filters,
      [dimension]: []
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      network: [],
      region: [],
      city: [],
      site: [],
      screenIds: []
    });
  };

  const updateSearchTerm = (dimension: string, term: string) => {
    setSearchTerms(prev => ({
      ...prev,
      [dimension]: term
    }));
  };

  const getFilteredOptions = (dimension: string) => {
    const options = availableOptions[dimension] || [];
    const searchTerm = searchTerms[dimension]?.toLowerCase() || '';
    
    if (!searchTerm) return options;
    
    return options.filter(option => 
      option.toLowerCase().includes(searchTerm)
    );
  };

  const getTotalActiveFilters = () => {
    return Object.values(filters).reduce((total, filterArray) => total + filterArray.length, 0);
  };

  // Prüfe ob Filter verfügbar sind
  const hasAnyData = FILTER_DIMENSIONS.some(dimension => 
    availableOptions[dimension]?.length > 0
  );

  if (!hasAnyData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center">
          <Filter className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Keine Filter verfügbar
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Die Excel-Datei enthält keine erkennbaren Dimensionen-Spalten (Network, Region, City, Site, Screen IDs).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Datenfilter
            </h3>
            {getTotalActiveFilters() > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                {getTotalActiveFilters()} aktiv
              </span>
            )}
          </div>
          {getTotalActiveFilters() > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
            >
              Alle löschen
            </button>
          )}
        </div>
      </div>

      {/* Filter Sections */}
      <div className="p-4 space-y-4">
        {FILTER_DIMENSIONS.map((dimension) => {
          const options = availableOptions[dimension.key] || [];
          const filteredOptions = getFilteredOptions(dimension.key);
          const activeFilters = filters[dimension.key as keyof typeof filters];
          const isExpanded = expandedSections.has(dimension.key);

          if (options.length === 0) return null;

          return (
            <div key={dimension.key} className="border border-gray-200 dark:border-gray-600 rounded-lg">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(dimension.key)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{dimension.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {dimension.label}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({options.length})
                  </span>
                  {activeFilters.length > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {activeFilters.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {activeFilters.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFilter(dimension.key);
                      }}
                      className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Section Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-600 p-3">
                  {/* Search */}
                  {options.length > 10 && (
                    <div className="mb-3">
                      <input
                        type="text"
                        placeholder={`${dimension.label} suchen...`}
                        value={searchTerms[dimension.key] || ''}
                        onChange={(e) => updateSearchTerm(dimension.key, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredOptions.map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={activeFilters.includes(option)}
                          onChange={() => toggleFilter(dimension.key, option)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>

                  {filteredOptions.length === 0 && searchTerms[dimension.key] && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      Keine Ergebnisse für "{searchTerms[dimension.key]}"
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
