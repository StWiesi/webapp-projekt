'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Table as TableIcon } from 'lucide-react';
import ExcelTable from './ExcelTable';

interface CollapsibleTableProps {
  data: any[][];
  filename: string;
  onClear: () => void;
}

export default function CollapsibleTable({ data, filename, onClear }: CollapsibleTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const rowCount = data.length - 1; // Minus Header
  const columnCount = data[0]?.length || 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <TableIcon className="h-5 w-5 text-gray-500" />
          <div className="text-left">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              📊 Rohdaten-Tabelle
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filename} • {rowCount.toLocaleString()} Zeilen × {columnCount} Spalten
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {isExpanded ? 'Einklappen' : 'Anzeigen'}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <TableIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Vollständige Datenansicht
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Hier sehen Sie alle Rohdaten aus Ihrer Excel-Datei mit Such-, Sortier- und Exportfunktionen.
                  </p>
                </div>
              </div>
            </div>
            
            <ExcelTable 
              data={data} 
              filename={filename}
              onClear={onClear}
            />
          </div>
        </div>
      )}
    </div>
  );
}
