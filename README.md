# Analytics - Digital-out-of-Home Inventory Analysis

Eine moderne Webanwendung zur Analyse von Digital-out-of-Home Daten mit interaktiven Diagrammen, Filtern und einer Deutschland-Karte.

## 🚀 Features

### 📊 Datenanalyse
- **Interaktive Diagramme**: Line- und Bar-Charts mit individueller Metrik-Auswahl
- **Berechnete Metriken**: Play Rate und Coverage werden automatisch berechnet
- **Erweiterte Filter**: Für Datum, Network, Auction Type, Region, City, Site und Screen IDs
- **Datumsfilter**: Inklusive Start- und Enddatum-Filterung
- **Scroll-Position**: Keine Positionsverluste beim Filtern
- **Rohdaten-Tabelle**: Vollständige Datenansicht mit Such- und Sortierfunktionen

### 🗺️ Deutschland-Karte
- **Bundesländer-Einfärbung**: Regionale Datenvisualisierung mit Kreisen
- **Städte-3D-Säulen**: Dynamische 3D-Säulen mit Höhen basierend auf Metrik-Werten
- **Site-Marker**: Präzise Markierungen für einzelne Standorte
- **Zoom-Funktionalität**: Responsive Elemente die sich an Zoom anpassen
- **Tooltips**: Detaillierte Informationen bei Klick (ohne Datensatz-Anzahl)
- **Filter-Synchronisation**: Map reagiert auf alle Filter-Änderungen

### 📁 File-Management
- **Excel-Upload**: Drag & Drop für .xlsx und .csv Dateien
- **FileInfo-Komponente**: Übersicht über aktuelle Datei
- **File-Austausch**: Einfaches Hochladen neuer Dateien
- **Statistiken**: Zeilen- und Spaltenanzahl
- **Report-Link**: Direkter Zugang zum Ströer Core Reporting

### 🎨 Design
- **Modernes UI**: Booking.com Look & Feel mit Ströer-Farben
- **Dark Mode**: Standardmäßig aktiviert
- **Responsive Layout**: Optimiert für alle Bildschirmgrößen
- **Minimalistisches Interface**: Klare Startseite ohne Ablenkung
- **Professionelles Logo**: "Analytics" Branding

## 🛠️ Technologie-Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS mit custom Design System
- **Charts**: Recharts für interaktive Diagramme
- **Maps**: Google Maps API mit GeoJSON
- **File Processing**: XLSX für Excel-Dateien
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 📦 Installation

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd webapp-projekt
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren**
   ```bash
   cp env.example .env.local
   ```
   
   Füge deine Google Maps API Key hinzu:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

4. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```

5. **Browser öffnen**
   ```
   http://localhost:3000
   ```

## 🔧 Google Maps Setup

1. **Google Cloud Console** öffnen
2. **Maps JavaScript API** aktivieren
3. **API Key** erstellen
4. **API Key** in `.env.local` eintragen

Detaillierte Anweisungen findest du in `GOOGLE_MAPS_SETUP.md`.

## 📁 Projektstruktur

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global Styles
│   ├── layout.tsx         # Root Layout
│   └── page.tsx           # Hauptseite
├── components/            # React Komponenten
│   ├── ui/               # UI Komponenten
│   ├── AnalyticsFilters.tsx
│   ├── ColumnMapper.tsx
│   ├── CollapsibleTable.tsx
│   ├── ErrorMessage.tsx
│   ├── ExcelTable.tsx
│   ├── ExcelUploader.tsx
│   ├── FileInfo.tsx
│   ├── GermanyMap.tsx
│   ├── Logo.tsx
│   └── MultiChartDashboard.tsx
└── lib/                  # Utilities
    └── utils.ts
```

## 🎯 Verwendung

1. **Datei hochladen**: Excel-Datei mit Digital-out-of-Home Daten hochladen
2. **Spalten mappen**: Automatische oder manuelle Spaltenzuordnung
3. **Filter anwenden**: Daten nach verschiedenen Dimensionen filtern
4. **Analyse durchführen**: Interaktive Charts und Karten erkunden
5. **Rohdaten einsehen**: Vollständige Datenansicht in der Tabelle

## 📊 Unterstützte Metriken

- **Außenumsatz** (cost)
- **Impressions** (total_impressions)
- **Plays** (plays)
- **Scheduled Plays** (auction_wins)
- **Ad Requests** (ad_requests)
- **Coverage** (automatisch berechnet)
- **Play Rate** (automatisch berechnet)

## 🗺️ Karten-Level

- **Bundesländer**: Regionale Einfärbung mit dynamischen Kreisen
- **Städte**: Beeindruckende 3D-Säulen mit CSS-Transformationen
- **Sites**: Präzise Marker für Einzelstandorte

## 🎛️ Filter-System

- **Datumsfilter**: Start- und Enddatum (inklusive)
- **Network**: Netzwerk-Filterung
- **Auction Type**: Auktions-Typ-Filterung  
- **Bundesland**: Regionale Filterung
- **Stadt**: Stadt-spezifische Filterung
- **Site**: Standort-Filterung
- **Screen ID**: Screen-spezifische Filterung

## 🚀 Deployment

### Vercel (Empfohlen)
1. Repository zu Vercel verbinden
2. Umgebungsvariablen konfigurieren
3. Deploy

### Andere Plattformen
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork erstellen
2. Feature Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Änderungen committen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request erstellen

## 📄 Lizenz

Dieses Projekt ist privat und nicht zur öffentlichen Nutzung bestimmt.

## 🆘 Support

Bei Fragen oder Problemen erstelle ein Issue im Repository.
