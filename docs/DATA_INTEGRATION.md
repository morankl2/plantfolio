# Bringing cleared-plant-data into plantfolio

Guidance for how the plant data (the [cleared-plant-data](https://github.com/morankl2/cleared-plant-data) repo) connects to this app. **Status: guidance only. Nothing here is built yet.** Written 2026-10-20.

Read these in the data repo first: `build/poc/README.md` (tables and queries) and `build/poc/PLANTFOLIO_MAPPING.md` (which database field feeds each UI element).

## The rule: keep plant data and user data apart

plantfolio has two stores. They never mix.

| | Plant data | User data |
|---|---|---|
| What | Plants, names, traits, photo links, nativity, ZIP lookup | Users, saved lists, notes, later the journal |
| Where | `plants_poc.sqlite`, a copy of the data repo's file | The app's own database (`SQLALCHEMY_DATABASE_URI`; SQLite now, Postgres later) |
| Who writes | The data repo's build, never plantfolio | plantfolio |
| How it is opened | **Read-only** | Read and write |
| How it changes | Replace the whole file with a newer build | Normal app migrations |

### Why

- The plant data can be replaced at any time (a new build, more states, a bigger plant set) without touching anything a user created.
- The user database can move to Postgres, or the plant data to another store, independently.
- The data repo is the only place plant facts are decided. If plantfolio edited its copy, the next sync would silently erase the edit.

### Rules

1. **Open the plant database read-only.** Use a SQLite read-only URI (`file:...plants_poc.sqlite?mode=ro`, with `uri=True`), through its own connection, not through the app's SQLAlchemy `db`. A bug then cannot change plant data.
2. **Never write to it, add columns to it, or add tables to it.** Anything plantfolio needs to store goes in the user database.
3. **Connect the two only by `plant_id`.** The ID is a UUID string from the data repo (the `plants.plant_id` column). It is permanent: the data repo issues IDs append-only and never reuses one. `saved_plants.plant_id` is already a string column, so it holds these as they are.
4. **No database-level link between the stores.** There is no foreign key from `saved_plants` to the plant file (they are different databases). The app looks the plant up by ID when it needs the details.
5. **Store only the ID in user data.** Do not copy a plant's name, photo or traits into saved lists. Copies go stale when the plant data is replaced. (Exception: a user's own free-text notes belong to the user and live with the saved plant.)
6. **A saved plant whose ID is missing from the plant data must not crash anything.** Show "this plant is no longer in the database" and keep the saved row. Merged plants are recorded in the data repo's `curated/plant_merges.jsonl`; when that file has content, follow the merge to the surviving ID.
7. **Offers, prices, stock and anything else commercial stay in plantfolio's database** and join to a plant by `plant_id`. The data repo never holds them (its own design says the same).
8. **Never edit the plant file by hand.** To change a plant fact (a display name, a trait), change it in the data repo, rebuild there, then sync.

## Where the plant file lives

Render builds only this repo, so the file has to be **inside plantfolio**, not read from the data repo's folder. Planned location: `backend/data/plants_poc.sqlite`, plus a small `backend/data/DATA_VERSION` file recording which data-repo commit and build date it came from and its plant count.

A small sync script (not yet written) copies the file from a local checkout of the data repo and writes `DATA_VERSION`. The data repo's design calls this a **vendored export**: no submodule, no runtime dependency on the other repo.

The data carries a version in `meta.schema_version` (and `PRAGMA user_version` holds the major number). The rule from the data repo's `build/poc/CHANGELOG.md`: **refuse to load a file whose major version plantfolio does not know; tolerate a higher minor version.** The first file checked against this guidance is data commit `87a1ea3`, schema `1.0.1`.

The file is about 7 MB. If it grows past roughly 50 MB (more states, the broader plant set), move to a tagged release that plantfolio downloads at build time. That decision does not change the rules above.

## Choosing a data source (test mode becomes "pick a source")

Plant lookups sit behind one interface, with a source chosen by configuration:

| Source | What it is | Status |
|---|---|---|
| `perenual` | The live Perenual API | exists (`perenual_client.py`) |
| `mock` | The 15 local fixture species | exists (`mock_data.py`, today `MOCK_PERENUAL=true`) |
| `cleared` | The vendored cleared-plant-data file | planned |

- A config value (planned name: `PLANT_DATA_SOURCE`, the name the data repo's notes already use) sets the default.
- The frontend's test-mode toggle becomes a per-request override, the way `?mock=` works today.
- Each source converts its records into the one plant shape the frontend uses, **in one place per source**. A value the source does not have is left empty, never invented. The data repo's rule is "a missing value means no data, never 'no'". Defaults such as "Partial" sunlight or `native: False` break that rule.
- Perenual stays in the code while the cleared data is being proven. It is switched off by default, not deleted.

## Open questions

- Whether the frontend's plant fields can all become optional in one pass, or one screen at a time.
- Whether `cleared` becomes the default source once its test mode works, and when Perenual is removed.
- What the first sync script should check before it replaces the file (schema version, plant count).

Related items are in `BACKLOG.md`.
