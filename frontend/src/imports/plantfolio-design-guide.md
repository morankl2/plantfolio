# Plantfolio — Design Guide

**Brand personality:** Knowledgeable but not fussy. Like a good nursery employee — warm, plainspoken, never condescending to a first-time gardener, never dumbed-down for an experienced one. Earthy and tactile rather than glossy-tech.

---

## 1. Color Palette

| Token | Hex | Use |
|---|---|---|
| `evergreen` | `#2F4A3D` | Primary text, navigation bar, headings, primary icon color |
| `sage` | `#9CAF88` | Secondary actions, filter tags, success/confirmation states, list thumbnails backdrop |
| `terracotta` | `#C77B4D` | Primary buttons, active filter states, save/favorite icon when active |
| `cream` | `#F6F1E7` | App background, card fill on darker sections |
| `charcoal` | `#33312C` | Body text (softer than pure black, warmer) |
| `sandstone` | `#D8C3A5` | Borders, dividers, disabled states, input outlines |

**Usage rule:** Cream is the default canvas. Evergreen carries structure and text. Terracotta is reserved for the *one* action you want tapped on a screen — if everything is terracotta, nothing is. Sage is for status and taxonomy (tags, badges), not for calls to action.

**Contrast check:** Evergreen-on-cream and charcoal-on-cream both clear WCAG AA for body text. Terracotta-on-cream is fine for large text/icons but is borderline for small text — use it for buttons with white/cream text on top of it, not as small terracotta text on cream.

---

## 2. Typography

- **Display (headings, plant names, screen titles):** A warm serif with organic, slightly irregular curves — **Fraunces** is the reference choice (variable font, has a "soft" optical style that reads as botanical rather than corporate). Use at medium/semibold weight, never thin.
- **Body (descriptions, UI labels, buttons):** A clean humanist sans — **Public Sans** or **Inter**. Keeps long plant-care descriptions legible at small sizes.
- **Utility (zone codes, latin names, data tags):** **IBM Plex Mono** at small size for latin names and zone numbers — the monospace gives scientific/data content a distinct visual register from conversational body copy, and doubles as a signature detail (e.g. *"Zone 7a"* or *"Asclepias tuberosa"* rendered in mono reads as precise, catalog-like).

**Type scale (base 16px, 1.25 ratio):**
- Display XL (screen titles): 32px / Fraunces Medium
- Display (plant name on detail page): 24px / Fraunces Medium
- Body Large: 18px / Public Sans Regular
- Body: 16px / Public Sans Regular
- Caption / tag label: 13px / Public Sans Medium, uppercase, +0.5px tracking
- Mono / data: 13px / IBM Plex Mono Regular

---

## 3. Layout & Spacing

- 8px base grid. Standard spacing scale: 4, 8, 12, 16, 24, 32, 48.
- Card padding: 16px. Screen margins: 20px.
- Corner radius: 12px for cards and buttons, 20px for bottom sheets/modals, full-round (999px) for filter pills and tags.
- Cards use a 1px `sandstone` border rather than a heavy drop shadow — keeps the earthy, printed-material feel instead of looking like floating tech UI. A very soft shadow (`0 2px 8px rgba(47,74,61,0.08)`) is fine as a secondary cue, not the main separator.

---

## 4. Iconography & Imagery

- Line icons, 1.5px stroke weight, rounded caps — botanical/hand-drawn feel over geometric/flat-corporate (avoid Material Design's default icon set as-is; restyle stroke weight and add slight curve irregularity where possible).
- Plant photography should be true-color, natural light, on-plant-in-habitat where possible — not studio product shots. This reinforces "grows in a real yard" over "item in a catalog."
- Filter icons (sun/partial/shade, soil types) should be simple single-color glyphs in evergreen, not full-color illustrations — keeps the filter bar calm even with many options visible at once.

---

## 5. Components

- **Primary button:** terracotta fill, cream text, 12px radius, medium weight Public Sans.
- **Secondary button:** cream fill, evergreen 1.5px border, evergreen text.
- **Filter pill (inactive):** sandstone border, charcoal text, cream fill.
- **Filter pill (active/selected):** sage fill, evergreen text, no border.
- **Tag on a plant card** (e.g. "Native," "Edible"): small sage-outline pill, evergreen text, uppercase caption type.
- **Bookmark/save icon:** outline evergreen by default; filled terracotta when a plant is saved to at least one list.

---

## 6. Voice & Microcopy

- Write to what the user is doing, not what the system is doing: "Save to a list," not "Submit favorite record."
- Empty states are an invitation, not an apology: *"No plants match those filters yet — try loosening sun or soil."* rather than *"No results found."*
- Errors state what happened and what to do: *"Couldn't load plant data — check your connection and try again."*
- Keep plant-care copy plain and confident, written for someone who has never gardened before, without being condescending to someone who has.

---

## 7. Logo Usage

- Minimum clear space around the logo: equal to the height of the icon mark on all sides.
- On cream or light backgrounds, use the full-color version (evergreen wordmark, terracotta/sage icon).
- On dark (evergreen) backgrounds, use a reversed version: cream wordmark, cream-outline icon.
- Don't recolor the icon mark to anything outside the core palette, and don't stretch the lockup — icon and wordmark scale together.

See the accompanying `plantfolio-logo.svg` for the primary lockup.
