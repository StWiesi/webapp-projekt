'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelUploaderProps {
  onDataLoaded: (data: any[][], filename: string) => void;
  onError: (error: string) => void;
}

export default function ExcelUploader({ onDataLoaded, onError }: ExcelUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);

  const processFile = useCallback(async (file: File) => {
    setIsLoading(true);
    
    try {
      // Validiere Dateityp
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'application/vnd.ms-excel.sheet.macroEnabled.12' // .xlsm
      ];
      
      const isValidType = validTypes.includes(file.type) || 
                         file.name.toLowerCase().endsWith('.xlsx') || 
                         file.name.toLowerCase().endsWith('.xls') ||
                         file.name.toLowerCase().endsWith('.xlsm');
      
      if (!isValidType) {
        throw new Error('Bitte wählen Sie eine gültige Excel-Datei (.xlsx, .xls, .xlsm)');
      }

      // Dateigröße prüfen (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        throw new Error('Datei ist zu groß. Maximale Größe: 20MB');
      }

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Erstes Arbeitsblatt verwenden
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('Excel-Datei enthält keine Arbeitsblätter');
      }
      
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Konvertiere zu Array von Arrays
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        raw: false,
        dateNF: 'dd.mm.yyyy'
      });
      
      if (!jsonData || jsonData.length === 0) {
        throw new Error('Excel-Datei ist leer oder enthält keine Daten');
      }

      onDataLoaded(jsonData as any[][], file.name);
      
    } catch (error) {
      console.error('Fehler beim Verarbeiten der Excel-Datei:', error);
      onError(error instanceof Error ? error.message : 'Unbekannter Fehler beim Verarbeiten der Datei');
    } finally {
      setIsLoading(false);
    }
  }, [onDataLoaded, onError]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm']
    },
    multiple: false,
    disabled: isLoading,
    maxSize: 20 * 1024 * 1024 // 20MB
  });

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          bg-gray-800 dark:bg-gray-900 rounded-booking-lg shadow-booking border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 hover:scale-[1.02]
          ${isDragActive && !isDragReject 
            ? 'border-stroer-500 bg-stroer-900/20 shadow-booking-lg' 
            : isDragReject 
            ? 'border-red-500 bg-red-900/20'
            : 'border-gray-600 hover:border-stroer-400 dark:border-gray-500 dark:hover:border-stroer-400'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-6">
          {isLoading ? (
            <>
              <div className="w-16 h-16 bg-stroer-500 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-100 dark:text-gray-100">
                  Excel-Datei wird verarbeitet...
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-400">
                  Bitte warten Sie einen Moment
                </p>
              </div>
            </>
          ) : isDragReject ? (
            <>
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-red-400 dark:text-red-400">
                  Ungültiger Dateityp
                </p>
                <p className="text-sm text-red-300 dark:text-red-300">
                  Nur Excel-Dateien (.xlsx, .xls, .xlsm) sind erlaubt
                </p>
              </div>
            </>
          ) : (
            <>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                isDragActive 
                  ? 'bg-stroer-500' 
                  : 'bg-gray-700 dark:bg-gray-600'
              }`}>
                {isDragActive ? (
                  <Upload className="h-10 w-10 text-white" />
                ) : (
                  <FileText className="h-10 w-10 text-gray-400 dark:text-gray-400" />
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xl font-semibold text-gray-100 dark:text-gray-100 mb-2">
                    {isDragActive 
                      ? 'Excel-Datei hier ablegen...' 
                      : 'Excel-Datei hochladen'
                    }
                  </p>
                  <p className="text-base text-gray-400 dark:text-gray-400">
                    Drag & Drop oder klicken Sie hier, um Ihre Datei auszuwählen
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-400">
                    <span className="w-2 h-2 bg-stroer-500 rounded-full"></span>
                    Unterstützte Formate: .xlsx, .xls, .xlsm
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-400">
                    <span className="w-2 h-2 bg-stroer-500 rounded-full"></span>
                    Maximale Dateigröße: 20MB
                  </div>
                </div>
                
                <div className="bg-amber-900/20 border border-amber-700/50 rounded-booking-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-amber-400 dark:text-amber-400 text-lg">⚠️</span>
                    <div className="text-sm">
                      <p className="font-medium text-amber-200 dark:text-amber-200 mb-1">
                        Wichtiger Hinweis
                      </p>
                      <p className="text-amber-300 dark:text-amber-300">
                        Nur Tages-Aggregation wird unterstützt. Stunden-Daten werden automatisch auf Tagesebene gruppiert.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
