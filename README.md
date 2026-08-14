# Plantfolio 

Plantfolio is a searchable plant database web app built for amateur gardeners. It lets users filter plants by criteria like light requirements, USDA hardiness zone, and edibility, and returns key info — common name, scientific name, description, and an image — for each match. Users can save and tag plants they're interested in, laying the groundwork for future features like a digital gardening journal.

This app was originally built as the final project for NYU Summer 2026 Intro to Python Programming (Prof. M. Rosetti). The code for the app was built with support from Claude desktop. 

## Table of Contents

- [Features](#features)
- [Data Sources](#data-sources)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone the repo](#1-clone-the-repo)
  - [2. Create and activate a virtual environment](#2-create-and-activate-a-virtual-environment)
  - [3. Install dependencies](#3-install-dependencies)
  - [4. Set up environment variables](#4-set-up-environment-variables)
  - [5. Run the application](#5-run-the-application)
  - [6. Run tests](#6-run-tests)
- [Project Status](#project-status)
- [Known Issues / Backlog](#known-issues--backlog)
- [License](#license)
- [Author](#author)

## Features

**Current / planned inputs:**
- Filter by light requirement
- Filter by whether a plant is edible
- Filter by USDA hardiness zone

**Current outputs:**
- Common name and scientific name
- Description
- Image

**Future/planned outputs:**
- Save and tag plants for later (planned)
- Digital gardening journal — planting dates, success/fail notes, year-over-year recommendations (planned)

## Data Sources

Plantfolio pulls plant data from third-party plant APIs, evaluated in `KMoran_Investigation_Notebook.ipynb`: 

- **[Perenual API](https://perenual.com/docs/plant-open-api)** — primary data source. Chosen because it natively supports filtering by USDA hardiness zone and returns ready-to-use image URLs per species. Free tier is subject to a daily request limit.
- **[Trefle API](https://docs.trefle.io)** — evaluated as an alternative, but not used as the primary source since it lacks hardiness zone data and requires more processing to retrieve images.

## Design

The wireframe and design for the app was done through iterative design prompts using Figma Make. Github repo for that code can be found here: **[Figma Make Plantfolio App Design v4](https://github.com/morankl2/PlantfolioMobileAppWireframes)**

> Update this section as you finalize which API(s) the shipped app actually calls.

## Getting Started

### Prerequisites

- [Anaconda](https://www.anaconda.com/download) (for virtual environment management)
- Python 3.10+
- A free API key from [Perenual](https://perenual.com/docs/api) (and optionally [Trefle](https://docs.trefle.io/docs/guides/getting-started))

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/plantfolio.git
cd plantfolio
```

### 2. Create and activate a virtual environment

```bash
conda create -n plantfolio python=3.11
conda activate plantfolio
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

> Make sure `requirements.txt` is kept up to date (`pip freeze > requirements.txt`) as you add packages.

### 4. Set up environment variables

Create a `.env` file in the project root. This file is excluded from version control via `.gitignore` — **never commit real API keys**.

```
PERENUAL_API_KEY=your_perenual_api_key_here
TREFLE_API_KEY=your_trefle_api_key_here
```

- Get a free Perenual key: https://perenual.com/docs/api
- Get a free Trefle key: https://docs.trefle.io/docs/guides/getting-started

### 5. Run the application

```bash
flask --app app run
```

> Replace `app` with your actual entry-point filename once the Flask app is built, and update this command accordingly (e.g. `python app.py`).

The app will be available at `http://127.0.0.1:5000` by default.

### 6. Run tests

```bash
pytest
```

## Project Status

This repository currently includes exploratory API feasibility research (`KMoran_Investigation_Notebook.ipynb`), which compares candidate plant data APIs against the project's requirements. Implementation of the Flask web application is in progress.

## Known Issues / Backlog

- Perenual's `hardiness` filter currently matches on an exact zone value (e.g. `hardiness=7`); it needs refinement to return results where a plant's hardiness *range* includes the queried zone (`min <= zone <= max`), rather than an exact match.
- Free-tier API rate limits may constrain how this prototype could scale toward a production app — evaluating options for caching or a paid tier if the project grows.

## License

This project is licensed under the MIT License — see [LICENSE.md](LICENSE.md) for details.

## Author

K. Moran — NYU Summer 2026, Intro to Python Programming (Prof. M. Rosetti)