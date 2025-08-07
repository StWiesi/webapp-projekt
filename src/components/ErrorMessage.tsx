'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onClose: () => void;
}

export default function ErrorMessage({ message, onClose }: ErrorMessageProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Fehler beim Verarbeiten der Datei
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
