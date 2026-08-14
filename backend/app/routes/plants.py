from flask import Blueprint, jsonify, request

from app.perenual_client import PerenualError, get_plant_details, search_plants

plants_bp = Blueprint("plants", __name__, url_prefix="/api/plants")


@plants_bp.get("")
def list_plants():
    sunlight = request.args.getlist("sunlight")
    edible = request.args.get("edible", "").lower() in ("1", "true", "yes")
    zone = request.args.get("zone") or None

    try:
        plants = search_plants(sunlight=sunlight or None, edible=edible or None, zone=zone)
    except PerenualError as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify(plants)


@plants_bp.get("/<plant_id>")
def get_plant(plant_id: str):
    try:
        plant = get_plant_details(plant_id)
    except PerenualError as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify(plant)
