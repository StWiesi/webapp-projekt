'use client';

import { useState, useMemo } from 'react';
import ExcelUploader from '@/components/ExcelUploader';
import MultiChartDashboard from '@/components/MultiChartDashboard';
import HistogramChart from '@/components/HistogramChart';
import AnalyticsFilters from '@/components/AnalyticsFilters';
import CollapsibleTable from '@/components/CollapsibleTable';
import ColumnMapper from '@/components/ColumnMapper';
import ErrorMessage from '@/components/ErrorMessage';
import GermanyMap from '@/components/GermanyMap';
import FileInfo from '@/components/FileInfo';
import Logo from '@/components/Logo';
import React from 'react';

export default function Home() {
  const [excelData, setExcelData] = useState<any[][] | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isDashboardReady, setIsDashboardReady] = useState(false);

  const [filters, setFilters] = useState({
    network: [] as string[],
    region: [] as string[],
    city: [] as string[],
    site: [] as string[],
    screenIds: [] as string[],
    auctionType: [] as string[],
    dateRange: {
      start: '',
      end: ''
    }
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
  const [selectedMetric, setSelectedMetric] = useState<string>('cost');

  // Aktualisiere ColumnMapping wenn excelData gesetzt wird
  React.useEffect(() => {
    if (excelData && excelData.length > 1) {
      const headers = excelData[0];
      const newColumnMapping = {
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
      };
      
      headers.forEach((header, index) => {
        const normalizedHeader = header?.toString()?.toLowerCase()?.trim();
        
        if (normalizedHeader?.includes('date') || normalizedHeader?.includes('datum')) {
          newColumnMapping.date = index;
        } else if (normalizedHeader?.includes('cost') || normalizedHeader?.includes('kosten') || normalizedHeader?.includes('außenumsatz')) {
          newColumnMapping.cost = index;
        } else if (normalizedHeader?.includes('impression') || normalizedHeader?.includes('impressionen')) {
          newColumnMapping.total_impressions = index;
        } else if (normalizedHeader?.includes('play') || normalizedHeader?.includes('wiedergabe')) {
          newColumnMapping.plays = index;
        } else if (normalizedHeader?.includes('auction') || normalizedHeader?.includes('auktion') || normalizedHeader?.includes('scheduled')) {
          newColumnMapping.auction_wins = index;
        } else if (normalizedHeader?.includes('request') || normalizedHeader?.includes('anfrage')) {
          newColumnMapping.ad_requests = index;
        } else if (normalizedHeader?.includes('network') || normalizedHeader?.includes('netzwerk')) {
          newColumnMapping.network = index;
        } else if (normalizedHeader?.includes('region') || normalizedHeader?.includes('bundesland')) {
          newColumnMapping.region = index;
        } else if (normalizedHeader?.includes('city') || normalizedHeader?.includes('stadt')) {
          newColumnMapping.city = index;
        } else if (normalizedHeader?.includes('site')) {
          newColumnMapping.site = index;
        } else if (normalizedHeader?.includes('screen') || normalizedHeader?.includes('bildschirm')) {
          newColumnMapping.screenIds = index;
        } else if (normalizedHeader?.includes('auction') || normalizedHeader?.includes('auktion')) {
          newColumnMapping.auctionType = index;
        }
      });
      
      setColumnMapping(newColumnMapping);
    }
  }, [excelData]);

  // Konvertiere 2D-Array zu Array von Objekten für die Karte - mit useMemo optimiert
  const convertToObjectArray = useMemo(() => {
    if (!excelData || excelData.length < 2) {
      return [];
    }
    
    try {
      const headers = excelData[0];
      const rows = excelData.slice(1);
      
      // Verarbeite alle Daten - kein Limit für Konsistenz mit dem Histogramm
      const allRows = rows;
      
      // Filtere Zeilen basierend auf den aktiven Filtern
      const filteredRows = allRows.filter(row => {
        // Prüfe nur Filter, die tatsächlich Werte haben (nicht leer sind)
        if (filters.network && filters.network.length > 0) {
          const columnIndex = columnMapping.network;
          if (columnIndex !== -1) {
            const rowValue = row[columnIndex]?.toString() || '';
            if (!filters.network.includes(rowValue)) {
              return false;
            }
          }
        }
        
        if (filters.region && filters.region.length > 0) {
          const columnIndex = columnMapping.region;
          if (columnIndex !== -1) {
            const rowValue = row[columnIndex]?.toString() || '';
            if (!filters.region.includes(rowValue)) {
              return false;
            }
          }
        }
        
        if (filters.city && filters.city.length > 0) {
          const columnIndex = columnMapping.city;
          if (columnIndex !== -1) {
            const rowValue = row[columnIndex]?.toString() || '';
            if (!filters.city.includes(rowValue)) {
              return false;
            }
          }
        }
        
        if (filters.site && filters.site.length > 0) {
          const columnIndex = columnMapping.site;
          if (columnIndex !== -1) {
            const rowValue = row[columnIndex]?.toString() || '';
            if (!filters.site.includes(rowValue)) {
              return false;
            }
          }
        }
        
        if (filters.screenIds && filters.screenIds.length > 0) {
          const columnIndex = columnMapping.screenIds;
          if (columnIndex !== -1) {
            const rowValue = row[columnIndex]?.toString() || '';
            if (!filters.screenIds.includes(rowValue)) {
              return false;
            }
          }
        }
        
        if (filters.auctionType && filters.auctionType.length > 0) {
          const columnIndex = columnMapping.auctionType;
          if (columnIndex !== -1) {
            const rowValue = row[columnIndex]?.toString() || '';
            if (!filters.auctionType.includes(rowValue)) {
              return false;
            }
          }
        }
        
        return true;
      });
      

      
      const result = filteredRows.map((row) => {
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
      
      return result;
      
    } catch (error) {
      handleError(error instanceof Error ? error.message : 'Fehler beim Verarbeiten der Daten');
      return [];
    }
  }, [excelData, filters, columnMapping]); // Abhängig von excelData, filters und columnMapping

  // Warte bis alle Daten verarbeitet sind, bevor Dashboard angezeigt wird
  React.useEffect(() => {
    if (excelData && convertToObjectArray.length > 0 && columnMapping.cost !== -1) {
      // Warte zusätzlich 1 Sekunde damit alle Komponenten geladen sind
      const timer = setTimeout(() => {
        setIsDashboardReady(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setIsDashboardReady(false);
    }
  }, [excelData, convertToObjectArray, columnMapping]);

  const handleDataLoaded = (data: any[][], filename: string) => {
    try {
      // Validiere Daten
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('Ungültige Datenstruktur: Daten sind leer oder kein Array');
      }
      
      if (data.length < 2) {
        throw new Error('Daten müssen mindestens eine Header-Zeile und eine Datenzeile enthalten');
      }
      
      const headers = data[0];
      const rows = data.slice(1);
      
      // Setze Daten und initialisiere Filter
      setExcelData(data);
      setFilename(filename);
      setError('');
      
      // Initialisiere Filter mit allen verfügbaren Optionen
      const newFilters = {
        network: [] as string[],
        region: [] as string[],
        city: [] as string[],
        site: [] as string[],
        screenIds: [] as string[],
        auctionType: [] as string[],
        dateRange: {
          start: '',
          end: ''
        }
      };
      
      // Mappe Spaltennamen zu Filter-Keys
      const columnMapping = {
        network: -1,
        region: -1,
        city: -1,
        site: -1,
        screenIds: -1,
        auctionType: -1
      };
      
      headers.forEach((header, index) => {
        const normalizedHeader = header?.toString()?.toLowerCase()?.trim();
        
        if (normalizedHeader?.includes('network') || normalizedHeader?.includes('netzwerk')) {
          columnMapping.network = index;
        } else if (normalizedHeader?.includes('region') || normalizedHeader?.includes('bundesland')) {
          columnMapping.region = index;
        } else if (normalizedHeader?.includes('city') || normalizedHeader?.includes('stadt')) {
          columnMapping.city = index;
        } else if (normalizedHeader?.includes('site')) {
          columnMapping.site = index;
        } else if (normalizedHeader?.includes('screen') || normalizedHeader?.includes('bildschirm')) {
          columnMapping.screenIds = index;
        } else if (normalizedHeader?.includes('auction') || normalizedHeader?.includes('auktion')) {
          columnMapping.auctionType = index;
        }
      });
      
      // Extrahiere eindeutige Werte für Filter (aber setze sie nicht automatisch)
      // Die Filter bleiben leer, sodass alle Daten angezeigt werden
      Object.entries(columnMapping).forEach(([, columnIndex]) => {
        if (columnIndex !== -1) {
          const uniqueValues = new Set<string>();
          // Verarbeite alle Zeilen für vollständige Filter-Optionen
          rows.forEach(row => {
            const value = row[columnIndex]?.toString()?.trim();
            if (value && value !== '') {
              uniqueValues.add(value);
            }
          });
          // Filter bleiben leer - Benutzer können sie manuell auswählen
        }
      });
      
      setFilters(newFilters);
      
    } catch (error) {
      handleError(error instanceof Error ? error.message : 'Fehler beim Verarbeiten der Daten');
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setExcelData(null);
    setFilename('');
    setIsDashboardReady(false);
  };

  const handleClear = () => {
    setExcelData(null);
    setFilename('');
    setError('');
    setIsDashboardReady(false);
    setFilters({
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

          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <ErrorMessage message={error} onClose={clearError} />
        )}

        {/* Upload oder Tabelle */}
        {!excelData || !isDashboardReady ? (
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center justify-center space-y-8">
              <div className="text-center mb-8">
                <p className="text-sm text-gray-500 dark:text-gray-500 max-w-2xl">
                  Hier findest du einen Report als guten Startpunkt: <a href="https://core.stroeer.com/reporting/ssp?startDate=7daysAgo&endDate=today&tz=Etc%2FUTC&sort=-sspCost&dimensions=date,sspPpvNetwork,sspPpvRegion,sspPpvCity,sspPpvSiteName,auctionType,sspPpvLongitude,sspPpvLatitude,ppvScreenIds&metrics=adRequests,auctionWins,sspPpvPlays,sspPpvTotalAudience,sspCost&filters=publisherName%3D%3DPublic%20Video;trafficSource%3D%3DDirect%20PPV&granularity=day&currency=eur&isRelative=true&nonullrows=auto&count=50&page=1&plotX=date&plotY1=sspCost" target="_blank" rel="noopener noreferrer" className="text-stroer-500 hover:text-stroer-400 underline">Ströer Core Reporting</a>
                </p>
              </div>



              {!excelData ? (
                <ExcelUploader 
                  onDataLoaded={handleDataLoaded}
                  onError={handleError}
                />
              ) : (
                /* Dashboard wird vorbereitet */
                <div className="text-center">
                  <div className="w-16 h-16 bg-stroer-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="spinning-globe">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth={2}/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h20"/>
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-100 dark:text-gray-100 mb-2">
                    Dashboard wird vorbereitet...
                  </h2>
                  <p className="text-sm text-gray-400 dark:text-gray-400 mb-4">
                    Daten werden verarbeitet und Komponenten geladen
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Geschätzte Zeit: 2-3 Sekunden
                  </p>
                </div>
              )}
            </div>
            

          </div>
        ) : (
          <div className="macbook-optimized">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 xl:gap-8">
              {/* Filter Sidebar - responsive */}
              <div className="w-full lg:w-80 lg:flex-shrink-0 order-1 lg:order-1">
                <div className="lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] overflow-y-auto">
                  {/* FileInfo - über den Filtern */}
                  <div className="mb-4">
                    <FileInfo
                      filename={filename}
                      data={excelData}
                      onDataLoaded={handleDataLoaded}
                      onError={handleError}
                      onClear={handleClear}
                    />
                  </div>
                  
                  <AnalyticsFilters
                    data={excelData}
                    filters={filters}
                    onFiltersChange={setFilters}
                    columnMapping={columnMapping}
                  />
                </div>
              </div>
              
              {/* Content Area - responsive */}
              <div className="flex-1 space-y-4 lg:space-y-6 xl:space-y-8 min-w-0 order-2 lg:order-2">
                {/* Charts */}
                <MultiChartDashboard
                  data={excelData}
                  filters={filters}
                  columnMapping={columnMapping}
                  selectedMapMetric={selectedMetric}
                  onMapMetricChange={setSelectedMetric}
                />

                {/* Histogram Chart */}
                <HistogramChart
                  data={excelData}
                  filters={filters}
                  columnMapping={columnMapping}
                  selectedMetric={selectedMetric}
                  onMetricChange={(metric) => {
                    setSelectedMetric(metric);
                  }}
                />

                {/* Germany Map */}
                <GermanyMap
                  data={convertToObjectArray}
                  filters={filters}
                  selectedMetric={selectedMetric}
                  onMetricChange={setSelectedMetric}
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
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

