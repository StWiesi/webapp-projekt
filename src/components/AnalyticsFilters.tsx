'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface AnalyticsFiltersProps {
  data: any[][];
  filters: {
    network: string[];
    region: string[];
    city: string[];
    site: string[];
    screenIds: string[];
    auctionType: string[];
    dateRange: {
      start: string;
      end: string;
    };
  };
  onFiltersChange: (filters: {
    network: string[];
    region: string[];
    city: string[];
    site: string[];
    screenIds: string[];
    auctionType: string[];
    dateRange: {
      start: string;
      end: string;
    };
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
    auctionType: number;
  };
}

const FILTER_DIMENSIONS = [
  { key: 'dateRange', label: 'Datum', icon: '📅' },
  { key: 'network', label: 'Network', icon: '🌐' },
  { key: 'auctionType', label: 'Auction Type', icon: '🎩' },
  { key: 'region', label: 'Bundesland', icon: '🗺️' },
  { key: 'city', label: 'Stadt', icon: '🏙️' },
  { key: 'site', label: 'Site', icon: '📍' },
  { key: 'screenIds', label: 'Screen ID', icon: '📺' }
];

const AnalyticsFilters = React.memo(({ data, filters, onFiltersChange, columnMapping }: AnalyticsFiltersProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([]));
  const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});
  const scrollPositionRef = useRef<number>(0);
  const shouldRestoreScrollRef = useRef<boolean>(false);

  // Verwende die übergebene Spalten-Zuordnung
  const rows = data.slice(1);

  const columnIndices = useMemo(() => {
    return {
      network: columnMapping.network,
      region: columnMapping.region,
      city: columnMapping.city,
      site: columnMapping.site,
      screenIds: columnMapping.screenIds,
      auctionType: columnMapping.auctionType
    };
  }, [columnMapping]);

  // Extrahiere eindeutige Werte für jede Dimension - ohne Filter-Abhängigkeit
  const availableOptions = useMemo(() => {
    const options: { [key: string]: string[] } = {};

    FILTER_DIMENSIONS.forEach(dimension => {
      // Überspringe dateRange, da es ein spezieller Filter ist
      if (dimension.key === 'dateRange') {
        options[dimension.key] = [];
        return;
      }

      const columnIndex = columnIndices[dimension.key as keyof typeof columnIndices];
      if (columnIndex === -1) {
        options[dimension.key] = [];
        return;
      }

      // Extrahiere alle eindeutigen Werte ohne Filterung
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
  }, [rows, columnIndices]); // Keine filters-Dependency mehr



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
    // Speichere Scroll-Position vor Filter-Änderung
    scrollPositionRef.current = window.scrollY;
    shouldRestoreScrollRef.current = true;
    
    // Nur für Array-Filter
    if (dimension !== 'dateRange') {
      const currentFilters = filters[dimension as keyof typeof filters] as string[];
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter(v => v !== value)
        : [...currentFilters, value];
      
      onFiltersChange({
        ...filters,
        [dimension]: newFilters
      });
    }
  };

  const clearFilter = (dimension: string) => {
    // Speichere Scroll-Position vor Filter-Änderung
    scrollPositionRef.current = window.scrollY;
    shouldRestoreScrollRef.current = true;
    
    if (dimension === 'dateRange') {
      onFiltersChange({
        ...filters,
        dateRange: {
          start: '',
          end: ''
        }
      });
    } else {
      onFiltersChange({
        ...filters,
        [dimension]: []
      });
    }
  };

  const clearAllFilters = () => {
    // Speichere Scroll-Position vor Filter-Änderung
    scrollPositionRef.current = window.scrollY;
    shouldRestoreScrollRef.current = true;
    
    // Setze alle Filter zurück auf leere Arrays
    onFiltersChange({
      network: [],
      region: [],
      city: [],
      site: [],
      screenIds: [],
      auctionType: [],
      dateRange: {
        start: '',
        end: ''
      }
    });
  };

  const updateSearchTerm = (dimension: string, term: string) => {
    setSearchTerms(prev => ({
      ...prev,
      [dimension]: term
    }));
  };

  // useEffect für Scroll-Position-Restoration nach Filter-Änderungen
  useEffect(() => {
    if (shouldRestoreScrollRef.current) {
      // Warte bis das DOM aktualisiert wurde
      const restoreScroll = () => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'instant'
        });
        shouldRestoreScrollRef.current = false;
      };

      // Sofort und mit mehreren Verzögerungen versuchen
      restoreScroll();
      const timeout1 = setTimeout(restoreScroll, 10);
      const timeout2 = setTimeout(restoreScroll, 50);
      const timeout3 = setTimeout(restoreScroll, 100);
      const timeout4 = setTimeout(restoreScroll, 200);

      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
        clearTimeout(timeout4);
      };
    }
  }, [filters]); // Abhängig von filters, damit es bei jeder Filter-Änderung ausgeführt wird

  const getFilteredOptions = (dimension: string) => {
    const options = availableOptions[dimension] || [];
    const searchTerm = searchTerms[dimension] || '';
    
    if (!searchTerm) return options;
    
    return options.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getTotalActiveFilters = () => {
    let total = 0;
    
    // Zähle Array-Filter
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== 'dateRange' && Array.isArray(value)) {
        total += value.length;
      }
    });
    
    // Zähle dateRange-Filter
    if (filters.dateRange.start || filters.dateRange.end) {
      total += 1;
    }
    
    return total;
  };

  // Prüfe ob Filter verfügbar sind
  const hasAnyData = FILTER_DIMENSIONS.some(dimension => 
    availableOptions[dimension.key]?.length > 0
  );

  if (!hasAnyData) {
    return (
      <div className="bg-gray-800 dark:bg-gray-900 rounded-booking-lg shadow-booking border border-gray-700 dark:border-gray-600 p-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-700 dark:bg-gray-600 rounded-booking flex items-center justify-center mx-auto mb-4">
            <Filter className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-100 dark:text-gray-100 mb-2">
            Keine Filter verfügbar
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-400">
            Die Excel-Datei enthält keine erkennbaren Dimensionen-Spalten (Network, Region, City, Site, Screen IDs).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 dark:bg-gray-900 rounded-booking-lg shadow-booking border border-gray-700 dark:border-gray-600">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-700 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-stroer-500 rounded-booking flex items-center justify-center">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-100 dark:text-gray-100">
                Datenfilter
              </h3>
              {getTotalActiveFilters() > 0 && (
                <span className="badge badge-info mt-1">
                  {getTotalActiveFilters()} aktiv
                </span>
              )}
            </div>
          </div>
          {getTotalActiveFilters() > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-400 dark:text-red-400 hover:text-red-300 dark:hover:text-red-300 font-medium hover:bg-red-900/20 px-3 py-1 rounded-booking transition-colors"
            >
              Alle löschen
            </button>
          )}
        </div>
      </div>

      {/* Filter Sections */}
      <div className="p-6 space-y-4">
        {FILTER_DIMENSIONS.map((dimension) => {
          const options = availableOptions[dimension.key] || [];
          const filteredOptions = getFilteredOptions(dimension.key);
          const isExpanded = expandedSections.has(dimension.key);

          // Spezielle Behandlung für dateRange-Filter
          if (dimension.key === 'dateRange') {
            const isDateFilterActive = filters.dateRange.start || filters.dateRange.end;
            
            return (
              <div key={dimension.key} className="border border-gray-700 dark:border-gray-600 rounded-booking-lg overflow-hidden">
                {/* Section Header */}
                <div
                  onClick={() => toggleSection(dimension.key)}
                  className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <span className="text-lg sm:text-xl flex-shrink-0">{dimension.icon}</span>
                    <div className="text-left min-w-0 flex-1">
                      <span className="font-semibold text-gray-100 dark:text-gray-100 text-sm sm:text-base text-ellipsis block">
                        {dimension.label}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 text-ellipsis">
                          Datumsbereich
                        </span>
                        {isDateFilterActive && (
                          <span className="badge badge-success flex-shrink-0">
                            1
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isDateFilterActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFilter(dimension.key);
                        }}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-booking transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Section Content */}
                {isExpanded && (
                  <div className="border-t border-gray-700 dark:border-gray-600 p-4 bg-gray-700/50 dark:bg-gray-800/50">
                    <div className="space-y-4">
                      {/* Start Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-2">
                          Startdatum
                        </label>
                        <input
                          type="date"
                          value={filters.dateRange.start}
                          onChange={(e) => {
                            // Speichere Scroll-Position vor Filter-Änderung
                            scrollPositionRef.current = window.scrollY;
                            shouldRestoreScrollRef.current = true;
                            
                            onFiltersChange({
                              ...filters,
                              dateRange: {
                                ...filters.dateRange,
                                start: e.target.value
                              }
                            });
                          }}
                          className="input-field w-full"
                        />
                    </div>

                    {/* End Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-2">
                          Enddatum
                        </label>
                        <input
                          type="date"
                          value={filters.dateRange.end}
                          onChange={(e) => {
                            // Speichere Scroll-Position vor Filter-Änderung
                            scrollPositionRef.current = window.scrollY;
                            shouldRestoreScrollRef.current = true;
                            
                            onFiltersChange({
                              ...filters,
                              dateRange: {
                                ...filters.dateRange,
                                end: e.target.value
                              }
                            });
                          }}
                          className="input-field w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // Normale Behandlung für Array-Filter
          const activeFilters = filters[dimension.key as keyof typeof filters] as string[];
          if (options.length === 0) return null;

        // Normale Behandlung für Array-Filter
        return (
          <div key={dimension.key} className="border border-gray-700 dark:border-gray-600 rounded-booking-lg overflow-hidden">
            {/* Section Header */}
            <div
              onClick={() => toggleSection(dimension.key)}
              className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <span className="text-lg sm:text-xl flex-shrink-0">{dimension.icon}</span>
                <div className="text-left min-w-0 flex-1">
                  <span className="font-semibold text-gray-100 dark:text-gray-100 text-sm sm:text-base text-ellipsis block">
                    {dimension.label}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-400 text-ellipsis">
                      {options.length} Optionen
                    </span>
                    {activeFilters.length > 0 && (
                      <span className="badge badge-success flex-shrink-0">
                        {activeFilters.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {activeFilters.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFilter(dimension.key);
                    }}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-booking transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Section Content */}
            {isExpanded && (
              <div className="border-t border-gray-700 dark:border-gray-600 p-4 bg-gray-700/50 dark:bg-gray-800/50">
                {/* Search */}
                {options.length > 10 && (
                  <div className="mb-4 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`${dimension.label} suchen...`}
                      value={searchTerms[dimension.key] || ''}
                      onChange={(e) => updateSearchTerm(dimension.key, e.target.value)}
                      className="input-field pl-10 py-2 text-sm"
                    />
                  </div>
                )}

                {/* Options */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredOptions.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-600 dark:hover:bg-gray-700 p-3 rounded-booking transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={activeFilters.includes(option)}
                        onChange={() => toggleFilter(dimension.key, option)}
                        className="h-4 w-4 text-stroer-500 focus:ring-stroer-500 border-gray-600 rounded"
                      />
                      <span className="text-sm text-gray-300 dark:text-gray-300 truncate">
                        {option}
                      </span>
                    </label>
                  ))}
                </div>

                {filteredOptions.length === 0 && searchTerms[dimension.key] && (
                  <p className="text-sm text-gray-400 dark:text-gray-400 text-center py-4">
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
});

export default AnalyticsFilters;
