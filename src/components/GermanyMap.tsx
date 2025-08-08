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
  { value: 'total_impressions', label: 'Impressions', color: '#FF6B00' },
  { value: 'plays', label: 'Plays', color: '#FF6B00' },
  { value: 'auction_wins', label: 'Scheduled Plays', color: '#FF6B00' },
  { value: 'ad_requests', label: 'Ad Requests', color: '#FF6B00' },
  { value: 'coverage', label: 'Coverage', color: '#FF6B00' },
  { value: 'play_rate', label: 'Play Rate', color: '#FF6B00' }
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
  const columnsRef = useRef<any[]>([]);
  const [mapLevel, setMapLevel] = useState<MapLevel>('region');
  const [localSelectedMetric, setLocalSelectedMetric] = useState<MetricType>('cost');
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(6);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const scriptLoadedRef = useRef(false);
  const scrollPositionRef = useRef<number>(0);
  const shouldRestoreScrollRef = useRef<boolean>(false);

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

  // Verarbeite Daten für die Karte - verarbeite alle Daten
  const locationsData = useMemo((): LocationData[] => {
    if (!data.length) return [];

    // Verarbeite alle Daten - kein Limit mehr
    const allData = data;

    // Gruppiere Daten nach Standort
    const locationGroups = new Map<string, LocationData>();

    allData.forEach((item) => {
      let locationName = '';
      
      // Bestimme Standort basierend auf Map-Level
      if (mapLevel === 'region') {
        locationName = item.region || item.bundesland || item.Region || item.Bundesland || 'Unbekannt';
      } else if (mapLevel === 'city') {
        locationName = item.city || item.stadt || item.City || item.Stadt || 'Unbekannt';
      } else if (mapLevel === 'site') {
        locationName = item.site || item.website || item.Site || item.Website || 'Unbekannt';
      }

      if (!locationName || locationName === 'Unbekannt') {
        return;
      }

      // Daten sind bereits gefiltert - keine zusätzliche Filterung nötig

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

      // Summiere Metriken - alle Daten
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

    return Array.from(locationGroups.values());
  }, [data, mapLevel]); // Nur abhängig von data und mapLevel, da Daten bereits gefiltert sind

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

  const calculateColumnHeight = (metricValue: number, maxValue: number, zoom: number): number => {
    if (maxValue === 0) return 1000;
    
    const intensity = getColorIntensity(metricValue, maxValue);
    
    // Basis-Höhe basierend auf Zoom-Level
    const baseHeight = 1000; // 1km in Metern
    const maxHeight = 10000; // 10km in Metern
    
    const baseHeightWithIntensity = baseHeight + (intensity * (maxHeight - baseHeight));
    
    // Zoom-Faktoren für Säulen
    let zoomFactor: number;
    if (zoom <= 4) {
      zoomFactor = 0.5; // Kleine Säulen bei Übersicht
    } else if (zoom <= 6) {
      zoomFactor = 0.8 + (zoom - 4) * 0.3; // 0.8 - 1.4
    } else if (zoom <= 8) {
      zoomFactor = 1.4 + (zoom - 6) * 0.5; // 1.4 - 2.4
    } else if (zoom <= 10) {
      zoomFactor = 2.4 + (zoom - 8) * 0.8; // 2.4 - 4.0
    } else {
      zoomFactor = 4.0 + (zoom - 10) * 1.0; // 4.0+
    }
    
    const calculatedHeight = baseHeightWithIntensity * zoomFactor;
    
    return Math.max(500, Math.min(calculatedHeight, 20000)); // Min 500m, Max 20km
  };

  // 3D Säulen OverlayView Klasse - wird nur definiert wenn Google Maps geladen ist
  let Column3DOverlay: any = null;

  const createColumn3DOverlayClass = () => {
    if (!window.google || !window.google.maps) return null;
    
    return class Column3DOverlay extends window.google.maps.OverlayView {
      private div: HTMLElement | null = null;
      private location: LocationData;
      private coordinates: { lat: number; lng: number };
      private map: any;
      private metricValue: number;
      private maxMetricValue: number;
      private currentMetric: MetricType;
      private tooltip: any;

      constructor(
        location: LocationData, 
        coordinates: { lat: number; lng: number }, 
        map: any, 
        metricValue: number, 
        maxMetricValue: number,
        currentMetric: MetricType
      ) {
        super();
        this.location = location;
        this.coordinates = coordinates;
        this.map = map;
        this.metricValue = metricValue;
        this.maxMetricValue = maxMetricValue;
        this.currentMetric = currentMetric;
        this.div = null;
        this.tooltip = null;
        this.setMap(map);
      }

      onAdd(): void {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.cursor = 'pointer';
        div.style.userSelect = 'none';
        div.style.transform = 'translate(-50%, -100%)';
        div.style.zIndex = Math.floor((this.metricValue / this.maxMetricValue) * 1000).toString();
        
        this.div = div;
        this.getPanes().overlayImage.appendChild(div);
        
        // Tooltip erstellen
        this.tooltip = new window.google.maps.InfoWindow({
          content: generateTooltipContent(this.location, this.metricValue)
        });

        // Click Event
        div.addEventListener('click', (e) => {
          e.stopPropagation();
          const projection = this.getProjection();
          const point = projection.fromLatLngToDivPixel(
            new window.google.maps.LatLng(this.coordinates.lat, this.coordinates.lng)
          );
          this.tooltip.setPosition(new window.google.maps.LatLng(this.coordinates.lat, this.coordinates.lng));
          this.tooltip.open(this.map);
        });

        // Hover Events
        div.addEventListener('mouseenter', () => {
          if (div) div.style.filter = 'brightness(1.2) drop-shadow(0 4px 8px rgba(0,0,0,0.3))';
        });

        div.addEventListener('mouseleave', () => {
          if (div) div.style.filter = 'brightness(1.0) drop-shadow(0 2px 4px rgba(0,0,0,0.2))';
        });

        this.draw();
      }

      draw(): void {
        if (!this.div) return;

        const projection = this.getProjection();
        if (!projection) return;

        const point = projection.fromLatLngToDivPixel(
          new window.google.maps.LatLng(this.coordinates.lat, this.coordinates.lng)
        );

        if (!point) return;

        const zoom = this.map.getZoom();
        const baseWidth = Math.max(8, Math.min(20, zoom * 1.5)); // Responsive Breite
        const height = this.calculateHeight(zoom);
        
        // 3D Säulen HTML mit CSS 3D-Effekten
        this.div.innerHTML = `
          <div style="
            position: relative;
            width: ${baseWidth}px;
            height: ${height}px;
            transform-style: preserve-3d;
            transform: perspective(1000px) rotateX(60deg);
          ">
            <!-- Hauptsäule -->
            <div style="
              position: absolute;
              bottom: 0;
              left: 50%;
              transform: translateX(-50%);
              width: ${baseWidth}px;
              height: ${height * 0.8}px;
              background: linear-gradient(180deg, #FF6B00 0%, #FF4500 100%);
              border-radius: 2px 2px 0 0;
              box-shadow: 
                0 2px 4px rgba(0,0,0,0.2),
                inset 0 1px 0 rgba(255,255,255,0.3);
              border: 1px solid #E55A00;
            "></div>
            
            <!-- 3D-Tiefe (rechte Seite) -->
            <div style="
              position: absolute;
              bottom: 0;
              left: calc(50% + ${baseWidth * 0.3}px);
              transform: translateX(-50%) skewY(-30deg);
              width: ${baseWidth * 0.3}px;
              height: ${height * 0.8}px;
              background: linear-gradient(180deg, #E55A00 0%, #CC4A00 100%);
              border-radius: 0 2px 0 0;
              box-shadow: inset -1px 0 0 rgba(0,0,0,0.2);
            "></div>
            
            <!-- 3D-Tiefe (linke Seite) -->
            <div style="
              position: absolute;
              bottom: 0;
              left: calc(50% - ${baseWidth * 0.3}px);
              transform: translateX(-50%) skewY(30deg);
              width: ${baseWidth * 0.3}px;
              height: ${height * 0.8}px;
              background: linear-gradient(180deg, #FF8C00 0%, #FF6B00 100%);
              border-radius: 2px 0 0 0;
              box-shadow: inset 1px 0 0 rgba(255,255,255,0.3);
            "></div>
            
            <!-- Schatten -->
            <div style="
              position: absolute;
              bottom: -4px;
              left: 50%;
              transform: translateX(-50%) rotateX(60deg);
              width: ${baseWidth * 1.5}px;
              height: ${baseWidth * 0.5}px;
              background: rgba(0,0,0,0.3);
              border-radius: 50%;
              filter: blur(2px);
            "></div>
            
            
          </div>
        `;

        this.div.style.left = point.x + 'px';
        this.div.style.top = point.y + 'px';
      }

      private calculateHeight(zoom: number): number {
        if (this.maxMetricValue === 0) return 50;
        
        const intensity = this.metricValue / this.maxMetricValue;
        const baseHeight = 30;
        const maxHeight = 200;
        const zoomFactor = Math.max(0.5, Math.min(2.0, zoom / 8));
        
        return baseHeight + (intensity * (maxHeight - baseHeight)) * zoomFactor;
      }

      updateMetric(newMetricValue: number, newMaxMetricValue: number): void {
        this.metricValue = newMetricValue;
        this.maxMetricValue = newMaxMetricValue;
        if (this.div) {
          this.div.style.zIndex = Math.floor((this.metricValue / this.maxMetricValue) * 1000).toString();
        }
        this.draw();
      }

      onRemove(): void {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
        if (this.tooltip) {
          this.tooltip.close();
          this.tooltip = null;
        }
      }
    };
  };

  const create3DColumn = (location: LocationData, coordinates: { lat: number; lng: number }, map: any) => {
    const metricValue = getMetricValue(location, currentMetric);
    const maxMetricValue = Math.max(...locationsData.map(loc => getMetricValue(loc, currentMetric)));
    
    // Erstelle Column3DOverlay Klasse wenn noch nicht erstellt
    if (!Column3DOverlay) {
      Column3DOverlay = createColumn3DOverlayClass();
    }
    
    // Fallback zu normalen Markern wenn 3D-Säulen nicht verfügbar sind
    if (!Column3DOverlay) {
      console.warn('3D columns not available, using fallback markers');
      const marker = new window.google.maps.Marker({
        position: coordinates,
        map: map,
        title: `${location.name}: ${formatMetricValue(metricValue)}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#FF6B00',
          fillOpacity: 0.8,
          strokeColor: '#FF4500',
          strokeWeight: 2
        }
      });
      
      // Tooltip für den Marker
      const tooltip = new window.google.maps.InfoWindow({
        content: generateTooltipContent(location, metricValue)
      });

      marker.addListener('click', () => {
        tooltip.open(map, marker);
      });

      (marker as any).locationData = location;
      (marker as any).metricValue = metricValue;
      (marker as any).maxMetricValue = maxMetricValue;
      
      return marker;
    }
    
    // Erstelle 3D-Säule mit OverlayView
    const column = new Column3DOverlay(
      location, 
      coordinates, 
      map, 
      metricValue, 
      maxMetricValue,
      currentMetric
    );

    // Speichere Referenz für Updates
    (column as any).locationData = location;
    (column as any).metricValue = metricValue;
    (column as any).maxMetricValue = maxMetricValue;
    
    return column;
  };

  const createGoogleMap = useCallback(() => {
    if (!mapRef.current || !geoJsonData || !googleLoaded) return;

    // Bei Level-Änderungen: Reset Zoom und Zentrum
    const defaultZoom = 6; // Deutschland-Übersicht
    const defaultCenter = { lat: 51.1657, lng: 10.4515 }; // Deutschland Zentrum

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

    // Zoom-Change Event mit Kreis- und Säulen-Updates
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
      
      // Aktualisiere 3D-Säulen basierend auf neuem Zoom
      columnsRef.current.forEach(column => {
        const location = (column as any).locationData;
        if (location && column.updateMetric) {
          const metricValue = getMetricValue(location, currentMetric);
          column.updateMetric(metricValue, maxMetricValue);
        }
      });
    });

    // Zeichne GeoJSON
    if (dataLayerRef.current) {
      dataLayerRef.current.setMap(null);
    }

    dataLayerRef.current = new window.google.maps.Data();
    
    try {
      dataLayerRef.current.addGeoJson(geoJsonData);
    } catch (error) {
      return;
    }

    dataLayerRef.current.setMap(map);

    // Zeichne Kreise nur für Städte und Sites
    if (mapLevel !== 'region') {
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
        'oberhausen': { lat: 51.4964, lng: 6.8518 },
        'erfurt': { lat: 50.9848, lng: 11.0299 },
        'mainz': { lat: 49.9929, lng: 8.2473 },
        'rostock': { lat: 54.0924, lng: 12.0991 },
        'kassel': { lat: 51.3127, lng: 9.4797 },
        'potsdam': { lat: 52.3906, lng: 13.0645 },
        'hagen': { lat: 51.3671, lng: 7.4633 },
        'mülheim': { lat: 51.4315, lng: 6.8807 },
        'ludwigshafen': { lat: 49.4774, lng: 8.4452 },
        'leverkusen': { lat: 51.0459, lng: 6.9853 },
        'oldenburg': { lat: 53.1434, lng: 8.2146 },
        'osnabrück': { lat: 52.2799, lng: 8.0472 },
        'solingen': { lat: 51.1722, lng: 7.0845 },
        'heidelberg': { lat: 49.3988, lng: 8.6724 },
        'herne': { lat: 51.5413, lng: 7.2208 },
        'neuss': { lat: 51.2042, lng: 6.6879 },
        'darmstadt': { lat: 49.8728, lng: 8.6512 },
        'paderborn': { lat: 51.7189, lng: 8.7575 },
        'regensburg': { lat: 49.0134, lng: 12.1016 },
        'ingolstadt': { lat: 48.7665, lng: 11.4258 },
        'würzburg': { lat: 49.7913, lng: 9.9534 },
        'fürth': { lat: 49.4778, lng: 10.9887 },
        'wolfsburg': { lat: 52.4226, lng: 10.7865 },
        'offenbach': { lat: 50.1006, lng: 8.7665 },
        'ulm': { lat: 48.4011, lng: 9.9876 },
        'heilbronn': { lat: 49.1427, lng: 9.2109 },
        'pforzheim': { lat: 48.8924, lng: 8.6947 },
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
      locationsData.forEach((location) => {
        // Verwende feste Koordinaten für bekannte Städte
        let coordinates = location.coordinates;
        
        if (!coordinates && mapLevel === 'city') {
          const cityKey = location.name.toLowerCase();
          coordinates = cityCoordinates[cityKey];
        }
        
        // Fallback: Verwende Deutschland-Zentrum nur wenn wirklich keine Koordinaten verfügbar
        if (!coordinates) {
          coordinates = { lat: 51.1657, lng: 10.4515 };
        }

        const metricValue = getMetricValue(location, currentMetric);
        const colorIntensity = getColorIntensity(metricValue, maxMetricValue);
        const metricInfo = METRIC_OPTIONS.find(m => m.value === currentMetric);
        
        const baseColor = metricInfo?.color || '#FF6B00';
        const color = colorIntensity > 0 ? baseColor : '#d1d5db';

        if (mapLevel === 'site') {
          // Für Sites: Verwende normale Marker
          const marker = new window.google.maps.Marker({
            position: coordinates,
            map: map,
            title: `${location.name}: ${formatMetricValue(metricValue)}`,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: color,
              fillOpacity: 0.8,
              strokeColor: color,
              strokeWeight: 2
            }
          });
          
          // Tooltip für den Marker
          const tooltip = new window.google.maps.InfoWindow({
            content: generateTooltipContent(location, metricValue)
          });

          marker.addListener('click', () => {
            tooltip.open(map, marker);
          });

          (marker as any).locationData = location;
          (marker as any).metricValue = metricValue;
          (marker as any).maxMetricValue = maxMetricValue;
          
          circlesRef.current.push(marker);
        } else {
          // Für Städte: Verwende 3D-Säulen anstelle von Kreisen
          // Erstelle 3D-Säule
          const column = create3DColumn(location, coordinates, map);
          columnsRef.current.push(column);
        }
      });
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
        setGoogleLoaded(true);
        // Initialisiere 3D-Säulen-Klasse nach dem Laden
        Column3DOverlay = createColumn3DOverlayClass();
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
      
      // Stelle Scroll-Position nach Karten-Erstellung wieder her
      if (shouldRestoreScrollRef.current) {
        setTimeout(() => {
          window.scrollTo({
            top: scrollPositionRef.current,
            behavior: 'instant'
          });
          shouldRestoreScrollRef.current = false;
        }, 100);
      }
    }
  }, [googleLoaded, isLoading, geoJsonData, mapLevel, currentMetric, locationsData]); // Füge locationsData hinzu

  const handleMetricChange = (metric: MetricType) => {
    scrollPositionRef.current = window.scrollY;
    shouldRestoreScrollRef.current = true;
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
              onChange={(e) => {
                scrollPositionRef.current = window.scrollY;
                shouldRestoreScrollRef.current = true;
                setMapLevel(e.target.value as MapLevel);
              }}
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
