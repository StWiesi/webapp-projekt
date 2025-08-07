#!/bin/bash

echo "🗺️ Google Maps API Setup Helper"
echo "================================"
echo ""

# Prüfe ob .env.local existiert
if [ ! -f ".env.local" ]; then
    echo "📝 Erstelle .env.local Datei..."
    touch .env.local
    echo "✅ .env.local erstellt"
else
    echo "✅ .env.local existiert bereits"
fi

echo ""
echo "🔑 Nächste Schritte:"
echo "1. Gehen Sie zu https://console.cloud.google.com/"
echo "2. Aktivieren Sie die 'Maps JavaScript API'"
echo "3. Erstellen Sie einen API Key"
echo "4. Fügen Sie den API Key zu .env.local hinzu:"
echo "   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=\"ihr-api-key-hier\""
echo ""
echo "📖 Detaillierte Anleitung: GOOGLE_MAPS_SETUP.md"
echo ""

# Prüfe ob API Key bereits gesetzt ist
if grep -q "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" .env.local; then
    echo "✅ API Key ist bereits in .env.local konfiguriert"
else
    echo "⚠️  API Key noch nicht konfiguriert"
    echo "   Fügen Sie folgende Zeile zu .env.local hinzu:"
    echo "   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=\"ihr-api-key-hier\""
fi

echo ""
echo "🚀 Nach der Konfiguration starten Sie die App mit:"
echo "   npm run dev"
