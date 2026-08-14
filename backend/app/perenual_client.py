"""Thin wrapper around the Perenual API.

Chosen over Trefle per the research in research/KMoran_Investigation_Notebook.ipynb:
Perenual is the only one of the two that returns both a hardiness zone range
and a ready-to-use image URL per species.

Perenual's own `hardiness=<zone>` filter on /species-list was found in that
notebook to behave like an exact match rather than "zone falls within the
plant's tolerated range". search_plants() below fixes that by filtering
locally against each candidate's min/max hardiness instead of trusting the
API's zone filter.
"""

from __future__ import annotations

import requests
from flask import current_app

SUNLIGHT_UI_TO_PERENUAL = {
    "Full Sun": "full_sun",
    "Partial": "part_shade",
    "Shade": "full_shade",
}


class PerenualError(RuntimeError):
    """Raised when the Perenual API can't be reached or returns bad data."""


def _base_url() -> str:
    return current_app.config["PERENUAL_BASE_URL"]


def _api_key() -> str:
    key = current_app.config["PERENUAL_API_KEY"]
    if not key:
        raise PerenualError("PERENUAL_API_KEY is not set. Add it to backend/.env")
    return key


def _get(path: str, params: dict) -> dict:
    params = {**params, "key": _api_key()}
    try:
        response = requests.get(f"{_base_url()}{path}", params=params, timeout=10)
        response.raise_for_status()
    except requests.HTTPError as exc:
        if exc.response is not None and exc.response.status_code == 429:
            raise PerenualError("API limit exceeded at the moment. Please try again in 1 hour") from exc
        raise PerenualError(f"Perenual request to {path} failed: {exc}") from exc
    except requests.RequestException as exc:
        raise PerenualError(f"Perenual request to {path} failed: {exc}") from exc
    return response.json()


def _normalize_sunlight(raw_sunlight) -> str:
    """Perenual's `sunlight` field is a loosely-formatted list of strings
    (observed: "full sun", "Full sun", "part shade", "filtered shade" — an
    earlier version of this matched against underscored enum values like
    "full_sun", which never matched real data and silently defaulted every
    plant to "Partial"). Match on substrings instead of an exact enum.
    """
    if isinstance(raw_sunlight, list) and raw_sunlight:
        raw_sunlight = raw_sunlight[0]
    if not isinstance(raw_sunlight, str):
        return "Partial"
    value = raw_sunlight.strip().lower()
    if "shade" in value and "part" not in value and "sun" not in value:
        return "Shade"
    if "full" in value and "sun" in value:
        return "Full Sun"
    return "Partial"


def _format_zones(hardiness: dict | None) -> str:
    if not hardiness or not hardiness.get("min") or not hardiness.get("max"):
        return "Unknown"
    return f"{hardiness['min']}–{hardiness['max']}"


def _format_mature_size(dimensions: list | None) -> str:
    # The field is `dimensions` (plural) — a list of {type, min_value,
    # max_value, unit}, typically one entry for "Height". An earlier version
    # read a `dimension` (singular) key that Perenual doesn't return, so this
    # always fell through to "Unknown" regardless of the plant.
    if not dimensions:
        return "Unknown"
    dimension = dimensions[0]
    if not dimension.get("max_value"):
        return "Unknown"
    unit = dimension.get("unit", "")
    min_value = dimension.get("min_value", dimension["max_value"])
    label = dimension.get("type", "")
    size = f"{min_value}–{dimension['max_value']} {unit}".strip()
    return f"{label}: {size}" if label else size


def normalize_plant(species: dict, details: dict | None = None) -> dict:
    """Map a Perenual species (list or detail) record onto the frontend's Plant shape."""
    details = details or {}
    merged = {**species, **details}

    scientific_names = merged.get("scientific_name") or []
    image = merged.get("default_image") or {}
    hardiness = merged.get("hardiness")
    # Perenual's common_name casing is inconsistent across species (crowd-
    # sourced data) — title-case it rather than passing it through as-is.
    common_name = merged.get("common_name")

    return {
        "id": str(merged["id"]),
        "commonName": (common_name.title() if common_name else None)
        or (scientific_names[0] if scientific_names else "Unknown plant"),
        "latinName": scientific_names[0] if scientific_names else "",
        "imageUrl": image.get("regular_url") or image.get("medium_url") or image.get("thumbnail") or "",
        "sunlight": _normalize_sunlight(merged.get("sunlight")),
        "soilTypes": [s.strip() for s in (merged.get("soil") or []) if s.strip()],
        "zones": _format_zones(hardiness),
        "native": False,
        "flowering": bool(merged.get("flowers", False)),
        "edible": bool(merged.get("edible_fruit") or merged.get("edible_leaf") or merged.get("edible", False)),
        "description": merged.get("description") or "",
        "water": (merged.get("watering") or "Unknown"),
        "matureSize": _format_mature_size(merged.get("dimensions")),
        "bloomSeason": merged.get("flowering_season") or "Unknown",
        "tags": [t for t in [merged.get("cycle")] if t],
    }


def get_plant_details(plant_id: str) -> dict:
    data = _get(f"/species/details/{plant_id}", {})
    return normalize_plant(data, data)


ZONE_CANDIDATE_LIMIT = 10


def search_plants(sunlight: list[str] | None = None, edible: bool | None = None, zone: str | None = None, page_limit: int = 1) -> list[dict]:
    """Search Perenual, narrowing server-side on what it supports and
    (when a zone is given) enforcing an inclusive hardiness-range match
    client-side, since Perenual's own filter does not do that.

    Zone matching costs one extra API call per candidate (to read its
    hardiness range), so when a zone is given the candidate list is capped
    to ZONE_CANDIDATE_LIMIT before fanning out those calls, rather than
    checking every result from the search.
    """
    params: dict = {}
    if sunlight:
        perenual_values = [SUNLIGHT_UI_TO_PERENUAL[s] for s in sunlight if s in SUNLIGHT_UI_TO_PERENUAL]
        if perenual_values:
            params["sunlight"] = ",".join(perenual_values)
    if edible:
        params["edible"] = 1

    results: list[dict] = []
    for page in range(1, page_limit + 1):
        payload = _get("/species-list", {**params, "page": page})
        page_results = payload.get("data", [])
        results.extend(page_results)
        if page >= payload.get("last_page", page):
            break

    if not zone:
        return [normalize_plant(species) for species in results]

    try:
        zone_number = int("".join(ch for ch in zone if ch.isdigit()))
    except ValueError:
        return [normalize_plant(species) for species in results]

    matches: list[dict] = []
    for species in results[:ZONE_CANDIDATE_LIMIT]:
        details = get_plant_details(str(species["id"]))
        plant_zones = details.get("zones", "Unknown")
        if plant_zones == "Unknown":
            continue
        low, high = plant_zones.split("–")
        if int(low) <= zone_number <= int(high):
            matches.append(details)
    return matches
