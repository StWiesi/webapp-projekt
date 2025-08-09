'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HistogramChartProps {
  data: any[][];
  filters: {
    network: string[];
    region: string[];
    city: string[];
    site: string[];
    screenIds: string[];
    auctionType: string[];
    dateRange: { start: string; end: string };
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
  selectedMetric: string;
  onMetricChange: (metric: string) => void;
}

const DIMENSIONS = [
  { key: 'network', label: 'Network', columnKey: 'network' as keyof HistogramChartProps['columnMapping'] },
  { key: 'auctionType', label: 'Auction Type', columnKey: 'auctionType' as keyof HistogramChartProps['columnMapping'] },
  { key: 'region', label: 'Bundesland', columnKey: 'region' as keyof HistogramChartProps['columnMapping'] },
  { key: 'city', label: 'Stadt', columnKey: 'city' as keyof HistogramChartProps['columnMapping'] },
  { key: 'site', label: 'Site', columnKey: 'site' as keyof HistogramChartProps['columnMapping'] },
  { key: 'screenIds', label: 'Screen ID', columnKey: 'screenIds' as keyof HistogramChartProps['columnMapping'] },
];

const METRICS = [
  { key: 'cost', label: 'Außenumsatz', unit: '€', type: 'absolute' },
  { key: 'total_impressions', label: 'Impressions', unit: '', type: 'absolute' },
  { key: 'plays', label: 'Plays', unit: '', type: 'absolute' },
  { key: 'auction_wins', label: 'Scheduled Plays', unit: '', type: 'absolute' },
  { key: 'ad_requests', label: 'Ad Requests', unit: '', type: 'absolute' },
  { key: 'coverage', label: 'Coverage', unit: '%', type: 'percentage' },
  { key: 'play_rate', label: 'Play Rate', unit: '%', type: 'percentage' }
];

const HistogramChart: React.FC<HistogramChartProps> = ({ 
  data, 
  filters, 
  columnMapping, 
  selectedMetric,
  onMetricChange 
}) => {
  const [selectedDimension, setSelectedDimension] = useState('network');
  const [showAllValues, setShowAllValues] = useState(false);
  const [sortDirection, setSortDirection] = useState<'top' | 'last'>('top'); // 'top' = höchste Werte, 'last' = niedrigste Werte
  
  // Scroll position restoration
  const scrollPositionRef = useRef(0);
  const shouldRestoreScrollRef = useRef(false);

  // Save scroll position before state changes
  const saveScrollPosition = () => {
    scrollPositionRef.current = window.scrollY;
    shouldRestoreScrollRef.current = true;
  };

  // Restore scroll position after DOM updates
  useEffect(() => {
    if (shouldRestoreScrollRef.current) {
      const restoreScroll = () => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'instant'
        });
        shouldRestoreScrollRef.current = false;
      };
      
      // Multiple timeouts for robustness
      setTimeout(restoreScroll, 0);
      setTimeout(restoreScroll, 50);
      setTimeout(restoreScroll, 100);
    }
  }, [selectedDimension, showAllValues, selectedMetric, sortDirection]);

  const getDisplayLimit = (totalCount: number) => {
    if (totalCount <= 10) return totalCount;
    if (totalCount <= 20) return 10;
    if (totalCount <= 50) return 20;
    return 30;
  };

  const histogramDataResult = useMemo(() => {
    if (!data || data.length < 2) return { histogramData: [], sortedData: [] };

    const headers = data[0];
    const rows = data.slice(1);
    
    // Filter data based on current filters
    const filteredRows = rows.filter(row => {
      // Network filter
      if (filters.network && filters.network.length > 0 && columnMapping.network !== -1) {
        const networkValue = row[columnMapping.network]?.toString() || '';
        if (!filters.network.includes(networkValue)) return false;
      }
      
      // Auction Type filter
      if (filters.auctionType && filters.auctionType.length > 0 && columnMapping.auctionType !== -1) {
        const auctionTypeValue = row[columnMapping.auctionType]?.toString() || '';
        if (!filters.auctionType.includes(auctionTypeValue)) return false;
      }
      
      // Bundesland filter
      if (filters.region && filters.region.length > 0 && columnMapping.region !== -1) {
        const bundeslandValue = row[columnMapping.region]?.toString() || '';
        if (!filters.region.includes(bundeslandValue)) return false;
      }
      
      // Stadt filter
      if (filters.city && filters.city.length > 0 && columnMapping.city !== -1) {
        const stadtValue = row[columnMapping.city]?.toString() || '';
        if (!filters.city.includes(stadtValue)) return false;
      }
      
      // Site filter
      if (filters.site && filters.site.length > 0 && columnMapping.site !== -1) {
        const siteValue = row[columnMapping.site]?.toString() || '';
        if (!filters.site.includes(siteValue)) return false;
      }
      
      // Screen ID filter
      if (filters.screenIds && filters.screenIds.length > 0 && columnMapping.screenIds !== -1) {
        const screenIdValue = row[columnMapping.screenIds]?.toString() || '';
        if (!filters.screenIds.includes(screenIdValue)) return false;
      }
      
      // Date range filter
      if (filters.dateRange?.start || filters.dateRange?.end) {
        if (columnMapping.date !== -1) {
          const dateValue = row[columnMapping.date];
          if (dateValue) {
            try {
              let rowDate: Date;
              const dateStr = dateValue.toString();
              
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
                rowDate = new Date(dateValue);
              }
              
              // Prüfe Startdatum (inklusiv)
              if (filters.dateRange.start) {
                const startDate = new Date(filters.dateRange.start);
                startDate.setHours(0, 0, 0, 0);
                if (rowDate < startDate) return false;
              }
              
              // Prüfe Enddatum (inklusiv)
              if (filters.dateRange.end) {
                const endDate = new Date(filters.dateRange.end);
                endDate.setHours(23, 59, 59, 999);
                if (rowDate > endDate) return false;
              }
            } catch {
              return false;
            }
          }
        }
      }
      
      return true;
    });

    // Get dimension column index
    const dimensionConfig = DIMENSIONS.find(d => d.key === selectedDimension);
    if (!dimensionConfig || columnMapping[dimensionConfig.columnKey] === -1) {
      return { histogramData: [], sortedData: [] };
    }
    
    const dimensionColumnIndex = columnMapping[dimensionConfig.columnKey];
    
    // Get metric column index
    const metricConfig = METRICS.find(m => m.key === selectedMetric);
    if (!metricConfig) {
      return { histogramData: [], sortedData: [] };
    }
    
    const metricColumnKey = metricConfig.key as keyof typeof columnMapping;
    const metricColumnIndex = columnMapping[metricColumnKey];
    if (metricColumnIndex === -1) {
      return { histogramData: [], sortedData: [] };
    }

    // Group data by dimension and sum metrics
    const groupedData = new Map<string, {
      cost: number;
      total_impressions: number;
      plays: number;
      auction_wins: number;
      ad_requests: number;
      coverage: number;
      play_rate: number;
    }>();
    
    filteredRows.forEach(row => {
      const dimensionValue = row[dimensionColumnIndex] || 'Unbekannt';
      
      if (!groupedData.has(dimensionValue)) {
        groupedData.set(dimensionValue, {
          cost: 0,
          total_impressions: 0,
          plays: 0,
          auction_wins: 0,
          ad_requests: 0,
          coverage: 0,
          play_rate: 0
        });
      }
      
      const entry = groupedData.get(dimensionValue)!;
      
      // Summiere alle Basis-Metriken
      if (columnMapping.cost !== -1 && row[columnMapping.cost]) {
        entry.cost += parseFloat(row[columnMapping.cost]) || 0;
      }
      if (columnMapping.total_impressions !== -1 && row[columnMapping.total_impressions]) {
        entry.total_impressions += parseFloat(row[columnMapping.total_impressions]) || 0;
      }
      if (columnMapping.plays !== -1 && row[columnMapping.plays]) {
        entry.plays += parseFloat(row[columnMapping.plays]) || 0;
      }
      if (columnMapping.auction_wins !== -1 && row[columnMapping.auction_wins]) {
        entry.auction_wins += parseFloat(row[columnMapping.auction_wins]) || 0;
      }
      if (columnMapping.ad_requests !== -1 && row[columnMapping.ad_requests]) {
        entry.ad_requests += parseFloat(row[columnMapping.ad_requests]) || 0;
      }
    });

    // Berechne abgeleitete Metriken für jede Gruppe
    groupedData.forEach(entry => {
      entry.coverage = entry.ad_requests > 0 ? (entry.plays / entry.ad_requests) * 100 : 0;
      entry.play_rate = entry.auction_wins > 0 ? (entry.plays / entry.auction_wins) * 100 : 0;
    });

    // Convert to array and sort by selected metric value
    const sortedData = Array.from(groupedData.entries())
      .map(([name, metrics]) => ({
        name,
        value: metrics[selectedMetric as keyof typeof metrics] || 0,
        unit: metricConfig.unit || ''
      }))
      .sort((a, b) => b.value - a.value); // Immer von groß nach klein sortieren

    // Limit data for display - berücksichtige Sortierrichtung nur bei limitierter Ansicht
    const displayLimit = getDisplayLimit(sortedData.length);
    let histogramData;
    
    if (showAllValues) {
      // Bei "Alle": Immer von groß nach klein
      histogramData = sortedData;
    } else {
      // Bei limitierter Ansicht: Berücksichtige Sortierrichtung
      histogramData = sortDirection === 'top' 
        ? sortedData.slice(0, displayLimit)  // Top X (höchste Werte)
        : sortedData.slice(-displayLimit);   // Last X (niedrigste Werte)
    }

    return { histogramData, sortedData };
  }, [data, filters, columnMapping, selectedDimension, selectedMetric, showAllValues, sortDirection]);

  const { histogramData, sortedData } = histogramDataResult;

  const formatValue = (value: number) => {
    const currentMetric = METRICS.find(m => m.key === selectedMetric);
    if (currentMetric?.unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (currentMetric?.unit === '€') {
      return new Intl.NumberFormat('de-DE', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    return new Intl.NumberFormat('de-DE').format(Math.round(value));
  };

  const handleDimensionChange = (dimension: string) => {
    saveScrollPosition();
    setSelectedDimension(dimension);
    setShowAllValues(false); // Reset to default view when changing dimension
  };

  const handleMetricChange = (metric: string) => {
    saveScrollPosition();
    onMetricChange(metric);
  };

  const toggleShowAll = () => {
    saveScrollPosition();
    setShowAllValues(!showAllValues);
  };



  const displayLimit = getDisplayLimit(sortedData.length);
  const currentDisplayCount = showAllValues ? sortedData.length : Math.min(displayLimit, sortedData.length);
  const totalCount = sortedData.length;

  return (
    <div className="bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-booking-lg p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 min-w-0">
          {/* Dimension Selector */}
          <div className="flex flex-col min-w-0 flex-1">
            <label className="text-sm font-medium text-gray-300 dark:text-gray-300 mb-2">Dimension</label>
            <select
              value={selectedDimension}
              onChange={(e) => handleDimensionChange(e.target.value)}
              className="px-3 py-2 border border-gray-600 dark:border-gray-500 rounded-md text-sm bg-gray-700 dark:bg-gray-800 text-gray-300 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-stroer-500 focus:border-transparent"
            >
              {DIMENSIONS.map(dimension => (
                <option key={dimension.key} value={dimension.key}>
                  {dimension.label}
                </option>
              ))}
            </select>
          </div>

          {/* Metric Selector */}
          <div className="flex flex-col min-w-0 flex-1">
            <label className="text-sm font-medium text-gray-300 dark:text-gray-300 mb-2">Metrik</label>
            <select
              value={selectedMetric}
              onChange={(e) => handleMetricChange(e.target.value)}
              className="px-3 py-2 border border-gray-600 dark:border-gray-500 rounded-md text-sm bg-gray-700 dark:bg-gray-800 text-gray-300 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-stroer-500 focus:border-transparent"
            >
              {METRICS.map(metric => (
                <option key={metric.key} value={metric.key}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Display Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            {/* Top Button - immer sichtbar */}
            <button
              onClick={() => {
                saveScrollPosition();
                setSortDirection('top');
                setShowAllValues(false);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                !showAllValues && sortDirection === 'top'
                  ? 'bg-stroer-500 text-white'
                  : 'bg-gray-700 dark:bg-gray-600 text-gray-300 dark:text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-500'
              }`}
            >
              Top {displayLimit}
            </button>
            
            {/* Last Button - nur anzeigen wenn genug Werte vorhanden */}
            {totalCount > 10 && (
              <button
                onClick={() => {
                  saveScrollPosition();
                  setSortDirection('last');
                  setShowAllValues(false);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  !showAllValues && sortDirection === 'last'
                    ? 'bg-stroer-500 text-white'
                    : 'bg-gray-700 dark:bg-gray-600 text-gray-300 dark:text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-500'
                }`}
              >
                Last {displayLimit}
              </button>
            )}
            
            <button
              onClick={toggleShowAll}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                showAllValues
                  ? 'bg-stroer-500 text-white'
                  : 'bg-gray-700 dark:bg-gray-600 text-gray-300 dark:text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-500'
              }`}
            >
              Alle ({totalCount})
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-4 p-3 bg-gray-700/30 dark:bg-gray-800/30 rounded-booking">
        <div className="text-sm text-gray-400 dark:text-gray-400">
          <span className="font-medium text-gray-300 dark:text-gray-300">Angezeigt:</span> {currentDisplayCount} von {totalCount} {selectedDimension === 'network' ? 'Networks' : selectedDimension === 'auctionType' ? 'Auction Types' : selectedDimension === 'region' ? 'Bundesländern' : selectedDimension === 'city' ? 'Städten' : selectedDimension === 'site' ? 'Sites' : 'Screen IDs'}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
            />
            <YAxis 
              tickFormatter={formatValue}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
            />
            <Tooltip 
              formatter={(value: number) => [formatValue(value), METRICS.find(m => m.key === selectedMetric)?.label || 'Wert']}
              labelFormatter={(label) => `${label}`}
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
            />
            <Bar 
              dataKey="value" 
              fill="#FF6B35" 
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HistogramChart;