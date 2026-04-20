# Kanji Study App

Component-based React frontend backed by an Express API and MongoDB.

## Stack

- `frontend`: React + Vite
- `backend`: Express + MongoDB native driver
- `database`: MongoDB

## Local run

1. Start MongoDB locally and create a database named `kanji_app`, or set `MONGODB_URI` / `MONGODB_DB_NAME`.
2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

4. Start the backend:

```bash
cd ../backend
npm run dev
```

5. Start the frontend:

```bash
cd ../frontend
npm run dev
```

## URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000/api/kanji`

## Render deployment

This repo is configured to deploy to Render as a single Node web service via [render.yaml](/abs/path/c:/Users/Yash/Downloads/kanji/render.yaml).

Render build/start behavior:

- Build: installs frontend deps, builds Vite, then installs backend deps
- Start: runs the Express backend, which also serves `frontend/dist`
- Health check: `GET /api/health`

Required Render environment variables:

- `MONGODB_URI`
- `APP_URL`
- `CORS_ORIGIN`

Optional email/auth variables:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Recommended values after Render creates your service URL:

- `APP_URL=https://<your-render-service>.onrender.com`
- `CORS_ORIGIN=https://<your-render-service>.onrender.com`
- `MONGODB_DB_NAME=kanji_app`

Notes:

- The backend seeds starter data automatically on first run.
- If you do not configure SMTP, magic-link email sign-in will not work.
- Frontend API requests use `/api`, so no separate frontend API URL is required for this deployment shape.

## Component structure

- `frontend/src/App.jsx`: page orchestration
- `frontend/src/components/AppHeader.jsx`: top section
- `frontend/src/components/StatsBar.jsx`: dashboard stats
- `frontend/src/components/SearchBar.jsx`: query input
- `frontend/src/components/CategoryFilter.jsx`: category chips
- `frontend/src/components/KanjiGrid.jsx`: card grid
- `frontend/src/components/KanjiCard.jsx`: reusable kanji card
- `frontend/src/components/DetailPanel.jsx`: selected kanji details

## Database

On backend start, the app seeds MongoDB automatically from:

- `jlpt-kanji-study.jsx`
- `scripts/generate-study-content.js`

No Docker is required for local development.

## Dataset imports

The base app seeds a starter dataset automatically. For larger dictionary data, use the Mongo-native importers in `backend`.

### JMdict vocabulary import

```bash
cd backend
npm run import:jmdict
```

Options:

- `--source <url-or-file>` to use a local file instead of the default JMdict download
- `--limit <n>` for a small test import
- `--replace-source` to remove prior `jmdict` rows before reimporting

Default source:

- `http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz`

### KANJIDIC2 import

```bash
cd backend
npm run import:kanjidic2
```

Options:

- `--source <url-or-file>`
- `--limit <n>`
- `--replace-source`

Default source:

- `http://ftp.edrdg.org/pub/Nihongo/kanjidic2.xml.gz`

KANJIDIC2 data is stored in `kanjiDictionary` and matching study kanji rows are enriched with dictionary metadata.

## API filters

`GET /api/vocabulary` now supports:

- `search`
- `wordType`
- `level`
- `kanaGroup`
- `readingPrefix`
- `limit`
- `offset`
