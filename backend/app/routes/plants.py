from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request

from app import cleared_client
from app.cleared_client import ClearedDataError, PlantNotFoundError
from app.perenual_client import PerenualError, get_plant_details, search_plants

plants_bp = Blueprint("plants", __name__, url_prefix="/api/plants")

VALID_SOURCES = ("cleared", "mock", "perenual")
MAX_IDS = 500  # plants fetched by id at once (the cleared source only)


class InvalidSource(ValueError):
    pass


def _requested_source() -> str | None:
    """Which plant data source this request wants, or None for the original default.

    Order: `?source=` (cleared | mock | perenual), then the older `?mock=true|false`
    that the frontend's test-mode toggle sent (true = mock, false = perenual), then
    the server's PLANT_DATA_SOURCE setting. None means MOCK_PERENUAL decides, as before.
    """
    raw = request.args.get("source")
    if raw is not None:
        raw = raw.lower()
        if raw not in VALID_SOURCES:
            raise InvalidSource(f"Unknown source {raw!r}; use one of: {', '.join(VALID_SOURCES)}")
        return raw
    legacy = request.args.get("mock")
    if legacy is not None:
        return "mock" if legacy.lower() in ("1", "true", "yes") else "perenual"
    configured = current_app.config.get("PLANT_DATA_SOURCE") or None
    if configured is not None and configured not in VALID_SOURCES:
        raise InvalidSource(f"PLANT_DATA_SOURCE {configured!r} is not one of: {', '.join(VALID_SOURCES)}")
    return configured


def _mock_override(source: str | None) -> bool | None:
    """The `mock` argument the Perenual client takes: True, False, or None (use MOCK_PERENUAL)."""
    return {"mock": True, "perenual": False}.get(source)


@plants_bp.errorhandler(InvalidSource)
def _invalid_source(exc: InvalidSource):
    return jsonify({"error": str(exc)}), 400


@plants_bp.get("")
def list_plants():
    sunlight = request.args.getlist("sunlight")
    edible = request.args.get("edible", "").lower() in ("1", "true", "yes")
    zone = request.args.get("zone") or None
    query = request.args.get("q", "").strip() or None
    native = request.args.get("native", "").lower() in ("1", "true", "yes")
    region = request.args.get("region") or None
    raw_ids = request.args.get("ids")
    ids = [i for i in raw_ids.split(",") if i][:MAX_IDS] if raw_ids is not None else None
    source = _requested_source()

    try:
        if source == "cleared":
            # Name search happens here for the cleared data. The other sources do not
            # take `q`; the frontend still filters those by name in the browser.
            plants = cleared_client.search_plants(
                sunlight=sunlight or None,
                edible=edible or None,
                zone=zone,
                query=query,
                native=native or None,
                region=region,
                ids=ids,
            )
        else:
            plants = search_plants(
                sunlight=sunlight or None, edible=edible or None, zone=zone, mock=_mock_override(source)
            )
    except (PerenualError, ClearedDataError) as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify(plants)


@plants_bp.get("/<plant_id>")
def get_plant(plant_id: str):
    source = _requested_source()

    try:
        if source == "cleared":
            plant = cleared_client.get_plant_details(plant_id, region=request.args.get("region") or None)
        else:
            plant = get_plant_details(plant_id, mock=_mock_override(source))
    except PlantNotFoundError as exc:
        return jsonify({"error": str(exc)}), 404
    except (PerenualError, ClearedDataError) as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify(plant)
