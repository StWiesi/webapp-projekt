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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const processFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setUploadProgress(0);
    setProcessingStep('Datei wird gelesen...');
    setCurrentFile(file);
    
    // Schätze die Verarbeitungszeit basierend auf der Dateigröße
    const fileSizeInMB = file.size / (1024 * 1024);
    // Basis-Zeit für Verzögerungen: 300ms + 400ms + 300ms + 300ms + 200ms + 1500ms = 3 Sekunden
    let estimatedSeconds = Math.max(3, Math.ceil(fileSizeInMB * 0.2)); // 0.2 Sekunden pro MB, mindestens 3 Sekunden
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

      // Verzögerung für bessere UX
      await new Promise(resolve => setTimeout(resolve, 300));
      setUploadProgress(20);
      setProcessingStep('Excel-Datei wird geparst...');
      const data = await file.arrayBuffer();
      
      // Verzögerung für bessere UX
      await new Promise(resolve => setTimeout(resolve, 400));
      setUploadProgress(40);
      setProcessingStep('Daten werden verarbeitet...');
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
      
      // Verzögerung für bessere UX
      await new Promise(resolve => setTimeout(resolve, 300));
      setUploadProgress(60);
      setProcessingStep('Arbeitsblatt wird konvertiert...');
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Konvertiere zu Array von Arrays
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        raw: false,
        dateNF: 'dd.mm.yyyy',
        defval: ''
      });
      
      // Verzögerung für bessere UX
      await new Promise(resolve => setTimeout(resolve, 300));
      setUploadProgress(80);
      setProcessingStep('Daten werden validiert...');
      
      if (!jsonData || jsonData.length === 0) {
        throw new Error('Excel-Datei ist leer oder enthält keine Daten');
      }

      if (jsonData.length < 2) {
        throw new Error('Excel-Datei muss mindestens eine Header-Zeile und eine Datenzeile enthalten');
      }

      // Verzögerung für bessere UX
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadProgress(95);
      setProcessingStep('Daten werden geladen...');
      onDataLoaded(jsonData as any[][], file.name);
      
      setUploadProgress(100);
      setProcessingStep('Fertig!');
      
      // Kurz warten, damit der Benutzer "Fertig!" sehen kann
      setTimeout(() => {
        setIsLoading(false);
        setUploadProgress(0);
        setProcessingStep('');
        setEstimatedTime('');
        setCurrentFile(null);
      }, 1500);
      
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
      setUploadProgress(0);
      setProcessingStep('');
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
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
              <div className="space-y-4 w-full max-w-md">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-100 dark:text-gray-100 mb-2">
                    Excel-Datei wird verarbeitet...
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-400 mb-1">
                    {processingStep}
                  </p>
                  {currentFile && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {currentFile.name} ({(currentFile.size / (1024 * 1024)).toFixed(1)}MB)
                    </p>
                  )}
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-700 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-stroer-500 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                
                {/* Progress Percentage */}
                <div className="text-center">
                  <p className="text-sm font-medium text-stroer-400 dark:text-stroer-400">
                    {uploadProgress}% abgeschlossen
                  </p>
                  {estimatedTime && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Geschätzte Zeit: {estimatedTime}
                    </p>
                  )}
                </div>
                
                {/* Processing Steps */}
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 text-xs ${uploadProgress >= 20 ? 'text-green-400' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${uploadProgress >= 20 ? 'bg-green-400' : 'bg-gray-500'}`} />
                    <span>Datei validiert</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${uploadProgress >= 40 ? 'text-green-400' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${uploadProgress >= 40 ? 'bg-green-400' : 'bg-gray-500'}`} />
                    <span>Excel geparst</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${uploadProgress >= 60 ? 'text-green-400' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${uploadProgress >= 60 ? 'bg-green-400' : 'bg-gray-500'}`} />
                    <span>Daten konvertiert</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${uploadProgress >= 80 ? 'text-green-400' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${uploadProgress >= 80 ? 'bg-green-400' : 'bg-gray-500'}`} />
                    <span>Daten validiert</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${uploadProgress >= 100 ? 'text-green-400' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${uploadProgress >= 100 ? 'bg-green-400' : 'bg-gray-500'}`} />
                    <span>Fertig geladen</span>
                  </div>
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
