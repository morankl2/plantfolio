from __future__ import annotations

from flask import Blueprint, jsonify

from app import cleared_client
from app.cleared_client import ClearedDataError

regions_bp = Blueprint("regions", __name__, url_prefix="/api/regions")


@regions_bp.get("/zip/<zip_code>")
def lookup_zip(zip_code: str):
    """Region and county for a ZIP code, from the cleared plant data (cleared source only)."""
    try:
        found = cleared_client.lookup_zip(zip_code)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except ClearedDataError as exc:
        return jsonify({"error": str(exc)}), 502

    if found is None:
        return jsonify({"error": "That ZIP code was not found. Check it and try again."}), 404
    return jsonify(found)
