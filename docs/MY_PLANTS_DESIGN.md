# My plants and the calendar: design

Written 2026-10-20 from the owner's decisions. **Status: design only, nothing is built.** The work items are PF-010 to PF-013 in `BACKLOG.md`.

## What the owner wants

1. Per-user **tags** on each plant: growing in my yard, I have seeds, I want it, I have extra (plant or seed).
2. A **calendar** tab that shows when to sow seeds and prune a plant.
3. Later: mark the **date** something was planted (plants and seeds), in which part of the yard, and show when it should bloom, fruit and be ready to harvest.

## Decisions made

- **Tags are built-in lists (option C).** Growing, Have seeds, Want and Have extra appear on My Lists. They sit next to the custom lists, which stay.
- **Plants move between lists over time**, so the built-in lists are computed from state, not stored as memberships (see below).
- **The calendar draws on plant-level data**, not on personal dates, so it comes before planting dates and garden areas. The owner will add the data it needs (when to sow, when to prune) to the cleared-plant-data repo.
- **Order of the work:** tags and planting record (PF-010), then the calendar (PF-011), then dates and garden areas (PF-012), then predictions (PF-013).

## Two kinds of user data

| Kind | What it holds | Why separate |
|---|---|---|
| **Tag** | One on/off per user, plant and tag: `want`, `has_seeds`, `extra_plant`, `extra_seeds`, with the date it was set. | Simple status. A plant can have several. |
| **Planting** | One record per planting: plant, **seed or plant**, planted-on date, garden area, removed-on date, quantity, notes. | You can plant the same tomato in two beds in two months. A tag cannot say that. |
| **Garden area** | A named place the user creates ("Front bed"). | A planting points to one. Coordinates, if ever added, live here. |

Sketch of the tables (names are provisional; they belong to the app's own database, not to the plant data):

```
plant_tags     user_id, plant_id, tag, set_on          unique (user_id, plant_id, tag)
plantings      id, user_id, plant_id, kind (seed|plant), planted_on?, area_id?, removed_on?, quantity?, notes?
garden_areas   id, user_id, name, notes?               (lat/lng later, private)
```

`plant_id` is the data repo's UUID string, the same value `saved_plants.plant_id` already holds. As `docs/DATA_INTEGRATION.md` says: no foreign key across the two stores, and no plant facts copied into user tables.

## Built-in lists are views

| List | A plant is in it when |
|---|---|
| **Growing** | the user has at least one planting with no removed-on date |
| **Have seeds** | the user has the `has_seeds` tag |
| **Want** | the user has the `want` tag |
| **Have extra** | the user has `extra_plant` or `extra_seeds` |

So a plant moves by changing status, not by being dragged: planting it can offer to clear "Want"; removing the last planting takes it off Growing. Nothing has to be kept in sync. Custom lists are different: they are manual memberships, a plant can be in several, and it can be added or removed at any time.

**In the first phase, tapping "Growing" creates a planting with an unknown date.** The date, area and removal arrive in PF-012. Starting with the planting record avoids migrating a plain "growing" flag later.

**Have seeds** stays a simple tag for now. If seed viability matters later (sow-by dates, quantities), it can become a stock record without changing the list.

## The calendar

The calendar tab (PF-011) shows, for the plants you have tagged, month by month: when to sow, when to prune, and when it blooms. All of that is the same for every gardener, so it needs no personal dates.

**What the data has today:** bloom months for about 384 of 563 plants (mostly Maryland natives), as `bloom_month` trait rows with `value_num` 1 to 12 and as raw text such as "Jul-Sep".

**What the data does not have:** sowing windows, pruning windows, fruiting, harvest. The owner will add them to the cleared-plant-data repo. Suggested shape, following the bloom pattern:

- New trait rows, for example `sow_month` and `prune_month`, `value_num` 1 to 12, one row per month.
- Keyed by region like nativity (`US-MD` first), because the right month depends on where you garden.
- A source and a `kind` (source or derived, with its basis) on every row, like the other traits.
- A missing row means "no data", never "no".
- Adding trait rows is a **minor** schema change (the data repo's changelog says MINOR = something was added), so it becomes schema 1.1.0. plantfolio's reader accepts a higher minor version; it has to be taught to read the new fields.
- The data repo's `PLANTFOLIO_MAPPING.md` gets a section saying which field feeds which calendar element.

**Region:** until the ZIP lookup (PF-002) exists, the calendar is labeled Maryland, which is the only region with plant data.

## Planting dates, areas and predictions (later)

PF-012 adds the planted-on date, removed-on date and garden areas to plantings, and overlays the user's own dates on the calendar's plant-level windows. PF-013 predicts bloom, fruiting and harvest from a planting date. It needs plant data that does not exist yet (days to bloom or maturity), frost dates per ZIP and hardiness zones, which are items in the data repo's own backlog.

## Location and privacy

- Start with **named garden areas**. They carry no coordinates.
- If map pins or coordinates are added, treat them as sensitive: they locate someone's home. Private by default, never shown to other users, and not needed for the calendar.

## What is not decided

- Whether Growing, Have seeds, Want and Have extra also become filters in the Discover sidebar (planned as a "My plants" filter after the first pass).
- Whether the custom lists feature stays long term, or the built-in lists eventually cover what people need. Nothing is removed now.
- Whether tags can be shared with other gardeners (for example "have extra" for swaps). Not designed; it would need its own privacy decisions.
- The calendar's layout (a month grid, a list by month, or both).
