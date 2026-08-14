from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import PlantList, SavedPlant

lists_bp = Blueprint("lists", __name__, url_prefix="/api/lists")


@lists_bp.get("")
def get_lists():
    lists = PlantList.query.all()
    return jsonify([lst.to_dict() for lst in lists])


@lists_bp.post("")
def create_list():
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    plant_list = PlantList(name=name, emoji=payload.get("emoji", "\U0001F33F"))
    db.session.add(plant_list)
    db.session.commit()
    return jsonify(plant_list.to_dict()), 201


@lists_bp.delete("/<int:list_id>")
def delete_list(list_id: int):
    plant_list = PlantList.query.get_or_404(list_id)
    db.session.delete(plant_list)
    db.session.commit()
    return "", 204


@lists_bp.post("/<int:list_id>/plants")
def add_plant_to_list(list_id: int):
    PlantList.query.get_or_404(list_id)
    payload = request.get_json(silent=True) or {}
    plant_id = payload.get("plantId")
    if not plant_id:
        return jsonify({"error": "plantId is required"}), 400

    existing = SavedPlant.query.filter_by(list_id=list_id, plant_id=plant_id).first()
    if not existing:
        db.session.add(SavedPlant(list_id=list_id, plant_id=plant_id))
        db.session.commit()

    plant_list = db.session.get(PlantList, list_id)
    return jsonify(plant_list.to_dict()), 201


@lists_bp.delete("/<int:list_id>/plants/<plant_id>")
def remove_plant_from_list(list_id: int, plant_id: str):
    saved = SavedPlant.query.filter_by(list_id=list_id, plant_id=plant_id).first()
    if saved:
        db.session.delete(saved)
        db.session.commit()

    plant_list = PlantList.query.get_or_404(list_id)
    return jsonify(plant_list.to_dict())
