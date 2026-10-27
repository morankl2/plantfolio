"""Plant data from the cleared-plant-data repo's SQLite database.

The database (build/poc/plants_poc.sqlite there) is built and owned by the data
repo. This module only reads it: the file is opened read-only, through its own
connection and never through the app's SQLAlchemy `db`, so users and saved
lists stay in a separate store (see docs/DATA_INTEGRATION.md).

Which database field feeds which UI element is documented in the data repo's
build/poc/PLANTFOLIO_MAPPING.md. The rule that matters most: a missing value
means "no data", never "no". A plant the data knows nothing about keeps an
empty string / empty list / None here, and the frontend hides the element.
"""

from __future__ import annotations

import pathlib
import re
import sqlite3
from contextlib import closing

from flask import current_app

# Major schema versions this reader understands (data repo: build/poc/CHANGELOG.md).
# An unknown major version is refused; a higher minor version is fine.
SUPPORTED_SCHEMA_MAJORS = {1}

# Frontend sunlight label <-> the tag stored in traits.value (trait 'sunlight_inferred').
# Order here is the order tags are shown in.
SUNLIGHT_LABEL_TO_TAG = {
    "Full Sun": "full sun",
    "Partial": "partial shade",
    "Shade": "shade",
}
SUNLIGHT_TAG_TO_LABEL = {tag: label for label, tag in SUNLIGHT_LABEL_TO_TAG.items()}

# Nativity is per region ("native in Maryland"), so plant_regions is joined for the
# region asked about; the one `?` in the JOIN is that region code and comes first
# among the query parameters.
_PLANT_QUERY = """
SELECT v.*,
       pr.nativity AS nativity,
       pr.confidence AS nativity_confidence,
       pr.basis_text AS nativity_basis,
       ph.url_medium AS photo_medium,
       ph.url_large AS photo_large,
       ph.attribution AS photo_attribution,
       ph.license_name AS photo_license,
       ph.license_url AS photo_license_url,
       ph.page_url AS photo_page_url
FROM plant_traits v
LEFT JOIN plant_regions pr ON pr.plant_id = v.plant_id AND pr.region = ?
LEFT JOIN photos ph ON ph.plant_id = v.plant_id AND ph.position = 1
"""

# Display names for the region codes the data uses (ISO 3166-2, "US-MD").
REGION_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "DC": "District of Columbia",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois",
    "IN": "Indiana", "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana",
    "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan",
    "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri", "MT": "Montana",
    "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
    "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota",
    "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania",
    "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee",
    "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington",
    "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming", "PR": "Puerto Rico",
    "VI": "U.S. Virgin Islands", "GU": "Guam", "AS": "American Samoa",
    "MP": "Northern Mariana Islands",
}


class ClearedDataError(RuntimeError):
    """The cleared-data file is missing, unreadable or has an unsupported schema."""


class PlantNotFoundError(ClearedDataError):
    """No plant with that ID in the cleared data."""


def _connect() -> sqlite3.Connection:
    path = current_app.config.get("CLEARED_DB_PATH")
    if not path:
        raise ClearedDataError("CLEARED_DB_PATH is not set. Add it to backend/.env")
    file = pathlib.Path(path).expanduser()
    if not file.is_file():
        raise ClearedDataError(f"Cleared plant database not found at {file}")
    try:
        conn = sqlite3.connect(f"{file.resolve().as_uri()}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA query_only = ON")
        _check_schema(conn)
    except sqlite3.Error as exc:
        raise ClearedDataError(f"Cannot read the cleared plant database: {exc}") from exc
    return conn


def _check_schema(conn: sqlite3.Connection) -> None:
    row = conn.execute("SELECT value FROM meta WHERE key = 'schema_version'").fetchone()
    if row is None:
        conn.close()
        raise ClearedDataError("The cleared plant database has no schema_version; refusing to load it")
    try:
        major = int(str(row["value"]).split(".")[0])
    except ValueError:
        conn.close()
        raise ClearedDataError(f"Unreadable schema_version {row['value']!r}; refusing to load it")
    if major not in SUPPORTED_SCHEMA_MAJORS:
        conn.close()
        raise ClearedDataError(
            f"The cleared plant database has schema version {row['value']}; "
            f"this app reads major version(s) {sorted(SUPPORTED_SCHEMA_MAJORS)} only"
        )


def normalize_query(text: str | None) -> str:
    """Normalize what the user typed the way the data repo normalizes names
    (`names.name_normalized`): lower case, hyphens turned into spaces, apostrophes
    and the hybrid sign removed, spaces collapsed. "Black-eyed Susan" and
    "black eyed  susan" both become "black eyed susan"."""
    if not text:
        return ""
    cleaned = text.lower().replace("-", " ").replace("'", "").replace("\u2019", "").replace("\u00d7", " ")
    return re.sub(r"\s+", " ", cleaned).strip()


def _like_pattern(text: str) -> str:
    """A LIKE pattern that matches `text` anywhere, with %, _ and the escape character taken literally."""
    escaped = text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def region_name(region: str | None) -> str:
    """"US-MD" -> "Maryland". Unknown codes are returned as they are."""
    if not region:
        return ""
    return REGION_NAMES.get(region.split("-")[-1], region)


def _regions_with_data(conn: sqlite3.Connection) -> list[str]:
    row = conn.execute("SELECT value FROM meta WHERE key = 'regions_with_plant_data'").fetchone()
    return _split(row["value"]) if row else []


def _resolve_region(conn: sqlite3.Connection, region: str | None) -> str:
    """The region nativity is shown for: the one asked for, else the first region the data covers."""
    if region:
        return region
    covered = _regions_with_data(conn)
    return covered[0] if covered else ""


def _number(value: float) -> str:
    return f"{value:g}"


def _range(low: float | None, high: float | None) -> str | None:
    if low is None and high is None:
        return None
    if low is None:
        low = high
    if high is None:
        high = low
    return _number(low) if low == high else f"{_number(low)}–{_number(high)}"


def _mature_size(row: sqlite3.Row) -> str:
    height = _range(row["height_min_ft"], row["height_max_ft"])
    if height is None and row["height_mature_ft_usda"] is not None:
        height = _number(row["height_mature_ft_usda"])
    width = _range(row["spread_min_ft"], row["spread_max_ft"])
    parts = []
    if height:
        parts.append(f"Height: {height} feet")
    if width:
        parts.append(f"Width: {width} feet")
    return ", ".join(parts)


def _split(value: str | None) -> list[str]:
    return [part.strip() for part in value.split(",") if part.strip()] if value else []


def normalize_plant(row: sqlite3.Row, detail: bool = False, region: str = "") -> dict:
    """Map a plant_traits row onto the frontend's Plant shape.

    Nothing is invented: a value the data lacks stays empty. `zones` and
    `description` are always empty (the data has neither yet).
    """
    tags = set(_split(row["sunlight_inferred"]))
    sunlight_tags = [label for label, tag in SUNLIGHT_LABEL_TO_TAG.items() if tag in tags]
    image = (row["photo_large"] or row["photo_medium"]) if detail else row["photo_medium"]

    return {
        "id": str(row["plant_id"]),
        "commonName": row["common_name"] or row["scientific_name"],
        "latinName": row["scientific_name"],
        "imageUrl": image or "",
        # Photo credit: required wherever the photo is shown (CC BY). The
        # frontend does not display it yet (BACKLOG PF-001).
        "imageCredit": row["photo_attribution"] or "",
        "imageLicense": row["photo_license"] or "",
        "imageLicenseUrl": row["photo_license_url"] or "",
        "imagePageUrl": row["photo_page_url"] or "",
        "sunlight": sunlight_tags[0] if sunlight_tags else None,
        "sunlightTags": sunlight_tags,
        "soilTypes": [],
        "zones": "",
        # Nativity for `region`: "native", "introduced", "cultivated" (garden-grown
        # only), "unknown", or None when the data has no row for that region.
        "nativity": row["nativity"],
        "nativityRegion": region,
        "nativityRegionName": region_name(region),
        # True, or None for "no data". Never False: a missing row is not a "no".
        "native": True if row["nativity"] == "native" else None,
        "flowering": True if row["flowering"] == "yes" else None,
        "edible": True if row["edible"] == "yes" else None,
        "description": "",
        "water": ", ".join(part.capitalize() for part in _split(row["moisture"])),
        "matureSize": _mature_size(row),
        "bloomSeason": row["bloom_period"] or "",
        "tags": _split(row["duration"]),
        **(
            {
                "nativityConfidence": row["nativity_confidence"] or "",
                "nativityBasis": row["nativity_basis"] or "",
            }
            if detail
            else {}
        ),
    }


def search_plants(
    sunlight: list[str] | None = None,
    edible: bool | None = None,
    zone: str | None = None,
    query: str | None = None,
    native: bool | None = None,
    region: str | None = None,
) -> list[dict]:
    """Filter the cleared plants. `zone` is accepted and ignored: the data has
    no hardiness zones (the frontend hides the zone control for this source).

    Selected sunlight labels match plants that have ANY of those tags, like the
    other sources. `query` is a name search: the normalized text must appear in
    any of the plant's names (common names, Latin names, old Latin names and
    aliases, all in the `names` table), so "black eyed susan" finds a plant
    whose displayed name is "Blackeyed Susan".

    `region` is the region nativity is reported for (default: the first region the
    data covers); `native` keeps only plants that are native in that region. For a
    region the data does not cover there is no nativity, so `native` finds nothing.
    """
    where: list[str] = []
    params: list[str] = []

    tags = [SUNLIGHT_LABEL_TO_TAG[label] for label in (sunlight or []) if label in SUNLIGHT_LABEL_TO_TAG]
    if tags:
        placeholders = ",".join("?" * len(tags))
        where.append(
            "EXISTS (SELECT 1 FROM traits t WHERE t.plant_id = v.plant_id "
            f"AND t.trait = 'sunlight_inferred' AND t.value IN ({placeholders}))"
        )
        params.extend(tags)
    if edible:
        where.append("v.edible = 'yes'")
    if native:
        where.append("pr.nativity = 'native'")
    normalized = normalize_query(query)
    if normalized:
        where.append(
            "EXISTS (SELECT 1 FROM names n WHERE n.plant_id = v.plant_id "
            "AND n.name_normalized LIKE ? ESCAPE '\\')"
        )
        params.append(_like_pattern(normalized))

    sql = _PLANT_QUERY + (f"WHERE {' AND '.join(where)} " if where else "") + "ORDER BY lower(v.common_name)"
    with closing(_connect()) as conn:
        resolved = _resolve_region(conn, region)
        rows = conn.execute(sql, [resolved, *params]).fetchall()
    return [normalize_plant(row, region=resolved) for row in rows]


def get_plant_details(plant_id: str, region: str | None = None) -> dict:
    with closing(_connect()) as conn:
        resolved = _resolve_region(conn, region)
        row = conn.execute(_PLANT_QUERY + "WHERE v.plant_id = ?", (resolved, plant_id)).fetchone()
    if row is None:
        raise PlantNotFoundError(f"No plant with id {plant_id}")
    return normalize_plant(row, detail=True, region=resolved)


def lookup_zip(zip_code: str) -> dict | None:
    """Where a ZIP code is, from the data's Census-based `zip_regions` table, and
    whether the data has plants for that region. None when the ZIP is not in the
    table (new, PO-box-only or unusual ZIPs are missing). Raises ValueError for
    something that is not five digits.
    """
    zip_code = (zip_code or "").strip()
    if not re.fullmatch(r"\d{5}", zip_code):
        raise ValueError("A ZIP code is five digits")
    with closing(_connect()) as conn:
        row = conn.execute(
            "SELECT zip, region, county, spans_counties, spans_states FROM zip_regions WHERE zip = ?",
            (zip_code,),
        ).fetchone()
        covered = _regions_with_data(conn)
    if row is None:
        return None
    region = row["region"] or ""
    return {
        "zip": row["zip"],
        "region": region,
        "regionName": region_name(region),
        "state": region.split("-")[-1],
        "county": row["county"] or "",
        # A ZIP code area can cover more than one county (or, rarely, state); the data
        # reports the one with the most land, so the county is approximate.
        "approximate": bool(row["spans_counties"] or row["spans_states"]),
        "hasPlantData": region in covered,
    }
