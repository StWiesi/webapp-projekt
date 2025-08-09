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
  const [estimatedTime, setEstimatedTime] = useState('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const processFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setCurrentFile(file);
    
    // Schätze die Verarbeitungszeit basierend auf der Dateigröße
    const fileSizeInMB = file.size / (1024 * 1024);
    const estimatedSeconds = Math.max(2, Math.ceil(fileSizeInMB * 0.2)); // Realistisch: 0.2 Sekunden pro MB + Dashboard-Zeit
    setEstimatedTime(`${estimatedSeconds} Sekunden`);
    
    try {
      // Validiere Dateityp
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
        'application/octet-stream' // Fallback für manche Systeme
      ];
      
      const isValidType = validTypes.includes(file.type) || 
                         file.name.toLowerCase().endsWith('.xlsx') || 
                         file.name.toLowerCase().endsWith('.xls') ||
                         file.name.toLowerCase().endsWith('.xlsm');
      
      if (!isValidType) {
        throw new Error('Bitte wählen Sie eine gültige Excel-Datei (.xlsx, .xls, .xlsm)');
      }

      // Dateigröße prüfen (max 50MB)
      const maxSizeInMB = 50;
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      
      if (file.size > maxSizeInBytes) {
        const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(1);
        throw new Error(`Datei ist zu groß. Aktuelle Größe: ${fileSizeInMB}MB, Maximale Größe: ${maxSizeInMB}MB`);
      }

      // Verarbeite Datei direkt ohne künstliche Verzögerungen
      const data = await file.arrayBuffer();
      
      const workbook = XLSX.read(data, { 
        type: 'array',
        cellDates: true,
        cellNF: false,
        cellText: false
      });
      
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
        dateNF: 'dd.mm.yyyy',
        defval: ''
      });
      
      if (!jsonData || jsonData.length === 0) {
        throw new Error('Excel-Datei ist leer oder enthält keine Daten');
      }

      if (jsonData.length < 2) {
        throw new Error('Excel-Datei muss mindestens eine Header-Zeile und eine Datenzeile enthalten');
      }

      // Übergebe Daten sofort - Rest passiert im Dashboard
      onDataLoaded(jsonData as any[][], file.name);
      
      // Reset Upload-State sofort
      setIsLoading(false);
      setEstimatedTime('');
      setCurrentFile(null);
      
    } catch (error) {
      // Verbesserte Fehlermeldungen
      let errorMessage = 'Unbekannter Fehler beim Verarbeiten der Datei';
      
      if (error instanceof Error) {
        if (error.message.includes('zu groß')) {
          errorMessage = error.message; // Verwende die detaillierte Größen-Fehlermeldung
        } else if (error.message.includes('gültige Excel-Datei')) {
          errorMessage = error.message;
        } else if (error.message.includes('keine Arbeitsblätter')) {
          errorMessage = 'Die Excel-Datei enthält keine Arbeitsblätter. Bitte überprüfen Sie die Datei.';
        } else if (error.message.includes('leer')) {
          errorMessage = 'Die Excel-Datei ist leer oder enthält keine Daten.';
        } else if (error.message.includes('mindestens eine Header-Zeile')) {
          errorMessage = 'Die Excel-Datei muss mindestens eine Header-Zeile und eine Datenzeile enthalten.';
        } else {
          errorMessage = `Fehler beim Verarbeiten der Excel-Datei: ${error.message}`;
        }
      }
      
      onError(errorMessage);
      setIsLoading(false);
      setEstimatedTime('');
      setCurrentFile(null);
    }
  }, [onDataLoaded, onError]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm']
    },
    multiple: false,
    disabled: isLoading,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  // Prüfe ob Datei abgelehnt wurde wegen Größe
  const isFileTooLarge = fileRejections.some(rejection => 
    rejection.errors.some(error => error.code === 'file-too-large')
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          bg-gray-800 dark:bg-gray-900 rounded-booking-lg shadow-booking border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 hover:scale-[1.02]
          ${isDragActive && !isDragReject && !isFileTooLarge
            ? 'border-stroer-500 bg-stroer-900/20 shadow-booking-lg' 
            : isDragReject || isFileTooLarge
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
                <div className="spinning-globe">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth={2}/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h20"/>
                  </svg>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-100 dark:text-gray-100 mb-2">
                    Excel-Datei wird verarbeitet...
                  </h2>
                  {currentFile && (
                    <p className="text-sm text-gray-400 dark:text-gray-400 mb-2">
                      {currentFile.name} ({(currentFile.size / (1024 * 1024)).toFixed(1)}MB)
                    </p>
                  )}
                  {estimatedTime && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Geschätzte Zeit: {estimatedTime}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : isDragReject || isFileTooLarge ? (
            <>
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-red-400 dark:text-red-400">
                  {isFileTooLarge ? 'Datei zu groß' : 'Ungültiger Dateityp'}
                </p>
                <p className="text-sm text-red-300 dark:text-red-300">
                  {isFileTooLarge 
                    ? 'Maximale Dateigröße: 50MB. Bitte wählen Sie eine kleinere Datei.'
                    : 'Nur Excel-Dateien (.xlsx, .xls, .xlsm) sind erlaubt'
                  }
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
                    Maximale Dateigröße: 50MB
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
