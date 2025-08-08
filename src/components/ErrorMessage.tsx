'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onClose: () => void;
}

export default function ErrorMessage({ message, onClose }: ErrorMessageProps) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-booking-lg p-6 shadow-booking">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-red-500 rounded-booking flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-red-800 dark:text-red-200 mb-2">
              Fehler beim Verarbeiten der Datei
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors p-1 rounded-booking hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
