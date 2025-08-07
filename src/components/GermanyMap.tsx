'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';

interface GermanyMapProps {
  data: any[];
  filters: {
    network: string[];
    region: string[];
    city: string[];
    site: string[];
    screenIds: string[];
    auctionType: string[];
  };
  selectedMetric?: string;
  onMetricChange?: (metric: string) => void;
}

type MapLevel = 'region' | 'city' | 'site';
type MetricType = 'cost' | 'total_impressions' | 'plays' | 'auction_wins' | 'ad_requests' | 'coverage' | 'play_rate';

interface LocationData {
  name: string;
  count: number;
  metrics: {
    cost: number;
    total_impressions: number;
    plays: number;
    auction_wins: number;
    ad_requests: number;
    coverage: number;
    play_rate: number;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const METRIC_OPTIONS: { value: MetricType; label: string; color: string }[] = [
  { value: 'cost', label: 'Außenumsatz', color: '#ef4444' },
  { value: 'total_impressions', label: 'Impressions', color: '#3b82f6' },
  { value: 'plays', label: 'Plays', color: '#10b981' },
  { value: 'auction_wins', label: 'Scheduled Plays', color: '#f59e0b' },
  { value: 'ad_requests', label: 'Ad Requests', color: '#8b5cf6' },
  { value: 'coverage', label: 'Coverage', color: '#06b6d4' },
  { value: 'play_rate', label: 'Play Rate', color: '#84cc16' }
];

// Google Maps Interface erweitern
declare global {
  interface Window {
    google: any;
  }
}

export default function GermanyMap({ data, filters, selectedMetric, onMetricChange }: GermanyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const dataLayerRef = useRef<any>(null);
  const circlesRef = useRef<any[]>([]);
  const [mapLevel, setMapLevel] = useState<MapLevel>('region');
  const [localSelectedMetric, setLocalSelectedMetric] = useState<MetricType>('cost');
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(6);

  const currentMetric = (selectedMetric || localSelectedMetric) as MetricType;

  // Lade GeoJSON-Daten
  useEffect(() => {
    const loadGeoJsonData = async () => {
      try {
        setIsLoading(true);
        const geoJsonUrl = mapLevel === 'region' 
          ? '/geojson/bundeslaender.geojson'
          : '/geojson/grosse-staedte.geojson';
        
        const response = await fetch(geoJsonUrl);
        const data = await response.json();
        setGeoJsonData(data);
      } catch (error) {
        console.error('Fehler beim Laden der GeoJSON-Daten:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGeoJsonData();
  }, [mapLevel]);

  // Extrahiere Standorte aus den Daten
  const locationsData = useMemo((): LocationData[] => {
    if (!data.length) return [];

    console.log('Raw data for map:', data.slice(0, 3)); // Debug

    const filteredData = data.filter(item => {
      return (
        (!filters.network.length || filters.network.includes(item.network)) &&
        (!filters.region.length || filters.region.includes(item.region)) &&
        (!filters.city.length || filters.city.includes(item.city)) &&
        (!filters.site.length || filters.site.includes(item.site)) &&
        (!filters.screenIds.length || filters.screenIds.includes(item.screenId)) &&
        (!filters.auctionType.length || filters.auctionType.includes(item.auctionType))
      );
    });

    console.log('Filtered data for map:', filteredData.slice(0, 3)); // Debug

    const groupedData = filteredData.reduce((acc, item) => {
      let key: string;
      if (mapLevel === 'region') {
        key = item.region;
      } else if (mapLevel === 'city') {
        key = item.city;
      } else if (mapLevel === 'site') {
        key = item.site;
      } else {
        return acc;
      }
      
      if (!key) return acc;

      if (!acc[key]) {
        acc[key] = {
          name: key,
          count: 0,
          metrics: {
            cost: 0,
            total_impressions: 0,
            plays: 0,
            auction_wins: 0,
            ad_requests: 0,
            coverage: 0,
            play_rate: 0
          },
          // Für Sites: Koordinaten speichern
          coordinates: mapLevel === 'site' ? {
            lat: parseFloat(item.latitude) || 0,
            lng: parseFloat(item.longitude) || 0
          } : undefined
        };
      }

      acc[key].count++;
      acc[key].metrics.cost += parseFloat(item.cost) || 0;
      acc[key].metrics.total_impressions += parseInt(item.total_impressions) || 0;
      acc[key].metrics.plays += parseInt(item.plays) || 0;
      acc[key].metrics.auction_wins += parseInt(item.auction_wins) || 0;
      acc[key].metrics.ad_requests += parseInt(item.ad_requests) || 0;

      return acc;
    }, {} as Record<string, LocationData>);

    const result = Object.values(groupedData).map(location => {
      const loc = location as LocationData;
      return {
        ...loc,
        metrics: {
          ...loc.metrics,
          coverage: loc.metrics.ad_requests > 0 ? (loc.metrics.plays / loc.metrics.ad_requests) * 100 : 0,
          play_rate: loc.metrics.auction_wins > 0 ? (loc.metrics.plays / loc.metrics.auction_wins) * 100 : 0
        }
      };
    });

    console.log('Processed locations data:', result); // Debug
    return result;
  }, [data, filters, mapLevel]);

  // Hilfsfunktionen für Metriken
  const getMetricValue = (location: LocationData, metric: MetricType): number => {
    return location.metrics[metric] || 0;
  };

  const getColorIntensity = (value: number, maxValue: number): number => {
    if (maxValue === 0) return 0.1;
    return Math.max(0.1, Math.min(0.9, value / maxValue));
  };

  const formatMetricValue = (value: number): string => {
    if (currentMetric === 'cost') return `€${value.toFixed(2)}`;
    if (currentMetric === 'total_impressions') return value.toLocaleString();
    if (currentMetric === 'plays') return value.toLocaleString();
    if (currentMetric === 'auction_wins') return value.toLocaleString();
    if (currentMetric === 'ad_requests') return value.toLocaleString();
    if (currentMetric === 'coverage') return `${value.toFixed(2)}%`;
    if (currentMetric === 'play_rate') return `${value.toFixed(2)}%`;
    return value.toString();
  };

  // Berechne Kreisgröße basierend auf Zoom und Metrikwert
  const calculateCircleRadius = (metricValue: number, maxValue: number, zoom: number): number => {
    // Basis-Größe: 3-20 km je nach Metrikwert
    const baseSize = maxValue > 0 ? Math.max(3, Math.min(20, (metricValue / maxValue) * 17 + 3)) : 3;
    
    // Zoom-Faktor: Linear für bessere Kontrolle
    let zoomFactor: number;
    if (zoom <= 4) {
      zoomFactor = 0.3; // Sehr klein bei niedrigem Zoom
    } else if (zoom <= 6) {
      zoomFactor = 0.5 + (zoom - 4) * 0.25; // 0.5 bis 1.0
    } else if (zoom <= 8) {
      zoomFactor = 1.0 + (zoom - 6) * 0.5; // 1.0 bis 2.0
    } else if (zoom <= 10) {
      zoomFactor = 2.0 + (zoom - 8) * 1.0; // 2.0 bis 4.0
    } else {
      zoomFactor = 4.0 + (zoom - 10) * 1.5; // 4.0+ für hohe Zooms
    }
    
    return baseSize * zoomFactor * 1000; // Konvertiere zu Metern
  };

  // Erstelle Google Maps mit Data Layer oder Kreisen
  const createGoogleMap = () => {
    if (!mapRef.current || !window.google) return;

    // Lösche vorherige Karte und Kreise
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
    }
    
    // Lösche alle vorherigen Kreise
    circlesRef.current.forEach(circle => {
      circle.setMap(null);
    });
    circlesRef.current = [];

    // Erstelle neue Karte
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 51.1657, lng: 10.4515 },
      zoom: 6,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'administrative',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#c9c9c9' }]
        },
        {
          featureType: 'landscape',
          elementType: 'geometry',
          stylers: [{ color: '#f5f5f5' }]
        }
      ]
    });

    mapInstanceRef.current = map;

    // Zoom-Events für Kreisgrößen-Anpassung
    map.addListener('zoom_changed', () => {
      const newZoom = map.getZoom();
      setCurrentZoom(newZoom);
      
      // Aktualisiere Kreisgrößen wenn Kreise vorhanden sind
      if (circlesRef.current.length > 0) {
        circlesRef.current.forEach(circle => {
          const metricValue = circle.metricValue;
          const maxValue = circle.maxValue;
          const newRadius = calculateCircleRadius(metricValue, maxValue, newZoom);
          circle.setRadius(newRadius);
        });
      }
    });

    // Berechne Max-Werte für Farbintensität und Größe
    const maxValues = METRIC_OPTIONS.reduce((acc, metric) => {
      acc[metric.value] = Math.max(...locationsData.map(loc => getMetricValue(loc, metric.value)));
      return acc;
    }, {} as Record<MetricType, number>);

    if (mapLevel === 'region') {
      // Für Bundesländer: GeoJSON Data Layer verwenden
      if (!geoJsonData) return;

      const dataLayer = new window.google.maps.Data();
      dataLayer.setMap(map);

      // Füge GeoJSON-Daten hinzu
      dataLayer.addGeoJson(geoJsonData);

      // Styling für jedes Feature
      dataLayer.setStyle((feature: any) => {
        const featureName = feature.getProperty('name') || feature.getProperty('NAME_1') || feature.getProperty('GEN');
        const locationData = locationsData.find(loc => 
          loc.name.toLowerCase() === featureName?.toLowerCase()
        );

        if (!locationData) {
          return {
            fillColor: '#e5e7eb',
            fillOpacity: 0.1,
            strokeColor: '#9ca3af',
            strokeWeight: 1,
            strokeOpacity: 0.5
          };
        }

        const metricValue = getMetricValue(locationData, currentMetric);
        const intensity = getColorIntensity(metricValue, maxValues[currentMetric]);
        const metricInfo = METRIC_OPTIONS.find(m => m.value === currentMetric);

        return {
          fillColor: metricInfo?.color || '#3b82f6',
          fillOpacity: 0.4 + intensity * 0.6,
          strokeColor: metricInfo?.color || '#3b82f6',
          strokeWeight: 2,
          strokeOpacity: 1.0
        };
      });

      // Click-Events für Features
      dataLayer.addListener('click', (event: any) => {
        const feature = event.feature;
        const featureName = feature.getProperty('name') || feature.getProperty('NAME_1') || feature.getProperty('GEN');
        const locationData = locationsData.find(loc => 
          loc.name.toLowerCase() === featureName?.toLowerCase()
        );

        if (locationData) {
        const metricInfo = METRIC_OPTIONS.find(m => m.value === currentMetric);
        const metricValue = getMetricValue(locationData, currentMetric);

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; min-width: 250px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              <h3 style="margin: 0 0 12px 0; font-weight: bold; font-size: 16px; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">${locationData.name}</h3>
              <p style="margin: 8px 0; font-size: 14px; color: #374151;"><strong style="color: #1f2937;">${metricInfo?.label}:</strong> <span style="color: #059669; font-weight: 600;">${formatMetricValue(metricValue)}</span></p>
              <p style="margin: 8px 0; font-size: 14px; color: #374151;"><strong style="color: #1f2937;">Datensätze:</strong> <span style="color: #059669; font-weight: 600;">${locationData.count}</span></p>
              <p style="margin: 8px 0; font-size: 14px; color: #374151;"><strong style="color: #1f2937;">Außenumsatz:</strong> <span style="color: #dc2626; font-weight: 600;">€${(locationData.metrics.cost / 1000).toFixed(0)}k</span></p>
              <p style="margin: 8px 0; font-size: 14px; color: #374151;"><strong style="color: #1f2937;">Impressions:</strong> <span style="color: #2563eb; font-weight: 600;">${(locationData.metrics.total_impressions / 1000).toFixed(0)}k</span></p>
            </div>
          `,
          position: event.latLng
        });

        infoWindow.open(map);
      }
    });

    dataLayerRef.current = dataLayer;
  } else {
    // Für Städte und Sites: Kreise verwenden
    const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
      'Berlin': { lat: 52.5200, lng: 13.4050 },
      'Hamburg': { lat: 53.5511, lng: 9.9937 },
      'München': { lat: 48.1351, lng: 11.5820 },
      'Köln': { lat: 50.9375, lng: 6.9603 },
      'Frankfurt': { lat: 50.1109, lng: 8.6821 },
      'Stuttgart': { lat: 48.7758, lng: 9.1829 },
      'Düsseldorf': { lat: 51.2277, lng: 6.7735 },
      'Dortmund': { lat: 51.5136, lng: 7.4653 },
      'Essen': { lat: 51.4556, lng: 7.0116 },
      'Leipzig': { lat: 51.3397, lng: 12.3731 },
      'Bremen': { lat: 53.0793, lng: 8.8017 },
      'Dresden': { lat: 51.0504, lng: 13.7373 },
      'Hannover': { lat: 52.3759, lng: 9.7320 },
      'Nürnberg': { lat: 49.4521, lng: 11.0767 },
      'Duisburg': { lat: 51.4344, lng: 6.7623 },
      'Bochum': { lat: 51.4818, lng: 7.2162 },
      'Wuppertal': { lat: 51.2562, lng: 7.1508 },
      'Bielefeld': { lat: 52.0302, lng: 8.5325 },
      'Bonn': { lat: 50.7374, lng: 7.0982 },
      'Münster': { lat: 51.9607, lng: 7.6261 }
    };

    // Erstelle Kreise für jeden Standort
    locationsData.forEach(locationData => {
      let coordinates: { lat: number; lng: number } | null = null;

      if (mapLevel === 'site' && locationData.coordinates) {
        // Für Sites: Verwende Koordinaten aus den Daten
        coordinates = locationData.coordinates;
      } else if (mapLevel === 'city') {
        // Für Städte: Verwende vordefinierte Koordinaten
        coordinates = cityCoordinates[locationData.name];
      }

      if (!coordinates) return;

      const metricValue = getMetricValue(locationData, currentMetric);
      const maxValue = maxValues[currentMetric];
      const radius = calculateCircleRadius(metricValue, maxValue, currentZoom);
      const metricInfo = METRIC_OPTIONS.find(m => m.value === currentMetric);

      // Erstelle Kreis
      const circle = new window.google.maps.Circle({
        strokeColor: metricInfo?.color || '#3b82f6',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: metricInfo?.color || '#3b82f6',
        fillOpacity: 0.4,
        map: map,
        center: coordinates,
        radius: radius
      });

      // Speichere Metrik-Werte für Zoom-Updates
      circle.metricValue = metricValue;
      circle.maxValue = maxValue;

      // Click-Event für Kreis
      circle.addListener('click', () => {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; min-width: 250px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              <h3 style="margin: 0 0 12px 0; font-weight: bold; font-size: 16px; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">${locationData.name}</h3>
              <p style="margin: 8px 0; font-size: 14px; color: #374151;"><strong style="color: #1f2937;">${metricInfo?.label}:</strong> <span style="color: #059669; font-weight: 600;">${formatMetricValue(metricValue)}</span></p>
              <p style="margin: 8px 0; font-size: 14px; color: #374151;"><strong style="color: #1f2937;">Datensätze:</strong> <span style="color: #059669; font-weight: 600;">${locationData.count}</span></p>
              <p style="margin: 8px 0; font-size: 14px; color: #374151;"><strong style="color: #1f2937;">Außenumsatz:</strong> <span style="color: #dc2626; font-weight: 600;">€${(locationData.metrics.cost / 1000).toFixed(0)}k</span></p>
              <p style="margin: 8px 0; font-size: 14px; color: #374151;"><strong style="color: #1f2937;">Impressions:</strong> <span style="color: #2563eb; font-weight: 600;">${(locationData.metrics.total_impressions / 1000).toFixed(0)}k</span></p>
            </div>
          `,
          position: coordinates
        });

        infoWindow.open(map);
      });

      // Speichere Kreis in Referenz für Zoom-Updates
      circlesRef.current.push(circle);
    });
  }
};

  // Initialisiere Karte
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && !isLoading) {
      createGoogleMap();
    }
  }, [geoJsonData, locationsData, currentMetric, mapLevel, isLoading]);

  // Google Maps Script laden
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (!isLoading) {
          createGoogleMap();
        }
      };
      document.head.appendChild(script);
    }
  }, [isLoading]);

  const handleMetricChange = (metric: MetricType) => {
    setLocalSelectedMetric(metric);
    onMetricChange?.(metric);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Lade Karte...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Karten-Level
          </label>
          <select
            value={mapLevel}
            onChange={(e) => setMapLevel(e.target.value as MapLevel)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900 font-medium"
          >
            <option value="region">Bundesländer</option>
            <option value="city">Städte</option>
            <option value="site">Sites</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Metrik für Farbkodierung
          </label>
          <select
            value={currentMetric}
            onChange={(e) => handleMetricChange(e.target.value as MetricType)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900 font-medium"
          >
            {METRIC_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Legende:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span>Niedrig</span>
          </div>
          <div className="flex items-center gap-1">
            <div 
              className="w-4 h-4 rounded" 
              style={{ backgroundColor: METRIC_OPTIONS.find(m => m.value === currentMetric)?.color || '#3b82f6' }}
            ></div>
            <span>Hoch</span>
          </div>
        </div>
      </div>

      <div 
        ref={mapRef} 
        className="w-full h-[800px] rounded-lg border border-gray-200"
      />
    </div>
  );
}
