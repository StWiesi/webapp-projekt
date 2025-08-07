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
  Bar,
  Legend
} from 'recharts';
import { format, parseISO, isValid } from 'date-fns';
import { de } from 'date-fns/locale';
import { TrendingUp, BarChart3, Calendar, Target } from 'lucide-react';

interface AnalyticsChartProps {
  data: any[][];
  filters: {
    network: string[];
    region: string[];
    city: string[];
    site: string[];
    screenIds: string[];
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
  };
}

const METRICS = [
  { key: 'cost', label: 'Cost', color: '#ef4444', icon: '💰' },
  { key: 'total_impressions', label: 'Total Impressions', color: '#3b82f6', icon: '👁️' },
  { key: 'plays', label: 'Plays', color: '#10b981', icon: '▶️' },
  { key: 'auction_wins', label: 'Auction Wins', color: '#f59e0b', icon: '🏆' },
  { key: 'ad_requests', label: 'Ad Requests', color: '#8b5cf6', icon: '📊' }
];

const CHART_TYPES = [
  { key: 'line', label: 'Linie', icon: TrendingUp },
  { key: 'bar', label: 'Balken', icon: BarChart3 }
];

export default function AnalyticsChart({ data, filters, columnMapping }: AnalyticsChartProps) {
  const [selectedMetric, setSelectedMetric] = useState(METRICS[0].key);
  const [chartType, setChartType] = useState('line');

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
      screen_ids: columnMapping.screenIds
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

      // Addiere Metriken
      METRICS.forEach(metric => {
        const index = columnIndices[metric.key as keyof typeof columnIndices];
        if (index !== -1) {
          const value = parseFloat(row[index]) || 0;
          dateGroups[dateKey][metric.key] += value;
        }
      });

      dateGroups[dateKey].count++;
    });

    // Konvertiere zu Array und sortiere nach Datum
    return Object.values(dateGroups)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [rows, columnIndices, filters]);

  const selectedMetricInfo = METRICS.find(m => m.key === selectedMetric);

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Keine Daten für Diagramm verfügbar
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Stellen Sie sicher, dass Ihre Excel-Datei eine Datum-Spalte und Metriken-Spalten enthält.
          </p>
        </div>
      </div>
    );
  }

  const formatValue = (value: number) => {
    if (selectedMetric === 'cost') {
      return `€${value.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`;
    }
    return value.toLocaleString('de-DE');
  };

  const ChartComponent = chartType === 'line' ? LineChart : BarChart;
  const DataComponent = chartType === 'line' ? Line : Bar;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Chart Controls */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              📈 Analytics Dashboard
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {chartData.length} Datenpunkte über {chartData.length > 0 ? 
                `${chartData[0].displayDate} - ${chartData[chartData.length - 1].displayDate}` : 
                'Zeitraum'
              }
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Metrik Auswahl */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Metrik
              </label>
              <div className="flex flex-wrap gap-2">
                {METRICS.map((metric) => (
                  <button
                    key={metric.key}
                    onClick={() => setSelectedMetric(metric.key)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${selectedMetric === metric.key
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    <span>{metric.icon}</span>
                    <span className="hidden sm:inline">{metric.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Type */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Diagramm
              </label>
              <div className="flex gap-2">
                {CHART_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.key}
                      onClick={() => setChartType(type.key)}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${chartType === type.key
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="displayDate"
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => {
                  if (selectedMetric === 'cost') {
                    return `€${(value / 1000).toFixed(0)}k`;
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
                formatter={(value: number) => [formatValue(value), selectedMetricInfo?.label]}
                labelFormatter={(label) => `Datum: ${label}`}
              />
              <DataComponent
                {...(chartType === 'line' 
                  ? {
                      type: 'monotone',
                      dataKey: selectedMetric,
                      stroke: selectedMetricInfo?.color,
                      strokeWidth: 3,
                      dot: { fill: selectedMetricInfo?.color, strokeWidth: 2, r: 4 },
                      activeDot: { r: 6, stroke: selectedMetricInfo?.color, strokeWidth: 2 }
                    }
                  : {
                      dataKey: selectedMetric,
                      fill: selectedMetricInfo?.color,
                      radius: [4, 4, 0, 0]
                    }
                )}
              />
            </ChartComponent>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        {chartData.length > 0 && (
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Gesamt',
                value: chartData.reduce((sum, item) => sum + item[selectedMetric], 0),
                color: 'blue'
              },
              {
                label: 'Durchschnitt',
                value: chartData.reduce((sum, item) => sum + item[selectedMetric], 0) / chartData.length,
                color: 'green'
              },
              {
                label: 'Maximum',
                value: Math.max(...chartData.map(item => item[selectedMetric])),
                color: 'yellow'
              },
              {
                label: 'Minimum',
                value: Math.min(...chartData.map(item => item[selectedMetric])),
                color: 'red'
              }
            ].map((stat, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatValue(stat.value)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
