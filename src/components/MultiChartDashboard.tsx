'use client';

import React, { useMemo, useState } from 'react';
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
  { key: 'cost', label: 'Außenumsatz', color: '#FF6B00', icon: '💰', unit: '€', type: 'absolute', showTotal: true },
  { key: 'total_impressions', label: 'Impressions', color: '#003366', icon: '👁️', unit: '', type: 'absolute', showTotal: true },
  { key: 'plays', label: 'Plays', color: '#00a699', icon: '▶️', unit: '', type: 'absolute', showTotal: true },
  { key: 'auction_wins', label: 'Scheduled Plays', color: '#ffb020', icon: '🏆', unit: '', type: 'absolute', showTotal: true },
  { key: 'ad_requests', label: 'Ad Requests', color: '#8b5cf6', icon: '📊', unit: '', type: 'absolute', showTotal: true },
  { key: 'coverage', label: 'Coverage', color: '#06b6d4', icon: '🎯', unit: '%', type: 'percentage', showTotal: false },
  { key: 'play_rate', label: 'Play Rate', color: '#84cc16', icon: '📈', unit: '%', type: 'percentage', showTotal: false }
];

const CHART_TYPES = [
  { key: 'line', label: 'Linie', icon: TrendingUp },
  { key: 'bar', label: 'Balken', icon: BarChart3 }
];

const DEFAULT_METRICS = ['cost'];

export default function MultiChartDashboard({ data, filters, columnMapping, selectedMapMetric, onMapMetricChange }: MultiChartDashboardProps) {
  const [chartMetrics, setChartMetrics] = useState(DEFAULT_METRICS);
  const [chartTypes, setChartTypes] = useState(['line']);

  // Synchronisiere mit der Karte wenn sich selectedMapMetric ändert
  React.useEffect(() => {
    if (selectedMapMetric && selectedMapMetric !== chartMetrics[0]) {
      const newMetrics = [...chartMetrics];
      newMetrics[0] = selectedMapMetric;
      setChartMetrics(newMetrics);
    }
  }, [selectedMapMetric]);

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

  // Filtere und aggregiere Daten
  const chartData = useMemo(() => {
    if (!rows || rows.length === 0 || columnIndices.date === -1) return [];

    // Filtere Zeilen basierend auf den aktiven Filtern
    const filteredRows = rows.filter(row => {
      for (const [filterKey, filterValues] of Object.entries(filters)) {
        if (filterValues.length === 0) continue;
        
        const columnIndex = columnIndices[filterKey as keyof typeof columnIndices];
        if (columnIndex === -1) continue;
        
        const rowValue = row[columnIndex]?.toString() || '';
        if (!filterValues.includes(rowValue)) {
          return false;
        }
      }
      return true;
    });

    if (filteredRows.length === 0) return [];

    // Gruppiere nach Datum
    const groupedByDate = new Map<string, any>();

    filteredRows.forEach(row => {
      const dateIndex = columnIndices.date;
      let dateValue = row[dateIndex];
      if (!dateValue) return;

      // Konvertiere verschiedene Datumsformate
      let parsedDate: Date | null = null;
      
      if (typeof dateValue === 'string') {
        // Versuche verschiedene Datumsformate
        try {
          // ISO Format
          if (dateValue.includes('-')) {
            parsedDate = parseISO(dateValue);
          }
          // Deutsches Format (DD.MM.YYYY)
          else if (dateValue.includes('.')) {
            const [day, month, year] = dateValue.split('.');
            parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
          // Andere Formate
          else {
            parsedDate = new Date(dateValue);
          }
        } catch {
          // Fallback
          parsedDate = new Date(dateValue);
        }
      } else if (typeof dateValue === 'number') {
        // Excel Datum
        parsedDate = new Date((dateValue - 25569) * 86400 * 1000);
      } else if (dateValue instanceof Date) {
        parsedDate = dateValue;
      }

      if (!parsedDate || !isValid(parsedDate)) return;

      const dateKey = format(parsedDate, 'yyyy-MM-dd');
      
      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, {
          date: dateKey,
          displayDate: format(parsedDate, 'dd.MM', { locale: de }),
          cost: 0,
          total_impressions: 0,
          plays: 0,
          auction_wins: 0,
          ad_requests: 0
        });
      }

      const group = groupedByDate.get(dateKey);
      
      // Summiere Metriken
      if (columnIndices.cost !== -1) {
        group.cost += parseFloat(row[columnIndices.cost]) || 0;
      }
      if (columnIndices.total_impressions !== -1) {
        group.total_impressions += parseFloat(row[columnIndices.total_impressions]) || 0;
      }
      if (columnIndices.plays !== -1) {
        group.plays += parseFloat(row[columnIndices.plays]) || 0;
      }
      if (columnIndices.auction_wins !== -1) {
        group.auction_wins += parseFloat(row[columnIndices.auction_wins]) || 0;
      }
      if (columnIndices.ad_requests !== -1) {
        group.ad_requests += parseFloat(row[columnIndices.ad_requests]) || 0;
      }
    });

    // Berechne abgeleitete Metriken
    const result = Array.from(groupedByDate.values()).map(group => ({
      ...group,
      coverage: group.ad_requests > 0 ? (group.plays / group.ad_requests) * 100 : 0,
      play_rate: group.auction_wins > 0 ? (group.plays / group.auction_wins) * 100 : 0
    }));

    // Sortiere nach Datum
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [rows, filters, columnIndices]);

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
    const newMetrics = [...chartMetrics];
    newMetrics[chartIndex] = metricKey;
    setChartMetrics(newMetrics);
    
    // Synchronisiere mit der Karte
    if (onMapMetricChange && chartIndex === 0) {
      onMapMetricChange(metricKey);
    }
  };

  const updateChartType = (chartIndex: number, chartType: string) => {
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {METRICS.map((metric) => (
                        <button
                          key={metric.key}
                          onClick={() => updateChartMetric(chartIndex, metric.key)}
                          className={`
                            flex items-center gap-3 px-4 py-3 rounded-booking text-sm font-medium transition-all duration-200
                            ${selectedMetric === metric.key
                              ? 'bg-stroer-500 text-white shadow-booking'
                              : 'bg-gray-700 dark:bg-gray-600 text-gray-300 dark:text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-500'
                            }
                          `}
                        >
                          <span className="text-lg">{metric.icon}</span>
                          <span className="truncate">{metric.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="p-6">
                <div className="h-96">
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
                            return `${value.toFixed(0)}%`;
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
                        <p className="text-sm text-gray-400 dark:text-gray-400 mb-1">Gesamt</p>
                        <p className="text-xl font-bold text-gray-100 dark:text-gray-100">
                          {formatValue(
                            chartData.reduce((sum, item) => sum + item[selectedMetric], 0),
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
                      <p className="text-sm text-gray-400 dark:text-gray-400 mb-1">Durchschnitt</p>
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
