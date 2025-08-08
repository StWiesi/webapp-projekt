'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

interface ExcelTableProps {
  data: any[][];
  filename: string;
}

export default function ExcelTable({ data, filename }: ExcelTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: number;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Extrahiere Header und Daten
  const headers = data[0] || [];
  const rows = data.slice(1);

  // Filter Daten basierend auf Suchbegriff
  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;
    
    return rows.filter(row =>
      row.some(cell => 
        cell && cell.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [rows, searchTerm]);

  // Sortiere Daten
  const sortedRows = useMemo(() => {
    if (!sortConfig) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      
      // Versuche numerische Sortierung
      const aNum = parseFloat(aVal.toString());
      const bNum = parseFloat(bVal.toString());
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // Fallback zu String-Sortierung
      const aStr = aVal.toString().toLowerCase();
      const bStr = bVal.toString().toLowerCase();
      
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRows = sortedRows.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (columnIndex: number) => {
    setSortConfig(prevConfig => {
      if (prevConfig?.key === columnIndex) {
        return {
          key: columnIndex,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key: columnIndex, direction: 'asc' };
    });
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Header mit Suchfeld */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {filename}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {sortedRows.length} von {rows.length} Zeilen
          </p>
        </div>
        
        {/* Suchfeld */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Suchen..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Tabelle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    onClick={() => handleSort(index)}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>{header || `Spalte ${index + 1}`}</span>
                      {sortConfig?.key === index && (
                        sortConfig.direction === 'asc' 
                          ? <ChevronUp className="h-4 w-4" />
                          : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedRows.map((row, rowIndex) => (
                <tr 
                  key={startIndex + rowIndex}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {headers.map((_, cellIndex) => (
                    <td 
                      key={cellIndex}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                    >
                      <div className="max-w-xs truncate" title={row[cellIndex] || ''}>
                        {row[cellIndex] || ''}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Zeige {startIndex + 1} bis {Math.min(startIndex + itemsPerPage, sortedRows.length)} von {sortedRows.length} Einträgen
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                Zurück
              </button>
              <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                Seite {currentPage} von {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                Weiter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
