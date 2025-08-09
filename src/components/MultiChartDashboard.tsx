'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { format, parseISO, isValid } from 'date-fns';
import { de } from 'date-fns/locale';
import { TrendingUp, BarChart3, Calendar, BarChart4 } from 'lucide-react';


interface MultiChartDashboardProps {
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
  selectedMapMetric?: string;
  onMapMetricChange?: (metric: string) => void;
}

const METRICS = [
  { key: 'cost', label: 'Außenumsatz', color: '#FF6B00', unit: '€', type: 'absolute', showTotal: true },
  { key: 'total_impressions', label: 'Impressions', color: '#FF6B00', unit: '', type: 'absolute', showTotal: true },
  { key: 'plays', label: 'Plays', color: '#FF6B00', unit: '', type: 'absolute', showTotal: true },
  { key: 'auction_wins', label: 'Scheduled Plays', color: '#FF6B00', unit: '', type: 'absolute', showTotal: true },
  { key: 'ad_requests', label: 'Ad Requests', color: '#FF6B00', unit: '', type: 'absolute', showTotal: true },
  { key: 'coverage', label: 'Coverage', color: '#FF6B00', unit: '%', type: 'percentage', showTotal: false },
  { key: 'play_rate', label: 'Play Rate', color: '#FF6B00', unit: '%', type: 'percentage', showTotal: false }
];

const CHART_TYPES = [
  { key: 'line', label: 'Linie', icon: TrendingUp },
  { key: 'bar', label: 'Balken', icon: BarChart3 }
];

const DEFAULT_METRICS = ['cost'];

export default function MultiChartDashboard({ data, filters, columnMapping, selectedMapMetric, onMapMetricChange }: MultiChartDashboardProps) {
  const [chartMetrics, setChartMetrics] = useState(DEFAULT_METRICS);
  const [chartTypes, setChartTypes] = useState(['line']);
  const scrollPositionRef = useRef<number>(0);
  const shouldRestoreScrollRef = useRef<boolean>(false);

  // Synchronisiere mit der Karte wenn sich selectedMapMetric ändert
  React.useEffect(() => {
    if (selectedMapMetric && selectedMapMetric !== chartMetrics[0]) {
      const newMetrics = [...chartMetrics];
      newMetrics[0] = selectedMapMetric;
      setChartMetrics(newMetrics);
    }
  }, [selectedMapMetric]);

  // useEffect für Scroll-Position-Restoration nach Chart-Änderungen
  useEffect(() => {
    if (shouldRestoreScrollRef.current) {
      const restoreScroll = () => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'instant'
        });
        shouldRestoreScrollRef.current = false;
      };

      restoreScroll();
      const timeout1 = setTimeout(restoreScroll, 10);
      const timeout2 = setTimeout(restoreScroll, 50);
      const timeout3 = setTimeout(restoreScroll, 100);

      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
      };
    }
  }, [chartMetrics, chartTypes]);

  // Verwende die übergebene Spalten-Zuordnung
  const headers = data[0] || [];
  const rows = data.slice(1);

  const columnIndices = useMemo(() => {
    return {
      date: columnMapping.date,
      cost: columnMapping.cost,
      total_impressions: columnMapping.total_impressions,
      plays: columnMapping.plays,
      auction_wins: columnMapping.auction_wins,
      ad_requests: columnMapping.ad_requests,
      network: columnMapping.network,
      region: columnMapping.region,
      city: columnMapping.city,
      site: columnMapping.site,
      screen_ids: columnMapping.screenIds,
      auction_type: columnMapping.auctionType
    };
  }, [columnMapping]);

  // Filtere alle Daten basierend auf den aktiven Filtern
  const filteredRows = useMemo(() => {
    if (!rows || rows.length === 0) return [];

    return rows.filter(row => {
      // Prüfe nur Filter, die tatsächlich Werte haben (nicht leer sind)
      if (filters.network && filters.network.length > 0) {
        const columnIndex = columnIndices.network;
        if (columnIndex !== -1) {
          const rowValue = row[columnIndex]?.toString() || '';
          if (!filters.network.includes(rowValue)) return false;
        }
      }
      
      if (filters.region && filters.region.length > 0) {
        const columnIndex = columnIndices.region;
        if (columnIndex !== -1) {
          const rowValue = row[columnIndex]?.toString() || '';
          if (!filters.region.includes(rowValue)) return false;
        }
      }
      
      if (filters.city && filters.city.length > 0) {
        const columnIndex = columnIndices.city;
        if (columnIndex !== -1) {
          const rowValue = row[columnIndex]?.toString() || '';
          if (!filters.city.includes(rowValue)) return false;
        }
      }
      
      if (filters.site && filters.site.length > 0) {
        const columnIndex = columnIndices.site;
        if (columnIndex !== -1) {
          const rowValue = row[columnIndex]?.toString() || '';
          if (!filters.site.includes(rowValue)) return false;
        }
      }
      
      if (filters.screenIds && filters.screenIds.length > 0) {
        const columnIndex = columnIndices.screen_ids;
        if (columnIndex !== -1) {
          const rowValue = row[columnIndex]?.toString() || '';
          if (!filters.screenIds.includes(rowValue)) return false;
        }
      }
      
      if (filters.auctionType && filters.auctionType.length > 0) {
        const columnIndex = columnIndices.auction_type;
        if (columnIndex !== -1) {
          const rowValue = row[columnIndex]?.toString() || '';
          if (!filters.auctionType.includes(rowValue)) return false;
        }
      }
      
      // Datumsfilter
      if (filters.dateRange.start || filters.dateRange.end) {
        const columnIndex = columnIndices.date;
        if (columnIndex !== -1) {
          const rowDateValue = row[columnIndex];
          if (!rowDateValue) return false;
          
          try {
            // Parse das Datum aus der Zeile
            let rowDate: Date;
            const dateStr = rowDateValue.toString();
            
            // Format: "8/1/25" -> "2025-08-01"
            if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2}$/)) {
              const [month, day, year] = dateStr.split('/');
              rowDate = new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day));
            }
            // Format: "8/1/2025" -> "2025-08-01"
            else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
              const [month, day, year] = dateStr.split('/');
              rowDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
            // Standard Date-Konstruktor
            else {
              rowDate = new Date(rowDateValue);
            }
            
            // Prüfe Startdatum (inklusiv)
            if (filters.dateRange.start) {
              const startDate = new Date(filters.dateRange.start);
              startDate.setHours(0, 0, 0, 0); // Setze auf Mitternacht
              if (rowDate < startDate) return false;
            }
            
            // Prüfe Enddatum (inklusiv)
            if (filters.dateRange.end) {
              const endDate = new Date(filters.dateRange.end);
              endDate.setHours(23, 59, 59, 999); // Setze auf Ende des Tages
              if (rowDate > endDate) return false;
            }
          } catch {
            // Bei Fehlern beim Parsen des Datums, Zeile ausschließen
            return false;
          }
        }
      }
      
      return true;
    });
  }, [rows, columnIndices, filters]);

  // Berechne Gesamtwerte aus allen gefilterten Daten - OPTIMIERT für große Datasets
  const totalValues = useMemo(() => {
    if (filteredRows.length === 0) return {};

    const totals: any = {};
    const currentMetric = chartMetrics[0] || 'cost';
    const columnIndex = columnIndices[currentMetric as keyof typeof columnIndices];
    
    if (columnIndex === -1) return totals;

    // Effiziente Berechnung: Verarbeite alle Daten in Chunks
    let sum = 0;
    const chunkSize = 10000; // Verarbeite in 10.000er Chunks
    
    for (let i = 0; i < filteredRows.length; i += chunkSize) {
      const chunk = filteredRows.slice(i, i + chunkSize);
      
      chunk.forEach(row => {
        if (row[columnIndex]) {
          sum += parseFloat(row[columnIndex]) || 0;
        }
      });
      
      // Bei sehr großen Datasets: Zeige Fortschritt (optional)
      if (filteredRows.length > 100000 && i % 50000 === 0) {
        // Hier könnte man einen Progress-Indikator anzeigen
      }
    }
    
    totals[currentMetric] = sum;
    return totals;
  }, [filteredRows, columnIndices, chartMetrics]);

  // Filtere und aggregiere Daten für das Chart - optimiert für Performance
  const chartData = useMemo(() => {
    if (filteredRows.length === 0 || columnIndices.date === -1) return [];

    // Verarbeite alle gefilterten Zeilen für korrekte Diagramm-Daten

    if (filteredRows.length === 0) return [];

    // Gruppiere nach Datum - optimiert
    const groupedByDate = new Map<string, any>();
    
    filteredRows.forEach(row => {
      const dateValue = row[columnIndices.date];
      if (!dateValue) return;
      
      let dateKey = '';
      try {
        // Versuche verschiedene Datumsformate
        let date: Date;
        
        // Prüfe ob es bereits ein Date-Objekt ist
        if (dateValue instanceof Date) {
          date = dateValue;
        } else {
          // Versuche verschiedene Datumsformate zu parsen
          const dateStr = dateValue.toString();
          
          // Format: "8/1/25" -> "2025-08-01"
          if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2}$/)) {
            const [month, day, year] = dateStr.split('/');
            date = new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day));
          }
          // Format: "8/1/2025" -> "2025-08-01"
          else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            const [month, day, year] = dateStr.split('/');
            date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
          // Standard Date-Konstruktor
          else {
            date = new Date(dateValue);
          }
        }
        
        if (isValid(date)) {
          dateKey = format(date, 'yyyy-MM-dd');
        } else {
          // Fallback: verwende den ursprünglichen Wert
          dateKey = dateValue.toString();
        }
      } catch {
        dateKey = dateValue.toString();
      }
      
      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, {
          date: dateKey,
          cost: 0,
          total_impressions: 0,
          plays: 0,
          auction_wins: 0,
          ad_requests: 0,
          coverage: 0,
          play_rate: 0,
          count: 0
        });
      }
      
      const entry = groupedByDate.get(dateKey);
      entry.count++;
      
      // Summiere Metriken - optimiert
      if (columnIndices.cost !== -1 && row[columnIndices.cost]) {
        entry.cost += parseFloat(row[columnIndices.cost]) || 0;
      }
      if (columnIndices.total_impressions !== -1 && row[columnIndices.total_impressions]) {
        entry.total_impressions += parseFloat(row[columnIndices.total_impressions]) || 0;
      }
      if (columnIndices.plays !== -1 && row[columnIndices.plays]) {
        entry.plays += parseFloat(row[columnIndices.plays]) || 0;
      }
      if (columnIndices.auction_wins !== -1 && row[columnIndices.auction_wins]) {
        entry.auction_wins += parseFloat(row[columnIndices.auction_wins]) || 0;
      }
      if (columnIndices.ad_requests !== -1 && row[columnIndices.ad_requests]) {
        entry.ad_requests += parseFloat(row[columnIndices.ad_requests]) || 0;
      }
    });
    
    // Berechne abgeleitete Metriken und formatiere Datum für Anzeige
    groupedByDate.forEach(entry => {
      entry.coverage = entry.ad_requests > 0 ? (entry.plays / entry.ad_requests) * 100 : 0;
      entry.play_rate = entry.auction_wins > 0 ? (entry.plays / entry.auction_wins) * 100 : 0;
      
      // Formatiere Datum für die X-Achse
      try {
        const date = parseISO(entry.date);
        if (isValid(date)) {
          entry.displayDate = format(date, 'dd.MM.yy', { locale: de });
        } else {
          entry.displayDate = entry.date;
        }
      } catch {
        entry.displayDate = entry.date;
      }
    });
    
    return Array.from(groupedByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [rows, columnIndices, filters, chartMetrics]); // Füge chartMetrics hinzu



  const formatValue = (value: number, unit: string) => {
    if (unit === '€') {
      return new Intl.NumberFormat('de-DE', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    } else if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else {
      return new Intl.NumberFormat('de-DE').format(Math.round(value));
    }
  };

  const updateChartMetric = (chartIndex: number, metricKey: string) => {
    // Speichere Scroll-Position vor Metrik-Wechsel
    scrollPositionRef.current = window.scrollY;
    shouldRestoreScrollRef.current = true;
    
    const newMetrics = [...chartMetrics];
    newMetrics[chartIndex] = metricKey;
    setChartMetrics(newMetrics);
    
    // Synchronisiere mit der Karte
    if (onMapMetricChange && chartIndex === 0) {
      onMapMetricChange(metricKey);
    }
  };

  const updateChartType = (chartIndex: number, chartType: string) => {
    // Speichere Scroll-Position vor Chart-Type-Wechsel
    scrollPositionRef.current = window.scrollY;
    shouldRestoreScrollRef.current = true;
    
    const newTypes = [...chartTypes];
    newTypes[chartIndex] = chartType;
    setChartTypes(newTypes);
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-gray-800 dark:bg-gray-900 rounded-booking-lg shadow-booking border border-gray-700 dark:border-gray-600 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 dark:bg-gray-600 rounded-booking flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-100 dark:text-gray-100 mb-3">
            Keine Daten für Diagramme verfügbar
          </h3>
          <p className="text-gray-400 dark:text-gray-400">
            Stellen Sie sicher, dass Ihre Excel-Datei eine Datum-Spalte und Metriken-Spalten enthält.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Single Chart */}
      <div className="grid grid-cols-1 gap-6">
        {[0].map((chartIndex) => {
          const selectedMetric = chartMetrics[chartIndex];
          const selectedType = chartTypes[chartIndex];
          const metricInfo = METRICS.find(m => m.key === selectedMetric);
          const ChartComponent = selectedType === 'line' ? LineChart : BarChart;

          return (
            <div key={chartIndex} className="bg-gray-800 dark:bg-gray-900 rounded-booking-lg shadow-booking border border-gray-700 dark:border-gray-600">
              {/* Chart Controls */}
              <div className="p-6 border-b border-gray-700 dark:border-gray-600">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-stroer-500 rounded-booking flex items-center justify-center">
                        <BarChart4 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-100 dark:text-gray-100">
                          Datenanalyse
                        </h3>
                        <p className="text-sm text-gray-400 dark:text-gray-400">
                          Interaktive Visualisierung Ihrer Metriken
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {CHART_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.key}
                            onClick={() => updateChartType(chartIndex, type.key)}
                            className={`
                              p-3 rounded-booking transition-all duration-200
                              ${selectedType === type.key
                                ? 'bg-stroer-500 text-white shadow-booking'
                                : 'bg-gray-700 dark:bg-gray-600 text-gray-300 dark:text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-500'
                              }
                            `}
                          >
                            <Icon className="h-5 w-5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Metrik Auswahl */}
                  <div>
                    <label className="text-sm font-semibold text-gray-300 dark:text-gray-300 mb-3 block">
                      Metrik auswählen
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                      {METRICS.map((metric) => (
                        <button
                          key={metric.key}
                          onClick={() => updateChartMetric(chartIndex, metric.key)}
                          className={`
                            px-3 sm:px-4 py-2 sm:py-3 rounded-booking text-xs sm:text-sm font-medium transition-all duration-200 text-ellipsis
                            ${selectedMetric === metric.key
                              ? 'bg-stroer-500 text-white shadow-booking'
                              : 'bg-gray-700 dark:bg-gray-600 text-gray-300 dark:text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-500'
                            }
                          `}
                        >
                          <span className="truncate">{metric.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="p-4 sm:p-6">
                <div className="h-64 sm:h-72 lg:h-96 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <ChartComponent data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="displayDate"
                        stroke="#9ca3af"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        stroke="#9ca3af"
                        fontSize={12}
                        domain={metricInfo?.type === 'percentage' ? [0, 100] : [0, 'dataMax']}
                        tickFormatter={(value) => {
                          if (metricInfo?.unit === '€') {
                            return `€${(value / 1000).toFixed(0)}k`;
                          } else if (metricInfo?.unit === '%') {
                            return `${value.toFixed(1)}%`;
                          }
                          return `${(value / 1000).toFixed(0)}k`;
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                          padding: '12px',
                          color: '#f9fafb'
                        }}
                        formatter={(value: number) => [
                          formatValue(value, metricInfo?.unit || ''), 
                          metricInfo?.label
                        ]}
                        labelFormatter={(label) => `Datum: ${label}`}
                      />
                      {selectedType === 'line' ? (
                        <Line
                          type="monotone"
                          dataKey={selectedMetric}
                          stroke={metricInfo?.color}
                          strokeWidth={3}
                          dot={{ fill: metricInfo?.color, strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: metricInfo?.color, strokeWidth: 2 }}
                        />
                      ) : (
                        <Bar
                          dataKey={selectedMetric}
                          fill={metricInfo?.color}
                          radius={[4, 4, 0, 0] as [number, number, number, number]}
                        />
                      )}
                    </ChartComponent>
                  </ResponsiveContainer>
                </div>

                {/* Mini Stats */}
                {chartData.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    {metricInfo?.showTotal ? (
                      <div className="bg-gray-700 dark:bg-gray-600 rounded-booking-lg p-4">
                        <p className="text-sm text-gray-400 dark:text-gray-400 mb-1">Gesamt (Alle Daten)</p>
                        <p className="text-xl font-bold text-gray-100 dark:text-gray-100">
                          {formatValue(
                            totalValues[selectedMetric] || 0,
                            metricInfo?.unit || ''
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-700 dark:bg-gray-600 rounded-booking-lg p-4 opacity-50">
                        <p className="text-sm text-gray-400 dark:text-gray-400 mb-1">Gesamt</p>
                        <p className="text-xl font-bold text-gray-100 dark:text-gray-100">
                          N/A
                        </p>
                      </div>
                    )}
                    <div className="bg-gray-700 dark:bg-gray-600 rounded-booking-lg p-4">
                      <p className="text-sm text-gray-400 dark:text-gray-400 mb-1">Durchschnitt (Chart-Daten)</p>
                      <p className="text-xl font-bold text-gray-100 dark:text-gray-100">
                        {formatValue(
                          chartData.reduce((sum, item) => sum + item[selectedMetric], 0) / chartData.length,
                          metricInfo?.unit || ''
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
