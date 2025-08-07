'use client';

import { useState } from 'react';
import ExcelUploader from '@/components/ExcelUploader';
import MultiChartDashboard from '@/components/MultiChartDashboard';
import AnalyticsFilters from '@/components/AnalyticsFilters';
import CollapsibleTable from '@/components/CollapsibleTable';
import ColumnMapper from '@/components/ColumnMapper';
import ErrorMessage from '@/components/ErrorMessage';

export default function Home() {
  const [excelData, setExcelData] = useState<any[][] | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState({
    network: [] as string[],
    region: [] as string[],
    city: [] as string[],
    site: [] as string[],
    screenIds: [] as string[],
    auctionType: [] as string[]
  });
  const [columnMapping, setColumnMapping] = useState({
    date: -1,
    cost: -1,
    total_impressions: -1,
    plays: -1,
    auction_wins: -1,
    ad_requests: -1,
    network: -1,
    region: -1,
    city: -1,
    site: -1,
    screenIds: -1,
    auctionType: -1
  });

  const handleDataLoaded = (data: any[][], filename: string) => {
    setExcelData(data);
    setFilename(filename);
    setError('');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setExcelData(null);
    setFilename('');
  };

  const handleClear = () => {
    setExcelData(null);
    setFilename('');
    setError('');
    setFilters({
      network: [],
      region: [],
      city: [],
      site: [],
      screenIds: [],
      auctionType: []
    });
    setColumnMapping({
      date: -1,
      cost: -1,
      total_impressions: -1,
      plays: -1,
      auction_wins: -1,
      ad_requests: -1,
      network: -1,
      region: -1,
      city: -1,
      site: -1,
      screenIds: -1,
      auctionType: -1
    });
  };

  const clearError = () => {
    setError('');
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Ströer Digital-out-of-Home Inventory Analysis Tool
          </h1>
        </div>

        {/* Error Message */}
        {error && (
          <ErrorMessage message={error} onClose={clearError} />
        )}

        {/* Upload oder Tabelle */}
        {!excelData ? (
          <div className="flex flex-col items-center justify-center space-y-8">
            <ExcelUploader 
              onDataLoaded={handleDataLoaded}
              onError={handleError}
            />
            
            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto mt-12">
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-3xl mb-4">📊</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  3 Diagramme
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Drei separate Diagramme mit individueller Metrik-Auswahl
                </p>
              </div>
              
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-3xl mb-4">🧮</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Berechnete Metriken
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Play Rate (Plays/Auction Wins) und Coverage (Plays/Ad Requests)
                </p>
              </div>
              
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-3xl mb-4">🔍</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Erweiterte Filter
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Filter für Network, Region, City, Site und Screen IDs
                </p>
              </div>
              
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-3xl mb-4">⚡</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Flexible Ansicht
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Linien- oder Balkendiagramme mit Live-Statistiken
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Filter Sidebar - immer links */}
              <div className="lg:col-span-1">
                <AnalyticsFilters
                  data={excelData}
                  filters={filters}
                  onFiltersChange={setFilters}
                  columnMapping={columnMapping}
                />
              </div>
              
              {/* Charts Area - Spalte 2 und 3 */}
              <div className="lg:col-span-2">
                <MultiChartDashboard
                  data={excelData}
                  filters={filters}
                  columnMapping={columnMapping}
                />
              </div>
            </div>

            {/* Collapsible Table at Bottom */}
            <CollapsibleTable
              data={excelData}
              filename={filename}
              onClear={handleClear}
            />

            {/* Column Mapping */}
            <ColumnMapper
              data={excelData}
              onMappingChange={setColumnMapping}
            />
          </div>
        )}
      </div>
    </main>
  );
}
