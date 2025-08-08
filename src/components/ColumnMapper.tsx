'use client';

import React, { useState, useMemo } from 'react';
import { Settings, ChevronDown, ChevronUp, MapPin, RefreshCw } from 'lucide-react';

interface ColumnMapperProps {
  data: any[][];
  onMappingChange: (mapping: {
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
  }) => void;
}

const COLUMN_MAPPINGS = [
  // Metriken
  { key: 'date', label: 'Datum', category: 'Zeit', icon: '📅', required: true },
  { key: 'cost', label: 'Kosten', category: 'Metriken', icon: '💰', required: false },
  { key: 'total_impressions', label: 'Total Impressions', category: 'Metriken', icon: '👁️', required: false },
  { key: 'plays', label: 'Plays', category: 'Metriken', icon: '▶️', required: false },
  { key: 'auction_wins', label: 'Auction Wins', category: 'Metriken', icon: '🏆', required: false },
  { key: 'ad_requests', label: 'Ad Requests', category: 'Metriken', icon: '📊', required: false },
  
  // Dimensionen
  { key: 'network', label: 'Network', category: 'Dimensionen', icon: '🌐', required: false },
  { key: 'region', label: 'Bundesland', category: 'Dimensionen', icon: '🗺️', required: false },
  { key: 'city', label: 'Stadt', category: 'Dimensionen', icon: '🏙️', required: false },
  { key: 'site', label: 'Site', category: 'Dimensionen', icon: '📍', required: false },
  { key: 'screenIds', label: 'Screen IDs', category: 'Dimensionen', icon: '📺', required: false },
  { key: 'auctionType', label: 'Auction Type', category: 'Dimensionen', icon: '🎯', required: false }
];

const SEARCH_TERMS = {
  date: ['date', 'datum', 'time', 'zeit', 'tag', 'day', 'timestamp', 'created', 'erstellt'],
  cost: ['cost', 'kosten', 'price', 'preis', 'spend', 'ausgaben', 'amount', 'betrag', 'revenue', 'umsatz'],
  total_impressions: ['impression', 'impressions', 'views', 'aufrufe', 'total', 'gesamt', 'imp', 'impressions_total'],
  plays: ['plays', 'play', 'wiedergabe', 'playback', 'video', 'completion', 'played', 'abgespielt'],
  auction_wins: ['auction_win', 'auction_wins', 'wins', 'auktion_gewinn', 'gewinn', 'bid_wins', 'win', 'auction_won'],
  ad_requests: ['request', 'requests', 'anfrage', 'anfragen', 'ad_request', 'adrequest', 'req', 'ad_req'],
  network: ['network', 'netzwerk', 'partner', 'supply', 'publisher', 'ssp', 'dsp', 'platform'],
  region: ['region', 'country', 'land', 'location', 'geo', 'geography', 'territory', 'gebiet'],
  city: ['city', 'stadt', 'ort', 'place', 'location', 'standort', 'location_city'],
  site: ['site', 'website', 'domain', 'app', 'property', 'publisher', 'inventory', 'inventar'],
  screenIds: ['screen', 'id', 'placement', 'unit', 'zone', 'slot', 'screen_id', 'placement_id', 'ad_unit'],
  auctionType: ['auction_type', 'auctiontype', 'auction type', 'auction-type', 'bidding_type', 'programmatic_type', 'type_auction', 'auction_method', 'type auction', 'bid_type', 'kampagnentyp', 'campaign_type', 'auction', 'bidding', 'type']
};

const ColumnMapper = React.memo(({ data, onMappingChange }: ColumnMapperProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [manualMapping, setManualMapping] = useState<{ [key: string]: number }>({});

  const headers = data[0] || [];

  // Automatische Erkennung mit Konflikt-Vermeidung
  const autoMapping = useMemo(() => {
    const mapping: { [key: string]: number } = {};
    const usedIndices = new Set<number>();

    // Sortiere Spalten nach Priorität: spezifischere zuerst
    const sortedColumns = [...COLUMN_MAPPINGS].sort((a, b) => {
      const aTerms = SEARCH_TERMS[a.key as keyof typeof SEARCH_TERMS] || [];
      const bTerms = SEARCH_TERMS[b.key as keyof typeof SEARCH_TERMS] || [];
      
      // Priorisiere Spalten mit spezifischeren Suchbegriffen (längere Begriffe zuerst)
      const aMaxLength = Math.max(...aTerms.map(term => term.length));
      const bMaxLength = Math.max(...bTerms.map(term => term.length));
      
      return bMaxLength - aMaxLength;
    });

    sortedColumns.forEach(column => {
      const searchTerms = SEARCH_TERMS[column.key as keyof typeof SEARCH_TERMS] || [];
      
      const foundIndex = headers.findIndex((header: string, index: number) => {
        if (!header || usedIndices.has(index)) return false;
        const headerLower = header.toLowerCase().trim();
        const headerNormalized = headerLower.replace(/[_\s-]/g, '');
        
        // Bevorzuge exakte Matches
        if (searchTerms.some(term => {
          const termLower = term.toLowerCase();
          const termNormalized = termLower.replace(/[_\s-]/g, '');
          return headerLower === termLower || headerNormalized === termNormalized;
        })) {
          return true;
        }
        
        // Dann partielle Matches mit Gewichtung
        const matchScores = searchTerms.map(term => {
          const termLower = term.toLowerCase();
          const termNormalized = termLower.replace(/[_\s-]/g, '');
          
          // Exakte Teilstring-Matches
          if (headerLower.includes(termLower) || headerNormalized.includes(termNormalized)) {
            return termLower.length; // Längere Matches bekommen höhere Priorität
          }
          
          // Wort-Grenzen-Matches (für bessere Präzision)
          const words = headerLower.split(/[_\s-]/);
          if (words.some(word => word === termLower)) {
            return termLower.length + 2; // Bonus für Wort-Grenzen-Matches
          }
          
          return 0;
        });
        
        const maxScore = Math.max(...matchScores);
        return maxScore > 0;
      });

      if (foundIndex !== -1) {
        mapping[column.key] = foundIndex;
        usedIndices.add(foundIndex);
      } else {
        mapping[column.key] = -1;
      }
    });

    return mapping;
  }, [headers]);

  // Kombiniere automatische und manuelle Zuordnung
  const finalMapping = useMemo(() => {
    const combined = { ...autoMapping };
    
    // Überschreibe mit manuellen Zuordnungen
    Object.entries(manualMapping).forEach(([key, value]) => {
      if (value !== -1) {
        combined[key] = value;
      }
    });

    return combined;
  }, [autoMapping, manualMapping]);

  // Benachrichtige Parent-Komponente über Änderungen
  React.useEffect(() => {
    onMappingChange(finalMapping as any);
  }, [finalMapping, onMappingChange]);

  const handleManualMapping = (columnKey: string, headerIndex: number) => {
    setManualMapping(prev => ({
      ...prev,
      [columnKey]: headerIndex
    }));
  };

  const resetAllMappings = () => {
    setManualMapping({});
  };

  const getColumnPreview = (columnIndex: number) => {
    if (columnIndex === -1 || !data[1]) return 'Nicht zugeordnet';
    const sampleValues = data.slice(1, 4).map(row => row[columnIndex]).filter(Boolean);
    return sampleValues.length > 0 ? sampleValues.join(', ') + '...' : 'Leer';
  };

  const getDetectionStatus = (columnKey: string) => {
    const autoIndex = autoMapping[columnKey];
    const manualIndex = manualMapping[columnKey];
    
    if (manualIndex !== undefined && manualIndex !== -1) {
      return { type: 'manual', index: manualIndex };
    } else if (autoIndex !== -1) {
      return { type: 'auto', index: autoIndex };
    } else {
      return { type: 'none', index: -1 };
    }
  };

  const getDetectionQuality = (columnKey: string, headerIndex: number) => {
    if (headerIndex === -1) return null;
    
    const header = headers[headerIndex];
    if (!header) return null;
    
    const searchTerms = SEARCH_TERMS[columnKey as keyof typeof SEARCH_TERMS] || [];
    const headerLower = header.toLowerCase().trim();
    const headerNormalized = headerLower.replace(/[_\s-]/g, '');
    
    // Prüfe auf exakte Matches
    const exactMatch = searchTerms.some(term => {
      const termLower = term.toLowerCase();
      const termNormalized = termLower.replace(/[_\s-]/g, '');
      return headerLower === termLower || headerNormalized === termNormalized;
    });
    
    if (exactMatch) return 'exact';
    
    // Prüfe auf Wort-Grenzen-Matches
    const words = headerLower.split(/[_\s-]/);
    const wordMatch = searchTerms.some(term => {
      const termLower = term.toLowerCase();
      return words.some((word: string) => word === termLower);
    });
    
    if (wordMatch) return 'word';
    
    // Prüfe auf partielle Matches
    const partialMatch = searchTerms.some(term => {
      const termLower = term.toLowerCase();
      const termNormalized = termLower.replace(/[_\s-]/g, '');
      return headerLower.includes(termLower) || headerNormalized.includes(termNormalized);
    });
    
    if (partialMatch) return 'partial';
    
    return 'manual';
  };

  const categorizedMappings = COLUMN_MAPPINGS.reduce((acc, mapping) => {
    if (!acc[mapping.category]) acc[mapping.category] = [];
    acc[mapping.category].push(mapping);
    return acc;
  }, {} as { [key: string]: typeof COLUMN_MAPPINGS });

  const mappedCount = Object.values(finalMapping).filter(index => index !== -1).length;
  const requiredMapped = COLUMN_MAPPINGS.filter(col => col.required && finalMapping[col.key] !== -1).length;
  const requiredTotal = COLUMN_MAPPINGS.filter(col => col.required).length;

  return (
    <div className="bg-gray-800 dark:bg-gray-900 rounded-booking-lg shadow-booking border border-gray-700 dark:border-gray-600">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors rounded-booking-lg"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-stroer-500 rounded-booking flex items-center justify-center">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-100 dark:text-gray-100">
              Spalten-Konfiguration
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-400">
              {mappedCount} von {COLUMN_MAPPINGS.length} Spalten zugeordnet
              {requiredTotal > 0 && ` • ${requiredMapped}/${requiredTotal} erforderlich`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {mappedCount > 0 && (
            <span className="badge badge-success">
              {mappedCount} erkannt
            </span>
          )}
          <span className="text-sm text-gray-400 dark:text-gray-400 font-medium">
            {isExpanded ? 'Einklappen' : 'Konfigurieren'}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-700 dark:border-gray-600 p-6">
          <div className="bg-stroer-900/20 border border-stroer-700/50 rounded-booking-lg p-4 mb-6">
            <div className="flex items-start gap-4">
              <MapPin className="h-5 w-5 text-stroer-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-stroer-200 dark:text-stroer-200 mb-2">
                  Erweiterte Spalten-Konfiguration
                </h4>
                <p className="text-sm text-stroer-300 dark:text-stroer-300">
                  Falls Filter oder Diagramme nicht korrekt funktionieren, können Sie hier die automatische Spalten-Zuordnung 
                  manuell anpassen. Normalerweise ist keine Änderung erforderlich.
                </p>
              </div>
              <button
                onClick={resetAllMappings}
                className="btn-secondary py-2 px-4 text-sm flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>

          {/* Debug: Verfügbare Spalten */}
          <div className="mb-6 p-4 bg-gray-700 dark:bg-gray-800 rounded-booking-lg">
            <h4 className="text-sm font-semibold text-gray-100 dark:text-gray-100 mb-3">
              Verfügbare Spalten in Ihrer Excel-Datei:
            </h4>
            <div className="flex flex-wrap gap-2">
              {headers.map((header: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 rounded-booking text-xs font-medium bg-gray-600 dark:bg-gray-700 text-gray-200 dark:text-gray-200"
                >
                  {index}: {header || `Spalte ${index + 1}`}
                </span>
              ))}
            </div>
          </div>

          {/* Mapping Interface */}
          {Object.entries(categorizedMappings).map(([category, mappings]) => (
            <div key={category} className="mb-8">
              <h4 className="text-lg font-semibold text-gray-100 dark:text-gray-100 mb-4 border-b border-gray-700 dark:border-gray-600 pb-3">
                {category}
              </h4>
              
              <div className="space-y-4">
                {mappings.map((mapping) => {
                  const currentIndex = finalMapping[mapping.key];
                  const detectionStatus = getDetectionStatus(mapping.key);
                  const isManuallySet = manualMapping[mapping.key] !== undefined;
                  
                  return (
                    <div key={mapping.key} className="flex items-center gap-4 p-4 border border-gray-700 dark:border-gray-600 rounded-booking-lg hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <span className="text-2xl">{mapping.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-100 dark:text-gray-100">
                              {mapping.label}
                            </span>
                            {mapping.required && (
                              <span className="badge badge-error">
                                Erforderlich
                              </span>
                            )}
                            {detectionStatus.type === 'auto' && (
                              <span className="badge badge-success">
                                Auto
                              </span>
                            )}
                            {detectionStatus.type === 'manual' && (
                              <span className="badge badge-info">
                                Manuell
                              </span>
                            )}
                            {detectionStatus.type === 'none' && (
                              <span className="badge badge-warning">
                                Nicht erkannt
                              </span>
                            )}
                          </div>
                          {currentIndex !== -1 && (
                            <p className="text-xs text-gray-400 dark:text-gray-400 truncate">
                              Beispiel: {getColumnPreview(currentIndex)}
                            </p>
                          )}
                          {detectionStatus.type === 'auto' && currentIndex !== -1 && (
                            <p className="text-xs text-green-400 dark:text-green-400 mt-1">
                              Automatisch erkannt: "{headers[currentIndex]}"
                              {(() => {
                                const quality = getDetectionQuality(mapping.key, currentIndex);
                                if (quality === 'exact') return ' (Exakte Übereinstimmung)';
                                if (quality === 'word') return ' (Wort-Match)';
                                if (quality === 'partial') return ' (Partielle Übereinstimmung)';
                                return '';
                              })()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <select
                          value={currentIndex}
                          onChange={(e) => handleManualMapping(mapping.key, parseInt(e.target.value))}
                          className="input-field py-2 px-3 text-sm min-w-[200px]"
                        >
                          <option value={-1}>Nicht zugeordnet</option>
                          {headers.map((header: string, index: number) => (
                            <option key={index} value={index}>
                              {index}: {header || `Spalte ${index + 1}`}
                            </option>
                          ))}
                        </select>
                        
                        <div className={`w-4 h-4 rounded-full ${
                          currentIndex !== -1 
                            ? detectionStatus.type === 'auto'
                              ? 'bg-green-500'
                              : 'bg-stroer-500'
                            : mapping.required 
                            ? 'bg-red-500' 
                            : 'bg-gray-600 dark:bg-gray-500'
                        }`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default ColumnMapper;
