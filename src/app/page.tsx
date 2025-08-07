'use client';

import { useState } from 'react';
import ExcelUploader from '@/components/ExcelUploader';
import AnalyticsChart from '@/components/AnalyticsChart';
import AnalyticsFilters from '@/components/AnalyticsFilters';
import CollapsibleTable from '@/components/CollapsibleTable';
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
    screenIds: [] as string[]
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
      screenIds: []
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
            📊 Excel Analytics Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Laden Sie Ihre Excel-Dateien hoch und betrachten Sie sie als interaktive Diagramme und Tabellen.
            Mit erweiterten Filter- und Visualisierungsoptionen für Ihre Datenanalyse.
          </p>
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
                <div className="text-3xl mb-4">📈</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Diagramme
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Interaktive Linien- und Balkendiagramme mit Zeitachse
                </p>
              </div>
              
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-3xl mb-4">🔍</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Filter
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Erweiterte Filter für Network, Region, City, Site und Screen IDs
                </p>
              </div>
              
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-3xl mb-4">📊</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Metriken
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cost, Impressions, Plays, Auction Wins und Ad Requests
                </p>
              </div>
              
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-3xl mb-4">🎯</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Analytics
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Zeitbasierte Analyse mit Statistiken und Trends
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Filter Sidebar */}
              <div className="lg:col-span-1">
                <AnalyticsFilters
                  data={excelData}
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>
              
              {/* Chart Area */}
              <div className="lg:col-span-2">
                <AnalyticsChart
                  data={excelData}
                  filters={filters}
                />
              </div>
            </div>

            {/* Collapsible Table at Bottom */}
            <CollapsibleTable
              data={excelData}
              filename={filename}
              onClear={handleClear}
            />
          </div>
        )}
      </div>
    </main>
  );
}
