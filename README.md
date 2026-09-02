# taz Hilfs-Assistent

Lokaler Open-Source-RAG-Chatbot für die [taz-Hilfeseite](https://taz.de/verlag/fragen-und-hilfe/!v=673b67c7-bf6c-44de-9d7d-b86c5a620288/).

Dieses Repository enthält die **statische Frontend-Seite** mit einbettbarem Chat-Widget.
Das Backend (FastAPI + ChromaDB + Ollama) läuft auf einem eigenen Server.

## Live

**https://taz-abo.github.io/taz-hilfe-assistent/**

## Widget einbetten

Auf jeder beliebigen HTML-Seite:

```html
<link rel="stylesheet" href="https://taz-abo.github.io/taz-hilfe-assistent/style.css">
<script src="https://taz-abo.github.io/taz-hilfe-assistent/widget.js"
        data-backend="https://DEIN-SERVER:8000"></script>
```

## Backend-URL konfigurieren

In `index.html` die `data-backend`-Attribute im `<script>`-Tag anpassen:

```html
<!-- Lokal -->
<script src="widget.js" data-backend="http://localhost:8000"></script>

<!-- Produktiv -->
<script src="widget.js" data-backend="https://dein-server.example.com:8000"></script>
```

## Struktur

```
index.html   Demo-Seite mit Chat-Panel und Info-Karten
widget.js    Einbettbares Floating Chat-Widget (Bottom-Right)
style.css    Styling für Seite und Widget
```

## Backend

Das Backend wird separat betrieben. Siehe Hauptprojekt für Details:

- `backend/main.py` — FastAPI mit `/api/chat`, `/api/ingest`, `/api/health`
- `docker-compose.yml` — FastAPI + Ollama
