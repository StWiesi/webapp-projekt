'use client';

import { useState } from 'react';
import ExcelUploader from '@/components/ExcelUploader';
import ExcelTable from '@/components/ExcelTable';
import ErrorMessage from '@/components/ErrorMessage';

export default function Home() {
  const [excelData, setExcelData] = useState<any[][] | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [error, setError] = useState<string>('');

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
            📊 Excel Viewer
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Laden Sie Ihre Excel-Dateien hoch und betrachten Sie sie als interaktive HTML-Tabelle.
            Unterstützt .xlsx, .xls und .xlsm Formate.
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-3xl mb-4">🎯</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Drag & Drop
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Einfaches Hochladen durch Ziehen und Ablegen oder Klicken
                </p>
              </div>
              
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-3xl mb-4">📱</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Responsive
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Optimiert für Desktop, Tablet und Mobile Geräte
                </p>
              </div>
              
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-3xl mb-4">⚡</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Schnell
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sofortige Verarbeitung und Anzeige Ihrer Excel-Daten
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ExcelTable 
            data={excelData} 
            filename={filename}
            onClear={handleClear}
          />
        )}
      </div>
    </main>
  );
}
