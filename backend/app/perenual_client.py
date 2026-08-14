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

SUNLIGHT_PERENUAL_TO_UI = {
    "full_sun": "Full Sun",
    "sun-part_shade": "Full Sun",
    "part_shade": "Partial",
    "part_sun": "Partial",
    "full_shade": "Shade",
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
    if isinstance(raw_sunlight, list) and raw_sunlight:
        raw_sunlight = raw_sunlight[0]
    return SUNLIGHT_PERENUAL_TO_UI.get(raw_sunlight, "Partial")


def _format_zones(hardiness: dict | None) -> str:
    if not hardiness or not hardiness.get("min") or not hardiness.get("max"):
        return "Unknown"
    return f"{hardiness['min']}–{hardiness['max']}"


def _format_mature_size(dimension: dict | None) -> str:
    if not dimension or not dimension.get("max_value"):
        return "Unknown"
    unit = dimension.get("unit", "")
    min_value = dimension.get("min_value", dimension["max_value"])
    return f"{min_value}–{dimension['max_value']} {unit}".strip()


def normalize_plant(species: dict, details: dict | None = None) -> dict:
    """Map a Perenual species (list or detail) record onto the frontend's Plant shape."""
    details = details or {}
    merged = {**species, **details}

    scientific_names = merged.get("scientific_name") or []
    image = merged.get("default_image") or {}
    hardiness = merged.get("hardiness")

    return {
        "id": str(merged["id"]),
        "commonName": merged.get("common_name") or (scientific_names[0] if scientific_names else "Unknown plant"),
        "latinName": scientific_names[0] if scientific_names else "",
        "imageUrl": image.get("regular_url") or image.get("medium_url") or image.get("thumbnail") or "",
        "sunlight": _normalize_sunlight(merged.get("sunlight")),
        "soilTypes": merged.get("soil", []) or [],
        "zones": _format_zones(hardiness),
        "native": False,
        "flowering": bool(merged.get("flowers", False)),
        "edible": bool(merged.get("edible_fruit") or merged.get("edible_leaf") or merged.get("edible", False)),
        "description": merged.get("description") or "",
        "water": (merged.get("watering") or "Unknown"),
        "matureSize": _format_mature_size(merged.get("dimension")),
        "bloomSeason": merged.get("flowering_season") or "Unknown",
        "tags": [t for t in [merged.get("cycle")] if t],
    }


def get_plant_details(plant_id: str) -> dict:
    data = _get(f"/species/details/{plant_id}", {})
    return normalize_plant(data, data)


def search_plants(sunlight: list[str] | None = None, edible: bool | None = None, zone: str | None = None, page_limit: int = 1) -> list[dict]:
    """Search Perenual, narrowing server-side on what it supports and
    (when a zone is given) enforcing an inclusive hardiness-range match
    client-side, since Perenual's own filter does not do that.
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
    for species in results:
        details = get_plant_details(str(species["id"]))
        plant_zones = details.get("zones", "Unknown")
        if plant_zones == "Unknown":
            continue
        low, high = plant_zones.split("–")
        if int(low) <= zone_number <= int(high):
            matches.append(details)
    return matches
