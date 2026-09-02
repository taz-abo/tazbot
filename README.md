# taz Hilfs-Assistent

Lokaler Open-Source-RAG-Chatbot für die [taz-Hilfeseite](https://taz.de/verlag/fragen-und-hilfe/!v=673b67c7-bf6c-44de-9d7d-b86c5a620288/).

Dieses Repository enthält die **statische Frontend-Seite** mit einbettbarem Chat-Widget,
gehostet auf GitHub Pages. Das Backend läuft als **Cloudflare Worker**
(Workers AI + Vectorize + KV) unter HTTPS, damit kein Mixed-Content-Problem auftritt.

## Live

**https://taz-abo.github.io/taz-hilfe-assistent/**

Backend-Worker: `https://taz-backend.okur-230.workers.dev`

## Widget einbetten

Auf jeder beliebigen HTML-Seite:

```html
<link rel="stylesheet" href="https://taz-abo.github.io/taz-hilfe-assistent/style.css">
<script src="https://taz-abo.github.io/taz-hilfe-assistent/widget.js"
        data-backend="https://taz-backend.okur-230.workers.dev"></script>
```

## Backend-URL konfigurieren

In `index.html` die `data-backend`-Attribute im `<script>`-Tag anpassen:

```html
<!-- Lokal (FastAPI) -->
<script src="widget.js" data-backend="http://localhost:8000"></script>

<!-- Produktiv (Cloudflare Worker) -->
<script src="widget.js" data-backend="https://taz-backend.okur-230.workers.dev"></script>
```

## Struktur

```
index.html                    Demo-Seite mit Chat-Panel und Info-Karten
widget.js                     Einbettbares Floating Chat-Widget (Bottom-Right)
style.css                     Styling für Seite und Widget
taz-logo-white.svg            Weißes taz-Logo (SVG) für Hero + Widget
taz-logo.webp                 Raster-Logo
.version                      Aktuelle Cache-Bust-Version (wird vom Workflow gepflegt)
.github/workflows/deploy.yml  Auto-Deploy: Version bumpen + nach GitHub Pages deployen
```

## GitHub Pages hosten

Die statische Seite wird auf dem Branch **`gh-pages`** ausgeliefert. Quell-Branch ist
**`main`** — aus dem deployt ein GitHub-Actions-Workflow automatisch.

### Manuell deployen (ohne Workflow)

```bash
git checkout main
# Änderungen committen
git push origin main

# Synchronisieren auf gh-pages
git checkout gh-pages
git pull --ff-only origin gh-pages
git checkout main -- index.html style.css widget.js taz-logo-white.svg taz-logo.webp README.md
git commit -m "Sync: <beschreibung>"
git push origin gh-pages
```

### Automatisches Deploy (empfohlen)

Push auf `main` mit echten Frontend-Änderungen triggert
`.github/workflows/deploy.yml`:

1. **Version automatisch erhöhen** — liest `.version`, zählt hoch
   (`YYYYMMDD-N`; bei neuem Datum wieder bei `-1`), schreibt die neue Nummer in
   `.version` und ersetzt `style.css?v=…`/`widget.js?v=…` in `index.html`
   (Cache-Busting)
2. **Commit + Push auf `main`** mit `[skip ci]` (verhindert Endlosschleife)
3. **Deploy auf `gh-pages`** über `peaceiris/actions-gh-pages` (nur die 6
   Web-Dateien + `.nojekyll`)

→ Der `gh-pages`-Push triggert den automatischen GitHub-Pages-Build; die Seite ist
danach live. **Kein manueller Versions-Bump oder Branch-Sync mehr nötig.**

> **Hinweis:** Änderungen direkt an `.github/workflows/*` und `.version` lösen
> bewusst keinen Deploy aus (`paths-ignore`). Einen einmaligen manuellen Lauf
> startest du über **Actions → “Bump version & deploy” → Run workflow**.

> **Tipp:** GitHub Pages liefert CSS/JS mit `Cache-Control: max-age=600` (10 Min)
> aus. Bei Bedarf siehst du Änderungen sofort mit Hard-Reload (Cmd+Shift+R).

## Backend (Cloudflare Worker)

Das Backend liegt separat in `/Users/taz/Documents/Default Project/backend/worker`:

- `src/index.ts` — Worker mit `/api/chat`, `/api/ingest`, `/api/health` + CORS
- `src/ingest.ts` — Scraper, Chunking, Embedding (`@cf/baai/bge-m3`), Upsert
- `wrangler.jsonc` — Bindings: Vectorize `taz-faq-index` (1024d, cosine), KV `TAZ_KV` (Chunk-Text), AI
- LLM: `@cf/meta/llama-3.2-3b-instruct`

Architektur (Vectorize-Pattern): Vektoren in Vectorize, voller Chunk-Text in KV,
Metadaten in Vectorize bewusst klein gehalten (unter 10 KB pro Vektor).

### Deployment-Workflow

```
cd backend/worker
npx wrangler deploy                              # Worker aktualisieren
curl -X POST https://taz-backend.okur-230.workers.dev/api/ingest   # Vectorize+KV seeden
```

### Legacy-Backend (nicht mehr primär)

- `backend/main.py` — FastAPI mit `/api/chat`, `/api/ingest`, `/api/health`
- `docker-compose.yml` — FastAPI + Ollama (lokale Alternative)

