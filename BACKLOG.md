# plantfolio backlog

Work that is agreed. Priority order, top to bottom. Updated 2026-10-20.

Background: `docs/DATA_INTEGRATION.md` (how the plant data connects to the app) and, in the cleared-plant-data repo, `build/poc/README.md`, `build/poc/PLANTFOLIO_MAPPING.md` and `build/poc/CHANGELOG.md`. The README's "Known Issues / Backlog" section lists older issues.

## Where we start from

The data repo is ready to consume (checked 2026-10-20, data commit `87a1ea3`):
- `plants_poc.sqlite`: 563 plants, `schema_version` **1.0.1** (done), `DATA_LICENSE.md` generated from the registry (done), the owner's private garden list removed from the shipped database (done). Its own build check passes.
- Rule from its changelog: **refuse to load a file whose major schema version we do not know; tolerate a higher minor version.**

plantfolio today:
- There are **no `.env` files** in `backend/` or `frontend/` on this computer yet, so the app has not been set up to run locally. POC-1 does that.
- Saving a plant and adding it to a list **requires being signed in** (Google sign-in), in the tile and on the detail page. **Lists are not part of the POC** (owner decision); they are tested on the live Render site, which still serves the old data.
- Lists live in the browser's memory (`App.tsx`): they work during a session and are **lost on refresh**. The backend lists API exists (`routes/lists.py`) but the frontend does not call it yet (PF-007).

Decisions made (owner):
- **ZIP code stays in the backlog.** The zone dropdown stays for sources that have zones; for the cleared source it is hidden (no data).
- **Perenual stays in the code**, switched off by default for the cleared work, not deleted.
- **Pick a source** replaces the old test-mode toggle: `cleared`, `mock` (fixtures), `perenual` (live API).
- **Vendoring the data file into the repo moves to after the POC** (PF-006). For the POC the backend reads the file straight from the local data-repo checkout.
- **Lists are out of the POC** (2026-10-20). Saving to lists, My Lists and Google sign-in are tested on the live Render site. The POC covers search, tile and detail page only, so it needs no Google Client ID.
- **Work happens on a branch and runs locally.** `main` and the live Render site do not change until the owner says so (see the gate below).

---

## Tonight: proof of concept, running locally

**Goal:** on `localhost:5173`, pick **Cleared data**, then:
1. **Search** the 563 Maryland plants with the existing filters (sunlight, edible, flowering, name search).
2. See each plant's **tile** (photo, names, type, sunlight, edible) in the results.
3. Open its **detail page** (photo, size, water, sunlight, flowering, bloom, type).

Lists and sign-in are **not** part of the POC.

Steps run in this order; each is usable on its own. **Branch:** one branch for all of it (suggested `cleared-data-source`), cut from `main`; the two doc files from `data-integration-docs` come along.

| # | Step | Size | Done when |
|---|---|---|---|
| **POC-1** | **Run the app locally, as it is today.** Create `backend/.env` and `frontend/.env` from the examples (README section "Getting Started"). A random `SECRET_KEY` is generated for the local file; no Google Client ID is needed because sign-in is out of the POC (leave the placeholder). Install the backend (`venv` + `pip install -r requirements.txt`) and frontend (`npm install`). Start both and check the **mock** source. | S | `localhost:5173` loads and a search with the mock source returns the 15 fixture plants. |
| **POC-2** | **Source selection in the backend.** New config value `PLANT_DATA_SOURCE` (`cleared` / `mock` / `perenual`). A per-request `?source=` overrides it. **The old `?mock=true/false` keeps working** and default behavior is unchanged, so nothing about the live site changes. `routes/plants.py` picks the source and calls it. | S–M | `/api/plants?source=mock` and `?mock=true` return what they return today. |
| **POC-3** | **The cleared source** (`backend/app/cleared_client.py`). The file's location comes from `CLEARED_DB_PATH` in `backend/.env` (the local data-repo checkout's `build/poc/plants_poc.sqlite`). Opens it **read-only** through its own connection, and **refuses an unknown major schema version**. Same two calls as the other sources: search and details. Filters: sunlight is a **tag match** on `sunlight_inferred` (Shade = plants with a shade tag); edible = `edible = 'yes'`. Zone is ignored. Converts a plant to the frontend's plant shape using `PLANTFOLIO_MAPPING.md`: common name, Latin name, **all** sunlight tags, edible, flowering, duration as the tag, water from moisture, height range, bloom period, primary photo `url_medium` (detail page `url_large`). **A missing value stays empty, never invented** (no "Partial" default, no `native: False` default). | M–L | `/api/plants?source=cleared` returns 563 plants; `&sunlight=Shade` returns about 150; a UUID works on `/api/plants/<id>`. |
| **POC-4** | **Backend tests** for the cleared source, run against a **tiny fixture database built inside the test**, so CI never needs the data repo. Cover: read-only (a write attempt fails), each filter, empty values stay empty, unknown-major-version refusal, a missing plant ID returns a clean error. | M | `python -m pytest` passes with the new tests. |
| **POC-5** | **Frontend tolerates empty values everywhere a plant is shown.** In `data.ts` make the fields the cleared data can lack optional (`zones`, `water`, `matureSize`, `bloomSeason`, `description`, `sunlight`) and add `sunlightTags: string[]`. In `App.tsx`: the **tile** (`SUNLIGHT_ICONS[plant.sunlight]` would fail on a missing value; sunlight label; the "Zone …" chip; type chips), the **detail page** (description, water and size rows, the Sunlight, "USDA Zones" and Type rows) and the **related plants** strip. Each hides its element when the value is empty instead of printing "Unknown". The tile shows **all** sunlight tags. | M | A cleared plant with no zone, size or description renders on the tile and detail page with those elements simply absent; Perenual and mock plants look as before. |
| **POC-6** | **Source selector in the frontend.** Replace the Test data / Live API toggle with a three-way choice (**Cleared data / Test fixtures / Live API**) that sends `?source=`. Remember the choice (reusing the `plantfolio_test_mode` setting's place in local storage). When the source is cleared, hide the USDA zone dropdown. | S–M | Switching the choice changes the results; the zone dropdown appears only for the other two. |
| **POC-7** | **Walk the journey as an end user, then write down what looks wrong.** Search with each filter (sunlight, edible, flowering) and by name ("black eyed susan", a Latin name); open a plant from its tile and read its detail page; check the photos load; check a plant with missing data (a crop with no sunlight). Compare with the live site. Record problems here. | S | The three goals above all work, and a short list of findings is added to this file. |

If time runs short: **POC-1, 2, 3, 5, 6, 7** is the shortest path to the three goals. **POC-4** follows straight after, before anything is merged.

Notes for these steps:
- The flowering filter runs in the browser on the returned list. Name search for the cleared source runs on the server (added after the first POC walkthrough). With no filters the cleared source returns all 563 plants (fine for now; server-side search is PF-003).
- Photo URLs from the cleared data are full web addresses, so `imageUrl` works without changes.
- Lists are tested on the live Render site (old data). Whether lists work with **cleared** plants is not tested by the POC; see PF-007.

### POC result (2026-10-20): steps 1–7 done, on branch `cleared-data-source`, not committed

What was built: `backend/app/cleared_client.py` (read-only, refuses unknown major schema version), source selection in `routes/plants.py` and `config.py` (`?source=`, `PLANT_DATA_SOURCE`, `CLEARED_DB_PATH`; the old `?mock=` still works), 26 new backend tests (62 pass), and the frontend changes in `App.tsx`, `api.ts`, `data.ts` (source selector in the header, empty values hidden, all sunlight tags on tiles, zone dropdown hidden for the cleared source). `frontend/npm run build` passes.

Walked through in the browser on `localhost:5173` with the cleared data: 563 plants load with photos; Shade = 150; Shade + Edible = 12; Flowering = 399 (matches the data); name search by "black" and "purple coneflower" work; the detail page shows photo, type, sunlight and flowering and leaves out the rows that have no data; the fixture source still looks as before, and the zone dropdown returns for it. Lists and sign-in were not tested (out of the POC).

**Findings from POC-7 (to decide on):**
1. **Name search missed spelling variants. Fixed the same day** (PF-003, name search part): "black eyed susan" found nothing because the box only matched the names shown on tiles. The cleared source now searches the data's normalized name index on the server (common names, Latin names, old Latin names, aliases); every one of the 563 plants is found by its own displayed name and Latin name.
2. **Clicking Search after changing filters needs a clear idea of state.** The existing "Clear" button resets the page to the empty "Set your filters" state, and switching the source does the same (on purpose). Not a bug in the new code, but worth knowing when testing.
3. **Data quality (the data repo's to fix):** Eastern purple coneflower shows "Height: 1.2 feet" (USDA's mature height; real plants are 2–4 feet). Some names look off ("Blackeyed Susan", "Eastern purple coneflower"). 163 plants have no size at all, so the Mature Size card is left out for them.
4. **A plant with almost no data** (for example Aaron's rod) shows only its photo, names and type. That is correct per the data rules, but the tile looks sparse. A "no further data yet" hint is a design question.
5. **`localhost` setup notes:** the preview launcher cannot read the Python venv under `~/Documents`, so the backend was started from the shell (`cd backend && .venv/bin/flask --app run.py run --port 5000`). Node 20 was installed under `~/.local/node` (add `~/.local/node/bin` to your PATH to use `npm` yourself). `.claude/launch.json` is local only (excluded from git).
6. **Photo credits** are now shown on tiles and the detail page (PF-001, first part). See PF-001 for what is still open.

### Gate: before anything public

**Do not make `cleared` the default on the live Render site, and do not push the work to `main`, until the rest of PF-001 (the "About this data" screen and the photo hosting check) and PF-006 are done.** The photo credit itself now shows on tiles and the detail page. The photos are CC BY or CC0, and CC BY requires the credit to be visible; the deployed backend also cannot see the local data-repo folder. The POC runs only on your computer, so this does not block tonight.

If you want to show it to someone online tonight, the smallest safe version is a one-line credit under the photo on the tile and the detail page (the cleared data gives `attribution`, `license_name` and `license_url`), plus PF-006. That is a slice of those two items; ask for it separately.

---

## Next, after the POC (in this order)

### PF-006: Vendor the data into the repo
**Moved here 2026-10-20** by the owner (was POC-1). Needed before any deploy.
- Create `backend/data/`. A small script (`backend/scripts/sync_plant_data.py`) copies `plants_poc.sqlite` from a local checkout of the data repo, refuses an unknown major schema version, and writes `backend/data/DATA_VERSION` (data commit, schema version, build date, plant count).
- The cleared source reads `backend/data/plants_poc.sqlite` by default; `CLEARED_DB_PATH` stays as an override for local work.
- Render builds only this repo, so without this the cleared source cannot run there. See `docs/DATA_INTEGRATION.md`.

### PF-001: Photo credits, "About this data" screen, and photo hosting
**Must be finished before the cleared source is public.**

Done 2026-10-20 (the photo credit):
- One `PhotoCredit` component in `App.tsx`. Wording everywhere: "Photo: " plus the credit text exactly as the source supplies it, for example "Photo: (c) Alison Northup, some rights reserved (CC BY)". Photos whose credit has no author read "Photo: no rights reserved".
- **Tile:** the credit sits over the bottom of the photo (two lines at most; the full text is in the hover tooltip). It also shows on the related-plants tiles.
- **Detail page:** under the photo, followed by links to the **License** and to the photo's own page (**Source**).
- Plants without a credit (the fixtures and Perenual) show nothing.
- The API returns `imageCredit`, `imageLicense`, `imageLicenseUrl` and `imagePageUrl`.

Still open:
- An "About this data" screen built from the data's `sources` table (each source's attribution text; the data repo's generated `DATA_LICENSE.md` lists them too). The data repo's rule is to show the credit "wherever the data is used", so this screen is where the USDA, GRIN, USFWS and Census credits belong.
- Check that the photo hosts allow hotlinking (iNaturalist's open-data bucket and Wikimedia), and decide whether a cache or CDN is needed later.
- Decide whether the tile credit needs to be more visible (it is small, white on a dark fade over the photo).

### PF-007: Lists with the cleared data, and saving lists to the backend
**First:** test saving cleared plants to lists locally (needs Google sign-in set up on `localhost`: a Google Client ID in both `.env` files and `http://localhost:5173` as an authorized origin) and make the **list cards on My Lists** tolerate empty values, the same way POC-5 does for the tile and detail page. Not done in the POC, so a plant with missing data may render badly in a list until then.

**Then:** 
Lists and saved plants are in browser memory today and disappear on refresh. The backend lists API (`routes/lists.py`) exists, stores the plant ID as a string, and works with the cleared UUIDs. Wire the frontend to it (signed-in users only), and load a list's plants by ID instead of from the session cache.

### PF-008: Fix sign-in on the live Render site
Needed if you want to test lists on Render. The frontend and backend are on different `onrender.com` subdomains, which browsers treat as different sites, and the Flask session cookie has no `SameSite` setting, so the browser will likely not send it back: you land signed-out right after signing in. Fix in `backend/app/config.py`: `SESSION_COOKIE_SAMESITE = "None"` and `SESSION_COOKIE_SECURE = True` (local `localhost` is unaffected). Also check on Render that `FRONTEND_ORIGIN` is exactly `https://plantfolio-frontend.onrender.com` (no trailing slash) and that this URL is an Authorized JavaScript origin in Google Cloud Console. Not tested yet.

### PF-003: Server-side flowering filter, and name search for the other sources
**Name search for the cleared source is done (2026-10-20).** `/api/plants?source=cleared&q=...` matches the normalized text (lower case, hyphens turned into spaces, apostrophes and the hybrid sign removed) anywhere in any of a plant's names. The page re-runs the search about 0.3 seconds after you stop typing, and the old in-browser name filter is skipped for this source. Matching is a phrase match, so the words must appear in order ("coneflower purple" finds nothing); ranking is alphabetical.

Still open:
- A server-side `flowering` filter (today it still runs in the browser on the returned list; fine for 563 plants).
- Ranking and word-order-free matching if the plant set grows (the data has an FTS5 `names_fts` table for this).
- The fixture and Perenual sources still filter by name in the browser.

### PF-004: Sources report what they support
A small endpoint (or a field on the plants response) says what each source supports: zone, ZIP, sunlight tags, nativity. The filter panel reads it instead of hardcoding source names, so a new source does not need frontend edits.

### PF-005: Decide the default source and the future of Perenual
After the POC has been used for a while: make `cleared` the default, and decide when the Perenual code, its quota workarounds and its zone logic are removed.

### PF-002: ZIP code box and nativity badge
**Parked 2026-10-20** by the owner: a bigger frontend change, a second step.
- A ZIP code box in the filter panel (instead of the zone dropdown) for sources with no zones. The ZIP is looked up in the data's `zip_regions` table and gives a region (such as `US-MD`) and a county.
- A nativity badge on tiles and the detail page, from `plant_regions.nativity` for the user's region: native, introduced, garden-grown only, or "no data for this region".
- A "Native to my area" filter.
- Messages for a ZIP outside Maryland ("Maryland only for now") and for a ZIP not found ("check the ZIP").
- Depends on: the cleared source. The data repo's mapping is in `PLANTFOLIO_MAPPING.md` (sections 2, 3 and 4).

---

## Known gaps in the data (handled in the data repo, not here)

Watch these during POC-7. They are the data repo's to fix, and the UI must simply tolerate them:
- 152 of 563 plants have no sunlight tag (mostly crops and non-native garden plants), so sunlight filters never match them.
- No hardiness zones, no descriptions, little width data. Maryland only.
- A few display names look off ("Blackeyed Susan", "Eastern purple coneflower"). The data repo plans a correction file.
