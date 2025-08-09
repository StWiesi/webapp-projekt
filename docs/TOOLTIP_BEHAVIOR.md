# 🎯 Tooltip-Verhalten in der Deutschland-Karte

## Übersicht

Die Deutschland-Karte implementiert eine intelligente Tooltip-Verwaltung, die sicherstellt, dass nur ein Tooltip gleichzeitig geöffnet ist. Dies verbessert die Benutzerfreundlichkeit erheblich und verhindert verwirrende Überlagerungen.

## 🔧 Technische Implementierung

### One-Tooltip-Policy

```typescript
// Globale Referenz für den aktuell geöffneten Tooltip
const currentOpenTooltipRef = useRef<any>(null);
```

### Automatisches Schließen

Bei jedem neuen Tooltip-Öffnen:
1. **Prüfung** ob bereits ein Tooltip geöffnet ist
2. **Schließen** des vorherigen Tooltips falls vorhanden
3. **Öffnen** des neuen Tooltips
4. **Setzen** der globalen Referenz

```typescript
// Schließe vorherigen Tooltip falls vorhanden (One-Tooltip-Policy)
if (currentOpenTooltipRef.current) {
  currentOpenTooltipRef.current.close();
  currentOpenTooltipRef.current = null;
}

// Öffne neuen Tooltip
tooltip.open(map);
currentOpenTooltipRef.current = tooltip;
```

## 🗺️ Implementierung pro Karten-Level

### 1. Bundesländer (GeoJSON Data Layer)
- **Event:** `dataLayerRef.current.addListener('click')`
- **Tooltip:** `google.maps.InfoWindow`
- **Position:** `event.latLng`

### 2. Städte (3D-Säulen)
- **Event:** `div.addEventListener('click')` in `Column3DOverlay`
- **Tooltip:** `google.maps.InfoWindow`
- **Position:** Säulen-Koordinaten
- **Fallback:** Normale Marker falls 3D nicht verfügbar

### 3. Sites (Marker)
- **Event:** `marker.addListener('click')`
- **Tooltip:** `google.maps.InfoWindow`
- **Position:** Marker-Position
- **Clustering:** Zoom-basierte Anzeige

## 🔄 Automatische Tooltip-Schließung

### Bei Datenänderungen
```typescript
useEffect(() => {
  closeAllTooltips();
}, [filters, mapLevel, currentMetric, closeAllTooltips]);
```

### Bei Map-Neuerstellung
```typescript
const createGoogleMap = useCallback(() => {
  // Schließe alle offenen Tooltips
  closeAllTooltips();
  // ... Map-Erstellung
}, []);
```

## 🛠️ Hilfsfunktionen

### closeAllTooltips()
```typescript
const closeAllTooltips = useCallback(() => {
  if (currentOpenTooltipRef.current) {
    currentOpenTooltipRef.current.close();
    currentOpenTooltipRef.current = null;
  }
}, []);
```

### Cleanup in Column3DOverlay
```typescript
onRemove(): void {
  if (this.tooltip) {
    // Lösche globale Referenz falls es der aktuelle Tooltip ist
    if (this.currentOpenTooltipRef.current === this.tooltip) {
      this.currentOpenTooltipRef.current = null;
    }
    this.tooltip.close();
    this.tooltip = null;
  }
}
```

## ✅ Vorteile dieser Implementierung

1. **Benutzerfreundlichkeit:** Keine verwirrenden überlappenden Tooltips
2. **Performance:** Nur ein InfoWindow gleichzeitig aktiv
3. **Konsistenz:** Einheitliches Verhalten auf allen Karten-Leveln
4. **Automatismus:** Tooltips schließen sich bei Kontext-Änderungen
5. **Memory-Management:** Korrekte Cleanup-Routinen

## 🧪 Testszenarien

### Manuell zu testen:
1. **Bundesländer-Level:** Klick auf verschiedene Bundesländer
2. **Städte-Level:** Klick auf verschiedene 3D-Säulen
3. **Sites-Level:** Klick auf verschiedene Site-Marker
4. **Filter-Änderung:** Tooltips sollten sich automatisch schließen
5. **Level-Wechsel:** Tooltips sollten sich automatisch schließen
6. **Metrik-Wechsel:** Tooltips sollten sich automatisch schließen

### Erwartetes Verhalten:
- ✅ Nur ein Tooltip gleichzeitig sichtbar
- ✅ Neuer Tooltip schließt vorherigen automatisch
- ✅ Tooltips schließen sich bei Datenänderungen
- ✅ Keine Memory-Leaks durch vergessene InfoWindows

## 🔍 Debugging

Bei Problemen mit Tooltips:

1. **Browser-Konsole prüfen** auf JavaScript-Fehler
2. **Google Maps API** Status überprüfen
3. **currentOpenTooltipRef.current** im Debugger inspizieren
4. **InfoWindow-Instanzen** auf korrekte Cleanup prüfen

## 📋 Zukunftserweiterungen

- **Tooltip-Animationen:** Fade-in/out Effekte
- **Tooltip-Clustering:** Gruppierung bei hoher Dichte
- **Custom Tooltips:** Vollständig benutzerdefinierte Tooltips
- **Tooltip-Persistence:** Benutzer-gesteuerte Tooltip-Persistenz
