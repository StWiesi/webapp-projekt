# Webapp Projekt

[![CI/CD Pipeline](https://github.com/USERNAME/webapp-projekt/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/USERNAME/webapp-projekt/actions)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/USERNAME/webapp-projekt)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Eine moderne Web-Applikation erstellt mit Next.js 14, TypeScript und Tailwind CSS.

> 🚨 **Wichtig:** Folgen Sie der [GITHUB_SETUP.md](./GITHUB_SETUP.md) Anleitung für das GitHub Setup!

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Sprache:** TypeScript
- **Styling:** Tailwind CSS
- **Linting:** ESLint + Prettier
- **Git Hooks:** Husky + lint-staged
- **Node.js:** >= 18.0.0

## 📋 Voraussetzungen

Bevor Sie beginnen, stellen Sie sicher, dass folgende Software installiert ist:

### 1. Node.js installieren

**Option A: Mit Homebrew (empfohlen für macOS)**
```bash
# Homebrew installieren (falls noch nicht vorhanden)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js installieren
brew install node
```

**Option B: Direkt von nodejs.org**
- Gehen Sie zu [nodejs.org](https://nodejs.org/)
- Laden Sie die LTS-Version herunter und installieren Sie sie

### 2. Git installieren

```bash
# Mit Homebrew
brew install git

# Oder Xcode Command Line Tools installieren
xcode-select --install
```

## 🛠️ Installation & Setup

1. **Dependencies installieren:**
   ```bash
   cd webapp-projekt
   npm install
   ```

2. **Umgebungsvariablen konfigurieren:**
   ```bash
   cp env.example .env.local
   # Bearbeiten Sie .env.local mit Ihren spezifischen Werten
   ```

3. **Git Repository initialisieren:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

4. **Development Server starten:**
   ```bash
   npm run dev
   ```

   Öffnen Sie [http://localhost:3000](http://localhost:3000) in Ihrem Browser.

## 📜 Verfügbare Skripte

- `npm run dev` - Development Server starten
- `npm run build` - Production Build erstellen
- `npm start` - Production Server starten
- `npm run lint` - ESLint ausführen
- `npm run type-check` - TypeScript Type Checking

## 📁 Projektstruktur

```
webapp-projekt/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css        # Globale Styles
│   │   ├── layout.tsx         # Root Layout
│   │   └── page.tsx           # Homepage
│   ├── components/            # React Komponenten
│   │   └── ui/               # UI Komponenten
│   ├── lib/                  # Utilities
│   └── styles/               # Zusätzliche Styles
├── public/                   # Statische Assets
├── .husky/                   # Git Hooks
├── package.json             # Dependencies
├── tailwind.config.js       # Tailwind Konfiguration
├── tsconfig.json           # TypeScript Konfiguration
└── next.config.js          # Next.js Konfiguration
```

## 🎨 Styling

Das Projekt verwendet Tailwind CSS für das Styling. Zusätzlich ist ein einfaches UI-Komponenten-System vorbereitet.

### Tailwind CSS Klassen verwenden:
```tsx
<button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
  Klick mich!
</button>
```

## 🔧 Entwicklung

### Code Quality
- **ESLint:** Automatische Code-Analyse
- **Prettier:** Code-Formatierung
- **Husky:** Git Hooks für pre-commit Checks
- **lint-staged:** Nur geänderte Dateien prüfen

### Git Workflow
```bash
# Neue Feature branch erstellen
git checkout -b feature/neue-funktion

# Änderungen committen (löst automatisch Linting aus)
git add .
git commit -m "feat: neue Funktion hinzugefügt"

# Push und Pull Request erstellen
git push origin feature/neue-funktion
```

## 🚀 Deployment

### GitHub + Vercel (Automatisch)
Das Projekt ist für automatisches Deployment konfiguriert:

1. **Push zu GitHub** → Automatischer Build und Tests
2. **Vercel Integration** → Live Deployment bei erfolgreichem Build
3. **Preview Deployments** → Für jeden Pull Request

### Manuelle Deployment-Optionen
- **Vercel:** One-Click Deploy Button oben
- **Netlify:** Automatisches Deployment über Git
- **Railway:** Container-basiertes Hosting
- **DigitalOcean App Platform:** Managed Hosting

### GitHub Actions
- ✅ Automatische Tests bei jedem Push
- ✅ TypeScript Type Checking
- ✅ ESLint Code Quality Checks  
- ✅ Build Verification
- ✅ Production Deployment zu Vercel

## 🔮 Nächste Schritte

1. **UI-Bibliothek erweitern**
   - Weitere shadcn/ui Komponenten hinzufügen
   - Design System entwickeln

2. **Backend Integration**
   - API Routes erstellen
   - Datenbank integrieren (Prisma + PostgreSQL)
   - Authentifizierung (NextAuth.js)

3. **Testing Setup**
   - Jest für Unit Tests
   - Cypress für E2E Tests
   - React Testing Library

4. **Performance Optimierung**
   - Image Optimierung
   - Bundle Analyse
   - Caching Strategien

## 📚 Weitere Ressourcen

- [Next.js Dokumentation](https://nextjs.org/docs)
- [TypeScript Handbuch](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Komponenten](https://ui.shadcn.com/)

## 🤝 Beitragen

1. Fork das Repository
2. Erstellen Sie einen Feature Branch
3. Commiten Sie Ihre Änderungen
4. Pushen Sie den Branch
5. Erstellen Sie einen Pull Request

## 📄 Lizenz

Dieses Projekt steht unter der MIT Lizenz.

---

**Viel Erfolg bei der Entwicklung Ihrer Web-Applikation! 🎉**
