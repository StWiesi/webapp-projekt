'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Table as TableIcon } from 'lucide-react';
import ExcelTable from './ExcelTable';

interface CollapsibleTableProps {
  data: any[][];
  filename: string;
}

export default function CollapsibleTable({ data, filename }: CollapsibleTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const rowCount = data.length - 1; // Minus Header
  const columnCount = data[0]?.length || 0;

  return (
    <div className="card overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-stroer-500 rounded-booking flex items-center justify-center flex-shrink-0">
            <TableIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div className="text-left min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white text-ellipsis">
              Rohdaten-Tabelle
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-ellipsis">
              {filename} • {rowCount.toLocaleString()} Zeilen × {columnCount} Spalten
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
            {isExpanded ? 'Einklappen' : 'Anzeigen'}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="bg-stroer-50 dark:bg-stroer-900/20 border border-stroer-200 dark:border-stroer-800 rounded-booking-lg p-4 mb-6">
              <div className="flex items-start gap-4">
                <TableIcon className="h-5 w-5 text-stroer-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-stroer-800 dark:text-stroer-200 mb-2">
                    Vollständige Datenansicht
                  </h4>
                  <p className="text-sm text-stroer-700 dark:text-stroer-300">
                    Hier sehen Sie alle Rohdaten aus Ihrer Excel-Datei mit Such- und Sortierfunktionen.
                  </p>
                </div>
              </div>
            </div>
            
            <ExcelTable 
              data={data} 
              filename={filename}
            />
          </div>
        </div>
      )}
    </div>
  );
}
