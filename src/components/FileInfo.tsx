'use client';

import React from 'react';
import { FileText, Upload, X, ChevronUp, ChevronDown } from 'lucide-react';
import ExcelUploader from './ExcelUploader';

interface FileInfoProps {
  filename: string;
  data: any[][];
  onDataLoaded: (data: any[][], filename: string) => void;
  onError: (error: string) => void;
  onClear: () => void;
}

export default function FileInfo({ filename, data, onDataLoaded, onError, onClear }: FileInfoProps) {
  const [showUploader, setShowUploader] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const rowCount = data.length - 1; // Minus Header
  const columnCount = data[0]?.length || 0;

  return (
    <div className="card overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-stroer-500 rounded-booking flex items-center justify-center flex-shrink-0">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div className="text-left min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white text-ellipsis">
              Aktuelle Datei
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
          <div className="p-4">
            {/* File Statistics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-700/50 dark:bg-gray-800/50 rounded-booking p-3">
                <div className="text-lg font-bold text-stroer-500">
                  {rowCount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400 dark:text-gray-400">
                  Datenzeilen
                </div>
              </div>
              
              <div className="bg-gray-700/50 dark:bg-gray-800/50 rounded-booking p-3">
                <div className="text-lg font-bold text-stroer-500">
                  {columnCount}
                </div>
                <div className="text-sm text-gray-400 dark:text-gray-400">
                  Spalten
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setShowUploader(!showUploader)}
                className="btn-secondary text-sm px-3 py-2 flex items-center gap-2 flex-1 justify-center"
              >
                <Upload className="h-4 w-4" />
                {showUploader ? 'Abbrechen' : 'Austauschen'}
              </button>
              
              <button
                onClick={onClear}
                className="btn-secondary text-sm px-3 py-2 flex items-center gap-2 text-red-400 hover:text-red-300"
              >
                <X className="h-4 w-4" />
                Löschen
              </button>
            </div>

            {/* Uploader (collapsed by default) */}
            {showUploader && (
              <div className="border-t border-gray-700 dark:border-gray-600 pt-4 mt-4">
                <div className="bg-gray-700/30 dark:bg-gray-800/30 rounded-booking p-3">
                  <h4 className="text-sm font-semibold text-gray-300 dark:text-gray-300 mb-3">
                    Neue Datei hochladen
                  </h4>
                  <ExcelUploader
                    onDataLoaded={onDataLoaded}
                    onError={onError}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
