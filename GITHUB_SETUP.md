# 🚀 GitHub Setup Anleitung

Da die lokalen Git-Tools nicht verfügbar sind, folgen Sie dieser Schritt-für-Schritt Anleitung, um Ihr Projekt auf GitHub zu erstellen.

## 📋 Schritt 1: GitHub Repository erstellen

1. **Gehen Sie zu [GitHub.com](https://github.com)**
2. **Klicken Sie auf das "+" Symbol** oben rechts
3. **Wählen Sie "New repository"**
4. **Repository-Einstellungen:**
   - **Repository name:** `webapp-projekt`
   - **Description:** `Eine moderne Web-Applikation mit Next.js 14, TypeScript und Tailwind CSS`
   - **Visibility:** Public (oder Private nach Wunsch)
   - **❌ NICHT** "Initialize this repository with README" ankreuzen
   - **❌ NICHT** .gitignore hinzufügen
   - **❌ NICHT** License hinzufügen

5. **Klicken Sie auf "Create repository"**

## 📂 Schritt 2: Dateien hochladen

### Option A: GitHub Web Interface (Einfachste Methode)

1. **Im neuen Repository klicken Sie auf "uploading an existing file"**
2. **Wählen Sie ALLE Dateien aus dem Projekt-Ordner:**
   ```
   /Users/stefanwiesi/webapp-projekt/
   ```
3. **Drag & Drop alle Dateien** in das GitHub Interface
4. **Commit message:** "Initial commit: Next.js 14 webapp setup"
5. **Klicken Sie auf "Commit changes"**

### Option B: ZIP Upload (Alternative)

1. **Komprimieren Sie den gesamten Projekt-Ordner**
2. **Laden Sie die ZIP-Datei hoch**
3. **Extrahieren Sie auf GitHub**

## 🛠️ Schritt 3: GitHub Actions aktivieren

Die CI/CD Pipeline ist bereits konfiguriert in `.github/workflows/ci.yml`

1. **Gehen Sie zu "Actions" Tab** in Ihrem Repository
2. **Aktivieren Sie GitHub Actions** wenn gefragt
3. **Die Pipeline läuft automatisch** bei jedem Push

## 🚀 Schritt 4: Vercel Deployment einrichten

### Vercel mit GitHub verbinden:

1. **Gehen Sie zu [vercel.com](https://vercel.com)**
2. **Melden Sie sich mit GitHub an**
3. **Klicken Sie auf "Import Project"**
4. **Wählen Sie Ihr GitHub Repository**
5. **Vercel erkennt Next.js automatisch**
6. **Klicken Sie auf "Deploy"**

### GitHub Secrets für Vercel (Optional für Auto-Deploy):

1. **In Ihrem GitHub Repository → Settings → Secrets and variables → Actions**
2. **Fügen Sie folgende Secrets hinzu:**
   - `VERCEL_TOKEN` - Von Vercel Settings → Tokens
   - `ORG_ID` - Von Vercel Settings → General
   - `PROJECT_ID` - Von Vercel Project Settings

## 🔧 Schritt 5: Lokale Entwicklung (Nach GitHub Setup)

### Git und Node.js installieren:

```bash
# Xcode Command Line Tools installieren (für Git)
xcode-select --install

# Homebrew installieren
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js installieren
brew install node git
```

### Repository klonen und starten:

```bash
# Repository klonen
git clone https://github.com/IHR-USERNAME/webapp-projekt.git
cd webapp-projekt

# Dependencies installieren
npm install

# Development Server starten
npm run dev
```

## 📋 Nächste Schritte nach GitHub Setup

1. **✅ Repository ist live** - Ihr Code ist auf GitHub verfügbar
2. **✅ Automatisches Deployment** - Vercel deployed bei jedem Push
3. **✅ CI/CD Pipeline** - Tests und Builds laufen automatisch
4. **✅ Kollaboration** - Andere können beitragen

### Empfohlene nächste Features:

- **Issues Template** erstellen für Bug Reports
- **Pull Request Template** für Code Reviews  
- **Branch Protection Rules** für main branch
- **Dependabot** für automatische Updates
- **Code Quality Badges** im README

## 🔗 Wichtige Links nach dem Setup

- **Repository:** `https://github.com/IHR-USERNAME/webapp-projekt`
- **Live App:** `https://webapp-projekt-xyz.vercel.app` (von Vercel)
- **GitHub Actions:** `https://github.com/IHR-USERNAME/webapp-projekt/actions`

## 🆘 Bei Problemen

1. **GitHub Issues** erstellen für Bugs
2. **GitHub Discussions** für Fragen
3. **GitHub Wiki** für Dokumentation

---

**🎉 Herzlichen Glückwunsch! Ihr Projekt ist jetzt auf GitHub gehostet!**
