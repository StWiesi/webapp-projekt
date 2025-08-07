'use client';

import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface GermanyMapProps {
  data: any[][];
  filters: {
    network: string[];
    region: string[];
    city: string[];
    site: string[];
    screenIds: string[];
    auctionType: string[];
  };
  columnMapping: {
    date: number;
    cost: number;
    total_impressions: number;
    plays: number;
    auction_wins: number;
    ad_requests: number;
    network: number;
    region: number;
    city: number;
    site: number;
    screenIds: number;
    auctionType: number;
  };
}

export default function GermanyMap({ data, filters, columnMapping }: GermanyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Prüfe ob Google Maps geladen ist
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      initializeMap();
    } else {
      // Lade Google Maps API
      loadGoogleMapsScript();
    }
  }, []);

  const loadGoogleMapsScript = () => {
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return; // Bereits geladen
    }

    const script = document.createElement('script');
    // Für Demo-Zwecke ohne API Key - in Produktion würde ein echter API Key benötigt
    script.src = `https://maps.googleapis.com/maps/api/js?key=&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    // Globale Callback-Funktion
    (window as any).initMap = () => {
      initializeMap();
    };

    script.onerror = () => {
      console.error('Google Maps konnte nicht geladen werden. API Key erforderlich.');
    };

    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    // Deutschland Zentrum
    const germany = { lat: 51.1657, lng: 10.4515 };

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 6,
      center: germany,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry.fill',
          stylers: [{ color: '#f5f5f5' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
        },
        {
          featureType: 'administrative',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#fefefe' }, { lightness: 17 }, { weight: 1.2 }]
        }
      ],
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true
    });

    mapInstanceRef.current = map;

    // TODO: Hier könnten später Marker für Standorte hinzugefügt werden
    // basierend auf den gefilterten Daten
  };

  // Fallback wenn Google Maps nicht verfügbar ist
  if (typeof window !== 'undefined' && !window.google && process.env.NODE_ENV === 'development') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Google Maps Integration
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Für die Kartenansicht ist ein Google Maps API Key erforderlich.
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-left">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              <strong>Setup-Anleitung:</strong><br/>
              1. Google Maps API Key erstellen<br/>
              2. API Key in .env.local hinzufügen<br/>
              3. Maps JavaScript API aktivieren
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          🗺️ Deutschland Übersicht
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Interaktive Karte mit Zoom und Navigation
        </p>
      </div>
      <div 
        ref={mapRef} 
        className="w-full h-96"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}

// Erweitere das Window Interface für TypeScript
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}
