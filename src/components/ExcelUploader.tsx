'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
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
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive && !isDragReject 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : isDragReject 
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-gray-600 dark:text-gray-300">
                Excel-Datei wird verarbeitet...
              </p>
            </>
          ) : isDragReject ? (
            <>
              <AlertCircle className="h-12 w-12 text-red-500" />
              <p className="text-red-600 dark:text-red-400 font-medium">
                Ungültiger Dateityp
              </p>
              <p className="text-sm text-red-500">
                Nur Excel-Dateien (.xlsx, .xls, .xlsm) sind erlaubt
              </p>
            </>
          ) : (
            <>
              {isDragActive ? (
                <Upload className="h-12 w-12 text-blue-500" />
              ) : (
                <FileText className="h-12 w-12 text-gray-400" />
              )}
              
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
                  {isDragActive 
                    ? 'Excel-Datei hier ablegen...' 
                    : 'Excel-Datei hochladen'
                  }
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Drag & Drop oder klicken Sie hier
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Unterstützte Formate: .xlsx, .xls, .xlsm (max. 20MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
