'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapPin, BarChart3, Globe } from 'lucide-react';

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
  { value: 'cost', label: 'Außenumsatz', color: '#FF6B00' },
  { value: 'total_impressions', label: 'Impressions', color: '#003366' },
  { value: 'plays', label: 'Plays', color: '#00a699' },
  { value: 'auction_wins', label: 'Scheduled Plays', color: '#ffb020' },
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
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const scriptLoadedRef = useRef(false);

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
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setGeoJsonData(data);
      } catch (error) {
        console.error('Fehler beim Laden der GeoJSON-Daten:', error);
        setGeoJsonData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadGeoJsonData();
  }, [mapLevel]);

  // Extrahiere Standorte aus den Daten
  const locationsData = useMemo((): LocationData[] => {
    if (!data.length) return [];

    console.log('=== START DATA PROCESSING ===');
    console.log('Raw data sample:', data.slice(0, 3));

    // Gruppiere Daten nach Standort
    const locationGroups = new Map<string, LocationData>();

    data.forEach((item, index) => {
      let locationName = '';
      
      // Bestimme Standort basierend auf Map-Level
      if (mapLevel === 'region') {
        locationName = item.region || item.bundesland || item.Region || item.Bundesland || 'Unbekannt';
      } else if (mapLevel === 'city') {
        locationName = item.city || item.stadt || item.City || item.Stadt || 'Unbekannt';
      } else if (mapLevel === 'site') {
        locationName = item.site || item.website || item.Site || item.Website || 'Unbekannt';
      }

      // Debug: Zeige die ersten 5 Datensätze
      if (index < 5) {
        console.log(`Data item ${index}:`, {
          city: item.city,
          stadt: item.stadt,
          City: item.City,
          Stadt: item.Stadt,
          extractedLocationName: locationName,
          mapLevel
        });
      }

      if (!locationName || locationName === 'Unbekannt') {
        if (index < 5) {
          console.log(`Skipping item ${index} - no valid location name`);
        }
        return;
      }

      // Filtere basierend auf ausgewählten Filtern
      if (filters.network.length > 0 && !filters.network.includes(item.network || '')) return;
      if (filters.region.length > 0 && !filters.region.includes(item.region || item.bundesland || item.Region || item.Bundesland || '')) return;
      if (filters.city.length > 0 && !filters.city.includes(item.city || item.stadt || item.City || item.Stadt || '')) return;
      if (filters.site.length > 0 && !filters.site.includes(item.site || item.website || item.Site || item.Website || '')) return;
      if (filters.screenIds.length > 0 && !filters.screenIds.includes(item.screenIds || '')) return;
      if (filters.auctionType.length > 0 && !filters.auctionType.includes(item.auctionType || '')) return;

      if (!locationGroups.has(locationName)) {
        locationGroups.set(locationName, {
          name: locationName,
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
          coordinates: item.latitude && item.longitude ? {
            lat: parseFloat(item.latitude),
            lng: parseFloat(item.longitude)
          } : undefined
        });
      }

      const location = locationGroups.get(locationName)!;
      location.count++;

      // Summiere Metriken
      if (item.cost) location.metrics.cost += parseFloat(item.cost) || 0;
      if (item.total_impressions) location.metrics.total_impressions += parseFloat(item.total_impressions) || 0;
      if (item.plays) location.metrics.plays += parseFloat(item.plays) || 0;
      if (item.auction_wins) location.metrics.auction_wins += parseFloat(item.auction_wins) || 0;
      if (item.ad_requests) location.metrics.ad_requests += parseFloat(item.ad_requests) || 0;
    });

    // Berechne abgeleitete Metriken
    locationGroups.forEach(location => {
      location.metrics.coverage = location.metrics.ad_requests > 0 
        ? (location.metrics.plays / location.metrics.ad_requests) * 100 
        : 0;
      location.metrics.play_rate = location.metrics.auction_wins > 0 
        ? (location.metrics.plays / location.metrics.auction_wins) * 100 
        : 0;
    });

    const result = Array.from(locationGroups.values());
    
    console.log('=== PROCESSING RESULTS ===');
    console.log(`Map level: ${mapLevel}`);
    console.log(`Total data items: ${data.length}`);
    console.log(`Processed locations: ${result.length}`);
    console.log('All processed locations:', result.map(loc => ({
      name: loc.name,
      count: loc.count,
      cost: loc.metrics.cost,
      hasCoordinates: !!loc.coordinates
    })));
    console.log('=== END DATA PROCESSING ===');

    return result;
  }, [data, mapLevel, filters]);

  // Hilfsfunktion für Bundesland-Namen-Normalisierung
  const normalizeBundeslandName = (name: string): string => {
    const nameMap: { [key: string]: string } = {
      'baden-württemberg': 'Baden-Württemberg',
      'bayern': 'Bayern',
      'berlin': 'Berlin',
      'brandenburg': 'Brandenburg',
      'bremen': 'Bremen',
      'hamburg': 'Hamburg',
      'hessen': 'Hessen',
      'mecklenburg-vorpommern': 'Mecklenburg-Vorpommern',
      'niedersachsen': 'Niedersachsen',
      'nordrhein-westfalen': 'Nordrhein-Westfalen',
      'rheinland-pfalz': 'Rheinland-Pfalz',
      'saarland': 'Saarland',
      'sachsen': 'Sachsen',
      'sachsen-anhalt': 'Sachsen-Anhalt',
      'schleswig-holstein': 'Schleswig-Holstein',
      'thüringen': 'Thüringen',
      // Alternative Schreibweisen
      'baden wuerttemberg': 'Baden-Württemberg',
      'nordrhein westfalen': 'Nordrhein-Westfalen',
      'sachsen anhalt': 'Sachsen-Anhalt',
      'schleswig holstein': 'Schleswig-Holstein',
      'thueringen': 'Thüringen'
    };
    
    const normalized = name.toLowerCase().trim();
    return nameMap[normalized] || name;
  };

  // Hilfsfunktion für Stadt-Namen-Normalisierung
  const normalizeCityName = (name: string): string => {
    const nameMap: { [key: string]: string } = {
      'berlin': 'Berlin',
      'hamburg': 'Hamburg',
      'münchen': 'München',
      'muenchen': 'München',
      'köln': 'Köln',
      'koeln': 'Köln',
      'frankfurt': 'Frankfurt',
      'stuttgart': 'Stuttgart',
      'düsseldorf': 'Düsseldorf',
      'duesseldorf': 'Düsseldorf',
      'dortmund': 'Dortmund',
      'essen': 'Essen',
      'leipzig': 'Leipzig',
      'bremen': 'Bremen',
      'dresden': 'Dresden',
      'hannover': 'Hannover',
      'nürnberg': 'Nürnberg',
      'nuernberg': 'Nürnberg',
      'duisburg': 'Duisburg',
      'bochum': 'Bochum',
      'wuppertal': 'Wuppertal',
      'bielefeld': 'Bielefeld',
      'bonn': 'Bonn',
      'mannheim': 'Mannheim',
      'karlsruhe': 'Karlsruhe',
      'wiesbaden': 'Wiesbaden',
      'gelsenkirchen': 'Gelsenkirchen',
      'münster': 'Münster',
      'muenster': 'Münster',
      'aachen': 'Aachen',
      'braunschweig': 'Braunschweig',
      'chemnitz': 'Chemnitz',
      'kiel': 'Kiel',
      'halle': 'Halle',
      'magdeburg': 'Magdeburg',
      'freiburg': 'Freiburg',
      'krefeld': 'Krefeld',
      'lübeck': 'Lübeck',
      'luebeck': 'Lübeck',
      'oberhausen': 'Oberhausen',
      'erfurt': 'Erfurt',
      'mainz': 'Mainz',
      'rostock': 'Rostock',
      'kassel': 'Kassel',
      'potsdam': 'Potsdam',
      'hagen': 'Hagen',
      'mülheim': 'Mülheim',
      'muelheim': 'Mülheim',
      'ludwigshafen': 'Ludwigshafen',
      'leverkusen': 'Leverkusen',
      'oldenburg': 'Oldenburg',
      'osnabrück': 'Osnabrück',
      'osnabrueck': 'Osnabrück',
      'solingen': 'Solingen',
      'heidelberg': 'Heidelberg',
      'herne': 'Herne',
      'neuss': 'Neuss',
      'darmstadt': 'Darmstadt',
      'paderborn': 'Paderborn',
      'regensburg': 'Regensburg',
      'ingolstadt': 'Ingolstadt',
      'würzburg': 'Würzburg',
      'wuerzburg': 'Würzburg',
      'fürth': 'Fürth',
      'fuerth': 'Fürth',
      'wolfsburg': 'Wolfsburg',
      'offenbach': 'Offenbach',
      'ulm': 'Ulm',
      'heilbronn': 'Heilbronn',
      'pforzheim': 'Pforzheim',
      'göttingen': 'Göttingen',
      'goettingen': 'Göttingen',
      'bottrop': 'Bottrop',
      'trier': 'Trier',
      'reutlingen': 'Reutlingen',
      'bremerhaven': 'Bremerhaven',
      'koblenz': 'Koblenz',
      'bergisch gladbach': 'Bergisch Gladbach',
      'jena': 'Jena',
      'erlangen': 'Erlangen',
      'moers': 'Moers',
      'siegen': 'Siegen',
      'hildesheim': 'Hildesheim',
      'salzgitter': 'Salzgitter'
    };
    
    const normalized = name.toLowerCase().trim();
    return nameMap[normalized] || name;
  };

  const getMetricValue = (location: LocationData, metric: MetricType): number => {
    return location.metrics[metric] || 0;
  };

  const getColorIntensity = (value: number, maxValue: number): number => {
    if (maxValue === 0) return 0;
    return Math.min(value / maxValue, 1);
  };

  const formatMetricValue = (value: number): string => {
    if (currentMetric === 'cost') {
      return new Intl.NumberFormat('de-DE', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    } else if (currentMetric === 'coverage' || currentMetric === 'play_rate') {
      return `${value.toFixed(1)}%`;
    } else {
      return new Intl.NumberFormat('de-DE').format(Math.round(value));
    }
  };

  const generateTooltipContent = (locationData: LocationData, metricValue: number): string => {
    const metricInfo = METRIC_OPTIONS.find(m => m.value === currentMetric);
    const formattedValue = formatMetricValue(metricValue);
    
    let content = `
      <div style="padding: 8px; font-family: Arial, sans-serif; min-width: 200px;">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #111827;">
          ${locationData.name}
        </div>
        <div style="margin-bottom: 4px;">
          <span style="color: #6b7280;">${metricInfo?.label}:</span>
          <span style="font-weight: bold; color: #111827; margin-left: 8px;">
            ${formattedValue}
          </span>
        </div>
        <div style="margin-bottom: 4px;">
          <span style="color: #6b7280;">Datensätze:</span>
          <span style="font-weight: bold; color: #111827; margin-left: 8px;">
            ${locationData.count}
          </span>
        </div>
    `;

    // Zeige zusätzliche Metriken für Kontext
    if (currentMetric !== 'cost' && locationData.metrics.cost > 0) {
      content += `
        <div style="margin-bottom: 4px;">
          <span style="color: #6b7280;">Außenumsatz:</span>
          <span style="font-weight: bold; color: #111827; margin-left: 8px;">
            ${formatMetricValue(locationData.metrics.cost)}
          </span>
        </div>
      `;
    }

    if (currentMetric !== 'plays' && locationData.metrics.plays > 0) {
      content += `
        <div style="margin-bottom: 4px;">
          <span style="color: #6b7280;">Plays:</span>
          <span style="font-weight: bold; color: #111827; margin-left: 8px;">
            ${formatMetricValue(locationData.metrics.plays)}
          </span>
        </div>
      `;
    }

    content += '</div>';
    return content;
  };

  const calculateCircleRadius = (metricValue: number, maxValue: number, zoom: number): number => {
    if (maxValue === 0) return 100; // Mindestgröße drastisch erhöht
    
    // Sehr große, feste Basis-Größen für bessere Sichtbarkeit
    const baseRadius = mapLevel === 'region' ? 100 : 80;
    const maxRadius = mapLevel === 'region' ? 300 : 250;
    
    // Berechne Intensität basierend auf Metrikwert
    const intensity = getColorIntensity(metricValue, maxValue);
    const baseRadiusWithIntensity = baseRadius + (intensity * (maxRadius - baseRadius));
    
    // Extrem hohe Zoom-Faktoren für bessere Sichtbarkeit bei niedrigem Zoom
    let zoomFactor: number;
    if (zoom <= 4) {
      zoomFactor = 8.0; // Drastisch erhöht für Übersicht
    } else if (zoom <= 6) {
      zoomFactor = 10.0 + (zoom - 4) * 3.0; // 10.0 - 16.0
    } else if (zoom <= 8) {
      zoomFactor = 16.0 + (zoom - 6) * 4.0; // 16.0 - 24.0
    } else if (zoom <= 10) {
      zoomFactor = 24.0 + (zoom - 8) * 6.0; // 24.0 - 36.0
    } else {
      zoomFactor = 36.0 + (zoom - 10) * 8.0; // 36.0+
    }
    
    // Sehr hohe Mindestgröße für bessere Sichtbarkeit
    const minRadius = mapLevel === 'region' ? 60 : 50;
    const calculatedRadius = baseRadiusWithIntensity * zoomFactor;
    
    return Math.max(minRadius, Math.min(calculatedRadius, 1000));
  };

  const createGoogleMap = useCallback(() => {
    if (!mapRef.current || !geoJsonData || !googleLoaded) return;

    // Bei Level-Änderungen: Reset Zoom und Zentrum
    const defaultZoom = 6; // Deutschland-Übersicht
    const defaultCenter = { lat: 51.1657, lng: 10.4515 }; // Deutschland Zentrum

    console.log(`Creating map for level: ${mapLevel} with default zoom: ${defaultZoom}`);

    // Berechne Maximalwerte für Farbintensität
    const maxMetricValue = Math.max(...locationsData.map(loc => getMetricValue(loc, currentMetric)));

    // Erstelle Karte
    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter, // Immer Deutschland-Zentrum bei Level-Änderung
      zoom: defaultZoom, // Immer Standard-Zoom bei Level-Änderung
      // Verbessere Zoom-Kontrollen
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_BOTTOM
      },
      // Aktiviere alle Zoom-Methoden mit korrektem Verhalten
      gestureHandling: 'greedy', // Erlaubt Zoom überall, auch über Markern
      scrollwheel: true,
      disableDoubleClickZoom: false,
      // Wichtig: Erlaube freie Navigation
      restriction: null,
      // Erlaube alle Zoom-Levels
      minZoom: 4,
      maxZoom: 18,
      styles: [
        {
          featureType: 'administrative',
          elementType: 'geometry',
          stylers: [{ visibility: 'simplified' }]
        },
        {
          featureType: 'landscape',
          stylers: [{ color: '#f8fafc' }]
        },
        {
          featureType: 'water',
          stylers: [{ color: '#e0f2fe' }]
        },
        {
          featureType: 'road',
          stylers: [{ visibility: 'simplified' }]
        }
      ]
    });

    mapInstanceRef.current = map;

    // Zoom-Change Event mit Kreis-Updates
    map.addListener('zoom_changed', () => {
      const newZoom = map.getZoom();
      setCurrentZoom(newZoom);
      
      // Aktualisiere Kreisgrößen basierend auf neuem Zoom
      circlesRef.current.forEach(circle => {
        const location = circle.locationData;
        if (location) {
          const metricValue = getMetricValue(location, currentMetric);
          const newRadius = calculateCircleRadius(metricValue, maxMetricValue, newZoom);
          circle.setRadius(newRadius);
        }
      });
    });

    // Zusätzlich: Center-Change Event für bessere Navigation
    map.addListener('center_changed', () => {
      const newCenter = map.getCenter();
      console.log('Map center changed to:', newCenter?.lat(), newCenter?.lng());
    });

    // Zeichne GeoJSON
    if (dataLayerRef.current) {
      dataLayerRef.current.setMap(null);
    }

    dataLayerRef.current = new window.google.maps.Data();
    
    try {
      dataLayerRef.current.addGeoJson(geoJsonData);
    } catch (error) {
      console.error('Error adding GeoJSON to map:', error);
      return;
    }

    if (mapLevel === 'region') {
      // Bundesländer-Einfärbung
      dataLayerRef.current.setStyle((feature: any) => {
        const featureName = feature.getProperty('name') || feature.getProperty('NAME_1') || feature.getProperty('GEN') || feature.getProperty('NAME');
        
        const locationData = locationsData.find(loc => {
          const locName = loc.name.toLowerCase();
          const featName = featureName?.toLowerCase();
          
          if (locName === featName) return true;
          if (locName.includes(featName) || featName?.includes(locName)) return true;
          
          const alternatives = {
            'baden-württemberg': ['baden wuerttemberg', 'baden-wuerttemberg'],
            'bayern': ['bavaria'],
            'nordrhein-westfalen': ['nordrhein westfalen', 'nrw'],
            'sachsen-anhalt': ['sachsen anhalt'],
            'schleswig-holstein': ['schleswig holstein'],
            'thüringen': ['thueringen', 'thuringia'],
            'rheinland-pfalz': ['rheinland pfalz'],
            'mecklenburg-vorpommern': ['mecklenburg vorpommern']
          };
          
          for (const [standard, alts] of Object.entries(alternatives)) {
            if ((locName === standard && alts.includes(featName)) || 
                (featName === standard && alts.includes(locName))) {
              return true;
            }
          }
          
          return false;
        });

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
        const intensity = getColorIntensity(metricValue, maxMetricValue);
        const metricInfo = METRIC_OPTIONS.find(m => m.value === currentMetric);

        return {
          fillColor: metricInfo?.color || '#FF6B00',
          fillOpacity: 0.3 + intensity * 0.7,
          strokeColor: metricInfo?.color || '#FF6B00',
          strokeWeight: 2,
          strokeOpacity: 1.0
        };
      });

      // Click-Events für Bundesländer
      dataLayerRef.current.addListener('click', (event: any) => {
        const feature = event.feature;
        const featureName = feature.getProperty('name') || feature.getProperty('NAME_1') || feature.getProperty('GEN') || feature.getProperty('NAME');
        
        const locationData = locationsData.find(loc => {
          const locName = loc.name.toLowerCase();
          const featName = featureName?.toLowerCase();
          return locName === featName || locName.includes(featName) || featName?.includes(locName);
        });

        if (locationData) {
          const metricInfo = METRIC_OPTIONS.find(m => m.value === currentMetric);
          const metricValue = getMetricValue(locationData, currentMetric);

          const infoWindow = new window.google.maps.InfoWindow({
            content: generateTooltipContent(locationData, metricValue),
            position: event.latLng
          });

          infoWindow.open(map);
        }
      });
    } else {
      // Für Städte und Sites: Standard-Styling
      dataLayerRef.current.setStyle({
        fillColor: '#ffffff',
        fillOpacity: 0.1,
        strokeColor: '#d1d5db',
        strokeWeight: 1
      });
    }

    dataLayerRef.current.setMap(map);

    // Entferne alte Kreise
    circlesRef.current.forEach(circle => circle.setMap(null));
    circlesRef.current = [];

    // Zeichne Kreise nur für Städte und Sites
    if (mapLevel !== 'region') {
      console.log('=== START CIRCLE/MARKER CREATION ===');
      console.log(`Creating ${mapLevel === 'site' ? 'markers' : 'circles'} for ${mapLevel} level with ${locationsData.length} locations`);
      console.log('Locations to process:', locationsData.map(loc => loc.name));
      
      // Deutsche Städte-Koordinaten (nur für Städte die in den Daten vorkommen)
      const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
        'berlin': { lat: 52.5200, lng: 13.4050 },
        'hamburg': { lat: 53.5511, lng: 9.9937 },
        'münchen': { lat: 48.1351, lng: 11.5820 },
        'köln': { lat: 50.9375, lng: 6.9603 },
        'frankfurt': { lat: 50.1109, lng: 8.6821 },
        'stuttgart': { lat: 48.7758, lng: 9.1829 },
        'düsseldorf': { lat: 51.2277, lng: 6.7735 },
        'dortmund': { lat: 51.5136, lng: 7.4653 },
        'essen': { lat: 51.4556, lng: 7.0116 },
        'leipzig': { lat: 51.3397, lng: 12.3731 },
        'bremen': { lat: 53.0793, lng: 8.8017 },
        'dresden': { lat: 51.0504, lng: 13.7373 },
        'hannover': { lat: 52.3759, lng: 9.7320 },
        'nürnberg': { lat: 49.4521, lng: 11.0767 },
        'duisburg': { lat: 51.4344, lng: 6.7623 },
        'bochum': { lat: 51.4818, lng: 7.2162 },
        'wuppertal': { lat: 51.2562, lng: 7.1508 },
        'bielefeld': { lat: 52.0302, lng: 8.5325 },
        'bonn': { lat: 50.7374, lng: 7.0982 },
        'mannheim': { lat: 49.4875, lng: 8.4660 },
        'karlsruhe': { lat: 49.0069, lng: 8.4037 },
        'wiesbaden': { lat: 50.0782, lng: 8.2397 },
        'gelsenkirchen': { lat: 51.5177, lng: 7.0857 },
        'münster': { lat: 51.9607, lng: 7.6261 },
        'aachen': { lat: 50.7753, lng: 6.0839 },
        'braunschweig': { lat: 52.2689, lng: 10.5267 },
        'chemnitz': { lat: 50.8278, lng: 12.9242 },
        'kiel': { lat: 54.3233, lng: 10.1228 },
        'halle': { lat: 51.4964, lng: 11.9688 },
        'magdeburg': { lat: 52.1205, lng: 11.6276 },
        'freiburg': { lat: 47.9990, lng: 7.8421 },
        'krefeld': { lat: 51.3397, lng: 6.5853 },
        'lübeck': { lat: 53.8654, lng: 10.6866 },
        'oberhausen': { lat: 51.4700, lng: 6.8514 },
        'erfurt': { lat: 50.9848, lng: 11.0299 },
        'mainz': { lat: 49.9929, lng: 8.2473 },
        'rostock': { lat: 54.0924, lng: 12.0991 },
        'kassel': { lat: 51.3127, lng: 9.4797 },
        'potsdam': { lat: 52.3906, lng: 13.0645 },
        'hagen': { lat: 51.3671, lng: 7.4633 },
        'mülheim': { lat: 51.4315, lng: 6.8807 },
        'muelheim': { lat: 51.4315, lng: 6.8807 },
        'ludwigshafen': { lat: 49.4744, lng: 8.4422 },
        'leverkusen': { lat: 51.0459, lng: 6.9853 },
        'oldenburg': { lat: 53.1434, lng: 8.2146 },
        'osnabrück': { lat: 52.2799, lng: 8.0472 },
        'osnabrueck': { lat: 52.2799, lng: 8.0472 },
        'solingen': { lat: 51.1714, lng: 7.0845 },
        'heidelberg': { lat: 49.3988, lng: 8.6724 },
        'herne': { lat: 51.5426, lng: 7.2190 },
        'neuss': { lat: 51.2042, lng: 6.6879 },
        'darmstadt': { lat: 49.8728, lng: 8.6512 },
        'paderborn': { lat: 51.7191, lng: 8.7575 },
        'regensburg': { lat: 49.0134, lng: 12.1016 },
        'ingolstadt': { lat: 48.7644, lng: 11.4242 },
        'würzburg': { lat: 49.7913, lng: 9.9534 },
        'fürth': { lat: 49.4778, lng: 10.9887 },
        'wolfsburg': { lat: 52.4226, lng: 10.7865 },
        'offenbach': { lat: 50.1006, lng: 8.7665 },
        'ulm': { lat: 48.4011, lng: 9.9876 },
        'heilbronn': { lat: 49.1427, lng: 9.2105 },
        'pforzheim': { lat: 48.8926, lng: 8.6979 },
        'göttingen': { lat: 51.5413, lng: 9.9158 },
        'bottrop': { lat: 51.5235, lng: 6.9223 },
        'trier': { lat: 49.7499, lng: 6.6373 },
        'reutlingen': { lat: 48.4914, lng: 9.2045 },
        'bremerhaven': { lat: 53.5396, lng: 8.5809 },
        'koblenz': { lat: 50.3569, lng: 7.5940 },
        'bergisch gladbach': { lat: 50.9887, lng: 7.1329 },
        'jena': { lat: 50.9272, lng: 11.5892 },
        'erlangen': { lat: 49.5897, lng: 11.0041 },
        'moers': { lat: 51.4516, lng: 6.6326 },
        'siegen': { lat: 50.8756, lng: 8.0164 },
        'hildesheim': { lat: 52.1508, lng: 9.9513 },
        'salzgitter': { lat: 52.1508, lng: 10.3333 }
      };
      
      // Nur Städte/Sites aus den tatsächlichen Daten zeichnen
      locationsData.forEach((location, index) => {
        console.log(`=== PROCESSING LOCATION ${index + 1}/${locationsData.length} ===`);
        console.log(`Location name: "${location.name}"`);
        
        // Verwende feste Koordinaten für bekannte Städte
        let coordinates = location.coordinates;
        
        if (!coordinates && mapLevel === 'city') {
          const cityKey = location.name.toLowerCase();
          console.log(`Looking for coordinates for city key: "${cityKey}"`);
          coordinates = cityCoordinates[cityKey];
          
          if (coordinates) {
            console.log(`Found coordinates for "${location.name}":`, coordinates);
          } else {
            console.log(`No coordinates found for city: "${location.name}"`);
          }
        }
        
        // Fallback: Verwende Deutschland-Zentrum nur wenn wirklich keine Koordinaten verfügbar
        if (!coordinates) {
          console.log(`Using fallback coordinates for: "${location.name}"`);
          coordinates = { lat: 51.1657, lng: 10.4515 };
        }

        const metricValue = getMetricValue(location, currentMetric);
        const colorIntensity = getColorIntensity(metricValue, maxMetricValue);
        const metricInfo = METRIC_OPTIONS.find(m => m.value === currentMetric);
        
        const baseColor = metricInfo?.color || '#FF6B00';
        const color = colorIntensity > 0 ? baseColor : '#d1d5db';

        // Tooltip HTML
        const tooltipHtml = `
          <div style="padding: 10px; font-family: Arial, sans-serif; min-width: 200px;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #111827;">
              ${location.name}
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: #6b7280;">${currentMetric === 'cost' ? 'Außenumsatz' : 'Metrik'}:</span>
              <span style="font-weight: bold; color: #111827; margin-left: 8px;">
                ${currentMetric === 'cost' ? 
                  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(metricValue) :
                  new Intl.NumberFormat('de-DE').format(Math.round(metricValue))
                }
              </span>
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: #6b7280;">Datensätze:</span>
              <span style="font-weight: bold; color: #111827; margin-left: 8px;">
                ${location.count}
              </span>
            </div>
          </div>
        `;

        // Erstelle InfoWindow
        const infoWindow = new window.google.maps.InfoWindow({
          content: tooltipHtml
        });

        if (mapLevel === 'site') {
          // Für Sites: Verwende Marker
          console.log(`Creating marker for site "${location.name}":`, {
            coordinates,
            color,
            metricValue,
            intensity: colorIntensity
          });

          // Erstelle Standard-Marker mit angepasster Farbe
          const marker = new window.google.maps.Marker({
            position: coordinates,
            map: map,
            title: location.name,
            // Verwende Standard-Marker-Icon mit angepasster Farbe
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
                        fill="${color}" 
                        stroke="${color}" 
                        stroke-width="1"/>
                </svg>
              `)}`,
              scaledSize: new window.google.maps.Size(16, 16),
              anchor: new window.google.maps.Point(8, 16)
            }
          });

          marker.locationData = location;

          // Click-Event für Marker (nur einfacher Click, nicht Doppelklick)
          marker.addListener('click', (event: any) => {
            console.log(`Marker clicked: "${location.name}" at position:`, event.latLng);
            infoWindow.setPosition(event.latLng);
            infoWindow.open(map);
            console.log(`InfoWindow opened for "${location.name}"`);
          });

          circlesRef.current.push(marker);
          console.log(`Marker created successfully for "${location.name}"`);

        } else {
          // Für Städte: Verwende Kreise
          // Berechne Radius basierend auf Metrikwert - mit vernünftigen Größen
          let radius: number;
          if (maxMetricValue === 0) {
            radius = 10000; // 10km Basis-Größe
          } else {
            const intensity = getColorIntensity(metricValue, maxMetricValue);
            // Skaliere zwischen 10km und 30km basierend auf Intensität
            radius = 10000 + (intensity * 20000);
          }

          console.log(`Creating circle for "${location.name}":`, {
            coordinates,
            radius: `${Math.round(radius/1000)}km`,
            color,
            metricValue,
            intensity: colorIntensity,
            isFallback: coordinates.lat === 51.1657 && coordinates.lng === 10.4515
          });

          const circle = new window.google.maps.Circle({
            center: coordinates,
            radius: radius,
            fillColor: color,
            fillOpacity: 0.8,
            strokeColor: color,
            strokeWeight: 3,
            strokeOpacity: 1.0,
            map: map
          });

          circle.locationData = location;

          // Click-Event für Kreis (nur einfacher Click, nicht Doppelklick)
          circle.addListener('click', (event: any) => {
            console.log(`Circle clicked: "${location.name}" at position:`, event.latLng);
            infoWindow.setPosition(event.latLng);
            infoWindow.open(map);
            console.log(`InfoWindow opened for "${location.name}"`);
          });

          // Hover-Effekte für Kreise
          circle.addListener('mouseover', () => {
            circle.setOptions({
              fillOpacity: 1.0,
              strokeWeight: 4
            });
          });

          circle.addListener('mouseout', () => {
            circle.setOptions({
              fillOpacity: 0.8,
              strokeWeight: 3
            });
          });

          circlesRef.current.push(circle);
          console.log(`Circle created successfully for "${location.name}"`);
        }
      });
      
      console.log(`=== END CIRCLE/MARKER CREATION ===`);
      console.log(`Total ${mapLevel === 'site' ? 'markers' : 'circles'} created: ${circlesRef.current.length}`);
    }
  }, [geoJsonData, locationsData, currentMetric, mapLevel, googleLoaded]);

  // Google Maps Script laden - nur einmal
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.google && !googleLoaded && !scriptLoadedRef.current) {
      scriptLoadedRef.current = true;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        setGoogleLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
        scriptLoadedRef.current = false;
      };
      document.head.appendChild(script);
    } else if (typeof window !== 'undefined' && window.google && !googleLoaded) {
      setGoogleLoaded(true);
    }
  }, [googleLoaded]);

  // Initialisiere Karte
  useEffect(() => {
    if (googleLoaded && !isLoading && geoJsonData) {
      // Erstelle Karte nur bei wichtigen Änderungen, nicht bei jedem Zoom
      createGoogleMap();
    }
  }, [googleLoaded, isLoading, geoJsonData, mapLevel, currentMetric]); // Entferne createGoogleMap aus Dependencies

  const handleMetricChange = (metric: MetricType) => {
    setLocalSelectedMetric(metric);
    onMetricChange?.(metric);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 dark:bg-gray-900 rounded-booking-lg shadow-booking border border-gray-700 dark:border-gray-600 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 bg-stroer-500 rounded-booking flex items-center justify-center mx-auto mb-4">
              <Globe className="h-6 w-6 text-white animate-pulse" />
            </div>
            <p className="text-gray-400 dark:text-gray-400">Lade Deutschland-Karte...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 dark:bg-gray-900 rounded-booking-lg shadow-booking border border-gray-700 dark:border-gray-600">
      {/* Header */}
      <div className="p-6 border-b border-gray-700 dark:border-gray-600">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-stroer-500 rounded-booking flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-100 dark:text-gray-100">
                Deutschland-Karte
              </h3>
              <p className="text-sm text-gray-400 dark:text-gray-400">
                Regionale Datenvisualisierung
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 dark:text-gray-300 mb-2">
              Karten-Level
            </label>
            <select
              value={mapLevel}
              onChange={(e) => setMapLevel(e.target.value as MapLevel)}
              className="input-field"
            >
              <option value="region">Bundesländer</option>
              <option value="city">Städte</option>
              <option value="site">Sites</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 dark:text-gray-300 mb-2">
              Metrik für Farbkodierung
            </label>
            <select
              value={currentMetric}
              onChange={(e) => handleMetricChange(e.target.value as MetricType)}
              className="input-field"
            >
              {METRIC_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 bg-gray-700/50 dark:bg-gray-800/50 border-b border-gray-700 dark:border-gray-600">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium text-gray-300 dark:text-gray-300">Legende:</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded-booking"></div>
              <span className="text-gray-400 dark:text-gray-400">Niedrig</span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-booking" 
                style={{ backgroundColor: METRIC_OPTIONS.find(m => m.value === currentMetric)?.color || '#FF6B00' }}
              ></div>
              <span className="text-gray-400 dark:text-gray-400">Hoch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="p-6">
        <div 
          ref={mapRef} 
          className="w-full h-[600px] rounded-booking-lg border border-gray-700 dark:border-gray-600 shadow-booking"
        />
      </div>
    </div>
  );
}
