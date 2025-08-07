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
import { TrendingUp, BarChart3, Calendar } from 'lucide-react';


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
  { key: 'cost', label: 'Außenumsatz', color: '#ef4444', icon: '💰', unit: '€', type: 'absolute', showTotal: true },
  { key: 'total_impressions', label: 'Impressions', color: '#3b82f6', icon: '👁️', unit: '', type: 'absolute', showTotal: true },
  { key: 'plays', label: 'Plays', color: '#10b981', icon: '▶️', unit: '', type: 'absolute', showTotal: true },
  { key: 'auction_wins', label: 'Scheduled Plays', color: '#f59e0b', icon: '🏆', unit: '', type: 'absolute', showTotal: true },
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
    if (columnIndices.date === -1) return [];

    // Filtere Daten basierend auf aktiven Filtern
    const filteredRows = rows.filter(row => {
      // Network Filter
      if (filters.network.length > 0 && columnIndices.network !== -1) {
        const networkValue = row[columnIndices.network]?.toString() || '';
        if (!filters.network.includes(networkValue)) return false;
      }

      // Region Filter
      if (filters.region.length > 0 && columnIndices.region !== -1) {
        const regionValue = row[columnIndices.region]?.toString() || '';
        if (!filters.region.includes(regionValue)) return false;
      }

      // City Filter
      if (filters.city.length > 0 && columnIndices.city !== -1) {
        const cityValue = row[columnIndices.city]?.toString() || '';
        if (!filters.city.includes(cityValue)) return false;
      }

      // Site Filter
      if (filters.site.length > 0 && columnIndices.site !== -1) {
        const siteValue = row[columnIndices.site]?.toString() || '';
        if (!filters.site.includes(siteValue)) return false;
      }

      // Screen IDs Filter
      if (filters.screenIds.length > 0 && columnIndices.screen_ids !== -1) {
        const screenValue = row[columnIndices.screen_ids]?.toString() || '';
        if (!filters.screenIds.includes(screenValue)) return false;
      }

      // Auction Type Filter
      if (filters.auctionType.length > 0 && columnIndices.auction_type !== -1) {
        const auctionValue = row[columnIndices.auction_type]?.toString() || '';
        if (!filters.auctionType.includes(auctionValue)) return false;
      }

      return true;
    });

    // Gruppiere nach Datum und aggregiere Metriken
    const dateGroups: { [key: string]: any } = {};

    filteredRows.forEach(row => {
      const dateValue = row[columnIndices.date];
      if (!dateValue) return;

      // Versuche verschiedene Datum-Formate zu parsen
      let parsedDate: Date | null = null;
      
      try {
        // ISO Format (2024-01-15)
        if (typeof dateValue === 'string' && dateValue.includes('-')) {
          parsedDate = parseISO(dateValue);
        }
        // Excel Datum (Zahl)
        else if (typeof dateValue === 'number') {
          // Excel Datum beginnt am 1. Januar 1900
          parsedDate = new Date((dateValue - 25569) * 86400 * 1000);
        }
        // String Datum
        else {
          parsedDate = new Date(dateValue);
        }
      } catch (e) {
        return;
      }

      if (!parsedDate || !isValid(parsedDate)) return;

      const dateKey = format(parsedDate, 'yyyy-MM-dd');

      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = {
          date: dateKey,
          displayDate: format(parsedDate, 'dd.MM.yyyy', { locale: de }),
          cost: 0,
          total_impressions: 0,
          plays: 0,
          auction_wins: 0,
          ad_requests: 0,
          count: 0
        };
      }

      // Addiere Basis-Metriken
      const baseMetrics = ['cost', 'total_impressions', 'plays', 'auction_wins', 'ad_requests'];
      baseMetrics.forEach(metric => {
        const index = columnIndices[metric as keyof typeof columnIndices];
        if (index !== -1) {
          const value = parseFloat(row[index]) || 0;
          dateGroups[dateKey][metric] += value;
        }
      });

      dateGroups[dateKey].count++;
    });

    // Konvertiere zu Array, sortiere nach Datum und berechne abgeleitete Metriken
    return Object.values(dateGroups)
      .map(item => ({
        ...item,
        // Berechnete Metriken
        play_rate: item.auction_wins > 0 ? (item.plays / item.auction_wins) * 100 : 0,
        coverage: item.ad_requests > 0 ? (item.plays / item.ad_requests) * 100 : 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [rows, columnIndices, filters]);

  const formatValue = (value: number, unit: string) => {
    if (unit === '€') {
      return `€${value.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`;
    } else if (unit === '%') {
      return `${value.toFixed(2)}%`;
    }
    return value.toLocaleString('de-DE');
  };

  const updateChartMetric = (chartIndex: number, metricKey: string) => {
    const newMetrics = [...chartMetrics];
    newMetrics[chartIndex] = metricKey;
    setChartMetrics(newMetrics);
    
    // Synchronisiere mit der Karte wenn es die erste Metrik ist
    if (chartIndex === 0 && onMapMetricChange) {
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Keine Daten für Diagramme verfügbar
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
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
            <div key={chartIndex} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              {/* Chart Controls */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-6"></div>
                    <div className="flex gap-1">
                      {CHART_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.key}
                            onClick={() => updateChartType(chartIndex, type.key)}
                            className={`
                              p-2 rounded transition-all
                              ${selectedType === type.key
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }
                            `}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Metrik Auswahl */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                      Metrik
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      {METRICS.map((metric) => (
                        <button
                          key={metric.key}
                          onClick={() => updateChartMetric(chartIndex, metric.key)}
                          className={`
                            flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium transition-all
                            ${selectedMetric === metric.key
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                              : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }
                          `}
                        >
                          <span>{metric.icon}</span>
                          <span className="truncate">{metric.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="p-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ChartComponent data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="displayDate"
                        stroke="#6b7280"
                        fontSize={10}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        fontSize={10}
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
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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
                          strokeWidth={2}
                          dot={{ fill: metricInfo?.color, strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, stroke: metricInfo?.color, strokeWidth: 2 }}
                        />
                      ) : (
                        <Bar
                          dataKey={selectedMetric}
                          fill={metricInfo?.color}
                          radius={[2, 2, 0, 0] as [number, number, number, number]}
                        />
                      )}
                    </ChartComponent>
                  </ResponsiveContainer>
                </div>

                {/* Mini Stats */}
                {chartData.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    {metricInfo?.showTotal ? (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                        <p className="text-gray-500 dark:text-gray-400">Gesamt</p>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {formatValue(
                            chartData.reduce((sum, item) => sum + item[selectedMetric], 0),
                            metricInfo?.unit || ''
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 opacity-50">
                        <p className="text-gray-500 dark:text-gray-400">Gesamt</p>
                        <p className="font-bold text-gray-900 dark:text-white text-xs">
                          N/A
                        </p>
                      </div>
                    )}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                      <p className="text-gray-500 dark:text-gray-400">Ø</p>
                      <p className="font-bold text-gray-900 dark:text-white">
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
