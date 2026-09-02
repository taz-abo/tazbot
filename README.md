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
index.html   Demo-Seite mit Chat-Panel und Info-Karten
widget.js    Einbettbares Floating Chat-Widget (Bottom-Right)
style.css    Styling für Seite und Widget
```

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

