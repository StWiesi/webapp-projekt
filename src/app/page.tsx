'use client';

import { useState } from 'react';
import ExcelUploader from '@/components/ExcelUploader';
import MultiChartDashboard from '@/components/MultiChartDashboard';
import AnalyticsFilters from '@/components/AnalyticsFilters';
import CollapsibleTable from '@/components/CollapsibleTable';
import ColumnMapper from '@/components/ColumnMapper';
import ErrorMessage from '@/components/ErrorMessage';
import GermanyMap from '@/components/GermanyMap';
import FileInfo from '@/components/FileInfo';
import Logo from '@/components/Logo';

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
  const [selectedMapMetric, setSelectedMapMetric] = useState<string>('cost');

  // Konvertiere 2D-Array zu Array von Objekten für die Karte
  const convertToObjectArray = (data: any[][]): any[] => {
    if (!data || data.length < 2) return [];
    
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        // Normalisiere Spaltennamen für die Karte
        const normalizedHeader = header?.toString()?.toLowerCase()?.trim();
        let mappedKey = header;
        
        // Mappe Spaltennamen zu den erwarteten Schlüsseln
        if (normalizedHeader?.includes('cost') || normalizedHeader?.includes('kosten') || normalizedHeader?.includes('außenumsatz')) {
          mappedKey = 'cost';
        } else if (normalizedHeader?.includes('impression') || normalizedHeader?.includes('impressionen')) {
          mappedKey = 'total_impressions';
        } else if (normalizedHeader?.includes('play') || normalizedHeader?.includes('wiedergabe')) {
          mappedKey = 'plays';
        } else if (normalizedHeader?.includes('auction') || normalizedHeader?.includes('auktion') || normalizedHeader?.includes('scheduled')) {
          mappedKey = 'auction_wins';
        } else if (normalizedHeader?.includes('request') || normalizedHeader?.includes('anfrage')) {
          mappedKey = 'ad_requests';
        } else if (normalizedHeader?.includes('latitude') || normalizedHeader?.includes('lat') || normalizedHeader?.includes('breitengrad')) {
          mappedKey = 'latitude';
        } else if (normalizedHeader?.includes('longitude') || normalizedHeader?.includes('lng') || normalizedHeader?.includes('längengrad')) {
          mappedKey = 'longitude';
        } else if (normalizedHeader?.includes('network') || normalizedHeader?.includes('netzwerk')) {
          mappedKey = 'network';
        } else if (normalizedHeader?.includes('region') || normalizedHeader?.includes('bundesland')) {
          mappedKey = 'region';
        } else if (normalizedHeader?.includes('city') || normalizedHeader?.includes('stadt')) {
          mappedKey = 'city';
        } else if (normalizedHeader?.includes('site')) {
          mappedKey = 'site';
        } else if (normalizedHeader?.includes('screen') || normalizedHeader?.includes('bildschirm')) {
          mappedKey = 'screenId';
        } else if (normalizedHeader?.includes('auction') || normalizedHeader?.includes('auktion')) {
          mappedKey = 'auctionType';
        }
        
        obj[mappedKey] = row[index];
      });
      return obj;
    });
  };

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
    <main className="min-h-screen bg-gray-900 dark:bg-gray-950">
      {/* Header mit Ströer Branding */}
      <header className="bg-white dark:bg-white shadow-booking border-b border-gray-200 dark:border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Logo />
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-600">
              Digital-out-of-Home Inventory Analysis
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <ErrorMessage message={error} onClose={clearError} />
        )}

        {/* Upload oder Tabelle */}
        {!excelData ? (
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center justify-center space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-100 dark:text-gray-100 mb-4">
                  Willkommen bei Ströer Analytics
                </h2>
                <p className="text-lg text-gray-400 dark:text-gray-400 max-w-2xl">
                  Laden Sie Ihre Excel-Datei hoch und analysieren Sie Ihre Digital-out-of-Home Daten 
                  mit interaktiven Diagrammen, Filtern und einer Deutschland-Karte.
                </p>
              </div>

              <ExcelUploader 
                onDataLoaded={handleDataLoaded}
                onError={handleError}
              />
            </div>
          </div>
        ) : (
          <div className="flex gap-8 mx-[10%]">
            {/* Filter Sidebar - feste Mindestbreite */}
            <div className="w-80 flex-shrink-0">
              <div className="sticky top-8 h-[calc(100vh-4rem)] overflow-y-auto">
                <AnalyticsFilters
                  data={excelData}
                  filters={filters}
                  onFiltersChange={setFilters}
                  columnMapping={columnMapping}
                />
              </div>
            </div>
            
            {/* Content Area - nimmt den verfügbaren Platz */}
            <div className="flex-1 space-y-8 min-w-0">
              {/* Charts */}
              <MultiChartDashboard
                data={excelData}
                filters={filters}
                columnMapping={columnMapping}
                selectedMapMetric={selectedMapMetric}
                onMapMetricChange={setSelectedMapMetric}
              />

              {/* Germany Map */}
              <GermanyMap
                data={convertToObjectArray(excelData)}
                filters={filters}
                selectedMetric={selectedMapMetric}
                onMetricChange={setSelectedMapMetric}
              />

              {/* Collapsible Table */}
              <CollapsibleTable
                data={excelData}
                filename={filename}
              />

              {/* Column Mapping */}
              <ColumnMapper
                data={excelData}
                onMappingChange={setColumnMapping}
              />
            </div>

            {/* FileInfo - feste Mindestbreite */}
            <div className="w-80 flex-shrink-0">
              <div className="sticky top-8">
                <FileInfo
                  filename={filename}
                  data={excelData}
                  onDataLoaded={handleDataLoaded}
                  onError={handleError}
                  onClear={handleClear}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
