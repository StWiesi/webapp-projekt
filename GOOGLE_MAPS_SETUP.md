# Google Maps API Setup

## 🗺️ Google Maps API Key einrichten

Die Anwendung verwendet jetzt ausschließlich Google Maps für die Kartenansicht. Folgen Sie dieser Anleitung, um Ihren API Key einzurichten.

## 🔑 Schritt-für-Schritt Anleitung

### Schritt 1: Google Cloud Console öffnen
1. Gehen Sie zu [Google Cloud Console](https://console.cloud.google.com/)
2. Melden Sie sich mit Ihrem Google Developer Account an
3. Wählen Sie ein bestehendes Projekt oder erstellen Sie ein neues

### Schritt 2: Maps JavaScript API aktivieren
1. Gehen Sie zu **APIs & Services** > **Library**
2. Suchen Sie nach **"Maps JavaScript API"**
3. Klicken Sie auf **Maps JavaScript API**
4. Klicken Sie auf **ENABLE** (Aktivieren)

### Schritt 3: API Key erstellen
1. Gehen Sie zu **APIs & Services** > **Credentials**
2. Klicken Sie auf **+ CREATE CREDENTIALS** (Anmeldedaten erstellen)
3. Wählen Sie **API Key**
4. Kopieren Sie den generierten API Key (er beginnt mit "AIza...")

### Schritt 4: API Key einschränken (Sicherheit)
1. Klicken Sie auf den erstellten API Key
2. Unter **Application restrictions** wählen Sie **HTTP referrers (web sites)**
3. Fügen Sie diese Domains hinzu:
   ```
   localhost:3000/*
   http://localhost:3000/*
   https://localhost:3000/*
   ```
4. Unter **API restrictions** wählen Sie **Restrict key**
5. Wählen Sie nur **Maps JavaScript API**
6. Klicken Sie auf **SAVE**

### Schritt 5: API Key in Anwendung einbinden
1. Erstellen Sie eine `.env.local` Datei im Projektroot (falls nicht vorhanden):
   ```bash
   touch .env.local
   ```

2. Fügen Sie Ihren API Key hinzu:
   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="ihr-api-key-hier"
   ```

3. Starten Sie die Anwendung neu:
   ```bash
   npm run dev
   ```

## 🎯 Features der Google Maps Integration

### Automatische Standorterkennung
- Extrahiert Städte und Regionen aus Ihren Excel-Daten
- Gruppiert Daten nach Standorten
- Zeigt Anzahl der Datensätze pro Standort als Marker

### Interaktive Karte
- Zoom und Navigation
- Marker mit Standortinformationen
- Responsive Design
- Deutschland-zentrierte Ansicht

### Filter-Integration
- Karte reagiert auf gesetzte Filter
- Nur relevante Standorte werden angezeigt
- Echtzeit-Updates bei Filteränderungen

## 🚀 Verwendung

1. Laden Sie eine Excel-Datei hoch
2. Die Google Maps Karte erscheint automatisch unter den Diagrammen
3. Die Karte zeigt Standorte basierend auf Ihren Daten an
4. Klicken Sie auf Marker für Standortdetails

## 🔧 Troubleshooting

### "Google Maps API Key nicht konfiguriert"
- Prüfen Sie, ob `.env.local` im Projektroot existiert
- Stellen Sie sicher, dass der API Key korrekt eingegeben wurde
- Starten Sie die Anwendung neu nach Änderungen

### "Google Maps konnte nicht geladen werden"
- Prüfen Sie, ob die Maps JavaScript API aktiviert ist
- Kontrollieren Sie die API Key Einschränkungen
- Stellen Sie sicher, dass `localhost:3000` in den HTTP referrers steht

### Keine Standorte angezeigt
- Prüfen Sie, ob Stadt- oder Regionsspalten in Ihren Daten vorhanden sind
- Verwenden Sie das Spalten-Mapping, um Spalten korrekt zuzuordnen
- Stellen Sie sicher, dass Filter nicht alle Daten ausschließen

### API Key Einschränkungen
- Für Entwicklung: `localhost:3000/*`
- Für Produktion: Ihre Domain hinzufügen
- Nur Maps JavaScript API aktivieren

## 💰 Kosten

- **Kostenlos**: Bis zu 28.500 Aufrufe pro Monat
- **Kostenpflichtig**: Ab 28.501 Aufrufen (sehr günstig)
- **Monitoring**: Überwachen Sie die Nutzung in der Google Cloud Console

## 🔒 Sicherheit

- API Key immer einschränken
- Nur notwendige APIs aktivieren
- HTTP referrers für Web-Anwendungen verwenden
- Regelmäßig die Nutzung überprüfen

## 📞 Support

Bei Problemen:
1. Prüfen Sie die Google Cloud Console auf Fehler
2. Kontrollieren Sie die Browser-Konsole auf JavaScript-Fehler
3. Stellen Sie sicher, dass alle Schritte korrekt ausgeführt wurden
