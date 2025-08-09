# Digital-out-of-Home Datenanalyse Webapp

Eine moderne Next.js Webanwendung zur Analyse von Digital-out-of-Home Daten mit interaktiven Diagrammen, Filtern und einer Deutschland-Karte.

## 🚀 Features

### 📊 Datenanalyse
- **Excel-Datei Upload** (bis 50MB) mit Progress-Bar
- **Interaktive Diagramme** (Liniendiagramm, Balkendiagramm)
- **Histogramm** mit Dimension- und Metrik-Auswahl
- **Deutschland-Karte** mit 3D-Säulen für Städte
- **Rohdaten-Tabelle** mit Sortierung und Filterung
- **Automatische Spaltenzuordnung** mit manueller Anpassung

### 🎯 Metriken
- **Außenumsatz** (Cost)
- **Impressions** (Total Impressions)
- **Plays** (Wiedergaben)
- **Scheduled Plays** (Auction Wins)
- **Ad Requests** (Anfragen)
- **Coverage** (Abdeckung in %)
- **Play Rate** (Wiedergaberate in %)

### 🔧 Filter & Navigation
- **Datum-Filter** (Start- und Enddatum inklusive)
- **Network-Filter**
- **Auction Type-Filter**
- **Bundesland-Filter**
- **Stadt-Filter**
- **Site-Filter**
- **Screen ID-Filter**
- **Scroll-Position-Erhaltung** bei allen Änderungen

### 🗺️ Karten-Features
- **3D-Säulen** für Städte mit proportionaler Höhe
- **Intelligente Tooltips** - nur ein Tooltip gleichzeitig geöffnet
- **Multi-Level-Ansicht** - Bundesländer, Städte und Sites
- **Zoom und Pan** mit persistierenden 3D-Effekten
- **Bundesland-Einfärbung** basierend auf Metriken
- **Automatisches Tooltip-Management** bei Filter-/Level-Änderungen
- **Responsive Design** für alle Bildschirmgrößen

### 📱 Benutzerfreundlichkeit
- **Progress-Bar** für Datei-Uploads mit Zeit-Schätzung
- **Responsive Design** für Desktop, Tablet und Mobile
- **Dunkles Theme** mit konsistentem Styling
- **Fehlerbehandlung** mit detaillierten Meldungen
- **Performance-Optimierung** für große Datasets

## 🛠️ Technologie-Stack

- **Next.js 14** - React Framework
- **TypeScript** - Typsichere Entwicklung
- **Tailwind CSS** - Utility-First CSS Framework
- **Recharts** - Interaktive Diagramme
- **Google Maps API** - Kartendarstellung
- **XLSX** - Excel-Datei Verarbeitung
- **Lucide React** - Icons

## 📦 Installation

1. **Repository klonen:**
```bash
git clone <repository-url>
cd webapp-projekt
```

2. **Dependencies installieren:**
```bash
npm install
```

3. **Umgebungsvariablen konfigurieren:**
```bash
cp env.example .env.local
```

4. **Google Maps API Key hinzufügen:**
```bash
# In .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

5. **Entwicklungsserver starten:**
```bash
npm run dev
```

## 🔧 Konfiguration

### Google Maps API Setup
1. Google Cloud Console öffnen
2. Neues Projekt erstellen oder bestehendes auswählen
3. Maps JavaScript API aktivieren
4. API Key erstellen
5. Key in `.env.local` eintragen

### Excel-Datei Format
Die Anwendung unterstützt folgende Spalten-Header:
- **Datum:** `date`, `datum`
- **Kosten:** `cost`, `kosten`, `außenumsatz`
- **Impressions:** `impression`, `impressionen`
- **Plays:** `play`, `wiedergabe`
- **Auction Wins:** `auction`, `auktion`, `scheduled`
- **Ad Requests:** `request`, `anfrage`
- **Network:** `network`, `netzwerk`
- **Region:** `region`, `bundesland`
- **Stadt:** `city`, `stadt`
- **Site:** `site`
- **Screen ID:** `screen`, `bildschirm`

## 📊 Verwendung

1. **Datei hochladen:** Excel-Datei per Drag & Drop oder Dateiauswahl
2. **Spaltenzuordnung:** Automatische Zuordnung überprüfen/anpassen
3. **Filter setzen:** Gewünschte Filter aktivieren
4. **Metriken auswählen:** In Diagrammen, Histogramm und Karte
5. **Daten analysieren:** Interaktive Visualisierungen erkunden

## 🎨 Features im Detail

### Histogramm
- **Dimension-Auswahl:** Network, Auction Type, Bundesland, Stadt, Site, Screen ID
- **Metrik-Synchronisation:** Automatische Synchronisation mit anderen Komponenten
- **Anzeige-Modi:** "Top X" oder "Alle" Werte
- **Berechnete Metriken:** Coverage und Play Rate werden automatisch berechnet

### Deutschland-Karte
- **3D-Säulen:** Proportional zur ausgewählten Metrik
- **Intelligente Tooltips:** Nur ein Tooltip gleichzeitig geöffnet, automatisches Schließen
- **Multi-Level-Navigation:** Bundesländer → Städte → Sites
- **One-Tooltip-Policy:** Neue Tooltips schließen automatisch vorherige
- **Zoom-Persistenz:** 3D-Effekte bleiben bei Zoom/Pan erhalten
- **Stadt-Koordinaten:** Automatische Zuordnung für deutsche Städte
- **Filter-Integration:** Tooltips schließen sich bei Datenänderungen

### Performance
- **Chunk-basierte Verarbeitung:** Optimiert für große Datasets
- **Memoization:** Intelligente Caching-Strategien
- **Lazy Loading:** Komponenten werden bei Bedarf geladen

## 🚀 Deployment

### Vercel (Empfohlen)
1. Repository zu Vercel verbinden
2. Umgebungsvariablen in Vercel Dashboard setzen
3. Automatisches Deployment bei Git-Push

### Andere Plattformen
```bash
npm run build
npm start
```

## 🤝 Beitragen

1. Fork erstellen
2. Feature Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Änderungen committen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request erstellen

## 📝 Lizenz

Dieses Projekt ist unter der MIT Lizenz lizenziert.

## 🆘 Support

Bei Fragen oder Problemen:
1. Issues auf GitHub erstellen
2. Dokumentation durchsuchen
3. Code-Beispiele in der README prüfen
