# Plantfolio

Plantfolio is a searchable plant database web app built for amateur gardeners. It lets users filter plants by criteria like light requirements, USDA hardiness zone, and edibility, and returns key info — common name, scientific name, description, and an image — for each match. Users can save and tag plants they're interested in, laying the groundwork for future features like a digital gardening journal.

This app was originally built as the final project for NYU Summer 2026 Intro to Python Programming (Prof. M. Rosetti). The code for the app was built with support from Claude.

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Data Sources](#data-sources)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone the repo](#1-clone-the-repo)
  - [2. Backend setup](#2-backend-setup)
  - [3. Frontend setup](#3-frontend-setup)
  - [4. Run the tests](#4-run-the-tests)
- [Project Status](#project-status)
- [Known Issues / Backlog](#known-issues--backlog)
- [License](#license)
- [Author](#author)

## Architecture

This is a monorepo with two apps plus the original research notebook:

```
plantfolio/
├── backend/     # Flask API — the graded Python deliverable. Wraps the Perenual
│                # API, keeps the API key server-side, and fixes a hardiness-zone
│                # filtering bug found during the API research (see below).
├── frontend/    # Vite/React UI (exported from a Figma wireframe), calls the
│                # Flask API instead of static mock data.
└── research/    # KMoran_Investigation_Notebook.ipynb — the original API
                 # feasibility research (Trefle vs. Perenual) that this app is
                 # built on.
```

The frontend is a thin client: all Perenual API calls, filtering logic, and
(eventually) saved-plant persistence live in `backend/`.

## Features

**Inputs:**
- Filter by light requirement (sunlight)
- Filter by whether a plant is edible
- Filter by USDA hardiness zone — matched as an inclusive range (see [Known Issues](#known-issues--backlog))

**Outputs:**
- Common name and scientific name
- Description
- Image

**Accounts:**
- Sign in with Google (real OAuth via Google Identity Services + a Flask-side session — see setup below)

**Planned:**
- Persist saved/tagged plant lists against a real backend datastore (the API exists in `backend/app/routes/lists.py`; the frontend doesn't call it yet)
- Digital gardening journal — planting dates, success/fail notes, year-over-year recommendations

## Data Sources

Plantfolio pulls plant data from the [Perenual API](https://perenual.com/docs/plant-open-api), evaluated against [Trefle](https://docs.trefle.io) in `research/KMoran_Investigation_Notebook.ipynb`. Perenual was chosen because it returns a hardiness zone range and a ready-to-use image URL per species; Trefle has neither. Perenual's free tier is subject to a daily request limit.

## Getting Started

### Prerequisites

- Python 3.10+ (Anaconda or `venv`)
- Node 18+ and npm
- A free API key from [Perenual](https://perenual.com/docs/api)
- A Google OAuth Client ID (free) for sign-in — see step 2

### 1. Clone the repo

```bash
git clone https://github.com/morankl2/plantfolio.git
cd plantfolio
```

### 2. Backend setup

First, create a Google OAuth Client ID: [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application → add `http://localhost:5173` under Authorized JavaScript origins. Copy the resulting Client ID (not the secret — it isn't needed).

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # or: conda create -n plantfolio python=3.11 && conda activate plantfolio
pip install -r requirements.txt
cp .env.example .env
# then edit .env:
#   PERENUAL_API_KEY   — your real Perenual key
#   GOOGLE_CLIENT_ID    — the Client ID from above
#   SECRET_KEY          — generate with: python -c "import secrets; print(secrets.token_hex(32))"
flask --app run.py run
```

The API is now available at `http://127.0.0.1:5000`. `.env` is excluded from
version control via `.gitignore` — **never commit real API keys or secrets**.

### 3. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env   # then edit .env and set VITE_GOOGLE_CLIENT_ID to the same Client ID as the backend
npm run dev
```

The app will be available at whatever URL Vite prints (typically `http://localhost:5173`). By default it talks to the backend at `http://localhost:5000`; override with a `VITE_API_BASE_URL` env var if needed.

### 4. Run the tests

```bash
cd backend
pytest
```

All backend tests mock the Perenual API — no live network calls or API key required to run them.

## Project Status

The Flask backend (`backend/`) and the frontend wiring to it are implemented: `GET /api/plants` (with sunlight/edible/zone filters) and `GET /api/plants/<id>` are live, and the Discover/Plant Detail screens call them instead of static mock data. Real Google sign-in (`/api/auth/google`, `/api/auth/me`, `/api/auth/logout`) is also implemented, backed by a `User` table and a signed session cookie. Saved/tagged plant lists have a working backend API (`backend/app/routes/lists.py`) but the frontend still manages lists in local component state — wiring that up, and deploying the backend to Render, are next.

## Known Issues / Backlog

- Perenual's own `hardiness=<zone>` filter on `/species-list` behaves like an exact match rather than an inclusive range. `backend/app/perenual_client.py` works around this by fetching candidate results and filtering locally so a search for zone 7 also returns plants rated for zones like 5–9, not just exactly 7.
- Perenual's `species-list`/`species/details` payloads don't include several fields the UI wants (soil type, native-to-region flag, precise mature size, bloom season) — these are currently defaulted/best-effort in `normalize_plant()` rather than fully populated.
- Saved plant lists aren't wired to the frontend yet (see Project Status above).
- Zone filtering is expensive on Perenual's free tier: each zone search fans out into one `/species/details` call per candidate plant (to read its hardiness range), so a handful of zone searches in a row can hit Perenual's rate limit (confirmed locally — a second zone search within about a minute of the first returned `429 Too Many Requests`). `search_plants()`'s `page_limit` is deliberately kept small (1 page / ~30 candidates) to reduce this; a production version would need caching or a paid tier.
- Not yet deployed to Render.

## License

This project is licensed under the MIT License — see [LICENSE.md](LICENSE.md) for details.

## Author

K. Moran — NYU Summer 2026, Intro to Python Programming (Prof. M. Rosetti)
