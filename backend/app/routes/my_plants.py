from __future__ import annotations

from datetime import date

from flask import Blueprint, jsonify, session

from app.extensions import db
from app.models import PlantTag, Planting, User

my_plants_bp = Blueprint("my_plants", __name__, url_prefix="/api/my-plants")

# Display order. "growing" comes from plantings; the rest are stored as plant_tags rows.
STATUSES = ("growing", "has_seeds", "want", "extra_plant", "extra_seeds")
TAGS = STATUSES[1:]
MAX_PLANT_ID_LENGTH = 120


def _signed_in_user_id() -> int | None:
    user_id = session.get("user_id")
    if user_id and db.session.get(User, user_id) is not None:
        return user_id
    return None


def _not_signed_in():
    return jsonify({"error": "not signed in"}), 401


def _statuses_for_plant(user_id: int, plant_id: str) -> list[str]:
    found = {
        row.tag
        for row in PlantTag.query.filter_by(user_id=user_id, plant_id=plant_id)
    }
    if Planting.query.filter_by(user_id=user_id, plant_id=plant_id, removed_on=None).first():
        found.add("growing")
    return [status for status in STATUSES if status in found]


@my_plants_bp.get("")
def my_plants():
    """Every plant the user has a status on: {"plants": {plant_id: ["growing", "want", ...]}}.

    The built-in lists (Growing, Have seeds, Want, Have extra) are computed from this,
    so a plant moves between them just by changing its status.
    """
    user_id = _signed_in_user_id()
    if user_id is None:
        return _not_signed_in()

    found: dict[str, set[str]] = {}
    for row in PlantTag.query.filter_by(user_id=user_id):
        found.setdefault(row.plant_id, set()).add(row.tag)
    for row in Planting.query.filter_by(user_id=user_id, removed_on=None):
        found.setdefault(row.plant_id, set()).add("growing")

    return jsonify(
        {"plants": {pid: [s for s in STATUSES if s in have] for pid, have in found.items()}}
    )


def _validated(plant_id: str, status: str):
    if status not in STATUSES:
        return jsonify({"error": f"Unknown status {status!r}; use one of: {', '.join(STATUSES)}"}), 400
    if not plant_id or len(plant_id) > MAX_PLANT_ID_LENGTH:
        return jsonify({"error": "Invalid plant id"}), 400
    return None


@my_plants_bp.put("/<plant_id>/<status>")
def set_status(plant_id: str, status: str):
    """Turn a status on for a plant (idempotent). Growing starts a planting with an unknown date."""
    user_id = _signed_in_user_id()
    if user_id is None:
        return _not_signed_in()
    invalid = _validated(plant_id, status)
    if invalid:
        return invalid

    if status == "growing":
        active = Planting.query.filter_by(user_id=user_id, plant_id=plant_id, removed_on=None).first()
        if active is None:
            db.session.add(Planting(user_id=user_id, plant_id=plant_id))
    elif not PlantTag.query.filter_by(user_id=user_id, plant_id=plant_id, tag=status).first():
        db.session.add(PlantTag(user_id=user_id, plant_id=plant_id, tag=status))
    db.session.commit()

    return jsonify({"plantId": plant_id, "statuses": _statuses_for_plant(user_id, plant_id)})


@my_plants_bp.delete("/<plant_id>/<status>")
def clear_status(plant_id: str, status: str):
    """Turn a status off (idempotent). Growing ends the active plantings but keeps them as history."""
    user_id = _signed_in_user_id()
    if user_id is None:
        return _not_signed_in()
    invalid = _validated(plant_id, status)
    if invalid:
        return invalid

    if status == "growing":
        for planting in Planting.query.filter_by(user_id=user_id, plant_id=plant_id, removed_on=None):
            planting.removed_on = date.today()
    else:
        PlantTag.query.filter_by(user_id=user_id, plant_id=plant_id, tag=status).delete()
    db.session.commit()

    return jsonify({"plantId": plant_id, "statuses": _statuses_for_plant(user_id, plant_id)})
