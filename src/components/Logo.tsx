'use client';

import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function Logo({ className = '', showText = true }: LogoProps) {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Versuche verschiedene Bildformate
  const logoFormats = [
    '/logo.png',
    '/logo.jpg', 
    '/logo.jpeg',
    '/logo.svg',
    '/logo.webp'
  ];

  const [currentFormatIndex, setCurrentFormatIndex] = useState(0);

  const handleImageError = () => {
    console.error(`Logo konnte nicht geladen werden: ${logoFormats[currentFormatIndex]}`);
    
    // Versuche nächstes Format
    if (currentFormatIndex < logoFormats.length - 1) {
      setCurrentFormatIndex(currentFormatIndex + 1);
    } else {
      setLogoError(true);
    }
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Logo - versucht verschiedene Formate */}
      <div className="w-32 h-32 flex-shrink-0">
        {!logoError ? (
          <img 
            src={logoFormats[currentFormatIndex]}
            alt="Logo" 
            className="w-full h-full object-contain"
            onLoad={() => {
              console.log(`Logo erfolgreich geladen: ${logoFormats[currentFormatIndex]}`);
              setLogoLoaded(true);
            }}
            onError={handleImageError}
          />
        ) : (
          // Fallback Icon wenn kein Logo geladen werden kann
          <div className="w-32 h-32 bg-stroer-500 rounded-booking flex items-center justify-center">
            <span className="text-white font-bold text-4xl">A</span>
          </div>
        )}
      </div>
      
      {/* Text */}
      {showText && (
        <h1 className="text-2xl font-bold text-stroer-500">
          Analytics
        </h1>
      )}
    </div>
  );
}
